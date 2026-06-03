require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const nodemailer = require('nodemailer');

const app = express();

// 🔥 Middlewares
app.use(cors());
app.use(express.json());

// =======================
// CONEXIÓN POSTGRESQL
// =======================
const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT, 10)
});

pool.connect()
  .then(() => console.log('✅ PostgreSQL conectado'))
  .catch((err) => console.log('❌ Error PostgreSQL:', err.message));

// Almacén temporal de códigos (en producción usar Redis o DB)
const codesStorage = {};

// =======================
// RUTA 1: ENVIAR CÓDIGO 2FA
// =======================
app.post('/api/send-2fa', async (req, res) => {
  const { correo, email } = req.body;
  const targetEmail = correo || email;

  if (!targetEmail) {
    return res.status(400).json({ ok: false, message: 'Email requerido' });
  }

  // Generar código de 6 dígitos
  const code = Math.floor(100000 + Math.random() * 900000).toString();

  // Guardar en memoria temporalmente
  codesStorage[targetEmail] = code;

  console.log(`📩 Código 2FA generado para ${targetEmail}: ${code}`);

  // Configuración de Nodemailer
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  const mailOptions = {
    from: `"App Parkinson" <${process.env.EMAIL_USER}>`,
    to: targetEmail,
    subject: 'Código de verificación Parkinson App',
    text: `Tu código de acceso de un solo uso es: ${code}`
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('📧 Correo enviado con éxito');

    return res.json({
      ok: true,
      message: 'Código enviado a tu correo',
      code // Lo dejamos para pruebas, pero el real llegará por correo
    });
  } catch (error) {
    console.error('❌ Error al enviar correo:', error.message);
    return res.status(500).json({
      ok: false,
      message: 'Error al enviar el correo'
    });
  }
});

// =======================
// RUTA 2: VERIFICAR CÓDIGO 2FA
// =======================
app.post('/api/verify-2fa', (req, res) => {
  const { correo, email, codigo } = req.body;
  const targetEmail = correo || email;

  if (!targetEmail || !codigo) {
    return res.status(400).json({ ok: false, message: 'Faltan datos' });
  }

  const storedCode = codesStorage[targetEmail];

  if (storedCode && storedCode === codigo.toString()) {
    // Código correcto, lo borramos para que no se use de nuevo
    delete codesStorage[targetEmail];

    return res.json({
      ok: true,
      message: 'Código verificado correctamente'
    });
  } else {
    return res.status(401).json({
      ok: false,
      message: 'Código incorrecto o expirado'
    });
  }
});

// =======================
// RUTA 3: REGISTRO DE USUARIOS
// =======================
app.post('/api/register', async (req, res) => {
  const {
    primerNombre, segundoNombre, apellidoPaterno, apellidoMaterno,
    correo, password, edad, sexo
  } = req.body;

  if (!correo || !password) {
    return res.status(400).json({ ok: false, message: 'Correo y password requeridos' });
  }

  try {
    const query = `
      INSERT INTO usuarios 
      (primer_nombre, segundo_nombre, apellido_paterno, apellido_materno, correo, password, edad, sexo)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id
    `;
    const values = [
      primerNombre, segundoNombre, apellidoPaterno, apellidoMaterno,
      correo, password, parseInt(edad) || null, sexo
    ];

    const result = await pool.query(query, values);

    console.log(`👤 Usuario registrado: ${correo} (ID: ${result.rows[0].id})`);

    return res.json({
      ok: true,
      message: 'Usuario registrado con éxito',
      userId: result.rows[0].id
    });
  } catch (error) {
    console.error('❌ Error al registrar usuario:', error.message);

    if (error.code === '23505') { // Error de duplicado en Postgres
      return res.status(400).json({ ok: false, message: 'El correo ya está registrado' });
    }

    return res.status(500).json({ ok: false, message: 'Error interno del servidor' });
  }
});

// =======================
// RUTA 4: ESTATUS DE LA API
// =======================
app.get('/api/status', (req, res) => {
  res.json({
    ok: true,
    message: 'funcionando al millon',
    db_connected: true
  });
});

// =======================
// INICIAR SERVIDOR
// =======================
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor backend corriendo en: http://localhost:${PORT}`);
});