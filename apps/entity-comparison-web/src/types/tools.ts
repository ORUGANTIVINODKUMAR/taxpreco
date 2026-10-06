export type AppPage = 'dashboard' | 'entity-comparison'

export interface ToolDefinition {
  id: string
  name: string
  description: string
  enabled: boolean
  availability: 'demo'
}

export interface HealthResponse {
  status: 'ok'
  service: 'taxpreco-tools'
}

export interface IdentityResponse {
  authenticated: true
  mode: 'mock' | 'jwt'
  user: { id: string; name: string; role: string }
}

export interface IntegrationStatus {
  connected: boolean
  identity: IdentityResponse | null
  catalogSource: 'api' | 'sample'
}
