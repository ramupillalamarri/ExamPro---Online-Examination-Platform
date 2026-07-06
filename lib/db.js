import { Pool } from 'pg';

const dbConfig = {
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'online_exam_final',
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '5432'),
};

let pool = null;
let dbInitialized = false;
let initializationPromise = null;

export function getPool() {
  if (!pool) {
    if (process.env.DATABASE_URL) {
      pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
      });
    } else {
      if (!dbConfig.password) {
        throw new Error('DB_PASSWORD environment variable is required. Please set it before running the application.');
      }
      pool = new Pool(dbConfig);
    }
  }
  return pool;
}

export async function query(text, params) {
  if (!dbInitialized) {
    if (!initializationPromise) {
      initializationPromise = (async () => {
        try {
          await initializeDatabase();
          dbInitialized = true;
        } catch (e) {
          console.error('Failed to auto-initialize database on query execution:', e);
          initializationPromise = null; // Let future requests retry if it failed
          throw e;
        }
      })();
    }
    await initializationPromise;
  }
  const activePool = getPool();
  return activePool.query(text, params);
}

export async function initializeDatabase() {
  // First, verify/create the database
  const tempPool = new Pool({
    ...dbConfig,
    database: 'postgres', // Connect to default postgres DB first to create database if missing
  });

  try {
    const res = await tempPool.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [dbConfig.database]
    );

    if (res.rowCount === 0) {
      console.log(`Database '${dbConfig.database}' does not exist. Creating it now...`);
      // CREATE DATABASE cannot run inside a transaction block or with parameterized variables directly in some pg clients, so we interpolate securely (we control the value)
      await tempPool.query(`CREATE DATABASE ${dbConfig.database}`);
      console.log(`Database '${dbConfig.database}' created successfully.`);
    }
  } catch (error) {
    console.error('Error checking/creating database:', error);
  } finally {
    await tempPool.end();
  }

  // Now, connect to target database and create tables
  const targetPool = new Pool(dbConfig);

  try {
    console.log('Initializing database tables...');

    // 1. Users table
    await targetPool.query(`
      CREATE TABLE IF NOT EXISTS users (
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
      );
    `);

    // Alter table to add columns for existing users table
    await targetPool.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS age INTEGER;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_number VARCHAR(50);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS address TEXT;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS college VARCHAR(255);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS major VARCHAR(255);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS graduation_year INTEGER;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;
    `);

    // 2. Folders table
    await targetPool.query(`
      CREATE TABLE IF NOT EXISTS folders (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        parent_id VARCHAR(255) REFERENCES folders(id) ON DELETE CASCADE,
        created_by VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 3. Exams table
    await targetPool.query(`
      CREATE TABLE IF NOT EXISTS exams (
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
      );
    `);

    // 4. Questions table
    await targetPool.query(`
      CREATE TABLE IF NOT EXISTS questions (
        id VARCHAR(255) PRIMARY KEY,
        exam_id VARCHAR(255) REFERENCES exams(id) ON DELETE CASCADE,
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
      );
    `);

    // Ensure questions table has correct columns and properties for backward compatibility
    await targetPool.query(`
      ALTER TABLE questions ADD COLUMN IF NOT EXISTS negative_marking NUMERIC DEFAULT 0;
    `);
    await targetPool.query(`
      ALTER TABLE questions ADD COLUMN IF NOT EXISTS question_image TEXT;
    `);
    await targetPool.query(`
      ALTER TABLE questions ADD COLUMN IF NOT EXISTS question_type VARCHAR(50) DEFAULT 'mcq';
    `);
    await targetPool.query(`
      ALTER TABLE questions ALTER COLUMN question_text DROP NOT NULL;
    `);

    // 5. Attempts table
    await targetPool.query(`
      CREATE TABLE IF NOT EXISTS attempts (
        id VARCHAR(255) PRIMARY KEY,
        exam_id VARCHAR(255) REFERENCES exams(id) ON DELETE CASCADE,
        user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
        status VARCHAR(50) NOT NULL DEFAULT 'in_progress',
        started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        submitted_at TIMESTAMP WITH TIME ZONE,
        score NUMERIC DEFAULT 0,
        total_marks INTEGER DEFAULT 0,
        rank INTEGER,
        warnings INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 6. Answers table
    await targetPool.query(`
      CREATE TABLE IF NOT EXISTS answers (
        id VARCHAR(255) PRIMARY KEY,
        attempt_id VARCHAR(255) REFERENCES attempts(id) ON DELETE CASCADE,
        question_id VARCHAR(255) REFERENCES questions(id) ON DELETE CASCADE,
        selected_option_id VARCHAR(50),
        descriptive_answer TEXT,
        is_correct BOOLEAN,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT unique_attempt_question UNIQUE (attempt_id, question_id)
      );
    `);

    // Ensure answers table has correct columns for backward compatibility
    await targetPool.query(`
      ALTER TABLE answers ADD COLUMN IF NOT EXISTS descriptive_answer TEXT;
    `);

    // 7. AI Feedback table
    await targetPool.query(`
      CREATE TABLE IF NOT EXISTS ai_feedback (
        id VARCHAR(255) PRIMARY KEY,
        attempt_id VARCHAR(255) REFERENCES attempts(id) ON DELETE CASCADE,
        mistake_analysis JSONB NOT NULL DEFAULT '[]'::jsonb,
        weak_topics JSONB NOT NULL DEFAULT '[]'::jsonb,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 8. User Access table (tracks which users have accessed other users' exams)
    await targetPool.query(`
      CREATE TABLE IF NOT EXISTS user_access (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
        accessed_user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
        user_code VARCHAR(6),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT unique_user_access UNIQUE (user_id, accessed_user_id)
      );
    `);

    console.log('Tables created or verified.');

    // Run migrations to add missing columns
    try {
      // Add user_code column to users table if it doesn't exist
      await targetPool.query(`
        ALTER TABLE users
        ADD COLUMN IF NOT EXISTS user_code VARCHAR(6) UNIQUE
      `);
      console.log('Verified user_code column in users table');
    } catch (err) {
      // Column might already exist or other issue, continue
      console.log('user_code column migration info:', err.message);
    }

    try {
      // Add max_attempts column to exams table if it doesn't exist
      await targetPool.query(`
        ALTER TABLE exams
        ADD COLUMN IF NOT EXISTS max_attempts INTEGER DEFAULT 1
      `);
      // Update any existing exams to have max_attempts = 1 to enforce attempt-once rule
      await targetPool.query(`
        UPDATE exams SET max_attempts = 1 WHERE max_attempts IS NULL OR max_attempts > 1
      `);
      console.log('Verified max_attempts column and updated all exams to 1 max attempt in database.');
    } catch (err) {
      // Column might already exist or other issue, continue
      console.log('max_attempts column migration info:', err.message);
    }

    try {
      // Add parent_id column to folders table if it doesn't exist
      await targetPool.query(`
        ALTER TABLE folders
        ADD COLUMN IF NOT EXISTS parent_id VARCHAR(255) REFERENCES folders(id) ON DELETE CASCADE
      `);
      console.log('Verified parent_id column in folders table');
    } catch (err) {
      console.log('parent_id column migration info:', err.message);
    }

    try {
      // Add user_access table if it doesn't exist (already created above, but double check)
      const checkUserAccess = await targetPool.query(`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.tables 
          WHERE table_name = 'user_access'
        )
      `);
      if (!checkUserAccess.rows[0].exists) {
        await targetPool.query(`
          CREATE TABLE user_access (
            id VARCHAR(255) PRIMARY KEY,
            user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
            accessed_user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
            user_code VARCHAR(6),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT unique_user_access UNIQUE (user_id, accessed_user_id)
          )
        `);
        console.log('Created user_access table');
      }
    } catch (err) {
      console.log('user_access table migration info:', err.message);
    }

    try {
      await targetPool.query(`
        ALTER TABLE questions DROP CONSTRAINT IF EXISTS questions_exam_id_fkey;
        ALTER TABLE attempts DROP CONSTRAINT IF EXISTS attempts_exam_id_fkey;
      `);
      console.log('Verified dropped foreign key constraints on questions and attempts.');
    } catch (err) {
      console.log('Drop constraint info:', err.message);
    }

    console.log('All migrations completed.');

    // Update existing seeded teacher's code to 455770 if it is currently 123456
    try {
      await targetPool.query(`
        UPDATE users 
        SET user_code = '455770' 
        WHERE email = 'ramupillalamarri66@gmail.com' AND user_code = '123456'
      `);
      console.log('Migrated teacher code to 455770');
    } catch (e) {
      console.log('Teacher code migration info:', e.message);
    }

    // Seed mock data if tables are empty
    const checkUsers = await targetPool.query('SELECT COUNT(*) FROM users');
    if (parseInt(checkUsers.rows[0].count) === 0) {
      console.log('Seeding initial mock data into PostgreSQL...');

      // Seed Users
      await targetPool.query(`
        INSERT INTO users (id, email, full_name, user_code, role) VALUES
        ('admin-1', 'ramupillalamarri66@gmail.com', 'Ramu Pillalamarri', '455770', 'admin'),
        ('student-1', 'student@exampro.com', 'John Student', '654321', 'student')
        ON CONFLICT DO NOTHING;
      `);

      // Ensure teacher tables for 455770 exist
      const safeCode = '455770';
      await targetPool.query(`
        CREATE TABLE IF NOT EXISTS folders_${safeCode} (
          id VARCHAR(255) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          parent_id VARCHAR(255) REFERENCES folders_${safeCode}(id) ON DELETE CASCADE,
          created_by VARCHAR(255),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);
      await targetPool.query(`
        CREATE TABLE IF NOT EXISTS exams_${safeCode} (
          id VARCHAR(255) PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          description TEXT,
          duration_minutes INTEGER NOT NULL DEFAULT 60,
          max_attempts INTEGER DEFAULT 1,
          folder_id VARCHAR(255) REFERENCES folders_${safeCode}(id) ON DELETE SET NULL,
          is_published BOOLEAN DEFAULT FALSE,
          negative_marking NUMERIC DEFAULT 0,
          created_by VARCHAR(255),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);

    }
  } catch (error) {
    console.error('Error initializing database tables:', error);
    throw error;
  } finally {
    await targetPool.end();
  }
}

export async function ensureTeacherTables(userCode) {
  if (!userCode) return;
  const safeCode = userCode.replace(/[^a-zA-Z0-9_]/g, '');
  
  await query(`
    CREATE TABLE IF NOT EXISTS folders_${safeCode} (
      id VARCHAR(255) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      parent_id VARCHAR(255) REFERENCES folders_${safeCode}(id) ON DELETE CASCADE,
      created_by VARCHAR(255),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `);

  try {
    // Migration to add parent_id to dynamic folders table if it exists but is missing parent_id
    await query(`
      ALTER TABLE folders_${safeCode}
      ADD COLUMN IF NOT EXISTS parent_id VARCHAR(255) REFERENCES folders_${safeCode}(id) ON DELETE CASCADE
    `);
  } catch (err) {
    console.log(`parent_id migration for folders_${safeCode} info:`, err.message);
  }
  
  await query(`
    CREATE TABLE IF NOT EXISTS exams_${safeCode} (
      id VARCHAR(255) PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      duration_minutes INTEGER NOT NULL DEFAULT 60,
      max_attempts INTEGER DEFAULT 1,
      folder_id VARCHAR(255) REFERENCES folders_${safeCode}(id) ON DELETE SET NULL,
      is_published BOOLEAN DEFAULT FALSE,
      negative_marking NUMERIC DEFAULT 0,
      created_by VARCHAR(255),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

export async function getExamById(examId) {
  try {
    const tablesRes = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name LIKE 'exams\\_%' AND table_schema = 'public'
    `);
    
    for (const row of tablesRes.rows) {
      const tableName = row.table_name;
      const examRes = await query('SELECT * FROM ' + tableName + ' WHERE id = $1', [examId]);
      if (examRes.rowCount > 0) {
        const userCode = tableName.substring(6);
        return { exam: examRes.rows[0], userCode };
      }
    }
  } catch (err) {
    console.error('getExamById error:', err);
  }
  return null;
}
