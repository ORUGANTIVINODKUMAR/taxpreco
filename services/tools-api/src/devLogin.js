const { timingSafeEqual } = require('node:crypto')

function devLoginConfig(env = process.env) {
  if (env.DEV_AUTO_LOGIN_ENABLED !== 'true') return null
  if (env.NODE_ENV !== 'development') throw new Error('Development auto-login requires NODE_ENV=development.')
  const uid = env.DEV_FIREBASE_UID
  const key = env.DEV_AUTO_LOGIN_KEY
  if (!uid || uid.length > 128 || uid.trim() !== uid || !key || key.length < 32) throw new Error('Development auto-login needs a configured UID and private key.')
  return { uid, key }
}

function isLoopback(address) {
  return ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(address)
}

function createDevLoginHandler({ config, database, auth }) {
  return async (req, res) => {
    res.set('Cache-Control', 'no-store')
    const supplied = req.get('X-Dev-Login-Key') || ''
    const expected = Buffer.from(config.key)
    const actual = Buffer.from(supplied)
    if (!isLoopback(req.socket.remoteAddress) || actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
      return res.status(403).json({ code: 'dev_login_forbidden', error: 'Development login is available only through the local development server.' })
    }
    if (Object.keys(req.body || {}).length || Object.keys(req.query).length) return res.status(400).json({ error: 'Development login does not accept identity parameters.' })
    try {
      const result = await database.query('SELECT id FROM public.users WHERE firebase_uid = $1', [config.uid])
      if (!result.rows.length) return res.status(403).json({ code: 'user_not_provisioned', error: 'The configured test user is not provisioned. Contact your administrator.' })
    } catch {
      return res.status(503).json({ code: 'database_unavailable', error: 'The user database is unavailable.' })
    }
    try {
      const firebase = auth()
      const user = await firebase.getUser(config.uid)
      if (user.disabled) return res.status(403).json({ error: 'The configured Firebase test account is disabled.' })
      const customToken = await firebase.createCustomToken(config.uid, { taxpreco_dev_login: true })
      return res.json({ customToken })
    } catch {
      return res.status(503).json({ code: 'dev_login_unavailable', error: 'Development sign-in is unavailable. Check the Firebase test account and backend Admin credentials.' })
    }
  }
}
module.exports = { devLoginConfig, isLoopback, createDevLoginHandler }
