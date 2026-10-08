export type SessionUser = { uid: string; getIdToken: () => Promise<string> }
export type SessionState =
  | { status: 'restoring' | 'receiving' | 'signed-out' }
  | { status: 'provision-pending'; uid: string }
  | { status: 'error'; message: string }

export type AuthBoundary = {
  restore: () => Promise<void>
  persist: () => Promise<void>
  signIn: (token: string) => Promise<void>
  signOut: () => Promise<void>
  user: () => SessionUser | null
  observe: (callback: () => void) => () => void
}

export function createSession(auth: AuthBoundary) {
  let state: SessionState = { status: 'restoring' }
  let locked = true
  const listeners = new Set<() => void>()
  const publish = (value: SessionState) => {
    state = value
    listeners.forEach((listener) => listener())
  }
  const reflect = () => {
    if (locked) return
    const user = auth.user()
    publish(user ? { status: 'provision-pending', uid: user.uid } : { status: 'signed-out' })
  }
  let unsubscribe: (() => void) | undefined
  let preparation: Promise<void> | undefined
  let startPromise: Promise<void> | undefined
  const prepareHandoff = () => preparation ??= (async () => {
    await auth.restore()
    await auth.signOut()
    await auth.persist()
  })()
  return {
    snapshot: () => state,
    subscribe(listener: () => void) {
      listeners.add(listener)
      return () => { listeners.delete(listener) }
    },
    async accept(customToken: string) {
      await prepareHandoff()
      try { await auth.signIn(customToken) }
      catch { throw new Error('Firebase could not complete sign-in. Please open Audit Risk Analyzer from Tapreco again.') }
    },
    start(handoff: Promise<{ status: string; message?: string; next?: string }> | null, navigate: (next: string) => void) {
      return startPromise ??= (async () => {
        publish({ status: handoff ? 'receiving' : 'restoring' })
        try {
          unsubscribe = auth.observe(reflect)
          if (handoff) {
            // Attach rejection handling immediately while the exchange is in flight.
            const prepared = prepareHandoff().then(() => null, () => 'Unable to prepare a persistent Firebase session.')
            const result = await handoff
            const failure = await prepared
            if (result.status === 'error' || failure) {
              await auth.signOut()
              publish({ status: 'error', message: result.message || failure || 'Sign-in failed.' })
              return
            }
            if (!auth.user()) throw new Error('No Firebase session was established.')
            navigate(result.next || '/')
          } else {
            await auth.restore()
            await auth.persist()
          }
          locked = false
          reflect()
        } catch {
          if (handoff) await auth.signOut().catch(() => undefined)
          publish({ status: 'error', message: 'Unable to establish a persistent Firebase session. Please open Audit Risk Analyzer from Tapreco again.' })
        }
      })()
    },
    async currentIdToken() {
      const user = auth.user()
      if (locked || state.status !== 'provision-pending' || !user || user.uid !== state.uid) {
        throw new Error('No current signed-in session.')
      }
      const token = await user.getIdToken()
      if (locked || state.status !== 'provision-pending' || auth.user()?.uid !== user.uid || state.uid !== user.uid) throw new Error('The signed-in user changed.')
      return token
    },
    async reject(message: string) {
      locked = true
      publish({ status: 'error', message })
      await auth.signOut().catch(() => undefined)
    },
    async signOut() {
      locked = true
      publish({ status: 'restoring' })
      try {
        await auth.signOut()
        locked = false
        reflect()
      } catch {
        publish({ status: 'error', message: 'Unable to sign out. Please try again.' })
      }
    },
    dispose() { unsubscribe?.(); listeners.clear() },
  }
}
