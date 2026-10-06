import type { ToolDefinition } from '../../types/tools'

export function ToolCard({ tool, onOpen }: { tool: ToolDefinition; onOpen: () => void }) {
  return (
    <article className="panel tool-card">
      <span className="chip">Sample workspace</span>
      <h2>{tool.name}</h2>
      <p>{tool.description}</p>
      <button className="button" disabled={!tool.enabled} onClick={onOpen}>
        {tool.enabled ? `Open ${tool.name}` : 'Unavailable'}
        {tool.enabled && <span aria-hidden="true"> →</span>}
      </button>
    </article>
  )
}
