import type { RequestHandler } from 'express'
import type { ServerConfig } from '../config.js'

export function authMiddleware(config: ServerConfig): RequestHandler {
  return (request, response, next) => {
    if (config.authMode === 'mock') {
      // Explicitly fake local-development identity; never a production login.
      response.locals.identity = {
        authenticated: true,
        mode: 'mock',
        user: { id: 'demo-user', name: 'Demo Advisor', role: 'advisor' },
      }
      next()
      return
    }
    if (!/^Bearer \S+$/i.test(request.get('authorization') ?? '')) {
      response.status(401).json({ authenticated: false, mode: 'jwt', error: 'bearer_token_required' })
      return
    }
    // Integration boundary: insert server-side signature/JWKS, issuer, audience
    // and expiry verification here when Alpha supplies its contract. Never
    // trust decoded claims or fall back to mock when verification is unavailable.
    const configured = Boolean(config.jwt.issuer && config.jwt.audience && config.jwt.jwksUrl)
    response.status(503).json({
      authenticated: false,
      mode: 'jwt',
      error: configured ? 'jwt_verification_not_implemented' : 'jwt_verification_not_configured',
    })
  }
}
