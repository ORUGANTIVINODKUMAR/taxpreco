import assert from 'node:assert/strict'
import { once } from 'node:events'
import test from 'node:test'
import { createApp } from '../src/app.js'
import { readConfig, type ServerConfig } from '../src/config.js'

const development = { NODE_ENV: 'development', AUTH_MODE: 'mock', TAPRECO_ALLOWED_ORIGIN: 'http://localhost:5173' }

async function withServer(config: ServerConfig, check: (url: string) => Promise<void>) {
  const server = createApp(config).listen(0, '127.0.0.1')
  await once(server, 'listening')
  const address = server.address()
  assert.ok(address && typeof address !== 'string')
  try { await check(`http://127.0.0.1:${address.port}`) }
  finally { await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve())) }
}

test('health and public tool catalog respond with Phase 1 metadata', async () => {
  await withServer(readConfig(development), async (url) => {
    const health = await fetch(`${url}/api/health`)
    assert.equal(health.status, 200)
    assert.equal(health.headers.get('cache-control'), 'no-store')
    assert.deepEqual(await health.json(), { status: 'ok', service: 'taxpreco-tools' })
    const tools = await fetch(`${url}/api/tools`)
    assert.equal(tools.status, 200)
    const catalog = await tools.json() as { id: string; enabled: boolean; availability: string }[]
    assert.deepEqual(catalog.map((tool) => tool.id), ['entity-comparison'])
    assert.ok(catalog.every((tool) => tool.enabled))
    assert.equal(catalog[0].availability, 'demo')
    assert.equal((await fetch(`${url}/api/unknown`)).status, 404)
  })
})

test('local development identity is explicitly mock', async () => {
  await withServer(readConfig(development), async (url) => {
    const response = await fetch(`${url}/api/me`)
    assert.equal(response.status, 200)
    assert.deepEqual(await response.json(), {
      authenticated: true, mode: 'mock',
      user: { id: 'demo-user', name: 'Demo Advisor', role: 'advisor' },
    })
  })
})

test('CORS allows only the configured browser origin and supports bearer preflight', async () => {
  await withServer(readConfig(development), async (url) => {
    const allowed = await fetch(`${url}/api/tools`, { headers: { Origin: 'http://localhost:5173' } })
    assert.equal(allowed.headers.get('access-control-allow-origin'), 'http://localhost:5173')
    const denied = await fetch(`${url}/api/tools`, { headers: { Origin: 'https://unapproved.invalid' } })
    assert.equal(denied.headers.get('access-control-allow-origin'), null)
    const preflight = await fetch(`${url}/api/me`, {
      method: 'OPTIONS',
      headers: { Origin: 'http://localhost:5173', 'Access-Control-Request-Method': 'GET', 'Access-Control-Request-Headers': 'Authorization' },
    })
    assert.equal(preflight.status, 204)
    assert.match(preflight.headers.get('access-control-allow-headers') ?? '', /Authorization/)
  })
})

test('JWT mode rejects missing tokens and never accepts an unverified bearer token', async () => {
  await withServer(readConfig({ ...development, AUTH_MODE: 'jwt' }), async (url) => {
    const missing = await fetch(`${url}/api/me`)
    assert.equal(missing.status, 401)
    const unverified = await fetch(`${url}/api/me`, { headers: { Authorization: 'Bearer unverified-test-token' } })
    assert.equal(unverified.status, 503)
    assert.deepEqual(await unverified.json(), { authenticated: false, mode: 'jwt', error: 'jwt_verification_not_configured' })
  })
})

test('providing JWT settings cannot silently enable unimplemented verification', async () => {
  await withServer(readConfig({
    ...development, AUTH_MODE: 'jwt',
    TAPRECO_JWT_ISSUER: 'https://issuer.invalid', TAPRECO_JWT_AUDIENCE: 'test-only', TAPRECO_JWKS_URL: 'https://issuer.invalid/jwks',
  }), async (url) => {
    const response = await fetch(`${url}/api/me`, { headers: { Authorization: 'Bearer unverified-test-token' } })
    assert.equal(response.status, 503)
    assert.equal((await response.json() as { error: string }).error, 'jwt_verification_not_implemented')
  })
})

test('startup rejects mock production auth, non-loopback mock hosts and wildcard CORS', () => {
  assert.throws(() => readConfig({ ...development, NODE_ENV: 'production' }), /forbidden/)
  assert.throws(() => readConfig({ ...development, NODE_ENV: undefined }), /forbidden/)
  assert.throws(() => readConfig({ ...development, HOST: '0.0.0.0' }), /loopback/)
  assert.throws(() => readConfig({ ...development, TAPRECO_ALLOWED_ORIGIN: '*' }), /exact frontend origin/)
  assert.throws(() => readConfig({ ...development, PORT: 'not-a-port' }), /PORT/)
  assert.equal(readConfig({ NODE_ENV: 'production', TAPRECO_ALLOWED_ORIGIN: 'https://frontend.invalid' }).authMode, 'jwt')
})
