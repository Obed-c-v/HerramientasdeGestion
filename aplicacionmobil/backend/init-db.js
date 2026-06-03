require('dotenv').config();
const { Client, Pool } = require('pg');

async function initializeDatabase() {
  const credentials = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'Jesus10',
    port: parseInt(process.env.DB_PORT || '5432', 10),
  };

  const dbName = process.env.DB_NAME || 'api_backend';

  console.log('Connecting to default postgres database to verify/create target database...');
  const adminClient = new Client({
    ...credentials,
    database: 'postgres',
  });

  try {
    await adminClient.connect();
    
    // Check if target database exists
    const checkDbRes = await adminClient.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [dbName]
    );

    if (checkDbRes.rowCount === 0) {
      console.log(`Database "${dbName}" does not exist. Creating...`);
      // CREATE DATABASE cannot run inside a transaction block, pg does not support parameterization for CREATE DATABASE
      await adminClient.query(`CREATE DATABASE "${dbName}"`);
      console.log(`Database "${dbName}" created successfully.`);
    } else {
      console.log(`Database "${dbName}" already exists.`);
    }
  } catch (error) {
    console.error('Error during database checking/creation:', error.message);
  } finally {
    await adminClient.end();
  }

  console.log(`Connecting to database "${dbName}" to verify/create tables...`);
  const appPool = new Pool({
    ...credentials,
    database: dbName,
  });

  try {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS usuarios (
        id SERIAL PRIMARY KEY,
        primer_nombre VARCHAR(100),
        segundo_nombre VARCHAR(100),
        apellido_paterno VARCHAR(100),
        apellido_materno VARCHAR(100),
        correo VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        edad INTEGER,
        sexo VARCHAR(50)
      );
    `;
    await appPool.query(createTableQuery);
    console.log('Table "usuarios" verified/created successfully.');
  } catch (error) {
    console.error('Error verifying/creating tables:', error.message);
  } finally {
    await appPool.end();
  }
}

initializeDatabase();
