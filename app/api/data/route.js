import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET( req) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    let isTeacher = false;
    if (userId) {
      const userRes = await query('SELECT role FROM users WHERE id = $1', [userId]);
      if (userRes.rowCount > 0 && (userRes.rows[0].role === 'teacher' || userRes.rows[0].role === 'admin')) {
        isTeacher = true;
      }
    }

    // 1. Fetch Folders
    const foldersRes = await query(`
      SELECT f.*, COALESCE(e.exam_count, 0)::integer as "examCount" 
      FROM folders f 
      LEFT JOIN (
        SELECT folder_id, COUNT(*) as exam_count
        FROM exams 
        GROUP BY folder_id
      ) e ON f.id = e.folder_id
      ORDER BY f.created_at DESC
    `);

    // 2. Fetch Exams
    const examsRes = await query(`
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
      FROM exams e
      LEFT JOIN folders f ON e.folder_id = f.id
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

    // 3. Fetch Questions
    const questionsRes = await query(`
      SELECT 
        id, 
        exam_id as "examId", 
        question_text as "questionText", 
        options, 
        correct_option_id as "correctOptionId", 
        subject, 
        topic, 
        marks, 
        order_index as "orderIndex", 
        created_at as "createdAt"
      FROM questions
      ORDER BY order_index ASC, created_at ASC
    `);

    // 4. Fetch Attempts
    let attemptsQuery = `
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
      JOIN exams e ON a.exam_id = e.id
      LEFT JOIN users u ON a.user_id = u.id
    `;
    const attemptsParams = [];
    if (userId && !isTeacher) {
      attemptsQuery += ` WHERE a.user_id = $1`;
      attemptsParams.push(userId);
    }
    attemptsQuery += ` ORDER BY a.started_at DESC`;
    const attemptsRes = await query(attemptsQuery, attemptsParams);

    // 5. Fetch Answers
    let answersQuery = `
      SELECT 
        an.id, 
        an.attempt_id as "attemptId", 
        an.question_id as "questionId", 
        an.selected_option_id as "selectedOptionId", 
        an.is_correct as "isCorrect", 
        an.updated_at as "updatedAt"
      FROM answers an
    `;
    const answersParams = [];
    if (userId && !isTeacher) {
      answersQuery += ` JOIN attempts att ON an.attempt_id = att.id WHERE att.user_id = $1`;
      answersParams.push(userId);
    }
    const answersRes = await query(answersQuery, answersParams);

    // 6. Fetch AI Feedback
    let feedbackQuery = `
      SELECT 
        f.id, 
        f.attempt_id as "attemptId", 
        f.mistake_analysis as "mistakeAnalysis", 
        f.weak_topics as "weakTopics", 
        f.created_at as "createdAt"
      FROM ai_feedback f
    `;
    const feedbackParams = [];
    if (userId && !isTeacher) {
      feedbackQuery += ` JOIN attempts att ON f.attempt_id = att.id WHERE att.user_id = $1`;
      feedbackParams.push(userId);
    }
    const feedbackRes = await query(feedbackQuery, feedbackParams);

    return NextResponse.json({
      folders: foldersRes.rows,
      exams: examsRes.rows,
      questions: questionsRes.rows,
      attempts: attemptsRes.rows,
      answers: answersRes.rows,
      aiFeedback: feedbackRes.rows,
    });
  } catch (error) {
    console.error('GET Bulk Data Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
