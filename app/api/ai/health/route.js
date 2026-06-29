import { NextResponse } from 'next/server';
import { getLastError } from '../state';

export async function GET() {
  try {
    const groqKey = !!process.env.GROQ_API_KEY;
    const ocrKey = !!process.env.OCR_SPACE_API_KEY;
    return NextResponse.json({ groqApiKeyPresent: groqKey, ocrKeyPresent: ocrKey, lastGroqError: getLastError() || null });
  } catch (err) {
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}
