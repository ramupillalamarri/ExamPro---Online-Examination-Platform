import { NextResponse } from 'next/server';
import { query, ensureTeacherTables, getExamById } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const userCode = searchParams.get('userCode');
    const examId = searchParams.get('examId');

    let isTeacher = false;
    let teacherUserCode = '';
    if (userId) {
      const userRes = await query('SELECT role, user_code FROM users WHERE id = $1', [userId]);
      if (userRes.rowCount > 0) {
        const user = userRes.rows[0];
        if (user.role === 'teacher' || user.role === 'admin') {
          isTeacher = true;
          teacherUserCode = user.user_code;
        }
      }
    }

    let activeCode = '';
    if (isTeacher) {
      activeCode = teacherUserCode;
    } else if (userCode) {
      activeCode = userCode;
    } else if (examId) {
      const examInfo = await getExamById(examId);
      if (examInfo) {
        activeCode = examInfo.userCode;
      }
    }

    if (!activeCode) {
      activeCode = '455770';
    }

    const safeCode = activeCode.replace(/[^a-zA-Z0-9_]/g, '');
    await ensureTeacherTables(activeCode);

    // 1. Fetch Folders
    let foldersQuery = `
      SELECT f.*, COALESCE(e.exam_count, 0)::integer as "examCount" 
      FROM folders_${safeCode} f 
      LEFT JOIN (
        SELECT folder_id, COUNT(*) as exam_count
        FROM exams_${safeCode}
    `;
    if (!isTeacher) {
      foldersQuery += ' WHERE is_published = true ';
    }
    foldersQuery += `
        GROUP BY folder_id
      ) e ON f.id = e.folder_id
      ORDER BY f.created_at DESC
    `;
    const foldersRes = await query(foldersQuery);

    // 2. Fetch Exams
    let examsQuery = `
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
    `;
    if (!isTeacher) {
      examsQuery += ' WHERE e.is_published = true ';
    }
    examsQuery += ' ORDER BY e.created_at DESC';
    const examsRes = await query(examsQuery);

    // 3. Fetch Questions
    let questions = [];
    if (examId) {
      let questionsQuery = `
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
          q.question_image as "questionImage",
          q.question_type as "questionType",
          q.created_at as "createdAt"
        FROM questions q
        WHERE q.exam_id = $1
        ORDER BY q.order_index ASC, q.created_at ASC
      `;
      const questionsRes = await query(questionsQuery, [examId]);
      questions = questionsRes.rows;
    }

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
      JOIN exams_${safeCode} e ON a.exam_id = e.id
      LEFT JOIN users u ON a.user_id = u.id
    `;
    const attemptsParams = [];
    if (!isTeacher && userId) {
      attemptsQuery += ' WHERE a.user_id = $1 ';
      attemptsParams.push(userId);
    }
    attemptsQuery += ' ORDER BY a.started_at DESC';
    const attemptsRes = await query(attemptsQuery, attemptsParams);

    // 5. Fetch Answers
    let answersQuery = `
      SELECT 
        an.id, 
        an.attempt_id as "attemptId", 
        an.question_id as "questionId", 
        an.selected_option_id as "selectedOptionId", 
        an.descriptive_answer as "descriptiveAnswer",
        an.is_correct as "isCorrect", 
        an.updated_at as "updatedAt"
      FROM answers an
      JOIN attempts att ON an.attempt_id = att.id
      JOIN exams_${safeCode} e ON att.exam_id = e.id
    `;
    const answersParams = [];
    if (!isTeacher && userId) {
      answersQuery += ' WHERE att.user_id = $1 ';
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
      JOIN attempts att ON f.attempt_id = att.id
      JOIN exams_${safeCode} e ON att.exam_id = e.id
    `;
    const feedbackParams = [];
    if (!isTeacher && userId) {
      feedbackQuery += ' WHERE att.user_id = $1 ';
      feedbackParams.push(userId);
    }
    const feedbackRes = await query(feedbackQuery, feedbackParams);

    return NextResponse.json({
      folders: foldersRes.rows,
      exams: examsRes.rows,
      questions: questions,
      attempts: attemptsRes.rows,
      answers: answersRes.rows,
      aiFeedback: feedbackRes.rows,
    });
  } catch (error) {
    console.error('GET Bulk Data Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
