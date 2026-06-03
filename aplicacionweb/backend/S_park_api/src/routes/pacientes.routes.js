const express = require('express');
const router = express.Router();
const pacientesController = require('../controllers/pacientes.controller');
const authenticate = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/role.middleware');

/**
 * @swagger
 * tags:
 *   name: Pacientes
 *   description: Gestión de pacientes y expedientes
 */

/**
 * @swagger
 * /pacientes:
 *   post:
 *     summary: Registrar nuevo paciente
 *     tags: [Pacientes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nombre
 *               - apellido
 *               - fecha_nacimiento
 *               - sexo
 *               - email
 *               - password
 *             properties:
 *               nombre:
 *                 type: string
 *               apellido:
 *                 type: string
 *               fecha_nacimiento:
 *                 type: string
 *                 format: date
 *               sexo:
 *                 type: string
 *                 enum: [Masculino, Femenino, Otro]
 *               telefono:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               diagnostico_inicial:
 *                 type: string
 *     responses:
 *       201:
 *         description: Paciente registrado
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autorizado
 */
router.post('/', authenticate, authorize(['MEDICO', 'ADMIN']), pacientesController.createPaciente);

/**
 * @swagger
 * /pacientes:
 *   get:
 *     summary: Obtener lista de pacientes asignados al médico
 *     tags: [Pacientes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de pacientes
 *       401:
 *         description: No autorizado
 */
router.get('/', authenticate, authorize(['MEDICO', 'ADMIN']), pacientesController.getPacientes);

/**
 * @swagger
 * /pacientes/{id}/detalle:
 *   get:
 *     summary: Obtener detalle completo del paciente (expediente, notas, registros)
 *     tags: [Pacientes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Detalle del paciente
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Paciente no encontrado
 */
router.get('/:id/detalle', authenticate, authorize(['MEDICO', 'ADMIN']), pacientesController.getPacienteDetalle);

/**
 * @swagger
 * /pacientes/{id}:
 *   patch:
 *     summary: Actualizar datos de paciente (MEDICO or ADMIN)
 *     tags: [Pacientes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Paciente actualizado
 *   delete:
 *     summary: Eliminar paciente y sus datos (Solo ADMIN)
 *     tags: [Pacientes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Paciente eliminado
 */
router.patch('/:id', authenticate, authorize(['MEDICO', 'ADMIN']), pacientesController.updatePaciente);
router.delete('/:id', authenticate, authorize(['ADMIN']), pacientesController.deletePaciente);

module.exports = router;
