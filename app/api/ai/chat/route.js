import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

export async function POST(req) {
  try {
    const payload = await req.json();
    const message = payload.message || payload.userDoubt || '';
    const question = payload.question || {
      id: payload.questionId || payload.id,
      questionText: payload.questionText,
      options: payload.options,
      correctOptionId: payload.correctOptionId,
      topic: payload.topic,
      subject: payload.subject,
    };
    const chatHistory = Array.isArray(payload.chatHistory) ? payload.chatHistory : [];

    if (!message || !question || !question.questionText || !question.options) {
      return NextResponse.json({ error: 'Message and Question are required' }, { status: 400 });
    }

    const { id: questionId, questionText, options, correctOptionId, topic, subject } = question;
    const correctOption = options?.find((option) => option.id === correctOptionId) || {};
    const apiKey = process.env.GROQ_API_KEY;
    const groqModel = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';
    let groqError = null;

    if (apiKey) {
      try {
        // Enforce a 15-second timeout so it succeeds reliably on standard networks
        const groq = new Groq({ apiKey, timeout: 15000 });

        const historyMessages = chatHistory
          .filter((entry) => entry && entry.role && entry.content)
          .map((entry) => ({ role: entry.role, content: entry.content }));

        const systemPrompt = `You are a helpful, encouraging AI Exam Tutor. A student is asking a question about a specific exam problem.

Question: "${questionText}"
Subject: ${subject || 'General'}
Topic: ${topic || 'General'}
Options:
${options.map((option) => `- Option ${option.id.toUpperCase()}: ${option.text}`).join('\n')}
Correct Option: Option ${correctOptionId.toUpperCase()} (${correctOption?.text || 'N/A'})

When answering, provide a detailed, step-by-step explanation and clarify the reasoning. Use markdown formatting and LaTeX for math where appropriate. Keep the response student-friendly, accurate, and focused on the student's question.`;

        const messages = [
          { role: 'system', content: systemPrompt },
          ...historyMessages,
          { role: 'user', content: message },
        ];

        const completion = await groq.chat.completions.create({
          messages,
          model: groqModel,
          temperature: 0.6,
        });

        const text = completion.choices?.[0]?.message?.content || '';
        return NextResponse.json({ response: text, explanation: text, usedGroq: true, groqModel });
      } catch (err) {
        groqError = err instanceof Error ? err.message : String(err);
        console.error('Groq API call failed:', err);
      }
    }

    const responseText = `I couldn't reach the Groq tutor right now. Here is a fallback explanation based on the provided question and your doubt.\n\nQuestion: "${questionText}"\nTopic: ${topic || 'General'}\nYour doubt: "${message}"\n\nThe correct answer is Option ${correctOptionId.toUpperCase()}${correctOption?.text ? ` (${correctOption.text})` : ''}.\n\nIf you want, I can help you walk through the specific step that feels unclear.`;

    return NextResponse.json({ response: responseText, explanation: responseText, usedGroq: false, groqModel, groqError });
  } catch (error) {
    console.error('AI Chat Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
