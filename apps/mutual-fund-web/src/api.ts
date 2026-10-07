const API_BASE_URL =
  import.meta.env.VITE_TOOLS_API_URL || 'http://localhost:4000'

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
  token?: string,
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {}),
      ...(options.headers || {}),
    },
  })

  if (!response.ok) {
    throw new Error(`API request failed with ${response.status}`)
  }

  return response.json()
}

export function getMutualFundSessions(
  clientId: string,
  taxYear: string,
  token: string,
) {
  const params = new URLSearchParams({
    clientId,
    taxYear,
  })

  return apiRequest(
    `/api/mutual-fund/sessions?${params.toString()}`,
    {
      method: 'GET',
    },
    token,
  )
}

export function saveMutualFundSession(
  data: {
    clientId: string
    taxYear: string
    residentState: string
    fundName: string
    amount: number
    percentage: number
    stateExempt: number
    stateTaxable: number
  },
  token: string,
) {
  return apiRequest(
    '/api/mutual-fund/sessions',
    {
      method: 'POST',
      body: JSON.stringify(data),
    },
    token,
  )
}