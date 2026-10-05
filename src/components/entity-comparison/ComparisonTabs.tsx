import type { KeyboardEvent } from 'react'
import type { View } from '../../types/entityComparison'
const tabs: { value: View; label: string }[] = [
  { value: 'grid', label: 'Scenario Grid' },
  { value: 'comparison', label: 'Comparison' },
  { value: 'ai', label: 'AI Review' },
]
export function ComparisonTabs({
  view,
  onChange,
}: {
  view: View
  onChange: (view: View) => void
}) {
  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let next: number
    if (event.key === 'ArrowRight') next = (index + 1) % tabs.length
    else if (event.key === 'ArrowLeft')
      next = (index + tabs.length - 1) % tabs.length
    else if (event.key === 'Home') next = 0
    else if (event.key === 'End') next = tabs.length - 1
    else return
    event.preventDefault()
    onChange(tabs[next].value)
    document.getElementById(`tab-${tabs[next].value}`)?.focus()
  }
  return (
    <nav className="tabs" role="tablist" aria-label="Calculator views">
      {tabs.map((tab, index) => (
        <button
          key={tab.value}
          id={`tab-${tab.value}`}
          role="tab"
          aria-selected={view === tab.value}
          aria-controls={`panel-${tab.value}`}
          tabIndex={view === tab.value ? 0 : -1}
          onKeyDown={(event) => onKeyDown(event, index)}
          onClick={() => onChange(tab.value)}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  )
}
