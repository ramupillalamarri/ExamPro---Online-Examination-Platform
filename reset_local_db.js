const { Pool } = require('pg');
const fs = require('fs');

let config = {
  user: 'postgres',
  host: 'localhost',
  database: 'online_exam_final',
  password: '',
  port: 5432,
};

// Parse environment configuration
try {
  const envContent = fs.readFileSync('.env.local', 'utf8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const parts = trimmed.split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const val = parts.slice(1).join('=').trim();
      if (key === 'DB_USER') config.user = val;
      if (key === 'DB_HOST') config.host = val;
      if (key === 'DB_NAME') config.database = val;
      if (key === 'DB_PASSWORD') config.password = val;
      if (key === 'DB_PORT') config.port = parseInt(val);
    }
  });
} catch (e) {
  console.log('No .env.local file found, using defaults.');
}

const targetDb = config.database;

async function resetDb() {
  console.log(`Starting clean local database reset for '${targetDb}'...`);
  
  // Connect to default 'postgres' database
  const adminPool = new Pool({
    ...config,
    database: 'postgres'
  });

  try {
    // Kill any active connections to target database to prevent locks
    console.log(`Terminating existing connections to database '${targetDb}'...`);
    await adminPool.query(`
      SELECT pg_terminate_backend(pg_stat_activity.pid)
      FROM pg_stat_activity
      WHERE pg_stat_activity.datname = $1
        AND pid <> pg_backend_pid();
    `, [targetDb]);

    // Drop target database
    console.log(`Dropping database '${targetDb}'...`);
    await adminPool.query(`DROP DATABASE IF EXISTS ${targetDb}`);
    console.log(`Database '${targetDb}' dropped successfully.`);

    // Create new target database
    console.log(`Creating database '${targetDb}'...`);
    await adminPool.query(`CREATE DATABASE ${targetDb}`);
    console.log(`Database '${targetDb}' created successfully!`);

    console.log('\nSUCCESS: Local database is now in a 100% clean, non-deployed state.');
    console.log('Next time you run "npm run dev" and access the app, the schema and mock users will auto-initialize.');
  } catch (err) {
    console.error('\nERROR resetting database:', err.message);
    process.exit(1);
  } finally {
    await adminPool.end();
  }
}

resetDb();
