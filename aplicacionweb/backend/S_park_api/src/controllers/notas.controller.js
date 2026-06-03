const notasService = require('../services/notas.service');

const createNota = async (req, res, next) => {
  try {
    const { expediente_id, tipo, contenido } = req.body;
    const { medico_id, rol } = req.user;

    if (!medico_id && rol !== 'ADMIN') {
      return res.status(403).json({ message: 'Only doctors can add notes' });
    }

    const result = await notasService.createNota(expediente_id, medico_id || null, tipo, contenido);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

const getNotasByExpediente = async (req, res, next) => {
  try {
    const { expediente_id } = req.params;
    const result = await notasService.getNotasByExpediente(expediente_id);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createNota,
  getNotasByExpediente
};
