import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

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
    let { id, examId, questionText, options, correctOptionId, subject, topic, marks, orderIndex } = data;
    
    if (!examId || !questionText || !options || !correctOptionId) {
      return NextResponse.json({ error: 'Missing required question fields' }, { status: 400 });
    }

    // Generate ID if not provided
    if (!id) {
      id = `question-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    }

    const res = await query(`
      INSERT INTO questions (id, exam_id, question_text, options, correct_option_id, subject, topic, marks, order_index)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING 
        id, 
        exam_id as "examId", 
        question_text as "questionText", 
        options, 
        correct_option_id as "correctOptionId", 
        subject, 
        topic, 
        marks, 
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
      orderIndex || 0
    ]);

    // Also update question count in exam table
    await query(`
      UPDATE exams 
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
    const { id, ...updates } = data;
    if (!id) {
      return NextResponse.json({ error: 'Question ID is required' }, { status: 400 });
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
        order_index as "orderIndex", 
        created_at as "createdAt"
    `;

    const res = await query(queryText, values);

    if (res.rowCount === 0) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

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
    if (!id) {
      return NextResponse.json({ error: 'Question ID is required' }, { status: 400 });
    }

    // Get the examId first so we can update the exam
    const questionRes = await query('SELECT exam_id FROM questions WHERE id = $1', [id]);
    if (questionRes.rowCount > 0) {
      const examId = questionRes.rows[0].exam_id;
      await query('DELETE FROM questions WHERE id = $1', [id]);
      await query('UPDATE exams SET updated_at = NOW() WHERE id = $1', [examId]);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE Question Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
