import { useEffect, useState } from 'react'
import { Sidebar } from './components/layout/Sidebar'
import { Topbar } from './components/layout/Topbar'
import { PageHeader } from './components/entity-comparison/PageHeader'
import { ClientToolbar } from './components/entity-comparison/ClientToolbar'
import { EntityWorkspace } from './components/entity-comparison/EntityWorkspace'
import { ReportModal } from './components/entity-comparison/ReportModal'
import { Overview } from './components/workspace/Overview'
import { IncomeTaxPlanner } from './components/workspace/IncomeTaxPlanner'
import { StructureAdvisor } from './components/workspace/StructureAdvisor'
import { ClientFiles } from './components/workspace/ClientFiles'
import { Settings } from './components/workspace/Settings'
import { NewClientModal } from './components/workspace/NewClientModal'
import { useWorkspace } from './hooks/useWorkspace'
import { createStore, navigation } from './data/workspace'
import type { WorkspacePage } from './types/workspace'
import './App.css'
const titles: Record<WorkspacePage, { title: string; subtitle: string }> = {
  entity: {
    title: 'Entity Savings Calculator',
    subtitle: 'Compare the tax impact. See what stays with the owner.',
  },
  overview: {
    title: 'Advisory workspace',
    subtitle: 'A clear view of your clients, assumptions, and next steps.',
  },
  planner: {
    title: 'Income Tax Planner',
    subtitle:
      'Bring your estimate, withholding, and planned payments together.',
  },
  structure: {
    title: 'Structure Advisor',
    subtitle:
      'Map ownership. Document relationships. Review the whole picture.',
  },
  files: {
    title: 'Client files',
    subtitle: 'Turn financial statements into reviewed planning inputs.',
  },
  settings: {
    title: 'Workspace settings',
    subtitle: 'Make the workspace yours and keep your work backed up.',
  },
}
function initialPage(): WorkspacePage {
  return (
    navigation.find((item) => item.id === location.hash.slice(1))?.id ??
    'entity'
  )
}
function App() {
  const workspace = useWorkspace()
  const { store, client, period, updatePeriod } = workspace
  const [page, setPage] = useState<WorkspacePage>(initialPage)
  const [reportOpen, setReportOpen] = useState(false)
  const [newClientOpen, setNewClientOpen] = useState(false)
  const [notice, setNotice] = useState('')
  useEffect(() => {
    const changed = () => {
      const next = navigation.find((item) => item.id === location.hash.slice(1))
      if (next) setPage(next.id)
    }
    window.addEventListener('hashchange', changed)
    return () => window.removeEventListener('hashchange', changed)
  }, [])
  function navigate(next: WorkspacePage) {
    setPage(next)
    location.hash = next
    setNotice('')
  }
  return (
    <div className={`tapreco-app density-${store.settings.density}`}>
      <a className="skip-link" href="#main-content">
        Skip to workspace
      </a>
      <Sidebar
        page={page}
        onNavigate={navigate}
        firmName={store.settings.firmName || 'Your firm'}
      />
      <div className="workspace">
        <Topbar
          page={page}
          onNavigate={navigate}
          storageError={workspace.storageError}
        />
        <main className="main-content" id="main-content">
          <PageHeader
            {...titles[page]}
            overline={
              page === 'settings'
                ? 'Workspace preferences'
                : 'Business planning'
            }
            onExport={
              page === 'settings' ? undefined : () => setReportOpen(true)
            }
          />
          <ClientToolbar
            clients={store.clients}
            clientId={client.id}
            onClientChange={workspace.selectClient}
            taxYear={store.taxYear}
            onYearChange={workspace.selectYear}
            onNewClient={() => setNewClientOpen(true)}
          />
          {workspace.storageError && (
            <div className="error-message" role="alert">
              {workspace.storageError}
            </div>
          )}
          {notice && (
            <div className="banner" role="status">
              {notice}
            </div>
          )}
          <div key={`${client.id}:${store.taxYear}`}>
            {page === 'entity' && (
              <EntityWorkspace period={period} onChange={updatePeriod} />
            )}
            {page === 'overview' && (
              <Overview
                client={client}
                period={period}
                year={store.taxYear}
                onNavigate={navigate}
                onNewClient={() => setNewClientOpen(true)}
                clients={store.clients}
                onSelectClient={workspace.selectClient}
              />
            )}
            {page === 'planner' && (
              <IncomeTaxPlanner
                period={period}
                onChange={(planner) => updatePeriod({ planner })}
                onNavigate={() => navigate('entity')}
              />
            )}
            {page === 'structure' && (
              <StructureAdvisor
                structure={period.structure}
                onChange={(structure) => updatePeriod({ structure })}
                onCompare={() => navigate('entity')}
              />
            )}
            {page === 'files' && (
              <ClientFiles
                period={period}
                onDocumentsChange={(documents) => updatePeriod({ documents })}
                onManual={() => navigate('entity')}
                onApply={(revenue, operatingExpenses, document) => {
                  updatePeriod({
                    inputs: { ...period.inputs, revenue, operatingExpenses },
                    documents: period.documents.map((item) =>
                      item.id === document.id ? document : item,
                    ),
                    assumptionsEdited: true,
                  })
                  setNotice(
                    'Reviewed revenue and expenses applied to the shared business inputs. All entity scenarios use the updated business profit.',
                  )
                }}
              />
            )}
            {page === 'settings' && (
              <Settings
                store={store}
                onChange={workspace.setStore}
                onReset={() => workspace.setStore(createStore())}
              />
            )}
          </div>
        </main>
      </div>
      {newClientOpen && (
        <NewClientModal
          onClose={() => setNewClientOpen(false)}
          onCreate={(business, owner) => {
            workspace.addClient(business, owner)
            setNewClientOpen(false)
            navigate('entity')
          }}
        />
      )}
      {reportOpen && (
        <ReportModal
          period={period}
          client={client}
          year={store.taxYear}
          firmName={store.settings.firmName}
          onSectionsChange={(selectedSections) =>
            updatePeriod({ selectedSections })
          }
          onClose={() => setReportOpen(false)}
        />
      )}
    </div>
  )
}
export default App
