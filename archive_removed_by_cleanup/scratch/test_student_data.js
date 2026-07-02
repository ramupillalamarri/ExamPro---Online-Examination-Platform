const http = require('http');

const url = 'http://localhost:3000/api/data?userId=user-1780666632587-bp2r&userCode=455770';

http.get(url, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    try {
      const json = JSON.parse(body);
      console.log("Exams count:", json.exams ? json.exams.length : 'none');
      if (json.exams) {
        console.table(json.exams.map(e => ({ id: e.id, title: e.title })));
      }
    } catch (e) {
      console.log("Failed:", e.message);
    }
  });
});
