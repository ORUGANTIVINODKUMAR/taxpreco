import type { AppPage, IntegrationStatus, ToolDefinition } from '../../types/tools'
import { ToolCard } from './ToolCard'

export function Dashboard({ tools, integration, onNavigate }: {
  tools: ToolDefinition[]
  integration: IntegrationStatus
  onNavigate: (page: AppPage) => void
}) {
  return (
    <>
      <div className="dashboard-intro panel">
        <div>
          <span className="overline">Entity planning</span>
          <h2>A clear starting point for your advisory work.</h2>
          <p>Review entity assumptions and prepare your client conversation.</p>
        </div>
        <span className="chip">Phase 1 · Illustrative demo</span>
      </div>
      <div className="section-heading">
        <h2>Your advisory tool</h2>
        <span className="muted">{integration.catalogSource === 'api' ? 'Connected tool catalog' : 'Sample tool catalog'}</span>
      </div>
      <div className="tool-grid">
        {tools.filter((tool) => tool.id === 'entity-comparison').map((tool) => (
          <ToolCard key={tool.id} tool={tool} onOpen={() => onNavigate('entity-comparison')} />
        ))}
      </div>
      <p className="note" role="status">
        {integration.connected ? 'API connected.' : 'API unavailable. The sample workspace remains available.'}{' '}
        {integration.identity ? 'Your Tapreco account is verified.' : 'Checking your Tapreco account.'}
      </p>
    </>
  )
}
