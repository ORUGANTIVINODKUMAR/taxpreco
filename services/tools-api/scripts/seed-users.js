const fs = require('node:fs/promises')
const path = require('node:path')
const { validateCsv, provisionUsers } = require('../src/db/provisioning')

async function main() {
  const args = process.argv.slice(2)
  const fileIndex = args.indexOf('--file')
  const dryRun = args.includes('--dry-run')
  if (fileIndex < 0 || !args[fileIndex + 1] || args.some((arg, i) => arg !== '--file' && arg !== '--dry-run' && i !== fileIndex + 1)) {
    throw new Error('Usage: npm.cmd run users:seed -- --file <CSV path> [--dry-run]')
  }
  let text
  try { text = await fs.readFile(path.resolve(args[fileIndex + 1]), 'utf8') }
  catch { throw new Error('Could not read the CSV file.') }
  const users = validateCsv(text)
  if (dryRun) {
    console.log(JSON.stringify({ validatedUsers: users.length, dryRun: true, databaseTouched: false }))
    return
  }
  const { pool } = require('../src/db')
  let client
  try {
    client = await pool.connect()
    await client.query('BEGIN')
    await client.query("SELECT pg_advisory_xact_lock(hashtext('upsilon-administrative-provisioning'))")
    const result = await provisionUsers(client, users)
    await client.query('COMMIT')
    console.log(JSON.stringify({ validatedUsers: users.length, ...result }))
  } catch {
    if (client) await client.query('ROLLBACK')
    throw new Error('User import failed and rolled back. Check connectivity and run db:migrate first; review any schema or UID conflicts.')
  } finally { client?.release(); await pool.end() }
}

main().catch(error => { console.error(error.message); process.exitCode = 1 })
