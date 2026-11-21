/**
 * Free geo services (no API key, no billing):
 *  - Photon (OpenStreetMap data) for type-ahead place search
 *  - Nominatim (OpenStreetMap) for reverse geocoding
 * Both support browser CORS. Requests are debounced by the caller and cancellable.
 */

export interface PlaceSuggestion {
  id: string
  title: string
  subtitle: string
  lat: number
  lng: number
}

/** Bias results to Jordan and its surroundings (minLon, minLat, maxLon, maxLat). */
const JORDAN_BBOX = '34.8,29.1,39.4,33.5'

interface PhotonFeature {
  geometry?: { coordinates?: [number, number] }
  properties?: {
    osm_id?: number
    osm_type?: string
    name?: string
    street?: string
    housenumber?: string
    district?: string
    locality?: string
    city?: string
    state?: string
    country?: string
  }
}

export async function searchPlaces(query: string, signal?: AbortSignal): Promise<PlaceSuggestion[]> {
  const q = query.trim()
  if (q.length < 2) return []
  const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=6&lang=en&bbox=${JORDAN_BBOX}`
  const res = await fetch(url, { signal })
  if (!res.ok) throw new Error(`Search failed (${res.status})`)
  const data = (await res.json()) as { features?: PhotonFeature[] }
  const out: PlaceSuggestion[] = []
  for (const f of data.features ?? []) {
    const p = f.properties ?? {}
    const c = f.geometry?.coordinates
    if (!c || c.length < 2) continue
    const title = p.name || [p.street, p.housenumber].filter(Boolean).join(' ') || p.district || p.city
    if (!title) continue
    const subtitle = [p.street && p.name ? p.street : null, p.district ?? p.locality, p.city, p.state]
      .filter((v, i, a): v is string => Boolean(v) && a.indexOf(v) === i && v !== title)
      .slice(0, 3)
      .join(', ')
    out.push({
      id: `${p.osm_type ?? 'x'}${p.osm_id ?? out.length}-${c[0]}-${c[1]}`,
      title,
      subtitle,
      lat: c[1],
      lng: c[0],
    })
  }
  return out
}

export async function reverseGeocodeName(lat: number, lng: number, signal?: AbortSignal): Promise<string> {
  const fallback = `${lat.toFixed(5)}, ${lng.toFixed(5)}`
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=17&lat=${lat}&lon=${lng}&accept-language=en`
    const res = await fetch(url, { signal })
    if (!res.ok) return fallback
    const d = (await res.json()) as {
      name?: string
      display_name?: string
      address?: Record<string, string | undefined>
    }
    const a = d.address ?? {}
    const local = d.name || a.road || a.neighbourhood || a.suburb || a.city_district
    const city = a.city ?? a.town ?? a.village ?? a.state
    if (local && city && local !== city) return `${local}, ${city}`
    if (local || city) return (local || city) as string
    return d.display_name?.split(',').slice(0, 2).join(',').trim() || fallback
  } catch {
    return fallback
  }
}
