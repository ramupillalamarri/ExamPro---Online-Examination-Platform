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

async function validateExam(examId, expectedTitle) {
  const client = await pool.connect();
  try {
    console.log(`\nValidating exam: ${examId}...`);
    
    // 1. Verify exam exists in exams_455770
    const examRes = await client.query('SELECT * FROM exams_455770 WHERE id = $1', [examId]);
    if (examRes.rowCount === 0) {
      console.error(`❌ ERROR: Exam ${examId} not found in exams_455770 table!`);
      return false;
    }
    const exam = examRes.rows[0];
    console.log(`  ✅ Exam exists: "${exam.title}"`);
    if (exam.title !== expectedTitle) {
      console.warn(`  ⚠️ WARNING: Title mismatch. Expected: "${expectedTitle}", Got: "${exam.title}"`);
    }

    // 2. Verify questions count
    const qRes = await client.query('SELECT id, question_text, correct_option_id, subject, order_index, question_image, options FROM questions WHERE exam_id = $1 ORDER BY order_index ASC', [examId]);
    console.log(`  ✅ Questions found: ${qRes.rowCount} / 200 expected`);
    
    if (qRes.rowCount !== 200) {
      console.error(`❌ ERROR: Question count is not exactly 200! Found: ${qRes.rowCount}`);
      return false;
    }

    // 3. Detailed questions validation
    let mathCount = 0;
    let physicsCount = 0;
    let chemistryCount = 0;
    let csCount = 0;
    let imageCount = 0;
    let optionImageCount = 0;
    let anomalies = [];

    qRes.rows.forEach((q, idx) => {
      const qNum = idx + 1;
      
      // Verify order_index is sequential
      if (q.order_index !== idx) {
        anomalies.push(`Q${qNum} has wrong order_index: ${q.order_index}`);
      }

      // Count subjects
      if (q.subject === 'Mathematics') mathCount++;
      else if (q.subject === 'Physics') physicsCount++;
      else if (q.subject === 'Chemistry') chemistryCount++;
      else if (q.subject === 'Computer Science' || q.subject === 'Computer Science and Engineering') csCount++;

      // Count images
      if (q.question_image) imageCount++;

      // Verify correct option
      if (!['a', 'b', 'c', 'd'].includes(q.correct_option_id)) {
        anomalies.push(`Q${qNum} has invalid correct_option_id: '${q.correct_option_id}'`);
      }

      // Verify options structure
      try {
        const opts = typeof q.options === 'string' ? JSON.parse(q.options) : q.options;
        if (!Array.isArray(opts) || opts.length !== 4) {
          anomalies.push(`Q${qNum} has invalid options length: ${opts.length}`);
        } else {
          opts.forEach(opt => {
            if (opt.imageUrl) optionImageCount++;
          });
        }
      } catch (e) {
        anomalies.push(`Q${qNum} options JSON parsing failed: ${e.message}`);
      }
    });

    console.log(`  ✅ Subjects distribution: Math: ${mathCount}, Physics: ${physicsCount}, Chemistry: ${chemistryCount}, CS: ${csCount}`);
    console.log(`  ✅ Embedded question images count: ${imageCount}`);
    console.log(`  ✅ Embedded option images count: ${optionImageCount}`);

    if (mathCount !== 50 || physicsCount !== 25 || chemistryCount !== 25 || csCount !== 100) {
      console.warn(`  ⚠️ WARNING: Non-standard subjects distribution! Standard is Math: 50, Physics: 25, Chemistry: 25, CS: 100`);
    }

    if (anomalies.length > 0) {
      console.error(`❌ ERROR: Found ${anomalies.length} structural anomalies in questions:`);
      anomalies.forEach(a => console.error(`    - ${a}`));
      return false;
    }

    console.log(`🎉 SUCCESS: Exam ${examId} is 100% valid and verified!`);
    return true;
  } catch (err) {
    console.error(`❌ ERROR during validation of ${examId}:`, err);
    return false;
  } finally {
    client.release();
  }
}

async function main() {
  try {
    console.log('--- STARTING DATABASE VALIDATION FOR SEEDED EXAMS ---');
    const v1 = await validateExam('exam-ecet-2019-cse', 'TS ECET 2019 Computer Science and Engineering');
    const v2 = await validateExam('exam-ecet-2022-cse', 'TS ECET 2022 Computer Science and Engineering');
    const v3 = await validateExam('exam-ecet-2023-cse', 'TS ECET 2023 Computer Science and Engineering');

    console.log('\n==================================================');
    if (v1 && v2 && v3) {
      console.log('🏆 GLOBAL RESULT: ALL THREE EXAMS ARE 100% VALIDATED AND VERIFIED!');
    } else {
      console.error('🏆 GLOBAL RESULT: VALIDATION FAILED! Check the errors above.');
    }
    console.log('==================================================');
  } catch (err) {
    console.error('Validation script error:', err);
  } finally {
    await pool.end();
  }
}

main();
