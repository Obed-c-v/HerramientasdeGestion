const { query } = require('./src/config/db');
const { hashPassword } = require('./src/utils/hash');

async function seedAdmin() {
  try {
    // 1. Check if roles exist
    const roleCheck = await query('SELECT id FROM roles WHERE nombre = $1', ['ADMIN']);
    let adminRoleId;
    if (roleCheck.rows.length === 0) {
      const roleRes = await query('INSERT INTO roles (nombre) VALUES ($1) RETURNING id', ['ADMIN']);
      adminRoleId = roleRes.rows[0].id;
      await query('INSERT INTO roles (nombre) VALUES ($1)', ['MEDICO']);
      await query('INSERT INTO roles (nombre) VALUES ($1)', ['PACIENTE']);
    } else {
      adminRoleId = roleCheck.rows[0].id;
    }

    // 2. Check if admin user exists
    const userCheck = await query('SELECT id FROM usuarios WHERE email = $1', ['admin@spark.com']);
    if (userCheck.rows.length === 0) {
      const hashed = await hashPassword('admin123');
      const userRes = await query(
        'INSERT INTO usuarios (email, password_hash) VALUES ($1, $2) RETURNING id',
        ['admin@spark.com', hashed]
      );
      const userId = userRes.rows[0].id;
      await query('INSERT INTO usuario_rol (usuario_id, rol_id) VALUES ($1, $2)', [userId, adminRoleId]);
      console.log('ADMIN_SEEDED');
    } else {
      console.log('ADMIN_EXISTS');
    }
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seedAdmin();
