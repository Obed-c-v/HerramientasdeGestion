require('dotenv').config({ path: './backend/S_park_api/.env' });
const { pool } = require('./backend/S_park_api/src/config/db');
async function check() {
  try {
    const res = await pool.query("SELECT * FROM medicos LIMIT 1");
    console.log('Columns in medicos:', Object.keys(res.rows[0] || {}));
    process.exit(0);
  } catch (err) {
    console.error('Error checking medicos table:', err.message);
    process.exit(1);
  }
}
check();
