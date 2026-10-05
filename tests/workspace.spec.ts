import { test, expect } from '@playwright/test'
import type { Page } from '@playwright/test'
import { readFile } from 'node:fs/promises'
import ExcelJS from 'exceljs'
import { jsPDF } from 'jspdf'
const browserErrors = new WeakMap<Page, string[]>()
const route = async (page: Page, label: string) =>
  page
    .getByRole('navigation', { name: 'Workspace', exact: true })
    .getByRole('link', { name: label, exact: true })
    .click()
test.beforeEach(async ({ page }) => {
  const errors: string[] = []
  browserErrors.set(page, errors)
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  await page.goto('/')
  await expect(
    page.getByRole('heading', {
      name: 'Entity Savings Calculator',
      exact: true,
    }),
  ).toBeVisible()
})

test.afterEach(async ({ page }) => {
  expect(browserErrors.get(page), 'Browser runtime and console errors').toEqual([])
})

test('all sidebar destinations, overview actions, and browser history work', async ({
  page,
}) => {
  for (const [label, heading] of [
    ['Overview', 'Advisory workspace'],
    ['Income Tax Planner', 'Income Tax Planner'],
    ['Structure Advisor', 'Structure Advisor'],
    ['Client files', 'Client files'],
    ['Settings', 'Workspace settings'],
    ['Entity Savings', 'Entity Savings Calculator'],
  ]) {
    await route(page, label)
    await expect(
      page.getByRole('heading', { name: heading, exact: true }),
    ).toBeVisible()
  }
  await page.goBack()
  await expect(
    page.getByRole('heading', { name: 'Workspace settings', exact: true }),
  ).toBeVisible()
  await page.goForward()
  await expect(
    page.getByRole('heading', {
      name: 'Entity Savings Calculator',
      exact: true,
    }),
  ).toBeVisible()
  await route(page, 'Overview')
  await page
    .getByRole('button', { name: 'Open Entity Savings', exact: false })
    .click()
  await expect(
    page.getByRole('tab', { name: 'Scenario Grid', exact: true }),
  ).toBeVisible()
})

test('editable estimates and costs recalculate benefits, support every entity type, and persist', async ({
  page,
}) => {
  await page
    .getByText('Shared client & business inputs', { exact: true })
    .click()
  await page
    .getByRole('textbox', { name: 'Annual revenue', exact: true })
    .fill('500000')
  await page
    .getByRole('textbox', { name: 'Operating expenses', exact: true })
    .fill('175000')
  await expect(page.locator('.shared-inputs summary')).toContainText('$325,000')
  await page
    .getByRole('textbox', {
      name: 'S corporation Alternative 1 administration costs',
      exact: true,
    })
    .fill('5000')
  await page
    .getByRole('button', { name: 'View comparison', exact: false })
    .click()
  await expect(page.locator('.kpi strong').nth(1)).toHaveText('$7,000')
  await page
    .getByRole('button', { name: 'Edit tax estimates', exact: true })
    .click()
  await page
    .getByRole('dialog')
    .getByRole('textbox', {
      name: 'S corporation Alternative 1 combined tax estimate',
      exact: true,
    })
    .fill('55000')
  await page.getByRole('button', { name: 'Done reviewing estimates' }).click()
  await expect(page.locator('.kpi strong').nth(1)).toHaveText('$10,000')
  await expect(page.locator('.kpi strong').nth(2)).toHaveText('$8,500')
  await page
    .getByRole('combobox', { name: 'Compare', exact: true })
    .selectOption('sample-c')
  await expect(page.locator('.kpi strong').nth(1)).toHaveText('-$9,000')
  await page
    .getByRole('button', { name: 'Review scenario assumptions', exact: false })
    .click()
  for (const entityType of [
    'sole-proprietor',
    'partnership',
    's-corporation',
    'c-corporation',
  ]) {
    await page
      .getByRole('button', { name: '+ Add scenario', exact: true })
      .click()
    await page
      .getByLabel('Tax treatment', { exact: true })
      .selectOption(entityType)
    await page
      .getByRole('dialog')
      .getByRole('button', { name: 'Add scenario', exact: true })
      .click()
  }
  await expect(page.getByRole('columnheader')).toHaveCount(8)
  await page
    .getByRole('button', {
      name: 'Remove Partnership Alternative 4',
      exact: true,
    })
    .click()
  await page.locator('.notes-panel summary').click()
  await page
    .getByLabel('Scenario notes')
    .fill('Salary and state fees require review.')
  await page.getByRole('tab', { name: 'AI Review', exact: true }).click()
  await page
    .getByRole('textbox', { name: 'CPA observations', exact: true })
    .fill('Confirm the advisor tax estimates.')
  await page.getByRole('tab', { name: 'Scenario Grid', exact: true }).focus()
  await page.keyboard.press('ArrowRight')
  await expect(page.getByRole('tab', { selected: true })).toHaveText(
    'Comparison',
  )
  await page.reload()
  await page.getByRole('tab', { name: 'Comparison', exact: true }).click()
  await expect(
    page.getByRole('combobox', { name: 'Compare', exact: true }),
  ).toHaveValue('sample-c')
  await page.getByRole('tab', { name: 'AI Review', exact: true }).click()
  await expect(
    page.getByRole('textbox', { name: 'CPA observations', exact: true }),
  ).toHaveValue('Confirm the advisor tax estimates.')
})

