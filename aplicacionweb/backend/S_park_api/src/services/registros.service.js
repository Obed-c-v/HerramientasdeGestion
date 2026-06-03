const { query } = require('../config/db');

/**
 * Create a new biomarker record (AI result).
 */
const createRegistro = async (pacienteId, medicoId, biomarcadorId, valor) => {
  const q = `
    INSERT INTO registros_biomarcador (paciente_id, medico_id, biomarcador_id, valor)
    VALUES ($1, $2, $3, $4)
    RETURNING *
  `;
  const result = await query(q, [pacienteId, medicoId, biomarcadorId, valor]);
  return result.rows[0];
};

/**
 * Get biomarker records for a patient.
 */
const getRegistrosByPaciente = async (pacienteId) => {
  const q = `
    SELECT r.*, b.nombre, b.unidad, b.rango_min, b.rango_max
    FROM registros_biomarcador r
    JOIN biomarcadores b ON r.biomarcador_id = b.id
    WHERE r.paciente_id = $1
    ORDER BY r.fecha_registro DESC
  `;
  const result = await query(q, [pacienteId]);
  return result.rows;
};

/**
 * Get intelligent alerts for doctor's patients.
 */
const getAlertas = async (medicoId, rol) => {
  let q = `
    SELECT 
      p.nombre || ' ' || p.apellido as paciente,
      CASE 
        WHEN rb.valor > b.rango_max THEN 'ALTO'
        ELSE 'NORMAL'
      END as riesgo,
      rb.fecha_registro as ultima_prueba,
      EXISTS (SELECT 1 FROM citas WHERE paciente_id = p.id AND fecha_hora > CURRENT_TIMESTAMP) as tiene_cita,
      CASE 
        WHEN rb.valor > b.rango_max THEN 'Nivel de biomarcador fuera de rango'
        WHEN rb.fecha_registro < CURRENT_TIMESTAMP - INTERVAL '30 days' THEN 'Falta de seguimiento (más de 30 días)'
        ELSE 'Estado estable'
      END as mensaje
    FROM pacientes p
    JOIN expedientes e ON p.id = e.paciente_id
    LEFT JOIN (
      SELECT DISTINCT ON (paciente_id) * FROM registros_biomarcador ORDER BY paciente_id, fecha_registro DESC
    ) rb ON p.id = rb.paciente_id
    LEFT JOIN biomarcadores b ON rb.biomarcador_id = b.id
  `;
  
  const params = [];
  if (rol !== 'ADMIN') {
    q += ` WHERE e.medico_responsable_id = $1`;
    params.push(medicoId);
  }

  const result = await query(q, params);
  return result.rows;
};

/**
 * Get dashboard stats for doctor.
 */
const getDashboardStats = async (medicoId, rol) => {
  let statsQ = `
    SELECT 
      COUNT(DISTINCT p.id) as total_pacientes,
      COUNT(DISTINCT CASE WHEN rb.valor > b.rango_max THEN p.id END) as riesgo_alto,
      COUNT(rb.id) as pruebas_realizadas,
      MAX(rb.fecha_registro) as ultima_prueba
    FROM pacientes p
    JOIN expedientes e ON p.id = e.paciente_id
    LEFT JOIN registros_biomarcador rb ON p.id = rb.paciente_id
    LEFT JOIN biomarcadores b ON rb.biomarcador_id = b.id
  `;

  const params = [];
  if (rol !== 'ADMIN') {
    statsQ += ` WHERE e.medico_responsable_id = $1`;
    params.push(medicoId);
  }

  const result = await query(statsQ, params);
  return result.rows[0];
};

module.exports = {
  createRegistro,
  getRegistrosByPaciente,
  getAlertas,
  getDashboardStats
};
