import type { EntityScenario, SharedBusinessInputs } from './entityComparison'
export type WorkspacePage =
  'overview' | 'planner' | 'entity' | 'structure' | 'files' | 'settings'
export interface FinancialRow {
  label: string
  amount: number
}
export interface ClientDocument {
  id: string
  name: string
  addedAt: string
  rows: FinancialRow[]
  applied: boolean
}
export interface StructureEntity {
  id: string
  name: string
  entityType: string
}
export interface IntercompanyPayment {
  id: string
  from: string
  to: string
  amount: number
  description: string
}
export interface StructurePlan {
  templateId: string
  ownerName: string
  ownershipPercentage: number
  entities: StructureEntity[]
  payments: IntercompanyPayment[]
  notes: string
}
export interface PlanningWorkspace {
  inputs: SharedBusinessInputs
  scenarios: EntityScenario[]
  selectedScenarioId: string
  notes: string
  observations: string
  selectedInsights: string[]
  selectedSections: string[]
  assumptionsEdited: boolean
  documents: ClientDocument[]
  planner: { annualTaxEstimate: number; withholding: number; payments: number }
  structure: StructurePlan
}
export interface Client {
  id: string
  businessName: string
  ownerName: string
  periods: Record<string, PlanningWorkspace>
}
export interface WorkspaceStore {
  version: 1
  clients: Client[]
  activeClientId: string
  taxYear: string
  settings: { firmName: string; density: 'comfortable' | 'compact' }
}
