const { query } = require('./src/config/db');

async function run() {
  try {
    console.log('Seeding default biomarkers...');
    
    // Insert Jitter
    await query(`
      INSERT INTO biomarcadores (id, nombre, unidad, rango_min, rango_max)
      VALUES (1, 'Jitter', '%', 0.0, 1.5)
      ON CONFLICT (id) DO UPDATE 
      SET nombre = EXCLUDED.nombre, unidad = EXCLUDED.unidad, rango_min = EXCLUDED.rango_min, rango_max = EXCLUDED.rango_max;
    `);

    // Insert Shimmer
    await query(`
      INSERT INTO biomarcadores (id, nombre, unidad, rango_min, rango_max)
      VALUES (2, 'Shimmer', '%', 0.0, 5.0)
      ON CONFLICT (id) DO UPDATE 
      SET nombre = EXCLUDED.nombre, unidad = EXCLUDED.unidad, rango_min = EXCLUDED.rango_min, rango_max = EXCLUDED.rango_max;
    `);

    // Insert HNR
    await query(`
      INSERT INTO biomarcadores (id, nombre, unidad, rango_min, rango_max)
      VALUES (3, 'HNR', 'dB', 0.0, 50.0)
      ON CONFLICT (id) DO UPDATE 
      SET nombre = EXCLUDED.nombre, unidad = EXCLUDED.unidad, rango_min = EXCLUDED.rango_min, rango_max = EXCLUDED.rango_max;
    `);

    console.log('Biomarkers seeded successfully!');
    
    const res = await query('SELECT * FROM biomarcadores');
    console.table(res.rows);
    process.exit(0);
  } catch (err) {
    console.error('Error during seeding:', err);
    process.exit(1);
  }
}

run();
