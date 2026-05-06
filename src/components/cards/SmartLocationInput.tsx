/**
 * SmartLocationInput — From / To input with:
 *  - Google Places Autocomplete (typed search with real-time suggestions)
 *  - Current GPS location button (→ reverse geocoded text)
 *  - Recent locations dropdown
 *  - Swap button
 *  - Coordinate display for selected point
 *
 * Places Autocomplete is attached to the native <input> via the Maps JS API.
 */
import { useState, useId, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import type { GeoResult, SavedLocation } from '../../hooks/useReverseGeocode'
import { getCurrentPosition, getRecentLocations } from '../../hooks/useReverseGeocode'
import { useReverseGeocode } from '../../hooks/useReverseGeocode'
import { useLocale } from '../../contexts/LocaleContext'
import type { UserSavedLocation } from '../../types'

/* ── icons ── */
const IconGPS = () => (
  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="3" />
    <path strokeLinecap="round" d="M12 2v3M12 19v3M2 12h3M19 12h3" />
    <circle cx="12" cy="12" r="8" strokeOpacity={0.3} />
  </svg>
)

const IconSwap = () => (
  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M7 16V4m0 0L3 8m4-4 4 4M17 8v12m0 0 4-4m-4 4-4-4" />
  </svg>
)

const IconClock = () => (
  <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="9" />
    <path strokeLinecap="round" d="M12 7v5l3 3" />
  </svg>
)

const IconClear = () => (
  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" d="M6 18 18 6M6 6l12 12" />
  </svg>
)

const IconPin = () => (
  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21s-7-6.5-7-11a7 7 0 1 1 14 0c0 4.5-7 11-7 11Z" />
    <circle cx="12" cy="10" r="2.5" />
  </svg>
)

const IconStar = ({ filled }: { filled?: boolean }) => (
  <svg className={`h-4 w-4 ${filled ? 'fill-amber-400 text-amber-400' : 'fill-none text-zinc-400'}`} stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
  </svg>
)

export interface LocationPoint {
  display: string
  lat: number
  lng: number
}

/* ── Places Autocomplete hook ─────────────────────────────────── */

function usePlacesAutocomplete(
  inputRef: React.RefObject<HTMLInputElement | null>,
  onPlace: (point: LocationPoint) => void,
  apiReady?: boolean,
) {
  const listenerRef = useRef<google.maps.MapsEventListener | null>(null)
  const acRef = useRef<google.maps.places.Autocomplete | null>(null)

  useEffect(() => {
    const el = inputRef.current
    if (!el || typeof google === 'undefined' || !apiReady) return
    if ((el as any).__gdAc) return

    let cancelled = false
    ;(async () => {
      try {
        const { Autocomplete, PlaceAutocompleteElement } = (await google.maps.importLibrary('places')) as any
        if (cancelled || !el) return

        // Future-proof side-load of the Web Component library
        try {
          const acElem = new PlaceAutocompleteElement()
          acElem.locationRestriction = { country: 'JO' }
        } catch (e) { /* ignore */ }

        // Core Autocomplete for existing input
        const autocomplete = new Autocomplete(el, {
          fields: ['geometry', 'formatted_address', 'name'],
        })
        acRef.current = autocomplete
        ;(el as any).__gdAc = true

        listenerRef.current = autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace()
          if (!place.geometry?.location) return
          
          const lat = place.geometry.location.lat()
          const lng = place.geometry.location.lng()
          const display = place.name || place.formatted_address?.split(',').slice(0, 2).join(',').trim() || `${lat.toFixed(5)}, ${lng.toFixed(5)}`

          onPlace({ display, lat, lng })
        })
      } catch (err) {
        console.warn('Places Autocomplete init error:', err)
      }
    })()

    return () => {
      cancelled = true
      if (listenerRef.current) google.maps.event.removeListener(listenerRef.current)
      document.querySelectorAll('.pac-container').forEach((el) => el.remove())
      acRef.current = null
      if (el) delete (el as any).__gdAc
    }
  }, [apiReady, onPlace, inputRef])
}

/* ── LocationField ───────────────────────────────────────────── */

interface FieldProps {
  id: string
  label: string
  placeholder: string
  value: LocationPoint | null
  loading: boolean
  onGPS: () => void
  onClear: () => void
  onPlace: (p: LocationPoint) => void
  dot: 'green' | 'white'
  recent: SavedLocation[]
  onRecentSelect: (l: SavedLocation) => void
  favorites: UserSavedLocation[]
  isSaved: boolean
  onSave: () => void
  onFavoriteSelect: (l: UserSavedLocation) => void
  apiReady?: boolean
}

