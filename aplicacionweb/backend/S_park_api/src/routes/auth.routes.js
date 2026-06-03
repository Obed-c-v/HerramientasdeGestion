const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require('multer');
const authController = require('../controllers/auth.controller');
const authenticate = require('../middlewares/auth.middleware');

// Configure multer for avatar uploads
const storage = multer.diskStorage({
  destination: path.join(__dirname, '../../uploads/avatars'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `avatar_${req.user.user_id}_${Date.now()}${ext}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  }
});

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Endpoints de autenticación
 */

router.post('/register', authController.register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Iniciar sesión
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login exitoso, o requiere verificación (Pacientes primer acceso)
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - type: object
 *                   properties:
 *                     token:
 *                       type: string
 *                     user:
 *                       type: object
 *                 - type: object
 *                   properties:
 *                     requiresVerification:
 *                       type: boolean
 *                     email:
 *                       type: string
 *       401:
 *         description: Credenciales inválidas
 */
router.post('/login', authController.login);

/**
 * @swagger
 * /auth/verify-code:
 *   post:
 *     summary: Verifica el código OTP de activación (Pacientes)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - codigo
 *             properties:
 *               email:
 *                 type: string
 *               codigo:
 *                 type: string
 *     responses:
 *       200:
 *         description: OTP verificado correctamente
 *       400:
 *         description: OTP inválido o expirado
 *       404:
 *         description: Usuario no encontrado
 */
router.post('/verify-code', authController.verifyCode);

/**
 * @swagger
 * /auth/change-initial-password:
 *   post:
 *     summary: Cambia la contraseña inicial temporal por una definitiva
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - newPassword
 *             properties:
 *               email:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Contraseña cambiada, devuelve JWT
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 token:
 *                   type: string
 *       400:
 *         description: Datos inválidos
 *       404:
 *         description: Usuario no encontrado o ya activado
 */
router.post('/change-initial-password', authController.changeInitialPassword);

/**
 * @swagger
 * /auth/resend-code:
 *   post:
 *     summary: Reenvía el correo de activación con un nuevo código OTP
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Correo reenviado
 *       400:
 *         description: Ya se activó el usuario
 *       404:
 *         description: Usuario no encontrado
 */
router.post('/resend-code', authController.resendCode);

// Protected profile routes
router.get('/me', authenticate, authController.getMe);
router.put('/me', authenticate, authController.updateProfile);
router.patch('/me/password', authenticate, authController.changePassword);
router.post('/me/foto', authenticate, upload.single('foto'), authController.uploadPhoto);

module.exports = router;
