import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

const generateId = () => Math.random().toString(36).substring(2, 15);

export async function POST(req) {
  try {
    const { userId, userCode } = await req.json();

    if (!userId || !userCode) {
      return NextResponse.json({ error: 'userId and userCode are required' }, { status: 400 });
    }

    // Find the user with this code
    const userRes = await query(
      'SELECT id, email, full_name as "fullName", user_code as "userCode" FROM users WHERE user_code = $1',
      [userCode]
    );

    if (userRes.rows.length === 0) {
      return NextResponse.json({ error: 'Invalid code' }, { status: 404 });
    }

    const accessedUser = userRes.rows[0];

    // Insert or ignore if already accessed
    const accessRes = await query(`
      INSERT INTO user_access (id, user_id, accessed_user_id, user_code)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (user_id, accessed_user_id) DO NOTHING
      RETURNING id, user_id as "userId", accessed_user_id as "accessedUserId", user_code as "userCode", created_at as "createdAt"
    `, [generateId(), userId, accessedUser.id, userCode]);

    return NextResponse.json({
      success: true,
      message: 'Successfully joined!',
      accessedUser,
      access: accessRes.rows[0] || null,
    });
  } catch (error) {
    console.error('User Access Route Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    // Get all users this user has accessed
    const res = await query(`
      SELECT ua.*, u.email, u.full_name as "fullName", u.user_code as "userCode"
      FROM user_access ua
      JOIN users u ON ua.accessed_user_id = u.id
      WHERE ua.user_id = $1
      ORDER BY ua.created_at DESC
    `, [userId]);

    return NextResponse.json({
      accessedUsers: res.rows,
    });
  } catch (error) {
    console.error('User Access GET Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
