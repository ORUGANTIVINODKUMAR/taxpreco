import { test, expect } from '@playwright/test'
import { installPortalFixture, portalLaunch } from './portalFixture'

const apps = [
  { name: 'Estimated Tax', origin: 'http://127.0.0.1:5198', heading: 'Quarterly Estimated Tax Worksheet' },
  { name: 'Audit Risk Analyzer', origin: 'http://127.0.0.1:5197', heading: 'Audit Risk Analyzer' },
  { name: 'Entity Comparison', origin: 'http://127.0.0.1:5199', heading: 'Entity Savings Calculator' },
]

for (const app of apps) {
  test(`${app.name}: portal launch, authenticated requests, refresh and account switch`, async ({ page }, testInfo) => {
    const errors: string[] = []
    page.on('pageerror', error => errors.push(error.message))
    const state = await installPortalFixture(page)
    await page.goto(portalLaunch(app.origin))
    await expect(page.locator('[inert]')).toHaveCount(0)
    await expect(page.getByRole('heading', { name: app.heading, exact: true })).toBeVisible()
    await expect(page.locator('.topbar')).toContainText(`Home / Tools / ${app.name}`)
    await expect(page.locator('.topbar').getByRole('link', { name: 'Tools', exact: true })).toHaveAttribute('href', 'http://127.0.0.1:3099/choose')
    expect(state.exchanges).toBe(1)
    expect(state.tokenCleared).toBe(true)
    expect(state.checks).toBeGreaterThan(0)
    expect(state.bearerCorrect).toBe(true)
    expect(page.url()).not.toContain('token=')
    await page.evaluate(async () => {
      const modulePath = '/src/api.ts'
      const api = await import(modulePath)
      await api.getToolStatus()
    })
    const apiId = app.name === 'Audit Risk Analyzer' ? 'audit-risk' : app.name === 'Estimated Tax' ? 'estimated-tax' : 'entity-comparison'
    expect(state.paths).toContain(`/api/tools/${apiId}/status`)
    if (app.name === 'Entity Comparison') expect(new URL(page.url()).hash).toBe('#entity-comparison')
    await page.screenshot({ path: testInfo.outputPath('workspace.png'), fullPage: true })
    await page.reload()
    await expect(page.locator('[inert]')).toHaveCount(0)
    await expect(page.getByRole('heading', { name: app.heading, exact: true })).toBeVisible()
    expect(state.exchanges).toBe(1)
    state.uid = 'phase7-user-b'
    await page.goto(portalLaunch(app.origin))
    await expect(page.locator('[inert]')).toHaveCount(0)
    await expect(page.getByRole('heading', { name: app.heading, exact: true })).toBeVisible()
    expect(state.exchanges).toBe(2)
    expect(state.bearerCorrect).toBe(true)
    expect(errors).toEqual([])
  })

  test(`${app.name}: calculator remains visible but inert during provisioning`, async ({ page }) => {
    const state = await installPortalFixture(page)
    state.meDelay = 1500
    await page.goto(portalLaunch(app.origin))
    await expect(page.locator('[inert]')).toHaveCount(1)
    await expect(page.locator('.portal-session-status')).toContainText(`Loading ${app.name}`)
    await expect(page.locator('.topbar')).toBeVisible()
    await expect(page.locator('[inert]')).toHaveCount(0)
    await expect(page.getByRole('heading', { name: app.heading, exact: true })).toBeVisible()
  })

  test(`${app.name}: unprovisioned user cannot enter the workspace`, async ({ page }) => {
    const state = await installPortalFixture(page)
    state.meStatus = 403
    await page.goto(portalLaunch(app.origin))
    await expect(page.getByRole('alert')).toContainText('Your account is not provisioned')
    await expect(page.locator('.topbar')).toHaveCount(0)
    expect(state.bearerCorrect).toBe(true)
  })

  test(`${app.name}: missing receive token does not reuse an existing session`, async ({ page }) => {
    const state = await installPortalFixture(page)
    await page.goto(portalLaunch(app.origin))
    await expect(page.locator('[inert]')).toHaveCount(0)
    await page.goto(app.origin + '/auth/portal')
    await expect(page.getByRole('alert')).toContainText('No Tapreco login token was received')
    await expect(page.locator('.topbar')).toHaveCount(0)
    expect(state.exchanges).toBe(1)
  })

  test(`${app.name}: failed new handoff cannot fall back to the previous user`, async ({ page }) => {
    const state = await installPortalFixture(page)
    await page.goto(portalLaunch(app.origin))
    await expect(page.locator('[inert]')).toHaveCount(0)
    state.exchangeStatus = 403
    await page.goto(portalLaunch(app.origin))
    await expect(page.getByRole('alert')).toContainText('Test handoff rejected')
    await expect(page.locator('.topbar')).toHaveCount(0)
    expect(page.url()).not.toContain('token=')
  })
}
