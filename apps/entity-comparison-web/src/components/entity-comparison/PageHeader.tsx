export function PageHeader({
  onExport,
  title = 'Entity Savings Calculator',
  subtitle = 'Compare the tax impact. See what stays with the owner.',
  overline = 'Business planning',
}: {
  onExport?: () => void
  title?: string
  subtitle?: string
  overline?: string
}) {
  return (
    <div className="page-heading">
      <div>
        <div className="overline">{overline}</div>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      {onExport && (
        <button className="button primary-button" onClick={onExport}>
          Export report <span aria-hidden="true">↗</span>
        </button>
      )}
    </div>
  )
}
