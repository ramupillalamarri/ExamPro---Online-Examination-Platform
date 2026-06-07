import { NextResponse } from 'next/server';
import { query, ensureTeacherTables } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const userCode = searchParams.get('userCode');
    const userId = searchParams.get('userId');

    let targetUserCode = userCode;
    let isStudent = false;

    if (userId) {
      const userRes = await query('SELECT user_code, role FROM users WHERE id = $1', [userId]);
      if (userRes.rowCount > 0) {
        const role = userRes.rows[0].role;
        if (role === 'teacher' || role === 'admin') {
          targetUserCode = userRes.rows[0].user_code;
        } else {
          isStudent = true;
        }
      }
    } else if (userCode) {
      isStudent = true;
    }

    if (!targetUserCode) {
      targetUserCode = '455770'; // Default code for students
    }

    const safeCode = targetUserCode.replace(/[^a-zA-Z0-9_]/g, '');
    await ensureTeacherTables(targetUserCode);

    let sqlQuery = `
      SELECT 
        e.id, 
        e.title, 
        e.description, 
        e.duration_minutes as "durationMinutes", 
        e.max_attempts as "maxAttempts", 
        e.folder_id as "folderId", 
        e.is_published as "isPublished", 
        e.negative_marking::numeric::double precision as "negativeMarking", 
        e.created_by as "createdBy", 
        e.created_at as "createdAt", 
        e.updated_at as "updatedAt",
        f.name as "folderName",
        COALESCE(q.q_count, 0)::integer as "questionCount",
        COALESCE(a.a_count, 0)::integer as "attemptCount"
      FROM exams_${safeCode} e
      LEFT JOIN folders_${safeCode} f ON e.folder_id = f.id
      LEFT JOIN (
        SELECT exam_id, COUNT(*) as q_count
        FROM questions 
        GROUP BY exam_id
      ) q ON e.id = q.exam_id
      LEFT JOIN (
        SELECT exam_id, COUNT(*) as a_count
        FROM attempts 
        GROUP BY exam_id
      ) a ON e.id = a.exam_id
    `;

    if (isStudent) {
      sqlQuery += ' WHERE e.is_published = true ';
    }

    sqlQuery += ' ORDER BY e.created_at DESC';

    const res = await query(sqlQuery);
    
    return NextResponse.json({
      exams: res.rows,
      count: res.rowCount,
    });
  } catch (error) {
    console.error('GET Exams Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const data = await req.json();
    let { id, title, description, durationMinutes, folderId, isPublished, negativeMarking, createdBy, maxAttempts } = data;
    
    if (!title) {
      return NextResponse.json({ error: 'Exam title is required' }, { status: 400 });
    }

    const userRes = await query('SELECT user_code FROM users WHERE id = $1', [createdBy]);
    const userCode = userRes.rows[0]?.user_code || '455770';
    const safeCode = userCode.replace(/[^a-zA-Z0-9_]/g, '');
    await ensureTeacherTables(userCode);

    // Generate ID if not provided
    if (!id) {
      id = `exam-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    }

    // Get folder name if folderId exists
    let folderName = null;
    if (folderId) {
      const folderRes = await query(`SELECT name FROM folders_${safeCode} WHERE id = $1`, [folderId]);
      if (folderRes.rowCount > 0) {
        folderName = folderRes.rows[0].name;
      }
    }

    const res = await query(`
      INSERT INTO exams_${safeCode} (id, title, description, duration_minutes, folder_id, is_published, negative_marking, created_by, max_attempts)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *, duration_minutes as "durationMinutes", folder_id as "folderId", is_published as "isPublished", negative_marking as "negativeMarking", created_by as "createdBy", created_at as "createdAt", updated_at as "updatedAt", max_attempts as "maxAttempts"
    `, [
      id,
      title,
      description || '',
      durationMinutes || 60,
      folderId || null,
      isPublished ?? false,
      negativeMarking || 0,
      createdBy || 'admin-1',
      maxAttempts !== null && maxAttempts !== undefined ? maxAttempts : 1
    ]);

    const exam = res.rows[0];
    return NextResponse.json({
      ...exam,
      folderName,
      questionCount: 0,
      attemptCount: 0
    });
  } catch (error) {
    console.error('POST Exam Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const data = await req.json();
    const { id, userId, ...updates } = data;
    if (!id || !userId) {
      return NextResponse.json({ error: 'Exam ID and User ID are required' }, { status: 400 });
    }

    const userRes = await query('SELECT user_code FROM users WHERE id = $1', [userId]);
    const userCode = userRes.rows[0]?.user_code || '455770';
    const safeCode = userCode.replace(/[^a-zA-Z0-9_]/g, '');
    await ensureTeacherTables(userCode);

    // Prepare dynamic update query
    const setFields = [];
    const values = [];
    let paramIndex = 1;

    // Map JS properties to database columns
    const mappings = {
      title: 'title',
      description: 'description',
      durationMinutes: 'duration_minutes',
      folderId: 'folder_id',
      isPublished: 'is_published',
      negativeMarking: 'negative_marking',
      createdBy: 'created_by',
      maxAttempts: 'max_attempts',
    };

    Object.keys(updates).forEach((key) => {
      const dbCol = mappings[key];
      if (dbCol !== undefined) {
        setFields.push(`${dbCol} = $${paramIndex}`);
        values.push(updates[key]);
        paramIndex++;
      }
    });

    if (setFields.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    // Add updated_at
    setFields.push(`updated_at = NOW()`);

    values.push(id);
    const idParamIndex = paramIndex;

    const queryText = `
      UPDATE exams_${safeCode} 
      SET ${setFields.join(', ')} 
      WHERE id = $${idParamIndex} 
      RETURNING *, duration_minutes as "durationMinutes", folder_id as "folderId", is_published as "isPublished", negative_marking as "negativeMarking", created_by as "createdBy", created_at as "createdAt", updated_at as "updatedAt", max_attempts as "maxAttempts"
    `;

    const res = await query(queryText, values);

    if (res.rowCount === 0) {
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
    }

    const exam = res.rows[0];

    // Fetch folder name
    let folderName = null;
    if (exam.folderId) {
      const folderRes = await query(`SELECT name FROM folders_${safeCode} WHERE id = $1`, [exam.folderId]);
      if (folderRes.rowCount > 0) {
        folderName = folderRes.rows[0].name;
      }
    }

    // Get question and attempt counts
    const qCountRes = await query('SELECT COUNT(*)::integer FROM questions WHERE exam_id = $1', [id]);
    const aCountRes = await query('SELECT COUNT(*)::integer FROM attempts WHERE exam_id = $1', [id]);

    return NextResponse.json({
      ...exam,
      folderName,
      questionCount: qCountRes.rows[0].count,
      attemptCount: aCountRes.rows[0].count
    });
  } catch (error) {
    console.error('PUT Exam Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const userId = searchParams.get('userId');
    if (!id || !userId) {
      return NextResponse.json({ error: 'Exam ID and User ID are required' }, { status: 400 });
    }

    const userRes = await query('SELECT user_code FROM users WHERE id = $1', [userId]);
    const userCode = userRes.rows[0]?.user_code || '455770';
    const safeCode = userCode.replace(/[^a-zA-Z0-9_]/g, '');

    await query(`DELETE FROM exams_${safeCode} WHERE id = $1`, [id]);

    // Cascade delete questions and attempts
    await query('DELETE FROM questions WHERE exam_id = $1', [id]);
    await query('DELETE FROM attempts WHERE exam_id = $1', [id]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE Exam Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
