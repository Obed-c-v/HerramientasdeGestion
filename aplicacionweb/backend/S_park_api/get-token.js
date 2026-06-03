const { login } = require('./src/services/auth.service');

async function generateToken() {
  try {
    const result = await login('admin@spark.com', 'admin123');
    console.log('TOKEN_START');
    console.log(result.token);
    console.log('TOKEN_END');
    process.exit(0);
  } catch (err) {
    console.error('ERROR_LOGGING_IN');
    process.exit(1);
  }
}

generateToken();
