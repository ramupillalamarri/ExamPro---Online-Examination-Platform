import { NextResponse } from 'next/server';
import { query, getExamById } from '@/lib/db';

export async function GET( req) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    
    let queryText = `
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
        a.warnings
      FROM attempts a
    `;
    const params = [];
    
    if (userId) {
      queryText += ` WHERE a.user_id = $1`;
      params.push(userId);
    }
    
    queryText += ` ORDER BY a.started_at DESC`;
    
    const res = await query(queryText, params);

    const attemptsWithTitle = [];
    for (const row of res.rows) {
      const examInfo = await getExamById(row.examId);
      attemptsWithTitle.push({
        ...row,
        examTitle: examInfo ? examInfo.exam.title : 'Unknown Exam'
      });
    }

    return NextResponse.json(attemptsWithTitle);
  } catch (error) {
    console.error('GET Attempts Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST( req) {
  try {
    let { id, examId, userId } = await req.json();
    if (!examId || !userId) {
      return NextResponse.json({ error: 'Exam ID and User ID are required' }, { status: 400 });
    }

    // Generate ID if not provided
    if (!id) {
      id = `attempt-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    }

    // Check if in_progress attempt already exists
    const checkRes = await query(`
      SELECT 
        a.id, 
        a.exam_id as "examId", 
        a.user_id as "userId", 
        a.status, 
        a.started_at as "startedAt", 
        a.score::numeric::double precision as "score", 
        a.total_marks as "totalMarks", 
        a.rank, 
        a.warnings
      FROM attempts a
      WHERE a.exam_id = $1 AND a.user_id = $2 AND a.status = 'in_progress'
    `, [examId, userId]);

    if (checkRes.rowCount > 0) {
      const activeAttempt = checkRes.rows[0];
      const examInfo = await getExamById(examId);
      const durationMinutes = examInfo ? examInfo.exam.duration_minutes : 60;
      const examTitle = examInfo ? examInfo.exam.title : 'Unknown Exam';
      const elapsedSeconds = Math.floor((Date.now() - new Date(activeAttempt.startedAt).getTime()) / 1000);
      const totalSeconds = durationMinutes * 60;
      const timeRemainingSeconds = Math.max(0, totalSeconds - elapsedSeconds);
      
      return NextResponse.json({
        ...activeAttempt,
        examTitle,
        durationMinutes,
        timeRemainingSeconds
      });
    }

    // Fetch exam details
    const examInfo = await getExamById(examId);
    if (!examInfo) {
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
    }
    const exam = examInfo.exam;
    const maxAttempts = exam.max_attempts !== null && exam.max_attempts !== undefined ? exam.max_attempts : 1;

    // Server-side enforcement: count completed (graded) attempts for this user
    const completedRes = await query('SELECT COUNT(*)::integer as count FROM attempts WHERE exam_id = $1 AND user_id = $2 AND status = $3', [examId, userId, 'graded']);
    const completedCount = completedRes.rows[0].count || 0;
    if (completedCount >= maxAttempts) {
      return NextResponse.json({ error: `Maximum ${maxAttempts} attempts allowed for this exam. You have already used all your attempts.` }, { status: 403 });
    }

    const insertRes = await query(`
      INSERT INTO attempts (id, exam_id, user_id, status, started_at, score, total_marks, rank, warnings)
      VALUES ($1, $2, $3, 'in_progress', NOW(), 0, 0, NULL, 0)
      RETURNING 
        id, 
        exam_id as "examId", 
        user_id as "userId", 
        status, 
        started_at as "startedAt", 
        score::numeric::double precision as "score", 
        total_marks as "totalMarks", 
        rank, 
        warnings
    `, [id, examId, userId]);

    const attempt = insertRes.rows[0];
    return NextResponse.json({
      ...attempt,
      examTitle: exam.title,
      timeRemainingSeconds: exam.duration_minutes * 60
    });
  } catch (error) {
    console.error('POST Attempt Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
