import { navigation } from '../../data/workspace'
import type { WorkspacePage } from '../../types/workspace'
export function Topbar({
  page,
  onNavigate,
  storageError,
}: {
  page: WorkspacePage
  onNavigate: (page: WorkspacePage) => void
  storageError: string
}) {
  return (
    <header className="topbar">
      <span>
        Workspace /{' '}
        <strong>{navigation.find((item) => item.id === page)?.label}</strong>
      </span>
      <span>{storageError ? 'Unsaved changes' : 'Saved in this browser'}</span>
      <div className="mobile-navigation">
        <label className="sr-only" htmlFor="workspace-navigation">
          Workspace navigation
        </label>
        <select
          id="workspace-navigation"
          value={page}
          onChange={(event) => onNavigate(event.target.value as WorkspacePage)}
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
