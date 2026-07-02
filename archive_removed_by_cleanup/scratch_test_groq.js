const Groq = require('groq-sdk');
const fs = require('fs');
const path = require('path');

// Basic manual env file loader
try {
  const envPath = path.join(__dirname, '.env.local');
  if (fs.existsSync(envPath)) {
    const envFile = fs.readFileSync(envPath, 'utf8');
    envFile.split('\n').forEach(line => {
      const parts = line.split('=');
      if (parts.length >= 2) {
        const key = parts[0].trim();
        const val = parts.slice(1).join('=').trim().replace(/['"]/g, '');
        if (key && !key.startsWith('#')) {
          process.env[key] = val;
        }
      }
    });
  }
} catch (e) {
  console.error('Error loading env file:', e);
}

const apiKey = process.env.GROQ_API_KEY;
console.log('Testing Groq with API key starting with:', apiKey ? apiKey.substring(0, 10) + '...' : 'undefined');

async function test() {
  try {
    const groq = new Groq({ apiKey });
    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: 'Hello, respond in 5 words.' }],
      model: 'llama-3.1-8b-instant',
    });
    console.log('SUCCESS!');
    console.log('Response:', completion.choices[0].message.content);
  } catch (err) {
    console.error('FAILED with error details:');
    console.error(err);
  }
}

test();
