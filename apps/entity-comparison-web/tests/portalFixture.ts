import { expect } from '@playwright/test'
import type { Page } from '@playwright/test'

// Test-only REST fixtures exercise the real Firebase SDK; no auth bypass exists in app code.
export async function installPortalFixture(page: Page) {
  const state = { uid: 'phase7-user-a', meStatus: 200, exchangeStatus: 200, meDelay: 0, exchanges: 0, checks: 0, tokenCleared: true, bearerCorrect: true, paths: [] as string[] }
  const token = () => {
    const now = Math.floor(Date.now() / 1000)
    const encode = (value: unknown) => Buffer.from(JSON.stringify(value)).toString('base64url')
    return encode({ alg: 'RS256', typ: 'JWT' }) + '.' + encode({
      aud: 'maigha-taxpro', iss: 'https://securetoken.google.com/maigha-taxpro', sub: state.uid, user_id: state.uid,
      iat: now, exp: now + 3600, auth_time: now, firebase: { sign_in_provider: 'custom' },
    }) + '.test-signature'
  }
  await page.route('https://identitytoolkit.googleapis.com/**', route => {
    const lookup = route.request().url().includes('accounts:lookup')
    return route.fulfill({ json: lookup ? { users: [{ localId: state.uid, email: 'test@example.com', emailVerified: true, providerUserInfo: [] }] }
      : { idToken: token(), refreshToken: 'fake-refresh-token', expiresIn: '3600', localId: state.uid, isNewUser: false } })
  })
  await page.route('https://securetoken.googleapis.com/**', route => route.fulfill({ json: { access_token: token(), id_token: token(), refresh_token: 'fake-refresh-token', expires_in: '3600', token_type: 'Bearer', user_id: state.uid, project_id: 'maigha-taxpro' } }))
  await page.route('http://127.0.0.1:3098/v1/auth/portal-token', async route => {
    state.exchanges++
    state.tokenCleared &&= !page.url().includes('#token=')
    expect(route.request().method()).toBe('POST')
    expect(route.request().headers().authorization).toBe('Bearer fake-handoff')
    expect(route.request().postData()).toBe(null)
    await route.fulfill({ status: state.exchangeStatus, json: state.exchangeStatus === 200 ? { customToken: 'fake-custom' } : { message: 'Test handoff rejected.' } })
  })
  await page.route('http://127.0.0.1:4099/api/**', async route => {
    const url = new URL(route.request().url())
    state.paths.push(url.pathname)
    if (url.pathname === '/api/me' || url.pathname.endsWith('/status')) {
      state.checks++
      const header = route.request().headers().authorization || ''
      try {
        const claims = JSON.parse(Buffer.from(header.slice(7).split('.')[1], 'base64url').toString())
        state.bearerCorrect &&= header.startsWith('Bearer ') && claims.sub === state.uid && claims.aud === 'maigha-taxpro'
      } catch { state.bearerCorrect = false }
      if (state.meDelay) await new Promise(resolve => setTimeout(resolve, state.meDelay))
      await route.fulfill({ status: state.meStatus, json: state.meStatus === 200
        ? { authenticated: true, mode: 'firebase', user: { id: 'local-' + state.uid, firebaseUid: state.uid, email: 'test@example.com', name: 'Test User' } }
        : { code: state.meStatus === 403 ? 'user_not_provisioned' : 'auth_unavailable', error: 'Test access denied.' } })
    } else if (url.pathname === '/api/health') await route.fulfill({ json: { status: 'ok', service: 'taxpreco-tools' } })
    else await route.fulfill({ json: [{ id: 'entity-comparison', name: 'Entity Comparison', description: 'Compare entities.', enabled: true, availability: 'demo' }] })
  })
  return state
}

export const portalLaunch = (origin: string, next?: string) => origin + '/auth/portal#token=fake-handoff' + (next ? '&next=' + encodeURIComponent(next) : '')
