export function NotesPanel({
  notes,
  onChange,
}: {
  notes: string
  onChange: (notes: string) => void
}) {
  return (
    <details className="notes-panel">
      <summary>
        Notes & assumptions{' '}
        <span className="disclosure-chevron" aria-hidden="true">
          ⌄
        </span>
      </summary>
      <label className="sr-only" htmlFor="scenario-notes">
        Scenario notes
      </label>
      <textarea
        id="scenario-notes"
        rows={3}
        value={notes}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Record compensation assumptions, additional costs, or items to review…"
      />
    </details>
  )
}
