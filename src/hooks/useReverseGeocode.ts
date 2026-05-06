/**
 * useReverseGeocode — converts lat/lng to a human-readable place name.
 *
 * Strategy:
 *  1. Try Google Geocoding API (if Maps API key is available in window.google)
 *  2. Fallback: Nominatim (OpenStreetMap) — free, no key required, CORS-friendly
 *
 * Returns the "short" address (neighbourhood + city) for display.
 */
import { useState, useCallback } from 'react'

export interface GeoResult {
  display: string       // "Sweifieh, Amman"
  full: string          // full formatted address
  lat: number
  lng: number
}

/** Nominatim reverse geocode (fallback — free, no key) */
async function nominatimReverse(lat: number, lng: number): Promise<string> {
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&accept-language=en`
  const res = await fetch(url, { headers: { 'Accept-Language': 'en' } })
  if (!res.ok) throw new Error('nominatim failed')
  const data = await res.json() as {
    address: {
      neighbourhood?: string
      suburb?: string
      city_district?: string
      city?: string
      town?: string
      village?: string
      country?: string
    }
    display_name?: string
  }
  const addr = data.address
  const local = addr.neighbourhood ?? addr.suburb ?? addr.city_district ?? ''
  const city = addr.city ?? addr.town ?? addr.village ?? ''
  if (local && city) return `${local}, ${city}`
  if (city) return city
  return data.display_name?.split(',').slice(0, 2).join(',').trim() ?? `${lat.toFixed(4)}, ${lng.toFixed(4)}`
}

/** Google Geocoding reverse geocode (preferred when Maps is loaded) */
async function googleReverse(lat: number, lng: number, apiKey: string): Promise<string> {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${encodeURIComponent(apiKey)}&result_type=neighborhood|sublocality|locality`
  const res = await fetch(url)
  if (!res.ok) throw new Error('google geocode failed')
  const data = await res.json() as {
    results: Array<{ formatted_address: string; address_components: Array<{ long_name: string; types: string[] }> }>
    status: string
  }
  if (data.status !== 'OK' || !data.results[0]) throw new Error('no result')
  const comps = data.results[0].address_components
  const neighbourhood = comps.find((c) => c.types.includes('neighborhood') || c.types.includes('sublocality_level_1'))?.long_name
  const city = comps.find((c) => c.types.includes('locality'))?.long_name
  if (neighbourhood && city) return `${neighbourhood}, ${city}`
  return data.results[0].formatted_address.split(',').slice(0, 2).join(',').trim()
}

export function useReverseGeocode() {
  const [loading, setLoading] = useState(false)
  const apiKey = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined)?.trim()

  const resolve = useCallback(
    async (lat: number, lng: number): Promise<GeoResult> => {
      setLoading(true)
      try {
        let display: string
        try {
          if (apiKey) {
            display = await googleReverse(lat, lng, apiKey)
          } else {
            display = await nominatimReverse(lat, lng)
          }
        } catch {
          // last resort fallback
          display = await nominatimReverse(lat, lng).catch(
            () => `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
          )
        }
        return { display, full: display, lat, lng }
      } finally {
        setLoading(false)
      }
    },
    [apiKey],
  )

  return { resolve, loading }
}

/** Get browser geolocation as a promise */
export function getCurrentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'))
      return
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 30000,
    })
  })
}

/** Saved/recent location entry */
export interface SavedLocation {
  display: string
  lat: number
  lng: number
  savedAt: number
}

const LS_KEY = 'gd-recent-locations'

export function getRecentLocations(): SavedLocation[] {
  try {
    const raw = localStorage.getItem(LS_KEY)
    return raw ? (JSON.parse(raw) as SavedLocation[]) : []
  } catch {
    return []
  }
}

export function saveRecentLocation(loc: SavedLocation) {
  try {
    const existing = getRecentLocations().filter((l) => l.display !== loc.display)
    const updated = [loc, ...existing].slice(0, 3) // keep last 3
    localStorage.setItem(LS_KEY, JSON.stringify(updated))
  } catch {
    /* ignore */
  }
}
