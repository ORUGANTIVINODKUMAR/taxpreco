import type { HealthResponse, IdentityResponse, ToolDefinition } from '../types/tools'

// Empty base uses the Vite /api proxy locally or a same-origin production API.
const baseUrl = (
  import.meta.env.VITE_TOOLS_API_URL ?? 'http://localhost:4000'
).replace(/\/$/, '')

async function get<T>(path: string, signal?: AbortSignal, accessToken?: string): Promise<T> {
  const response = await fetch(`${baseUrl}/api/${path}`, {
    signal,
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
  })
  if (!response.ok) throw new Error(`Integration API returned ${response.status}`)
  return response.json() as Promise<T>
}

export const getHealth = (signal?: AbortSignal) => get<HealthResponse>('health', signal)
export const getTools = (signal?: AbortSignal) => get<ToolDefinition[]>('tools', signal)

// Alpha's host can pass an access token here once server verification is implemented.
// Tokens are never persisted, decoded as trusted claims, or issued by this frontend.
export const getMe = (accessToken?: string, signal?: AbortSignal) =>
  get<IdentityResponse>('me', signal, accessToken)
