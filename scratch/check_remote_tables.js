const { Pool } = require('pg');

const targetUrl = 'postgresql://neondb_owner:npg_zeIf5DqART7J@ep-purple-bread-ao6w9fxs-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require';

async function checkRemote() {
  console.log('Connecting to remote cloud database to check tables...');
  const pool = new Pool({
    connectionString: targetUrl,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const tablesRes = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log('Tables present on cloud:', tablesRes.rows.map(r => r.table_name));

    const checkUsers = await pool.query('SELECT * FROM users').catch(err => ({ error: err.message }));
    if (checkUsers.error) {
      console.log('Users query error:', checkUsers.error);
    } else {
      console.log(`Found ${checkUsers.rows.length} users in cloud DB:`, checkUsers.rows.map(u => ({ id: u.id, email: u.email, role: u.role, user_code: u.user_code })));
    }
  } catch (err) {
    console.error('Check failed:', err);
  } finally {
    await pool.end();
  }
}

checkRemote();
