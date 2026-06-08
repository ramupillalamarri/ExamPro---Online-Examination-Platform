import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(req, { params }) {
  try {
    const { id: examId } = await params;
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!examId || !userId) {
      return NextResponse.json({ error: 'Exam ID and User ID are required' }, { status: 400 });
    }

    // 1. Check if the user has successfully attempted (graded) this exam
    const checkAttemptRes = await query(
      'SELECT id FROM attempts WHERE exam_id = $1 AND user_id = $2 AND status = $3 LIMIT 1',
      [examId, userId, 'graded']
    );

    if (checkAttemptRes.rowCount === 0) {
      return NextResponse.json(
        { error: 'You must complete this exam before you can view its leaderboard.' },
        { status: 403 }
      );
    }

    // 2. Fetch the leaderboard. Order by rank ASC, score DESC, submitted_at ASC.
    // We only return rank, full name, score details, and userId (for highlight matching) to hide personal info.
    const leaderboardRes = await query(
      `WITH user_best_attempts AS (
        SELECT DISTINCT ON (user_id)
          id,
          user_id,
          score,
          total_marks,
          submitted_at,
          started_at
        FROM attempts
        WHERE exam_id = $1 AND status = 'graded'
        ORDER BY user_id, score DESC, submitted_at ASC, started_at ASC, id ASC
      ),
      ranked_attempts AS (
        SELECT
          user_id,
          score::numeric::double precision as "score",
          total_marks,
          ROW_NUMBER() OVER (
            ORDER BY score DESC, submitted_at ASC, started_at ASC, id ASC
          ) AS dynamic_rank
        FROM user_best_attempts
      )
      SELECT 
        ra.dynamic_rank as "rank", 
        u.full_name as "fullName", 
        ra.score,
        ra.total_marks as "totalMarks",
        ra.user_id as "userId"
      FROM ranked_attempts ra
      JOIN users u ON ra.user_id = u.id
      ORDER BY ra.dynamic_rank ASC`,
      [examId]
    );

    return NextResponse.json({
      success: true,
      leaderboard: leaderboardRes.rows
    });
  } catch (error) {
    console.error('GET Leaderboard Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
