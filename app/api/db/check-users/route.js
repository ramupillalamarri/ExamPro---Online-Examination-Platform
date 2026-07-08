import { NextResponse } from 'next/server';
import { Pool } from 'pg';

export async function GET(request) {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const usersRes = await pool.query('SELECT id, email, role, user_code as "userCode" FROM users');
    const tablesRes = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name LIKE '%_455770' OR table_name LIKE '%_393417' OR table_name LIKE '%_324732'
    `);

    return NextResponse.json({
      users: usersRes.rows,
      dynamicTables: tablesRes.rows.map(r => r.table_name)
    });
  } catch (err) {
    return NextResponse.json({ error: err.message });
  } finally {
    await pool.end();
  }
}
