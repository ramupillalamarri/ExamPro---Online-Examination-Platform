const fs = require('fs');
const path = require('path');

// Parse .env.local file
try {
  const envPath = path.resolve('c:/ramu/project/online exam git clone/online-exam-platform-final/.env.local');
  const dotenvContent = fs.readFileSync(envPath, 'utf8');
  dotenvContent.split(/\r?\n/).forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx > 0) {
      const key = trimmed.substring(0, eqIdx).trim();
      const val = trimmed.substring(eqIdx + 1).trim().replace(/^['"]|['"]$/g, '');
      process.env[key] = val;
    }
  });
} catch (err) {
  console.warn('Could not read .env.local file:', err.message);
}

// Dynamically import db.js using relative path
import('../lib/db.js')
  .then(async (m) => {
    console.log('Starting DB migration and initialization...');
    await m.initializeDatabase();
    console.log('Database initialization complete!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
  });
