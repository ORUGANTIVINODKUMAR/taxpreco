import { getApps, initializeApp } from 'firebase/app'
import { browserLocalPersistence, getAuth, onAuthStateChanged, setPersistence, signInWithCustomToken, signOut } from 'firebase/auth'
import { createSession } from './session'

function authInstance() {
  const env = import.meta.env
  const config = {
    apiKey: env.VITE_APP_FIREBASE_API_KEY,
    authDomain: env.VITE_APP_FIREBASE_AUTH_DOMAIN,
    projectId: env.VITE_APP_FIREBASE_PROJECT_ID,
    appId: env.VITE_APP_FIREBASE_APP_ID,
  }
  if (Object.values(config).some((value) => !value) || config.projectId !== 'maigha-taxpro') {
    throw new Error('Firebase configuration is missing or uses the wrong project.')
  }
  const app = getApps().find((value) => value.name === 'entity-comparison') || initializeApp(config, 'entity-comparison')
  return getAuth(app)
}

export const session = createSession({
  restore: () => authInstance().authStateReady(),
  persist: () => setPersistence(authInstance(), browserLocalPersistence),
  signIn: async (token) => { await signInWithCustomToken(authInstance(), token) },
  signOut: () => signOut(authInstance()),
  user: () => authInstance().currentUser,
  observe: (callback) => onAuthStateChanged(authInstance(), callback),
})

// Requests in Phase 5 will call this helper for a current, SDK-refreshed token.
export const getCurrentIdToken = () => session.currentIdToken()
