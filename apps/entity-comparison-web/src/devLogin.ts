export const devAutoLoginEnabled = import.meta.env.DEV && import.meta.env.VITE_DEV_AUTO_LOGIN === 'true'

export async function developmentCustomToken(): Promise<string> {
  const response = await fetch('/__dev-auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{}',
    signal: AbortSignal.timeout(20_000),
  })
  const data = await response.json().catch(() => null)
  if (!response.ok || typeof data?.customToken !== 'string' || !data.customToken) {
    throw new Error('Development sign-in failed. Check the tools-api, configured test user and development settings.')
  }
  return data.customToken
}
