import type { PlanningWorkspace } from '../../types/workspace'
import { NumberInput } from '../entity-comparison/NumberInput'
import { money } from '../../utils/format'
export function IncomeTaxPlanner({
  period,
  onChange,
  onNavigate,
}: {
  period: PlanningWorkspace
  onChange: (planner: PlanningWorkspace['planner']) => void
  onNavigate: () => void
}) {
  const balance =
    period.planner.annualTaxEstimate -
    period.planner.withholding -
    period.planner.payments
  return (
    <>
      <div className="banner">
        Cash-flow planning from your entered annual tax estimate. This page does
        not compute a tax return or a required payment schedule.
      </div>
      <div className="panel">
        <h2>Annual estimate & payments</h2>
        <p>Use an estimate prepared separately for this client and tax year.</p>
        <div className="fields">
          <NumberInput
            label="Annual tax estimate"
            value={period.planner.annualTaxEstimate}
            onChange={(annualTaxEstimate) =>
              onChange({ ...period.planner, annualTaxEstimate })
            }
          />
          <NumberInput
            label="Expected withholding"
            value={period.planner.withholding}
            onChange={(withholding) =>
              onChange({ ...period.planner, withholding })
            }
          />
          <NumberInput
            label="Estimated payments already made"
            value={period.planner.payments}
            onChange={(payments) => onChange({ ...period.planner, payments })}
          />
        </div>
      </div>
      <div className="kpis">
        <article className="kpi">
          <h2>Annual tax estimate</h2>
          <strong>{money(period.planner.annualTaxEstimate)}</strong>
          <p>Advisor-entered planning amount</p>
        </article>
        <article className="kpi">
          <h2>
            {balance < 0 ? 'Payments above estimate' : 'Unfunded estimate'}
          </h2>
          <strong>{money(Math.abs(balance))}</strong>
          <p>After withholding and payments</p>
        </article>
        <article className="kpi">
          <h2>Four-part cash allocation</h2>
          <strong>{money(Math.max(balance, 0) / 4)}</strong>
          <p>Equal allocation for budgeting only</p>
        </article>
      </div>
      <div className="panel">
        <h2>Shared business context</h2>
        <div className="summary-list">
          <div>
            <span>Filing status</span>
            <strong>{period.inputs.filingStatus}</strong>
          </div>
          <div>
            <span>Resident state</span>
            <strong>{period.inputs.residentState || 'Not entered'}</strong>
          </div>
          <div>
            <span>Business profit</span>
            <strong>
              {money(period.inputs.revenue - period.inputs.operatingExpenses)}
            </strong>
          </div>
          <div>
            <span>Other household wages</span>
            <strong>{money(period.inputs.otherHouseholdWages)}</strong>
          </div>
        </div>
        <button className="button review-button" onClick={onNavigate}>
          Review shared inputs →
        </button>
      </div>
    </>
  )
}