test('new clients and tax years maintain isolated saved financial inputs', async ({
  page,
}) => {
  await page.getByRole('button', { name: '+ New client', exact: true }).click()
  await page.getByLabel('Business name', { exact: true }).fill('Acme Studio')
  await page
    .getByLabel('Owner / client name', { exact: true })
    .fill('Jamie Lee')
  await page.getByRole('button', { name: 'Create client', exact: true }).click()
  await page
    .getByText('Shared client & business inputs', { exact: true })
    .click()
  await expect(
    page.getByRole('textbox', { name: 'Annual revenue', exact: true }),
  ).toHaveValue('0')
  await page
    .getByRole('textbox', { name: 'Annual revenue', exact: true })
    .fill('120000')
  await page.getByRole('combobox', { name: /tax year/i }).selectOption('2025')
  await page
    .getByText('Shared client & business inputs', { exact: true })
    .click()
  await expect(
    page.getByRole('textbox', { name: 'Annual revenue', exact: true }),
  ).toHaveValue('0')
  await page.getByRole('combobox', { name: /tax year/i }).selectOption('2026')
  await page
    .getByText('Shared client & business inputs', { exact: true })
    .click()
  await expect(
    page.getByRole('textbox', { name: 'Annual revenue', exact: true }),
  ).toHaveValue('120,000')
  await page
    .getByRole('combobox', { name: 'CLIENT', exact: true })
    .selectOption('sample-client')
  await page
    .getByText('Shared client & business inputs', { exact: true })
    .click()
  await expect(
    page.getByRole('textbox', { name: 'Annual revenue', exact: true }),
  ).toHaveValue('400,000')
  await page.reload()
  await expect(
    page
      .getByRole('combobox', { name: 'CLIENT', exact: true })
      .getByRole('option'),
  ).toHaveCount(2)
})

test('CSV, Excel, and PDF files extract real amounts and require review before applying', async ({
  page,
}) => {
  await route(page, 'Client files')
  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet('Profit and loss')
  sheet.addRows([
    ['Description', 'Amount'],
    ['Revenue', 480000],
    ['Operating expenses', 160000],
    ['Net profit', 320000],
  ])
  const pdf = new jsPDF()
  pdf.text('Annual revenue $480,000', 20, 30)
  pdf.text('Operating expenses $160,000', 20, 45)
  const files = [
    {
      name: 'financial.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(
        'Description,Amount\nAnnual revenue,"480,000"\nOperating expenses,160000\n',
      ),
    },
    {
      name: 'financial.xlsx',
      mimeType:
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      buffer: Buffer.from(await workbook.xlsx.writeBuffer()),
    },
    {
      name: 'financial.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from(pdf.output('arraybuffer')),
    },
  ]
  for (const file of files) {
    await page
      .getByLabel('Upload financial file', { exact: true })
      .setInputFiles(file)
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await expect(
      dialog.getByRole('button', { name: 'Apply reviewed amounts' }),
    ).toBeDisabled()
    await dialog.getByLabel('Revenue source', { exact: true }).selectOption('0')
    await dialog.getByLabel('Expense source', { exact: true }).selectOption('1')
    await expect(
      dialog.getByRole('textbox', {
        name: 'Reviewed annual revenue',
        exact: true,
      }),
    ).toHaveValue('480,000')
    await dialog.getByRole('button', { name: 'Apply reviewed amounts' }).click()
    await expect(page.getByRole('status')).toContainText(
      'Reviewed revenue and expenses applied',
    )
  }
  await expect(page.locator('.document-card')).toHaveCount(3)
  await route(page, 'Entity Savings')
  await expect(page.locator('.shared-inputs summary')).toContainText('$320,000')
  await page.reload()
  await route(page, 'Client files')
  await expect(page.locator('.document-card')).toHaveCount(3)
  await page
    .getByLabel('Upload financial file', { exact: true })
    .setInputFiles({
      name: 'empty.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from('Description,Amount\nNo data,\n'),
    })
  await expect(page.getByRole('alert')).toContainText('No labeled amounts')
})

