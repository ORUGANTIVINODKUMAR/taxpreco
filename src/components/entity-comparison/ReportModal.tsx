import { useState } from 'react'
import { reportSections } from '../../data/sampleScenarios'
import type { Client, PlanningWorkspace } from '../../types/workspace'
import { downloadReport } from '../../utils/report'
import { ReportPreview } from './ReportPreview'
import { Modal } from './Modal'
interface Props {
  period: PlanningWorkspace
  client: Client
  year: string
  firmName: string
  onSectionsChange: (value: string[]) => void
  onClose: () => void
}
export function ReportModal({
  period,
  client,
  year,
  firmName,
  onSectionsChange,
  onClose,
}: Props) {
  const [scenarioIds, setScenarioIds] = useState(
    period.scenarios.map((scenario) => scenario.id),
  )
  const [previewOpen, setPreviewOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const sections = [
    ...reportSections,
    {
      id: 'structure',
      label: 'Ownership structure & payments',
      checked: false,
    },
  ]
  const options = {
    period,
    client,
    year,
    firmName,
    scenarioIds,
    sections: period.selectedSections,
  }
  const canExport = scenarioIds.length > 0 && period.selectedSections.length > 0
  async function exportPdf() {
    setBusy(true)
    setError('')
    setMessage('')
    try {
      await downloadReport(options)
      setMessage('PDF report downloaded successfully.')
    } catch {
      setError(
        'The report could not be generated. Try fewer sections or shorter notes and export again.',
      )
    } finally {
      setBusy(false)
    }
  }
  return (
    <Modal
      title="Prepare client report"
      titleId="report-title"
      onClose={onClose}
    >
      <p>
        Choose the sections and scenarios to include for {client.businessName} ·{' '}
        {year}.
      </p>
      <div className="report-checks">
        {sections.map((section) => (
          <label key={section.id} htmlFor={`report-${section.id}`}>
            <input
              id={`report-${section.id}`}
              type="checkbox"
              checked={period.selectedSections.includes(section.id)}
              onChange={() => {
                onSectionsChange(
                  period.selectedSections.includes(section.id)
                    ? period.selectedSections.filter((id) => id !== section.id)
                    : [...period.selectedSections, section.id],
                )
                setMessage('')
              }}
            />
            {section.label}
          </label>
        ))}
      </div>
      <h3>Scenarios included</h3>
      <div className="scenario-checks">
        {period.scenarios.map((scenario) => (
          <label className="check-label" key={scenario.id}>
            <input
              type="checkbox"
              checked={scenarioIds.includes(scenario.id)}
              onChange={() => {
                setScenarioIds((current) =>
                  current.includes(scenario.id)
                    ? current.filter((id) => id !== scenario.id)
                    : [...current, scenario.id],
                )
                setMessage('')
              }}
            />
            {scenario.name} · {scenario.label}
          </label>
        ))}
      </div>
      <p className="report-count" aria-live="polite">
        {period.selectedSections.length} sections · {scenarioIds.length}{' '}
        scenarios selected.
      </p>
      <div className="banner">
        The PDF includes the selected figures, notes, and assumptions. Tax
        amounts are illustrative or advisor entered; missing estimates are
        identified in the report.
      </div>
      <div className="button-row">
        <button
          className="button"
          disabled={!canExport}
          onClick={() => setPreviewOpen((current) => !current)}
        >
          {previewOpen ? 'Hide report preview' : 'Preview report'}
        </button>
        <button
          className="button primary-button"
          disabled={!canExport || busy}
          onClick={() => void exportPdf()}
        >
          {busy ? 'Preparing PDF…' : 'Download PDF report'}
        </button>
      </div>
      {!canExport && (
        <p className="note">
          Select at least one section and one scenario to prepare the report.
        </p>
      )}
      {error && (
        <p className="error-message" role="alert">
          {error}
        </p>
      )}
      {message && (
        <p className="note" role="status">
          {message}
        </p>
      )}
      {previewOpen && <ReportPreview {...options} />}
    </Modal>
  )
}
