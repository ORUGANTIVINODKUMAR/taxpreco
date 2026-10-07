import { useState } from 'react'
import { getLaunchContext } from './launchContext'
import {
  getMutualFundSessions,
  saveMutualFundSession,
} from './api'
import './App.css'

type TabName = 'municipal' | 'us' | 'lookup'

function App() {
  const launchContext = getLaunchContext()

  const [activeTab, setActiveTab] =
    useState<TabName>('municipal')

  const [residentState, setResidentState] = useState('')
  const [fundName, setFundName] = useState('')
  const [amount, setAmount] = useState('')
  const [accessToken, setAccessToken] = useState('')

  const clientId =
    launchContext.clientId || 'client-123'

  const taxYear =
    launchContext.taxYear || '2026'

  async function handleSave() {
    if (!accessToken) {
      alert('Add a JWT token first for local testing.')
      return
    }

    try {
      const amountValue = Number(amount || 0)

      const saved = await saveMutualFundSession(
        {
          clientId,
          taxYear,
          residentState,
          fundName,
          amount: amountValue,
          percentage: 0,
          stateExempt: 0,
          stateTaxable: amountValue,
        },
        accessToken,
      )

      console.log('Saved Mutual Fund session:', saved)

      alert('Mutual Fund session saved.')
    } catch (error) {
      console.error('Save failed:', error)
      alert('Save failed.')
    }
  }

  async function handleLoad() {
    if (!accessToken) {
      alert('Add a JWT token first for local testing.')
      return
    }

    try {
      const sessions = await getMutualFundSessions(
        clientId,
        taxYear,
        accessToken,
      )

      console.log('Loaded Mutual Fund sessions:', sessions)
    } catch (error) {
      console.error('Load failed:', error)
      alert('Load failed.')
    }
  }

  return (
    <div
      className="app-container"
      data-client-id={clientId}
      data-tax-year={taxYear}
    >
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
                  value={residentState}
                  onChange={(event) =>
                    setResidentState(event.target.value)
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
                placeholder="Search fund"
                value={fundName}
                onChange={(event) =>
                  setFundName(event.target.value)
                }
              />

              <input
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(event) =>
                  setAmount(event.target.value)
                }
              />

              <div className="muni-value">
                0.00%
              </div>

              <div className="muni-value">
                $0.00
              </div>

              <div className="muni-value">
                $0.00
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

            <div style={{ marginTop: '24px' }}>
              <label>
                Local JWT token
                <textarea
                  rows={4}
                  value={accessToken}
                  onChange={(event) =>
                    setAccessToken(event.target.value)
                  }
                  placeholder="Paste local JWT token here for testing only"
                  style={{
                    width: '100%',
                    marginTop: '8px',
                  }}
                />
              </label>
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
              >
                Save to Database
              </button>

              <button
                className="secondary-button"
                onClick={handleLoad}
              >
                Load from Database
              </button>
            </div>
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
    </div>
  )
}

export default App