import { useEffect, useState } from 'react'
import App from './App'
import { getMe } from './api'
import type { LocalUser } from './api'

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
  if (!state.error) return <App pending key="pending-provisioning" />
  return <main className="portal-handoff"><section className="card portal-handoff-card">
    <h1>Checking your account</h1>
    <p role={state.error ? 'alert' : 'status'}>{state.error || 'Please wait while we confirm access to Mutual Fund.'}</p>
    {state.error && <button onClick={() => { setState({}); setAttempt(value => value + 1) }}>Retry</button>}
  </section></main>
}
