import { useState } from 'react'
import { getLaunchContext } from './launchContext'
import './App.css'

type TabName = 'municipal' | 'us' | 'lookup'

function App() {
  const launchContext = getLaunchContext()

  const [activeTab, setActiveTab] =
    useState<TabName>('municipal')

  const taxYear = launchContext.taxYear || '2025'

  return (
    <div
      className="app-container"
      data-client-id={launchContext.clientId ?? undefined}
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

                <select>
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
              />

              <input
                type="number"
                placeholder="0.00"
              />

              <div className="muni-value">0.00%</div>
              <div className="muni-value">$0.00</div>
              <div className="muni-value">$0.00</div>
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