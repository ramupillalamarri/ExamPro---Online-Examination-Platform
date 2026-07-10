import { NextResponse } from 'next/server';
import { query, ensureTeacherTables } from '@/lib/db';

function generateUserCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req) {
  try {
    const { email, role, fullName, avatarUrl } = await req.json();
    if (!email || !role) {
      return NextResponse.json({ error: 'Email and role are required' }, { status: 400 });
    }

    const name = fullName || email.split('@')[0];

    // If the user already exists, return the existing record (ensures user_code stability)
    const existing = await query(`
      SELECT id, email, full_name as "fullName", avatar_url as "avatarUrl", role, user_code as "userCode", 
             age, phone_number as "phoneNumber", address, college, major, graduation_year as "graduationYear", bio, 
             created_at as "createdAt" 
      FROM users WHERE email = $1
    `, [email]);
    if (existing.rowCount > 0) {
      // Preserve existing profile custom changes (avatar and name) if they exist
      const user = existing.rows[0];
      const finalFullName = user.fullName || name;
      const finalAvatarUrl = user.avatarUrl || avatarUrl || '';
      
      await query(`UPDATE users SET full_name = $1, avatar_url = $2, role = $3 WHERE email = $4`, [finalFullName, finalAvatarUrl, role, email]);
      
      // Fetch full, updated user info to return complete profile details
      const updatedUser = await query(`
        SELECT id, email, full_name as "fullName", avatar_url as "avatarUrl", role, user_code as "userCode", 
               age, phone_number as "phoneNumber", address, college, major, graduation_year as "graduationYear", bio, 
               created_at as "createdAt" 
        FROM users WHERE email = $1
      `, [email]);
      const loggedUser = updatedUser.rows[0];
      if (loggedUser && (loggedUser.role === 'admin' || loggedUser.role === 'teacher') && loggedUser.userCode) {
        await ensureTeacherTables(loggedUser.userCode);
      }
      return NextResponse.json(loggedUser);
    }

    // User does not exist yet — generate a globally unique 6-digit code and insert
    let attempts = 0;
    let insertedUser = null;
    while (attempts < 10 && !insertedUser) {
      attempts++;
      const userId = role === 'admin' ? `admin-${Date.now()}` : `user-${Date.now()}-${Math.random().toString(36).slice(2,6)}`;
      const userCode = generateUserCode();
      try {
        const res = await query(`
          INSERT INTO users (id, email, full_name, avatar_url, role, user_code)
          VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING id, email, full_name as "fullName", avatar_url as "avatarUrl", role, user_code as "userCode", 
                    age, phone_number as "phoneNumber", address, college, major, graduation_year as "graduationYear", bio,
                    created_at as "createdAt"
        `, [userId, email, name, avatarUrl || '', role, userCode]);
        if (res.rowCount > 0) {
          insertedUser = res.rows[0];
          break;
        }
      } catch (e) {
        // If unique constraint on user_code failed, retry with a new code
        const msg = String(e.message || e);
        if (msg.includes('unique') || msg.includes('duplicate') || msg.includes('already exists')) {
          // continue to retry
          continue;
        } else {
          throw e;
        }
      }
    }

    if (!insertedUser) {
      return NextResponse.json({ error: 'Failed to create user after multiple attempts' }, { status: 500 });
    }

    if ((insertedUser.role === 'admin' || insertedUser.role === 'teacher') && insertedUser.userCode) {
      await ensureTeacherTables(insertedUser.userCode);
    }

    return NextResponse.json(insertedUser);
  } catch (error) {
    console.error('Auth Login Route Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
