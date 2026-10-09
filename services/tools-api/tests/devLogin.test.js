const { test } = require('node:test')
const assert = require('node:assert/strict')
const { devLoginConfig, createDevLoginHandler } = require('../src/devLogin')
const { createRequireAuth } = require('../src/middleware/auth')
const config = { uid: 'fixed-test-uid', key: 'a'.repeat(64) }
function response() {
  return { statusCode: 200, headers: {}, set(k, v) { this.headers[k] = v; return this }, status(n) { this.statusCode = n; return this }, json(value) { this.body = value; return this } }
}
function request(overrides = {}) {
  return { socket: { remoteAddress: '127.0.0.1' }, get: () => config.key, body: {}, query: {}, ...overrides }
}

test('development login defaults off and rejects production/missing configuration', () => {
  assert.equal(devLoginConfig({}), null)
  for (const env of [{ NODE_ENV: 'production' }, { NODE_ENV: 'development' }]) assert.throws(() => devLoginConfig({ DEV_AUTO_LOGIN_ENABLED: 'true', ...env }))
  assert.deepEqual(devLoginConfig({ NODE_ENV: 'development', DEV_AUTO_LOGIN_ENABLED: 'true', DEV_FIREBASE_UID: config.uid, DEV_AUTO_LOGIN_KEY: config.key }), config)
})

test('remote requests, missing key and caller-selected identities cannot mint tokens', async () => {
  const handler = createDevLoginHandler({ config, database: { query: () => assert.fail('must not query') }, auth: () => assert.fail('must not sign') })
  for (const [req, status] of [[request({ socket: { remoteAddress: '192.168.0.174' } }), 403], [request({ get: () => '' }), 403], [request({ body: { uid: 'another-user' } }), 400], [request({ query: { uid: 'another-user' } }), 400]]) {
    const res = response(); await handler(req, res); assert.equal(res.statusCode, status)
  }
})

test('only a provisioned existing Firebase user can receive a marked custom token', async () => {
  const calls = []
  const handler = createDevLoginHandler({ config,
    database: { query: async (sql, args) => { assert.match(sql, /^SELECT/); assert.deepEqual(args, [config.uid]); return { rows: [{ id: 'local-id' }] } } },
    auth: () => ({ getUser: async uid => { calls.push(uid); return { disabled: false } }, createCustomToken: async (uid, claims) => { calls.push({ uid, claims }); return 'test-custom-token' } }),
  })
  const res = response(); await handler(request(), res)
  assert.equal(res.headers['Cache-Control'], 'no-store')
  assert.deepEqual(res.body, { customToken: 'test-custom-token' })
  assert.deepEqual(calls, [config.uid, { uid: config.uid, claims: { taxpreco_dev_login: true } }])
})

test('unprovisioned, disabled accounts and outages fail closed without token issuance', async () => {
  for (const scenario of ['unprovisioned', 'disabled', 'database', 'firebase']) {
    const handler = createDevLoginHandler({ config,
      database: { query: async () => { if (scenario === 'database') throw new Error('private'); return { rows: scenario === 'unprovisioned' ? [] : [{ id: 'local-id' }] } } },
      auth: () => ({ getUser: async () => { if (scenario === 'firebase') throw new Error('private'); return { disabled: true } }, createCustomToken: () => assert.fail('must not mint') }),
    })
    const res = response(); await handler(request(), res)
    assert.equal(res.statusCode, ['database', 'firebase'].includes(scenario) ? 503 : 403)
    assert.ok(!JSON.stringify(res.body).includes('private'))
  }
})

test('marked development ID tokens are rejected when disabled or production; portal tokens remain accepted', async () => {
  const previous = { NODE_ENV: process.env.NODE_ENV, DEV_AUTO_LOGIN_ENABLED: process.env.DEV_AUTO_LOGIN_ENABLED, DEV_FIREBASE_UID: process.env.DEV_FIREBASE_UID }
  try {
    for (const [mode, enabled, uid, allowed] of [['production', 'true', config.uid, false], ['development', 'false', config.uid, false], ['development', 'true', 'other', false], ['development', 'true', config.uid, true]]) {
      process.env.NODE_ENV = mode; process.env.DEV_AUTO_LOGIN_ENABLED = enabled; process.env.DEV_FIREBASE_UID = config.uid
      const res = response(); let passed = false
      await createRequireAuth(async () => ({ uid, taxpreco_dev_login: true }))({ headers: { authorization: 'Bearer test' } }, res, () => { passed = true })
      assert.equal(passed, allowed)
      if (!allowed) assert.equal(res.statusCode, 401)
    }
    process.env.NODE_ENV = 'production'
    let passed = false
    await createRequireAuth(async () => ({ uid: 'portal-user' }))({ headers: { authorization: 'Bearer test' } }, response(), () => { passed = true })
    assert.equal(passed, true)
  } finally {
    for (const [key, value] of Object.entries(previous)) { if (value === undefined) delete process.env[key]; else process.env[key] = value }
  }
})
