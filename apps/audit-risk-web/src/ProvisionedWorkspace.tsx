import { useEffect, useState } from 'react'
import App from './App'
import { getMe } from './api'
import type { LocalUser } from './api'
import { PendingWorkspace } from './SessionGate'

export default function ProvisionedWorkspace() {
  const [state, setState] = useState<{ user?: LocalUser; error?: string }>({})
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    const abort = new AbortController()
    void getMe(abort.signal).then(user => {
      if (!abort.signal.aborted) setState({ user })
    }).catch(() => {
      if (!abort.signal.aborted) setState({ error: 'Unable to check your account. Please retry when the service is available.' })
    })
    return () => abort.abort()
  }, [attempt])
  if (state.user) return <App key={state.user.id} />
  if (!state.error) return <PendingWorkspace />
  return <main className="portal-session-error"><h1>Unable to check your account</h1><p role="alert">{state.error}</p><button onClick={() => { setState({}); setAttempt(value => value + 1) }}>Retry</button></main>
}
