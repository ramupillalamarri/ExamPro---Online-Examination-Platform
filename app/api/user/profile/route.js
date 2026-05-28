import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const res = await query(`
      SELECT id, email, full_name as "fullName", avatar_url as "avatarUrl", role, user_code as "userCode",
             age, phone_number as "phoneNumber", address, college, major, graduation_year as "graduationYear", bio,
             created_at as "createdAt"
      FROM users
      WHERE id = $1
    `, [userId]);

    if (res.rowCount === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(res.rows[0]);
  } catch (error) {
    console.error('GET Profile Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const body = await req.json();
    const { userId, fullName, age, phoneNumber, address, college, major, graduationYear, bio } = body;
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Update user profile fields
    const res = await query(`
      UPDATE users
      SET full_name = $1,
          age = $2,
          phone_number = $3,
          address = $4,
          college = $5,
          major = $6,
          graduation_year = $7,
          bio = $8
      WHERE id = $9
      RETURNING id, email, full_name as "fullName", avatar_url as "avatarUrl", role, user_code as "userCode",
                age, phone_number as "phoneNumber", address, college, major, graduation_year as "graduationYear", bio,
                created_at as "createdAt"
    `, [
      fullName || '',
      age ? parseInt(age) : null,
      phoneNumber || '',
      address || '',
      college || '',
      major || '',
      graduationYear ? parseInt(graduationYear) : null,
      bio || '',
      userId
    ]);

    if (res.rowCount === 0) {
      return NextResponse.json({ error: 'User not found or update failed' }, { status: 404 });
    }

    return NextResponse.json(res.rows[0]);
  } catch (error) {
    console.error('PUT Profile Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
