import { useEffect, useSyncExternalStore } from 'react'
import { session } from './firebaseAuth'
import { portalLoginUrl } from './portalHandoff'
import ProvisionedWorkspace from './ProvisionedWorkspace'
import App from './App'
import './PortalHandoff.css'

export function PendingWorkspace() {
  return <><p className="portal-session-status" role="status">Loading Audit Risk Analyzer...</p><div style={{ display: 'contents' }} inert><App pending /></div></>
}

export default function SessionGate() {
  const state = useSyncExternalStore(session.subscribe, session.snapshot)
  const loginUrl = portalLoginUrl(import.meta.env.VITE_PORTAL_URL)
  useEffect(() => {
    if (state.status === 'signed-out' && loginUrl) window.location.replace(loginUrl)
  }, [state.status, loginUrl])
  if (state.status === 'provision-pending') return <ProvisionedWorkspace key={state.uid} />
  if (state.status !== 'error') return <PendingWorkspace />
  return <main className="portal-session-error"><h1>Unable to sign in</h1><p role="alert">{state.message}</p>{loginUrl && <a href={loginUrl}>Return to Tapreco login</a>}</main>
}
