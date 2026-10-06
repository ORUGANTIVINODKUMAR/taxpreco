export interface ServerConfig {
  port: number
  host: string
  authMode: 'mock' | 'jwt'
  allowedOrigin: string
  serveFrontend: boolean
  jwt: { issuer?: string; audience?: string; jwksUrl?: string }
}

export function readConfig(env: NodeJS.ProcessEnv): ServerConfig {
  // Non-development startup is fail-closed. The dev script opts in explicitly.
  const isDevelopment = env.NODE_ENV === 'development' || env.NODE_ENV === 'test'
  const authMode = env.AUTH_MODE ?? (isDevelopment ? 'mock' : 'jwt')
  if (authMode !== 'mock' && authMode !== 'jwt') throw new Error('AUTH_MODE must be mock or jwt.')
  if (authMode === 'mock' && !isDevelopment) {
    throw new Error('DEVELOPMENT MOCK authentication is forbidden outside development/test.')
  }
  const host = env.HOST ?? (authMode === 'mock' ? '127.0.0.1' : '0.0.0.0')
  if (authMode === 'mock' && !['127.0.0.1', 'localhost', '::1'].includes(host)) {
    throw new Error('DEVELOPMENT MOCK must bind to a loopback host.')
  }
  const port = Number(env.PORT ?? 3001)
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT must be between 1 and 65535.')
  const allowedOrigin = env.TAPRECO_ALLOWED_ORIGIN ?? (isDevelopment ? 'http://localhost:5173' : '')
  let origin: URL
  try { origin = new URL(allowedOrigin) } catch { throw new Error('Set TAPRECO_ALLOWED_ORIGIN to the exact frontend origin.') }
  if (!['http:', 'https:'].includes(origin.protocol) || origin.origin !== allowedOrigin) {
    throw new Error('TAPRECO_ALLOWED_ORIGIN must be an exact HTTP(S) origin without a path or wildcard.')
  }
  return {
    port, host, authMode, allowedOrigin,
    serveFrontend: env.SERVE_FRONTEND === 'true',
    jwt: {
      issuer: env.TAPRECO_JWT_ISSUER,
      audience: env.TAPRECO_JWT_AUDIENCE,
      jwksUrl: env.TAPRECO_JWKS_URL,
    },
  }
}
