import type {
  EntityScenario,
  EntityType,
  SharedBusinessInputs,
  DemoClient,
  EntityComparisonState,
} from '../types/entityComparison'
export const initialInputs: SharedBusinessInputs = {
  revenue: 400000,
  operatingExpenses: 150000,
  filingStatus: 'Married filing jointly',
  residentState: 'Florida',
  otherHouseholdWages: 60000,
  ownershipPercentage: 100,
}
export const entityTypes: { value: EntityType; name: string; label: string }[] =
  [
    {
      value: 'sole-proprietor',
      name: 'Sole proprietor',
      label: 'Sole proprietor / disregarded LLC',
    },
    {
      value: 'partnership',
      name: 'Partnership',
      label: 'Partnership / LLC taxed as partnership',
    },
    { value: 's-corporation', name: 'S corporation', label: 'S corporation' },
    { value: 'c-corporation', name: 'C corporation', label: 'C corporation' },
  ]
export const sampleScenarios: EntityScenario[] = [
  {
    id: 'current',
    name: 'Current arrangement',
    label: 'Baseline',
    entityType: 'sole-proprietor',
    ownerSalary: 0,
    retirementContribution: 0,
    dividendPercentage: 0,
    adminCosts: 0,
    transitionCosts: 0,
    modeledTaxes: 70000,
  },
  {
    id: 'sample-s',
    name: 'S corporation',
    label: 'Alternative 1',
    entityType: 's-corporation',
    ownerSalary: 90000,
    retirementContribution: 0,
    dividendPercentage: 0,
    adminCosts: 3000,
    transitionCosts: 1500,
    modeledTaxes: 58000,
  },
  {
    id: 'sample-c',
    name: 'C corporation',
    label: 'Alternative 2',
    entityType: 'c-corporation',
    ownerSalary: 90000,
    retirementContribution: 0,
    dividendPercentage: 100,
    adminCosts: 4000,
    transitionCosts: 2000,
    modeledTaxes: 75000,
  },
]
export const reportSections = [
  { id: 'summary', label: 'Client & business summary', checked: true },
  { id: 'assumptions', label: 'Scenario assumptions', checked: true },
  { id: 'comparison', label: 'Tax & cost comparison', checked: true },
  { id: 'charts', label: 'Comparison charts', checked: true },
  { id: 'observations', label: 'CPA observations', checked: true },
  { id: 'insights', label: 'Selected AI insights', checked: false },
]

export const demoClients: DemoClient[] = [
  { id: 'abc', businessName: 'ABC Consulting', ownerName: 'Alex Morgan' },
  { id: 'acme', businessName: 'Acme Studio', ownerName: 'Jamie Lee' },
]

export const demoTaxYears = ['2026', '2025', '2027']

export function createDemoComparison(clientId = 'abc'): EntityComparisonState {
  return {
    inputs: {
      ...initialInputs,
      ...(clientId === 'acme' ? { revenue: 300000, operatingExpenses: 125000 } : {}),
    },
    scenarios: sampleScenarios.map((scenario) => ({ ...scenario, taxSource: 'sample' })),
    selectedScenarioId: 'sample-s',
    notes: '',
    observations: '',
    selectedInsights: ['cost', 'salary', 'setup', 'state'],
    selectedSections: reportSections.filter((section) => section.checked).map((section) => section.id),
  }
}
