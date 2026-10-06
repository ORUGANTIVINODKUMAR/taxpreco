import type { AppPage, ToolDefinition } from '../types/tools'

export const navigation: { id: AppPage; label: string }[] = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'entity-comparison', label: 'Entity Comparison' },
]

// Fallback catalog keeps the demo usable when the integration API is offline.
export const sampleTools: ToolDefinition[] = [
  {
    id: 'entity-comparison',
    name: 'Entity Comparison',
    description: 'Compare entity assumptions, illustrative tax estimates, and benefits after costs.',
    enabled: true,
    availability: 'demo',
  },
]
