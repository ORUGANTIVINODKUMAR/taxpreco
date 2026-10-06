import type { EntityScenario } from '../../types/entityComparison'
import { money } from '../../utils/format'
import { comparisonResult } from '../../utils/comparison'
export function ComparisonView({
  scenarios,
  selectedScenarioId,
  onScenarioSelect,
  onReview,
  onEditTaxes,
}: {
  scenarios: EntityScenario[]
  selectedScenarioId: string
  onScenarioSelect: (id: string) => void
  onReview: () => void
  onEditTaxes: () => void
}) {
  const scenario =
    scenarios.find((item) => item.id === selectedScenarioId) ?? scenarios[1]
  const baseline = scenarios[0]
  const result = comparisonResult(scenario, baseline)
  const chartMaximum =
    Math.max(1, ...scenarios.map((item) => item.modeledTaxes ?? 0)) * 1.08
  return (
    <>
      <div className="comparison-heading">
        <div className="review-selector">
          <label htmlFor="comparison-scenario">Compare</label>
          <select
            id="comparison-scenario"
            value={scenario.id}
            onChange={(event) => onScenarioSelect(event.target.value)}
          >
            {scenarios.slice(1).map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} · {item.label}
              </option>
            ))}
          </select>
          <span>with {baseline.name}</span>
        </div>
        <span className="chip">Annual view</span>
      </div>
      <div className="kpis">
        {[
          {
            label: 'Annual tax difference',
            value: result?.taxDifference,
            detail: result
              ? result.taxDifference >= 0
                ? 'Lower estimated taxes'
                : 'Higher estimated taxes'
              : 'Enter baseline and scenario tax estimates',
          },
          {
            label: 'Annual net benefit',
            value: result?.annualBenefit,
            detail: result
              ? `After ${money(result.additionalCosts)} additional recurring costs`
              : 'Complete the tax estimates first',
          },
          {
            label: 'First-year net benefit',
            value: result?.firstYearBenefit,
            detail: `After ${money(scenario.transitionCosts)} transition costs`,
          },
        ].map((kpi) => (
          <article className="kpi" key={kpi.label}>
            <h2>{kpi.label}</h2>
            <strong
              className={
                kpi.value !== undefined && kpi.value < 0 ? 'negative' : ''
              }
            >
              {kpi.value === undefined ? '—' : money(kpi.value)}
            </strong>
            <p>{kpi.detail}</p>
          </article>
        ))}
      </div>
      <div className="panel">
        <div className="section-heading">
          <h2>Taxes across scenarios</h2>
          <button className="button" onClick={onEditTaxes}>
            Edit tax estimates
          </button>
        </div>
        <p>
          Combined business and owner taxes · illustrative / advisor-entered
          estimates
        </p>
        {scenarios.map((item) => (
          <div className="bar-row" key={item.id}>
            <span>{item.id === 'current' ? 'Current' : item.name}</span>
            {item.modeledTaxes === undefined ? (
              <span className="muted">Estimate not entered</span>
            ) : (
              <div className="bar-track" aria-hidden="true">
                <div
                  className={`bar ${item.id === 'current' ? 'baseline-bar' : item.entityType === 'c-corporation' ? 'c-corp-bar' : ''}`}
                  style={{
                    width: `${(item.modeledTaxes / chartMaximum) * 100}%`,
                  }}
                />
              </div>
            )}
            <strong>
              {item.modeledTaxes === undefined ? '—' : money(item.modeledTaxes)}
            </strong>
          </div>
        ))}
      </div>
      <div className="panel">
        <h3>What changes the result?</h3>
        <p>
          Owner compensation, payroll taxes, QBI treatment, distributions, and
          additional compliance costs. Update your separately prepared tax
          estimates when assumptions change.
        </p>
        <button className="button review-button" onClick={onReview}>
          Review scenario assumptions →
        </button>
      </div>
    </>
  )
}
