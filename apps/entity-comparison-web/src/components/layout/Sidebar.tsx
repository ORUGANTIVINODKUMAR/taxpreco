import { navigation } from '../../data/tools'
import type { AppPage } from '../../types/tools'
export function Sidebar({
  page,
  onNavigate,
}: {
  page: AppPage
  onNavigate: (page: AppPage) => void
}) {
  return (
    <aside className="sidebar" aria-label="Advisory workspace navigation">
      <a
        className="brand"
        href="#dashboard"
        onClick={() => onNavigate('dashboard')}
        aria-label="Tapreco dashboard"
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
        Tapreco professional tools
        <br />
        Advisory tools, connected.
      </div>
    </aside>
  )
}
