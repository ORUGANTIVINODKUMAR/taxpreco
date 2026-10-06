export type View = 'grid' | 'comparison' | 'ai'
export type EntityType =
  'sole-proprietor' | 'partnership' | 's-corporation' | 'c-corporation'
export interface SharedBusinessInputs {
  revenue: number
  operatingExpenses: number
  filingStatus: string
  residentState: string
  otherHouseholdWages: number
  ownershipPercentage: number
}
export interface EntityScenario {
  id: string
  name: string
  label: string
  entityType: EntityType
  ownerSalary: number
  retirementContribution: number
  dividendPercentage: number
  adminCosts: number
  transitionCosts: number
  // Tax amounts are illustrative or entered by an advisor, never a tax-engine output.
  taxSource?: 'sample' | 'entered'
  modeledTaxes?: number
}

export interface DemoClient {
  id: string
  businessName: string
  ownerName: string
}

// In-memory demo state only. Refresh or client/year selection resets it.
export interface EntityComparisonState {
  inputs: SharedBusinessInputs
  scenarios: EntityScenario[]
  selectedScenarioId: string
  notes: string
  observations: string
  selectedInsights: string[]
  selectedSections: string[]
}

export interface ReportOptions {
  client: DemoClient
  period: EntityComparisonState
  year: string
  scenarioIds: string[]
  sections: string[]
}
