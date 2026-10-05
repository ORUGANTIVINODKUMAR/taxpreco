import type {
  Client,
  PlanningWorkspace,
  WorkspacePage,
} from '../../types/workspace'
import { money } from '../../utils/format'
import { comparisonResult } from '../../utils/comparison'
export function Overview({
  client,
  period,
  year,
  onNavigate,
  onNewClient,
  clients,
  onSelectClient,
}: {
  client: Client
  period: PlanningWorkspace
  year: string
  onNavigate: (page: WorkspacePage) => void
  onNewClient: () => void
  clients: Client[]
  onSelectClient: (id: string) => void
}) {
  const results = period.scenarios
    .slice(1)
    .map((scenario) => ({
      scenario,
      result: comparisonResult(scenario, period.scenarios[0]),
    }))
    .filter((item) => item.result !== undefined)
    .sort((a, b) => b.result!.annualBenefit - a.result!.annualBenefit)
  return (
    <>
      <div className="banner">
        {client.businessName} · {year} planning workspace. Tax figures are
        illustrative or advisor-entered estimates.
      </div>
      <div className="kpis">
        <article className="kpi">
          <h2>Annual business profit</h2>
          <strong>
            {money(period.inputs.revenue - period.inputs.operatingExpenses)}
          </strong>
          <p>Revenue less operating expenses</p>
        </article>
        <article className="kpi">
          <h2>Entity scenarios</h2>
          <strong>{period.scenarios.length}</strong>
          <p>
            {
              period.scenarios.filter((s) => s.modeledTaxes !== undefined)
                .length
            }{' '}
            with tax estimates
          </p>
        </article>
        <article className="kpi">
          <h2>Largest annual net benefit</h2>
          <strong>
            {results[0] ? money(results[0].result!.annualBenefit) : '—'}
          </strong>
          <p>
            {results[0]?.scenario.name ??
              'Complete the tax estimates to compare'}
          </p>
        </article>
      </div>
      <div className="workspace-grid">
        {[
          {
            page: 'entity' as const,
            title: 'Compare entity scenarios',
            text: 'Review salary, costs, retirement assumptions, and estimated annual benefits.',
            action: 'Open Entity Savings',
          },
          {
            page: 'planner' as const,
            title: 'Plan your tax cash flow',
            text: 'Record an annual estimate and reconcile withholding and payments.',
            action: 'Open Income Tax Planner',
          },
          {
            page: 'files' as const,
            title: 'Review financial inputs',
            text: `${period.documents.length} financial documents in this tax year. Extract and review amounts before applying them.`,
            action: 'Open client files',
          },
          {
            page: 'structure' as const,
            title: 'Explore ownership structures',
            text: 'Document entity relationships and intercompany payments in a separate planning view.',
            action: 'Open Structure Advisor',
          },
        ].map((item) => (
          <article className="panel action-card" key={item.page}>
            <h2>{item.title}</h2>
            <p>{item.text}</p>
            <button className="button" onClick={() => onNavigate(item.page)}>
              {item.action} →
            </button>
          </article>
        ))}
      </div>
      <div className="section-heading">
        <h2>Client workspaces</h2>
        <button className="button" onClick={onNewClient}>
          + New client
        </button>
      </div>
      <div className="client-list">
        {clients.map((item) => (
          <button
            key={item.id}
            className={`client-card ${item.id === client.id ? 'selected' : ''}`}
            onClick={() => {
              onSelectClient(item.id)
              onNavigate('entity')
            }}
          >
            <strong>{item.businessName}</strong>
            <span>{item.ownerName}</span>
            <span className="muted">
              {Object.keys(item.periods).length} planning{' '}
              {Object.keys(item.periods).length === 1 ? 'year' : 'years'} · Open
              workspace →
            </span>
          </button>
        ))}
      </div>
    </>
  )
}
