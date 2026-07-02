const http = require('http');

function testUrl(url) {
  return new Promise((resolve) => {
    http.get(url, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        resolve({ status: res.statusCode, body });
      });
    }).on('error', (e) => {
      resolve({ status: 500, body: e.message });
    });
  });
}

async function main() {
  const r1 = await testUrl('http://localhost:3000/api/exams?userCode=455770');
  console.log('API Exams Status:', r1.status);
  try {
    const json = JSON.parse(r1.body);
    console.log('Exams count:', json.exams ? json.exams.length : 'none');
    if (json.exams) {
      console.table(json.exams.map(e => ({ id: e.id, title: e.title, isPublished: e.isPublished, qCount: e.questionCount })));
    }
  } catch (e) {
    console.log('Exams parsing failed:', e.message, r1.body.substring(0, 300));
  }

  const r2 = await testUrl('http://localhost:3000/api/folders?userCode=455770');
  console.log('API Folders Status:', r2.status);
  try {
    const json = JSON.parse(r2.body);
    console.log('Folders count:', json ? json.length : 'none');
    if (json) {
      console.table(json.map(f => ({ id: f.id, name: f.name })));
    }
  } catch (e) {
    console.log('Folders parsing failed:', e.message, r2.body.substring(0, 300));
  }
}

main();
