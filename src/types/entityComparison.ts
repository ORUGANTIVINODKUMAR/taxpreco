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
