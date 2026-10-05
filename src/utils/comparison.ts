import type { EntityScenario } from '../types/entityComparison'
import { money } from './format'
export function comparisonResult(
  scenario: EntityScenario,
  baseline: EntityScenario,
) {
  if (
    scenario.modeledTaxes === undefined ||
    baseline.modeledTaxes === undefined
  )
    return undefined
  const taxDifference = baseline.modeledTaxes - scenario.modeledTaxes
  const additionalCosts = scenario.adminCosts - baseline.adminCosts
  const annualBenefit = taxDifference - additionalCosts
  return {
    taxDifference,
    additionalCosts,
    annualBenefit,
    firstYearBenefit: annualBenefit - scenario.transitionCosts,
  }
}
export function reviewInsights(
  scenario: EntityScenario,
  baseline: EntityScenario,
) {
  const result = comparisonResult(scenario, baseline)
  return [
    {
      id: 'cost',
      category: 'Cost impact',
      title: 'Look beyond the tax difference',
      text: result
        ? `The ${money(result.taxDifference)} tax difference becomes a ${money(result.annualBenefit)} annual net benefit after ${money(result.additionalCosts)} in additional recurring costs. These figures use illustrative or advisor-entered tax estimates.`
        : 'Enter combined tax estimates for the baseline and selected scenario to compare annual benefits after recurring costs.',
    },
    {
      id: 'salary',
      category: 'Compensation',
      title: 'Review the salary assumption',
      text: ['s-corporation', 'c-corporation'].includes(scenario.entityType)
        ? `The ${money(scenario.ownerSalary)} salary is an entered assumption. Review supporting reasonable-compensation analysis separately; editing salary does not calculate taxes.`
        : 'Owner W-2 salary is not used for this entity treatment. Review owner compensation and retirement assumptions separately.',
    },
    {
      id: 'setup',
      category: 'First-year costs',
      title: 'Separate setup from recurring costs',
      text: result
        ? `The scenario includes ${money(scenario.transitionCosts)} in one-time transition costs, producing a ${money(result.firstYearBenefit)} first-year net benefit.`
        : `The scenario includes ${money(scenario.transitionCosts)} in one-time transition costs. Complete the tax estimates before comparing the first-year net benefit.`,
    },
    {
      id: 'state',
      category: 'Missing information',
      title: 'Complete the state-tax comparison',
      text: 'State taxes are not calculated by this workspace. Confirm that applicable entity taxes and fees are included in your entered combined estimate before finalizing the comparison.',
    },
  ]
}
