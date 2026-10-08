const { pool } = require('../db')

function createAttachContext(database = pool) {
  return async function attachContext(req, res, next) {
    if (!req.user?.uid) return res.status(401).json({ code: 'unauthenticated', error: 'Verified Firebase identity is required.' })
    try {
      const result = await database.query('SELECT id, firebase_uid, email, display_name FROM public.users WHERE firebase_uid = $1', [req.user.uid])
      const user = result.rows[0]
      if (!user) return res.status(403).json({ code: 'user_not_provisioned', error: 'Your account is not provisioned. Please contact your administrator.' })
      req.localUser = user
      req.context = { userId: user.id, firebaseUid: user.firebase_uid, email: user.email }
      next()
    } catch {
      res.status(503).json({ code: 'database_unavailable', error: 'User lookup is temporarily unavailable. Please try again.' })
    }
  }
}
module.exports = { createAttachContext, attachContext: createAttachContext() }
