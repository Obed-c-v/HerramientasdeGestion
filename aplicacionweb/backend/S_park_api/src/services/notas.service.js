const { query } = require('../config/db');

/**
 * Create a new clinical note.
 */
const createNota = async (expedienteId, medicoId, tipo, contenido) => {
  const q = `
    INSERT INTO notas_clinicas (expediente_id, medico_id, tipo, contenido)
    VALUES ($1, $2, $3, $4)
    RETURNING *
  `;
  const result = await query(q, [expedienteId, medicoId, tipo, contenido]);
  return result.rows[0];
};

/**
 * Get all notes for an expediente.
 */
const getNotasByExpediente = async (expedienteId) => {
  const q = 'SELECT * FROM notas_clinicas WHERE expediente_id = $1 ORDER BY created_at DESC';
  const result = await query(q, [expedienteId]);
  return result.rows;
};

module.exports = {
  createNota,
  getNotasByExpediente
};
