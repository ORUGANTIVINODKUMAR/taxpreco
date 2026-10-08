const { test, after } = require('node:test')
const assert = require('node:assert/strict')
const { generateKeyPairSync } = require('node:crypto')
const jwt = require('jsonwebtoken')
const { initializeApp, deleteApp } = require('firebase-admin/app')
const { getAuth } = require('firebase-admin/auth')
const { createApp, allowedOrigins } = require('../src/app')
const { pool } = require('../src/db')

const keys = generateKeyPairSync('rsa', { modulusLength: 2048 })
const app = initializeApp({ projectId: 'maigha-taxpro' }, 'phase4-verification-test')
const auth = getAuth(app)
// Test-only trusted public-key fetch; the real Admin SDK still checks signatures.
auth.idTokenVerifier.signatureVerifier.keyFetcher.fetchPublicKeys = async () => ({ 'test-key': keys.publicKey.export({ type: 'spki', format: 'pem' }) })
const verify = token => auth.verifyIdToken(token)
after(async () => { await deleteApp(app); await pool.end() })

function idToken(uid = 'test-uid', overrides = {}, signingKey = keys.privateKey) {
  const now = Math.floor(Date.now() / 1000)
  return jwt.sign({ aud: 'maigha-taxpro', iss: 'https://securetoken.google.com/maigha-taxpro', sub: uid, iat: now, exp: now + 3600, auth_time: now, firebase: { sign_in_provider: 'custom' }, ...overrides }, signingKey, { algorithm: 'RS256', keyid: 'test-key' })
}
async function requestApp(options, run) {
  const server = createApp(options).listen(0, '127.0.0.1')
  await new Promise(resolve => server.once('listening', resolve))
  const base = `http://127.0.0.1:${server.address().port}`
  try { await run(base) } finally { await new Promise(resolve => server.close(resolve)) }
}
function database(rows = [{ id: 'local-id', firebase_uid: 'test-uid', email: 'test@example.com', display_name: 'Test User' }]) {
  const calls = []
  return { calls, query: async (sql, parameters) => { calls.push({ sql, parameters }); return { rows } } }
}

test('missing/malformed authorization is rejected before verification or database access', async () => {
  const db = database()
  await requestApp({ verify: () => assert.fail('must not verify'), database: db }, async base => {
    for (const header of [undefined, 'Basic abc', 'Bearer', 'Bearer a b']) {
      const response = await fetch(base + '/api/me', { headers: header ? { Authorization: header } : {} })
      assert.equal(response.status, 401)
    }
  })
  assert.equal(db.calls.length, 0)
})

test('Admin SDK rejects expired, wrong-project, forged, custom and shared-secret tokens', async () => {
  const db = database()
  const otherKey = generateKeyPairSync('rsa', { modulusLength: 2048 }).privateKey
  const now = Math.floor(Date.now() / 1000)
  const tokens = [
    idToken('test-uid', { exp: now - 300 }),
    idToken('test-uid', { aud: 'wrong-project' }),
    idToken('test-uid', { iss: 'https://securetoken.google.com/wrong-project' }),
    idToken('test-uid', {}, otherKey),
    jwt.sign({ uid: 'test-uid', aud: 'https://identitytoolkit.googleapis.com/google.identity.identitytoolkit.v1.IdentityToolkit', iss: 'test@example.com', sub: 'test@example.com' }, keys.privateKey, { algorithm: 'RS256' }),
    jwt.sign({ sub: 'test-uid' }, 'old-shared-secret'),
    'not-a-jwt',
  ]
  await requestApp({ verify, database: db }, async base => {
    for (const token of tokens) {
      const response = await fetch(base + '/api/me', { headers: { Authorization: 'Bearer ' + token } })
      assert.equal(response.status, 401)
      assert.equal((await response.json()).code, 'unauthenticated')
    }
  })
  assert.equal(db.calls.length, 0)
})

test('valid signature resolves only verified UID and returns stable local identity', async () => {
  const db = database()
  await requestApp({ verify, database: db }, async base => {
    const response = await fetch(base + '/api/me?userId=forged&firebaseUid=other', { headers: { Authorization: 'Bearer ' + idToken('test-uid', { userId: 'forged', clientId: 'forged-client' }) } })
    assert.equal(response.status, 200)
    const body = await response.json()
    assert.equal(body.mode, 'firebase')
    assert.equal(body.user.id, 'local-id')
    assert.equal(body.user.firebaseUid, 'test-uid')
    assert.equal(body.user.role, undefined)
  })
  assert.deepEqual(db.calls[0].parameters, ['test-uid'])
  assert.ok(db.calls.every(call => call.sql.startsWith('SELECT')))
})

