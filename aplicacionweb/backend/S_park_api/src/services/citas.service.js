const { query } = require('../config/db');

/**
 * Create a new appointment.
 */
const createCita = async (pacienteId, medicoId, fechaHora, estado) => {
  const q = `
    INSERT INTO citas (paciente_id, medico_id, fecha_hora, estado)
    VALUES ($1, $2, $3, $4)
    RETURNING *
  `;
  const result = await query(q, [pacienteId, medicoId, fechaHora, estado || 'PROGRAMADA']);
  return result.rows[0];
};

/**
 * Get appointments for a specific doctor.
 */
const getCitasByMedico = async (medicoId) => {
  const q = `
    SELECT c.*, p.nombre, p.apellido
    FROM citas c
    JOIN pacientes p ON c.paciente_id = p.id
    WHERE c.medico_id = $1
    ORDER BY c.fecha_hora ASC
  `;
  const result = await query(q, [medicoId]);
  return result.rows;
};

/**
 * Get appointments for a specific patient.
 */
const getCitasByPaciente = async (pacienteId) => {
  const q = `
    SELECT c.*, m.nombre as doctor_nombre, m.apellido as doctor_apellido, m.especialidad, m.foto_url as doctor_foto
    FROM citas c
    JOIN medicos m ON c.medico_id = m.id
    WHERE c.paciente_id = $1
    ORDER BY c.fecha_hora ASC
  `;
  const result = await query(q, [pacienteId]);
  return result.rows;
};

/**
 * Get all appointments.
 */
const getAllCitas = async () => {
  const q = `
    SELECT c.*, p.nombre as paciente_nombre, p.apellido as paciente_apellido,
           m.nombre as doctor_nombre, m.apellido as doctor_apellido, m.especialidad
    FROM citas c
    JOIN pacientes p ON c.paciente_id = p.id
    JOIN medicos m ON c.medico_id = m.id
    ORDER BY c.fecha_hora ASC
  `;
  const result = await query(q);
  return result.rows;
};

/**
 * Get appointments based on user role.
 */
const getCitasForUser = async (userId, rol, medicoId) => {
  if (rol === 'MEDICO') {
    return await getCitasByMedico(medicoId);
  } else if (rol === 'PACIENTE') {
    const patientRes = await query('SELECT id FROM pacientes WHERE usuario_id = $1', [userId]);
    if (patientRes.rows.length === 0) {
      throw { statusCode: 404, message: 'Patient not found' };
    }
    return await getCitasByPaciente(patientRes.rows[0].id);
  } else if (rol === 'ADMIN') {
    return await getAllCitas();
  } else {
    throw { statusCode: 403, message: 'Unauthorized' };
  }
};

/**
 * Create appointment based on user role.
 */
const createCitaForUser = async (userId, rol, medicoIdFromUser, body) => {
  const { fecha_hora, estado } = body;
  let { paciente_id, medico_id } = body;

  if (rol === 'PACIENTE') {
    const patientRes = await query('SELECT id FROM pacientes WHERE usuario_id = $1', [userId]);
    if (patientRes.rows.length === 0) {
      throw { statusCode: 404, message: 'Patient not found' };
    }
    paciente_id = patientRes.rows[0].id;
    if (!medico_id) {
      throw { statusCode: 400, message: 'medico_id is required' };
    }
  } else if (rol === 'MEDICO') {
    medico_id = medicoIdFromUser;
    if (!paciente_id) {
      throw { statusCode: 400, message: 'paciente_id is required' };
    }
  } else if (rol === 'ADMIN') {
    if (!paciente_id || !medico_id) {
      throw { statusCode: 400, message: 'paciente_id and medico_id are required' };
    }
  } else {
    throw { statusCode: 403, message: 'Forbidden' };
  }

  return await createCita(paciente_id, medico_id, fecha_hora, estado);
};

module.exports = {
  createCita,
  getCitasByMedico,
  getCitasByPaciente,
  getAllCitas,
  getCitasForUser,
  createCitaForUser
};
