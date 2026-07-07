const { Pool } = require('pg');
const fs = require('fs');

// Verify target URL is provided
const targetUrl = process.argv[2];

if (!targetUrl) {
  console.error('Error: Please provide your target cloud DATABASE_URL as an argument.');
  console.error('Usage: node scratch/migrate_to_cloud.js "your_postgresql_connection_string"');
  process.exit(1);
}

// Manually parse .env.local
const env = {};
try {
  if (fs.existsSync('.env.local')) {
    const envFile = fs.readFileSync('.env.local', 'utf8');
    envFile.split(/\r?\n/).forEach(line => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      const index = trimmed.indexOf('=');
      if (index === -1) return;
      const key = trimmed.substring(0, index).trim();
      let val = trimmed.substring(index + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.substring(1, val.length - 1);
      }
      env[key] = val;
    });
  }
} catch (e) {
  console.log('No .env.local file found, reading from process environment.');
}

const localConfig = {
  user: env.DB_USER || process.env.DB_USER || 'postgres',
  host: env.DB_HOST || process.env.DB_HOST || 'localhost',
  database: env.DB_NAME || process.env.DB_NAME || 'online_exam_final',
  password: env.DB_PASSWORD || process.env.DB_PASSWORD,
  port: parseInt(env.DB_PORT || process.env.DB_PORT || '5432'),
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
    // 1. Fetch all local tables
    console.log('Scanning local tables...');
    const tablesRes = await localPool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    const tables = tablesRes.rows.map(r => r.table_name);
    console.log('Found tables to migrate:', tables);

    // 2. Initialize core schemas on remote
    console.log('Initializing core schemas on remote...');
    const schemas = [
      `CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        full_name VARCHAR(255),
        avatar_url VARCHAR(255),
        user_code VARCHAR(6) UNIQUE,
        role VARCHAR(50),
        age INTEGER,
        phone_number VARCHAR(50),
        address TEXT,
        college VARCHAR(255),
        major VARCHAR(255),
        graduation_year INTEGER,
        bio TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS folders (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        parent_id VARCHAR(255) REFERENCES folders(id) ON DELETE CASCADE,
        created_by VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS exams (
        id VARCHAR(255) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        duration_minutes INTEGER NOT NULL DEFAULT 60,
        max_attempts INTEGER DEFAULT 1,
        folder_id VARCHAR(255) REFERENCES folders(id) ON DELETE SET NULL,
        is_published BOOLEAN DEFAULT FALSE,
        negative_marking NUMERIC DEFAULT 0,
        created_by VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS questions (
        id VARCHAR(255) PRIMARY KEY,
        exam_id VARCHAR(255),
        question_text TEXT,
        options JSONB NOT NULL,
        correct_option_id VARCHAR(50) NOT NULL,
        subject VARCHAR(255),
        topic VARCHAR(255),
        marks INTEGER DEFAULT 2,
        negative_marking NUMERIC DEFAULT 0,
        order_index INTEGER DEFAULT 0,
        question_image TEXT,
        question_type VARCHAR(50) DEFAULT 'mcq',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS attempts (
        id VARCHAR(255) PRIMARY KEY,
        exam_id VARCHAR(255),
        user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
        status VARCHAR(50) NOT NULL DEFAULT 'in_progress',
        started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        submitted_at TIMESTAMP WITH TIME ZONE,
        score NUMERIC DEFAULT 0,
        total_marks INTEGER DEFAULT 0,
        rank INTEGER,
        warnings INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS answers (
        id VARCHAR(255) PRIMARY KEY,
        attempt_id VARCHAR(255) REFERENCES attempts(id) ON DELETE CASCADE,
        question_id VARCHAR(255) REFERENCES questions(id) ON DELETE CASCADE,
        selected_option_id VARCHAR(50),
        descriptive_answer TEXT,
        is_correct BOOLEAN,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT unique_attempt_question UNIQUE (attempt_id, question_id)
      )`,
      `CREATE TABLE IF NOT EXISTS ai_feedback (
        id VARCHAR(255) PRIMARY KEY,
        attempt_id VARCHAR(255) REFERENCES attempts(id) ON DELETE CASCADE,
        mistake_analysis JSONB NOT NULL DEFAULT '[]'::jsonb,
        weak_topics JSONB NOT NULL DEFAULT '[]'::jsonb,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS user_access (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
        accessed_user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
        user_code VARCHAR(6),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT unique_user_access UNIQUE (user_id, accessed_user_id)
      )`
    ];

    for (const schema of schemas) {
      await remotePool.query(schema);
    }
    console.log('Core tables initialized successfully.');

    // Disable constraints temporarily on remote to allow clean inserts
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
