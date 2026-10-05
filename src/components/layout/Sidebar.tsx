import { navigation } from '../../data/workspace'
import type { WorkspacePage } from '../../types/workspace'
export function Sidebar({
  page,
  onNavigate,
  firmName,
}: {
  page: WorkspacePage
  onNavigate: (page: WorkspacePage) => void
  firmName: string
}) {
  return (
    <aside className="sidebar" aria-label="Advisory workspace navigation">
      <a
        className="brand"
        href="#overview"
        onClick={() => onNavigate('overview')}
        aria-label="Tapreco overview"
      >
        <span className="brand-mark" aria-hidden="true">
          t
        </span>
        tapreco
      </a>
      <div className="sidebar-label">Advisory workspace</div>
      <nav aria-label="Workspace">
        {navigation.map((item) => (
          <a
            key={item.id}
            className={`nav-item ${page === item.id ? 'active' : ''}`}
            href={`#${item.id}`}
            onClick={() => onNavigate(item.id)}
            aria-current={page === item.id ? 'page' : undefined}
          >
            {item.label}
          </a>
        ))}
      </nav>
      <div className="sidebar-footer">
        {firmName}
        <br />
        Advisory tools, connected.
      </div>
    </aside>
  )
}
