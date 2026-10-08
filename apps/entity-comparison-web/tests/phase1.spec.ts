import { test, expect } from '@playwright/test'
import type { Page } from '@playwright/test'
import { installPortalFixture, portalLaunch } from './portalFixture'

const browserErrors = new WeakMap<Page, string[]>()
const openEntity = (page: Page) => page.getByRole('button', { name: 'Open Entity Comparison', exact: false }).click()

test.beforeEach(async ({ page }) => {
  const errors: string[] = []
  browserErrors.set(page, errors)
  page.on('pageerror', (error) => errors.push(error.message))
  await installPortalFixture(page)
  await page.goto(portalLaunch('http://127.0.0.1:5199', '/#dashboard'))
  await expect(page.locator('[inert]')).toHaveCount(0)
  await expect(page.getByRole('heading', { name: 'Advisory dashboard', exact: true })).toBeVisible()
})
test.afterEach(async ({ page }) => { expect(browserErrors.get(page)).toEqual([]) })

test('authenticated dashboard uses the shared API and offers only Entity Comparison', async ({ page }) => {
  await expect(page.locator('.topbar')).toContainText('API connected')
  await expect(page.getByText('Connected tool catalog', { exact: true })).toBeVisible()
  await expect(page.locator('.topbar')).toContainText('Tapreco workspace')
  await expect(page.getByText('Your Tapreco account is verified.', { exact: false })).toBeVisible()
  await expect(page.locator('.tool-card')).toHaveCount(1)
  await expect(page.getByRole('navigation', { name: 'Workspace', exact: true }).getByRole('link')).toHaveCount(2)
  await openEntity(page)
  await expect(page.getByRole('heading', { name: 'Entity Savings Calculator', exact: true })).toBeVisible()
  await page.getByRole('link', { name: 'Skip to workspace', exact: true }).focus()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('heading', { name: 'Entity Savings Calculator', exact: true })).toBeVisible()
  await page.goBack()
  await page.goBack()
  await expect(page.getByRole('heading', { name: 'Advisory dashboard', exact: true })).toBeVisible()
  await page.goForward()
  await expect(page.getByRole('heading', { name: 'Entity Savings Calculator', exact: true })).toBeVisible()
})

test('scenario assumptions and entered estimates update benefits; refresh resets the demo', async ({ page }) => {
  await openEntity(page)
  await expect(page.getByText('Illustrative figures', { exact: true })).toBeVisible()
  await expect(page.getByRole('columnheader')).toHaveCount(4)
  await page.getByText('Shared client & business inputs', { exact: true }).click()
  await page.getByRole('textbox', { name: 'Annual revenue', exact: true }).fill('500000')
  await expect(page.locator('.shared-inputs summary')).toContainText('$350,000')
  await page.getByRole('textbox', { name: 'S corporation Alternative 1 administration costs', exact: true }).fill('5000')
  await page.getByRole('tab', { name: 'Comparison', exact: true }).click()
  await expect(page.locator('.kpi strong').nth(1)).toHaveText('$7,000')
  await page.getByRole('button', { name: 'Edit tax estimates', exact: true }).click()
  await page.getByRole('dialog').getByRole('textbox', { name: 'S corporation Alternative 1 combined tax estimate', exact: true }).fill('55000')
  await page.getByRole('button', { name: 'Done reviewing estimates' }).click()
  await expect(page.locator('.kpi strong').nth(1)).toHaveText('$10,000')
  await expect(page.locator('.kpi strong').nth(2)).toHaveText('$8,500')
  await page.getByRole('combobox', { name: 'Compare', exact: true }).selectOption('sample-c')
  await expect(page.locator('.kpi strong').nth(1)).toHaveText('-$9,000')
  await page.reload()
  await page.getByRole('tab', { name: 'Comparison', exact: true }).click()
  await expect(page.locator('.kpi strong').nth(1)).toHaveText('$9,000')
  await page.getByRole('combobox', { name: 'CLIENT', exact: true }).selectOption('acme')
  await page.getByText('Shared client & business inputs', { exact: true }).click()
  await expect(page.getByRole('textbox', { name: 'Annual revenue', exact: true })).toHaveValue('300,000')
  await page.getByRole('textbox', { name: 'Annual revenue', exact: true }).fill('350000')
  await page.getByRole('combobox', { name: 'TAX YEAR', exact: true }).selectOption('2027')
  await page.getByText('Shared client & business inputs', { exact: true }).click()
  await expect(page.getByRole('textbox', { name: 'Annual revenue', exact: true })).toHaveValue('300,000')
})

