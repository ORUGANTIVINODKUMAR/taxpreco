import type { Plugin } from 'vite'

// This module runs in Node; the private key never enters browser environment variables.
export function devLoginPlugin(env: Record<string, string>): Plugin {
  return {
    name: 'local-development-login',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/__dev-auth/login', async (req, res) => {
        res.setHeader('Cache-Control', 'no-store')
        res.setHeader('Content-Type', 'application/json')
        const fail = (status: number, error: string) => { res.statusCode = status; res.end(JSON.stringify({ error })) }
        if (env.VITE_DEV_AUTO_LOGIN !== 'true') return fail(404, 'Development login is disabled.')
        // A browser must call its own Vite origin; cross-origin pages cannot mint tokens.
        const expectedOrigin = new URL(server.config.server.https ? 'https://' + req.headers.host : 'http://' + req.headers.host).origin
        if (req.method !== 'POST' || req.headers.origin !== expectedOrigin || req.headers['content-type'] !== 'application/json') return fail(403, 'Use the local app to sign in.')
        if (!env.DEV_AUTO_LOGIN_KEY || env.DEV_AUTO_LOGIN_KEY.length < 32) return fail(503, 'Development login key is missing.')
        try {
          const response = await fetch('http://127.0.0.1:4000/api/dev/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-Dev-Login-Key': env.DEV_AUTO_LOGIN_KEY },
            body: '{}',
            signal: AbortSignal.timeout(15_000),
          })
          const body = await response.text()
          res.statusCode = response.status
          res.end(body)
        } catch { fail(503, 'The local tools-api is unavailable. Start it on port 4000.') }
      })
    },
  }
}
