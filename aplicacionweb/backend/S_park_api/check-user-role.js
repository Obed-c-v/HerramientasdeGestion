const { query } = require('./src/config/db');

async function checkUserRole() {
  try {
    const email = 'robertinoo@gmail.com';

    // Buscar el ID del usuario
    const userRes = await query('SELECT id, email, activo FROM usuarios WHERE email = $1', [email]);
    if (userRes.rows.length === 0) {
      console.log('❌ Usuario no encontrado:', email);
      process.exit(0);
    }

    const user = userRes.rows[0];
    const userId = user.id;
    console.log(`\n✅ Usuario encontrado: ${user.email} (ID: ${userId}, Activo: ${user.activo})\n`);

    // Verificar en tabla pacientes
    const pacRes = await query('SELECT * FROM pacientes WHERE usuario_id = $1', [userId]).catch(() => ({ rows: [] }));
    if (pacRes.rows.length > 0) {
      console.log('🔵 Rol: PACIENTE');
      console.log('Datos:', pacRes.rows[0]);
    }

    // Verificar en tabla medicos
    const medRes = await query('SELECT * FROM medicos WHERE usuario_id = $1', [userId]).catch(() => ({ rows: [] }));
    if (medRes.rows.length > 0) {
      console.log('🟢 Rol: MÉDICO');
      console.log('Datos:', medRes.rows[0]);
    }

    // Verificar en tabla administradores
    const adminRes = await query('SELECT * FROM administradores WHERE usuario_id = $1', [userId]).catch(() => ({ rows: [] }));
    if (adminRes.rows.length > 0) {
      console.log('🔴 Rol: ADMINISTRADOR');
      console.log('Datos:', adminRes.rows[0]);
    }

    if (pacRes.rows.length === 0 && medRes.rows.length === 0 && adminRes.rows.length === 0) {
      console.log('⚠️  Este usuario existe en `usuarios` pero NO tiene rol asignado en ninguna tabla (pacientes, medicos, administradores)');
    }

    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

checkUserRole();
