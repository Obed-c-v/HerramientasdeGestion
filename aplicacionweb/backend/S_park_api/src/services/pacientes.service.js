const { pool, query } = require('../config/db');
const { hashPassword } = require('../utils/hash');
const { generateOTP, generateTempPassword } = require('../utils/otp');
const { sendActivationEmail } = require('../utils/mailer');

/**
 * Create a new patient with user account and initial expediente.
 * MUST be inside a transaction.
 */
const createPaciente = async (pacienteData, medicoResponsableId) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Create User with temporary password and OTP
    const tempPassword = generateTempPassword();
    const hashedPassword = await hashPassword(tempPassword);
    
    const otp = generateOTP();

    const userResult = await client.query(
      `INSERT INTO usuarios (
        email, password_hash, email_verificado, 
        codigo_activacion, codigo_expiracion, primer_acceso
       ) 
       VALUES ($1, $2, FALSE, $3, NOW() + INTERVAL '15 minutes', TRUE) 
       RETURNING id`,
      [pacienteData.email, hashedPassword, otp]
    );
    const userId = userResult.rows[0].id;

    // 2. Assign PACIENTE role
    const roleResult = await client.query("SELECT id FROM roles WHERE nombre = 'PACIENTE'");
    const roleId = roleResult.rows[0].id;
    await client.query(
      'INSERT INTO usuario_rol (usuario_id, rol_id) VALUES ($1, $2)',
      [userId, roleId]
    );

    // 3. Create Patient
    const patientResult = await client.query(
      'INSERT INTO pacientes (usuario_id, nombre, apellido, fecha_nacimiento, sexo, telefono, email) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id',
      [userId, pacienteData.nombre, pacienteData.apellido, pacienteData.fecha_nacimiento, pacienteData.sexo, pacienteData.telefono, pacienteData.email]
    );
    const patientId = patientResult.rows[0].id;

    // 4. Create Expediente
    const expedienteResult = await client.query(
      'INSERT INTO expedientes (paciente_id, medico_responsable_id, fecha_apertura, estado) VALUES ($1, $2, CURRENT_DATE, $3) RETURNING id',
      [patientId, medicoResponsableId, 'ACTIVO']
    );
    const expedienteId = expedienteResult.rows[0].id;

    // 5. Save diagnostico_inicial as nota clínica INICIAL (if provided)
    if (pacienteData.diagnostico_inicial && pacienteData.diagnostico_inicial.trim() !== '') {
      await client.query(
        'INSERT INTO notas_clinicas (expediente_id, medico_id, tipo, contenido) VALUES ($1, $2, $3, $4)',
        [expedienteId, medicoResponsableId, 'INICIAL', pacienteData.diagnostico_inicial.trim()]
      );
    }

    await client.query('COMMIT');

    // Send activation email after successful commit
    if (pacienteData.email) {
      // Intentionally not awaiting here or wrapping in try-catch so failure to send email 
      // doesn't rollback the whole transaction if commit succeeded, 
      // but await is fine if we want to log failures inline.
      sendActivationEmail(pacienteData.email, {
        nombre: pacienteData.nombre,
        tempPassword,
        otp
      }).catch(console.error);
    }

    return { id: patientId, email: pacienteData.email };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error in createPaciente:', error);
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Get aggregated details of a patient.
 */
const getPacienteDetalle = async (patientId, medicoId, rol) => {
  // 1. Get Patient and check existence
  const patientQ = `
    SELECT p.*, e.id as expediente_id, e.medico_responsable_id, e.estado as expediente_estado
    FROM pacientes p
    JOIN expedientes e ON p.id = e.paciente_id
    WHERE p.id = $1
  `;
  const patientRes = await query(patientQ, [patientId]);

  if (patientRes.rows.length === 0) {
    throw { statusCode: 404, message: 'Patient not found' };
  }

  const patient = patientRes.rows[0];

  // 2. Validate Ownership (Skip for ADMIN)
  if (rol !== 'ADMIN' && patient.medico_responsable_id !== medicoId) {
    throw { statusCode: 403, message: 'Forbidden: You are not the responsible doctor for this patient' };
  }

  // 3. Aggregate Data
  const medicoQ = 'SELECT nombre, apellido, especialidad FROM medicos WHERE id = $1';
  const notesQ = 'SELECT * FROM notas_clinicas WHERE expediente_id = $1 ORDER BY created_at DESC';
  const biomarkersQ = 'SELECT r.*, b.nombre, b.unidad FROM registros_biomarcador r JOIN biomarcadores b ON r.biomarcador_id = b.id WHERE r.paciente_id = $1 ORDER BY r.fecha_registro DESC';
  const appointmentsQ = 'SELECT * FROM citas WHERE paciente_id = $1 ORDER BY fecha_hora DESC';

  const [medicoRes, notesRes, biomarkersRes, appointmentsRes] = await Promise.all([
    query(medicoQ, [patient.medico_responsable_id]),
    query(notesQ, [patient.expediente_id]),
    query(biomarkersQ, [patientId]),
    query(appointmentsQ, [patientId])
  ]);

  return {
    paciente: patient,
    medico: medicoRes.rows[0],
    expediente: {
      id: patient.expediente_id,
      estado: patient.expediente_estado
    },
    notas_clinicas: notesRes.rows,
    registros_biomarcador: biomarkersRes.rows,
    citas: appointmentsRes.rows
  };
};

