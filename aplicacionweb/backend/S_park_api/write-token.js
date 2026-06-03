const { login } = require('./src/services/auth.service');
const fs = require('fs');

async function generateToken() {
  try {
    const result = await login('doctor.test2@spark.com', 'password123');
    fs.writeFileSync('last-token.txt', result.token);
    process.exit(0);
  } catch (err) {
    console.error('Login failed:', err);
    process.exit(1);
  }
}

generateToken();
