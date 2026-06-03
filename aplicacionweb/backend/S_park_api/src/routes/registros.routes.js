const express = require('express');
const router = express.Router();
const registrosController = require('../controllers/registros.controller');
const authenticate = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/role.middleware');

/**
 * @swagger
 * tags:
 *   name: Registros
 *   description: Calificaciones y biomarcadores de voz
 */

/**
 * @swagger
 * /registros:
 *   post:
 *     summary: Crear nuevo registro de biomarcadores
 *     tags: [Registros]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - paciente_id
 *               - jitter
 *               - shimmer
 *               - hnr
 *             properties:
 *               paciente_id:
 *                 type: integer
 *               jitter:
 *                 type: number
 *               shimmer:
 *                 type: number
 *               hnr:
 *                 type: number
 *     responses:
 *       201:
 *         description: Registro creado
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autorizado
 */
router.post('/', authenticate, authorize(['MEDICO', 'ADMIN']), registrosController.createRegistro);

/**
 * @swagger
 * /registros/{paciente_id}:
 *   get:
 *     summary: Obtener historial de registros de un paciente
 *     tags: [Registros]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: paciente_id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lista de registros
 *       401:
 *         description: No autorizado
 */
router.get('/:paciente_id', authenticate, registrosController.getRegistrosByPaciente);

/**
 * @swagger
 * /alertas:
 *   get:
 *     summary: Obtener alertas de pacientes con riesgo alto
 *     tags: [Registros]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de alertas
 *       401:
 *         description: No autorizado
 *       403:
 *         description: No autorizado
 */
router.get('/alertas/all', authenticate, authorize(['MEDICO', 'ADMIN']), registrosController.getAlertas);

/**
 * @swagger
 * /dashboard:
 *   get:
 *     summary: Obtener estadísticas globales para el dashboard
 *     tags: [Registros]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estadísticas generales
 *       401:
 *         description: No autorizado
 *       403:
 *         description: No autorizado
 */
router.get('/dashboard/stats', authenticate, authorize(['MEDICO', 'ADMIN']), registrosController.getDashboardStats);

module.exports = router;
