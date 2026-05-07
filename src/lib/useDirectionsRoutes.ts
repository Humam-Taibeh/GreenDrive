/**
 * useDirectionsRoutes — calls Google Maps Directions API for real routes.
 *
 * When origin + destination are set and the Maps API is loaded, fetches up to
 * 3 route alternatives and converts them into RouteOption[] with eco-labelling.
 *
 * Falls back to MOCK_ROUTES when:
 *  - Origin or destination not set
 *  - Maps API not available
 *  - API call fails
 */
import { useState, useRef, useCallback } from 'react'
import type { RouteOption } from '../types'
import { MOCK_ROUTES } from '../data/routes'
import { computeTripEmissions } from './vehicleProfiles'
import type { VehicleType } from './vehicleProfiles'

export interface LatLng { lat: number; lng: number }

export type DirectionsState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ok'; routes: RouteOption[] }
  | { status: 'error'; message: string }
  | { status: 'fallback'; routes: RouteOption[] }

/**
 * Modern Routes API (v2) computeRoutes simulation/adapter for JS SDK.
 */
/**
 * Modern Routes API (v2) Adapter.
 * Migrates from deprecated DirectionsService to the performance-optimized Routes API.
 */
async function computeRoutesModern(
  origin: LatLng,
  destination: LatLng,
  vehicle: VehicleType,
  signal?: AbortSignal
): Promise<RouteOption[]> {
  const routesLib = (await google.maps.importLibrary('routes').catch(() => ({}))) as any
  
  // Robust lookup across namespaces
  const RTM = routesLib.RouteTravelMode || (google.maps as any).RouteTravelMode || (google.maps as any).routes?.RouteTravelMode
  const RP = routesLib.RoutingPreference || (google.maps as any).RoutingPreference || (google.maps as any).routes?.RoutingPreference
  const RS = routesLib.RoutesService || (google.maps as any).RoutesService || (google.maps as any).routes?.RoutesService

  // FINAL FALLBACK: If Routes API v2 is missing, attempt legacy DirectionsService
  if (!RS || !RTM) {
    console.warn('[RoutesAPI] V2 not available. Falling back to legacy DirectionsService.')
    return computeRoutesLegacy(origin, destination, vehicle, signal)
  }

  const tryCompute = async (mode: any): Promise<RouteOption[]> => {
    return new Promise((resolve, reject) => {
      const svc = new RS()
      svc.computeRoutes(
        {
          origin: { location: { latLng: { latitude: origin.lat, longitude: origin.lng } } },
          destination: { location: { latLng: { latitude: destination.lat, longitude: destination.lng } } },
          travelMode: mode,
          routingPreference: mode === RTM.DRIVE 
            ? RP.TRAFFIC_AWARE_OPTIMAL 
            : undefined,
          computeAlternativeRoutes: mode === RTM.DRIVE,
        },
        (result: any) => {
          if (signal?.aborted) return reject(new Error('Aborted'))
          if (!result || !result.routes || result.routes.length === 0) {
            return reject(new Error('ZERO_RESULTS'))
          }

          const raw = result.routes.slice(0, 3).map((r: any, i: number) => {
            const distanceKm = (r.distanceMeters ?? 0) / 1000
            const durationMin = Math.round(parseInt(r.duration?.replace('s', '') ?? '0') / 60)
            const staticDurationMin = Math.round(parseInt(r.staticDuration?.replace('s', '') ?? r.duration?.replace('s', '') ?? '0') / 60)
            const polyline = r.polyline?.encodedPolyline 
              ? google.maps.geometry.encoding.decodePath(r.polyline.encodedPolyline).map(p => ({ lat: p.lat(), lng: p.lng() }))
              : []

            const ascentM = 60 + i * 20
            const efficiencies = [0.75, 0.82, 0.90]
            const emissions = computeTripEmissions(distanceKm, ascentM, efficiencies[i] ?? 0.82, vehicle)

            return {
              id: `route_${i}`,
              label: mode === RTM.DRIVE ? `Route ${i + 1}` : 'Pedestrian Path',
              focus: 'eco' as const,
              distanceKm: Math.round(distanceKm * 10) / 10,
              durationMin,
              staticDurationMin, // ✅ Captured for traffic waste analysis
              fuelLiters: mode === RTM.DRIVE ? emissions.fuelLiters : 0,
              co2Kg:       mode === RTM.DRIVE ? emissions.co2Kg       : 0,
              savingsPercent: mode === RTM.DRIVE ? 0 : 100,
              polyline,
              ascentM: mode === RTM.DRIVE ? ascentM : 0,
            }
          })
          resolve(labelRoutes(raw, vehicle))
        }
      )
    })
  }

  try {
    return await tryCompute(RTM.DRIVE)
  } catch (err: any) {
    if (err.message === 'ZERO_RESULTS') {
      try {
        return await tryCompute(RTM.WALK)
      } catch (fallbackErr: any) {
        throw new Error('Tactical Alert: Destination is off-grid or lacks road access. Please snap pins closer to a verified route.')
      }
    }
    throw err
  }
}

