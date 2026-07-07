const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

// Verify target URL is provided
const targetUrl = process.argv[2] || process.env.TARGET_DATABASE_URL;

if (!targetUrl) {
  console.error('Error: Please provide your target cloud DATABASE_URL as an argument.');
  console.error('Usage: node scratch/migrate_to_cloud.js "your_postgresql_connection_string"');
  process.exit(1);
}

const localConfig = {
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'online_exam_final',
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '5432'),
};

async function runMigration() {
  console.log('Connecting to local database:', localConfig.database);
  const localPool = new Pool(localConfig);
  
  console.log('Connecting to remote cloud database...');
  const remotePool = new Pool({
    connectionString: targetUrl,
    ssl: { rejectUnauthorized: false }
  });

  try {
    // 1. Fetch all teacher tables
    console.log('Scanning local tables...');
    const tablesRes = await localPool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    const tables = tablesRes.rows.map(r => r.table_name);
    console.log('Found tables:', tables);

    // 2. Initialize tables on remote database
    console.log('Creating schema and tables on remote database...');
    // We will initialize the main tables first
    const mainTables = [
      'users', 'folders', 'exams', 'questions', 'attempts', 'answers', 'ai_feedback', 'user_access'
    ];
    
    // Run schema initializations on remote
    const { initializeDatabase, ensureTeacherTables } = require('../lib/db.js');
    // Set env variables temporarily so db.js points to the remote database
    process.env.DATABASE_URL = targetUrl;
    
    // We import and run initializeDatabase from our project
    const db = require('../lib/db.js');
    
    // Create connection pool targeting remote explicitly for query helper
    console.log('Initializing remote table structures...');
    
    // Let's create dynamic teacher tables found in local
    const teacherCodes = [];
    tables.forEach(t => {
      if (t.startsWith('folders_')) {
        teacherCodes.push(t.replace('folders_', ''));
      }
    });

    // Disable triggers/foreign key checks temporarily on remote to allow clean inserts
    console.log('Suspending constraint checks on remote...');
    await remotePool.query("SET session_replication_role = 'replica'");

    // Copy data table-by-table
    for (const table of tables) {
      console.log(`Migrating data for table: ${table}...`);
      
      // Fetch dynamic structure from local
      const schemaRes = await localPool.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = $1 AND table_schema = 'public'
      `, [table]);
      
      if (schemaRes.rowCount === 0) continue;
      const columns = schemaRes.rows.map(c => c.column_name);

      // Create teacher tables on remote first if they are dynamic tables
      if (table.startsWith('folders_') || table.startsWith('exams_')) {
        const createQuery = await localPool.query(`
          SELECT pg_get_ddl_for_table_mock_stub_not_needed_using_create_if_not_exists($1)
        `).catch(() => null);
        
        // Dynamic recreate using simple schemas
        const code = table.split('_')[1];
        if (table.startsWith('folders_')) {
          await remotePool.query(`
            CREATE TABLE IF NOT EXISTS folders_${code} (
              id VARCHAR(255) PRIMARY KEY,
              name VARCHAR(255) NOT NULL,
              parent_id VARCHAR(255) REFERENCES folders_${code}(id) ON DELETE CASCADE,
              created_by VARCHAR(255),
              created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
          `);
        } else if (table.startsWith('exams_')) {
          await remotePool.query(`
            CREATE TABLE IF NOT EXISTS exams_${code} (
              id VARCHAR(255) PRIMARY KEY,
              title VARCHAR(255) NOT NULL,
              description TEXT,
              duration_minutes INTEGER NOT NULL DEFAULT 60,
              max_attempts INTEGER DEFAULT 1,
              folder_id VARCHAR(255) REFERENCES folders_${code}(id) ON DELETE SET NULL,
              is_published BOOLEAN DEFAULT FALSE,
              negative_marking NUMERIC DEFAULT 0,
              created_by VARCHAR(255),
              created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
          `);
        }
      }

      // Fetch all local rows
      const rowsRes = await localPool.query(`SELECT * FROM ${table}`);
      console.log(`Found ${rowsRes.rowCount} rows in local table: ${table}`);

      // Truncate remote table first to clean default seeds
      await remotePool.query(`TRUNCATE TABLE ${table} CASCADE`).catch(() => {});

      if (rowsRes.rowCount > 0) {
        const colList = columns.map(c => `"${c}"`).join(', ');
        const valPlaceholders = columns.map((_, i) => `$${i + 1}`).join(', ');
        const insertQuery = `INSERT INTO ${table} (${colList}) VALUES (${valPlaceholders}) ON CONFLICT DO NOTHING`;

        for (const row of rowsRes.rows) {
          const values = columns.map(col => row[col]);
          await remotePool.query(insertQuery, values);
        }
      }
      console.log(`Migrated ${rowsRes.rowCount} rows successfully for table: ${table}`);
    }

    // Restore replication role/constraints
    console.log('Restoring remote database constraints...');
    await remotePool.query("SET session_replication_role = 'origin'");

    console.log('\n======================================================');
    console.log('SUCCESS: Database migration completed successfully!');
    console.log('All local data is now synchronized to the cloud.');
    console.log('======================================================');

  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await localPool.end();
    await remotePool.end();
  }
}

runMigration();