test('unprovisioned identity gets 403 with no insertion; database outage is separate 503', async () => {
  const db = database([])
  await requestApp({ verify, database: db }, async base => {
    const response = await fetch(base + '/api/me', { headers: { Authorization: 'Bearer ' + idToken() } })
    assert.equal(response.status, 403)
    assert.equal((await response.json()).code, 'user_not_provisioned')
  })
  assert.ok(db.calls.every(call => call.sql.startsWith('SELECT')))
  await requestApp({ verify, database: { query: async () => { throw new Error('private DB details') } } }, async base => {
    const response = await fetch(base + '/api/me', { headers: { Authorization: 'Bearer ' + idToken() } })
    assert.equal(response.status, 503)
    const body = await response.json()
    assert.equal(body.code, 'database_unavailable')
    assert.ok(!JSON.stringify(body).includes('private'))
  })
})

test('certificate/network verification outage fails closed with 503', async () => {
  await requestApp({ verify: async () => { throw Object.assign(new Error('private verification detail'), { code: 'auth/internal-error' }) }, database: database() }, async base => {
    const response = await fetch(base + '/api/me', { headers: { Authorization: 'Bearer test' } })
    assert.equal(response.status, 503)
    assert.equal((await response.json()).code, 'auth_unavailable')
  })
})

test('protected tools and saved-work routes require provisioned identity and owner-scoped queries', async () => {
  const db = database()
  await requestApp({ verify, database: db }, async base => {
    for (const pathname of ['/api/context', '/api/tools/mutual-fund/status', '/api/mutual-fund/sessions']) {
      assert.equal((await fetch(base + pathname)).status, 401)
    }
    assert.equal((await fetch(base + '/api/tools/mutual-fund/status', { headers: { Authorization: 'Bearer ' + idToken() } })).status, 200)
    assert.equal((await fetch(base + '/api/mutual-fund/sessions?clientId=c&taxYear=2026&userId=forged', { headers: { Authorization: 'Bearer ' + idToken() } })).status, 200)
    assert.equal((await fetch(base + '/api/mutual-fund/sessions', { method: 'POST', headers: { Authorization: 'Bearer ' + idToken() } })).status, 400)
  })
  const savedWorkQuery = db.calls.find(call => call.sql.includes('FROM public.mutual_fund_sessions'))
  assert.ok(savedWorkQuery.sql.includes('WHERE owner_user_id = $1'))
  assert.deepEqual(savedWorkQuery.parameters, ['local-id', 'c', '2026'])
})

test('allowlisted LAN preflight works; unlisted origins receive no CORS permission; health stays public', async () => {
  await requestApp({ verify, database: database() }, async base => {
    const response = await fetch(base + '/api/me', { method: 'OPTIONS', headers: { Origin: 'http://192.168.0.175:5175', 'Access-Control-Request-Method': 'GET', 'Access-Control-Request-Headers': 'authorization' } })
    assert.equal(response.status, 204)
    assert.equal(response.headers.get('access-control-allow-origin'), 'http://192.168.0.175:5175')
    assert.match(response.headers.get('access-control-allow-headers'), /Authorization/)
    const denied = await fetch(base + '/health', { headers: { Origin: 'https://unlisted.example' } })
    assert.equal(denied.status, 200)
    assert.equal(denied.headers.get('access-control-allow-origin'), null)
  })
  assert.throws(() => allowedOrigins('*'))
  assert.throws(() => allowedOrigins('https://example.com/path'))
})

test('real PostgreSQL seeded-user lookup returns local identity without inserting users', async () => {
  const before = Number((await pool.query('SELECT COUNT(*) AS count FROM public.users')).rows[0].count)
  const row = (await pool.query('SELECT id, firebase_uid FROM public.users ORDER BY id LIMIT 1')).rows[0]
  assert.ok(row)
  await requestApp({ verify, database: pool }, async base => {
    const response = await fetch(base + '/api/me', { headers: { Authorization: 'Bearer ' + idToken(row.firebase_uid) } })
    assert.equal(response.status, 200)
    assert.ok((await response.json()).user.id === row.id)
    const unprovisioned = await fetch(base + '/api/me', { headers: { Authorization: 'Bearer ' + idToken('phase4-unprovisioned-test') } })
    assert.equal(unprovisioned.status, 403)
  })
  assert.equal(Number((await pool.query('SELECT COUNT(*) AS count FROM public.users')).rows[0].count), before)
})
