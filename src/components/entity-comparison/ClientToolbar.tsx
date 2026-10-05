export function ClientToolbar({
  taxYear,
  onYearChange,
  clients,
  clientId,
  onClientChange,
  onNewClient,
}: {
  taxYear: string
  onYearChange: (year: string) => void
  clients: { id: string; businessName: string; ownerName: string }[]
  clientId: string
  onClientChange: (id: string) => void
  onNewClient: () => void
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
          {Array.from(
            new Set([
              '2026',
              '2025',
              '2027',
              '2024',
              '2028',
              '2029',
              '2030',
              taxYear,
            ]),
          ).map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </div>
      <span className="chip">Illustrative figures</span>
      <button className="button" onClick={onNewClient}>
        + New client
      </button>
    </div>
  )
}
