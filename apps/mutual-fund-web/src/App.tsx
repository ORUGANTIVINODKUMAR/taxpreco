import { useState } from 'react'
import { contextError, getLaunchContext } from './launchContext'
import {
  getMutualFundSessions,
  saveMutualFundSession,
} from './api'
import type { SavedSession } from './api'
import { portalLoginUrl } from './portalHandoff'
import './App.css'

type TabName = 'municipal' | 'us' | 'lookup'

function App({ pending = false }: { pending?: boolean }) {
  const initial = getLaunchContext()
  const portalLogin = portalLoginUrl(import.meta.env.VITE_PORTAL_URL)
  const portalOrigin = portalLogin ? new URL(portalLogin).origin : null
  const [activeTab, setActiveTab] = useState<TabName>('municipal')
  const [residentState, setResidentState] = useState('')
  const [fundName, setFundName] = useState('')
  const [amount, setAmount] = useState('')
  const [percentage, setPercentage] = useState(0)
  const [stateExempt, setStateExempt] = useState(0)
  const [stateTaxable, setStateTaxable] = useState(0)
  const clientId = initial.clientId || ''
  const taxYear = initial.taxYear || ''
  const [savedSessions, setSavedSessions] = useState<SavedSession[]>([])
  const [selectedId, setSelectedId] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [dirty, setDirty] = useState(false)
  const validation = contextError(clientId, taxYear)
  function persistContext() {
    if (!validation) window.history.replaceState(null, '', window.location.pathname + '?' + new URLSearchParams({ clientId, taxYear }))
  }
  async function handleSave() {
    if (pending || validation || busy) return
    setBusy(true); setMessage('')
    try {
      const saved = await saveMutualFundSession({
        clientId, taxYear, residentState, fundName, amount: Number(amount),
        percentage, stateExempt, stateTaxable: dirty ? Number(amount) - stateExempt : stateTaxable,
      })
      setSavedSessions(value => [saved, ...value.filter(row => row.id !== saved.id)])
      setSelectedId(saved.id); setDirty(false)
      setStateTaxable(Number(saved.state_taxable))
      setMessage('Session saved. Each save creates a new record.')
      persistContext()
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Save failed. Please retry.') }
    finally { setBusy(false) }
  }
  async function handleLoad() {
    if (pending || validation || busy) return
    setBusy(true); setMessage('')
    try {
      const rows = await getMutualFundSessions(clientId, taxYear)
      setSavedSessions(rows); setSelectedId('')
      setMessage(rows.length ? 'Choose a saved session, then click Restore selected session.' : 'No saved sessions for your account and this client/year.')
      persistContext()
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Load failed. Please retry.') }
    finally { setBusy(false) }
  }
  function restoreSelected() {
    const selected = savedSessions.find(row => row.id === selectedId)
    if (!selected) return
    if (dirty && !window.confirm('Replace your unsaved inputs with this saved session?')) return
    setResidentState(selected.resident_state || '')
    setFundName(selected.fund_name); setAmount(String(selected.amount))
    setPercentage(Number(selected.percentage)); setStateExempt(Number(selected.state_exempt)); setStateTaxable(Number(selected.state_taxable))
    setDirty(false); setMessage('Selected session restored.')
  }

  return (
    <div
      className="app-container"
      data-client-id={clientId}
      data-tax-year={taxYear}
    >
      <nav className="workspace-breadcrumbs" aria-label="Breadcrumb">
        {portalOrigin ? <a href={`${portalOrigin}/`}>Home</a> : <span>Home</span>}
        <span aria-hidden="true"> / </span>
        {portalOrigin ? <a href={`${portalOrigin}/choose`}>Tools</a> : <span>Tools</span>}
        <span aria-hidden="true"> / </span>
        <span aria-current="page">Mutual Fund</span>
      </nav>
      {pending && <p className="mini workspace-loading" role="status">Loading Mutual Fund…</p>}
      <header className="hero">
        <h1>{taxYear} Mutual Fund Tax Calculator</h1>

        <p>
          Search across fund companies and calculate Tax-Exempt Interest,
          U.S. Government obligation income, and municipal bond tax amounts.
        </p>

        <div className="stats">
          <div className="stat">
            <strong>2,706</strong>
            <span>Municipal state records</span>
          </div>

          <div className="stat">
            <strong>1,336</strong>
            <span>U.S. obligation funds</span>
          </div>

          <div className="stat">
            <strong>11</strong>
            <span>Fund companies</span>
          </div>
        </div>
      </header>

      <fieldset disabled={pending} className="workspace-controls" aria-busy={pending}>
      <nav className="tabs">
        <button
          className={
            activeTab === 'municipal'
              ? 'tab active'
              : 'tab'
          }
          onClick={() => setActiveTab('municipal')}
        >
          Tax-Exempt Interest
        </button>

        <button
          className={
            activeTab === 'us'
              ? 'tab active'
              : 'tab'
          }
          onClick={() => setActiveTab('us')}
        >
          U.S. Obligations
        </button>

        <button
          className={
            activeTab === 'lookup'
              ? 'tab active'
              : 'tab'
          }
          onClick={() => setActiveTab('lookup')}
        >
          Fund Lookup
        </button>
      </nav>

      <main className="content">
        {activeTab === 'municipal' && (
          <section className="card">
            <h2>Tax-Exempt Interest</h2>

            <p className="mini">
              Reported on Form 1099-DIV Box 12 or Form 1099-INT Box 8/9,
              depending on the source.
            </p>

            <div className="toolbar">
              <label className="resident-state">
                <span>Client&apos;s resident state</span>

                <select
                  disabled={busy}
                  value={residentState}
                  onChange={(event) =>
                    { setResidentState(event.target.value); setDirty(true) }
                  }
                >
                  <option value="">
                    — Not set (territory-exempt portion only) —
                  </option>

                  <option value="California">
                    California
                  </option>

                  <option value="New York">
                    New York
                  </option>

                  <option value="Texas">
                    Texas
                  </option>
                  {residentState && !['California', 'New York', 'Texas'].includes(residentState) && <option value={residentState}>{residentState}</option>}
                </select>
              </label>
            </div>

            <div className="muni-header">
              <span>#</span>
              <span>Fund</span>
              <span>Amount</span>
              <span>%</span>
              <span>State Exempt</span>
              <span>State Taxable</span>
            </div>

            <div className="muni-row">
              <span className="row-number">1</span>

              <input
                type="text"
                disabled={busy}
                placeholder="Search fund"
                value={fundName}
                onChange={(event) =>
                  { setFundName(event.target.value); setDirty(true) }
                }
              />

              <input
                type="number"
                disabled={busy}
                placeholder="0.00"
                value={amount}
                onChange={(event) =>
                  { setAmount(event.target.value); setDirty(true) }
                }
              />

              <div className="muni-value">
                {percentage.toFixed(2)}%
              </div>

              <div className="muni-value">
                ${stateExempt.toFixed(2)}
              </div>

              <div className="muni-value">
                ${(dirty ? Number(amount || 0) - stateExempt : stateTaxable).toFixed(2)}
              </div>
            </div>

            <button className="secondary-button">
              + Add row
            </button>

            <div className="result-box">
              <div className="mini">
                Total Territory-Exempt Interest
              </div>

              <div className="result-amount">
                $0.00
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                gap: '12px',
                marginTop: '16px',
              }}
            >
              <button
                className="primary-button"
                onClick={handleSave}
                disabled={!!validation || busy || !fundName.trim() || !amount.trim()}
              >
                Save to Database
              </button>

              <button
                className="secondary-button"
                onClick={handleLoad}
                disabled={!!validation || busy}
              >
                Load from Database
              </button>
            </div>
            <p className="mini" role="status">{busy ? 'Working…' : message}</p>
            {savedSessions.length > 0 && <div className="mini">
              <label>Saved sessions
                <select aria-label="Saved sessions" value={selectedId} onChange={event => setSelectedId(event.target.value)} disabled={busy}>
                  <option value="">Choose a session</option>
                  {savedSessions.map(row => <option key={row.id} value={row.id}>{row.fund_name} · {row.amount} · {new Date(row.created_at).toLocaleString()}</option>)}
                </select>
              </label>
              <button className="secondary-button" disabled={!selectedId || busy} onClick={restoreSelected}>Restore selected session</button>
            </div>}
          </section>
        )}

        {activeTab === 'us' && (
          <section className="card">
            <h2>U.S. Government Obligations</h2>

            <p>
              U.S. Obligations calculator will be added here.
            </p>
          </section>
        )}

        {activeTab === 'lookup' && (
          <section className="card">
            <h2>Fund Lookup</h2>

            <p>
              Fund lookup will be added here.
            </p>
          </section>
        )}
      </main>
      </fieldset>
    </div>
  )
}

export default App