test('planner, structure templates, entities, and internal payments respond to edits', async ({
  page,
}) => {
  await route(page, 'Income Tax Planner')
  await page
    .getByRole('textbox', { name: 'Annual tax estimate', exact: true })
    .fill('80000')
  await page
    .getByRole('textbox', { name: 'Expected withholding', exact: true })
    .fill('20000')
  await page
    .getByRole('textbox', {
      name: 'Estimated payments already made',
      exact: true,
    })
    .fill('10000')
  await expect(page.locator('.kpi strong').nth(1)).toHaveText('$50,000')
  await expect(page.locator('.kpi strong').nth(2)).toHaveText('$12,500')
  await route(page, 'Structure Advisor')
  for (const id of [
    's-holding',
    'direct',
    'holding',
    'assets',
    'custom',
    'property',
  ]) {
    await page
      .getByLabel('Ownership alternative', { exact: true })
      .selectOption(id)
    await expect(page.locator('.entity-node').first()).toBeVisible()
  }
  await page.getByRole('button', { name: '+ Add entity', exact: true }).click()
  await expect(page.locator('.entity-node')).toHaveCount(3)
  await page.getByRole('button', { name: '+ Add payment', exact: true }).click()
  await page
    .getByRole('textbox', { name: 'Payment 1 annual amount', exact: true })
    .fill('24000')
  await expect(
    page.getByText('Combined internal transfer effect: $0.', { exact: false }),
  ).toBeVisible()
  await page
    .getByLabel('Structure observations', { exact: true })
    .fill('Review lease pricing separately.')
  await page.reload()
  await expect(
    page.getByRole('textbox', { name: 'Payment 1 annual amount', exact: true }),
  ).toHaveValue('24,000')
  await page
    .getByLabel('Ownership alternative', { exact: true })
    .selectOption('holding')
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.getByRole('button', { name: 'Keep current structure' }).click()
  await expect(page.locator('.entity-node')).toHaveCount(3)
  await page
    .getByRole('button', { name: 'Remove payment 1', exact: true })
    .click()
  await expect(page.locator('.payment-row')).toHaveCount(0)
  await page
    .getByRole('button', { name: 'Open basic entity comparison', exact: false })
    .click()
  await expect(page.getByRole('tab', { name: 'Scenario Grid' })).toBeVisible()
})

