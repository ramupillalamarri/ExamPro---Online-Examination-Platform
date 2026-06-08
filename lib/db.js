import { Pool } from 'pg';

const dbConfig = {
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'online_exam_final',
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '5432'),
};

if (!dbConfig.password) {
  throw new Error('DB_PASSWORD environment variable is required. Please set it before running the application.');
}

let pool = null;

export function getPool() {
  if (!pool) {
    pool = new Pool(dbConfig);
  }
  return pool;
}

export async function query(text, params) {
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
        question_text TEXT NOT NULL,
        options JSONB NOT NULL,
        correct_option_id VARCHAR(50) NOT NULL,
        subject VARCHAR(255),
        topic VARCHAR(255),
        marks INTEGER DEFAULT 2,
        negative_marking NUMERIC DEFAULT 0,
        order_index INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Ensure questions table has negative_marking column for backward compatibility
    await targetPool.query(`
      ALTER TABLE questions ADD COLUMN IF NOT EXISTS negative_marking NUMERIC DEFAULT 0;
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
        is_correct BOOLEAN,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT unique_attempt_question UNIQUE (attempt_id, question_id)
      );
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

      // Seed Folders
      await targetPool.query(`
        INSERT INTO folders_${safeCode} (id, name, created_by, created_at) VALUES
        ('folder-1', 'Mathematics', 'admin-1', '2024-01-15T00:00:00Z'),
        ('folder-2', 'Physics', 'admin-1', '2024-01-16T00:00:00Z'),
        ('folder-3', 'Chemistry', 'admin-1', '2024-01-17T00:00:00Z')
        ON CONFLICT DO NOTHING;
      `);

      // Seed Exams
      await targetPool.query(`
        INSERT INTO exams_${safeCode} (id, title, description, duration_minutes, folder_id, is_published, negative_marking, created_by, created_at, updated_at) VALUES
        ('exam-1', 'Algebra Fundamentals', 'Test your knowledge of basic algebraic concepts including equations, inequalities, and functions.', 45, 'folder-1', true, 0.25, 'admin-1', '2024-02-01T00:00:00Z', '2024-02-01T00:00:00Z'),
        ('exam-2', 'Calculus Basics', 'Introduction to differential and integral calculus concepts.', 60, 'folder-1', true, 0, 'admin-1', '2024-02-05T00:00:00Z', '2024-02-05T00:00:00Z'),
        ('exam-3', 'Classical Mechanics', 'Newton''s laws, motion, and forces.', 50, 'folder-2', true, 0.25, 'admin-1', '2024-02-10T00:00:00Z', '2024-02-10T00:00:00Z'),
        ('exam-4', 'Organic Chemistry Intro', 'Basic concepts of organic chemistry including hydrocarbons and functional groups.', 40, 'folder-3', false, 0, 'admin-1', '2024-02-15T00:00:00Z', '2024-02-15T00:00:00Z')
        ON CONFLICT DO NOTHING;
      `);

      // Seed Questions
      const mockQuestions = [
        {
          id: 'q-1',
          exam_id: 'exam-1',
          question_text: 'Solve for x: 2x + 5 = 13',
          options: JSON.stringify([
            { id: 'a', text: 'x = 3' },
            { id: 'b', text: 'x = 4' },
            { id: 'c', text: 'x = 5' },
            { id: 'd', text: 'x = 6' },
          ]),
          correct_option_id: 'b',
          subject: 'Mathematics',
          topic: 'Linear Equations',
          marks: 2,
          order_index: 0,
        },
        {
          id: 'q-2',
          exam_id: 'exam-1',
          question_text: 'Which of the following is a quadratic equation?',
          options: JSON.stringify([
            { id: 'a', text: '2x + 3 = 0' },
            { id: 'b', text: 'x² + 2x + 1 = 0' },
            { id: 'c', text: '3x = 9' },
            { id: 'd', text: 'x/2 = 4' },
          ]),
          correct_option_id: 'b',
          subject: 'Mathematics',
          topic: 'Quadratic Equations',
          marks: 2,
          order_index: 1,
        },
        {
          id: 'q-3',
          exam_id: 'exam-1',
          question_text: 'If f(x) = 3x - 2, what is f(4)?',
          options: JSON.stringify([
            { id: 'a', text: '8' },
            { id: 'b', text: '10' },
            { id: 'c', text: '12' },
            { id: 'd', text: '14' },
          ]),
          correct_option_id: 'b',
          subject: 'Mathematics',
          topic: 'Functions',
          marks: 2,
          order_index: 2,
        },
        {
          id: 'q-4',
          exam_id: 'exam-1',
          question_text: 'Simplify: (x + 2)(x - 2)',
          options: JSON.stringify([
            { id: 'a', text: 'x² - 4' },
            { id: 'b', text: 'x² + 4' },
            { id: 'c', text: 'x² - 2x + 4' },
            { id: 'd', text: '2x' },
          ]),
          correct_option_id: 'a',
          subject: 'Mathematics',
          topic: 'Algebraic Expressions',
          marks: 2,
          order_index: 3,
        },
        {
          id: 'q-5',
          exam_id: 'exam-1',
          question_text: 'Solve the inequality: 3x - 6 > 9',
          options: JSON.stringify([
            { id: 'a', text: 'x > 3' },
            { id: 'b', text: 'x > 5' },
            { id: 'c', text: 'x < 5' },
            { id: 'd', text: 'x > 1' },
          ]),
          correct_option_id: 'b',
          subject: 'Mathematics',
          topic: 'Inequalities',
          marks: 2,
          order_index: 4,
        },
        {
          id: 'q-6',
          exam_id: 'exam-2',
          question_text: 'What is the derivative of f(x) = x²?',
          options: JSON.stringify([
            { id: 'a', text: 'x' },
            { id: 'b', text: '2x' },
            { id: 'c', text: 'x²' },
            { id: 'd', text: '2' },
          ]),
          correct_option_id: 'b',
          subject: 'Mathematics',
          topic: 'Derivatives',
          marks: 2,
          order_index: 0,
        },
        {
          id: 'q-7',
          exam_id: 'exam-2',
          question_text: 'What is the integral of 2x dx?',
          options: JSON.stringify([
            { id: 'a', text: 'x² + C' },
            { id: 'b', text: '2x² + C' },
            { id: 'c', text: 'x + C' },
            { id: 'd', text: '2 + C' },
          ]),
          correct_option_id: 'a',
          subject: 'Mathematics',
          topic: 'Integrals',
          marks: 2,
          order_index: 1,
        },
        {
          id: 'q-8',
          exam_id: 'exam-2',
          question_text: 'What is lim(x→0) sin(x)/x?',
          options: JSON.stringify([
            { id: 'a', text: '0' },
            { id: 'b', text: '1' },
            { id: 'c', text: 'undefined' },
            { id: 'd', text: 'infinity' },
          ]),
          correct_option_id: 'b',
          subject: 'Mathematics',
          topic: 'Limits',
          marks: 2,
          order_index: 2,
        },
        {
          id: 'q-9',
          exam_id: 'exam-2',
          question_text: 'The derivative of e^x is:',
          options: JSON.stringify([
            { id: 'a', text: 'xe^(x-1)' },
            { id: 'b', text: 'e^x' },
            { id: 'c', text: 'e^(x+1)' },
            { id: 'd', text: '1/e^x' },
          ]),
          correct_option_id: 'b',
          subject: 'Mathematics',
          topic: 'Derivatives',
          marks: 2,
          order_index: 3,
        },
        {
          id: 'q-10',
          exam_id: 'exam-2',
          question_text: 'What is the derivative of ln(x)?',
          options: JSON.stringify([
            { id: 'a', text: '1/x' },
            { id: 'b', text: 'x' },
            { id: 'c', text: 'ln(x)/x' },
            { id: 'd', text: 'e^x' },
          ]),
          correct_option_id: 'a',
          subject: 'Mathematics',
          topic: 'Derivatives',
          marks: 2,
          order_index: 4,
        },
        {
          id: 'q-11',
          exam_id: 'exam-3',
          question_text: 'Newton\'s First Law is also known as:',
          options: JSON.stringify([
            { id: 'a', text: 'Law of Acceleration' },
            { id: 'b', text: 'Law of Inertia' },
            { id: 'c', text: 'Law of Action-Reaction' },
            { id: 'd', text: 'Law of Gravity' },
          ]),
          correct_option_id: 'b',
          subject: 'Physics',
          topic: "Newton's Laws",
          marks: 2,
          order_index: 0,
        },
        {
          id: 'q-12',
          exam_id: 'exam-3',
          question_text: 'The SI unit of force is:',
          options: JSON.stringify([
            { id: 'a', text: 'Joule' },
            { id: 'b', text: 'Watt' },
            { id: 'c', text: 'Newton' },
            { id: 'd', text: 'Pascal' },
          ]),
          correct_option_id: 'c',
          subject: 'Physics',
          topic: 'Force',
          marks: 2,
          order_index: 1,
        },
        {
          id: 'q-13',
          exam_id: 'exam-3',
          question_text: 'What is the formula for momentum?',
          options: JSON.stringify([
            { id: 'a', text: 'p = m/v' },
            { id: 'b', text: 'p = mv' },
            { id: 'c', text: 'p = m + v' },
            { id: 'd', text: 'p = v/m' },
          ]),
          correct_option_id: 'b',
          subject: 'Physics',
          topic: 'Momentum',
          marks: 2,
          order_index: 2,
        },
        {
          id: 'q-14',
          exam_id: 'exam-3',
          question_text: 'Acceleration due to gravity on Earth is approximately:',
          options: JSON.stringify([
            { id: 'a', text: '8.9 m/s²' },
            { id: 'b', text: '9.8 m/s²' },
            { id: 'c', text: '10.8 m/s²' },
            { id: 'd', text: '11.8 m/s²' },
          ]),
          correct_option_id: 'b',
          subject: 'Physics',
          topic: 'Gravity',
          marks: 2,
          order_index: 3,
        },
        {
          id: 'q-15',
          exam_id: 'exam-3',
          question_text: 'Work is calculated as:',
          options: JSON.stringify([
            { id: 'a', text: 'Force + Distance' },
            { id: 'b', text: 'Force - Distance' },
            { id: 'c', text: 'Force × Distance' },
            { id: 'd', text: 'Force / Distance' },
          ]),
          correct_option_id: 'c',
          subject: 'Physics',
          topic: 'Work and Energy',
          marks: 2,
          order_index: 4,
        },
        {
          id: 'q-16',
          exam_id: 'exam-4',
          question_text: 'What is the simplest hydrocarbon?',
          options: JSON.stringify([
            { id: 'a', text: 'Ethane' },
            { id: 'b', text: 'Methane' },
            { id: 'c', text: 'Propane' },
            { id: 'd', text: 'Butane' },
          ]),
          correct_option_id: 'b',
          subject: 'Chemistry',
          topic: 'Hydrocarbons',
          marks: 2,
          order_index: 0,
        },
        {
          id: 'q-17',
          exam_id: 'exam-4',
          question_text: 'The functional group -OH is called:',
          options: JSON.stringify([
            { id: 'a', text: 'Aldehyde' },
            { id: 'b', text: 'Ketone' },
            { id: 'c', text: 'Hydroxyl' },
            { id: 'd', text: 'Carboxyl' },
          ]),
          correct_option_id: 'c',
          subject: 'Chemistry',
          topic: 'Functional Groups',
          marks: 2,
          order_index: 1,
        },
        {
          id: 'q-18',
          exam_id: 'exam-4',
          question_text: 'Organic compounds primarily contain which element?',
          options: JSON.stringify([
            { id: 'a', text: 'Oxygen' },
            { id: 'b', text: 'Nitrogen' },
            { id: 'c', text: 'Carbon' },
            { id: 'd', text: 'Hydrogen' },
          ]),
          correct_option_id: 'c',
          subject: 'Chemistry',
          topic: 'Organic Chemistry Basics',
          marks: 2,
          order_index: 2,
        },
      ];

      for (const q of mockQuestions) {
        await targetPool.query(`
          INSERT INTO questions (id, exam_id, question_text, options, correct_option_id, subject, topic, marks, order_index)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          ON CONFLICT DO NOTHING;
        `, [q.id, q.exam_id, q.question_text, q.options, q.correct_option_id, q.subject, q.topic, q.marks, q.order_index]);
      }

      // Seed Attempts
      await targetPool.query(`
        INSERT INTO attempts (id, exam_id, user_id, status, started_at, submitted_at, score, total_marks, rank, warnings) VALUES
        ('attempt-1', 'exam-1', 'student-1', 'graded', '2024-03-01T10:00:00Z', '2024-03-01T10:35:00Z', 8, 10, 3, 0),
        ('attempt-2', 'exam-2', 'student-1', 'graded', '2024-03-05T14:00:00Z', '2024-03-05T14:50:00Z', 6, 10, 8, 1)
        ON CONFLICT DO NOTHING;
      `);

      // Seed Answers
      await targetPool.query(`
        INSERT INTO answers (id, attempt_id, question_id, selected_option_id, is_correct) VALUES
        ('ans-1', 'attempt-1', 'q-1', 'b', true),
        ('ans-2', 'attempt-1', 'q-2', 'b', true),
        ('ans-3', 'attempt-1', 'q-3', 'b', true),
        ('ans-4', 'attempt-1', 'q-4', 'a', true),
        ('ans-5', 'attempt-1', 'q-5', 'a', false),
        ('ans-6', 'attempt-2', 'q-6', 'b', true),
        ('ans-7', 'attempt-2', 'q-7', 'b', false),
        ('ans-8', 'attempt-2', 'q-8', 'b', true),
        ('ans-9', 'attempt-2', 'q-9', 'b', true),
        ('ans-10', 'attempt-2', 'q-10', 'b', false)
        ON CONFLICT DO NOTHING;
      `);

      // Seed AI Feedback
      await targetPool.query(`
        INSERT INTO ai_feedback (id, attempt_id, mistake_analysis, weak_topics) VALUES
        ('fb-1', 'attempt-1', '[{"questionId": "q-5", "explanation": "You selected \\"x > 3\\" but the correct answer is \\"x > 5\\". This question tests your understanding of Inequalities. Review the concept and practice similar problems."}]'::jsonb, '[{"topic": "Inequalities", "subject": "Mathematics", "questionCount": 1, "recommendation": "Focus on practicing more Inequalities problems to strengthen your understanding."}]'::jsonb),
        ('fb-2', 'attempt-2', '[{"questionId": "q-7", "explanation": "You selected \\"2x² + C\\" but the correct answer is \\"x² + C\\". This question tests your understanding of Integrals."}, {"questionId": "q-10", "explanation": "You selected \\"x\\" but the correct answer is \\"1/x\\". This question tests your understanding of Derivatives."}]'::jsonb, '[{"topic": "Integrals", "subject": "Mathematics", "questionCount": 1, "recommendation": "Focus on practicing more Integrals problems."}, {"topic": "Derivatives", "subject": "Mathematics", "questionCount": 1, "recommendation": "Focus on practicing more Derivatives problems."}]'::jsonb)
        ON CONFLICT DO NOTHING;
      `);

      console.log('Seeding completed successfully.');
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
