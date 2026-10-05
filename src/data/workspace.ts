import {
  initialInputs,
  sampleScenarios,
  reportSections,
} from './sampleScenarios'
import type {
  PlanningWorkspace,
  StructurePlan,
  WorkspacePage,
  WorkspaceStore,
} from '../types/workspace'
export const navigation: { id: WorkspacePage; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'planner', label: 'Income Tax Planner' },
  { id: 'entity', label: 'Entity Savings' },
  { id: 'structure', label: 'Structure Advisor' },
  { id: 'files', label: 'Client files' },
  { id: 'settings', label: 'Settings' },
]
export const structureTemplates = [
  {
    id: 'property',
    name: 'Separate real-estate entity',
    entities: ['Operating business', 'Property LLC'],
    relationship: 'Lease payments',
    guidance:
      'Compare property held in the operating business with separately owned property. Review financing, contracts, and applicable taxes.',
  },
  {
    id: 's-holding',
    name: 'S corporation holding C corporation stock',
    entities: ['S corporation', 'C corporation'],
    relationship: 'Stock ownership',
    guidance:
      'This diagram records an ownership alternative. QSBS eligibility and any exclusion benefit require separate professional review.',
  },
  {
    id: 'direct',
    name: 'Direct vs. partnership-held C corporation stock',
    entities: ['Holding partnership', 'C corporation'],
    relationship: 'Stock ownership',
    guidance:
      'Review direct ownership against partnership ownership. Eligibility and exit taxes are not automatically established by this structure.',
  },
  {
    id: 'holding',
    name: 'Holding company with subsidiaries',
    entities: [
      'Holding company',
      'Operating subsidiary 1',
      'Operating subsidiary 2',
    ],
    relationship: 'Subsidiary ownership',
    guidance:
      'Document ownership and payments between businesses. Eliminate internal transfers from combined revenue and expense totals.',
  },
  {
    id: 'assets',
    name: 'Separate equipment or IP entity',
    entities: ['Operating business', 'Equipment / IP LLC'],
    relationship: 'Lease or license payments',
    guidance:
      'Compare assets held inside the business with separately owned equipment or intellectual property.',
  },
  {
    id: 'custom',
    name: 'Custom multi-entity structure',
    entities: ['Operating entity', 'Holding entity'],
    relationship: 'Custom relationship',
    guidance:
      'Record entities and intercompany payments. This planning diagram does not establish tax eligibility or legal ownership.',
  },
]
export function createStructure(
  templateId = 'property',
  ownerName = 'Owner',
): StructurePlan {
  const template =
    structureTemplates.find((item) => item.id === templateId) ??
    structureTemplates[0]
  return {
    templateId: template.id,
    ownerName,
    ownershipPercentage: 100,
    entities: template.entities.map((name, index) => ({
      id: `entity-${index}`,
      name,
      entityType: index === 0 ? 'Operating entity' : 'Holding entity',
    })),
    payments: [],
    notes: '',
  }
}
export function createPeriod(
  sample = false,
  ownerName = 'Owner',
): PlanningWorkspace {
  return {
    inputs: sample
      ? { ...initialInputs }
      : {
          ...initialInputs,
          revenue: 0,
          operatingExpenses: 0,
          otherHouseholdWages: 0,
        },
    scenarios: sampleScenarios.map((scenario) =>
      sample
        ? { ...scenario, taxSource: 'sample' }
        : {
            ...scenario,
            ownerSalary: 0,
            retirementContribution: 0,
            adminCosts: 0,
            transitionCosts: 0,
            modeledTaxes: undefined,
            taxSource: 'entered',
          },
    ),
    selectedScenarioId: 'sample-s',
    notes: '',
    observations: '',
    selectedInsights: ['cost', 'salary', 'setup', 'state'],
    selectedSections: reportSections
      .filter((section) => section.checked)
      .map((section) => section.id),
    assumptionsEdited: false,
    documents: [],
    planner: {
      annualTaxEstimate: sample ? 70000 : 0,
      withholding: 0,
      payments: 0,
    },
    structure: createStructure('property', ownerName),
  }
}
export function createStore(): WorkspaceStore {
  return {
    version: 1,
    clients: [
      {
        id: 'sample-client',
        businessName: 'ABC Consulting',
        ownerName: 'Alex Morgan',
        periods: { '2026': createPeriod(true, 'Alex Morgan') },
      },
    ],
    activeClientId: 'sample-client',
    taxYear: '2026',
    settings: { firmName: 'Your firm', density: 'comfortable' },
  }
}
