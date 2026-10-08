const { test, after } = require('node:test')
const assert = require('node:assert/strict')
const { randomUUID } = require('node:crypto')
const { pool } = require('../src/db')
const { createApp } = require('../src/app')
const { context, submission } = require('../src/mutualFundValidation')
after(() => pool.end())

const data = { clientId: 'same-client', taxYear: '2026', residentState: 'Texas', fundName: 'Test fund', amount: 123.45, percentage: 0, stateExempt: 0, stateTaxable: 123.45 }
test('validation rejects invalid context, money, percentages and caller ownership', () => {
  for (const input of [{ ...data, userId: 'forged' }, { ...data, owner_user_id: randomUUID() }, { ...data, amount: NaN }, { ...data, amount: 1.234 }, { ...data, amount: '123' }, { ...data, percentage: 101 }, { ...data, fundName: '' }]) assert.throws(() => submission(input))
  for (const [client, year] of [['', '2026'], [' client', '2026'], [['a', 'b'], '2026'], ['client', 'invalid'], ['client', '1800']]) assert.throws(() => context(client, year))
  assert.equal(submission(data).amount, 123.45)
})

test('PostgreSQL owner isolation, forged ownership, context scoping and legacy exclusion', async () => {
  const client = await pool.connect()
  const a = randomUUID(), b = randomUUID(), uidA = 'owner-a-' + randomUUID(), uidB = 'owner-b-' + randomUUID()
  let server
  try {
    await client.query('BEGIN')
    await client.query('INSERT INTO public.users (id, firebase_uid) VALUES ($1,$2),($3,$4)', [a, uidA, b, uidB])
    const app = createApp({ database: client, verify: async token => ({ uid: token === 'test-a' ? uidA : uidB }) })
    server = app.listen(0, '127.0.0.1')
    await new Promise(resolve => server.once('listening', resolve))
    const base = `http://127.0.0.1:${server.address().port}/api/mutual-fund/sessions`
    const save = (token, body) => fetch(base, { method: 'POST', headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    const get = (token, query = 'clientId=same-client&taxYear=2026') => fetch(base + '?' + query, { headers: { Authorization: 'Bearer ' + token } })
    const savedA = await save('test-a', data), savedB = await save('test-b', { ...data, fundName: 'Other fund' })
    assert.equal(savedA.status, 201); assert.equal(savedB.status, 201)
    const rowA = await savedA.json(), rowB = await savedB.json()
    const owner = (await client.query('SELECT owner_user_id FROM public.mutual_fund_sessions WHERE id=$1', [rowA.id])).rows[0]
    assert.ok(owner.owner_user_id === a)
    assert.equal((await save('test-a', { ...data, owner_user_id: b })).status, 400)
    assert.equal((await save('test-a', { ...data, userId: b })).status, 400)
    await client.query('INSERT INTO public.mutual_fund_sessions (user_id, client_id, tax_year, fund_name) VALUES ($1,$2,$3,$4)', ['legacy-test', data.clientId, data.taxYear, 'Unmapped legacy'])
    const rowsA = await (await get('test-a')).json(), rowsB = await (await get('test-b')).json()
    assert.equal(rowsA.length, 1); assert.equal(rowsB.length, 1)
    assert.ok(String(rowsA[0].id) === String(rowA.id)); assert.ok(String(rowsB[0].id) === String(rowB.id))
    assert.deepEqual(await (await get('test-a', 'clientId=other&taxYear=2026')).json(), [])
    assert.deepEqual(await (await get('test-a', 'clientId=same-client&taxYear=2025')).json(), [])
    const forgedQuery = await (await get('test-a', 'clientId=same-client&taxYear=2026&owner_user_id=' + b)).json()
    assert.equal(forgedQuery.length, 1); assert.ok(String(forgedQuery[0].id) === String(rowA.id))
    const secondSave = await save('test-a', data)
    assert.equal(secondSave.status, 201); assert.ok(String((await secondSave.json()).id) !== String(rowA.id))
    assert.equal((await get('test-a', 'clientId=same-client&taxYear=bad')).status, 400)
    await client.query('SAVEPOINT foreign_key_check')
    await assert.rejects(client.query('INSERT INTO public.mutual_fund_sessions (owner_user_id, client_id, tax_year) VALUES ($1,$2,$3)', [randomUUID(), 'test', '2026']), error => error.code === '23503')
    await client.query('ROLLBACK TO SAVEPOINT foreign_key_check')
  } finally {
    if (server) await new Promise(resolve => server.close(resolve))
    await client.query('ROLLBACK'); client.release()
  }
  assert.equal(Number((await pool.query('SELECT COUNT(*) AS count FROM public.users WHERE id = ANY($1::uuid[])', [[a,b]])).rows[0].count), 0)
})
