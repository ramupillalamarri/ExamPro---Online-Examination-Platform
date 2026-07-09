// use global fetch

async function test() {
  try {
    console.log('Fetching /admin/exams...');
    const res1 = await fetch('http://localhost:3000/admin/exams');
    console.log('/admin/exams status:', res1.status);
    const text1 = await res1.text();
    if (text1.includes('Application error') || text1.includes('Internal Server Error')) {
      console.log('Error found in /admin/exams response!');
    }

    console.log('Fetching /admin/students...');
    const res2 = await fetch('http://localhost:3000/admin/students');
    console.log('/admin/students status:', res2.status);
    const text2 = await res2.text();
    if (text2.includes('Application error') || text2.includes('Internal Server Error')) {
      console.log('Error found in /admin/students response!');
    }
  } catch (e) {
    console.error('Request failed:', e.message);
  }
}

setTimeout(test, 2000);
