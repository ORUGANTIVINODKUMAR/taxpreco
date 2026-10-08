const { test, after } = require('node:test')
const assert = require('node:assert/strict')
const { randomUUID } = require('node:crypto')
const { pool } = require('../src/db')
const { provisionUsers } = require('../src/db/provisioning')

after(() => pool.end())

test('PostgreSQL repeat import and metadata update preserve IDs; rollback removes test records', async () => {
  const client = await pool.connect()
  const uid = 'phase3-test-' + randomUUID()
  const user = { firebaseUid: uid, email: 'test@example.com', displayName: 'Test' }
  try {
    await client.query('BEGIN')
    await client.query("SELECT pg_advisory_xact_lock(hashtext('upsilon-administrative-provisioning'))")
    assert.deepEqual(await provisionUsers(client, [user]), { inserted: 1, updated: 0, unchanged: 0 })
    const before = (await client.query('SELECT id, created_at, updated_at FROM public.users WHERE firebase_uid = $1', [uid])).rows[0]
    assert.deepEqual(await provisionUsers(client, [user]), { inserted: 0, updated: 0, unchanged: 1 })
    const unchanged = (await client.query('SELECT id, created_at, updated_at FROM public.users WHERE firebase_uid = $1', [uid])).rows[0]
    assert.deepEqual(unchanged, before)
    assert.deepEqual(await provisionUsers(client, [{ ...user, displayName: 'Changed' }]), { inserted: 0, updated: 1, unchanged: 0 })
    assert.equal((await client.query('SELECT id FROM public.users WHERE firebase_uid = $1', [uid])).rows[0].id, before.id)
    await assert.rejects(client.query('INSERT INTO public.users (id, firebase_uid) VALUES ($1, $2)', [randomUUID(), uid]), error => error.code === '23505')
  } finally {
    await client.query('ROLLBACK')
    client.release()
  }
  assert.equal((await pool.query('SELECT COUNT(*)::int AS count FROM public.users WHERE firebase_uid = $1', [uid])).rows[0].count, 0)
})

test('failure after an earlier insert rolls back the whole import', async () => {
  const client = await pool.connect()
  const uid = 'phase3-rollback-' + randomUUID()
  try {
    await client.query('BEGIN')
    await client.query("SELECT pg_advisory_xact_lock(hashtext('upsilon-administrative-provisioning'))")
    await assert.rejects(provisionUsers(client, [
      { firebaseUid: uid, email: null, displayName: null },
      { firebaseUid: 'x'.repeat(129), email: null, displayName: null },
    ]), error => error.code === '23514')
  } finally {
    await client.query('ROLLBACK')
    client.release()
  }
  assert.equal((await pool.query('SELECT COUNT(*)::int AS count FROM public.users WHERE firebase_uid = $1', [uid])).rows[0].count, 0)
})
