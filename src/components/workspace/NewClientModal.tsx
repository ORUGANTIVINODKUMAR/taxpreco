import { useState } from 'react'
import { Modal } from '../entity-comparison/Modal'
export function NewClientModal({
  onClose,
  onCreate,
}: {
  onClose: () => void
  onCreate: (business: string, owner: string) => void
}) {
  const [business, setBusiness] = useState('')
  const [owner, setOwner] = useState('')
  return (
    <Modal
      title="Create client workspace"
      titleId="new-client-title"
      onClose={onClose}
    >
      <p>
        Keep financial inputs, scenarios, documents, and notes together for each
        business and tax year.
      </p>
      <form
        onSubmit={(event) => {
          event.preventDefault()
          if (business.trim() && owner.trim())
            onCreate(business.trim(), owner.trim())
        }}
      >
        <div className="fields form-fields">
          <label htmlFor="business-name">
            Business name
            <input
              id="business-name"
              required
              maxLength={120}
              value={business}
              onChange={(event) => setBusiness(event.target.value)}
              placeholder="Business or practice name"
            />
          </label>
          <label htmlFor="owner-name">
            Owner / client name
            <input
              id="owner-name"
              required
              maxLength={120}
              value={owner}
              onChange={(event) => setOwner(event.target.value)}
              placeholder="Client name"
            />
          </label>
        </div>
        <p className="note">
          The new workspace starts with blank financial inputs and no tax
          estimates.
        </p>
        <button className="button primary-button" type="submit">
          Create client
        </button>
      </form>
    </Modal>
  )
}