test('tabs, rule-based review, report selection and accessible modal behavior work', async ({ page }) => {
  await openEntity(page)
  await page.getByRole('tab', { name: 'Scenario Grid', exact: true }).focus()
  await page.keyboard.press('ArrowRight')
  await expect(page.getByRole('tab', { selected: true })).toHaveText('Comparison')
  await expect(page.locator('.bar-row')).toHaveCount(3)
  await page.getByRole('tab', { name: 'AI Review', exact: true }).click()
  await expect(page.locator('.insights article')).toHaveCount(4)
  await page.getByLabel('CPA observations', { exact: true }).fill('Review compensation separately.')
  await page.getByRole('checkbox', { name: /Include in report.*Look beyond the tax difference/ }).uncheck()
  await page.getByRole('button', { name: 'Export report', exact: false }).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toContainText('PDF download is deferred')
  await dialog.getByLabel('Selected AI insights', { exact: true }).check()
  await dialog.getByRole('button', { name: 'Preview report', exact: true }).click()
  await expect(page.locator('.report-preview')).toContainText('Review compensation separately.')
  await expect(page.locator('.report-preview')).not.toContainText('Look beyond the tax difference')
  for (let index = 0; index < 15; index++) {
    await page.keyboard.press('Tab')
    expect(await page.evaluate(() => Boolean(document.activeElement?.closest('dialog')))).toBe(true)
  }
  await page.keyboard.press('Escape')
  await expect(dialog).not.toBeVisible()
  await expect(page.getByRole('button', { name: 'Export report', exact: false })).toBeFocused()
})

test('sample catalog remains usable when public catalog is unavailable after account verification', async ({ page }) => {
  await page.route('http://127.0.0.1:4099/api/{health,tools}', (route) => route.fulfill({ status: 503, contentType: 'application/json', body: '{"error":"unavailable"}', headers: { 'Access-Control-Allow-Origin': 'http://127.0.0.1:5199' } }))
  await page.reload()
  await expect(page.getByText('Sample tool catalog', { exact: true })).toBeVisible()
  await expect(page.locator('.topbar')).toContainText('API offline')
  await openEntity(page)
  await expect(page.getByRole('tab', { name: 'Scenario Grid', exact: true })).toBeVisible()
})

test('dashboard, tool tabs and report fit desktop, laptop, tablet and mobile', async ({ page }, testInfo) => {
  for (const width of [1440, 1024, 768, 390]) {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/#dashboard')
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    if (width === 1440 || width === 390) await page.screenshot({ path: testInfo.outputPath(`${width}-dashboard.png`), fullPage: true })
    await openEntity(page)
    if (width > 800) await expect(page.locator('.sidebar')).toBeVisible()
    else await expect(page.getByRole('combobox', { name: 'Workspace navigation', exact: true })).toBeVisible()
    for (const tab of ['Scenario Grid', 'Comparison', 'AI Review']) {
      await page.getByRole('tab', { name: tab, exact: true }).click()
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${width} ${tab} overflow`).toBe(true)
      if (width === 1440 || width === 390) await page.screenshot({ path: testInfo.outputPath(`${width}-${tab.replaceAll(' ', '-')}.png`), fullPage: true })
    }
    await page.getByRole('button', { name: 'Export report', exact: false }).click()
    await page.getByRole('button', { name: 'Preview report', exact: true }).click()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    await page.keyboard.press('Escape')
    if (width <= 800) {
      await page.getByRole('combobox', { name: 'Workspace navigation', exact: true }).selectOption('dashboard')
      await expect(page.getByRole('heading', { name: 'Advisory dashboard', exact: true })).toBeVisible()
    }
  }
})
