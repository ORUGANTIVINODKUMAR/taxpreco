const express = require('express')
const cors = require('cors')
const { devLoginConfig, createDevLoginHandler } = require('./devLogin')
const { firebaseAuth } = require('./firebase')
const { createContextRouter } = require('./routes/context')
const { createToolsRouter } = require('./routes/tools')
const { createMutualFundRouter } = require('./routes/mutualFund')
const { createRequireAuth } = require('./middleware/auth')
const { createAttachContext } = require('./middleware/context')

function allowedOrigins(value = process.env.CORS_ORIGINS) {
  const values = (value || "http://localhost:5173,http://192.168.0.175:5173,http://localhost:5175,http://192.168.0.175:5175,http://localhost:5176,http://192.168.0.175:5176,http://localhost:5177,http://192.168.0.175:5177").split(',').map(origin => origin.trim())
  for (const origin of values) {
    const parsed = new URL(origin)
    if (!['http:', 'https:'].includes(parsed.protocol) || parsed.origin !== origin) throw new Error('Invalid CORS origin configuration.')
  }
  return new Set(values)
}

function createApp({ verify, database, origins = allowedOrigins(), developmentLogin = devLoginConfig(), developmentAuth = firebaseAuth } = {}) {
  const app = express()
  app.use(cors({ origin(origin, callback) { callback(null, !!origin && origins.has(origin)) }, methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'], allowedHeaders: ['Authorization', 'Content-Type'] }))
  app.use(express.json())
  if (developmentLogin) {
    app.post('/api/dev/login', createDevLoginHandler({ config: developmentLogin, database: database || require('./db').pool, auth: developmentAuth }))
  }
  const auth = createRequireAuth(verify)
  const context = createAttachContext(database)
  app.use('/api', createContextRouter(auth, context))
  app.use('/api/tools', createToolsRouter(auth, context))
  app.use('/api/mutual-fund', createMutualFundRouter(auth, context, database))
  app.get('/health', (req, res) => res.json({ status: 'ok', service: 'tools-api' }))
  app.get('/api/health', (req, res) => res.json({ status: 'ok', service: 'taxpreco-tools' }))
  app.use((error, req, res, next) => {
    if (res.headersSent) return next(error)
    res.status(error.type === 'entity.parse.failed' ? 400 : 500).json({ error: 'Request could not be processed.' })
  })
  return app
}
module.exports = { createApp, allowedOrigins }
