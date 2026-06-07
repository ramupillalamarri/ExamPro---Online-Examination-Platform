import { NextResponse } from 'next/server';
import { query, ensureTeacherTables } from '@/lib/db';

export async function GET() {
  try {
    const res = await query(`
      SELECT 
        id, 
        exam_id as "examId", 
        question_text as "questionText", 
        options, 
        correct_option_id as "correctOptionId", 
        subject, 
        topic, 
        marks, 
        negative_marking as "negativeMarking",
        order_index as "orderIndex", 
        created_at as "createdAt"
      FROM questions
      ORDER BY order_index ASC, created_at ASC
    `);
    
    return NextResponse.json(res.rows);
  } catch (error) {
    console.error('GET Questions Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST( req) {
  try {
    const data = await req.json();
    let { id, examId, questionText, options, correctOptionId, subject, topic, marks, negativeMarking, orderIndex, userId } = data;
    
    if (!examId || !questionText || !options || !correctOptionId) {
      return NextResponse.json({ error: 'Missing required question fields' }, { status: 400 });
    }
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const userRes = await query('SELECT user_code, role FROM users WHERE id = $1', [userId]);
    if (userRes.rowCount === 0 || (userRes.rows[0].role !== 'teacher' && userRes.rows[0].role !== 'admin')) {
      return NextResponse.json({ error: 'Unauthorized to add questions' }, { status: 403 });
    }
    const userCode = userRes.rows[0].user_code || '455770';
    const safeCode = userCode.replace(/[^a-zA-Z0-9_]/g, '');
    await ensureTeacherTables(userCode);

    // Verify the exam belongs to this teacher
    const examRes = await query(`SELECT id FROM exams_${safeCode} WHERE id = $1`, [examId]);
    if (examRes.rowCount === 0) {
      return NextResponse.json({ error: 'Exam not found or unauthorized' }, { status: 403 });
    }

    // Generate ID if not provided
    if (!id) {
      id = `question-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    }

    const res = await query(`
      INSERT INTO questions (id, exam_id, question_text, options, correct_option_id, subject, topic, marks, negative_marking, order_index)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING 
      id, 
      exam_id as "examId", 
      question_text as "questionText", 
      options, 
      correct_option_id as "correctOptionId", 
      subject, 
      topic, 
      marks, 
      negative_marking as "negativeMarking",
      order_index as "orderIndex", 
      created_at as "createdAt"
    `, [
      id,
      examId,
      questionText,
      JSON.stringify(options),
      correctOptionId,
      subject || '',
      topic || '',
      marks || 2,
      negativeMarking || 0,
      orderIndex || 0
    ]);

    // Update question count/updated_at in teacher's specific exam table
    await query(`
      UPDATE exams_${safeCode} 
      SET updated_at = NOW() 
      WHERE id = $1
    `, [examId]);

    return NextResponse.json(res.rows[0]);
  } catch (error) {
    console.error('POST Question Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT( req) {
  try {
    const data = await req.json();
    const { id, userId, ...updates } = data;
    if (!id) {
      return NextResponse.json({ error: 'Question ID is required' }, { status: 400 });
    }
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const userRes = await query('SELECT user_code, role FROM users WHERE id = $1', [userId]);
    if (userRes.rowCount === 0 || (userRes.rows[0].role !== 'teacher' && userRes.rows[0].role !== 'admin')) {
      return NextResponse.json({ error: 'Unauthorized to update questions' }, { status: 403 });
    }
    const userCode = userRes.rows[0].user_code || '455770';
    const safeCode = userCode.replace(/[^a-zA-Z0-9_]/g, '');

    const qRes = await query('SELECT exam_id FROM questions WHERE id = $1', [id]);
    if (qRes.rowCount === 0) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }
    const examId = qRes.rows[0].exam_id;

    // Verify exam belongs to teacher
    const examRes = await query(`SELECT id FROM exams_${safeCode} WHERE id = $1`, [examId]);
    if (examRes.rowCount === 0) {
      return NextResponse.json({ error: 'Unauthorized to update this question' }, { status: 403 });
    }

    const setFields = [];
    const values = [];
    let paramIndex = 1;

    const mappings = {
      examId: 'exam_id',
      questionText: 'question_text',
      options: 'options',
      correctOptionId: 'correct_option_id',
      subject: 'subject',
      topic: 'topic',
      marks: 'marks',
      negativeMarking: 'negative_marking',
      orderIndex: 'order_index',
    };

    Object.keys(updates).forEach((key) => {
      const dbCol = mappings[key];
      if (dbCol !== undefined) {
        setFields.push(`${dbCol} = $${paramIndex}`);
        let val = updates[key];
        if (key === 'options') {
          val = JSON.stringify(val);
        }
        values.push(val);
        paramIndex++;
      }
    });

    if (setFields.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    values.push(id);
    const idParamIndex = paramIndex;

    const queryText = `
      UPDATE questions 
      SET ${setFields.join(', ')} 
      WHERE id = $${idParamIndex} 
      RETURNING 
        id, 
        exam_id as "examId", 
        question_text as "questionText", 
        options, 
        correct_option_id as "correctOptionId", 
        subject, 
        topic, 
        marks, 
        negative_marking as "negativeMarking",
        order_index as "orderIndex", 
        created_at as "createdAt"
    `;

    const res = await query(queryText, values);

    if (res.rowCount === 0) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    // Update updated_at in teacher's specific exam table
    await query(`
      UPDATE exams_${safeCode} 
      SET updated_at = NOW() 
      WHERE id = $1
    `, [examId]);

    return NextResponse.json(res.rows[0]);
  } catch (error) {
    console.error('PUT Question Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE( req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const userId = searchParams.get('userId');
    if (!id) {
      return NextResponse.json({ error: 'Question ID is required' }, { status: 400 });
    }
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const userRes = await query('SELECT user_code, role FROM users WHERE id = $1', [userId]);
    if (userRes.rowCount === 0 || (userRes.rows[0].role !== 'teacher' && userRes.rows[0].role !== 'admin')) {
      return NextResponse.json({ error: 'Unauthorized to delete questions' }, { status: 403 });
    }
    const userCode = userRes.rows[0].user_code || '455770';
    const safeCode = userCode.replace(/[^a-zA-Z0-9_]/g, '');

    // Get the examId first so we can update the exam
    const questionRes = await query('SELECT exam_id FROM questions WHERE id = $1', [id]);
    if (questionRes.rowCount > 0) {
      const examId = questionRes.rows[0].exam_id;

      // Verify exam belongs to teacher
      const examRes = await query(`SELECT id FROM exams_${safeCode} WHERE id = $1`, [examId]);
      if (examRes.rowCount === 0) {
        return NextResponse.json({ error: 'Unauthorized to delete this question' }, { status: 403 });
      }

      await query('DELETE FROM questions WHERE id = $1', [id]);
      await query(`UPDATE exams_${safeCode} SET updated_at = NOW() WHERE id = $1`, [examId]);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE Question Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
