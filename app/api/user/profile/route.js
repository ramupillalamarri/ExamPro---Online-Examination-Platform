import { NextResponse } from 'next/server';
import { query, ensureTeacherTables } from '@/lib/db';

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
    const { userId, role, fullName, age, phoneNumber, address, college, major, graduationYear, bio } = body;
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const userRes = await query('SELECT * FROM users WHERE id = $1', [userId]);
    if (userRes.rowCount === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    const currentUser = userRes.rows[0];

    const newFullName = fullName !== undefined ? fullName : currentUser.full_name;
    const newAge = age !== undefined ? (age ? parseInt(age) : null) : currentUser.age;
    const newPhone = phoneNumber !== undefined ? phoneNumber : currentUser.phone_number;
    const newAddress = address !== undefined ? address : currentUser.address;
    const newCollege = college !== undefined ? college : currentUser.college;
    const newMajor = major !== undefined ? major : currentUser.major;
    const newGradYear = graduationYear !== undefined ? (graduationYear ? parseInt(graduationYear) : null) : currentUser.graduation_year;
    const newBio = bio !== undefined ? bio : currentUser.bio;
    const newRole = role !== undefined ? role : currentUser.role;

    const res = await query(`
      UPDATE users
      SET full_name = $1,
          age = $2,
          phone_number = $3,
          address = $4,
          college = $5,
          major = $6,
          graduation_year = $7,
          bio = $8,
          role = $9
      WHERE id = $10
      RETURNING id, email, full_name as "fullName", avatar_url as "avatarUrl", role, user_code as "userCode",
                age, phone_number as "phoneNumber", address, college, major, graduation_year as "graduationYear", bio,
                created_at as "createdAt"
    `, [newFullName, newAge, newPhone, newAddress, newCollege, newMajor, newGradYear, newBio, newRole, userId]);

    const updatedUser = res.rows[0];
    if (updatedUser && (updatedUser.role === 'teacher' || updatedUser.role === 'admin') && updatedUser.userCode) {
      await ensureTeacherTables(updatedUser.userCode);
    }

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('PUT Profile Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
