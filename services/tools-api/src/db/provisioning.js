const { randomUUID } = require('node:crypto')

function parseCsv(text) {
  if (Buffer.byteLength(text, 'utf8') > 1024 * 1024) throw new Error('CSV exceeds 1 MB.')
  text = text.replace(/^\uFEFF/, '')
  const rows = []
  let row = [], field = '', quoted = false, closed = false
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i]
    if (quoted) {
      if (char === '"') {
        if (text[i + 1] === '"') { field += '"'; i += 1 }
        else { quoted = false; closed = true }
      } else field += char
    } else if (char === '"') {
      if (field || closed) throw new Error('Invalid CSV quoting.')
      quoted = true
    } else if (char === ',' || char === '\n' || char === '\r') {
      row.push(field); field = ''; closed = false
      if (char !== ',') {
        if (char === '\r' && text[i + 1] === '\n') i += 1
        rows.push(row); row = []
      }
    } else {
      if (closed) throw new Error('Unexpected content after quoted CSV field.')
      field += char
    }
  }
  if (quoted) throw new Error('Unclosed CSV quote.')
  if (field || closed || row.length) { row.push(field); rows.push(row) }
  return rows
}

function validateCsv(text) {
  const rows = parseCsv(text)
  const expected = ['firebase_uid', 'email', 'display_name']
  if (!rows.length || rows[0].length !== 3 || rows[0].some((value, i) => value !== expected[i])) {
    throw new Error('Expected exact CSV headers: firebase_uid,email,display_name.')
  }
  const users = [], seen = new Set()
  for (let i = 1; i < rows.length; i += 1) {
    const row = rows[i]
    if (row.length === 1 && row[0] === '') continue
    const line = i + 1
    if (row.length !== 3) throw new Error(`CSV record ${line}: expected three fields.`)
    const [uid, rawEmail, rawName] = row
    if (!uid || Array.from(uid).length > 128 || /\s/.test(uid) || Array.from(uid).some(c => c.charCodeAt(0) < 32 || c.charCodeAt(0) === 127)) {
      throw new Error(`CSV record ${line}: invalid Firebase UID.`)
    }
    if (seen.has(uid)) throw new Error(`CSV record ${line}: duplicate Firebase UID; resolve conflicting rows before import.`)
    seen.add(uid)
    const email = rawEmail.trim() || null
    const displayName = rawName.trim() || null
    if (email && (email.length > 320 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) {
      throw new Error(`CSV record ${line}: invalid email.`)
    }
    if (displayName && (displayName.length > 255 || Array.from(displayName).some(c => c.charCodeAt(0) < 32 || c.charCodeAt(0) === 127))) {
      throw new Error(`CSV record ${line}: invalid display name.`)
    }
    users.push({ firebaseUid: uid, email, displayName })
  }
  if (!users.length || users.length > 10000) throw new Error('CSV must contain between 1 and 10000 users.')
  return users
}

// Administrative operation only. Caller owns the transaction and import lock.
// Never import this module from authentication middleware or server startup.
async function provisionUsers(client, users) {
  const summary = { inserted: 0, updated: 0, unchanged: 0 }
  for (const user of users) {
    const existing = await client.query('SELECT id, email, display_name FROM public.users WHERE firebase_uid = $1 FOR UPDATE', [user.firebaseUid])
    if (!existing.rows.length) {
      await client.query('INSERT INTO public.users (id, firebase_uid, email, display_name) VALUES ($1, $2, $3, $4)', [randomUUID(), user.firebaseUid, user.email, user.displayName])
      summary.inserted += 1
    } else if (existing.rows[0].email !== user.email || existing.rows[0].display_name !== user.displayName) {
      await client.query('UPDATE public.users SET email = $2, display_name = $3, updated_at = NOW() WHERE firebase_uid = $1', [user.firebaseUid, user.email, user.displayName])
      summary.updated += 1
    } else summary.unchanged += 1
  }
  return summary
}

module.exports = { parseCsv, validateCsv, provisionUsers }
