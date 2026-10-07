import { useRef, useState } from 'react'
import './App.css'
import { getLaunchContext } from './launchContext'

type Tab = 'worksheet' | 'comparison' | 'ai'

function App() {
  const launchContext = getLaunchContext()

  const initialTaxYear = launchContext.taxYear || '2026'
  const initialClientId = launchContext.clientId || 'sample-client'

  const [activeTab, setActiveTab] = useState<Tab>('worksheet')
  const [showReport, setShowReport] = useState(false)
  const [selectedFileName, setSelectedFileName] = useState('')
  const [selectedClientId, setSelectedClientId] =
    useState(initialClientId)
  const [taxYear, setTaxYear] = useState(initialTaxYear)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const standardYears = ['2026', '2025', '2024']

  return (
    <div className="audit-app">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">t</span>
          <span>tapreco</span>
        </div>

        <p className="sidebar-label">
          ADVISORY WORKSPACE
        </p>

        <nav className="sidebar-nav">
          <button>Overview</button>
          <button>Income Tax Planner</button>
          <button>Retirement Distribution Planner</button>

          <button className="active">
            Audit Risk Analyzer
          </button>

          <button>Structure Advisor</button>
          <button>Client Files</button>
          <button>Settings</button>
        </nav>

        <div className="sidebar-footer">
          <strong>YOUR FIRM</strong>
          <span>Advisory tools, connected.</span>
        </div>
      </aside>

      <div className="app-content">
        <header className="topbar">
          <span>
            Workspace / <strong>Audit Risk Analyzer</strong>
          </span>

          <span>Federal only · Phase 1</span>
        </header>

        <main className="main-content">
          <section className="page-heading">
            <div>
              <span className="eyebrow">
                COMPLIANCE &amp; RISK
              </span>

              <h1>Audit Risk Analyzer</h1>

              <p>
                Review federal return information, identify potential
                audit-risk factors, and prepare documentation scenarios.
              </p>
            </div>

            <div className="heading-actions">
              <button
                className="secondary-button"
                onClick={() => fileInputRef.current?.click()}
              >
                Import 1040 Return
              </button>

              <button
                className="primary-button"
                onClick={() => setShowReport(true)}
              >
                Export Report
              </button>
            </div>
          </section>

          <div className="phase-banner">
            <strong>Phase 1 preview:</strong> PDF import, scoring,
            calculations, AI analysis, and API integration are
            placeholders only.
          </div>

          <section className="toolbar">
            <label>
              CLIENT

              <select
                value={selectedClientId}
                onChange={(event) =>
                  setSelectedClientId(event.target.value)
                }
              >
                {selectedClientId !== 'sample-client' &&
                  selectedClientId !== 'new-client' && (
                    <option value={selectedClientId}>
                      Tapreco Client ({selectedClientId})
                    </option>
                  )}

                <option value="sample-client">
                  Sample Client
                </option>

                <option value="new-client">
                  New Client
                </option>
              </select>
            </label>

            <label>
              RETURN TYPE

              <select>
                <option>1040 — Individual</option>
                <option>1065 — Partnership</option>
                <option>1120S — S-Corporation</option>
                <option>1120 — C-Corporation</option>
              </select>
            </label>

            <label>
              TAX YEAR

              <select
                value={taxYear}
                onChange={(event) =>
                  setTaxYear(event.target.value)
                }
              >
                {!standardYears.includes(taxYear) && (
                  <option value={taxYear}>
                    {taxYear}
                  </option>
                )}

                <option value="2026">2026</option>
                <option value="2025">2025</option>
                <option value="2024">2024</option>
              </select>
            </label>

            <span className="status-chip">
              Illustrative data
            </span>
          </section>

          <nav className="tabs">
            <button
              className={
                activeTab === 'worksheet' ? 'active' : ''
              }
              onClick={() => setActiveTab('worksheet')}
            >
              Risk Worksheet
            </button>

            <button
              className={
                activeTab === 'comparison' ? 'active' : ''
              }
              onClick={() => setActiveTab('comparison')}
            >
              Comparison
            </button>

            <button
              className={
                activeTab === 'ai' ? 'active' : ''
              }
              onClick={() => setActiveTab('ai')}
            >
              AI Review
            </button>
          </nav>

          {activeTab === 'worksheet' && (
            <section className="tab-page">
              <div className="card">
                <div className="card-heading">
                  <div>
                    <span className="eyebrow">
                      RETURN INFORMATION
                    </span>

                    <h2>Shared Client Inputs</h2>
                  </div>

                  <span className="status-chip">
                    Placeholder
                  </span>
                </div>

                <div className="form-grid">
                  <label>
                    Industry / NAICS Code
                    <input placeholder="Example: 541430" />
                  </label>

                  <label>
                    Gross Receipts
                    <input placeholder="$0.00" />
                  </label>

                  <label>
                    Net Profit
                    <input placeholder="$0.00" />
                  </label>

                  <label>
                    Prior Audit History

                    <select>
                      <option>None</option>
                      <option>Prior audit — no change</option>
                      <option>Prior audit — adjustment</option>
                    </select>
                  </label>

                  <label>
                    Year-over-Year Revenue Change
                    <input placeholder="0%" />
                  </label>

                  <label>
                    Amended Return?

                    <select>
                      <option>No</option>
                      <option>Yes</option>
                    </select>
                  </label>
                </div>
              </div>

              <div className="card">
                <div className="card-heading">
                  <div>
                    <span className="eyebrow">
                      1040 PDF IMPORT
                    </span>

                    <h2>Imported Return Data</h2>
                  </div>

                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="application/pdf"
                      style={{ display: 'none' }}
                      onChange={(event) => {
                        const file = event.target.files?.[0]

                        if (file) {
                          setSelectedFileName(file.name)
                        }
                      }}
                    />

                    <button
                      className="small-button"
                      onClick={() =>
                        fileInputRef.current?.click()
                      }
                    >
                      Import 1040 PDF
                    </button>
                  </div>
                </div>

                <p className="section-description">
                  Future versions will read an uploaded Form 1040
                  package and identify relevant Schedule C,
                  Schedule E, and Schedule F information
                  automatically.
                </p>

                {selectedFileName && (
                  <div className="phase-banner">
                    <strong>Selected PDF:</strong>{' '}
                    {selectedFileName}
                  </div>
                )}

                <div className="import-grid">
                  <div className="import-card">
                    <span>Schedule C</span>
                    <strong>Business Income</strong>
                    <p>No extracted data yet</p>
                  </div>

                  <div className="import-card">
                    <span>Schedule E</span>
                    <strong>
                      Rental / Pass-through Income
                    </strong>
                    <p>No extracted data yet</p>
                  </div>

                  <div className="import-card">
                    <span>Schedule F</span>
                    <strong>Farm Income</strong>
                    <p>No extracted data yet</p>
                  </div>
                </div>
              </div>

              <div className="section-header">
                <div>
                  <span className="eyebrow">
                    RISK FACTORS
                  </span>

                  <h2>Scenario Worksheet</h2>
                </div>

                <span className="blue-chip">
                  Factor set adapts to return type
                </span>
              </div>

              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Risk Factor</th>

                      <th>
                        Baseline
                        <span>As-filed</span>
                      </th>

                      <th>
                        Documented
                        <span>Scenario 1</span>
                      </th>

                      <th>
                        Adjusted
                        <span>Scenario 2</span>
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    <tr>
                      <td>Income consistency</td>
                      <td>Placeholder</td>
                      <td>Placeholder</td>
                      <td>Placeholder</td>
                    </tr>

                    <tr>
                      <td>Industry comparison</td>
                      <td>Placeholder</td>
                      <td>Placeholder</td>
                      <td>Placeholder</td>
                    </tr>

                    <tr className="warning-row">
                      <td>Large round-number entries</td>
                      <td>Review required</td>
                      <td>Documentation pending</td>
                      <td>Placeholder</td>
                    </tr>

                    <tr>
                      <td>
                        Year-over-year revenue swing
                      </td>
                      <td>Placeholder</td>
                      <td>Placeholder</td>
                      <td>Placeholder</td>
                    </tr>

                    <tr className="section-row">
                      <td colSpan={4}>
                        SCORING — NOT CALCULATED IN PHASE 1
                      </td>
                    </tr>

                    <tr className="result-row">
                      <td>Overall Risk Score</td>
                      <td>— / 100</td>
                      <td>— / 100</td>
                      <td>— / 100</td>
                    </tr>

                    <tr>
                      <td>Top Contributing Factor</td>
                      <td>Not calculated</td>
                      <td>Not calculated</td>
                      <td>Not calculated</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="notes-card">
                <label>
                  Notes &amp; Assumptions

                  <textarea
                    rows={4}
                    placeholder="Add documentation notes, assumptions, or items to review..."
                  />
                </label>
              </div>

              <div className="page-actions">
                <span>
                  Phase 1 UI only · No audit-risk calculations
                  are running.
                </span>

                <button
                  className="primary-button"
                  onClick={() =>
                    setActiveTab('comparison')
                  }
                >
                  View Comparison →
                </button>
              </div>
            </section>
          )}

          {activeTab === 'comparison' && (
            <section className="tab-page">
              <div className="comparison-grid">
                <div className="card risk-card">
                  <span className="eyebrow">
                    OVERALL RISK
                  </span>

                  <h2>Risk Score</h2>

                  <div className="risk-meter">
                    <div className="meter-placeholder">
                      <strong>—</strong>
                      <span>Not calculated</span>
                    </div>
                  </div>

                  <div className="risk-legend">
                    <span>
                      <i className="low-dot" />
                      0–39 Low
                    </span>

                    <span>
                      <i className="medium-dot" />
                      40–69 Medium
                    </span>

                    <span>
                      <i className="high-dot" />
                      70–100 High
                    </span>
                  </div>
                </div>

                <div className="kpi-column">
                  <div className="kpi-card">
                    <span>Overall Risk Score</span>
                    <strong>—</strong>
                    <p>Awaiting scoring engine</p>
                  </div>

                  <div className="kpi-card">
                    <span>High-Risk Flags</span>
                    <strong>—</strong>
                    <p>Not calculated</p>
                  </div>

                  <div className="kpi-card">
                    <span>Scenario 2 Score</span>
                    <strong>—</strong>
                    <p>Not calculated</p>
                  </div>
                </div>
              </div>

              <div className="card">
                <span className="eyebrow">
                  RISK CONTRIBUTION
                </span>

                <h2>Risk Contribution by Factor</h2>

                <div className="placeholder-chart">
                  <div>
                    <span>Income reporting</span>

                    <div className="chart-bar">
                      <div style={{ width: '60%' }} />
                    </div>
                  </div>

                  <div>
                    <span>Documentation</span>

                    <div className="chart-bar">
                      <div style={{ width: '42%' }} />
                    </div>
                  </div>

                  <div>
                    <span>Industry comparison</span>

                    <div className="chart-bar">
                      <div style={{ width: '28%' }} />
                    </div>
                  </div>

                  <div>
                    <span>Prior return history</span>

                    <div className="chart-bar">
                      <div style={{ width: '18%' }} />
                    </div>
                  </div>
                </div>

                <p className="sample-note">
                  Visual placeholder only — bars do not
                  represent real audit risk.
                </p>
              </div>

              <div className="card">
                <span className="eyebrow">
                  EXPLAINER
                </span>

                <h2>What Drives This?</h2>

                <p>
                  Once the scoring engine is connected, this
                  section will explain which return
                  characteristics contribute most to the
                  audit-risk assessment.
                </p>
              </div>
            </section>
          )}

          {activeTab === 'ai' && (
            <section className="tab-page">
              <div className="ai-banner">
                AI Review is a Phase 1 UI placeholder. No AI
                analysis is being performed.
              </div>

              <div className="insight-grid">
                <article className="insight-card">
                  <span className="eyebrow">
                    INCOME REVIEW
                  </span>

                  <h3>Income reporting insight</h3>

                  <p>
                    Future AI review will explain unusual
                    income patterns and identify supporting
                    documentation that may be useful.
                  </p>

                  <label>
                    <input type="checkbox" />
                    Include in report
                  </label>
                </article>

                <article className="insight-card">
                  <span className="eyebrow">
                    DOCUMENTATION
                  </span>

                  <h3>Documentation insight</h3>

                  <p>
                    Future analysis will highlight
                    documentation gaps and provide review
                    notes for the CPA.
                  </p>

                  <label>
                    <input type="checkbox" />
                    Include in report
                  </label>
                </article>

                <article className="insight-card">
                  <span className="eyebrow">
                    INDUSTRY COMPARISON
                  </span>

                  <h3>Benchmark insight</h3>

                  <p>
                    Future versions may compare return
                    information against configured industry
                    benchmarks.
                  </p>

                  <label>
                    <input type="checkbox" />
                    Include in report
                  </label>
                </article>

                <article className="insight-card">
                  <span className="eyebrow">
                    RETURN HISTORY
                  </span>

                  <h3>Historical review</h3>

                  <p>
                    Prior-year information and audit history
                    may later be used as additional review
                    context.
                  </p>

                  <label>
                    <input type="checkbox" />
                    Include in report
                  </label>
                </article>
              </div>

              <div className="notes-card">
                <label>
                  CPA Observations

                  <textarea
                    rows={5}
                    placeholder="Add professional observations or review notes..."
                  />
                </label>
              </div>
            </section>
          )}
        </main>
      </div>

      {showReport && (
        <div className="modal-overlay">
          <div className="report-modal">
            <div className="modal-heading">
              <div>
                <span className="eyebrow">
                  REPORT
                </span>

                <h2>Prepare Report</h2>
              </div>

              <button
                className="close-button"
                onClick={() => setShowReport(false)}
              >
                ×
              </button>
            </div>

            <p>
              Select the sections that will eventually appear
              in the report.
            </p>

            <div className="report-options">
              <label>
                <input type="checkbox" defaultChecked />
                Client-facing risk summary
              </label>

              <label>
                <input type="checkbox" defaultChecked />
                Risk factor detail
              </label>

              <label>
                <input type="checkbox" defaultChecked />
                Risk score &amp; chart
              </label>

              <label>
                <input type="checkbox" defaultChecked />
                Internal documentation checklist
              </label>

              <label>
                <input type="checkbox" defaultChecked />
                CPA observations
              </label>

              <label>
                <input type="checkbox" />
                Selected AI insights
              </label>
            </div>

            <div className="report-message">
              PDF generation is not connected in Phase 1.
            </div>

            <div className="modal-actions">
              <button
                className="secondary-button"
                onClick={() => setShowReport(false)}
              >
                Cancel
              </button>

              <button className="primary-button">
                Generate Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App