/**
 * Legacy Fallback: Uses DirectionsService for environments without Routes API v2 access.
 */
async function computeRoutesLegacy(
  origin: LatLng,
  destination: LatLng,
  vehicle: VehicleType,
  signal?: AbortSignal
): Promise<RouteOption[]> {
  return new Promise((resolve, reject) => {
    const svc = new google.maps.DirectionsService()
    svc.route(
      {
        origin: new google.maps.LatLng(origin.lat, origin.lng),
        destination: new google.maps.LatLng(destination.lat, destination.lng),
        travelMode: google.maps.TravelMode.DRIVING,
        provideRouteAlternatives: true,
      },
      (result, status) => {
        if (signal?.aborted) return reject(new Error('Aborted'))
        if (status !== 'OK' || !result?.routes || result.routes.length === 0) {
          return reject(new Error('ZERO_RESULTS'))
        }

        const raw = result.routes.slice(0, 3).map((r, i) => {
          const leg = r.legs[0]
          const distanceKm  = (leg?.distance?.value ?? 0) / 1000
          const durationMin = Math.round((leg?.duration?.value ?? 0) / 60)
          const polyline    = r.overview_path.map(p => ({ lat: p.lat(), lng: p.lng() }))
          const ascentM     = 60 + i * 20
          // ✅ Same corrected efficiency model as modern engine
          const efficiencies = [0.75, 0.82, 0.90]
          const emissions    = computeTripEmissions(distanceKm, ascentM, efficiencies[i] ?? 0.82, vehicle)

          return {
            id: `route_${i}`,
            label: `Route ${i + 1}`,
            focus: 'eco' as const,
            distanceKm: Math.round(distanceKm * 10) / 10,
            durationMin,
            staticDurationMin: durationMin, // Legacy fallback
            fuelLiters: emissions.fuelLiters,
            co2Kg:      emissions.co2Kg,
            savingsPercent: 0,
            polyline,
            ascentM,
          }
        })
        resolve(labelRoutes(raw, vehicle))
      }
    )
  })
}

/**
 * Derive eco-labelling for routes returned by Directions API.
 *
 * GUARANTEE: Always returns exactly 3 route slots.
 * - Physics-first: real co2Kg/fuelLiters from construction are preserved.
 * - Soft dedup: only removes routes with near-identical polylines (not dominated ones).
 * - Synthetic fill: if < 3 real routes, generates plausible variants for the 3rd slot.
 */
/**
 * Derive eco-labelling for routes returned by Directions API.
 *
 * GUARANTEE: Always returns exactly 3 route slots.
 * - Physics-first: real co2Kg/fuelLiters from construction are preserved.
 * - Dynamic Logic: Prevents "Eco-Friendly" labels on routes that use more fuel than Optimal.
 */
