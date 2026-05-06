/**
 * Output by Antigravity IDE
 * Google Elevation API samples — call only from a trusted backend (Cloud Run / Functions).
 * Browser CORS blocks direct calls; wire this module in a server route and pass results to the client.
 */
export type ElevationSample = { lat: number; lng: number; elevationM: number }

export async function fetchElevationPathFromBackend(
  _path: { lat: number; lng: number }[],
  _backendUrl: string
): Promise<ElevationSample[]> {
  void _path
  void _backendUrl
  throw new Error(
    'Implement POST /elevation on Cloud Run that calls Google Elevation API with your server key.'
  )
}
