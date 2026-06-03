require('dotenv').config();
const app = require('./app');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Swagger Docs available at http://localhost:${PORT}/api/docs`);
  
  // Mostrar token automático para pruebas en Swagger
  require('./utils/token-helper');
});
