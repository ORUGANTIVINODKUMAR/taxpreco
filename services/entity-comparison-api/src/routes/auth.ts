import { Router } from 'express'
import type { ServerConfig } from '../config.js'
import { authMiddleware } from '../middleware/auth.js'

export function createAuthRouter(config: ServerConfig) {
  const router = Router()
  router.get('/me', authMiddleware(config), (_request, response) => {
    response.json(response.locals.identity)
  })
  return router
}
