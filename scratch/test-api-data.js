const fs = require('fs');
const path = require('path');

// Manually parse .env.local if it exists
try {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let value = match[2] || '';
        if (value.length > 0 && value.charAt(0) === '"' && value.charAt(value.length - 1) === '"') {
          value = value.substring(1, value.length - 1);
        }
        process.env[key] = value;
      }
    });
  }
} catch (err) {
  console.warn('Error reading .env.local:', err);
}

// Import next/server mock or just run a direct node fetch if server is running
async function main() {
  const userId = 'student-1'; // simulated student ID
  const examId = 't0bgskyjxq'; // our target exam ID
  
  try {
    const url = `http://localhost:3000/api/data?userId=${userId}&examId=${examId}`;
    console.log('Fetching from:', url);
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`Fetch failed with status ${response.status}`);
      return;
    }
    const data = await response.json();
    console.log('API Response received successfully!');
    console.log('Questions returned:', data.questions ? data.questions.length : 0);
    if (data.questions) {
      data.questions.forEach((q, idx) => {
        console.log(`Question ${idx + 1}:`);
        console.log(`- ID: ${q.id}`);
        console.log(`- Text: ${q.questionText ? q.questionText.substring(0, 60) : 'null'}`);
        console.log(`- Type: ${q.questionType}`);
        console.log(`- Image present: ${!!q.questionImage}`);
        if (q.questionImage) {
          console.log(`  Image start: ${q.questionImage.substring(0, 60)}...`);
        }
      });
    }
  } catch (err) {
    console.error('Error during fetch:', err);
  }
}

main();