const getPacientesByDoctor = async (medicoId, rol) => {
  let q = `
    SELECT p.*, 
      CASE 
        WHEN rb.valor > b.rango_max THEN 'ALTO'
        ELSE 'NORMAL'
      END as riesgo_nivel, 
      rb.fecha_registro as ultima_prueba
    FROM pacientes p
    JOIN expedientes e ON p.id = e.paciente_id
    LEFT JOIN (
      SELECT DISTINCT ON (paciente_id) *
      FROM registros_biomarcador
      ORDER BY paciente_id, fecha_registro DESC
    ) rb ON p.id = rb.paciente_id
    LEFT JOIN biomarcadores b ON rb.biomarcador_id = b.id
  `;

  const params = [];
  if (rol !== 'ADMIN') {
    q += ` WHERE e.medico_responsable_id = $1`;
    params.push(medicoId);
  }

  q += ` ORDER BY p.id DESC`;
  
  const res = await query(q, params);
  return res.rows;
};

/**
 * Update patient details.
 */
const updatePaciente = async (id, data) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Get current info
    const infoQ = `
      SELECT p.usuario_id, e.id as expediente_id 
      FROM pacientes p 
      LEFT JOIN expedientes e ON p.id = e.paciente_id 
      WHERE p.id = $1
    `;
    const infoRes = await client.query(infoQ, [id]);
    if (infoRes.rows.length === 0) throw { statusCode: 404, message: 'Patient not found' };
    const { usuario_id, expediente_id } = infoRes.rows[0];

    // 2. Update pacientes table
    const q = `
      UPDATE pacientes 
      SET nombre = $1, apellido = $2, fecha_nacimiento = $3, sexo = $4, telefono = $5 
      WHERE id = $6 
      RETURNING *
    `;
    const params = [data.nombre, data.apellido, data.fecha_nacimiento, data.sexo, data.telefono, id];
    const result = await client.query(q, params);

    // 3. Update Email in usuarios table
    if (usuario_id && data.email) {
      await client.query('UPDATE usuarios SET email = $1 WHERE id = $2', [data.email, usuario_id]);
    }

    // 4. Update medico_responsable_id in expedientes table
    if (expediente_id && data.medico_id) {
      await client.query('UPDATE expedientes SET medico_responsable_id = $1 WHERE id = $2', [data.medico_id, expediente_id]);
    } else if (!expediente_id && data.medico_id) {
      // Create expediente if it doesn't exist? (Unlikely but safety first)
      await client.query('INSERT INTO expedientes (paciente_id, medico_responsable_id) VALUES ($1, $2)', [id, data.medico_id]);
    }

    await client.query('COMMIT');
    return result.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error in updatePaciente:', error);
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Delete a patient and all their associated data (expediente, clinical data, user account).
 */
const deletePaciente = async (id) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Get user_id and expediente_id
    const infoQ = `
      SELECT p.usuario_id, e.id as expediente_id 
      FROM pacientes p 
      LEFT JOIN expedientes e ON p.id = e.paciente_id 
      WHERE p.id = $1
    `;
    const infoRes = await client.query(infoQ, [id]);
    
    if (infoRes.rows.length === 0) {
      throw { statusCode: 404, message: 'Patient not found' };
    }
    
    const { usuario_id, expediente_id } = infoRes.rows[0];

    // 2. Delete related data (Clinical records)
    if (expediente_id) {
       await client.query('DELETE FROM notas_clinicas WHERE expediente_id = $1', [expediente_id]);
    }
    await client.query('DELETE FROM registros_biomarcador WHERE paciente_id = $1', [id]);
    await client.query('DELETE FROM citas WHERE paciente_id = $1', [id]);
    await client.query('DELETE FROM expedientes WHERE paciente_id = $1', [id]);

    // 3. Delete patient record
    await client.query('DELETE FROM pacientes WHERE id = $1', [id]);

    // 4. Delete user account
    if (usuario_id) {
      // Roles deletion should be handled by CASCADE if configured, but let's be safe
      await client.query('DELETE FROM usuario_rol WHERE usuario_id = $1', [usuario_id]);
      await client.query('DELETE FROM usuarios WHERE id = $1', [usuario_id]);
    }

    await client.query('COMMIT');
    return { success: true };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  createPaciente,
  getPacienteDetalle,
  getPacientesByDoctor,
  updatePaciente,
  deletePaciente
};
