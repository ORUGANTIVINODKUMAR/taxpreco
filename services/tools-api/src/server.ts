import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { db } from './db.js'

dotenv.config()

const app = express()
const PORT = 4000

app.use(cors())
app.use(express.json())

app.get('/health', async (_req, res) => {
  try {
    const result = await db.query('SELECT NOW()')

    res.json({
      status: 'ok',
      service: 'tools-api',
      database: 'connected',
      databaseTime: result.rows[0].now,
    })
  } catch (error) {
    console.error(error)

    res.status(500).json({
      status: 'error',
      service: 'tools-api',
      database: 'disconnected',
    })
  }
})

app.listen(PORT, () => {
  console.log(`Tools API running on http://localhost:${PORT}`)
})