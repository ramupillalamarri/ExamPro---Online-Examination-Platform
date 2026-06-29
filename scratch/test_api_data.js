const http = require('http');

const url = 'http://localhost:3000/api/data?userId=admin-1';

http.get(url, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
  
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    try {
      if (res.statusCode === 200) {
        const json = JSON.parse(body);
        console.log("SUCCESS!");
        console.log("Folders count:", json.folders ? json.folders.length : 'none');
        console.log("Exams count:", json.exams ? json.exams.length : 'none');
        console.log("Questions count:", json.questions ? json.questions.length : 'none');
        console.log("Attempts count:", json.attempts ? json.attempts.length : 'none');
      } else {
        console.log("ERROR BODY:", body);
      }
    } catch (e) {
      console.log("Failed to parse response:", e.message);
      console.log("RAW BODY:", body.substring(0, 500));
    }
  });
}).on('error', (e) => {
  console.error(`Request failed: ${e.message}`);
});
