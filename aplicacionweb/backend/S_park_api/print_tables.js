const { query } = require('./src/config/db');

async function run() {
  try {
    console.log('Adding column "resultado_ia" to table "registros_biomarcador"...');
    await query(`
      ALTER TABLE registros_biomarcador 
      ADD COLUMN IF NOT EXISTS resultado_ia jsonb;
    `);
    console.log('Column added successfully!');

    const colsRes = await query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'registros_biomarcador'
    `);
    console.table(colsRes.rows);
    process.exit(0);
  } catch (err) {
    console.error('Error during migration:', err);
    process.exit(1);
  }
}

run();
