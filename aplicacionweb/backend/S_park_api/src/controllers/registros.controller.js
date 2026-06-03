const registrosService = require('../services/registros.service');

const createRegistro = async (req, res, next) => {
  try {
    const { paciente_id, biomarcador_id, valor } = req.body;
    const medico_id = req.user.medico_id;

    if (!medico_id) {
      return res.status(403).json({ message: 'Only doctors can record biomarkers' });
    }

    const result = await registrosService.createRegistro(paciente_id, medico_id, biomarcador_id, valor);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

const getRegistrosByPaciente = async (req, res, next) => {
  try {
    const { paciente_id } = req.params;
    const result = await registrosService.getRegistrosByPaciente(paciente_id);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

const getAlertas = async (req, res, next) => {
  try {
    const { medico_id, rol } = req.user;
    if (!medico_id && rol !== 'ADMIN') return res.status(403).json({ message: 'Unauthorized' });

    const result = await registrosService.getAlertas(medico_id, rol);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

const getDashboardStats = async (req, res, next) => {
  try {
    const { medico_id, rol } = req.user;
    if (!medico_id && rol !== 'ADMIN') return res.status(403).json({ message: 'Unauthorized' });

    const result = await registrosService.getDashboardStats(medico_id, rol);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createRegistro,
  getRegistrosByPaciente,
  getAlertas,
  getDashboardStats
};
