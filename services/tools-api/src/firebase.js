const { initializeApp, getApps, cert } = require('firebase-admin/app')
const { getAuth } = require('firebase-admin/auth')

function firebaseAuth() {
  const projectId = process.env.FIREBASE_PROJECT_ID
  if (projectId !== 'maigha-taxpro' || process.env.FIREBASE_AUTH_EMULATOR_HOST) throw new Error('Invalid Firebase verification configuration.')
  const existing = getApps().find(app => app.name === 'tools-api')
  if (existing) return getAuth(existing)
  const options = { projectId }
  const privateKey = process.env.FIREBASE_PRIVATE_KEY
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
  if (privateKey || clientEmail) {
    if (!privateKey || !clientEmail) throw new Error('Incomplete Firebase Admin credentials.')
    options.credential = cert({ projectId, clientEmail, privateKey: privateKey.replace(/\\n/g, '\n') })
  }
  return getAuth(initializeApp(options, 'tools-api'))
}

async function verifyIdToken(token) {
  // Signature, expiry and project verification; revocation lookup is not enabled.
  return firebaseAuth().verifyIdToken(token)
}
module.exports = { firebaseAuth, verifyIdToken }
