const express = require('express');
const router = express.Router();
const medicosController = require('../controllers/medicos.controller');
const authenticate = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/role.middleware');

/**
 * @swagger
 * tags:
 *   name: Médicos
 *   description: Gestión de personal médico
 */

/**
 * @swagger
 * /medicos:
 *   get:
 *     summary: Obtener lista de médicos
 *     tags: [Médicos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Búsqueda por nombre o email
 *       - in: query
 *         name: especialidad
 *         schema:
 *           type: string
 *         description: Filtrar por especialidad
 *     responses:
 *       200:
 *         description: Lista de médicos
 *       401:
 *         description: No autorizado
 */
router.get('/', authenticate, medicosController.getMedicos);

/**
 * @swagger
 * /medicos/{id}/estado:
 *   patch:
 *     summary: Activar/Desactivar médico (Solo ADMIN)
 *     tags: [Médicos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               activo:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Estado actualizado
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Prohibido (No es ADMIN)
 */
router.patch('/:id/estado', authenticate, authorize(['ADMIN']), medicosController.updateEstado);

/**
 * @swagger
 * /medicos/asignaciones:
 *   get:
 *     summary: Obtener asignaciones de médicos y sus pacientes
 *     tags: [Médicos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de asignaciones
 *       401:
 *         description: No autorizado
 */
router.get('/asignaciones', authenticate, medicosController.getAsignaciones);

/**
 * @swagger
 * /medicos/{id}/pacientes:
 *   get:
 *     summary: Obtener pacientes de un médico específico
 *     tags: [Médicos]
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
 *         description: Lista de pacientes
 *       401:
 *         description: No autorizado
 */
router.get('/:id/pacientes', authenticate, medicosController.getPacientesByMedico);

/**
 * @swagger
 * /medicos/{id}:
 *   patch:
 *     summary: Actualizar datos de médico (Solo ADMIN)
 *     tags: [Médicos]
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
 *         description: Médico actualizado
 *   delete:
 *     summary: Eliminar médico y su cuenta (Solo ADMIN)
 *     tags: [Médicos]
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
 *         description: Médico eliminado
 */
router.patch('/:id', authenticate, authorize(['ADMIN']), medicosController.updateMedico);
router.delete('/:id', authenticate, authorize(['ADMIN']), medicosController.deleteMedico);

module.exports = router;
