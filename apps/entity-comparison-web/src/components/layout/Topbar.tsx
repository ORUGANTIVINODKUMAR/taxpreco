import { navigation } from '../../data/tools'
import type { AppPage, IntegrationStatus } from '../../types/tools'
export function Topbar({
  page,
  onNavigate,
  integration,
}: {
  page: AppPage
  onNavigate: (page: AppPage) => void
  integration: IntegrationStatus
}) {
  return (
    <header className="topbar">
      <span>
        Workspace /{' '}
        <strong>{navigation.find((item) => item.id === page)?.label}</strong>
      </span>
      <span>{integration.identity?.mode === 'mock' ? 'Demo Advisor · Development mock' : 'Sample workspace'} · {integration.connected ? 'API connected' : 'API offline'}</span>
      <div className="mobile-navigation">
        <label className="sr-only" htmlFor="workspace-navigation">
          Workspace navigation
        </label>
        <select
          id="workspace-navigation"
          value={page}
          onChange={(event) => onNavigate(event.target.value as AppPage)}
        >
          {navigation.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>
      </div>
    </header>
  )
}
