const { query } = require('./backend/S_park_api/src/config/db');
query("SELECT column_name FROM information_schema.columns WHERE table_name = 'medicos'")
  .then(res => {
    console.log('Columns in medicos:');
    console.log(res.rows.map(r => r.column_name));
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
