const fs = require('node:fs/promises')
const path = require('node:path')
const { createHash } = require('node:crypto')
const { pool } = require('../src/db')

async function main() {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    await client.query("SELECT pg_advisory_xact_lock(hashtext('upsilon-administrative-provisioning'))")
    await client.query('CREATE TABLE IF NOT EXISTS public.tools_schema_migrations (version TEXT PRIMARY KEY, checksum TEXT NOT NULL, applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW())')
    const directory = path.join(__dirname, '../migrations')
    let applied = 0
    for (const version of (await fs.readdir(directory)).filter(name => /^\d+_.*\.sql$/.test(name)).sort()) {
      const sql = await fs.readFile(path.join(directory, version), 'utf8')
      const checksum = createHash('sha256').update(sql.replace(/\r\n/g, '\n')).digest('hex')
      const prior = await client.query('SELECT checksum FROM public.tools_schema_migrations WHERE version = $1', [version])
      if (prior.rows.length) {
        if (prior.rows[0].checksum !== checksum) throw new Error('Applied migration checksum differs; stop and review.')
        continue
      }
      await client.query(sql)
      await client.query('INSERT INTO public.tools_schema_migrations (version, checksum) VALUES ($1, $2)', [version, checksum])
      applied += 1
    }
    await client.query('COMMIT')
    console.log(JSON.stringify({ migrationsApplied: applied }))
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally { client.release() }
}

main().catch(() => { console.error('Migration failed and rolled back. Check database availability, existing schema and migration checksums.'); process.exitCode = 1 }).finally(() => pool.end())
