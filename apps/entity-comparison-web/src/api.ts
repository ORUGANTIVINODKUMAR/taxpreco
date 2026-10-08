import { getCurrentIdToken, session } from './firebaseAuth'

const API_BASE_URL = import.meta.env.VITE_TOOLS_API_URL || 'http://localhost:4000'
export class ApiError extends Error {
  status: number
  code: string
  constructor(status: number, code: string, message: string) { super(message); this.status = status; this.code = code }
}
export type LocalUser = { id: string; firebaseUid: string; email: string | null; name: string }
export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const identity = session.snapshot()
  if (identity.status !== 'provision-pending') throw new Error('Please sign in from Tapreco.')
  const token = await getCurrentIdToken()
  const headers = new Headers(options.headers)
  headers.set('Authorization', `Bearer ${token}`)
  if (options.body) headers.set('Content-Type', 'application/json')
  let response: Response
  try { response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers }) }
  catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    throw new Error('Unable to reach the tools API. Please check your connection and retry.', { cause: error })
  }
  const body = await response.json().catch(() => null)
  const current = session.snapshot()
  if (current.status !== 'provision-pending' || current.uid !== identity.uid) throw new Error('The signed-in user changed. Please retry.')
  if (!response.ok) {
    if (response.status === 401 || body?.code === 'user_not_provisioned') {
      await session.reject(body?.code === 'user_not_provisioned'
        ? 'Your account is not provisioned. Please contact your administrator.'
        : 'Your login could not be verified. Please open Entity Comparison from Tapreco again.')
    }
    throw new ApiError(response.status, typeof body?.code === 'string' ? body.code : 'request_failed', typeof body?.error === 'string' ? body.error : 'The request failed. Please try again.')
  }
  if (body === null) throw new Error('The API returned an incomplete response.')
  return body as T
}
export async function getMe(signal?: AbortSignal) {
  const body = await apiRequest<{ authenticated: boolean; user: LocalUser }>('/api/me', { signal })
  const identity = session.snapshot()
  if (!body.authenticated || !body.user?.id || identity.status !== 'provision-pending' || body.user.firebaseUid !== identity.uid) throw new Error('The API returned an unexpected user identity.')
  return body.user
}

// Tool status uses the authenticated shared API.
export const getToolStatus = (signal?: AbortSignal) => apiRequest('/api/tools/entity-comparison/status', { signal })
