const { query } = require('./src/config/db');

async function findUser() {
  try {
    const res = await query('SELECT email FROM usuarios LIMIT 1');
    if (res.rows.length > 0) {
      console.log('USER_FOUND:' + res.rows[0].email);
    } else {
      console.log('NO_USER_FOUND');
    }
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

findUser();
