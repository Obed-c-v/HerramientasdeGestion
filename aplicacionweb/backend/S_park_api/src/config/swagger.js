const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'S-park API',
      version: '1.0.0',
      description: 'API para detección de Parkinson por voz',
    },
    servers: [
      {
        url: 'http://localhost:3000/api',
        description: 'Servidor de Desarrollo',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/routes/*.js', './src/app.js'], // ARCHIVOS DONDE ESTARÁ LA DOCUMENTACIÓN
};

const specs = swaggerJsdoc(options);

module.exports = specs;
