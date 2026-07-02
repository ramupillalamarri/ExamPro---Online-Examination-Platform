const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Manual dotenv parser
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

const folderId = 'ehm1u7pwz2'; // ECET > CSE
const teacherId = 'admin-1';
const teacherCode = '455770';

async function seedExam(examId, title, description, jsonFileName) {
  const jsonPath = path.join('scratch', jsonFileName);
  if (!fs.existsSync(jsonPath)) {
    console.error(`Error: ${jsonPath} does not exist. Skipping seeding for ${title}`);
    return;
  }

  console.log(`\nReading questions from ${jsonPath}...`);
  const questionsData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  console.log(`Loaded ${questionsData.length} questions.`);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Create or update the exam in exams_455770
    console.log(`Seeding exam: ${title}...`);
    await client.query(`
      INSERT INTO exams_${teacherCode} (id, title, description, duration_minutes, max_attempts, folder_id, is_published, negative_marking, created_by, updated_at)
      VALUES ($1, $2, $3, 180, 1, $4, true, 0, $5, NOW())
      ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        folder_id = EXCLUDED.folder_id,
        is_published = EXCLUDED.is_published,
        updated_at = NOW()
    `, [examId, title, description, folderId, teacherId]);

    // 2. Delete any existing questions for this exam in the questions table
    await client.query('DELETE FROM questions WHERE exam_id = $1', [examId]);

    // 3. Insert the 200 questions
    const optionIds = ['a', 'b', 'c', 'd'];
    for (const q of questionsData) {
      const qNum = q.question_number;
      
      // Determine subject based on question number
      let subject = 'Computer Science';
      if (qNum <= 50) {
        subject = 'Mathematics';
      } else if (qNum <= 75) {
        subject = 'Physics';
      } else if (qNum <= 100) {
        subject = 'Chemistry';
      }

      // Map options
      const optImages = q.option_images || [null, null, null, null];
      const dbOptions = q.options.map((optText, idx) => ({
        id: optionIds[idx],
        text: optText.trim(),
        imageUrl: optImages[idx] || null
      }));

      // Map correct option ID
      const corrIdx = q.correct_option_index;
      const correctOptionId = optionIds[corrIdx] || 'a';

      const qId = `${examId}-q-${qNum}`;
      
      await client.query(`
        INSERT INTO questions (id, exam_id, question_text, options, correct_option_id, subject, topic, marks, negative_marking, order_index, question_image, question_type)
        VALUES ($1, $2, $3, $4, $5, $6, $7, 1, 0, $8, $9, 'mcq')
      `, [
        qId,
        examId,
        q.question_text.trim(),
        JSON.stringify(dbOptions),
        correctOptionId,
        subject,
        `${subject} Topic`,
        qNum - 1, // order_index
        q.question_image || null
      ]);
    }

    await client.query('COMMIT');
    console.log(`SUCCESS: Successfully seeded ${questionsData.length} questions for exam: ${title}`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(`FAILED to seed exam ${title}:`, err);
  } finally {
    client.release();
  }
}

async function main() {
  try {
    console.log('Connecting to PostgreSQL database...');
    // Seed 2019
    await seedExam(
      'exam-ecet-2019-cse',
      'TS ECET 2019 Computer Science and Engineering',
      'Official previous year question paper of TS ECET 2019 for Computer Science and Engineering (CSE) branch.',
      'cse_2019_questions.json'
    );

    // Seed 2022
    await seedExam(
      'exam-ecet-2022-cse',
      'TS ECET 2022 Computer Science and Engineering',
      'Official previous year question paper of TS ECET 2022 for Computer Science and Engineering (CSE) branch.',
      'cse_2022_questions.json'
    );

    // Seed 2023
    await seedExam(
      'exam-ecet-2023-cse',
      'TS ECET 2023 Computer Science and Engineering',
      'Official previous year question paper of TS ECET 2023 for Computer Science and Engineering (CSE) branch.',
      'cse_2023_questions.json'
    );

  } catch (err) {
    console.error('Database connection error:', err);
  } finally {
    await pool.end();
  }
}

main();
