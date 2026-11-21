/**
 * useDirectionsRoutes — real driving routes from the free OSRM public router
 * (OpenStreetMap data, no API key), enriched with measured ascent (Open-Meteo) and
 * the physics-based fuel / cost / CO₂ model in `vehicleProfiles`.
 *
 * Honesty rules:
 *  - No invented routes: if OSRM returns 1 route, the UI shows 1 route.
 *  - OSRM has no live traffic, so `staticDurationMin === durationMin` (no traffic-delay claims).
 *  - One driving-efficiency factor for every route, so differences between routes come
 *    only from real distance and real ascent.
 */
import { useState, useRef, useCallback, useEffect } from 'react'
import type { RouteOption } from '../types'
import { computeTripEmissions } from './vehicleProfiles'
import type { VehicleType } from './vehicleProfiles'
import { measureRouteAscent } from './routeElevation'

export interface LatLng { lat: number; lng: number }

export type DirectionsState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ok'; routes: RouteOption[] }
  | { status: 'error'; message: 'NO_ROUTE' | 'UNAVAILABLE' }

/** Typical smooth city/suburban driving. Same for every route on purpose. */
export const DRIVING_EFFICIENCY = 0.85

const OSRM = 'https://router.project-osrm.org/route/v1/driving'

interface OsrmRoute {
  distance: number
  duration: number
  geometry: { coordinates: [number, number][] }
}

async function fetchOsrmRoutes(origin: LatLng, destination: LatLng, signal: AbortSignal): Promise<OsrmRoute[]> {
  const coords = `${origin.lng},${origin.lat};${destination.lng},${destination.lat}`
  const res = await fetch(`${OSRM}/${coords}?alternatives=3&overview=full&geometries=geojson&steps=false`, { signal })
  if (!res.ok && res.status !== 400) throw new Error(`Routing service unavailable (${res.status})`)
  const data = (await res.json()) as { code: string; routes?: OsrmRoute[] }
  if (data.code === 'NoRoute' || data.code === 'NoSegment' || (data.code === 'Ok' && !data.routes?.length)) {
    throw new Error('NO_ROUTE')
  }
  if (data.code !== 'Ok') throw new Error(`Routing failed (${data.code})`)
  return (data.routes ?? []).slice(0, 3)
}

async function buildRoutes(raw: OsrmRoute[], vehicle: VehicleType, signal: AbortSignal): Promise<RouteOption[]> {
  const paths = raw.map((r) => r.geometry.coordinates.map(([lng, lat]) => ({ lat, lng })))
  const ascents = await Promise.all(paths.map((p) => measureRouteAscent(p, signal)))
  if (signal.aborted) throw new Error('Aborted')

  const options = raw.map((r, i): RouteOption => {
    const a = ascents[i]
    const measured = a && a.ok ? a : null
    const ascentM = measured ? measured.ascentM : 0
    const distanceKm = r.distance / 1000
    const durationMin = Math.max(1, Math.round(r.duration / 60))
    const e = computeTripEmissions(distanceKm, ascentM, DRIVING_EFFICIENCY, vehicle)
    return {
      id: `route_${i}`,
      label: `Route ${i + 1}`,
      focus: 'eco',
      distanceKm: Math.round(distanceKm * 10) / 10,
      durationMin,
      staticDurationMin: durationMin,
      fuelLiters: e.fuelLiters,
      co2Kg: e.co2Kg,
      savingsPercent: 0,
      polyline: paths[i],
      ascentM,
      ascentStatus: measured ? 'measured' : 'unavailable',
      ascentSamples: measured?.samples,
    }
  })

  const worstCo2 = Math.max(...options.map((o) => o.co2Kg), 0.0001)
  const bestCo2 = Math.min(...options.map((o) => o.co2Kg))
  return options.map((o) => ({
    ...o,
    isCheapest: o.co2Kg === bestCo2,
    savingsPercent: Math.max(0, Math.round(((worstCo2 - o.co2Kg) / worstCo2) * 100)),
  }))
}

export function useDirectionsRoutes(
  origin: LatLng | null,
  destination: LatLng | null,
  vehicle: VehicleType,
): DirectionsState & { fetchRoutes: () => void; reset: () => void } {
  const [state, setState] = useState<DirectionsState>({ status: 'idle' })
  const abortRef = useRef<AbortController | null>(null)
  // Vehicle only changes the fuel/CO₂ numbers, never the road geometry, so switching it must not refetch.
  const vehicleRef = useRef(vehicle)
  useEffect(() => {
    vehicleRef.current = vehicle
  }, [vehicle])

  const originLat = origin?.lat
  const originLng = origin?.lng
  const destLat = destination?.lat
  const destLng = destination?.lng

  const fetchRoutes = useCallback(() => {
    if (originLat == null || originLng == null || destLat == null || destLng == null) return

    abortRef.current?.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl
    setState({ status: 'loading' })

    ;(async () => {
      try {
        const raw = await fetchOsrmRoutes({ lat: originLat, lng: originLng }, { lat: destLat, lng: destLng }, ctrl.signal)
        const routes = await buildRoutes(raw, vehicleRef.current, ctrl.signal)
        if (!ctrl.signal.aborted) setState({ status: 'ok', routes })
      } catch (err) {
        const e = err as Error
        if (ctrl.signal.aborted || e.name === 'AbortError' || e.message === 'Aborted') return
        console.warn('[Routing] error:', err)
        setState({ status: 'error', message: e.message === 'NO_ROUTE' ? 'NO_ROUTE' : 'UNAVAILABLE' })
      }
    })()
  }, [originLat, originLng, destLat, destLng])

  const reset = useCallback(() => {
    abortRef.current?.abort()
    setState({ status: 'idle' })
  }, [])

  return { ...state, fetchRoutes, reset }
}
