require('dotenv').config();

const express = require('express');
const { Pool } = require('pg');
const { createClient } = require('redis');

const app = express();
app.use(express.json());

// Connexion PostgreSQL
const pool = new Pool({
  host: process.env.POSTGRES_HOST,
  port: process.env.POSTGRES_PORT,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
});

// Connexion Redis
const redisClient = createClient({
  socket: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
  },
});

redisClient.on('error', (err) => console.error('Redis error:', err));

// Initialisation : table PostgreSQL + connexion Redis
async function init() {
  await redisClient.connect();
  console.log('Redis connecté');

  await pool.query(`
    CREATE TABLE IF NOT EXISTS tasks (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      done BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);
  console.log('PostgreSQL connecté et table prête');
}

// Routes
const tasksRouter = require('./routes/tasks')(pool, redisClient);
app.use('/tasks', tasksRouter);

// Healthcheck
app.get('/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.API_PORT || 3000;

init()
  .then(() => {
    app.listen(PORT, () => console.log(`API démarrée sur le port ${PORT}`));
  })
  .catch((err) => {
    console.error('Erreur initialisation :', err);
    process.exit(1);
  });
