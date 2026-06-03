const { query } = require('./src/config/db');
const { hashPassword } = require('./src/utils/hash');

async function createAdmin() {
  const email = 'admin2@spark.com';
  const password = 'adminPassword123';
  
  try {
    console.log(`Checking if role ADMIN exists...`);
    const roleCheck = await query('SELECT id FROM roles WHERE nombre = $1', ['ADMIN']);
    if (roleCheck.rows.length === 0) {
      console.error('Error: Role ADMIN does not exist. Please run seed-admin.js first.');
      process.exit(1);
    }
    const adminRoleId = roleCheck.rows[0].id;

    console.log(`Checking if user ${email} already exists...`);
    const userCheck = await query('SELECT id FROM usuarios WHERE email = $1', [email]);
    if (userCheck.rows.length > 0) {
      console.log(`User ${email} already exists. Updating password...`);
      const hashed = await hashPassword(password);
      await query('UPDATE usuarios SET password_hash = $1 WHERE id = $2', [hashed, userCheck.rows[0].id]);
      console.log(`Password updated successfully!`);
    } else {
      console.log(`Creating new user ${email}...`);
      const hashed = await hashPassword(password);
      const userRes = await query(
        'INSERT INTO usuarios (email, password_hash) VALUES ($1, $2) RETURNING id',
        [email, hashed]
      );
      const userId = userRes.rows[0].id;
      
      console.log(`Assigning role ADMIN to user...`);
      await query('INSERT INTO usuario_rol (usuario_id, rol_id) VALUES ($1, $2)', [userId, adminRoleId]);
      console.log(`User created and role assigned successfully!`);
    }

    console.log('\n========================================');
    console.log(' Credentials:');
    console.log(` - Email:    ${email}`);
    console.log(` - Password: ${password}`);
    console.log('========================================');
    process.exit(0);
  } catch (err) {
    console.error('Error creating admin user:', err);
    process.exit(1);
  }
}

createAdmin();
