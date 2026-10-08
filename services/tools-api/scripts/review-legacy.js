const fs = require('node:fs/promises')
const path = require('node:path')
const { pool } = require('../src/db')

async function main() {
  const snapshotPath = path.join(__dirname, '../private/phase3-legacy-snapshot.json')
  const verify = process.argv.includes('--verify')
  const client = await pool.connect()
  try {
    await client.query('BEGIN READ ONLY')
    const rows = (await client.query('SELECT * FROM public.mutual_fund_sessions ORDER BY id')).rows
    const serialized = JSON.stringify(rows, null, 2)
    if (verify) {
      const before = await fs.readFile(snapshotPath, 'utf8')
      const snapshot = JSON.parse(before)
      const originalRows = rows.filter(row => snapshot.some(prior => String(prior.id) === String(row.id)))
      const projected = originalRows.map(row => Object.fromEntries(Object.keys(snapshot[0] || {}).map(key => [key, row[key]])))
      if (before !== JSON.stringify(projected, null, 2) || originalRows.some(row => row.owner_user_id != null)) throw new Error('Legacy rows differ from the saved snapshot; review required.')
      const summary = (await client.query(`SELECT COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE s.user_id IS NULL OR btrim(s.user_id) = '')::int AS missing_owner,
        COUNT(*) FILTER (WHERE EXISTS (SELECT 1 FROM public.users u WHERE u.firebase_uid = s.user_id))::int AS firebase_uid_matches,
        COUNT(*) FILTER (WHERE EXISTS (SELECT 1 FROM public.users u WHERE u.id::text = s.user_id))::int AS local_id_matches
        FROM public.mutual_fund_sessions s`)).rows[0]
      console.log(JSON.stringify({ legacyRowsUnchanged: true, legacySnapshotRows: snapshot.length, ...summary }))
    } else {
      await fs.mkdir(path.dirname(snapshotPath), { recursive: true })
      await fs.writeFile(snapshotPath, serialized, { flag: 'wx' })
      console.log(JSON.stringify({ legacyRowsBackedUp: rows.length, snapshot: 'private/phase3-legacy-snapshot.json' }))
    }
    await client.query('ROLLBACK')
  } finally { client.release() }
}

main().catch(() => { console.error('Legacy review failed. Existing snapshots are never overwritten; check connectivity and review the snapshot locally.'); process.exitCode = 1 }).finally(() => pool.end())