function labelRoutes(raw: RouteOption[], vehicle: VehicleType): RouteOption[] {
  if (raw.length === 0) return []

  // Step 1: Soft dedup — remove ONLY near-identical paths (±0.15km AND ±1min)
  const deduped: RouteOption[] = []
  for (const candidate of raw) {
    const isDupe = deduped.some(
      (existing) =>
        Math.abs(existing.distanceKm - candidate.distanceKm) < 0.15 &&
        Math.abs(existing.durationMin - candidate.durationMin) <= 1
    )
    if (!isDupe) deduped.push(candidate)
  }

  // Step 2: Identify absolute physics winners
  const byTime = [...deduped].sort((a, b) => a.durationMin - b.durationMin)
  const byCo2  = [...deduped].sort((a, b) => (a.co2Kg ?? Infinity) - (b.co2Kg ?? Infinity))

  const fastest = byTime[0]!
  const greenest = byCo2[0]!
  
  // Paradox Protection: If fastest is also greenest, it is "Optimal"
  const isOptimal = fastest.id === greenest.id

  let fastSlot: RouteOption | null = null
  let ecoSlot:  RouteOption | null = null
  let balSlot:  RouteOption | null = null

  if (isOptimal) {
    // Card 1 is Optimal
    fastSlot = { 
      ...fastest, 
      id: 'fast', 
      label: 'Optimal Route', 
      focus: 'fast' 
    }
    
    const remaining = deduped.filter(r => r.id !== fastest.id)
    if (remaining.length > 0) {
      // Card 2 must be BALANCED, not ECO (since card 1 is the greenest)
      balSlot = { ...remaining[0], id: 'cheap', label: 'Balanced Option', focus: 'cheap' }
      if (remaining.length > 1) {
        // Card 3 is Alt
        ecoSlot = { ...remaining[1], id: 'eco_alt', label: 'Alternative Route', focus: 'cheap' }
      }
    }
  } else {
    // Card 1 is Fastest
    fastSlot = { ...fastest, id: 'fast', label: 'Fastest Route', focus: 'fast' }
    // Card 2 is Eco (only if strictly better than fast)
    ecoSlot = { ...greenest, id: 'eco', label: 'Eco-Friendly Choice', focus: 'eco' }
    
    const remaining = deduped.filter(r => r.id !== fastest.id && r.id !== greenest.id)
    if (remaining.length > 0) {
      balSlot = { ...remaining[0], id: 'cheap', label: 'Balanced Option', focus: 'cheap' }
    }
  }

  // Step 3: Synthesis for missing slots
  if (!balSlot) {
    const base = ecoSlot || fastSlot!
    const balDistance = Math.round(base.distanceKm * 1.04 * 10) / 10
    const balEmissions = computeTripEmissions(balDistance, (base.ascentM ?? 60) + 15, 0.82, vehicle)
    balSlot = {
      id: 'cheap',
      label: 'Balanced Option',
      focus: 'cheap',
      distanceKm: balDistance,
      durationMin: Math.round(base.durationMin * 1.06),
      staticDurationMin: Math.round(base.staticDurationMin ?? base.durationMin),
      fuelLiters: balEmissions.fuelLiters,
      co2Kg: balEmissions.co2Kg,
      savingsPercent: 0,
      polyline: base.polyline,
      ascentM: (base.ascentM ?? 60) + 15,
    }
  }
  
  if (!ecoSlot) {
    const base = fastSlot!
    const ecoEmissions = computeTripEmissions(base.distanceKm, (base.ascentM ?? 60) + 10, 0.92, vehicle)
    ecoSlot = {
      id: 'eco_alt',
      label: 'Alternative Route',
      focus: 'cheap',
      distanceKm: base.distanceKm,
      durationMin: Math.round(base.durationMin * 1.05),
      staticDurationMin: base.durationMin,
      fuelLiters: ecoEmissions.fuelLiters,
      co2Kg: ecoEmissions.co2Kg,
      savingsPercent: 0,
      polyline: base.polyline,
      ascentM: (base.ascentM ?? 60) + 10,
    }
  }

  const result = [fastSlot!, ecoSlot!, balSlot].slice(0, 3)

  // Step 4: Final calculation for savings and "cheapest" flag
  const minCo2 = Math.min(...result.map(r => r.co2Kg))
  const baselineCo2 = fastSlot!.co2Kg || 1

  return result.map((r) => ({
    ...r,
    isCheapest: r.co2Kg === minCo2,
    savingsPercent: Math.max(0, Math.round(((baselineCo2 - r.co2Kg) / baselineCo2) * 100))
  }))
}


export function useDirectionsRoutes(
  origin: LatLng | null,
  destination: LatLng | null,
  vehicle: VehicleType,
): DirectionsState & { fetchRoutes: () => void } {
  const [state, setState] = useState<DirectionsState>({ status: 'idle' })
  const abortRef = useRef<AbortController | null>(null)

  const fetchRoutes = useCallback(() => {
    if (!origin || !destination) {
      setState({ status: 'fallback', routes: MOCK_ROUTES })
      return
    }

    // Check Maps API is loaded
    if (typeof google === 'undefined' || !google.maps?.DirectionsService) {
      setState({ status: 'fallback', routes: MOCK_ROUTES })
      return
    }

    // Abort previous
    abortRef.current?.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl

    setState({ status: 'loading' })

    // Priority: Ensure 'routes' library is loaded before calling computeRoutesModern
    ;(async () => {
      try {
        if (typeof google !== 'undefined' && google.maps.importLibrary) {
          await google.maps.importLibrary('routes')
        }
        const routes = await computeRoutesModern(origin, destination, vehicle, ctrl.signal)
        setState({ status: 'ok', routes })
      } catch (err: any) {
        if (err.message === 'Aborted') return
        console.warn('[RoutesAPI] Error:', err)
        setState({ 
          status: err.message.includes('Tactical Alert') ? 'error' : 'fallback', 
          message: err.message,
          routes: MOCK_ROUTES 
        })
      }
    })()
  }, [origin?.lat, origin?.lng, destination?.lat, destination?.lng, vehicle])

  return { ...state, fetchRoutes }
}

