import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import { setLastError } from '../state';

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

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const { id: questionId, questionText, options, correctOptionId, topic, subject } = question || {};
    const safeOptions = Array.isArray(options) ? options : [];
    const correctOption = safeOptions.find((option) => option.id === correctOptionId) || {};
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

        const formatImageForPrompt = (label, imageUrl) => {
          if (!imageUrl) return '';
          return `\n${label}: ![${label}](${imageUrl})\n${imageUrl}`;
        };

        // Try to fetch image URLs that look like text/SVG and extract any embedded text (basic).
        // For raster images (png/jpg), if an OCR API key is provided, call OCR.space as a fallback.
        const tryExtractTextFromImage = async (imageUrl) => {
          if (!imageUrl || typeof imageUrl !== 'string') return '';
          try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 5000);
            const resp = await fetch(imageUrl, { signal: controller.signal });
            clearTimeout(timeout);
            const contentType = resp.headers.get('content-type') || '';
            if (contentType.includes('svg') || contentType.startsWith('text') || contentType.includes('xml')) {
              const body = await resp.text();
              // crude SVG/text extraction: look for <text> tags or plain text
              const texts = [];
              let m;
              const re = /<text[^>]*>(.*?)<\/text>/gi;
              while ((m = re.exec(body)) !== null) {
                texts.push(m[1].replace(/<[^>]+>/g, '').trim());
              }
              if (texts.length) return texts.join('\n');
              // fallback: strip tags and return any remaining text
              const stripped = body.replace(/<[^>]+>/g, '').trim();
              return stripped.slice(0, 1000);
            }

            // If it's a raster image (png/jpg), try OCR.space when configured
            if (contentType.includes('image') && process.env.OCR_SPACE_API_KEY) {
              try {
                const ocrResp = await fetch('https://api.ocr.space/parse/imageurl', {
                  method: 'POST',
                  headers: { 'apikey': process.env.OCR_SPACE_API_KEY, 'Accept': 'application/json' },
                  body: new URLSearchParams({
                    apikey: process.env.OCR_SPACE_API_KEY,
                    url: imageUrl,
                    isOverlayRequired: 'false',
                    OCREngine: '2'
                  })
                });
                const ocrJson = await ocrResp.json();
                const parsed = (ocrJson.ParsedResults && ocrJson.ParsedResults[0] && ocrJson.ParsedResults[0].ParsedText) || '';
                if (parsed && parsed.trim()) return parsed.trim().slice(0, 2000);
              } catch (ocrErr) {
                console.warn('OCR.space call failed', ocrErr?.message || ocrErr);
              }
            }
          } catch (e) {
            // ignore network/timeout errors
            console.warn('Image extract failed', imageUrl, e?.message || e);
          }
          return '';
        };

        const formattedQuestionImage = formatImageForPrompt('Question Image', question.questionImage);
        const extractedQuestionImageText = await tryExtractTextFromImage(question.questionImage);
        const formattedOptions = (Array.isArray(options) ? options : [])
          .map((option) => {
            const optionText = option.text || 'No text provided';
            const optionImage = option.imageUrl ? formatImageForPrompt(`Option ${option.id.toUpperCase()} Image`, option.imageUrl) : '';
            return `- Option ${option.id.toUpperCase()}: ${optionText}${optionImage}`;
          })
          .join('\n');

        // If question details are missing, provide a generic tutoring prompt
        const questionLine = questionText ? `Question: "${questionText}"\n${formattedQuestionImage}` : '';
        const subjectLine = `Subject: ${subject || 'General'}`;
        const topicLine = `Topic: ${topic || 'General'}`;
        const optionsLine = formattedOptions ? `Options:\n${formattedOptions}` : '';
        const correctOptionLine = correctOptionId ? `Correct Option: Option ${String(correctOptionId).toUpperCase()} (${correctOption?.text || 'N/A'})` : '';

        // If we managed to extract text from the question image or any option images, include it explicitly
        const extractedParts = [];
        if (extractedQuestionImageText) extractedParts.push(`Extracted text from question image:\n${extractedQuestionImageText}`);
        // try extracting from option images too (best-effort)
        const extractedOptionTexts = await Promise.all(safeOptions.map((opt) => tryExtractTextFromImage(opt.imageUrl)));
        extractedOptionTexts.forEach((t, i) => { if (t) extractedParts.push(`Extracted from option ${safeOptions[i].id}:\n${t}`); });

        const extractionBlock = extractedParts.length ? `\nEXTRACTED_IMAGE_TEXT:\n${extractedParts.join('\n\n')}` : '';

        const systemPrompt = `You are a helpful, encouraging AI Exam Tutor. A student is asking a question about an exam problem.\n\n${questionLine}\n${subjectLine}\n${topicLine}\n${optionsLine}\n${correctOptionLine}${extractionBlock}\n\nWhen answering, provide a detailed, step-by-step explanation and clarify the reasoning. Use markdown formatting and LaTeX for math where appropriate. If images are present, analyze them and extract any visible text, diagrams, or cues useful for solving the problem. Keep the response student-friendly, accurate, and focused on the student's question.`;

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
        // clear last recorded error on success
        try { setLastError(null); } catch (e) { /* ignore */ }
        return NextResponse.json({ response: text, explanation: text, usedGroq: true, groqModel });
      } catch (err) {
        groqError = err instanceof Error ? err.message : String(err);
        try { setLastError(groqError); } catch (e) { /* ignore */ }
        console.error('Groq API call failed:', err);
      }
    }

    const responseText = `I couldn't reach the Groq tutor right now. Here is a fallback explanation based on the provided question and your doubt.\n\nQuestion: "${questionText}"\nTopic: ${topic || 'General'}\nYour doubt: "${message}"\n\nThe correct answer is Option ${correctOptionId.toUpperCase()}${correctOption?.text ? ` (${correctOption.text})` : ''}.\n\nIf you want, I can help you walk through the specific step that feels unclear.`;

    try { setLastError(groqError || 'groq_unavailable'); } catch (e) { /* ignore */ }
    return NextResponse.json({ response: responseText, explanation: responseText, usedGroq: false, groqModel, groqError });
  } catch (error) {
    console.error('AI Chat Error:', error);
    try { setLastError(error?.message || String(error)); } catch (e) { /* ignore */ }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
