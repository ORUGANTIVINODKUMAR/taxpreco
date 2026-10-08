import { useEffect, useState } from 'react'
import { getHealth, getMe, getTools } from './api/client'
import { getLaunchContext } from './launchContext'
import { Dashboard } from './components/dashboard/Dashboard'
import { Sidebar } from './components/layout/Sidebar'
import { Topbar } from './components/layout/Topbar'
import { PageHeader } from './components/entity-comparison/PageHeader'
import { ClientToolbar } from './components/entity-comparison/ClientToolbar'
import { EntityComparison } from './components/entity-comparison/EntityComparison'
import { ReportModal } from './components/entity-comparison/ReportModal'
import { createDemoComparison, demoClients } from './data/sampleScenarios'
import { navigation, sampleTools } from './data/tools'
import type {
  AppPage,
  IntegrationStatus,
  ToolDefinition,
} from './types/tools'
import type { EntityComparisonState } from './types/entityComparison'

import './App.css'

function initialPage(): AppPage {
  return (
    navigation.find((item) => item.id === location.hash.slice(1))?.id ??
    'dashboard'
  )
}

function App({ pending = false }: { pending?: boolean }) {
  const launchContext = getLaunchContext()

  const initialClientId =
    launchContext.clientId &&
    demoClients.some((client) => client.id === launchContext.clientId)
      ? launchContext.clientId
      : demoClients[0].id

  const initialTaxYear = launchContext.taxYear || '2026'

  const [page, setPage] = useState<AppPage>(initialPage)
  const [clientId, setClientId] = useState(initialClientId)
  const [year, setYear] = useState(initialTaxYear)
  const [comparison, setComparison] = useState(() =>
    createDemoComparison(initialClientId),
  )
  const [reportOpen, setReportOpen] = useState(false)
  const [tools, setTools] = useState<ToolDefinition[]>(sampleTools)

  const [integration, setIntegration] = useState<IntegrationStatus>({
    connected: false,
    identity: null,
    catalogSource: 'sample',
  })

  const client =
    demoClients.find((item) => item.id === clientId) ?? demoClients[0]

  useEffect(() => {
    if (pending) return
    const controller = new AbortController()

    async function connect() {
      const [health, catalog, identity] = await Promise.allSettled([
        getHealth(controller.signal),
        getTools(controller.signal),
        getMe(controller.signal),
      ])

      if (controller.signal.aborted) return

      if (catalog.status === 'fulfilled') {
        setTools(catalog.value)
      }

      setIntegration({
        connected:
          health.status === 'fulfilled' && health.value.status === 'ok',
        identity: identity.status === 'fulfilled' ? identity.value : null,
        catalogSource: catalog.status === 'fulfilled' ? 'api' : 'sample',
      })
    }

    void connect()

    return () => controller.abort()
  }, [pending])

  useEffect(() => {
    const changed = () => {
      const next =
        navigation.find((item) => item.id === location.hash.slice(1))?.id ??
        (location.hash === '' ? 'dashboard' : null)

      if (next) {
        setPage(next)
        setReportOpen(false)
      }
    }

    window.addEventListener('hashchange', changed)

    return () => window.removeEventListener('hashchange', changed)
  }, [])

  function navigate(next: AppPage) {
    setPage(next)
    location.hash = next
    setReportOpen(false)
  }

  function updateComparison(
    patch:
      | Partial<EntityComparisonState>
      | ((
          current: EntityComparisonState,
        ) => Partial<EntityComparisonState>),
  ) {
    setComparison((current) => ({
      ...current,
      ...(typeof patch === 'function' ? patch(current) : patch),
    }))
  }

  function selectClient(id: string) {
    setClientId(id)
    setComparison(createDemoComparison(id))
    setReportOpen(false)
  }

  function selectYear(next: string) {
    setYear(next)
    setComparison(createDemoComparison(clientId))
    setReportOpen(false)
  }

  return (
    <div className="tapreco-app">
      <a className="skip-link" href="#main-content">
        Skip to workspace
      </a>

      <Sidebar page={page} onNavigate={navigate} />

      <div className="workspace">
        <Topbar
          page={page}
          onNavigate={navigate}
          integration={integration}
        />

        <main className="main-content" id="main-content">
          {page === 'dashboard' && (
            <>
              <PageHeader
                title="Advisory dashboard"
                subtitle="The right tools for thoughtful client advice."
                overline="Tapreco workspace"
              />

              <Dashboard
                tools={tools}
                integration={integration}
                onNavigate={navigate}
              />
            </>
          )}

          {page === 'entity-comparison' && (
            <>
              <PageHeader onExport={() => setReportOpen(true)} />

              <ClientToolbar
                clients={demoClients}
                clientId={clientId}
                onClientChange={selectClient}
                taxYear={year}
                onYearChange={selectYear}
              />

              <EntityComparison
                key={`${clientId}:${year}`}
                period={comparison}
                onChange={updateComparison}
              />
            </>
          )}
        </main>
      </div>

      {reportOpen && (
        <ReportModal
          period={comparison}
          client={client}
          year={year}
          onSectionsChange={(selectedSections) =>
            updateComparison({ selectedSections })
          }
          onClose={() => setReportOpen(false)}
        />
      )}
    </div>
  )
}

export default App
