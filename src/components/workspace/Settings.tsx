import { useRef, useState } from 'react'
import type { WorkspaceStore } from '../../types/workspace'
import { validateStore } from '../../utils/storage'
import { downloadFile } from '../../utils/download'
import { Modal } from '../entity-comparison/Modal'
export function Settings({
  store,
  onChange,
  onReset,
}: {
  store: WorkspaceStore
  onChange: (value: WorkspaceStore) => void
  onReset: () => void
}) {
  const input = useRef<HTMLInputElement>(null)
  const [error, setError] = useState('')
  const [pendingRestore, setPendingRestore] = useState<WorkspaceStore | null>(
    null,
  )
  const [resetOpen, setResetOpen] = useState(false)
  const [message, setMessage] = useState('')
  async function readBackup(file: File) {
    setError('')
    setMessage('')
    try {
      if (file.size > 15 * 1024 * 1024)
        throw new Error('Choose a backup smaller than 15 MB.')
      const data: unknown = JSON.parse(await file.text())
      if (!validateStore(data))
        throw new Error('This file is not a valid Tapreco workspace backup.')
      setPendingRestore(data)
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'The backup could not be read.',
      )
    } finally {
      if (input.current) input.current.value = ''
    }
  }
  return (
    <>
      <div className="panel">
        <h2>Firm & workspace preferences</h2>
        <p>
          Preferences save automatically in this browser and appear in exported
          reports.
        </p>
        <div className="fields form-fields">
          <label htmlFor="firm-name">
            Firm name
            <input
              id="firm-name"
              maxLength={120}
              value={store.settings.firmName}
              onChange={(event) =>
                onChange({
                  ...store,
                  settings: { ...store.settings, firmName: event.target.value },
                })
              }
            />
          </label>
          <div className="select-field">
            <label htmlFor="worksheet-density">Worksheet density</label>
            <select
              id="worksheet-density"
              value={store.settings.density}
              onChange={(event) =>
                onChange({
                  ...store,
                  settings: {
                    ...store.settings,
                    density: event.target.value as 'comfortable' | 'compact',
                  },
                })
              }
            >
              <option value="comfortable">Comfortable</option>
              <option value="compact">Compact</option>
            </select>
          </div>
        </div>
      </div>
      <div className="panel">
        <h2>Workspace backup</h2>
        <p>
          Your clients, planning years, extracted financial rows, estimates, and
          notes are stored in this browser. Download a backup to move them to
          another device or protect them before clearing browser data.
        </p>
        <div className="button-row">
          <button
            className="button primary-button"
            onClick={() => {
              downloadFile(
                JSON.stringify(store, null, 2),
                'tapreco-workspace-backup.json',
                'application/json',
              )
              setMessage('Workspace backup downloaded.')
            }}
          >
            Download backup
          </button>
          <button className="button" onClick={() => input.current?.click()}>
            Restore backup
          </button>
        </div>
        <input
          ref={input}
          className="sr-only"
          aria-label="Restore workspace backup"
          type="file"
          accept=".json"
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (file) void readBackup(file)
          }}
        />
        {error && (
          <p className="error-message" role="alert">
            {error}
          </p>
        )}
        {message && (
          <p className="note" role="status">
            {message}
          </p>
        )}
      </div>
      <div className="panel">
        <h2>Start over</h2>
        <p>
          Restore the original illustrative client and remove saved work from
          this browser. Download a backup first if you want to keep it.
        </p>
        <button
          className="button review-button"
          onClick={() => setResetOpen(true)}
        >
          Reset local workspace
        </button>
      </div>
      {pendingRestore && (
        <Modal
          title="Restore workspace backup?"
          titleId="restore-title"
          onClose={() => setPendingRestore(null)}
        >
          <p>
            This backup contains {pendingRestore.clients.length} clients.
            Restoring replaces the current browser workspace.
          </p>
          <div className="button-row">
            <button className="button" onClick={() => setPendingRestore(null)}>
              Cancel restore
            </button>
            <button
              className="button primary-button"
              onClick={() => {
                onChange(pendingRestore)
                setPendingRestore(null)
                setMessage('Workspace restored successfully.')
              }}
            >
              Restore workspace
            </button>
          </div>
        </Modal>
      )}
      {resetOpen && (
        <Modal
          title="Reset local workspace?"
          titleId="reset-title"
          onClose={() => setResetOpen(false)}
        >
          <p>
            Saved client data, financial reviews, and notes will be replaced by
            the original sample. You can restore them from a downloaded backup.
          </p>
          <div className="button-row">
            <button className="button" onClick={() => setResetOpen(false)}>
              Keep my workspace
            </button>
            <button
              className="button primary-button"
              onClick={() => {
                onReset()
                setResetOpen(false)
                setMessage('Original sample workspace restored.')
              }}
            >
              Reset workspace
            </button>
          </div>
        </Modal>
      )}
    </>
  )
}
