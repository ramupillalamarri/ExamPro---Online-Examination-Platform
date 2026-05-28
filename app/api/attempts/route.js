import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

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
        a.warnings, 
        e.title as "examTitle"
      FROM attempts a
      JOIN exams e ON a.exam_id = e.id
    `;
    const params = [];
    
    if (userId) {
      queryText += ` WHERE a.user_id = $1`;
      params.push(userId);
    }
    
    queryText += ` ORDER BY a.started_at DESC`;
    
    const res = await query(queryText, params);
    return NextResponse.json(res.rows);
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
        a.warnings, 
        e.title as "examTitle",
        e.duration_minutes as "durationMinutes"
      FROM attempts a
      JOIN exams e ON a.exam_id = e.id
      WHERE a.exam_id = $1 AND a.user_id = $2 AND a.status = 'in_progress'
    `, [examId, userId]);

    if (checkRes.rowCount > 0) {
      const activeAttempt = checkRes.rows[0];
      const elapsedSeconds = Math.floor((Date.now() - new Date(activeAttempt.startedAt).getTime()) / 1000);
      const totalSeconds = activeAttempt.durationMinutes * 60;
      const timeRemainingSeconds = Math.max(0, totalSeconds - elapsedSeconds);
      
      return NextResponse.json({
        ...activeAttempt,
        timeRemainingSeconds
      });
    }

    // Fetch exam details
    const examRes = await query('SELECT title, duration_minutes, max_attempts as "maxAttempts" FROM exams WHERE id = $1', [examId]);
    if (examRes.rowCount === 0) {
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
    }
    const exam = examRes.rows[0];
    const maxAttempts = exam.maxAttempts !== null && exam.maxAttempts !== undefined ? exam.maxAttempts : 1;

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
