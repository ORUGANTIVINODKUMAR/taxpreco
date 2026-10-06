import type { ReactNode } from 'react'
import type { EntityScenario } from '../../types/entityComparison'
import { entityTypes } from '../../data/sampleScenarios'
import { benefit, money } from '../../utils/format'
import { NumberInput } from './NumberInput'
import { comparisonResult } from '../../utils/comparison'
interface Props {
  scenarios: EntityScenario[]
  profit: number
  onChange: (id: string, patch: Partial<EntityScenario>) => void
  onRemove: (id: string) => void
}
export function ScenarioTable({
  scenarios: rawScenarios,
  profit,
  onChange,
  onRemove,
}: Props) {
  const scenarios = rawScenarios.map((scenario) => {
    const result = comparisonResult(scenario, rawScenarios[0])
    return {
      ...scenario,
      annualBenefit: result?.annualBenefit,
      firstYearBenefit: result?.firstYearBenefit,
    }
  })
  function row(
    label: string,
    render: (scenario: (typeof scenarios)[number]) => ReactNode,
    className?: string,
  ) {
    return (
      <tr className={className}>
        <th scope="row">{label}</th>
        {scenarios.map((scenario) => (
          <td key={scenario.id}>{render(scenario)}</td>
        ))}
      </tr>
    )
  }
  function editable(
    scenario: EntityScenario,
    field:
      | 'ownerSalary'
      | 'retirementContribution'
      | 'dividendPercentage'
      | 'adminCosts'
      | 'transitionCosts',
    label: string,
  ) {
    return (
      <NumberInput
        compact
        label={`${scenario.name} ${scenario.label} ${label}`}
        value={scenario[field]}
        percentage={field === 'dividendPercentage'}
        max={field === 'dividendPercentage' ? 100 : undefined}
        onChange={(value) => onChange(scenario.id, { [field]: value })}
      />
    )
  }
  return (
    <div
      className="table-scroll"
      role="region"
      aria-label="Entity scenario comparison table"
      tabIndex={0}
    >
      <table style={{ minWidth: Math.max(590, 260 + scenarios.length * 155) }}>
        <caption className="sr-only">
          Entity scenarios: editable assumptions, illustrative or entered tax
          estimates, and benefits after costs. All amounts in US dollars.
        </caption>
        <thead>
          <tr>
            <th scope="col" className="table-overline">
              Inputs & results
            </th>
            {scenarios.map((scenario) => (
              <th scope="col" key={scenario.id}>
                <strong>{scenario.name}</strong>
                <span className="chip">{scenario.label}</span>
                {scenario.id !== 'current' && scenarios.length > 2 && (
                  <button
                    className="remove-scenario"
                    onClick={() => onRemove(scenario.id)}
                    aria-label={`Remove ${scenario.name} ${scenario.label}`}
                  >
                    Remove
                  </button>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {row(
            'Tax treatment',
            (scenario) =>
              entityTypes.find((type) => type.value === scenario.entityType)
                ?.name,
          )}
          {row('Profit before owner compensation', () => money(profit))}
          <tr className="section-row">
            <td colSpan={scenarios.length + 1}>Compensation & costs</td>
          </tr>
          {row('Owner W-2 salary', (scenario) =>
            ['s-corporation', 'c-corporation'].includes(scenario.entityType)
              ? editable(scenario, 'ownerSalary', 'owner salary')
              : '—',
          )}
          {row('Employer retirement contribution', (scenario) =>
            editable(
              scenario,
              'retirementContribution',
              'retirement contribution',
            ),
          )}
          {row('Profit distributed as dividends', (scenario) =>
            scenario.entityType === 'c-corporation'
              ? editable(scenario, 'dividendPercentage', 'dividend percentage')
              : 'Not applicable',
          )}
          {row('Additional annual admin costs', (scenario) =>
            scenario.id === 'current'
              ? money(0)
              : editable(scenario, 'adminCosts', 'administration costs'),
          )}
          {row('One-time transition costs', (scenario) =>
            scenario.id === 'current'
              ? money(0)
              : editable(scenario, 'transitionCosts', 'transition costs'),
          )}
          <tr className="section-row">
            <td colSpan={scenarios.length + 1}>
              Illustrative / entered estimates · Benefits after costs
            </td>
          </tr>
          {row('Combined tax estimate', (scenario) =>
            scenario.modeledTaxes === undefined
              ? 'Not modeled'
              : money(scenario.modeledTaxes),
          )}
          {row(
            'Annual net benefit vs. baseline',
            (scenario) =>
              scenario.id === 'current' ? (
                '—'
              ) : scenario.annualBenefit === undefined ? (
                'Not modeled'
              ) : (
                <span className={scenario.annualBenefit < 0 ? 'negative' : ''}>
                  {benefit(scenario.annualBenefit)}
                </span>
              ),
            'result-row',
          )}
          {row('First-year net benefit', (scenario) =>
            scenario.id === 'current' ? (
              '—'
            ) : scenario.firstYearBenefit === undefined ? (
              'Not modeled'
            ) : (
              <span className={scenario.firstYearBenefit < 0 ? 'negative' : ''}>
                {benefit(scenario.firstYearBenefit)}
              </span>
            ),
          )}
          {row('State tax', () => (
            <span className="muted">Not modeled</span>
          ))}
        </tbody>
      </table>
    </div>
  )
}
