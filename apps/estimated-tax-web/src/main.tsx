import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import SessionGate from './SessionGate'
import { receivePortalHandoff } from './portalHandoff'
import { session } from './firebaseAuth'

// Capture and clear the fragment exactly once, outside React's effect lifecycle.
const handoff = window.location.pathname === '/auth/portal'
  ? receivePortalHandoff(
      { location: window.location, history: window.history, fetch: window.fetch.bind(window) },
      {
        apiUrl: import.meta.env.VITE_APP_API_URL,
        portalUrl: import.meta.env.VITE_PORTAL_URL,
      },
      20_000,
      (customToken) => session.accept(customToken),
    )
  : null

void session.start(handoff, (next) => {
  const target = new URL(next, window.location.origin)
  const context = new URLSearchParams(window.location.search)
  for (const key of ['clientId', 'taxYear']) {
    const value = context.get(key)
    if (value !== null) target.searchParams.set(key, value)
  }
  window.history.replaceState(null, '', target.pathname + target.search + target.hash)
})
if (import.meta.hot) import.meta.hot.dispose(() => session.dispose())

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SessionGate />
  </StrictMode>,
)
