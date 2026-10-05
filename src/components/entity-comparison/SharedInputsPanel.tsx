import type { SharedBusinessInputs } from '../../types/entityComparison'
import { money } from '../../utils/format'
import { NumberInput } from './NumberInput'
export function SharedInputsPanel({
  inputs,
  onChange,
}: {
  inputs: SharedBusinessInputs
  onChange: (patch: Partial<SharedBusinessInputs>) => void
}) {
  return (
    <details className="panel shared-inputs">
      <summary>
        <strong>Shared client & business inputs</strong>
        <span>
          Annual business profit{' '}
          <strong>{money(inputs.revenue - inputs.operatingExpenses)}</strong>
          <span className="disclosure-chevron" aria-hidden="true">
            ⌄
          </span>
        </span>
      </summary>
      <div className="fields">
        <NumberInput
          label="Annual revenue"
          value={inputs.revenue}
          onChange={(revenue) => onChange({ revenue })}
        />
        <NumberInput
          label="Operating expenses"
          value={inputs.operatingExpenses}
          onChange={(operatingExpenses) => onChange({ operatingExpenses })}
        />
        <div className="select-field">
          <label htmlFor="filing-status">Filing status</label>
          <select
            id="filing-status"
            value={inputs.filingStatus}
            onChange={(event) => onChange({ filingStatus: event.target.value })}
          >
            {[
              'Married filing jointly',
              'Single',
              'Married filing separately',
              'Head of household',
              'Qualifying surviving spouse',
            ].map((status) => (
              <option key={status}>{status}</option>
            ))}
          </select>
        </div>
        <label htmlFor="resident-state">
          Resident state
          <input
            id="resident-state"
            type="text"
            value={inputs.residentState}
            onChange={(event) =>
              onChange({ residentState: event.target.value })
            }
          />
        </label>
        <NumberInput
          label="Other household wages"
          value={inputs.otherHouseholdWages}
          onChange={(otherHouseholdWages) => onChange({ otherHouseholdWages })}
        />
        <NumberInput
          label="Ownership percentage"
          percentage
          max={100}
          value={inputs.ownershipPercentage}
          onChange={(ownershipPercentage) => onChange({ ownershipPercentage })}
        />
      </div>
    </details>
  )
}