function LocationField({
  id,
  label,
  placeholder,
  value,
  loading,
  onGPS,
  onClear,
  onPlace,
  dot,
  recent,
  onRecentSelect,
  favorites,
  isSaved,
  onSave,
  onFavoriteSelect,
  apiReady,
}: FieldProps) {
  const { t } = useLocale()
  const [showRecent, setShowRecent] = useState(false)
  const [typed, setTyped] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 })

  const updateCoords = useCallback(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      setCoords({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
      })
    }
  }, [])

  useEffect(() => {
    if (showRecent) {
      updateCoords()
      window.addEventListener('resize', updateCoords)
      window.addEventListener('scroll', updateCoords, true)
    }
    return () => {
      window.removeEventListener('resize', updateCoords)
      window.removeEventListener('scroll', updateCoords, true)
    }
  }, [showRecent, updateCoords])

  const handlePlace = useCallback((p: LocationPoint) => {
    setTyped('')
    onPlace(p)
  }, [onPlace])

  usePlacesAutocomplete(inputRef, handlePlace, apiReady)

  return (
    <div className="relative flex-1" ref={containerRef}>
      <label htmlFor={id} className="mb-1 block font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-500 dark:text-white/40">
        {label}
      </label>
      <div
        className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 transition-all duration-200 ${
          value
            ? 'border-toxic/50 bg-toxic/5 dark:bg-toxic/5'
            : 'border-black/10 bg-white/80 dark:border-white/10 dark:bg-white/[0.05]'
        }`}
      >
        <span
          className={`h-2 w-2 shrink-0 rounded-full ${dot === 'green' ? 'bg-toxic shadow-[0_0_6px_rgba(54,255,151,0.8)]' : 'bg-white shadow-[0_0_6px_rgba(255,255,255,0.5)]'}`}
          aria-hidden
        />

        {value && !typed ? (
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-zinc-900 dark:text-white">{value.display}</p>
            <p className="font-mono text-[10px] text-zinc-400 dark:text-white/35" dir="ltr">
              {value.lat.toFixed(5)}, {value.lng.toFixed(5)}
            </p>
          </div>
        ) : (
          <input
            ref={inputRef}
            id={id}
            type="text"
            value={typed}
            onChange={(e) => {
              setTyped(e.target.value)
              if (!e.target.value) onClear()
            }}
            placeholder={loading ? 'Locating…' : placeholder}
            className="input-dynamic min-w-0 flex-1 bg-transparent text-sm text-zinc-800 placeholder:text-zinc-400 outline-none dark:text-white dark:placeholder:text-white/30"
            onFocus={() => setShowRecent(true)}
            onBlur={() => setTimeout(() => { setShowRecent(false) }, 200)}
            autoComplete="off"
          />
        )}

        {value && !typed && (
          <button
            type="button"
            onClick={() => {
              setTyped(value.display)
              setTimeout(() => inputRef.current?.focus(), 50)
            }}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-zinc-400 transition hover:text-zinc-700 dark:hover:text-white/70"
          >
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Z" />
            </svg>
          </button>
        )}

        <button
          type="button"
          onClick={onGPS}
          disabled={loading}
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-all ${
            loading ? 'animate-pulse text-toxic/50' : 'text-zinc-400 hover:text-zinc-700 dark:hover:text-white/70'
          }`}
        >
          <IconGPS />
        </button>

        {value && (
          <button
            type="button"
            onClick={onSave}
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-all ${
              isSaved ? 'text-amber-400' : 'text-zinc-400 hover:text-zinc-700 dark:hover:text-white/70'
            }`}
          >
            <IconStar filled={isSaved} />
          </button>
        )}

        {value && (
          <button
            type="button"
            onClick={() => { setTyped(''); onClear() }}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-zinc-400 transition hover:text-red-400"
          >
            <IconClear />
          </button>
        )}
      </div>

      {showRecent && (recent.length > 0 || favorites.length > 0) && !value && !typed && createPortal(
        <div 
          className="fixed z-[9999] overflow-hidden rounded-xl border border-black/10 bg-white shadow-2xl dark:border-white/10 dark:bg-zinc-900"
          style={{ 
            top: coords.top + 4, 
            left: coords.left, 
            width: coords.width,
          }}
        >
          {favorites.length > 0 && (
            <div className="border-b border-black/5 pb-1 dark:border-white/5">
              <p className="flex items-center gap-1.5 px-3 py-2 font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-amber-500/80">
                <IconStar filled /> {t('map.favorites')}
              </p>
              {favorites.map((loc) => (
                <button
                  key={loc.id}
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); onFavoriteSelect(loc); setTyped(''); setShowRecent(false) }}
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-start transition hover:bg-zinc-50 dark:hover:bg-white/[0.05]"
                >
                  <span className="text-amber-400/70"><IconPin /></span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-zinc-800 dark:text-white">{loc.label}</p>
                    <p className="truncate text-[10px] text-zinc-400 dark:text-white/30">{loc.address}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
          {recent.length > 0 && (
            <div>
              <p className="flex items-center gap-1.5 px-3 py-2 font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-400 dark:text-white/35">
                <IconClock /> Recent
              </p>
              {recent.map((loc) => (
                <button
                  key={`${loc.lat}-${loc.lng}`}
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); onRecentSelect(loc); setTyped(''); setShowRecent(false) }}
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-start transition hover:bg-zinc-50 dark:hover:bg-white/[0.05]"
                >
                  <span className="text-toxic/70"><IconPin /></span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-zinc-800 dark:text-white">{loc.display}</p>
                    <p className="font-mono text-[10px] text-zinc-400 dark:text-white/30">{loc.lat.toFixed(4)}, {loc.lng.toFixed(4)}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>,
        document.body
      )}
    </div>
  )
}

/* ── Main component ──────────────────────────────────────────── */

interface Props {
  origin: LocationPoint | null
  destination: LocationPoint | null
  onOriginChange: (l: LocationPoint | null) => void
  onDestinationChange: (l: LocationPoint | null) => void
  labels?: {
    from?: string
    to?: string
    fromPlaceholder?: string
    toPlaceholder?: string
  }
  favorites?: UserSavedLocation[]
  onSaveLocation?: (p: LocationPoint) => void
  onFavoriteSelect?: (l: UserSavedLocation) => void
  apiReady?: boolean
}

export function SmartLocationInput({
  origin,
  destination,
  onOriginChange,
  onDestinationChange,
  labels = {},
  favorites = [],
  onSaveLocation,
  onFavoriteSelect,
  apiReady,
}: Props) {
  const id = useId()
  const { resolve, loading } = useReverseGeocode()
  const [gpsTarget, setGpsTarget] = useState<'origin' | 'destination' | null>(null)
  const recent = getRecentLocations()

  const {
    from = 'From',
    to = 'To',
    fromPlaceholder = 'Type or use GPS…',
    toPlaceholder = 'Type destination…',
  } = labels

  async function handleGPS(field: 'origin' | 'destination') {
    setGpsTarget(field)
    try {
      const pos = await getCurrentPosition()
      const { latitude: lat, longitude: lng } = pos.coords
      const result: GeoResult = await resolve(lat, lng)
      const point: LocationPoint = { display: result.display, lat: result.lat, lng: result.lng }
      if (field === 'origin') onOriginChange(point)
      else onDestinationChange(point)
    } catch (err) {
      console.warn('GPS error:', err)
    } finally {
      setGpsTarget(null)
    }
  }

  function handleSwap() {
    const tmp = origin
    onOriginChange(destination)
    onDestinationChange(tmp)
  }

  return (
    <div className="rounded-2xl border border-black/10 bg-white/60 p-4 backdrop-blur-md dark:border-white/10 dark:bg-white/[0.04]">
      <p className="mb-3 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-toxic">
        📍 Route Planner
      </p>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-2">
        <LocationField
          id={`${id}-from`}
          label={from}
          placeholder={fromPlaceholder}
          value={origin}
          loading={gpsTarget === 'origin' && loading}
          onGPS={() => handleGPS('origin')}
          onClear={() => onOriginChange(null)}
          onPlace={onOriginChange}
          dot="green"
          recent={recent}
          onRecentSelect={(l) => onOriginChange({ display: l.display, lat: l.lat, lng: l.lng })}
          favorites={favorites}
          isSaved={favorites.some(f => f.lat === origin?.lat && f.lng === origin?.lng)}
          onSave={() => origin && onSaveLocation?.(origin)}
          onFavoriteSelect={(l) => {
            onOriginChange({ display: l.address, lat: l.lat, lng: l.lng })
            onFavoriteSelect?.(l)
          }}
          apiReady={apiReady}
        />

        <button
          type="button"
          onClick={handleSwap}
          className="mx-auto flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-black/10 bg-white/80 text-zinc-500 transition hover:border-toxic/50 hover:text-toxic dark:border-white/10 dark:bg-white/[0.05] dark:text-white/50 sm:mb-0 sm:mt-6"
        >
          <span className="rotate-90 sm:rotate-0"><IconSwap /></span>
        </button>

        <LocationField
          id={`${id}-to`}
          label={to}
          placeholder={toPlaceholder}
          value={destination}
          loading={gpsTarget === 'destination' && loading}
          onGPS={() => handleGPS('destination')}
          onClear={() => onDestinationChange(null)}
          onPlace={onDestinationChange}
          dot="white"
          recent={recent}
          onRecentSelect={(l) => onDestinationChange({ display: l.display, lat: l.lat, lng: l.lng })}
          favorites={favorites}
          isSaved={favorites.some(f => f.lat === destination?.lat && f.lng === destination?.lng)}
          onSave={() => destination && onSaveLocation?.(destination)}
          onFavoriteSelect={(l) => {
            onDestinationChange({ display: l.address, lat: l.lat, lng: l.lng })
            onFavoriteSelect?.(l)
          }}
          apiReady={apiReady}
        />
      </div>

      <p className="mt-3 flex items-center gap-1.5 text-[10px] text-zinc-400 dark:text-white/30">
        <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="9" /><path strokeLinecap="round" d="M12 8v4m0 4h.01" />
        </svg>
        Type to search (Places), tap GPS for auto-location, or click the map to pin a point.
      </p>
    </div>
  )
}
