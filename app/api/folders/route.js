import { NextResponse } from 'next/server';
import { query, ensureTeacherTables } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const userCode = searchParams.get('userCode');

    let targetUserCode = userCode;

    if (userId) {
      const userRes = await query('SELECT user_code, role FROM users WHERE id = $1', [userId]);
      if (userRes.rowCount > 0) {
        const role = userRes.rows[0].role;
        if (role === 'teacher' || role === 'admin') {
          targetUserCode = userRes.rows[0].user_code;
        }
      }
    }

    if (!targetUserCode) {
      targetUserCode = '455770'; // default code for student
    }

    const safeCode = targetUserCode.replace(/[^a-zA-Z0-9_]/g, '');
    await ensureTeacherTables(targetUserCode);

    const res = await query(`
      SELECT f.*, COALESCE(e.exam_count, 0)::integer as "examCount" 
      FROM folders_${safeCode} f 
      LEFT JOIN (
        SELECT folder_id, COUNT(*) as exam_count
        FROM exams_${safeCode}
        GROUP BY folder_id
      ) e ON f.id = e.folder_id
      ORDER BY f.created_at DESC
    `);
    
    return NextResponse.json(res.rows);
  } catch (error) {
    console.error('GET Folders Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { id, name, createdBy, parentId } = await req.json();
    if (!name || !createdBy) {
      return NextResponse.json({ error: 'Folder name and Creator ID are required' }, { status: 400 });
    }

    const userRes = await query('SELECT user_code FROM users WHERE id = $1', [createdBy]);
    const userCode = userRes.rows[0]?.user_code || '455770';
    const safeCode = userCode.replace(/[^a-zA-Z0-9_]/g, '');
    await ensureTeacherTables(userCode);

    const res = await query(
      `INSERT INTO folders_${safeCode} (id, name, created_by, parent_id) VALUES ($1, $2, $3, $4) RETURNING *`,
      [id, name, createdBy, parentId || null]
    );

    const folder = res.rows[0];
    return NextResponse.json({
      ...folder,
      examCount: 0
    });
  } catch (error) {
    console.error('POST Folder Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const { id, name, userId } = await req.json();
    if (!id || !name || !userId) {
      return NextResponse.json({ error: 'Folder ID, Name, and User ID are required' }, { status: 400 });
    }

    const userRes = await query('SELECT user_code FROM users WHERE id = $1', [userId]);
    const userCode = userRes.rows[0]?.user_code || '455770';
    const safeCode = userCode.replace(/[^a-zA-Z0-9_]/g, '');
    await ensureTeacherTables(userCode);

    const res = await query(
      `UPDATE folders_${safeCode} SET name = $1 WHERE id = $2 RETURNING *`,
      [name, id]
    );

    if (res.rowCount === 0) {
      return NextResponse.json({ error: 'Folder not found' }, { status: 404 });
    }

    return NextResponse.json(res.rows[0]);
  } catch (error) {
    console.error('PUT Folder Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const userId = searchParams.get('userId');
    const deleteExams = searchParams.get('deleteExams') === 'true';

    if (!id || !userId) {
      return NextResponse.json({ error: 'Folder ID and User ID are required' }, { status: 400 });
    }

    const userRes = await query('SELECT user_code FROM users WHERE id = $1', [userId]);
    const userCode = userRes.rows[0]?.user_code || '455770';
    const safeCode = userCode.replace(/[^a-zA-Z0-9_]/g, '');

    if (deleteExams) {
      // 1. Get all recursively nested folder IDs (including the deleted folder itself)
      const foldersRes = await query(`
        WITH RECURSIVE subfolders AS (
          SELECT id FROM folders_${safeCode} WHERE id = $1
          UNION ALL
          SELECT f.id FROM folders_${safeCode} f
          JOIN subfolders sf ON f.parent_id = sf.id
        )
        SELECT id FROM subfolders
      `, [id]);
      
      const folderIds = foldersRes.rows.map(row => row.id);

      if (folderIds.length > 0) {
        // 2. Get all exam IDs belonging to these folders
        const examsRes = await query(`
          SELECT id FROM exams_${safeCode} WHERE folder_id = ANY($1)
        `, [folderIds]);
        
        const examIds = examsRes.rows.map(row => row.id);

        if (examIds.length > 0) {
          // 3. Cascade delete associated questions and attempts
          await query('DELETE FROM questions WHERE exam_id = ANY($1)', [examIds]);
          await query('DELETE FROM attempts WHERE exam_id = ANY($1)', [examIds]);
          
          // 4. Delete the exams themselves
          await query(`DELETE FROM exams_${safeCode} WHERE folder_id = ANY($1)`, [folderIds]);
        }
      }
    }

    await query(`DELETE FROM folders_${safeCode} WHERE id = $1`, [id]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE Folder Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
