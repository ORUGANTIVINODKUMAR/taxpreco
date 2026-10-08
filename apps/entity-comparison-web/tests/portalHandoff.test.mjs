import test from 'node:test'
import assert from 'node:assert/strict'
import { portalLoginUrl, receivePortalHandoff, sanitizeNext } from '../src/portalHandoff.ts'

const config = { apiUrl: 'http://192.168.0.74:3000', portalUrl: 'https://portal.example' }
function boundary(hash, fetcher, search = '') {
  const events = []
  const browser = {
    location: { pathname: '/auth/portal', origin: 'http://localhost:5175', hash, search },
    history: { state: { existing: true }, replaceState(state, unused, url) { events.push({ type: 'clear', state, url }) } },
    fetch: (...args) => { events.push({ type: 'fetch', args }); return fetcher(...args) },
  }
  return { browser, events }
}
function json(body, status = 200) { return new Response(JSON.stringify(body), { status }) }

test('captures once, clears first, preserves only tool context, and sends exact exchange contract', async () => {
  const { browser, events } = boundary('#token=test-secret&next=%2Fhome%3FtaxYear%3D2026', async () => json({ customToken: 'custom-secret' }), '?clientId=c1&taxYear=2026&token=unwanted')
  const promise = receivePortalHandoff(browser, config)
  assert.equal(events[0].type, 'clear')
  assert.equal(events[0].url, '/auth/portal?clientId=c1&taxYear=2026')
  assert.deepEqual(events[0].state, { existing: true })
  const result = await promise
  await promise // Multiple subscribers (including StrictMode replay) share one exchange.
  assert.equal(events.filter(e => e.type === 'fetch').length, 1)
  const [url, options] = events[1].args
  assert.equal(url, config.apiUrl + '/v1/auth/portal-token')
  assert.equal(options.method, 'POST')
  assert.deepEqual(options.headers, { Authorization: 'Bearer test-secret' })
  assert.equal(options.body, undefined)
  assert.deepEqual(result, { status: 'received', next: '/home?taxYear=2026' })
  assert.ok(!JSON.stringify(result).includes('secret'))
})

test('missing or blank token clears the hash without contacting Maigha', async () => {
  for (const hash of ['', '#next=%2Fhome', '#token=', '#token=%20']) {
    const { browser, events } = boundary(hash, () => { throw new Error('must not fetch') })
    assert.equal((await receivePortalHandoff(browser, config)).status, 'error')
    assert.equal(events.length, 1)
  }
})

test('missing or invalid config fails without leaking token or making requests', async () => {
  for (const bad of [{}, { ...config, apiUrl: 'javascript:alert(1)' }, { ...config, portalUrl: 'https://user:password@example.com' }]) {
    const { browser, events } = boundary('#token=test-secret', () => { throw new Error('must not fetch') })
    const result = await receivePortalHandoff(browser, bad)
    assert.equal(result.status, 'error')
    assert.equal(events.length, 1)
    assert.ok(!result.message.includes('test-secret'))
  }
})

test('login URL uses the contract app id and accepts only HTTP origins', () => {
  assert.equal(portalLoginUrl(config.portalUrl), 'https://portal.example/login?app=entity-comparison')
  for (const invalid of [undefined, '', '/login', 'javascript:alert(1)', 'https://portal.example/path', 'https://portal.example?token=x']) assert.equal(portalLoginUrl(invalid), null)
})

test('unsafe or recursive next destinations fall back to home', () => {
  for (const invalid of [null, '', 'https://evil.example', '//evil.example', '/\\evil.example', '/%5Cevil.example', '/%2Fevil.example', '/%252Fevil.example', '/auth/portal', '/auth/portal/', '/a/../auth/portal', '/auth/%70ortal', '/auth/portal?next=/', '/home\n', '/home%0a', '/%zz']) {
    assert.equal(sanitizeNext(invalid, 'http://localhost:5175'), '/', String(invalid))
  }
  assert.equal(sanitizeNext('/home?clientId=c1&taxYear=2026', 'http://localhost:5175'), '/home?clientId=c1&taxYear=2026')
})

test('non-2xx response uses a safe server message and redacts reflected handoff token', async () => {
  const { browser } = boundary('#token=test-secret', async () => json({ message: 'Expired token test-secret' }, 401))
  assert.deepEqual(await receivePortalHandoff(browser, config), { status: 'error', message: 'Expired token [redacted]' })
})

test('malformed responses and empty custom tokens cannot complete the exchange', async () => {
  for (const response of [json({}), json({ customToken: '' }), json({ customToken: '  ' }), json({ customToken: 42 }), new Response('not JSON'), new Response('<h1>error</h1>', { status: 500 })]) {
    const { browser } = boundary('#token=test-secret', async () => response)
    assert.equal((await receivePortalHandoff(browser, config)).status, 'error')
  }
})

test('network/CORS errors show a clear error without exposing request details', async () => {
  const { browser } = boundary('#token=test-secret', async () => { throw new TypeError('fetch failed: test-secret') })
  const result = await receivePortalHandoff(browser, config)
  assert.equal(result.status, 'error')
  assert.match(result.message, /Unable to contact Tapreco/)
  assert.ok(!result.message.includes('test-secret'))
})

test('slow requests are aborted and reported as a timeout', async () => {
  const { browser } = boundary('#token=test-secret', async (url, { signal }) => new Promise((resolve, reject) => { signal.addEventListener('abort', () => reject(new Error('aborted')), { once: true }) }))
  const result = await receivePortalHandoff(browser, config, 10)
  assert.equal(result.status, 'error')
  assert.match(result.message, /too long/)
})
