import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

const generateId = () => {
  return `answer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export async function POST( req) {
  try {
    const { id, attemptId, questionId, selectedOptionId } = await req.json();
    if (!attemptId || !questionId || selectedOptionId === undefined) {
      return NextResponse.json({ 
        error: 'Missing required answer fields',
        details: { attemptId, questionId, selectedOptionId }
      }, { status: 400 });
    }

    const answerId = id || generateId();
    const res = await query(`
      INSERT INTO answers (id, attempt_id, question_id, selected_option_id)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (attempt_id, question_id) 
      DO UPDATE SET selected_option_id = EXCLUDED.selected_option_id, updated_at = NOW()
      RETURNING 
        id, 
        attempt_id as "attemptId", 
        question_id as "questionId", 
        selected_option_id as "selectedOptionId", 
        is_correct as "isCorrect", 
        updated_at as "updatedAt"
    `, [answerId, attemptId, questionId, selectedOptionId]);

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
