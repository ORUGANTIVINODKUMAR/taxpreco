import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { db } from './db.js'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function runMigration() {
  try {
    const migrationPath = path.resolve(
      __dirname,
      '../migrations/001_initial_schemas.sql'
    )

    const sql = fs.readFileSync(migrationPath, 'utf8')

    await db.query(sql)

    console.log('Migration completed successfully.')
  } catch (error) {
    console.error('Migration failed:')
    console.error(error)
    process.exitCode = 1
  } finally {
    await db.end()
  }
}

runMigration()