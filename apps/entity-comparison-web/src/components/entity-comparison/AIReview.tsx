import { reviewInsights } from '../../utils/comparison'
import type { EntityScenario } from '../../types/entityComparison'
interface Props {
  selectedInsights: string[]
  onToggleInsight: (id: string) => void
  observations: string
  onObservationsChange: (value: string) => void
  scenario: EntityScenario
  baseline: EntityScenario
}
export function AIReview({
  selectedInsights,
  onToggleInsight,
  observations,
  onObservationsChange,
  scenario,
  baseline,
}: Props) {
  const insights = reviewInsights(scenario, baseline)
  return (
    <>
      <div className="banner">
        Assumption review · {scenario.name} vs. {baseline.name}. Generated from
        entered figures; no AI service is connected.
      </div>
      <div className="insights">
        {insights.map((insight) => (
          <article key={insight.id}>
            <span className="overline">{insight.category}</span>
            <h2>{insight.title}</h2>
            <p>{insight.text}</p>
            <label htmlFor={`insight-${insight.id}`}>
              <input
                id={`insight-${insight.id}`}
                type="checkbox"
                checked={selectedInsights.includes(insight.id)}
                onChange={() => onToggleInsight(insight.id)}
              />{' '}
              Include in report
              <span className="sr-only">: {insight.title}</span>
            </label>
          </article>
        ))}
      </div>
      <div className="observations">
        <h2>
          <label htmlFor="cpa-observations">CPA observations</label>
        </h2>
        <textarea
          id="cpa-observations"
          rows={3}
          value={observations}
          onChange={(event) => onObservationsChange(event.target.value)}
          placeholder="Add your conclusion or edit the points to share with the client…"
        />
      </div>
    </>
  )
}
