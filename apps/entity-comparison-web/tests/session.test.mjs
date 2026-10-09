import test from 'node:test'
import assert from 'node:assert/strict'
import { createSession } from '../src/session.ts'
import { receivePortalHandoff } from '../src/portalHandoff.ts'

function fixture(initial = null) {
  let user = initial
  let observer
  let tokenCount = 0
  const events = []
  const userFor = uid => ({ uid, getIdToken: async () => `fresh-${uid}-${++tokenCount}` })
  const auth = {
    restore: async () => { events.push('restore') },
    persist: async () => { events.push('persist') },
    signIn: async token => { events.push('signIn'); assert.equal(token, 'custom-test'); user = userFor('new'); observer?.() },
    signOut: async () => { events.push('signOut'); user = null; observer?.() },
    user: () => user,
    observe: callback => { observer = callback; return () => { observer = undefined; events.push('unsubscribe') } },
  }
  return { auth, events, userFor, setUser(value) { user = value; observer?.() } }
}

test('restoration waits and reads fresh tokens; auth changes and sign-out clear identity', async () => {
  const f = fixture({ uid: 'old', getIdToken: async () => 'old-token' })
  let restored
  f.auth.restore = () => new Promise(resolve => { restored = resolve })
  const session = createSession(f.auth)
  const started = session.start(null, () => assert.fail('must not navigate'))
  assert.equal(session.snapshot().status, 'restoring')
  await assert.rejects(session.currentIdToken())
  restored()
  await started
  assert.deepEqual(session.snapshot(), { status: 'provision-pending', uid: 'old' })
  f.setUser(f.userFor('new'))
  assert.equal(await session.currentIdToken(), 'fresh-new-1')
  assert.equal(await session.currentIdToken(), 'fresh-new-2')
  await session.signOut()
  assert.equal(session.snapshot().status, 'signed-out')
  await assert.rejects(session.currentIdToken())
  session.dispose()
  assert.ok(f.events.includes('unsubscribe'))
})

test('new handoff clears old identity, persists before sign-in and starts exactly once', async () => {
  const f = fixture({ uid: 'old', getIdToken: async () => 'old-token' })
  const session = createSession(f.auth)
  let resolveExchange
  const exchange = new Promise(resolve => { resolveExchange = resolve })
  const destinations = []
  const started = session.start(exchange, next => destinations.push(next))
  assert.equal(session.start(exchange, () => assert.fail('duplicate')), started)
  await session.accept('custom-test')
  assert.equal(session.snapshot().status, 'receiving')
  await assert.rejects(session.currentIdToken())
  resolveExchange({ status: 'received', next: '/home' })
  await started
  assert.deepEqual(f.events, ['restore', 'signOut', 'persist', 'signIn'])
  assert.deepEqual(destinations, ['/home'])
  assert.deepEqual(session.snapshot(), { status: 'provision-pending', uid: 'new' })
})

test('failed exchange never falls back to old session', async () => {
  const f = fixture({ uid: 'old', getIdToken: async () => 'old-token' })
  const session = createSession(f.auth)
  await session.start(Promise.resolve({ status: 'error', message: 'Expired login' }), () => assert.fail('must not navigate'))
  assert.deepEqual(session.snapshot(), { status: 'error', message: 'Expired login' })
  assert.equal(f.auth.user(), null)
  await assert.rejects(session.currentIdToken())
})

test('persistence failure blocks sign-in and never exposes the old user', async () => {
  const f = fixture({ uid: 'old', getIdToken: async () => 'old-token' })
  f.auth.persist = async () => { throw new Error('storage unavailable') }
  const session = createSession(f.auth)
  const exchange = session.accept('custom-test').then(() => ({ status: 'received' }), () => ({ status: 'error', message: 'Cannot persist login' }))
  await session.start(exchange, () => assert.fail('must not navigate'))
  assert.equal(session.snapshot().status, 'error')
  assert.ok(!f.events.includes('signIn'))
  assert.equal(f.auth.user(), null)
})

test('Firebase rejection blocks navigation and clears the session', async () => {
  const f = fixture()
  f.auth.signIn = async () => { throw new Error('sensitive SDK error') }
  const session = createSession(f.auth)
  const exchange = session.accept('custom-test').then(() => ({ status: 'received' }), () => ({ status: 'error', message: 'Sign-in failed' }))
  await session.start(exchange, () => assert.fail('must not navigate'))
  assert.equal(session.snapshot().status, 'error')
  assert.equal(f.auth.user(), null)
})

test('exchange completes Firebase callback before success and keeps custom token out of result', async () => {
  const calls = []
  const browser = {
    location: { pathname: '/auth/portal', search: '', hash: '#token=handoff-test', origin: 'http://localhost:5175' },
    history: { state: null, replaceState() { calls.push('clear') } },
    fetch: async () => new Response(JSON.stringify({ customToken: 'custom-test' })),
  }
  const result = await receivePortalHandoff(browser, { apiUrl: 'https://api.example', portalUrl: 'https://portal.example' }, 20000, async token => {
    assert.equal(token, 'custom-test')
    calls.push('signin')
  })
  assert.deepEqual(calls, ['clear', 'signin'])
  assert.deepEqual(result, { status: 'received', next: '/#entity-comparison' })
})

test('identity change while retrieving a token rejects the stale token', async () => {
  let resolveToken
  const f = fixture({ uid: 'old', getIdToken: () => new Promise(resolve => { resolveToken = resolve }) })
  const session = createSession(f.auth)
  await session.start(null, () => {})
  const token = session.currentIdToken()
  f.setUser(f.userFor('new'))
  resolveToken('old-secret')
  await assert.rejects(token, /changed/)
})

test('provisioning rejection signs out and retains contact-admin error without redirect loop', async () => {
  const f = fixture({ uid: 'old', getIdToken: async () => 'test' })
  const session = createSession(f.auth)
  await session.start(null, () => {})
  await session.reject('Contact your administrator')
  assert.deepEqual(session.snapshot(), { status: 'error', message: 'Contact your administrator' })
  assert.equal(f.auth.user(), null)
  await assert.rejects(session.currentIdToken())
})


test('development sign-in runs once on signed-out startup and preserves restored portal users', async () => {
  const f = fixture()
  let count = 0
  f.auth.developmentSignIn = async () => { count++; f.setUser(f.userFor('dev-test')) }
  const session = createSession(f.auth)
  const first = session.start(null, () => {})
  assert.equal(session.start(null, () => {}), first)
  await first
  assert.equal(count, 1)
  assert.deepEqual(session.snapshot(), { status: 'provision-pending', uid: 'dev-test' })
  const restored = fixture(f.userFor('portal-user'))
  restored.auth.developmentSignIn = async () => assert.fail('must retain portal identity')
  const second = createSession(restored.auth)
  await second.start(null, () => {})
  assert.equal(second.snapshot().uid, 'portal-user')
})

test('portal handoff takes priority over development login; failures stay locked', async () => {
  const f = fixture()
  f.auth.developmentSignIn = async () => assert.fail('must not fall back')
  const session = createSession(f.auth)
  await session.start(Promise.resolve({ status: 'error', message: 'Invalid handoff' }), () => {})
  assert.equal(session.snapshot().status, 'error')
  const failing = fixture()
  failing.auth.developmentSignIn = async () => { throw new Error('test failure') }
  const failed = createSession(failing.auth)
  await failed.start(null, () => {})
  assert.equal(failed.snapshot().status, 'error')
  await assert.rejects(failed.currentIdToken())
})
