const { query } = require('../config/db');
const { hashPassword, comparePassword } = require('../utils/hash');
const { generateToken } = require('../utils/jwt');
const { generateOTP, getOTPExpiration } = require('../utils/otp');
const { sendActivationEmail } = require('../utils/mailer');
/**
 * Service to register a new doctor.
 */
const registerMedico = async (data) => {
  const { email, password, nombre, apellido, especialidad, numero_licencia, telefono } = data;

  const existingUser = await query('SELECT id FROM usuarios WHERE email = $1', [email]);
  if (existingUser.rows.length > 0) {
    throw { statusCode: 400, message: 'Email already registered' };
  }

  const passwordHash = await hashPassword(password);
  const userRes = await query(
    'INSERT INTO usuarios (email, password_hash) VALUES ($1, $2) RETURNING id',
    [email, passwordHash]
  );
  const userId = userRes.rows[0].id;

  const roleRes = await query('SELECT id FROM roles WHERE nombre = $1', ['MEDICO']);
  const roleId = roleRes.rows[0].id;
  await query('INSERT INTO usuario_rol (usuario_id, rol_id) VALUES ($1, $2)', [userId, roleId]);

  await query(
    'INSERT INTO medicos (usuario_id, nombre, apellido, especialidad, numero_licencia, telefono) VALUES ($1, $2, $3, $4, $5, $6)',
    [userId, nombre, apellido, especialidad, numero_licencia, telefono]
  );

  return { message: 'Doctor registered successfully' };
};

/**
 * Service to handle user login.
 */
const login = async (email, password, source = null) => {
  const userQuery = `
    SELECT u.id, u.email, u.password_hash, u.primer_acceso, u.email_verificado, r.nombre as rol
    FROM usuarios u
    JOIN usuario_rol ur ON u.id = ur.usuario_id
    JOIN roles r ON ur.rol_id = r.id
    WHERE u.email = $1 AND u.activo = TRUE
  `;
  const result = await query(userQuery, [email]);

  if (result.rows.length === 0) {
    throw { statusCode: 401, message: 'Invalid credentials' };
  }

  const user = result.rows[0];

  const isMatch = await comparePassword(password, user.password_hash);
  if (!isMatch) {
    throw { statusCode: 401, message: 'Invalid credentials' };
  }

  // Block patients from accessing the web admin panel
  if (source === 'web' && user.rol === 'PACIENTE') {
    throw { statusCode: 401, message: 'Credenciales incorrectas' };
  }

  if (user.rol === 'PACIENTE' && user.primer_acceso) {
    return {
      requiresVerification: true,
      email: user.email
    };
  }

  let medico_id = null;
  if (user.rol === 'MEDICO') {
    const medicoQuery = 'SELECT id FROM medicos WHERE usuario_id = $1';
    const medicoResult = await query(medicoQuery, [user.id]);
    if (medicoResult.rows.length > 0) {
      medico_id = medicoResult.rows[0].id;
    }
  }

  await query('UPDATE usuarios SET ultimo_login = NOW() WHERE id = $1', [user.id]);

  const token = generateToken({ user_id: user.id, rol: user.rol, medico_id });

  return {
    token,
    user: { id: user.id, email: user.email, rol: user.rol, medico_id }
  };
};

/**
 * Service to get current user's full profile.
 */
const getMe = async (userId, rol, medicoId) => {
  let details = null;

  if (rol === 'MEDICO' && medicoId) {
    const q = `
      SELECT m.id, m.nombre, m.apellido, m.especialidad, m.numero_licencia, m.telefono, m.foto_url,
             u.email
      FROM medicos m
      JOIN usuarios u ON m.usuario_id = u.id
      WHERE m.id = $1
    `;
    const res = await query(q, [medicoId]);
    details = res.rows[0] || null;
  } else if (rol === 'ADMIN') {
    const q = `SELECT id, email FROM usuarios WHERE id = $1`;
    const res = await query(q, [userId]);
    const adminUser = res.rows[0];
    // For admin, try to get a display name from a possible admin profile table or default
    details = {
      id: adminUser?.id,
      email: adminUser?.email,
      nombre: 'Administrador',
      apellido: '',
      foto_url: null
    };
  } else if (rol === 'PACIENTE') {
    const q = `
      SELECT p.id, p.nombre, p.apellido, p.fecha_nacimiento, p.telefono,
             (SELECT nc.contenido 
              FROM notas_clinicas nc 
              JOIN expedientes e ON nc.expediente_id = e.id 
              WHERE e.paciente_id = p.id AND nc.tipo = 'INICIAL' 
              LIMIT 1) as diagnostico_inicial,
             u.email, u.ultimo_login
      FROM pacientes p
      JOIN usuarios u ON p.usuario_id = u.id
      WHERE p.usuario_id = $1
    `;
    const res = await query(q, [userId]);
    details = res.rows[0] || null;
  }

  return { user_id: userId, rol, medico_id: medicoId, details };
};

