import { useState } from 'react'
import { getLaunchContext } from './launchContext'
import './App.css'

function App() {
  const launchContext = getLaunchContext()

  const [clientId, setClientId] = useState(
    launchContext.clientId || 'sample-client',
  )

  const [taxYear, setTaxYear] = useState(
    launchContext.taxYear || '2026',
  )

  const standardYears = ['2026', '2025']

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div>
          <div className="brand">
            <div className="brand-mark">t</div>
            <span>tapreco</span>
          </div>

          <div className="sidebar-label">Advisory workspace</div>

          <nav className="nav">
            <button>Overview</button>
            <button>Income Tax Planner</button>
            <button className="active">Estimated Tax Planner</button>
            <button>Client Files</button>
            <button>Settings</button>
          </nav>
        </div>

        <div className="sidebar-footer">
          <strong>Your Firm</strong>
          <span>Planning tools, connected.</span>
        </div>
      </aside>

      <div className="workspace">
        <header className="topbar">
          <span>
            Workspace / <strong>Estimated Tax Planner</strong>
          </span>

          <span>Phase 1 UI Preview</span>
        </header>

        <main className="content">
          <section className="page-heading">
            <div>
              <div className="eyebrow">
                Federal and multistate planning
              </div>

              <h1>Quarterly Estimated Tax Worksheet</h1>

              <p>
                Review federal and state planning inputs for the selected
                quarter.
              </p>
            </div>

            <button className="primary-button">
              Prepare Client Report
            </button>
          </section>

          <section className="toolbar">
            <label>
              Client

              <select
                value={clientId}
                onChange={(event) => setClientId(event.target.value)}
              >
                {clientId !== 'sample-client' && (
                  <option value={clientId}>
                    Tapreco Client ({clientId})
                  </option>
                )}

                <option value="sample-client">Sample Client</option>
              </select>
            </label>

            <label>
              Tax Year

              <select
                value={taxYear}
                onChange={(event) => setTaxYear(event.target.value)}
              >
                {!standardYears.includes(taxYear) && (
                  <option value={taxYear}>{taxYear}</option>
                )}

                <option value="2026">2026</option>
                <option value="2025">2025</option>
              </select>
            </label>

            <label>
              Quarter

              <select defaultValue="Q2">
                <option>Q1</option>
                <option>Q2</option>
                <option>Q3</option>
                <option>Q4</option>
              </select>
            </label>

            <button className="secondary-button">
              + Add State
            </button>
          </section>

          <section className="panel">
            <div className="panel-header">
              <div>
                <h2>Tax Calculation by Jurisdiction</h2>
                <p>Placeholder worksheet layout for Phase 1.</p>
              </div>

              <button className="secondary-button">
                Upload Return or P&amp;L
              </button>
            </div>

            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Description</th>
                    <th>Federal</th>
                    <th>California</th>
                    <th>New York</th>
                  </tr>
                </thead>

                <tbody>
                  <tr className="section-row">
                    <td colSpan={4}>Safe Harbor Basis</td>
                  </tr>

                  <tr>
                    <td>Prior-year total tax</td>
                    <td><input placeholder="$0" /></td>
                    <td><input placeholder="$0" /></td>
                    <td><input placeholder="$0" /></td>
                  </tr>

                  <tr>
                    <td>Prior-year AGI</td>
                    <td><input placeholder="$0" /></td>
                    <td><input placeholder="$0" /></td>
                    <td><input placeholder="$0" /></td>
                  </tr>

                  <tr>
                    <td>Safe-harbor percentage</td>
                    <td><input placeholder="%" /></td>
                    <td><input placeholder="%" /></td>
                    <td><input placeholder="%" /></td>
                  </tr>

                  <tr className="section-row">
                    <td colSpan={4}>Current-Year Comparison</td>
                  </tr>

                  <tr>
                    <td>Projected current-year tax</td>
                    <td><input placeholder="$0" /></td>
                    <td><input placeholder="$0" /></td>
                    <td><input placeholder="$0" /></td>
                  </tr>

                  <tr className="section-row">
                    <td colSpan={4}>Payments and Withholding</td>
                  </tr>

                  <tr>
                    <td>W-2 withholding</td>
                    <td><input placeholder="$0" /></td>
                    <td><input placeholder="$0" /></td>
                    <td><input placeholder="$0" /></td>
                  </tr>

                  <tr>
                    <td>Prior estimated payments</td>
                    <td><input placeholder="$0" /></td>
                    <td><input placeholder="$0" /></td>
                    <td><input placeholder="$0" /></td>
                  </tr>

                  <tr className="total-row">
                    <td>Estimated amount due</td>
                    <td>$0</td>
                    <td>$0</td>
                    <td>$0</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="result-grid">
            <div className="panel">
              <h2>Selected Quarter Result</h2>
              <p>Placeholder summary only.</p>

              <div className="kpi-grid">
                <div className="kpi-card">
                  <span>Federal</span>
                  <strong>$0</strong>
                </div>

                <div className="kpi-card">
                  <span>States Combined</span>
                  <strong>$0</strong>
                </div>

                <div className="kpi-card">
                  <span>Total Payment</span>
                  <strong>$0</strong>
                </div>
              </div>
            </div>

            <div className="panel highlight-panel">
              <div className="eyebrow">Payroll Adjustment</div>

              <h2>W-4 Withholding Recommendation</h2>

              <p>
                This section is a Phase 1 placeholder. No withholding
                calculations are connected yet.
              </p>

              <div className="form-grid">
                <label>
                  Pay Periods Left
                  <input placeholder="Enter pay periods" />
                </label>

                <label>
                  Adjustment Method

                  <select defaultValue="">
                    <option value="" disabled>
                      Select method
                    </option>

                    <option>Extra withholding per paycheck</option>
                    <option>Estimated tax payments</option>
                    <option>Combination</option>
                  </select>
                </label>
              </div>
            </div>
          </section>

          <div className="page-actions">
            <button className="secondary-button">
              Save Scenario
            </button>

            <button className="primary-button">
              Generate Payment Plan
            </button>
          </div>
        </main>
      </div>
    </div>
  )
}

export default App