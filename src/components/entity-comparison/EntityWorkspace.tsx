import { useState } from 'react'
import type {
  EntityScenario,
  EntityType,
  SharedBusinessInputs,
  View,
} from '../../types/entityComparison'
import type { PlanningWorkspace } from '../../types/workspace'
import { entityTypes } from '../../data/sampleScenarios'
import { ComparisonTabs } from './ComparisonTabs'
import { ScenarioGrid } from './ScenarioGrid'
import { ComparisonView } from './ComparisonView'
import { AIReview } from './AIReview'
import { TaxEstimatesModal } from './TaxEstimatesModal'
export function EntityWorkspace({
  period,
  onChange,
}: {
  period: PlanningWorkspace
  onChange: (
    patch:
      | Partial<PlanningWorkspace>
      | ((current: PlanningWorkspace) => Partial<PlanningWorkspace>),
  ) => void
}) {
  const [view, setView] = useState<View>('grid')
  const [taxesOpen, setTaxesOpen] = useState(false)
  const [announcement, setAnnouncement] = useState('')
  const selected =
    period.scenarios.find(
      (scenario) => scenario.id === period.selectedScenarioId,
    ) ?? period.scenarios[1]
  function updateInputs(patch: Partial<SharedBusinessInputs>) {
    onChange({
      inputs: { ...period.inputs, ...patch },
      assumptionsEdited: true,
    })
  }
  function updateScenario(id: string, patch: Partial<EntityScenario>) {
    onChange((current) => ({
      scenarios: current.scenarios.map((scenario) =>
        scenario.id === id ? { ...scenario, ...patch } : scenario,
      ),
      assumptionsEdited: true,
    }))
  }
  function addScenario(entityType: EntityType) {
    const name = entityTypes.find((type) => type.value === entityType)!.name
    const label = `Alternative ${Math.max(0, ...period.scenarios.map((scenario) => Number(scenario.label.replace('Alternative ', '')) || 0)) + 1}`
    onChange({
      scenarios: [
        ...period.scenarios,
        {
          id: crypto.randomUUID(),
          name,
          label,
          entityType,
          ownerSalary: 0,
          retirementContribution: 0,
          dividendPercentage: 100,
          adminCosts: 0,
          transitionCosts: 0,
          taxSource: 'entered',
        },
      ],
    })
    setAnnouncement(
      `${name} scenario added. Enter its tax estimate to compare benefits.`,
    )
  }
  function removeScenario(id: string) {
    const scenarios = period.scenarios.filter((scenario) => scenario.id !== id)
    onChange({
      scenarios,
      selectedScenarioId:
        period.selectedScenarioId === id
          ? scenarios[1].id
          : period.selectedScenarioId,
    })
    setAnnouncement('Scenario removed.')
  }
  return (
    <>
      <ComparisonTabs view={view} onChange={setView} />
      <div className="banner assumption-notice">
        Tax figures are illustrative or advisor-entered estimates. Benefits
        update from those figures and your costs. Income and salary changes do
        not recalculate tax liability.
      </div>
      <section
        id="panel-grid"
        role="tabpanel"
        aria-labelledby="tab-grid"
        tabIndex={0}
        hidden={view !== 'grid'}
      >
        <ScenarioGrid
          inputs={period.inputs}
          onInputsChange={updateInputs}
          scenarios={period.scenarios}
          onScenarioChange={updateScenario}
          onAdd={addScenario}
          onRemove={removeScenario}
          notes={period.notes}
          onNotesChange={(notes) => onChange({ notes })}
          onCompare={() => setView('comparison')}
          onEditTaxes={() => setTaxesOpen(true)}
        />
      </section>
      <section
        id="panel-comparison"
        role="tabpanel"
        aria-labelledby="tab-comparison"
        tabIndex={0}
        hidden={view !== 'comparison'}
      >
        <ComparisonView
          scenarios={period.scenarios}
          selectedScenarioId={selected.id}
          onScenarioSelect={(selectedScenarioId) =>
            onChange({ selectedScenarioId })
          }
          onReview={() => setView('grid')}
          onEditTaxes={() => setTaxesOpen(true)}
        />
      </section>
      <section
        id="panel-ai"
        role="tabpanel"
        aria-labelledby="tab-ai"
        tabIndex={0}
        hidden={view !== 'ai'}
      >
        <div className="review-selector">
          <label htmlFor="review-scenario">Review scenario</label>
          <select
            id="review-scenario"
            value={selected.id}
            onChange={(event) =>
              onChange({ selectedScenarioId: event.target.value })
            }
          >
            {period.scenarios.slice(1).map((scenario) => (
              <option key={scenario.id} value={scenario.id}>
                {scenario.name} · {scenario.label}
              </option>
            ))}
          </select>
        </div>
        <AIReview
          selectedInsights={period.selectedInsights}
          onToggleInsight={(id) =>
            onChange({
              selectedInsights: period.selectedInsights.includes(id)
                ? period.selectedInsights.filter((item) => item !== id)
                : [...period.selectedInsights, id],
            })
          }
          observations={period.observations}
          onObservationsChange={(observations) => onChange({ observations })}
          scenario={selected}
          baseline={period.scenarios[0]}
        />
      </section>
      <p className="note">
        Illustrative planning workspace · not tax advice. Estimates,
        assumptions, and notes are saved in this browser. State and eligibility
        analysis require separate review.
      </p>
      <span className="sr-only" role="status">
        {announcement}
      </span>
      {taxesOpen && (
        <TaxEstimatesModal
          scenarios={period.scenarios}
          onChange={updateScenario}
          onClose={() => setTaxesOpen(false)}
        />
      )}
    </>
  )
}
