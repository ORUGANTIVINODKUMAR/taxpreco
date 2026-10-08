export type PortalHandoffResult =
  | { status: 'received'; next: string }
  | { status: 'error'; message: string }

export type PortalHandoffConfig = {
  apiUrl?: string
  portalUrl?: string
}

type BrowserBoundary = {
  location: Pick<Location, 'pathname' | 'search' | 'hash' | 'origin'>
  history: Pick<History, 'state' | 'replaceState'>
  fetch: typeof globalThis.fetch
}

function configuredOrigin(value?: string): string | null {
  try {
    const url = new URL(value || '')
    if (
      !['http:', 'https:'].includes(url.protocol) ||
      url.username || url.password || url.search || url.hash ||
      url.pathname !== '/'
    ) return null
    return url.origin
  } catch {
    return null
  }
}

export function portalLoginUrl(portalUrl?: string): string | null {
  const origin = configuredOrigin(portalUrl)
  if (!origin) return null
  const url = new URL('/login', origin)
  url.searchParams.set('app', 'mutual-fund')
  return url.toString()
}

export function sanitizeNext(value: string | null, origin: string): string {
  if (!value) return '/'
  try {
    // Check encoded forms too, since routers can decode a path after navigation.
    let decoded = value
    for (let i = 0; i < 3; i += 1) {
      if (
        !decoded.startsWith('/') || decoded.startsWith('//') ||
        decoded.includes('://') || decoded.includes('\\') ||
        Array.from(decoded).some((character) => {
          const code = character.charCodeAt(0)
          return code <= 0x20 || code === 0x7f
        })
      ) return '/'
      const expanded = decodeURIComponent(decoded)
      if (expanded === decoded) break
      decoded = expanded
    }
    const resolved = new URL(value, origin)
    const decodedPath = new URL(decoded, origin).pathname.replace(/\/+$/, '')
    if (
      resolved.origin !== origin ||
      decodedPath === '/auth/portal' ||
      resolved.pathname.replace(/\/+$/, '') === '/auth/portal'
    ) return '/'
    return resolved.pathname + resolved.search + resolved.hash
  } catch {
    return '/'
  }
}

function preservedContext(search: string): string {
  const input = new URLSearchParams(search)
  const output = new URLSearchParams()
  for (const key of ['clientId', 'taxYear']) {
    const value = input.get(key)
    if (value !== null) output.set(key, value)
  }
  const query = output.toString()
  return query ? '?' + query : ''
}

export function receivePortalHandoff(
  browser: BrowserBoundary,
  config: PortalHandoffConfig,
  timeoutMs = 20_000,
  completeSignIn?: (customToken: string) => Promise<void>,
): Promise<PortalHandoffResult> {
  const params = new URLSearchParams(browser.location.hash.replace(/^#/, ''))
  let token: string | null = params.get('token')
  const next = sanitizeNext(params.get('next'), browser.location.origin)

  // This happens synchronously, before rendering or starting any network request.
  browser.history.replaceState(
    browser.history.state,
    '',
    browser.location.pathname + preservedContext(browser.location.search),
  )

  if (!token?.trim()) {
    return Promise.resolve({
      status: 'error',
      message: 'No Tapreco login token was received. Open Mutual Fund from Tapreco.',
    })
  }

  const apiOrigin = configuredOrigin(config.apiUrl)
  if (!apiOrigin || !portalLoginUrl(config.portalUrl)) {
    token = null
    return Promise.resolve({
      status: 'error',
      message: 'The Tapreco connection is not configured. Please contact support.',
    })
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  return (async (): Promise<PortalHandoffResult> => {
    try {
      const response = await browser.fetch(apiOrigin + '/v1/auth/portal-token', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + token },
        signal: controller.signal,
      })
      const body: unknown = await response.json().catch(() => null)
      const data = body && typeof body === 'object'
        ? body as Record<string, unknown>
        : null

      if (!response.ok) {
        const serverMessage = typeof data?.message === 'string'
          ? data.message.replaceAll(token || '', '[redacted]').slice(0, 300).trim()
          : ''
        return {
          status: 'error',
          message: serverMessage || 'Tapreco could not accept this login. Please open Mutual Fund from Tapreco again.',
        }
      }
      if (typeof data?.customToken !== 'string' || !data.customToken.trim()) {
        return {
          status: 'error',
          message: 'Tapreco returned an incomplete login response. Please try again.',
        }
      }
      clearTimeout(timeout)
      token = null
      if (completeSignIn) {
        try { await completeSignIn(data.customToken) }
        catch {
          return { status: 'error', message: 'Unable to establish a persistent Firebase session. Please open Mutual Fund from Tapreco again.' }
        }
      }
      return { status: 'received', next }
    } catch {
      return {
        status: 'error',
        message: controller.signal.aborted
          ? 'Tapreco took too long to respond. Please try opening Mutual Fund again.'
          : 'Unable to contact Tapreco. Please check your connection and try again.',
      }
    } finally {
      token = null
      clearTimeout(timeout)
    }
  })()
}
