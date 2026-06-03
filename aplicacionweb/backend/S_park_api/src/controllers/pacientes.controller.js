const pacientesService = require('../services/pacientes.service');

const createPaciente = async (req, res, next) => {
  try {
    const { medico_id, rol } = req.user;
    
    if (!medico_id && rol !== 'ADMIN') {
      return res.status(403).json({ message: 'Only doctors can register patients' });
    }

    const medicoAsignado = rol === 'ADMIN' ? (req.body.medico_id || null) : medico_id;

    const result = await pacientesService.createPaciente(req.body, medicoAsignado);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

const getPacienteDetalle = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { medico_id, rol } = req.user;

    // Permitir si es Médico con ID o si es Administrador
    if (!medico_id && rol !== 'ADMIN') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const result = await pacientesService.getPacienteDetalle(id, medico_id, rol);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

const getPacientes = async (req, res, next) => {
  try {
    const { medico_id, rol } = req.user;
    
    // Permitir si es Médico con ID o si es Administrador
    if (!medico_id && rol !== 'ADMIN') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const result = await pacientesService.getPacientesByDoctor(medico_id, rol);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

const updatePaciente = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await pacientesService.updatePaciente(id, req.body);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

const deletePaciente = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rol } = req.user;

    if (rol !== 'ADMIN') {
      return res.status(403).json({ message: 'Only administrators can delete patients' });
    }

    const result = await pacientesService.deletePaciente(id);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createPaciente,
  getPacienteDetalle,
  getPacientes,
  updatePaciente,
  deletePaciente
};