/**
 * Update the profile of the currently logged-in user.
 */
const updateProfile = async (userId, rol, medicoId, data) => {
  const { nombre, apellido, telefono, especialidad } = data;

  if (rol === 'MEDICO' && medicoId) {
    await query(
      'UPDATE medicos SET nombre = $1, apellido = $2, telefono = $3, especialidad = $4 WHERE id = $5',
      [nombre, apellido, telefono || null, especialidad || null, medicoId]
    );
  }
  // For ADMIN: no clinical profile to update (name is stored elsewhere or display-only)
  return { message: 'Profile updated successfully' };
};

/**
 * Change the password of the currently logged-in user.
 */
const changePassword = async (userId, currentPassword, newPassword) => {
  const res = await query('SELECT password_hash FROM usuarios WHERE id = $1', [userId]);
  if (res.rows.length === 0) {
    throw { statusCode: 404, message: 'User not found' };
  }

  const isMatch = await comparePassword(currentPassword, res.rows[0].password_hash);
  if (!isMatch) {
    throw { statusCode: 400, message: 'Current password is incorrect' };
  }

  const newHash = await hashPassword(newPassword);
  await query('UPDATE usuarios SET password_hash = $1 WHERE id = $2', [newHash, userId]);
  return { message: 'Password updated successfully' };
};

/**
 * Update the profile photo URL for a doctor.
 */
const updatePhoto = async (userId, rol, medicoId, fotoUrl) => {
  if (rol === 'MEDICO' && medicoId) {
    await query('UPDATE medicos SET foto_url = $1 WHERE id = $2', [fotoUrl, medicoId]);
  } else if (rol === 'ADMIN') {
    await query('UPDATE usuarios SET foto_url = $1 WHERE id = $2', [fotoUrl, userId]);
  }
  return { fotoUrl };
};

/**
 * Verify OTP for patient activation.
 */
const verifyOTP = async (email, codigo) => {
  const result = await query(
    'SELECT id, codigo_activacion, (codigo_expiracion > NOW()) as is_valid FROM usuarios WHERE email = $1',
    [email]
  );

  if (result.rows.length === 0) {
    throw { statusCode: 404, message: 'User not found' };
  }

  const user = result.rows[0];

  if (user.codigo_activacion !== codigo) {
    throw { statusCode: 400, message: 'Invalid OTP' };
  }

  if (!user.is_valid) {
    throw { statusCode: 400, message: 'OTP expired' };
  }

  return { verified: true, requiresPasswordChange: true };
};

/**
 * Change initial password for patient after OTP verification.
 */
const changeInitialPassword = async (email, newPassword) => {
  const userResult = await query(
    `SELECT u.id, r.nombre as rol
     FROM usuarios u
     JOIN usuario_rol ur ON u.id = ur.usuario_id
     JOIN roles r ON ur.rol_id = r.id
     WHERE u.email = $1 AND u.primer_acceso = TRUE`,
    [email]
  );

  if (userResult.rows.length === 0) {
    throw { statusCode: 404, message: 'User not found or activation already completed' };
  }

  const user = userResult.rows[0];
  const hashedPassword = await hashPassword(newPassword);

  await query(
    `UPDATE usuarios 
     SET password_hash = $1, email_verificado = TRUE, primer_acceso = FALSE, 
         codigo_activacion = NULL, codigo_expiracion = NULL, ultimo_login = NOW()
     WHERE email = $2`,
    [hashedPassword, email]
  );

  const token = generateToken({ user_id: user.id, rol: user.rol, medico_id: null });

  return { success: true, token };
};

/**
 * Resend OTP code for patient activation.
 */
const resendOTP = async (email) => {
  const userResult = await query(
    `SELECT u.id, u.primer_acceso, p.nombre 
     FROM usuarios u
     JOIN pacientes p ON u.id = p.usuario_id
     WHERE u.email = $1`,
    [email]
  );

  if (userResult.rows.length === 0) {
    throw { statusCode: 404, message: 'User not found' };
  }

  const user = userResult.rows[0];

  if (!user.primer_acceso) {
    throw { statusCode: 400, message: 'Activation already completed' };
  }

  const otp = generateOTP();

  await query(
    "UPDATE usuarios SET codigo_activacion = $1, codigo_expiracion = NOW() + INTERVAL '15 minutes' WHERE email = $2",
    [otp, email]
  );

  await sendActivationEmail(email, {
    nombre: user.nombre,
    tempPassword: 'La misma enviada anteriormente', // Cannot retrieve hashed password
    otp
  });

  return { message: 'OTP resent successfully' };
};

module.exports = { 
  registerMedico, 
  login, 
  getMe, 
  updateProfile, 
  changePassword, 
  updatePhoto,
  verifyOTP,
  changeInitialPassword,
  resendOTP
};
