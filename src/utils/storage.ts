import { entityTypes, reportSections } from '../data/sampleScenarios'
import { structureTemplates } from '../data/workspace'
import type { WorkspaceStore } from '../types/workspace'
const record = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)
const number = (value: unknown) =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0
const strings = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === 'string')
function validPeriod(value: unknown): boolean {
  if (
    !record(value) ||
    !record(value.inputs) ||
    !record(value.planner) ||
    !record(value.structure)
  )
    return false
  const inputs = value.inputs
  if (
    ![
      'revenue',
      'operatingExpenses',
      'otherHouseholdWages',
      'ownershipPercentage',
    ].every((key) => number(inputs[key])) ||
    Number(inputs.ownershipPercentage) > 100 ||
    typeof inputs.filingStatus !== 'string' ||
    typeof inputs.residentState !== 'string'
  )
    return false
  if (
    !Array.isArray(value.scenarios) ||
    value.scenarios.length < 2 ||
    value.scenarios.length > 30
  )
    return false
  if (
    !value.scenarios.every(
      (item) =>
        record(item) &&
        typeof item.id === 'string' &&
        typeof item.name === 'string' &&
        typeof item.label === 'string' &&
        entityTypes.some((type) => type.value === item.entityType) &&
        [
          'ownerSalary',
          'retirementContribution',
          'dividendPercentage',
          'adminCosts',
          'transitionCosts',
        ].every((key) => number(item[key])) &&
        Number(item.dividendPercentage) <= 100 &&
        (item.modeledTaxes === undefined || number(item.modeledTaxes)),
    )
  )
    return false
  const ids = value.scenarios.map((item) => item.id)
  if (
    new Set(ids).size !== ids.length ||
    ids[0] !== 'current' ||
    typeof value.selectedScenarioId !== 'string' ||
    value.selectedScenarioId === 'current' ||
    !ids.includes(value.selectedScenarioId)
  )
    return false
  if (
    !strings(value.selectedInsights) ||
    !strings(value.selectedSections) ||
    typeof value.notes !== 'string' ||
    typeof value.observations !== 'string' ||
    typeof value.assumptionsEdited !== 'boolean'
  )
    return false
  if (
    !value.selectedInsights.every((id) =>
      ['cost', 'salary', 'setup', 'state'].includes(id),
    ) ||
    !value.selectedSections.every((id) =>
      [...reportSections.map((section) => section.id), 'structure'].includes(
        id,
      ),
    )
  )
    return false
  if (
    !['annualTaxEstimate', 'withholding', 'payments'].every((key) =>
      number((value.planner as Record<string, unknown>)[key]),
    )
  )
    return false
  if (
    !Array.isArray(value.documents) ||
    value.documents.length > 100 ||
    !value.documents.every(
      (doc) =>
        record(doc) &&
        typeof doc.id === 'string' &&
        typeof doc.name === 'string' &&
        typeof doc.addedAt === 'string' &&
        typeof doc.applied === 'boolean' &&
        Array.isArray(doc.rows) &&
        doc.rows.length <= 1000 &&
        doc.rows.every(
          (row) =>
            record(row) &&
            typeof row.label === 'string' &&
            typeof row.amount === 'number' &&
            Number.isFinite(row.amount),
        ),
    )
  )
    return false
  const structure = value.structure
  const validStructure =
    structureTemplates.some(
      (template) => template.id === structure.templateId,
    ) &&
    typeof structure.ownerName === 'string' &&
    number(structure.ownershipPercentage) &&
    Number(structure.ownershipPercentage) <= 100 &&
    typeof structure.notes === 'string' &&
    Array.isArray(structure.entities) &&
    structure.entities.length > 0 &&
    structure.entities.length <= 20 &&
    structure.entities.every(
      (entity) =>
        record(entity) &&
        typeof entity.id === 'string' &&
        typeof entity.name === 'string' &&
        typeof entity.entityType === 'string',
    ) &&
    Array.isArray(structure.payments) &&
    structure.payments.every(
      (payment) =>
        record(payment) &&
        typeof payment.id === 'string' &&
        typeof payment.from === 'string' &&
        typeof payment.to === 'string' &&
        typeof payment.description === 'string' &&
        number(payment.amount),
    )
  if (!validStructure) return false
  const entityIds = (structure.entities as { id: string }[]).map(
    (entity) => entity.id,
  )
  const payments = structure.payments as {
    id: string
    from: string
    to: string
  }[]
  return (
    new Set(entityIds).size === entityIds.length &&
    new Set(payments.map((payment) => payment.id)).size === payments.length &&
    payments.every(
      (payment) =>
        payment.from !== payment.to &&
        entityIds.includes(payment.from) &&
        entityIds.includes(payment.to),
    )
  )
}
export function validateStore(value: unknown): value is WorkspaceStore {
  if (
    !record(value) ||
    value.version !== 1 ||
    !Array.isArray(value.clients) ||
    !value.clients.length ||
    value.clients.length > 100 ||
    typeof value.activeClientId !== 'string' ||
    typeof value.taxYear !== 'string' ||
    !/^20\d{2}$/.test(value.taxYear) ||
    !record(value.settings) ||
    typeof value.settings.firmName !== 'string' ||
    !['comfortable', 'compact'].includes(String(value.settings.density))
  )
    return false
  if (
    !value.clients.every(
      (client) =>
        record(client) &&
        typeof client.id === 'string' &&
        typeof client.businessName === 'string' &&
        typeof client.ownerName === 'string' &&
        record(client.periods) &&
        Object.entries(client.periods).every(
          ([year, period]) => /^20\d{2}$/.test(year) && validPeriod(period),
        ),
    )
  )
    return false
  const clients = value.clients as WorkspaceStore['clients']
  return (
    new Set(clients.map((client) => client.id)).size === clients.length &&
    clients.some(
      (client) =>
        client.id === value.activeClientId &&
        client.periods[String(value.taxYear)],
    )
  )
}
