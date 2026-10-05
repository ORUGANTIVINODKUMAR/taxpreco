import type { EntityScenario } from '../../types/entityComparison'
import { Modal } from './Modal'
import { NumberInput } from './NumberInput'
export function TaxEstimatesModal({
  scenarios,
  onChange,
  onClose,
}: {
  scenarios: EntityScenario[]
  onChange: (id: string, patch: Partial<EntityScenario>) => void
  onClose: () => void
}) {
  return (
    <Modal
      title="Review combined tax estimates"
      titleId="tax-estimates-title"
      onClose={onClose}
    >
      <p>
        Enter combined business and owner taxes from your own analysis. The
        workspace calculates differences and benefits after costs; it does not
        calculate tax liability from income or salary.
      </p>
      <div className="estimate-list">
        {scenarios.map((scenario) => (
          <div className="estimate-item" key={scenario.id}>
            <div>
              <h3>{scenario.name}</h3>
              <span className="chip">
                {scenario.label} ·{' '}
                {scenario.taxSource === 'sample'
                  ? 'Illustrative sample'
                  : 'Advisor entered'}
              </span>
            </div>
            <label className="check-label">
              <input
                type="checkbox"
                checked={scenario.modeledTaxes !== undefined}
                onChange={(event) =>
                  onChange(scenario.id, {
                    modeledTaxes: event.target.checked ? 0 : undefined,
                    taxSource: 'entered',
                  })
                }
              />
              Use tax estimate
              <span className="sr-only">
                {' '}
                for {scenario.name} {scenario.label}
              </span>
            </label>
            {scenario.modeledTaxes !== undefined && (
              <NumberInput
                label={`${scenario.name} ${scenario.label} combined tax estimate`}
                value={scenario.modeledTaxes}
                onChange={(modeledTaxes) =>
                  onChange(scenario.id, { modeledTaxes, taxSource: 'entered' })
                }
              />
            )}
          </div>
        ))}
      </div>
      <div className="banner">
        Include applicable state taxes and entity fees in your estimate. A
        missing baseline or scenario estimate leaves the benefit comparison
        incomplete.
      </div>
      <button className="button primary-button" onClick={onClose}>
        Done reviewing estimates
      </button>
    </Modal>
  )
}
