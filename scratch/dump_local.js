const { Pool } = require('pg');
const fs = require('fs');

const localConfig = {
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'online_exam_final',
  password: process.env.DB_PASSWORD || 'Ramu.179',
  port: parseInt(process.env.DB_PORT || '5432'),
};

async function dumpLocal() {
  console.log('Connecting to local database to dump data...');
  const pool = new Pool(localConfig);

  try {
    // 1. Scan public tables
    const tablesRes = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    const tables = tablesRes.rows.map(r => r.table_name);
    console.log('Found tables to dump:', tables);

    const dumpData = {};

    for (const table of tables) {
      // Get column list
      const schemaRes = await pool.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = $1 AND table_schema = 'public'
      `, [table]);
      const columns = schemaRes.rows.map(c => c.column_name);

      // Get rows
      const rowsRes = await pool.query(`SELECT * FROM ${table}`);
      dumpData[table] = {
        columns,
        rows: rowsRes.rows
      };
      console.log(`Dumped ${rowsRes.rowCount} rows from ${table}`);
    }

    fs.writeFileSync('scratch/local_dump.json', JSON.stringify(dumpData, null, 2));
    console.log('Successfully wrote dump to scratch/local_dump.json!');
  } catch (err) {
    console.error('Dump failed:', err);
  } finally {
    await pool.end();
  }
}

dumpLocal();
