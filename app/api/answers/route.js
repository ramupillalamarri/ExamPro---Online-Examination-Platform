import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

const generateId = () => {
  return `answer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export async function POST( req) {
  try {
    let { id, attemptId, questionId, selectedOptionId, descriptiveAnswer } = await req.json();
    if (!attemptId || !questionId) {
      return NextResponse.json({ 
        error: 'Missing required answer fields',
        details: { attemptId, questionId }
      }, { status: 400 });
    }

    if (typeof selectedOptionId === 'string') {
      selectedOptionId = selectedOptionId.trim()
    }
    if (typeof descriptiveAnswer === 'string') {
      descriptiveAnswer = descriptiveAnswer.trim()
    }

    // Verify attempt exists to avoid foreign key trigger violations
    const attemptCheck = await query('SELECT id FROM attempts WHERE id = $1', [attemptId]);
    if (attemptCheck.rowCount === 0) {
      return NextResponse.json({ error: 'Attempt session has expired or been cleared.' }, { status: 401 });
    }

    const answerId = id || generateId();
    const res = await query(`
      INSERT INTO answers (id, attempt_id, question_id, selected_option_id, descriptive_answer)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (attempt_id, question_id) 
      DO UPDATE SET 
        selected_option_id = EXCLUDED.selected_option_id, 
        descriptive_answer = EXCLUDED.descriptive_answer, 
        updated_at = NOW()
      RETURNING 
        id, 
        attempt_id as "attemptId", 
        question_id as "questionId", 
        selected_option_id as "selectedOptionId", 
        descriptive_answer as "descriptiveAnswer", 
        is_correct as "isCorrect", 
        updated_at as "updatedAt"
    `, [answerId, attemptId, questionId, selectedOptionId || null, descriptiveAnswer || null]);

    if (res.rows.length === 0) {
      throw new Error('Failed to save answer');
    }

    return NextResponse.json(res.rows[0]);
  } catch (error) {
    console.error('POST Answer Error:', error);
    return NextResponse.json({ 
      error: error.message,
      message: 'Failed to save answer'
    }, { status: 500 });
  }
}
