require('dotenv').config()

const { Pool } = require('pg')

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is missing from .env')
}

const databaseUrl = new URL(process.env.DATABASE_URL)

const pool = new Pool({
  host: databaseUrl.hostname,
  port: Number(databaseUrl.port || 5432),
  database: databaseUrl.pathname.replace('/', ''),
  user: decodeURIComponent(databaseUrl.username),
  password: String(decodeURIComponent(databaseUrl.password)),
  ssl: {
    rejectUnauthorized: false,
  },
})

pool.on('error', (error) => {
  console.error('Unexpected PostgreSQL error:', error)
})

async function testConnection() {
  const result = await pool.query('SELECT NOW() AS now')
  console.log('PostgreSQL connected:', result.rows[0].now)
}

module.exports = {
  pool,
  testConnection,
}