const medicosService = require('../services/medicos.service');

const getMedicos = async (req, res, next) => {
  try {
    const { nombre, especialidad } = req.query;
    const result = await medicosService.getMedicos(nombre, especialidad);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

const updateEstado = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { activo } = req.body;
    const result = await medicosService.updateEstado(id, activo);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

const updateMedico = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await medicosService.updateMedico(id, req.body);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

const deleteMedico = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rol } = req.user;

    if (rol !== 'ADMIN') {
      return res.status(403).json({ message: 'Only administrators can delete doctors' });
    }

    const result = await medicosService.deleteMedico(id);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

const getAsignaciones = async (req, res, next) => {
  try {
    const result = await medicosService.getAsignaciones();
    res.json(result);
  } catch (error) {
    next(error);
  }
};

const getPacientesByMedico = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await medicosService.getPacientesByMedico(id);
    res.json(result);
  } catch (error) {
    next(error);
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
