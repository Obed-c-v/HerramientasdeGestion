const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const xss = require('xss-clean');
const rateLimit = require('express-rate-limit');
const path = require('path');

const app = express();
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');

// Swagger Documentation
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Middlewares
app.use(helmet({ crossOriginResourcePolicy: false })); // Allow image serving
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(xss());

// Serve uploaded files (profile photos)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Default Route
app.get('/', (req, res) => {
  res.json({ message: 'S-Park API is running' });
});

// Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/medicos', require('./routes/medicos.routes'));
app.use('/api/pacientes', require('./routes/pacientes.routes'));
app.use('/api/notas', require('./routes/notas.routes'));
app.use('/api/registros', require('./routes/registros.routes'));
app.use('/api/citas', require('./routes/citas.routes'));

// Special routes for Alerts and Dashboard (integrated into /api/alertas and /api/dashboard)
const registrosController = require('./controllers/registros.controller');
const authenticate = require('./middlewares/auth.middleware');

app.get('/api/alertas', authenticate, registrosController.getAlertas);
app.get('/api/dashboard', authenticate, registrosController.getDashboardStats);

// Global Error Handler
const errorHandler = require('./middlewares/error.middleware');
app.use(errorHandler);

module.exports = app;
