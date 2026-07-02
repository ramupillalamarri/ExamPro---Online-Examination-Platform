const { Pool } = require('pg');
const fs = require('fs');

if (fs.existsSync('.env.local')) {
  const lines = fs.readFileSync('.env.local', 'utf8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const parts = trimmed.split('=');
      if (parts.length >= 2) {
        const key = parts[0].trim();
        const val = parts.slice(1).join('=').trim().replace(/['"]/g, '');
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

async function deleteExam() {
  const examId = 'exam-ecet-2019-cse';
  const teacherCode = '455770';
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    console.log('Deleting questions for', examId);
    await client.query('DELETE FROM questions WHERE exam_id = $1', [examId]);
    console.log('Deleting exam row from exams_' + teacherCode);
    await client.query(`DELETE FROM exams_${teacherCode} WHERE id = $1`, [examId]);
    await client.query('COMMIT');
    console.log('Deletion complete.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Deletion failed:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

deleteExam();
