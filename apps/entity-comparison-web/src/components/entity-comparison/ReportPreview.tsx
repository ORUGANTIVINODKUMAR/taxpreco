import type { ReportOptions } from '../../types/entityComparison'
import { money } from '../../utils/format'
import { comparisonResult, reviewInsights } from '../../utils/comparison'
export function ReportPreview({
  client,
  period,
  year,
  scenarioIds,
  sections,
}: ReportOptions) {
  const scenarios = period.scenarios.filter((scenario) =>
    scenarioIds.includes(scenario.id),
  )
  const selected =
    period.scenarios.find((item) => item.id === period.selectedScenarioId) ??
    period.scenarios[1]
  return (
    <div className="report-preview">
      <div className="overline">Tapreco · Sample report preview</div>
      <h3>Entity Savings Report</h3>
      <p>
        {client.businessName} · {client.ownerName} · {year}
      </p>
      <p className="note">
        Illustrative / advisor-entered estimates. Not tax advice.
      </p>
      {sections.includes('summary') && (
        <section>
          <h3>Client & business summary</h3>
          <p>
            Revenue {money(period.inputs.revenue)} · Expenses{' '}
            {money(period.inputs.operatingExpenses)} · Profit{' '}
            {money(period.inputs.revenue - period.inputs.operatingExpenses)}
          </p>
          <p>
            {period.inputs.filingStatus} · {period.inputs.residentState} ·{' '}
            {period.inputs.ownershipPercentage}% ownership
          </p>
        </section>
      )}
      {sections.includes('assumptions') && (
        <section>
          <h3>Scenario assumptions</h3>
          {scenarios.map((scenario) => (
            <p key={scenario.id}>
              <strong>{scenario.name}</strong> · Salary{' '}
              {money(scenario.ownerSalary)} · Retirement{' '}
              {money(scenario.retirementContribution)} · Administration{' '}
              {money(scenario.adminCosts)} · Transition{' '}
              {money(scenario.transitionCosts)}
            </p>
          ))}
          {period.notes && (
            <p className="preserve-lines">Notes: {period.notes}</p>
          )}
        </section>
      )}
      {sections.includes('comparison') && (
        <section>
          <h3>Tax & cost comparison</h3>
          {scenarios.map((scenario) => {
            const result = comparisonResult(scenario, period.scenarios[0])
            return (
              <p key={scenario.id}>
                <strong>{scenario.name}</strong> · Combined estimate{' '}
                {scenario.modeledTaxes === undefined
                  ? 'Not entered'
                  : money(scenario.modeledTaxes)}
                {scenario.id !== 'current' &&
                  ` · Annual benefit ${result ? money(result.annualBenefit) : 'Incomplete'} · First-year benefit ${result ? money(result.firstYearBenefit) : 'Incomplete'}`}
              </p>
            )
          })}
        </section>
      )}
      {sections.includes('charts') && (
        <section>
          <h3>Comparison charts</h3>
          {scenarios.map((scenario) => (
            <div className="mini-bar" key={scenario.id}>
              <span>{scenario.name}</span>
              <div className="bar-track">
                <div
                  className="bar"
                  style={{
                    width: `${((scenario.modeledTaxes ?? 0) / Math.max(1, ...scenarios.map((item) => item.modeledTaxes ?? 0))) * 100}%`,
                  }}
                />
              </div>
              <strong>
                {scenario.modeledTaxes === undefined
                  ? '—'
                  : money(scenario.modeledTaxes)}
              </strong>
            </div>
          ))}
        </section>
      )}
      {sections.includes('observations') && (
        <section>
          <h3>CPA observations</h3>
          <p className="preserve-lines">
            {period.observations.trim() || 'No observations entered yet.'}
          </p>
        </section>
      )}
      {sections.includes('insights') && (
        <section>
          <h3>Selected AI insights</h3>
          <p className="note">
            Rule-based assumption review; no AI service connected.
          </p>
          {reviewInsights(selected, period.scenarios[0])
            .filter((insight) => period.selectedInsights.includes(insight.id))
            .map((insight) => (
              <div key={insight.id}>
                <h4>{insight.title}</h4>
                <p>{insight.text}</p>
              </div>
            ))}
          {!period.selectedInsights.length && <p>No insights selected.</p>}
        </section>
      )}
    </div>
  )
}
