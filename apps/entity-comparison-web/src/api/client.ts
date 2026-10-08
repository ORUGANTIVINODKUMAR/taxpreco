import type { HealthResponse, IdentityResponse, ToolDefinition } from '../types/tools'
import { apiRequest, getMe as getLocalUser } from '../api'

const baseUrl = (import.meta.env.VITE_TOOLS_API_URL || 'http://localhost:4000').replace(/\/$/, '')
async function publicGet<T>(path: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(baseUrl + '/api/' + path, { signal })
  if (!response.ok) throw new Error('The tools API is unavailable.')
  return response.json() as Promise<T>
}
export const getHealth = (signal?: AbortSignal) => publicGet<HealthResponse>('health', signal)
export const getTools = (signal?: AbortSignal) => publicGet<ToolDefinition[]>('tools', signal)
export const getMe = async (signal?: AbortSignal): Promise<IdentityResponse> => ({ authenticated: true, mode: 'firebase', user: await getLocalUser(signal) })
export const getEntityStatus = (signal?: AbortSignal) => apiRequest('/api/tools/entity-comparison/status', { signal })
