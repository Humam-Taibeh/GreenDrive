/**
 * routeElevation — real route ascent from the free Open-Meteo Elevation API
 * (Copernicus 90 m DEM). No API key.
 *
 * Flow: resample the route polyline into evenly spaced points (by distance), request
 * their elevations in one call, then sum the positive elevation changes.
 *
 * HONESTY: this module never invents a number. On any failure it returns
 * `{ ok: false }` and callers must tell the user elevation is unavailable.
 * The result is an ESTIMATE: sampling every ~400 m can under-count short rolling
 * hills, and a small dead-band filters out DEM noise.
 */

export interface PathPoint {
  lat: number
  lng: number
}

export type AscentFailure = 'quota' | 'denied' | 'timeout' | 'no-data' | 'error'

export type AscentResult =
  | { ok: true; ascentM: number; samples: number }
  | { ok: false; reason: AscentFailure }

/** Target spacing between samples along the route. */
export const METERS_PER_SAMPLE = 400
export const MIN_SAMPLES = 16
/** Open-Meteo accepts at most 100 coordinates per request. */
export const MAX_SAMPLES = 90
/** Rises/falls smaller than this (metres) are ignored — DEM noise would inflate the sum. */
export const NOISE_DEADBAND_M = 3

const REQUEST_TIMEOUT_MS = 8_000

const cache = new Map<string, { ascentM: number; samples: number }>()

function haversineM(a: PathPoint, b: PathPoint): number {
  const R = 6_371_000
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)))
}

export function pathLengthM(path: PathPoint[]): number {
  let total = 0
  for (let i = 1; i < path.length; i++) total += haversineM(path[i - 1]!, path[i]!)
  return total
}

export function sampleCountFor(lengthM: number): number {
  return Math.min(MAX_SAMPLES, Math.max(MIN_SAMPLES, Math.ceil(lengthM / METERS_PER_SAMPLE) + 1))
}

/** `count` points evenly spaced by distance along `path`, endpoints included. */
export function resamplePath(path: PathPoint[], count: number): PathPoint[] {
  if (path.length < 2 || count < 2) return []
  const cum = [0]
  for (let i = 1; i < path.length; i++) cum.push(cum[i - 1]! + haversineM(path[i - 1]!, path[i]!))
  const total = cum[cum.length - 1]!
  if (total <= 0) return []

  const out: PathPoint[] = []
  let seg = 1
  for (let k = 0; k < count; k++) {
    const target = (total * k) / (count - 1)
    while (seg < cum.length - 1 && cum[seg]! < target) seg++
    const a = path[seg - 1]!
    const b = path[seg]!
    const segLen = cum[seg]! - cum[seg - 1]!
    const f = segLen === 0 ? 0 : Math.min(1, Math.max(0, (target - cum[seg - 1]!) / segLen))
    out.push({ lat: a.lat + (b.lat - a.lat) * f, lng: a.lng + (b.lng - a.lng) * f })
  }
  return out
}

/** Sum of positive elevation changes, ignoring wiggles smaller than `deadband` metres. */
export function sumAscent(elevations: number[], deadband = NOISE_DEADBAND_M): number {
  if (elevations.length < 2) return 0
  let anchor = elevations[0]!
  let total = 0
  for (let i = 1; i < elevations.length; i++) {
    const e = elevations[i]!
    if (e - anchor >= deadband) {
      total += e - anchor
      anchor = e
    } else if (anchor - e >= deadband) {
      anchor = e
    }
  }
  return total
}

/**
 * Total climb (metres) along a route polyline, from real elevation samples.
 * Never throws: failures come back as `{ ok: false, reason }`.
 */
export async function measureRouteAscent(path: PathPoint[], outerSignal?: AbortSignal): Promise<AscentResult> {
  const lengthM = pathLengthM(path)
  const points = resamplePath(path, sampleCountFor(lengthM))
  if (points.length < 2) return { ok: false, reason: 'no-data' }

  const key = points.map((p) => `${p.lat.toFixed(5)},${p.lng.toFixed(5)}`).join(';')
  const hit = cache.get(key)
  if (hit) return { ok: true, ...hit }

  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), REQUEST_TIMEOUT_MS)
  const onOuterAbort = () => ctrl.abort()
  outerSignal?.addEventListener('abort', onOuterAbort)
  try {
    const lat = points.map((p) => p.lat.toFixed(5)).join(',')
    const lng = points.map((p) => p.lng.toFixed(5)).join(',')
    const res = await fetch(`https://api.open-meteo.com/v1/elevation?latitude=${lat}&longitude=${lng}`, {
      signal: ctrl.signal,
    })
    if (res.status === 429) return { ok: false, reason: 'quota' }
    if (!res.ok) return { ok: false, reason: 'error' }
    const data = (await res.json()) as { elevation?: number[] }
    const elevations = data.elevation ?? []
    if (elevations.length !== points.length || elevations.some((v) => !Number.isFinite(v))) {
      return { ok: false, reason: 'no-data' }
    }
    const value = { ascentM: Math.round(sumAscent(elevations)), samples: points.length }
    cache.set(key, value)
    return { ok: true, ...value }
  } catch (err) {
    if (outerSignal?.aborted) return { ok: false, reason: 'error' }
    const timedOut = (err as { name?: string })?.name === 'AbortError'
    console.warn('[Elevation] unavailable:', err)
    return { ok: false, reason: timedOut ? 'timeout' : 'error' }
  } finally {
    clearTimeout(timer)
    outerSignal?.removeEventListener('abort', onOuterAbort)
  }
}
