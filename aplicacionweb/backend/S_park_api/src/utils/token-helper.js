const axios = require('axios');

async function showToken() {
  try {
    const response = await axios.post('http://localhost:3000/api/auth/login', {
      email: 'admin@spark.com',
      password: 'admin123'
    });

    console.log('=========================================');
    console.log('🔑 TOKEN GENERADO AUTOMÁTICAMENTE');
    console.log('=========================================');
    console.log('Copia el siguiente token para usar en Swagger:');
    console.log('\n' + response.data.token + '\n');
    console.log('=========================================');
    console.log('Instrucciones para Swagger (/api/docs):');
    console.log('1. Haz clic en el botón "Authorize"');
    console.log('2. Pega el token directamente (sin prefijos si ya tiene)');
    console.log('3. ¡Listo! Ya puedes probar los endpoints protegidos.');
    console.log('=========================================');
  } catch (error) {
    console.error('Error generando token:', error.message);
    console.log('Asegúrate de que el servidor esté corriendo y los datos de login sean correctos.');
  }
}

// Pequeña espera para asegurar que el servidor subió si se llama al inicio
setTimeout(showToken, 2000);
