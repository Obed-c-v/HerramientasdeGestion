const { pool, query } = require('../config/db');

/**
 * Get all doctors with optional filters.
 */
const getMedicos = async (nombre, especialidad) => {
  let q = 'SELECT id, nombre, apellido, especialidad, numero_licencia, activo, foto_url FROM medicos WHERE 1=1';
  const params = [];

  if (nombre) {
    params.push(`%${nombre}%`);
    q += ` AND (nombre ILIKE $${params.length} OR apellido ILIKE $${params.length})`;
  }

  if (especialidad) {
    params.push(especialidad);
    q += ` AND especialidad = $${params.length}`;
  }

  const result = await query(q, params);
  return result.rows;
};

/**
 * Update doctor details.
 */
const updateMedico = async (id, data) => {
  console.log('Updating Medico ID:', id, 'Data:', data);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Get user_id
    const doctorQ = 'SELECT usuario_id FROM medicos WHERE id = $1';
    const doctorRes = await client.query(doctorQ, [id]);
    if (doctorRes.rows.length === 0) throw { statusCode: 404, message: 'Medico not found' };
    const userId = doctorRes.rows[0].usuario_id;

    // 2. Update medicos table
    const q = `
      UPDATE medicos 
      SET nombre = $1, apellido = $2, especialidad = $3, numero_licencia = $4, telefono = $5, activo = $6 
      WHERE id = $7 
      RETURNING *
    `;
    const params = [data.nombre, data.apellido, data.especialidad, data.numero_licencia, data.telefono, data.activo, id];
    const result = await client.query(q, params);

    // 3. Update Email in usuarios table
    if (userId && data.email) {
      await client.query('UPDATE usuarios SET email = $1 WHERE id = $2', [data.email, userId]);
    }

    await client.query('COMMIT');
    return result.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error in updateMedico:', error);
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Update doctor status (activo/inactivo).
 */
const updateEstado = async (id, activo) => {
  const q = 'UPDATE medicos SET activo = $1 WHERE id = $2 RETURNING *';
  const result = await query(q, [activo, id]);
  
  if (result.rows.length === 0) {
    throw { statusCode: 404, message: 'Medico not found' };
  }
  
  return result.rows[0];
};

/**
 * Get doctor assignments (doctor, specialty, total patients).
 */
const getAsignaciones = async () => {
  const q = `
    SELECT m.id, m.nombre, m.apellido, m.especialidad, COUNT(e.id) as pacientes_count
    FROM medicos m
    LEFT JOIN expedientes e ON m.id = e.medico_responsable_id
    GROUP BY m.id, m.nombre, m.apellido, m.especialidad
  `;
  const result = await query(q);
  return result.rows;
};

/**
 * Get patients for a specific doctor.
 */
const getPacientesByMedico = async (medicoId) => {
  const q = `
    SELECT 
      p.id as paciente_id, 
      p.nombre || ' ' || p.apellido as paciente_nombre, 
      EXTRACT(YEAR FROM AGE(p.fecha_nacimiento))::INT as edad,
      e.estado as estado_expediente, 
      (SELECT fecha_registro FROM registros_biomarcador WHERE paciente_id = p.id ORDER BY fecha_registro DESC LIMIT 1) as ultima_prueba,
      (SELECT 
          CASE 
            WHEN rb.valor > b.rango_max THEN 'Alta'
            ELSE 'Bajo'
          END
       FROM registros_biomarcador rb
       JOIN biomarcadores b ON rb.biomarcador_id = b.id
       WHERE rb.paciente_id = p.id
       ORDER BY rb.fecha_registro DESC
       LIMIT 1
      ) as riesgo_nivel
    FROM pacientes p
    JOIN expedientes e ON p.id = e.paciente_id
    WHERE e.medico_responsable_id = $1
  `;
  const result = await query(q, [medicoId]);
  
  // Ensure riesgo_nivel defaults to 'Bajo' if no tests have been done
  const rows = result.rows.map(row => ({
    ...row,
    riesgo_nivel: row.riesgo_nivel || 'Bajo'
  }));

  return rows;
};

/**
 * Delete a doctor and their associated user account.
 */
const deleteMedico = async (id) => {
  // 1. Get user_id first to delete from usuarios as well
  const doctorQ = 'SELECT usuario_id FROM medicos WHERE id = $1';
  const doctorRes = await query(doctorQ, [id]);
  
  if (doctorRes.rows.length === 0) {
    throw { statusCode: 404, message: 'Medico not found' };
  }
  
  const userId = doctorRes.rows[0].usuario_id;

  // 2. Delete medico (this might affect expedientes if not handled, but we'll assume it's set to NULL on delete or handled by the DB)
  // We'll use a transaction for safety if possible, but query() usually doesn't expose the client for BEGIN/COMMIT.
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Wipe assignments first or rely on CASCADE
    await client.query('DELETE FROM medicos WHERE id = $1', [id]);
    
    // Delete user account
    if (userId) {
      await client.query('DELETE FROM usuarios WHERE id = $1', [userId]);
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
  getMedicos,
  updateEstado,
  updateMedico,
  getAsignaciones,
  getPacientesByMedico,
  deleteMedico
};