test('report preview, real PDF download, and modal focus behavior work', async ({
  page,
}, testInfo) => {
  await page.getByRole('tab', { name: 'AI Review', exact: true }).click()
  await page
    .getByRole('textbox', { name: 'CPA observations', exact: true })
    .fill('Reviewed compensation and annual costs.')
  await page
    .getByRole('checkbox', {
      name: /Include in report.*Look beyond the tax difference/,
    })
    .uncheck()
  await page
    .getByRole('button', { name: 'Export report', exact: false })
    .click()
  const dialog = page.getByRole('dialog')
  await dialog.getByLabel('Selected AI insights', { exact: true }).check()
  await dialog
    .getByLabel('Ownership structure & payments', { exact: true })
    .check()
  await dialog.getByRole('button', { name: 'Preview report' }).click()
  await expect(page.locator('.report-preview')).toContainText(
    'Reviewed compensation and annual costs.',
  )
  for (let index = 0; index < 16; index++) {
    await page.keyboard.press('Tab')
    expect(
      await page.evaluate(
        () => document.activeElement?.closest('dialog') !== null,
      ),
    ).toBe(true)
  }
  const downloadPromise = page.waitForEvent('download')
  await dialog.getByRole('button', { name: 'Download PDF report' }).click()
  const download = await downloadPromise
  const target = testInfo.outputPath('entity-report.pdf')
  await download.saveAs(target)
  const bytes = await readFile(target)
  expect(bytes.subarray(0, 4).toString()).toBe('%PDF')
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs')
  const task = pdfjs.getDocument({ data: new Uint8Array(bytes) })
  const pdf = await task.promise
  let text = ''
  for (let index = 1; index <= pdf.numPages; index++) {
    const page = await pdf.getPage(index)
    const content = await page.getTextContent()
    text += content.items
      .map((item) => ('str' in item ? item.str : ''))
      .join(' ')
  }
  expect(text).toContain('Reviewed compensation and annual costs.')
  expect(text).toContain('Ownership structure')
  expect(text).toContain('$9,000')
  expect(text).not.toContain('Look beyond the tax difference')
  expect(text).toContain('Review the salary assumption')
  await task.destroy()
  await dialog.getByRole('button', { name: 'Close', exact: true }).click()
  await expect(
    page.getByRole('button', { name: 'Export report', exact: false }),
  ).toBeFocused()
  await page
    .getByRole('button', { name: 'Export report', exact: false })
    .click()
  await expect(
    dialog.getByLabel('Selected AI insights', { exact: true }),
  ).toBeChecked()
  await page.keyboard.press('Escape')
  await expect(dialog).not.toBeVisible()
})

test('settings preferences, real backup download, reset, and restore work', async ({
  page,
}) => {
  await route(page, 'Settings')
  await page.getByLabel('Firm name', { exact: true }).fill('Morgan Advisory')
  await page
    .getByLabel('Worksheet density', { exact: true })
    .selectOption('compact')
  await expect(page.locator('.tapreco-app')).toHaveClass(/density-compact/)
  const downloadPromise = page.waitForEvent('download')
  await page
    .getByRole('button', { name: 'Download backup', exact: true })
    .click()
  const download = await downloadPromise
  const buffer = await readFile((await download.path())!)
  await page
    .getByRole('button', { name: 'Reset local workspace', exact: true })
    .click()
  await page
    .getByRole('button', { name: 'Reset workspace', exact: true })
    .click()
  await expect(page.getByLabel('Firm name', { exact: true })).toHaveValue(
    'Your firm',
  )
  await page
    .getByLabel('Restore workspace backup', { exact: true })
    .setInputFiles({
      name: 'backup.json',
      mimeType: 'application/json',
      buffer,
    })
  await page
    .getByRole('button', { name: 'Restore workspace', exact: true })
    .click()
  await expect(page.getByLabel('Firm name', { exact: true })).toHaveValue(
    'Morgan Advisory',
  )
  await page
    .getByLabel('Restore workspace backup', { exact: true })
    .setInputFiles({
      name: 'invalid.json',
      mimeType: 'application/json',
      buffer: Buffer.from('{"version":1}'),
    })
  await expect(page.getByRole('alert')).toContainText('not a valid')
  await expect(page.getByLabel('Firm name', { exact: true })).toHaveValue(
    'Morgan Advisory',
  )
  await page.reload()
  await expect(page.getByLabel('Firm name', { exact: true })).toHaveValue(
    'Morgan Advisory',
  )
})

test('all workspace pages fit the four required viewport widths', async ({
  page,
}, testInfo) => {
  for (const width of [1440, 1024, 768, 390]) {
    await page.setViewportSize({ width, height: 900 })
    for (const [id, label] of [
      ['entity', 'Entity Savings'],
      ['overview', 'Overview'],
      ['planner', 'Income Tax Planner'],
      ['structure', 'Structure Advisor'],
      ['files', 'Client files'],
      ['settings', 'Settings'],
    ]) {
      if (width <= 800)
        await page
          .getByRole('combobox', { name: 'Workspace navigation', exact: true })
          .selectOption(id)
      else await route(page, label)
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        `${width}px ${id} page overflow`,
      ).toBe(true)
      if (id === 'entity') {
        await page.getByRole('tab', { name: 'Comparison', exact: true }).click()
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        ).toBe(true)
        await page.getByRole('tab', { name: 'AI Review', exact: true }).click()
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        ).toBe(true)
      }
      if (width === 390 || width === 1440)
        await page.screenshot({
          path: testInfo.outputPath(`${width}-${id}.png`),
          fullPage: true,
        })
    }
  }
})
