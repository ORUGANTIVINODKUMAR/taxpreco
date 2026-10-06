import express from 'express'
import cors from 'cors'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import type { ServerConfig } from './config.js'
import { healthRouter } from './routes/health.js'
import { toolsRouter } from './routes/tools.js'
import { createAuthRouter } from './routes/auth.js'

export function createApp(config: ServerConfig) {
  const app = express()
  app.disable('x-powered-by')
  app.use('/api', cors({
    origin: (origin, callback) => callback(null, origin === config.allowedOrigin),
    methods: ['GET', 'OPTIONS'],
    allowedHeaders: ['Authorization', 'Content-Type'],
  }))
  app.use('/api', (_request, response, next) => {
    response.set('Cache-Control', 'no-store')
    next()
  })
  app.use('/api', healthRouter, toolsRouter, createAuthRouter(config))
  // Unknown API routes must never return frontend HTML.
  app.use('/api', (_request, response) => { response.status(404).json({ error: 'api_route_not_found' }) })
  if (config.serveFrontend) {
    const frontendDirectory = fileURLToPath(new URL('../../../apps/entity-comparison-web/dist/', import.meta.url))
    if (!existsSync(`${frontendDirectory}/index.html`)) throw new Error('Run npm run build before serving the frontend.')
    // Hash-based navigation needs no server-side SPA fallback routes.
    app.use(express.static(frontendDirectory))
  }
  app.use((_request, response) => { response.status(404).json({ error: 'not_found' }) })
  return app
}
