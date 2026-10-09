const { verifyIdToken } = require('../firebase')

function createRequireAuth(verify = verifyIdToken) {
  return async function requireAuth(req, res, next) {
    const header = req.headers.authorization
    const match = typeof header === 'string' && /^Bearer ([^\s]+)$/.exec(header)
    if (!match) return res.status(401).json({ code: 'unauthenticated', error: 'A Firebase ID token is required.' })
    try {
      const identity = await verify(match[1])
      if (!identity || typeof identity.uid !== 'string' || !identity.uid) return res.status(401).json({ code: 'unauthenticated', error: 'Invalid Firebase identity.' })
      if (identity.taxpreco_dev_login === true && (process.env.NODE_ENV !== 'development' || process.env.DEV_AUTO_LOGIN_ENABLED !== 'true' || identity.uid !== process.env.DEV_FIREBASE_UID)) {
        return res.status(401).json({ code: 'unauthenticated', error: 'Development login is disabled. Sign in through Tapreco.' })
      }
      req.user = identity
      next()
    } catch (error) {
      const invalid = new Set(['auth/argument-error', 'auth/invalid-argument', 'auth/invalid-id-token', 'auth/id-token-expired', 'auth/id-token-revoked', 'auth/user-disabled'])
      const status = invalid.has(error.code) ? 401 : 503
      res.status(status).json({ code: status === 401 ? 'unauthenticated' : 'auth_unavailable', error: status === 401 ? 'Invalid or expired Firebase ID token.' : 'Authentication verification is temporarily unavailable.' })
    }
  }
}
module.exports = { createRequireAuth, requireAuth: createRequireAuth() }
