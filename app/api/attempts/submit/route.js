import { NextResponse } from 'next/server';
import { query, getExamById } from '@/lib/db';

export async function POST( req) {
  try {
    const { attemptId } = await req.json();
    if (!attemptId) {
      return NextResponse.json({ error: 'Attempt ID is required' }, { status: 400 });
    }

    // 1. Fetch the attempt details
    const attemptRes = await query('SELECT * FROM attempts WHERE id = $1', [attemptId]);
    if (attemptRes.rowCount === 0) {
      return NextResponse.json({ error: 'Attempt not found' }, { status: 404 });
    }
    const attempt = attemptRes.rows[0];

    // 2. Fetch the exam details
    const examInfo = await getExamById(attempt.exam_id);
    if (!examInfo) {
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
    }
    const exam = examInfo.exam;

    // 3. Fetch all questions for this exam
    const questionsRes = await query('SELECT * FROM questions WHERE exam_id = $1', [attempt.exam_id]);
    const questions = questionsRes.rows;

    // 4. Fetch all student answers for this attempt
    const answersRes = await query('SELECT * FROM answers WHERE attempt_id = $1', [attemptId]);
    const answers = answersRes.rows;

    let score = 0;
    const totalMarks = questions.reduce((sum, q) => sum + (q.marks || 2), 0);

    const normalizeOptionId = (value) => {
      return typeof value === 'string' ? value.trim().toLowerCase() : '';
    };

    const normalizeOptionSet = (value) => {
      return new Set(
        (typeof value === 'string' ? value : '')
          .split(',')
          .map((item) => item.trim().toLowerCase())
          .filter(Boolean)
      );
    };

    const hasSelectedOption = (value) => {
      return normalizeOptionId(value).length > 0;
    };

    const areMsqAnswersEqual = (correctOptionId, selectedOptionId) => {
      const correctSet = normalizeOptionSet(correctOptionId);
      const selectedSet = normalizeOptionSet(selectedOptionId);
      if (correctSet.size !== selectedSet.size) return false;
      for (const optionId of correctSet) {
        if (!selectedSet.has(optionId)) return false;
      }
      return true;
    };

    // 5. Grade each answer
    const answersToUpdate = [];
    for (const answer of answers) {
      const question = questions.find((q) => q.id === answer.question_id);
      if (!question) continue;

      let isCorrect = false;
      if (question.question_type === 'text') {
        isCorrect = null; // Descriptive answers are ungraded (pending manual review)
      } else if (question.question_type === 'msq') {
        isCorrect = areMsqAnswersEqual(question.correct_option_id, answer.selected_option_id);
      } else {
        isCorrect = normalizeOptionId(answer.selected_option_id) === normalizeOptionId(question.correct_option_id);
      }
      
      answer.is_correct = isCorrect;
      answersToUpdate.push({ id: answer.id, isCorrect });

      if (isCorrect === true) {
        score += (question.marks || 2);
      } else if (isCorrect === false && hasSelectedOption(answer.selected_option_id)) {
        const negMarking = question.negative_marking !== undefined && question.negative_marking !== null
          ? parseFloat(question.negative_marking)
          : (exam.negative_marking ? parseFloat(exam.negative_marking) : 0);
        if (negMarking > 0) {
          score -= (question.marks || 2) * negMarking;
        }
      }
    }

    // Perform bulk update in a single query
    if (answersToUpdate.length > 0) {
      const caseParts = [];
      const ids = [];
      const params = [];
      let idx = 1;
      for (const ans of answersToUpdate) {
        // Cast the boolean parameter explicitly to avoid type inference issues
        caseParts.push(`WHEN $${idx} THEN $${idx + 1}::boolean`);
        params.push(ans.id, ans.isCorrect);
        ids.push(`$${idx}`);
        idx += 2;
      }
      const bulkQuery = `
        UPDATE answers
        SET is_correct = CASE id
          ${caseParts.join('\n')}
        END
        WHERE id IN (${ids.join(', ')})
      `;
      await query(bulkQuery, params);
    }

    score = Math.max(0, score);

    // 6. Update attempt in DB first
    const updatedAttemptRes = await query(`
      UPDATE attempts 
      SET 
        status = 'graded', 
        submitted_at = NOW(), 
        score = $1, 
        total_marks = $2
      WHERE id = $3
      RETURNING 
        id, 
        exam_id as "examId", 
        user_id as "userId", 
        status, 
        started_at as "startedAt", 
        submitted_at as "submittedAt", 
        score::numeric::double precision as "score", 
        total_marks as "totalMarks", 
        rank, 
        warnings
    `, [score, totalMarks, attemptId]);

    const updatedAttempt = updatedAttemptRes.rows[0];

    // 7. Recompute ranking for all graded attempts in this exam based on score desc, time asc
    await query(`
      WITH ranked AS (
        SELECT
          id,
          ROW_NUMBER() OVER (
            ORDER BY score DESC, submitted_at ASC, started_at ASC, id ASC
          ) AS computed_rank
        FROM attempts
        WHERE exam_id = $1 AND status = 'graded'
      )
      UPDATE attempts
      SET rank = ranked.computed_rank
      FROM ranked
      WHERE attempts.id = ranked.id
    `, [attempt.exam_id]);

    const finalAttemptRes = await query(`
      SELECT 
        id, 
        exam_id as "examId", 
        user_id as "userId", 
        status, 
        started_at as "startedAt", 
        submitted_at as "submittedAt", 
        score::numeric::double precision as "score", 
        total_marks as "totalMarks", 
        rank, 
        warnings
      FROM attempts
      WHERE id = $1
    `, [attemptId]);

    const finalAttempt = finalAttemptRes.rows[0];

    // 7. Generate AI Feedback
    const wrongAnswers = answers.filter((ans) => {
      const q = questions.find((qi) => qi.id === ans.question_id);
      if (q?.question_type === 'text') return false;
      return ans.is_correct === false;
    });

    const mistakeAnalysis = wrongAnswers.map((ans) => {
      const q = questions.find((qi) => qi.id === ans.question_id);
      if (!q) return null;
      
      // Parse options if they're stored as JSON string
      const options = typeof q.options === 'string' ? JSON.parse(q.options) : q.options || [];
      
      let selectedText = '';
      let correctText = '';
      
      if (q.question_type === 'msq') {
        const selectedIds = (ans.selected_option_id || '').split(',').map((id) => id.trim()).filter(Boolean);
        const correctIds = (q.correct_option_id || '').split(',').map((id) => id.trim()).filter(Boolean);
        
        const selectedLabels = selectedIds.map(id => {
          const opt = options.find(o => o.id === id);
          return opt?.text ? `"${opt.text}"` : id.toUpperCase();
        });
        const correctLabels = correctIds.map(id => {
          const opt = options.find(o => o.id === id);
          return opt?.text ? `"${opt.text}"` : id.toUpperCase();
        });
        
        selectedText = selectedLabels.join(', ') || 'None';
        correctText = correctLabels.join(', ');
      } else {
        const selected = options.find((o) => o.id === ans.selected_option_id);
        const correct = options.find((o) => o.id === q.correct_option_id);
        selectedText = selected?.text ? `"${selected.text}"` : (ans.selected_option_id || 'None').toUpperCase();
        correctText = correct?.text ? `"${correct.text}"` : (q.correct_option_id || '').toUpperCase();
      }
      
      return {
        questionId: ans.question_id,
        explanation: `You selected ${selectedText} but the correct answer is ${correctText}. ${
          q.topic ? `This question tests your understanding of ${q.topic}.` : ''
        } Review the concept and practice similar problems.`
      };
    }).filter(Boolean);

    // Group wrong answers by topic to find weak areas
    const topicCounts = {};
    wrongAnswers.forEach((ans) => {
      const q = questions.find((qi) => qi.id === ans.question_id);
      if (!q) return;
      const topic = (typeof q.topic === 'string' ? q.topic : q.topic) || 'General';
      const subject = (typeof q.subject === 'string' ? q.subject : q.subject) || 'General';
      if (!topicCounts[topic]) {
        topicCounts[topic] = { subject, count: 0 };
      }
      topicCounts[topic].count++;
    });

    const weakTopics = Object.entries(topicCounts).map(([topic, data]) => ({
      topic,
      subject: data.subject,
      questionCount: data.count,
      recommendation: `Focus on practicing more ${topic} problems to strengthen your understanding.`
    }));

    // Store AI Feedback in DB
    const feedbackId = Math.random().toString(36).substring(2, 15);
    await query(`
      INSERT INTO ai_feedback (id, attempt_id, mistake_analysis, weak_topics)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (id) DO NOTHING
    `, [feedbackId, attemptId, JSON.stringify(mistakeAnalysis), JSON.stringify(weakTopics)]);

    // Fetch all updated attempts for this exam to return in response so the student's rankings sync immediately
    const updatedAttemptsRes = await query(`
      SELECT 
        a.id, 
        a.exam_id as "examId", 
        a.user_id as "userId", 
        a.status, 
        a.started_at as "startedAt", 
        a.submitted_at as "submittedAt", 
        a.score::numeric::double precision as "score", 
        a.total_marks as "totalMarks", 
        a.rank, 
        a.warnings
      FROM attempts a
      WHERE a.exam_id = $1
    `, [attempt.exam_id]);

    const updatedAttempts = updatedAttemptsRes.rows.map(attRow => ({
      ...attRow,
      examTitle: exam.title
    }));

    return NextResponse.json({
      success: true,
      attempt: {
        ...finalAttempt,
        examTitle: exam.title
      },
      updatedAttempts,
      answers: answers.map((ans) => ({
        id: ans.id,
        attemptId: ans.attempt_id,
        questionId: ans.question_id,
        selectedOptionId: ans.selected_option_id,
        descriptiveAnswer: ans.descriptive_answer,
        isCorrect: ans.is_correct,
        updatedAt: ans.updated_at,
      })),
      feedback: {
        id: feedbackId,
        attemptId,
        mistakeAnalysis,
        weakTopics,
        createdAt: new Date()
      }
    });
  } catch (error) {
    console.error('Submit Attempt Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
