const fs = require('fs');
const path = require('path');

// Parse .env.local file
try {
  const envPath = path.resolve('c:/ramu/project/online exam git clone/online-exam-platform-final/.env.local');
  const dotenvContent = fs.readFileSync(envPath, 'utf8');
  dotenvContent.split(/\r?\n/).forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx > 0) {
      const key = trimmed.substring(0, eqIdx).trim();
      const val = trimmed.substring(eqIdx + 1).trim().replace(/^['"]|['"]$/g, '');
      process.env[key] = val;
    }
  });
} catch (err) {
  console.warn('Could not read .env.local file:', err.message);
}

// Dynamically import db.js and test queries
import('../lib/db.js')
  .then(async (m) => {
    console.log('Testing queries for code 455770...');
    const safeCode = '455770';
    try {
      await m.ensureTeacherTables(safeCode);
      
      console.log('1. Querying folders...');
      const foldersRes = await m.query(`
        SELECT f.*, COALESCE(e.exam_count, 0)::integer as "examCount" 
        FROM folders_${safeCode} f 
        LEFT JOIN (
          SELECT folder_id, COUNT(*) as exam_count
          FROM exams_${safeCode}
          GROUP BY folder_id
        ) e ON f.id = e.folder_id
        ORDER BY f.created_at DESC
      `);
      console.log(`✓ Folders queried successfully, count: ${foldersRes.rowCount}`);

      console.log('2. Querying exams...');
      const examsRes = await m.query(`
        SELECT 
          e.id, 
          e.title, 
          e.description, 
          e.duration_minutes as "durationMinutes",
          e.max_attempts as "maxAttempts",
          e.folder_id as "folderId", 
          e.is_published as "isPublished", 
          e.negative_marking::numeric::double precision as "negativeMarking", 
          e.created_by as "createdBy", 
          e.created_at as "createdAt", 
          e.updated_at as "updatedAt",
          f.name as "folderName",
          COALESCE(q.q_count, 0)::integer as "questionCount",
          COALESCE(a.a_count, 0)::integer as "attemptCount"
        FROM exams_${safeCode} e
        LEFT JOIN folders_${safeCode} f ON e.folder_id = f.id
        LEFT JOIN (
          SELECT exam_id, COUNT(*) as q_count
          FROM questions 
          GROUP BY exam_id
        ) q ON e.id = q.exam_id
        LEFT JOIN (
          SELECT exam_id, COUNT(*) as a_count
          FROM attempts 
          GROUP BY exam_id
        ) a ON e.id = a.exam_id
        ORDER BY e.created_at DESC
      `);
      console.log(`✓ Exams queried successfully, count: ${examsRes.rowCount}`);

      console.log('3. Querying questions...');
      const questionsRes = await m.query(`
        SELECT 
          q.id, 
          q.exam_id as "examId", 
          q.question_text as "questionText", 
          q.options, 
          q.correct_option_id as "correctOptionId", 
          q.subject, 
          q.topic, 
          q.marks, 
          q.negative_marking::numeric::double precision as "negativeMarking",
          q.order_index as "orderIndex", 
          q.created_at as "createdAt"
        FROM questions q
        JOIN exams_${safeCode} e ON q.exam_id = e.id
        ORDER BY q.order_index ASC, q.created_at ASC
      `);
      console.log(`✓ Questions queried successfully, count: ${questionsRes.rowCount}`);

      console.log('4. Querying attempts...');
      const attemptsRes = await m.query(`
        SELECT 
          a.id, 
          a.exam_id as "examId", 
          a.user_id as "userId", 
          a.status, 
          a.started_at as "startedAt", 
          a.submitted_at as "submittedAt", 
          a.score::numeric::double precision as "score", 
          a.total_marks as "totalMarks", 
          a.rank, 
          a.warnings, 
          e.title as "examTitle",
          u.email as "studentEmail"
        FROM attempts a
        JOIN exams_${safeCode} e ON a.exam_id = e.id
        LEFT JOIN users u ON a.user_id = u.id
        ORDER BY a.started_at DESC
      `);
      console.log(`✓ Attempts queried successfully, count: ${attemptsRes.rowCount}`);

      console.log('All queries passed!');
      process.exit(0);
    } catch (err) {
      console.error('Query execution failed:', err);
      process.exit(1);
    }
  })
  .catch((err) => {
    console.error('Failed to import database modules:', err);
    process.exit(1);
  });
