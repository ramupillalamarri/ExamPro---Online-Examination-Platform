import { NextResponse } from 'next/server';
import { Pool } from 'pg';

export async function GET(request) {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const usersRes = await pool.query('SELECT id, email, role, user_code as "userCode" FROM users');
    const examsRes = await pool.query('SELECT id, title, folder_id FROM exams_455770').catch(e => ({ error: e.message }));
    const attemptsRes = await pool.query('SELECT id, exam_id, user_id, status FROM attempts');
    const userAccessRes = await pool.query('SELECT * FROM user_access');

    // Run the exact students query
    const teacherId = 'admin-1';
    const studentsRes = await pool.query(`
      SELECT 
        u.id, 
        u.email, 
        u.full_name as "fullName", 
        COALESCE(ua.created_at, att.first_attempt_at, u.created_at) as "createdAt",
        COALESCE(att.attempt_count, 0)::integer as "attemptCount",
        COALESCE(att.avg_score, 0)::numeric::double precision as "avgScore"
      FROM users u
      LEFT JOIN user_access ua ON u.id = ua.user_id AND ua.accessed_user_id = $1
      LEFT JOIN (
        SELECT 
          a.user_id, 
          COUNT(*) as attempt_count,
          AVG(COALESCE(a.score, 0) * 100.0 / NULLIF(a.total_marks, 0)) FILTER (WHERE a.status = 'graded') as avg_score,
          MAX(COALESCE(a.submitted_at, a.started_at)) as last_active,
          MIN(a.started_at) as first_attempt_at
        FROM attempts a
        JOIN exams_455770 e ON a.exam_id = e.id
        GROUP BY a.user_id
      ) att ON u.id = att.user_id
      WHERE ua.id IS NOT NULL OR att.user_id IS NOT NULL
    `, [teacherId]);

    return NextResponse.json({
      users: usersRes.rows,
      exams_455770: examsRes.rows || examsRes.error,
      attempts: attemptsRes.rows,
      user_access: userAccessRes.rows,
      studentsQueryResult: studentsRes.rows
    });
  } catch (err) {
    return NextResponse.json({ error: err.message });
  } finally {
    await pool.end();
  }
}
