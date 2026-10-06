import { useState } from 'react'
import { reportSections } from '../../data/sampleScenarios'
import type { DemoClient, EntityComparisonState } from '../../types/entityComparison'
import { ReportPreview } from './ReportPreview'
import { Modal } from './Modal'

export function ReportModal({ period, client, year, onSectionsChange, onClose }: {
  period: EntityComparisonState
  client: DemoClient
  year: string
  onSectionsChange: (value: string[]) => void
  onClose: () => void
}) {
  const [scenarioIds, setScenarioIds] = useState(period.scenarios.map((scenario) => scenario.id))
  const [previewOpen, setPreviewOpen] = useState(false)
  const canPreview = scenarioIds.length > 0 && period.selectedSections.length > 0
  return (
    <Modal title="Prepare client report" titleId="report-title" onClose={onClose}>
      <p>Choose the sections and scenarios to preview for {client.businessName} · {year}.</p>
      <div className="report-checks">
        {reportSections.map((section) => (
          <label key={section.id} htmlFor={`report-${section.id}`}>
            <input id={`report-${section.id}`} type="checkbox" checked={period.selectedSections.includes(section.id)}
              onChange={() => onSectionsChange(period.selectedSections.includes(section.id)
                ? period.selectedSections.filter((id) => id !== section.id)
                : [...period.selectedSections, section.id])} />
            {section.label}
          </label>
        ))}
      </div>
      <h3>Scenarios included</h3>
      <div className="scenario-checks">
        {period.scenarios.map((scenario) => (
          <label className="check-label" key={scenario.id}>
            <input type="checkbox" checked={scenarioIds.includes(scenario.id)} onChange={() => setScenarioIds((current) =>
              current.includes(scenario.id) ? current.filter((id) => id !== scenario.id) : [...current, scenario.id])} />
            {scenario.name} · {scenario.label}
          </label>
        ))}
      </div>
      <p className="report-count" aria-live="polite">{period.selectedSections.length} sections · {scenarioIds.length} scenarios selected.</p>
      <div className="banner">Phase 1 includes a report preview. PDF download is deferred. All figures are illustrative or advisor entered.</div>
      <div className="button-row">
        <button className="button primary-button" disabled={!canPreview} onClick={() => setPreviewOpen((current) => !current)}>
          {previewOpen ? 'Hide report preview' : 'Preview report'}
        </button>
        <button className="button" onClick={onClose}>Done</button>
      </div>
      {!canPreview && <p className="note">Select at least one section and one scenario to preview the report.</p>}
      {previewOpen && canPreview && <ReportPreview client={client} period={period} year={year} scenarioIds={scenarioIds} sections={period.selectedSections} />}
    </Modal>
  )
}
