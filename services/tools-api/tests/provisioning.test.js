const test = require('node:test')
const assert = require('node:assert/strict')
const { validateCsv, parseCsv, provisionUsers } = require('../src/db/provisioning')

test('CSV accepts BOM, CRLF, quoted commas and escaped quotes without changing UID', () => {
  const rows = validateCsv('\uFEFFfirebase_uid,email,display_name\r\nuid-A,a@example.com,"Person, ""A"""\r\nuid-B,,\r\n')
  assert.deepEqual(rows, [{ firebaseUid: 'uid-A', email: 'a@example.com', displayName: 'Person, "A"' }, { firebaseUid: 'uid-B', email: null, displayName: null }])
})

test('duplicate UIDs and conflicting mappings fail before any writes', () => {
  for (const second of ['uid-A,a@example.com,Same', 'uid-A,b@example.com,Different']) {
    assert.throws(() => validateCsv('firebase_uid,email,display_name\nuid-A,a@example.com,Same\n' + second), /duplicate/)
  }
})

test('invalid identities, headers, profiles and malformed CSV are rejected without revealing values', () => {
  const header = 'firebase_uid,email,display_name\n'
  for (const text of [header, header + ',,', header + ' uid,,', header + 'a b,,', header + 'x'.repeat(129) + ',,', header + 'uid,not-email,', header + 'uid,a@example.com,"unclosed', header + 'uid,a@example.com,"closed"extra', header + 'uid,a@example.com,name,extra', 'firebase_uid,password,display_name\nuid,password,name']) {
    assert.throws(() => validateCsv(text))
  }
  assert.throws(() => parseCsv('x'.repeat(1024 * 1024 + 1)), /1 MB/)
})

test('seed preserves stable IDs, skips identical profiles and updates metadata only', async () => {
  const statements = []
  const client = { query: async (sql, args) => {
    statements.push({ sql, args })
    if (sql.startsWith('SELECT')) return { rows: args[0] === 'new' ? [] : [{ id: 'stable-id', email: 'old@example.com', display_name: 'Old' }] }
    return { rows: [] }
  } }
  const result = await provisionUsers(client, [
    { firebaseUid: 'new', email: null, displayName: null },
    { firebaseUid: 'same', email: 'old@example.com', displayName: 'Old' },
    { firebaseUid: 'changed', email: 'new@example.com', displayName: 'New' },
  ])
  assert.deepEqual(result, { inserted: 1, updated: 1, unchanged: 1 })
  const updates = statements.filter(value => value.sql.startsWith('UPDATE'))
  assert.equal(updates.length, 1)
  assert.ok(!updates[0].sql.includes('SET id'))
  assert.ok(!statements.some(value => value.sql.includes('mutual_fund_sessions')))
  assert.match(statements.find(value => value.sql.startsWith('INSERT')).args[0], /^[0-9a-f-]{36}$/)
})
