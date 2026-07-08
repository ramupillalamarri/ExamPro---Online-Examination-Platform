import { NextResponse } from 'next/server';
import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';

export async function GET(request) {
  // Simple check to secure this endpoint from public abuse
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');
  if (secret !== 'ramu_restore_2026') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const dumpPath = path.join(process.cwd(), 'scratch', 'local_dump.json');
  if (!fs.existsSync(dumpPath)) {
    return NextResponse.json({ error: 'Dump file not found on server' }, { status: 404 });
  }

  const dumpContent = fs.readFileSync(dumpPath, 'utf8');
  const dumpData = JSON.parse(dumpContent);

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('Initializing remote table schemas...');
    // Create core schemas first
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
      await pool.query(schema);
    }

    // Drop core foreign key constraints
    await pool.query(`ALTER TABLE folders DROP CONSTRAINT IF EXISTS folders_parent_id_fkey`).catch(() => {});
    await pool.query(`ALTER TABLE exams DROP CONSTRAINT IF EXISTS exams_folder_id_fkey`).catch(() => {});
    await pool.query(`ALTER TABLE attempts DROP CONSTRAINT IF EXISTS attempts_user_id_fkey`).catch(() => {});
    await pool.query(`ALTER TABLE answers DROP CONSTRAINT IF EXISTS answers_attempt_id_fkey`).catch(() => {});
    await pool.query(`ALTER TABLE answers DROP CONSTRAINT IF EXISTS answers_question_id_fkey`).catch(() => {});
    await pool.query(`ALTER TABLE ai_feedback DROP CONSTRAINT IF EXISTS ai_feedback_attempt_id_fkey`).catch(() => {});
    await pool.query(`ALTER TABLE user_access DROP CONSTRAINT IF EXISTS user_access_user_id_fkey`).catch(() => {});
    await pool.query(`ALTER TABLE user_access DROP CONSTRAINT IF EXISTS user_access_accessed_user_id_fkey`).catch(() => {});

    const results = {};

    for (const [table, data] of Object.entries(dumpData)) {
      const { columns, rows } = data;
      
      // Recreate dynamic teacher tables if applicable
      if (table.startsWith('folders_') || table.startsWith('exams_')) {
        const code = table.split('_')[1];
        if (table.startsWith('folders_')) {
          await pool.query(`
            CREATE TABLE IF NOT EXISTS folders_${code} (
              id VARCHAR(255) PRIMARY KEY,
              name VARCHAR(255) NOT NULL,
              parent_id VARCHAR(255),
              created_by VARCHAR(255),
              created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
          `);
          await pool.query(`ALTER TABLE folders_${code} DROP CONSTRAINT IF EXISTS folders_${code}_parent_id_fkey`).catch(() => {});
        } else if (table.startsWith('exams_')) {
          await pool.query(`
            CREATE TABLE IF NOT EXISTS exams_${code} (
              id VARCHAR(255) PRIMARY KEY,
              title VARCHAR(255) NOT NULL,
              description TEXT,
              duration_minutes INTEGER NOT NULL DEFAULT 60,
              max_attempts INTEGER DEFAULT 1,
              folder_id VARCHAR(255),
              is_published BOOLEAN DEFAULT FALSE,
              negative_marking NUMERIC DEFAULT 0,
              created_by VARCHAR(255),
              created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
          `);
          await pool.query(`ALTER TABLE exams_${code} DROP CONSTRAINT IF EXISTS exams_${code}_folder_id_fkey`).catch(() => {});
        }
      }

      // Truncate first to clear default seeds
      await pool.query(`TRUNCATE TABLE ${table} CASCADE`).catch(() => {});

      if (rows && rows.length > 0) {
        const colList = columns.map(c => `"${c}"`).join(', ');
        const valPlaceholders = columns.map((_, i) => `$${i + 1}`).join(', ');
        const insertQuery = `INSERT INTO ${table} (${colList}) VALUES (${valPlaceholders}) ON CONFLICT DO NOTHING`;

        for (const row of rows) {
          const values = columns.map(col => row[col]);
          await pool.query(insertQuery, values);
        }
      }
      results[table] = `${rows.length} rows migrated`;
    }

    // Restore core foreign key constraints
    await pool.query(`ALTER TABLE folders ADD CONSTRAINT folders_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES folders(id) ON DELETE CASCADE`).catch(() => {});
    await pool.query(`ALTER TABLE exams ADD CONSTRAINT exams_folder_id_fkey FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE SET NULL`).catch(() => {});
    await pool.query(`ALTER TABLE attempts ADD CONSTRAINT attempts_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE`).catch(() => {});
    await pool.query(`ALTER TABLE answers ADD CONSTRAINT answers_attempt_id_fkey FOREIGN KEY (attempt_id) REFERENCES attempts(id) ON DELETE CASCADE`).catch(() => {});
    await pool.query(`ALTER TABLE answers ADD CONSTRAINT answers_question_id_fkey FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE`).catch(() => {});
    await pool.query(`ALTER TABLE ai_feedback ADD CONSTRAINT ai_feedback_attempt_id_fkey FOREIGN KEY (attempt_id) REFERENCES attempts(id) ON DELETE CASCADE`).catch(() => {});
    await pool.query(`ALTER TABLE user_access ADD CONSTRAINT user_access_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE`).catch(() => {});
    await pool.query(`ALTER TABLE user_access ADD CONSTRAINT user_access_accessed_user_id_fkey FOREIGN KEY (accessed_user_id) REFERENCES users(id) ON DELETE CASCADE`).catch(() => {});

    // Restore dynamic teacher table constraints
    for (const table of Object.keys(dumpData)) {
      if (table.startsWith('folders_')) {
        const code = table.split('_')[1];
        await pool.query(`ALTER TABLE folders_${code} ADD CONSTRAINT folders_${code}_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES folders_${code}(id) ON DELETE CASCADE`).catch(() => {});
      } else if (table.startsWith('exams_')) {
        const code = table.split('_')[1];
        await pool.query(`ALTER TABLE exams_${code} ADD CONSTRAINT exams_${code}_folder_id_fkey FOREIGN KEY (folder_id) REFERENCES folders_${code}(id) ON DELETE SET NULL`).catch(() => {});
      }
    }

    return NextResponse.json({ message: 'Migration successful', details: results });
  } catch (err) {
    console.error('Migration API error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  } finally {
    await pool.end();
  }
}
