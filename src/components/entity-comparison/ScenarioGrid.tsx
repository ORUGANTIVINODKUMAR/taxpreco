import { useState } from 'react'
import type {
  EntityScenario,
  EntityType,
  SharedBusinessInputs,
} from '../../types/entityComparison'
import { entityTypes } from '../../data/sampleScenarios'
import { SharedInputsPanel } from './SharedInputsPanel'
import { ScenarioTable } from './ScenarioTable'
import { NotesPanel } from './NotesPanel'
import { Modal } from './Modal'
interface Props {
  inputs: SharedBusinessInputs
  onInputsChange: (patch: Partial<SharedBusinessInputs>) => void
  scenarios: EntityScenario[]
  onScenarioChange: (id: string, patch: Partial<EntityScenario>) => void
  onAdd: (type: EntityType) => void
  onRemove: (id: string) => void
  notes: string
  onNotesChange: (value: string) => void
  onCompare: () => void
  onEditTaxes: () => void
}
export function ScenarioGrid(props: Props) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const [entityType, setEntityType] = useState<EntityType>('partnership')
  return (
    <>
      <SharedInputsPanel
        inputs={props.inputs}
        onChange={props.onInputsChange}
      />
      <div className="table-heading">
        <h2>Entity scenarios</h2>
        <div className="button-row">
          <button className="button" onClick={props.onEditTaxes}>
            Edit tax estimates
          </button>
          <button
            className="button"
            disabled={props.scenarios.length >= 30}
            onClick={() => setPickerOpen(true)}
          >
            + Add scenario
          </button>
        </div>
      </div>
      <ScenarioTable
        scenarios={props.scenarios}
        profit={props.inputs.revenue - props.inputs.operatingExpenses}
        onChange={props.onScenarioChange}
        onRemove={props.onRemove}
      />
      <div className="table-footer">
        <span>
          Editable assumptions · Calculated results shown separately
          <br />
          <span className="sample-caption">
            Benefits update from your tax estimates and entered costs.
          </span>
        </span>
        <button className="button" onClick={props.onCompare}>
          View comparison <span aria-hidden="true">→</span>
        </button>
      </div>
      <NotesPanel notes={props.notes} onChange={props.onNotesChange} />
      {pickerOpen && (
        <Modal
          title="Add entity scenario"
          titleId="scenario-title"
          onClose={() => setPickerOpen(false)}
        >
          <p>Reuse the shared financial inputs with another tax treatment.</p>
          <label className="picker-label" htmlFor="entity-type">
            Tax treatment
          </label>
          <select
            id="entity-type"
            className="picker-select"
            value={entityType}
            onChange={(event) =>
              setEntityType(event.target.value as EntityType)
            }
          >
            {entityTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
          <div className="banner">
            New scenarios reuse the shared financial inputs. Enter an
            advisor-prepared tax estimate to compare benefits.
          </div>
          <button
            className="button primary-button"
            onClick={() => {
              props.onAdd(entityType)
              setPickerOpen(false)
            }}
          >
            Add scenario
          </button>
        </Modal>
      )}
    </>
  )
}
