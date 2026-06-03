const express = require('express');
const router = express.Router();
const notasController = require('../controllers/notas.controller');
const authenticate = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/role.middleware');

/**
 * @swagger
 * tags:
 *   name: Notas
 *   description: Seguimiento clínico y notas médicas
 */

/**
 * @swagger
 * /notas:
 *   post:
 *     summary: Crear nueva nota clínica
 *     tags: [Notas]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - expediente_id
 *               - tipo
 *               - contenido
 *             properties:
 *               expediente_id:
 *                 type: integer
 *               tipo:
 *                 type: string
 *                 enum: [INICIAL, SEGUIMIENTO, OBSERVACION]
 *               contenido:
 *                 type: string
 *     responses:
 *       201:
 *         description: Nota creada
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autorizado
 */
router.post('/', authenticate, authorize(['MEDICO', 'ADMIN']), notasController.createNota);

/**
 * @swagger
 * /notas/{expediente_id}:
 *   get:
 *     summary: Obtener todas las notas de un expediente
 *     tags: [Notas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: expediente_id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lista de notas
 *       401:
 *         description: No autorizado
 */
router.get('/:expediente_id', authenticate, notasController.getNotasByExpediente);

module.exports = router;
