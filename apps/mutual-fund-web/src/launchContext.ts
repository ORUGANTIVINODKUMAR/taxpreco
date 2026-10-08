export type LaunchContext = {
  clientId: string | null
  taxYear: string | null
}

export function getLaunchContext(): LaunchContext {
  const params = new URLSearchParams(window.location.search)

  return {
    clientId: params.get('clientId'),
    taxYear: params.get('taxYear'),
  }
}

export function contextError(clientId: string, taxYear: string): string | null {
  if (!clientId.trim() || clientId !== clientId.trim() || clientId.length > 128 || Array.from(clientId).some(c => c.charCodeAt(0) < 32 || c.charCodeAt(0) === 127)) return 'Enter a Client ID of at most 128 characters without surrounding whitespace.'
  if (!/^\d{4}$/.test(taxYear) || Number(taxYear) < 1900 || Number(taxYear) > 2100) return 'Enter a tax year from 1900 to 2100.'
  return null
}
