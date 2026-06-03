const express = require('express');
const router = express.Router();
const citasController = require('../controllers/citas.controller');
const authenticate = require('../middlewares/auth.middleware');

/**
 * @swagger
 * tags:
 *   name: Citas
 *   description: Gestión de citas médicas
 */

/**
 * @swagger
 * /citas:
 *   post:
 *     summary: Programar una nueva cita
 *     tags: [Citas]
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
 *               - fecha
 *             properties:
 *               paciente_id:
 *                 type: integer
 *               fecha:
 *                 type: string
 *                 format: date-time
 *               motivo:
 *                 type: string
 *     responses:
 *       201:
 *         description: Cita programada
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autorizado
 */
router.post('/', authenticate, citasController.createCita);

/**
 * @swagger
 * /citas:
 *   get:
 *     summary: Obtener citas programadas para el médico autenticado
 *     tags: [Citas]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de citas
 *       401:
 *         description: No autorizado
 */
router.get('/', authenticate, citasController.getCitasByMedico);

module.exports = router;
