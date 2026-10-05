import type { Client, PlanningWorkspace } from '../types/workspace'
import { money } from './format'
import { comparisonResult, reviewInsights } from './comparison'
import { entityTypes } from '../data/sampleScenarios'
import { structureTemplates } from '../data/workspace'
export interface ReportOptions {
  client: Client
  period: PlanningWorkspace
  year: string
  firmName: string
  scenarioIds: string[]
  sections: string[]
}
export async function createReport({
  client,
  period,
  year,
  firmName,
  scenarioIds,
  sections,
}: ReportOptions) {
  const { jsPDF } = await import('jspdf')
  const pdf = new jsPDF({ unit: 'mm', format: 'a4' })
  const width = 174
  const left = 18
  let y = 22
  const clean = (value: string) =>
    value
      .replace(/[−–—]/g, '-')
      .replace(/→/g, '->')
      .replace(/[‘’]/g, "'")
      .replace(/[“”]/g, '"')
  function pageBreak(required = 12) {
    if (y + required > 270) {
      pdf.addPage()
      y = 27
    }
  }
  function text(
    value: string,
    size = 10,
    bold = false,
    color: [number, number, number] = [41, 57, 47],
  ) {
    pdf.setFont('helvetica', bold ? 'bold' : 'normal')
    pdf.setFontSize(size)
    pdf.setTextColor(...color)
    const lines: string[] = pdf.splitTextToSize(clean(value), width)
    for (const line of lines) {
      pageBreak(size * 0.45 + 2)
      pdf.text(line, left, y)
      y += size * 0.45 + 1.5
    }
  }
  function heading(value: string) {
    pageBreak(24)
    y += 6
    pdf.setDrawColor(220, 227, 218)
    pdf.line(left, y, 192, y)
    y += 9
    text(value, 15, true, [62, 98, 86])
    y += 3
  }
  function row(label: string, value: string) {
    pageBreak(13)
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(9)
    const labels: string[] = pdf.splitTextToSize(clean(label), 87)
    const values: string[] = pdf.splitTextToSize(clean(value), 75)
    const height = Math.max(labels.length, values.length) * 4.5 + 4
    pageBreak(height)
    pdf.setTextColor(101, 115, 105)
    pdf.text(labels, left, y)
    pdf.setTextColor(41, 57, 47)
    pdf.text(values, 112, y)
    y += height
  }
  pdf.setProperties({
    title: `Entity comparison - ${client.businessName} - ${year}`,
    author: firmName || 'Tapreco',
    subject: 'Illustrative and advisor-entered entity planning estimates',
  })
  text(firmName || 'Tapreco advisory workspace', 10, true, [62, 98, 86])
  y += 4
  text('Entity Savings Report', 24, true)
  y += 3
  text(`${client.businessName} | ${client.ownerName} | Tax year ${year}`, 11)
  text(
    'Illustrative / advisor-entered estimates. Not a tax return or tax advice.',
    9,
    false,
    [101, 115, 105],
  )
  const scenarios = period.scenarios.filter((scenario) =>
    scenarioIds.includes(scenario.id),
  )
  if (sections.includes('summary')) {
    heading('Client & business summary')
    row('Annual revenue', money(period.inputs.revenue))
    row('Operating expenses', money(period.inputs.operatingExpenses))
    row(
      'Business profit before owner compensation',
      money(period.inputs.revenue - period.inputs.operatingExpenses),
    )
    row('Filing status', period.inputs.filingStatus)
    row('Resident state', period.inputs.residentState || 'Not entered')
    row('Other household wages', money(period.inputs.otherHouseholdWages))
    row('Ownership assumption', `${period.inputs.ownershipPercentage}%`)
  }
  if (sections.includes('assumptions')) {
    heading('Scenario assumptions')
    for (const scenario of scenarios) {
      pageBreak(65)
      text(`${scenario.name} - ${scenario.label}`, 11, true)
      y += 2
      row(
        'Tax treatment',
        entityTypes.find((type) => type.value === scenario.entityType)!.label,
      )
      row(
        'Owner W-2 salary',
        ['s-corporation', 'c-corporation'].includes(scenario.entityType)
          ? money(scenario.ownerSalary)
          : 'Not applicable',
      )
      row('Retirement contribution', money(scenario.retirementContribution))
      row(
        'Dividend distribution',
        scenario.entityType === 'c-corporation'
          ? `${scenario.dividendPercentage}%`
          : 'Not applicable',
      )
      row('Additional annual administration costs', money(scenario.adminCosts))
      row('One-time transition costs', money(scenario.transitionCosts))
      y += 4
    }
    if (period.notes.trim()) {
      text('Notes & assumptions', 11, true)
      text(period.notes)
    }
  }
  if (sections.includes('comparison')) {
    heading('Tax & cost comparison')
    text(
      `Baseline: ${period.scenarios[0].name}. Annual benefit = baseline tax estimate minus scenario tax estimate minus additional recurring costs. First-year benefit also subtracts scenario transition costs.`,
      9,
    )
    for (const scenario of scenarios) {
      pageBreak(53)
      text(`${scenario.name} - ${scenario.label}`, 11, true)
      const result = comparisonResult(scenario, period.scenarios[0])
      row(
        'Combined business & owner taxes',
        scenario.modeledTaxes === undefined
          ? 'Estimate not entered'
          : `${money(scenario.modeledTaxes)} (${scenario.taxSource === 'sample' ? 'illustrative sample' : 'advisor entered'})`,
      )
      if (scenario.id !== 'current') {
        row(
          'Annual net benefit vs. baseline',
          result ? money(result.annualBenefit) : 'Incomplete estimates',
        )
        row(
          'First-year net benefit',
          result ? money(result.firstYearBenefit) : 'Incomplete estimates',
        )
      }
      row(
        'State-tax calculation',
        'Not calculated separately. Review the entered combined estimate.',
      )
      y += 4
    }
  }
  if (sections.includes('charts')) {
    heading('Taxes across selected scenarios')
    text('Combined business and owner tax estimates in US dollars.', 9)
    const max = Math.max(
      1,
      ...scenarios.map((scenario) => scenario.modeledTaxes ?? 0),
    )
    for (const scenario of scenarios) {
      pageBreak(24)
      text(`${scenario.name} - ${scenario.label}`, 9, true)
      pdf.setFillColor(245, 246, 242)
      pdf.roundedRect(left, y, 132, 6, 1, 1, 'F')
      if (scenario.modeledTaxes !== undefined && scenario.modeledTaxes > 0) {
        pdf.setFillColor(62, 98, 86)
        pdf.rect(left, y, (scenario.modeledTaxes / max) * 132, 6, 'F')
      }
      pdf.setFontSize(9)
      pdf.setTextColor(41, 57, 47)
      pdf.text(
        scenario.modeledTaxes === undefined
          ? 'Not entered'
          : money(scenario.modeledTaxes),
        192,
        y + 4.5,
        { align: 'right' },
      )
      y += 14
    }
  }
  if (sections.includes('observations')) {
    heading('CPA observations')
    text(period.observations.trim() || 'No CPA observations have been entered.')
  }
  if (sections.includes('insights')) {
    heading('Selected assumption-review insights')
    const scenario =
      period.scenarios.find((item) => item.id === period.selectedScenarioId) ??
      period.scenarios[1]
    text(
      `${scenario.name} compared with ${period.scenarios[0].name}. Rule-based review of entered figures; no AI service is connected.`,
      9,
    )
    const selected = reviewInsights(scenario, period.scenarios[0]).filter(
      (insight) => period.selectedInsights.includes(insight.id),
    )
    if (!selected.length) text('No insights selected.')
    for (const insight of selected) {
      pageBreak(28)
      text(insight.title, 11, true)
      text(insight.text)
      y += 4
    }
  }
  if (sections.includes('structure')) {
    heading('Ownership structure & intercompany payments')
    const plan = period.structure
    const template =
      structureTemplates.find((item) => item.id === plan.templateId) ??
      structureTemplates[0]
    text(template.name, 11, true)
    text(
      `${plan.ownerName || 'Owner'} - ${plan.ownershipPercentage}% ownership assumption`,
      10,
    )
    text(
      `Relationship: ${template.relationship}. Diagram records planning assumptions, not established legal ownership.`,
      9,
    )
    function diagramNodes(names: string[], parent: string) {
      const boxWidth = (width - (names.length - 1) * 6) / names.length
      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(9)
      const labels: string[][] = names.map((name) =>
        pdf.splitTextToSize(clean(name), boxWidth - 10),
      )
      const height = Math.max(
        16,
        ...labels.map((lines) => lines.length * 4.5 + 10),
      )
      pageBreak(height + 24)
      text(parent, 9, true)
      const lineY = y + 3
      pdf.setDrawColor(62, 98, 86)
      pdf.line(105, y - 1, 105, lineY)
      const centers = names.map(
        (_, index) => left + index * (boxWidth + 6) + boxWidth / 2,
      )
      pdf.line(centers[0], lineY, centers.at(-1)!, lineY)
      for (const center of centers) {
        pdf.line(center, lineY, center, lineY + 4)
        pdf.line(center, lineY + 4, center - 1, lineY + 2)
        pdf.line(center, lineY + 4, center + 1, lineY + 2)
      }
      y = lineY + 5
      names.forEach((_, index) => {
        const x = left + index * (boxWidth + 6)
        pdf.setDrawColor(220, 227, 218)
        pdf.setFillColor(234, 240, 232)
        pdf.roundedRect(x, y, boxWidth, height, 2, 2, 'FD')
        pdf.setFont('helvetica', 'normal')
        pdf.setFontSize(9)
        pdf.setTextColor(41, 57, 47)
        pdf.text(labels[index], x + 5, y + 7)
      })
      y += height + 8
    }
    const hierarchical = ['holding', 's-holding', 'direct'].includes(
      plan.templateId,
    )
    const children = hierarchical ? plan.entities.slice(1) : plan.entities
    if (hierarchical)
      diagramNodes(
        [plan.entities[0].name],
        `Owner: ${plan.ownerName || 'Owner'}`,
      )
    for (let index = 0; index < children.length; index += 3)
      diagramNodes(
        children.slice(index, index + 3).map((entity) => entity.name),
        hierarchical
          ? `Held by: ${plan.entities[0].name}`
          : `Separately held by: ${plan.ownerName || 'Owner'}`,
      )
    for (const payment of plan.payments) {
      text(
        `${plan.entities.find((entity) => entity.id === payment.from)?.name} -> ${plan.entities.find((entity) => entity.id === payment.to)?.name}: ${money(payment.amount)} annually. Paid and received once; combined internal transfer effect $0.`,
        9,
      )
    }
    if (plan.notes.trim()) text(plan.notes)
    text(
      'Annual taxes, exit taxes, and QSBS eligibility are not calculated by this structure view.',
      9,
    )
  }
  const pages = pdf.getNumberOfPages()
  for (let page = 1; page <= pages; page++) {
    pdf.setPage(page)
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(8)
    pdf.setTextColor(101, 115, 105)
    pdf.setDrawColor(220, 227, 218)
    pdf.line(left, 277, 192, 277)
    pdf.text(
      'Illustrative / advisor-entered estimates. Review assumptions before client use.',
      left,
      282,
    )
    pdf.text(`${year} | ${page} / ${pages}`, 192, 287, { align: 'right' })
    pdf.text(
      'Tapreco | ' +
        new Intl.DateTimeFormat('en-IN', {
          timeZone: 'Asia/Kolkata',
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        }).format(new Date()),
      left,
      287,
    )
    if (page > 1) {
      pdf.setFontSize(9)
      const header: string[] = pdf.splitTextToSize(
        `${clean(client.businessName)} | Entity Savings Report`,
        width,
      )
      pdf.text(header[0], left, 15)
    }
  }
  return pdf
}
export async function downloadReport(options: ReportOptions) {
  const pdf = await createReport(options)
  pdf.save(
    `tapreco-${options.client.businessName.replace(/[^a-z0-9]+/gi, '-').toLowerCase() || 'client'}-${options.year}-entity-report.pdf`,
  )
}
