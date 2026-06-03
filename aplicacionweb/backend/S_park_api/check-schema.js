const { query } = require('./src/config/db');

async function checkSchema() {
  try {
    const res = await query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'pacientes'
    `);
    console.log('TABLE: pacientes');
    console.table(res.rows);

    const res2 = await query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'expedientes'
    `);
    console.log('TABLE: expedientes');
    console.table(res2.rows);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkSchema();
