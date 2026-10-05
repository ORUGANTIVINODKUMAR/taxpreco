import { useEffect, useRef, useState } from 'react'
import type { ClientDocument, PlanningWorkspace } from '../../types/workspace'
import { readFinancialFile } from '../../utils/financialImport'
import { money } from '../../utils/format'
import { downloadFile } from '../../utils/download'
import { Modal } from '../entity-comparison/Modal'
import { NumberInput } from '../entity-comparison/NumberInput'
interface Props {
  period: PlanningWorkspace
  onDocumentsChange: (documents: ClientDocument[]) => void
  onApply: (
    revenue: number,
    operatingExpenses: number,
    document: ClientDocument,
  ) => void
  onManual: () => void
}
export function ClientFiles({
  period,
  onDocumentsChange,
  onApply,
  onManual,
}: Props) {
  const input = useRef<HTMLInputElement>(null)
  const operation = useRef(0)
  useEffect(
    () => () => {
      operation.current++
    },
    [],
  )
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [review, setReview] = useState<ClientDocument | null>(null)
  const [revenue, setRevenue] = useState(0)
  const [expenses, setExpenses] = useState(0)
  const [revenueMapped, setRevenueMapped] = useState(false)
  const [expensesMapped, setExpensesMapped] = useState(false)
  const [revenueRow, setRevenueRow] = useState('')
  const [expenseRow, setExpenseRow] = useState('')
  const [filter, setFilter] = useState('')
  const [removeId, setRemoveId] = useState('')
  function openReview(document: ClientDocument) {
    setReview(document)
    setRevenue(period.inputs.revenue)
    setExpenses(period.inputs.operatingExpenses)
    setRevenueRow('')
    setExpenseRow('')
    setRevenueMapped(false)
    setExpensesMapped(false)
    setFilter('')
  }
  async function upload(file: File) {
    const token = ++operation.current
    setBusy(true)
    setError('')
    try {
      const rows = await readFinancialFile(file)
      if (token !== operation.current) return
      const document: ClientDocument = {
        id: crypto.randomUUID(),
        name: file.name,
        addedAt: new Date().toISOString(),
        rows,
        applied: false,
      }
      onDocumentsChange([...period.documents, document])
      openReview(document)
    } catch (error) {
      if (token !== operation.current) return
      setError(
        error instanceof Error
          ? error.message
          : 'The file could not be read. Try another file or enter amounts manually.',
      )
    } finally {
      if (token === operation.current) {
        setBusy(false)
        if (input.current) input.current.value = ''
      }
    }
  }
  return (
    <>
      <div className="panel upload-panel">
        <div className="overline">Financial inputs</div>
        <h2>Bring your financials into the comparison</h2>
        <p>
          Read labeled amounts from a PDF, Excel workbook, or CSV. Review and
          map the correct totals before applying them to the shared inputs.
        </p>
        <div className="button-row">
          <button
            className="button primary-button"
            disabled={busy || period.documents.length >= 100}
            onClick={() => input.current?.click()}
          >
            {busy ? 'Reading financial file…' : 'Upload financial file'}
          </button>
          <button className="button" onClick={onManual}>
            Enter amounts manually →
          </button>
          <button
            className="text-button"
            onClick={() =>
              downloadFile(
                'Description,Amount\nAnnual revenue,400000\nOperating expenses,150000\nNet profit,250000\n',
                'tapreco-financial-template.csv',
                'text/csv',
              )
            }
          >
            Download CSV template
          </button>
        </div>
        <input
          ref={input}
          className="sr-only"
          type="file"
          accept=".pdf,.xlsx,.csv"
          aria-label="Upload financial file"
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (file) void upload(file)
          }}
        />
        <p className="note">
          Text-based PDF, .xlsx, or CSV · up to 15 MB. Files are read on this
          device. Only extracted rows and review status are saved; original
          files are not retained.
        </p>
        {error && (
          <div className="error-message" role="alert">
            {error}
          </div>
        )}
      </div>
      <div className="section-heading">
        <h2>Client financial files</h2>
        <span className="chip">{period.documents.length} documents</span>
      </div>
      {!period.documents.length ? (
        <div className="panel empty-state">
          <h3>Your financial review starts here</h3>
          <p>
            Upload a P&L or financial statement, or start with manual entry.
            Applied inputs are reused across all basic scenarios.
          </p>
        </div>
      ) : (
        <div className="document-list">
          {period.documents.map((document) => (
            <article className="panel document-card" key={document.id}>
              <div>
                <h3>{document.name}</h3>
                <p>
                  {document.rows.length} extracted amounts ·{' '}
                  {new Date(document.addedAt).toLocaleDateString('en-IN', {
                    timeZone: 'Asia/Kolkata',
                  })}
                </p>
                <span className="chip">
                  {document.applied
                    ? 'Applied to shared inputs'
                    : 'Ready for review'}
                </span>
              </div>
              <div className="button-row">
                <button className="button" onClick={() => openReview(document)}>
                  Review amounts
                </button>
                <button
                  className="text-button"
                  onClick={() => setRemoveId(document.id)}
                  aria-label={`Remove file ${document.name}`}
                >
                  Remove
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
      {review && (
        <Modal
          title="Review & map financial amounts"
          titleId="financial-review-title"
          onClose={() => setReview(null)}
        >
          <p>
            {review.name}. Select a source amount or enter a corrected total.
            Applying replaces the revenue and expenses for this client and tax
            year.
          </p>
          <div className="fields form-fields">
            <div className="select-field">
              <label htmlFor="revenue-source">Revenue source</label>
              <select
                id="revenue-source"
                value={revenueRow}
                onChange={(event) => {
                  setRevenueRow(event.target.value)
                  if (event.target.value) {
                    setRevenue(
                      Math.abs(review.rows[Number(event.target.value)].amount),
                    )
                    setRevenueMapped(true)
                  }
                }}
              >
                {<option value="">Choose an extracted amount</option>}
                {review.rows.map((row, index) => (
                  <option key={index} value={index}>
                    {row.label} · {money(row.amount)}
                  </option>
                ))}
              </select>
            </div>
            <div className="select-field">
              <label htmlFor="expense-source">Expense source</label>
              <select
                id="expense-source"
                value={expenseRow}
                onChange={(event) => {
                  setExpenseRow(event.target.value)
                  if (event.target.value) {
                    setExpenses(
                      Math.abs(review.rows[Number(event.target.value)].amount),
                    )
                    setExpensesMapped(true)
                  }
                }}
              >
                <option value="">Choose an extracted amount</option>
                {review.rows.map((row, index) => (
                  <option key={index} value={index}>
                    {row.label} · {money(row.amount)}
                  </option>
                ))}
              </select>
            </div>
            <NumberInput
              label="Reviewed annual revenue"
              value={revenue}
              onChange={(value) => {
                setRevenue(value)
                setRevenueMapped(true)
              }}
            />
            <NumberInput
              label="Reviewed operating expenses"
              value={expenses}
              onChange={(value) => {
                setExpenses(value)
                setExpensesMapped(true)
              }}
            />
          </div>
          <div className="banner">
            Reviewed net profit: <strong>{money(revenue - expenses)}</strong>.
            Review both totals before applying. Negative source totals are shown
            as positive input amounts; confirm the sign convention.
          </div>
          <label className="picker-label" htmlFor="financial-filter">
            Search extracted rows
          </label>
          <input
            className="standalone-input"
            id="financial-filter"
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            placeholder="Search revenue, expenses, profit…"
          />
          <div className="extracted-rows">
            {review.rows
              .filter((row) =>
                row.label.toLowerCase().includes(filter.toLowerCase()),
              )
              .slice(0, 100)
              .map((row, index) => (
                <div key={index}>
                  <span>{row.label}</span>
                  <strong>{money(row.amount)}</strong>
                </div>
              ))}
          </div>
          <p className="note">
            Showing up to 100 matching rows. Source selectors include every
            extracted amount. Nothing is applied automatically.
          </p>
          <button
            className="button primary-button"
            disabled={
              !revenueMapped ||
              !expensesMapped ||
              (revenueRow !== '' && revenueRow === expenseRow)
            }
            onClick={() => {
              onApply(revenue, expenses, { ...review, applied: true })
              setReview(null)
            }}
          >
            Apply reviewed amounts
          </button>
        </Modal>
      )}
      {removeId && (
        <Modal
          title="Remove financial review?"
          titleId="remove-file-title"
          onClose={() => setRemoveId('')}
        >
          <p>
            This removes the saved extracted rows for this file. Previously
            applied business inputs stay in your workspace.
          </p>
          <div className="button-row">
            <button className="button" onClick={() => setRemoveId('')}>
              Keep file
            </button>
            <button
              className="button primary-button"
              onClick={() => {
                onDocumentsChange(
                  period.documents.filter(
                    (document) => document.id !== removeId,
                  ),
                )
                setRemoveId('')
              }}
            >
              Remove file
            </button>
          </div>
        </Modal>
      )}
    </>
  )
}
