import { structureTemplates, createStructure } from '../../data/workspace'
import type { StructurePlan } from '../../types/workspace'
import { NumberInput } from '../entity-comparison/NumberInput'
import { money } from '../../utils/format'
import { useState } from 'react'
import { Modal } from '../entity-comparison/Modal'
export function StructureAdvisor({
  structure,
  onChange,
  onCompare,
}: {
  structure: StructurePlan
  onChange: (value: StructurePlan) => void
  onCompare: () => void
}) {
  const [pendingTemplate, setPendingTemplate] = useState('')
  const template =
    structureTemplates.find((item) => item.id === structure.templateId) ??
    structureTemplates[0]
  const hierarchical = ['holding', 's-holding', 'direct'].includes(
    structure.templateId,
  )
  const changeTemplate = (id: string) => {
    if (
      structure.payments.length ||
      structure.notes ||
      structure.entities.some(
        (entity, index) => entity.name !== template.entities[index],
      ) ||
      structure.ownershipPercentage !== 100
    )
      setPendingTemplate(id)
    else onChange(createStructure(id, structure.ownerName))
  }
  return (
    <>
      <div className="panel">
        <h2>Structure template</h2>
        <label className="picker-label" htmlFor="structure-template">
          Ownership alternative
        </label>
        <select
          id="structure-template"
          className="picker-select"
          value={structure.templateId}
          onChange={(event) => changeTemplate(event.target.value)}
        >
          {structureTemplates.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
        <p>{template.guidance}</p>
      </div>
      <div className="panel">
        <div className="section-heading">
          <h2>Ownership diagram</h2>
          <span className="chip">Planning structure</span>
        </div>
        <div className="fields form-fields">
          <label htmlFor="structure-owner">
            Owner / shareholder
            <input
              id="structure-owner"
              maxLength={120}
              value={structure.ownerName}
              onChange={(event) =>
                onChange({ ...structure, ownerName: event.target.value })
              }
            />
          </label>
          <NumberInput
            label="Ownership percentage"
            percentage
            max={100}
            value={structure.ownershipPercentage}
            onChange={(ownershipPercentage) =>
              onChange({ ...structure, ownershipPercentage })
            }
          />
        </div>
        <div className="ownership-diagram" aria-label="Ownership structure">
          <div className="owner-node">
            <strong>{structure.ownerName || 'Owner'}</strong>
            <span>{structure.ownershipPercentage}% ownership assumption</span>
          </div>
          <div className="diagram-connector" aria-hidden="true">
            ↓
          </div>
          <p className="diagram-label">
            {hierarchical
              ? 'Owner → holding entity → subsidiary entities'
              : 'Separately owned entities · ' + template.relationship}
          </p>
          <div
            className={`entity-nodes ${hierarchical ? 'hierarchical-nodes' : ''}`}
          >
            {structure.entities.map((entity, index) => (
              <div
                className={`entity-node ${hierarchical && index === 0 ? 'parent-entity' : ''}`}
                key={entity.id}
              >
                <label htmlFor={`structure-entity-${entity.id}`}>
                  Entity {index + 1}
                  <input
                    id={`structure-entity-${entity.id}`}
                    maxLength={120}
                    value={entity.name}
                    onChange={(event) =>
                      onChange({
                        ...structure,
                        entities: structure.entities.map((item) =>
                          item.id === entity.id
                            ? { ...item, name: event.target.value }
                            : item,
                        ),
                      })
                    }
                  />
                </label>
                <span>
                  {hierarchical
                    ? index === 0
                      ? 'Owned by the shareholder / owner'
                      : `Held by ${structure.entities[0].name}`
                    : entity.entityType}
                </span>
                {structure.entities.length > 1 && (
                  <button
                    className="text-button"
                    onClick={() =>
                      onChange({
                        ...structure,
                        entities: structure.entities.filter(
                          (item) => item.id !== entity.id,
                        ),
                        payments: structure.payments.filter(
                          (payment) =>
                            payment.from !== entity.id &&
                            payment.to !== entity.id,
                        ),
                      })
                    }
                    aria-label={`Remove structure entity ${index + 1}`}
                  >
                    Remove entity
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
        <button
          className="button"
          disabled={structure.entities.length >= 20}
          onClick={() =>
            onChange({
              ...structure,
              entities: [
                ...structure.entities,
                {
                  id: crypto.randomUUID(),
                  name: `Entity ${structure.entities.length + 1}`,
                  entityType: 'Additional entity',
                },
              ],
            })
          }
        >
          + Add entity
        </button>
      </div>
      <div className="panel">
        <div className="section-heading">
          <h2>Intercompany payments</h2>
          <button
            className="button"
            disabled={structure.entities.length < 2}
            onClick={() =>
              onChange({
                ...structure,
                payments: [
                  ...structure.payments,
                  {
                    id: crypto.randomUUID(),
                    from: structure.entities[0].id,
                    to: structure.entities[1].id,
                    amount: 0,
                    description: 'Lease or service payment',
                  },
                ],
              })
            }
          >
            + Add payment
          </button>
        </div>
        <p>
          Record each transfer once. The same amount is paid by one entity and
          received by the other, so its combined transfer effect is $0 before
          external costs and taxes.
        </p>
        {!structure.payments.length && (
          <div className="empty-state">
            <h3>No internal payments recorded</h3>
            <p>
              Add a lease, license, or service payment to document its direction
              and amount.
            </p>
          </div>
        )}
        {structure.payments.map((payment, index) => (
          <div className="payment-row" key={payment.id}>
            <label htmlFor={`from-${payment.id}`}>
              Paid by
              <select
                id={`from-${payment.id}`}
                value={payment.from}
                onChange={(event) =>
                  onChange({
                    ...structure,
                    payments: structure.payments.map((item) =>
                      item.id === payment.id
                        ? {
                            ...item,
                            from: event.target.value,
                            to:
                              item.to === event.target.value
                                ? structure.entities.find(
                                    (entity) =>
                                      entity.id !== event.target.value,
                                  )!.id
                                : item.to,
                          }
                        : item,
                    ),
                  })
                }
              >
                {structure.entities.map((entity) => (
                  <option key={entity.id} value={entity.id}>
                    {entity.name}
                  </option>
                ))}
              </select>
            </label>
            <label htmlFor={`to-${payment.id}`}>
              Received by
              <select
                id={`to-${payment.id}`}
                value={payment.to}
                onChange={(event) =>
                  onChange({
                    ...structure,
                    payments: structure.payments.map((item) =>
                      item.id === payment.id
                        ? { ...item, to: event.target.value }
                        : item,
                    ),
                  })
                }
              >
                {structure.entities
                  .filter((entity) => entity.id !== payment.from)
                  .map((entity) => (
                    <option key={entity.id} value={entity.id}>
                      {entity.name}
                    </option>
                  ))}
              </select>
            </label>
            <NumberInput
              label={`Payment ${index + 1} annual amount`}
              value={payment.amount}
              onChange={(amount) =>
                onChange({
                  ...structure,
                  payments: structure.payments.map((item) =>
                    item.id === payment.id ? { ...item, amount } : item,
                  ),
                })
              }
            />
            <button
              className="button"
              aria-label={`Remove payment ${index + 1}`}
              onClick={() =>
                onChange({
                  ...structure,
                  payments: structure.payments.filter(
                    (item) => item.id !== payment.id,
                  ),
                })
              }
            >
              Remove
            </button>
          </div>
        ))}
        {structure.payments.length > 0 && (
          <div className="banner">
            Internal transfers:{' '}
            {money(
              structure.payments.reduce(
                (sum, payment) => sum + payment.amount,
                0,
              ),
            )}{' '}
            paid and received. Combined internal transfer effect: $0.
          </div>
        )}
      </div>
      <div className="panel">
        <h2>
          <label htmlFor="structure-notes">Structure observations</label>
        </h2>
        <textarea
          id="structure-notes"
          rows={3}
          value={structure.notes}
          onChange={(event) =>
            onChange({ ...structure, notes: event.target.value })
          }
          placeholder="Record ownership, exit considerations, and items requiring professional review…"
        />
        <p className="note">
          Annual operating taxes, exit taxes, and QSBS eligibility are not
          calculated. Ownership diagrams represent planning assumptions.
        </p>
        <button className="button" onClick={onCompare}>
          Open basic entity comparison →
        </button>
      </div>
      {pendingTemplate && (
        <Modal
          title="Replace structure template?"
          titleId="replace-structure-title"
          onClose={() => setPendingTemplate('')}
        >
          <p>
            Changing the template replaces the current entities, payments, and
            structure notes. Your basic entity scenarios remain saved.
          </p>
          <div className="button-row">
            <button className="button" onClick={() => setPendingTemplate('')}>
              Keep current structure
            </button>
            <button
              className="button primary-button"
              onClick={() => {
                onChange(createStructure(pendingTemplate, structure.ownerName))
                setPendingTemplate('')
              }}
            >
              Replace template
            </button>
          </div>
        </Modal>
      )}
    </>
  )
}
