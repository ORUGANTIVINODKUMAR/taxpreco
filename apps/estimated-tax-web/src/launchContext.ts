export type LaunchContext = {
  clientId: string | null
  taxYear: string | null
}

export function getLaunchContext(): LaunchContext {
  const params = new URLSearchParams(window.location.search)

  return {
    clientId: params.get('clientId'),
    taxYear: params.get('taxYear'),
  }
}