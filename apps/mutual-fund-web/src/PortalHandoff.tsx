import { useEffect, useState } from 'react'
import type { PortalHandoffResult } from './portalHandoff'
import './App.css'
import './PortalHandoff.css'

type Props = {
  result: Promise<PortalHandoffResult>
  loginUrl: string | null
}

export default function PortalHandoff({ result, loginUrl }: Props) {
  const [state, setState] = useState<PortalHandoffResult | null>(null)

  useEffect(() => {
    let active = true
    // The promise is created once before React mounts, so StrictMode replay
    // subscribes to the same request instead of consuming the hash again.
    void result.then((value) => {
      if (active) setState(value)
    })
    return () => { active = false }
  }, [result])

  const heading = !state
    ? 'Connecting to Tapreco'
    : state.status === 'error'
      ? 'Unable to connect to Tapreco'
      : 'Tapreco handoff received'

  return (
    <main className="portal-handoff">
      <section className="card portal-handoff-card" aria-labelledby="handoff-title">
        <p className="portal-handoff-brand">Tapreco · Mutual Fund</p>
        <h1 id="handoff-title">{heading}</h1>
        <div role={state?.status === 'error' ? 'alert' : 'status'} aria-live="polite">
          <p>
            {!state
              ? 'Please wait while we receive your login from Tapreco.'
              : state.status === 'error'
                ? state.message
                : 'The login exchange succeeded. Mutual Fund sign-in is not enabled yet.'}
          </p>
        </div>
        {state && (loginUrl
          ? <a className="portal-handoff-link" href={loginUrl}>Return to Tapreco login</a>
          : <p>Please contact support for the Tapreco login address.</p>)}
      </section>
    </main>
  )
}
