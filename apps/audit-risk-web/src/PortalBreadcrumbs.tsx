export default function PortalBreadcrumbs() {
  const portal = import.meta.env.VITE_PORTAL_URL
  return <span className="portal-breadcrumbs" role="navigation" aria-label="Breadcrumb"><a href={portal}>Home</a> / <a href={portal ? portal.replace(/\/$/, '') + '/choose' : undefined}>Tools</a> / <strong>Audit Risk Analyzer</strong></span>
}
