const { Pool } = require('pg');
const fs = require('fs');

// Manual dotenv parser
if (fs.existsSync('.env.local')) {
  const lines = fs.readFileSync('.env.local', 'utf8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const parts = trimmed.split('=');
      if (parts.length >= 2) {
        const key = parts[0].trim();
        const val = parts.slice(1).join('=').trim();
        process.env[key] = val;
      }
    }
  }
}

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'online_exam_final',
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '5432'),
});

async function main() {
  try {
    console.log('Connecting to database...');
    const users = await pool.query('SELECT id, email, full_name, user_code, role FROM users');
    console.log('--- Users ---');
    console.table(users.rows);

    // Check if folders_455770 exists
    const foldersExist = await pool.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'folders_455770'
      )
    `);
    
    if (foldersExist.rows[0].exists) {
      const folders = await pool.query('SELECT id, name, parent_id, created_by FROM folders_455770');
      console.log('--- Folders for 455770 ---');
      console.table(folders.rows);
    } else {
      console.log('folders_455770 does not exist');
    }

    const examsExist = await pool.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'exams_455770'
      )
    `);

    if (examsExist.rows[0].exists) {
      const exams = await pool.query('SELECT id, title, folder_id, is_published FROM exams_455770');
      console.log('--- Exams for 455770 ---');
      console.table(exams.rows);
    } else {
      console.log('exams_455770 does not exist');
    }

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await pool.end();
  }
}

main();
