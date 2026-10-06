import { demoTaxYears } from '../../data/sampleScenarios'

export function ClientToolbar({
  taxYear,
  onYearChange,
  clients,
  clientId,
  onClientChange,
}: {
  taxYear: string
  onYearChange: (year: string) => void
  clients: { id: string; businessName: string; ownerName: string }[]
  clientId: string
  onClientChange: (id: string) => void
}) {
  return (
    <div className="toolbar">
      <div className="toolbar-field">
        <label htmlFor="client">CLIENT</label>
        <select
          id="client"
          value={clientId}
          onChange={(event) => onClientChange(event.target.value)}
        >
          {clients.map((client) => (
            <option key={client.id} value={client.id}>
              {client.businessName} · {client.ownerName}
            </option>
          ))}
        </select>
      </div>
      <div className="toolbar-field">
        <label htmlFor="tax-year">TAX YEAR</label>
        <select
          id="tax-year"
          value={taxYear}
          onChange={(event) => onYearChange(event.target.value)}
        >
          {demoTaxYears.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </div>
      <span className="chip">Illustrative figures</span>
      <span className="toolbar-note">Sample clients · selection changes reset demo edits</span>
    </div>
  )
}
