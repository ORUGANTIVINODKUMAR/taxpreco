import { useId, useState } from 'react'
interface Props {
  label: string
  value: number
  onChange: (value: number) => void
  max?: number
  percentage?: boolean
  compact?: boolean
}
export function NumberInput({
  label,
  value,
  onChange,
  max,
  percentage = false,
  compact = false,
}: Props) {
  const id = useId()
  const [focused, setFocused] = useState(false)
  const [draft, setDraft] = useState('')
  return (
    <label
      className={compact ? 'number-field compact' : 'number-field'}
      htmlFor={id}
    >
      <span className={compact ? 'sr-only' : 'field-label'}>{label}</span>
      <span
        className={`number-control ${percentage ? 'percentage-control' : !compact ? 'currency-control' : ''}`}
      >
        {!percentage && !compact && (
          <span className="currency-unit" aria-hidden="true">
            $
          </span>
        )}
        {percentage && (
          <span className="input-unit" aria-hidden="true">
            %
          </span>
        )}
        <input
          id={id}
          type="text"
          inputMode="decimal"
          value={
            focused
              ? draft
              : value.toLocaleString('en-US', { maximumFractionDigits: 2 })
          }
          onFocus={() => {
            setDraft(
              value.toLocaleString('en-US', { maximumFractionDigits: 2 }),
            )
            setFocused(true)
          }}
          onBlur={() => setFocused(false)}
          onChange={(event) => {
            const raw = event.target.value.replace(/[$,%\s]/g, '')
            if (!/^\d*(\.\d{0,2})?$/.test(raw)) return
            const number = raw === '' || raw === '.' ? 0 : Number(raw)
            if (!Number.isFinite(number) || (max !== undefined && number > max))
              return
            setDraft(event.target.value)
            onChange(number)
          }}
        />
      </span>
    </label>
  )
}
