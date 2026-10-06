import { Router } from 'express'

export const toolsRouter = Router()
// Phase 1 catalog metadata, not authorization grants.
toolsRouter.get('/tools', (_request, response) => {
  response.json([
    {
      id: 'entity-comparison', name: 'Entity Comparison', enabled: true,
      description: 'Compare entity assumptions, illustrative tax estimates, and benefits after costs.',
      availability: 'demo',
    },
  ])
})
