const { Client } = require('pg');

const commonPasswords = [
  undefined,
  'postgres',
  '12345',
  '12345678',
  '123456789',
  'Jesus10',
  'Jesus10!',
  'jesus10',
  'Jesus',
  'parkinson',
  'api_backend',
  'postgres123',
  'admin123',
  'root123'
];

async function testPasswords() {
  for (const pwd of commonPasswords) {
    const config = {
      host: 'localhost',
      user: 'postgres',
      port: 5432,
      database: 'postgres'
    };
    if (pwd !== undefined) {
      config.password = pwd;
    }
    try {
      console.log(`Testing password: ${pwd === undefined ? 'undefined' : '"' + pwd + '"'}...`);
      const client = new Client(config);
      await client.connect();
      console.log(` SUCCESS! Password is: ${pwd === undefined ? 'undefined (trust/no password)' : '"' + pwd + '"'}`);
      await client.end();
      return pwd;
    } catch (e) {
      console.log(` Failed: ${e.message}`);
    }
  }
  console.log('None of the tested passwords worked.');
  return null;
}

testPasswords();
