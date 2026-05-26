import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

function generateUserCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST( req) {
  try {
    const { email, role, fullName, avatarUrl } = await req.json();
    if (!email || !role) {
      return NextResponse.json({ error: 'Email and role are required' }, { status: 400 });
    }

    // Determine a student/admin ID
    const userId = role === 'admin' ? 'admin-1' : `student-${email.split('@')[0]}`;
    const name = fullName || email.split('@')[0];
    const userCode = generateUserCode();

    const res = await query(`
      INSERT INTO users (id, email, full_name, avatar_url, role, user_code)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (email) 
      DO UPDATE SET full_name = EXCLUDED.full_name, avatar_url = EXCLUDED.avatar_url, role = EXCLUDED.role, user_code = COALESCE(users.user_code, EXCLUDED.user_code)
      RETURNING id, email, full_name as "fullName", avatar_url as "avatarUrl", role, user_code as "userCode", created_at as "createdAt"
    `, [userId, email, name, avatarUrl || '', role, userCode]);

    return NextResponse.json(res.rows[0]);
  } catch (error) {
    console.error('Auth Login Route Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
