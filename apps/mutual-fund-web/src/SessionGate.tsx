import { useEffect, useSyncExternalStore } from 'react'
import { session } from './firebaseAuth'
import { portalLoginUrl } from './portalHandoff'
import ProvisionedWorkspace from './ProvisionedWorkspace'
import App from './App'
import './App.css'
import './PortalHandoff.css'

export default function SessionGate() {
  const state = useSyncExternalStore(session.subscribe, session.snapshot)
  const loginUrl = portalLoginUrl(import.meta.env.VITE_PORTAL_URL)
  useEffect(() => {
    if (state.status === 'signed-out' && loginUrl) window.location.replace(loginUrl)
  }, [state.status, loginUrl])

  if (state.status === 'provision-pending') return <ProvisionedWorkspace key={state.uid} />
  if (state.status !== 'error') return <App pending key="pending-workspace" />

  const heading = 'Unable to sign in'
  const message = state.message
  return <main className="portal-handoff">
    <section className="card portal-handoff-card" aria-labelledby="session-title">
      <p className="portal-handoff-brand">Tapreco · Mutual Fund</p>
      <h1 id="session-title">{heading}</h1>
      <p role={state.status === 'error' ? 'alert' : 'status'}>{message}</p>
      {loginUrl &&
        <p><a className="portal-handoff-link" href={loginUrl}>Return to Tapreco login</a></p>}
    </section>
  </main>
}
