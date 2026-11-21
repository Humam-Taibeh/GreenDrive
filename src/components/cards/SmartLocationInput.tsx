/**
 * SmartLocationInput — From / To fields with:
 *  - live place search (OpenStreetMap / Photon — free, no API key)
 *  - current-location (GPS) button
 *  - favourites + recent places when the field is focused and empty
 *  - swap button
 */
import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { getCurrentPosition, getRecentLocations, saveRecentLocation } from '../../hooks/useReverseGeocode'
import type { SavedLocation } from '../../hooks/useReverseGeocode'
import { reverseGeocodeName, searchPlaces } from '../../lib/geo'
import type { PlaceSuggestion } from '../../lib/geo'
import { useLocale } from '../../contexts/LocaleContext'
import type { UserSavedLocation } from '../../types'

export interface LocationPoint {
  display: string
  lat: number
  lng: number
}

const stroke = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' } as const

const IconGPS = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" {...stroke}>
    <circle cx="12" cy="12" r="3" />
    <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
    <circle cx="12" cy="12" r="7.5" opacity={0.35} />
  </svg>
)
const IconSwap = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" {...stroke}>
    <path d="M7 16V4m0 0L3 8m4-4 4 4M17 8v12m0 0 4-4m-4 4-4-4" />
  </svg>
)
const IconClear = () => (
  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" {...stroke} strokeWidth={2.4}>
    <path d="M6 18 18 6M6 6l12 12" />
  </svg>
)
const IconPin = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" {...stroke}>
    <path d="M12 21s-7-6.5-7-11a7 7 0 1 1 14 0c0 4.5-7 11-7 11Z" />
    <circle cx="12" cy="10" r="2.5" />
  </svg>
)
const IconClock = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" {...stroke}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 3" />
  </svg>
)
const IconStar = ({ filled }: { filled?: boolean }) => (
  <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" {...stroke} fill={filled ? 'currentColor' : 'none'}>
    <path d="m12 3 2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.5 6.6 19.5l1.2-6L3.3 9.3l6.1-.7L12 3Z" />
  </svg>
)

interface Row {
  key: string
  kind: 'result' | 'favorite' | 'recent'
  title: string
  subtitle: string
  point: LocationPoint
}

interface FieldProps {
  id: string
  label: string
  placeholder: string
  marker: 'A' | 'B'
  value: LocationPoint | null
  favorites: UserSavedLocation[]
  isSaved: boolean
  onSave?: () => void
  onChange: (p: LocationPoint | null) => void
}

function LocationField({ id, label, placeholder, marker, value, favorites, isSaved, onSave, onChange }: FieldProps) {
  const { locale } = useLocale()
  const isArabic = locale === 'ar'
  const [text, setText] = useState(value?.display ?? '')
  const [open, setOpen] = useState(false)
  const [results, setResults] = useState<PlaceSuggestion[]>([])
  const [searching, setSearching] = useState(false)
  const [searchFailed, setSearchFailed] = useState(false)
  const [gpsBusy, setGpsBusy] = useState(false)
  const [active, setActive] = useState(0)
  const wrapRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Keep the text in sync when the point changes from outside (map click, GPS, swap, favourite).
  useEffect(() => {
    setText(value?.display ?? '')
  }, [value?.display, value?.lat, value?.lng])

  // Debounced, cancellable search.
  useEffect(() => {
    const q = text.trim()
    if (!open || q.length < 2 || q === value?.display) {
      setResults([])
      setSearching(false)
      setSearchFailed(false)
      return
    }
    const ctrl = new AbortController()
    setSearching(true)
    const timer = window.setTimeout(async () => {
      try {
        const r = await searchPlaces(q, ctrl.signal)
        setResults(r)
        setSearchFailed(false)
        setActive(0)
      } catch (e) {
        if ((e as Error).name !== 'AbortError') setSearchFailed(true)
      } finally {
        if (!ctrl.signal.aborted) setSearching(false)
      }
    }, 320)
    return () => {
      window.clearTimeout(timer)
      ctrl.abort()
    }
  }, [text, open, value?.display])

  // Close on outside click.
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  const typing = text.trim().length >= 2 && text.trim() !== value?.display
  const recent: SavedLocation[] = open && !typing ? getRecentLocations() : []

  const rows: Row[] = typing
    ? results.map((r) => ({
        key: r.id,
        kind: 'result',
        title: r.title,
        subtitle: r.subtitle,
        point: { display: r.subtitle ? `${r.title}, ${r.subtitle.split(',')[0]}` : r.title, lat: r.lat, lng: r.lng },
      }))
    : [
        ...favorites.map((f): Row => ({
          key: `f-${f.id ?? f.lat}-${f.lng}`,
          kind: 'favorite',
          title: f.label,
          subtitle: f.address,
          point: { display: f.address || f.label, lat: f.lat, lng: f.lng },
        })),
        ...recent.map((r): Row => ({
          key: `r-${r.lat}-${r.lng}`,
          kind: 'recent',
          title: r.display,
          subtitle: '',
          point: { display: r.display, lat: r.lat, lng: r.lng },
        })),
      ]

  const choose = useCallback(
    (row: Row) => {
      saveRecentLocation({ ...row.point, savedAt: Date.now() })
      onChange(row.point)
      setText(row.point.display)
      setOpen(false)
      inputRef.current?.blur()
    },
    [onChange],
  )

  const locate = async () => {
    setGpsBusy(true)
    try {
      const pos = await getCurrentPosition()
      const { latitude: lat, longitude: lng } = pos.coords
      const display = await reverseGeocodeName(lat, lng)
      onChange({ display, lat, lng })
      setOpen(false)
    } catch {
      /* permission denied / unavailable: leave the field as is */
    } finally {
      setGpsBusy(false)
    }
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setOpen(false)
    } else if (e.key === 'ArrowDown' && rows.length) {
      e.preventDefault()
      setOpen(true)
      setActive((a) => (a + 1) % rows.length)
    } else if (e.key === 'ArrowUp' && rows.length) {
      e.preventDefault()
      setActive((a) => (a - 1 + rows.length) % rows.length)
    } else if (e.key === 'Enter' && open && rows[active]) {
      e.preventDefault()
      choose(rows[active]!)
    }
  }

  const showList = open && (rows.length > 0 || searching || searchFailed || (typing && !searching))
  const markerClass =
    marker === 'A'
      ? 'bg-toxic text-onyx shadow-[0_0_14px_-2px_rgba(54,255,151,0.8)]'
      : 'bg-zinc-900 text-white ring-1 ring-black/10 dark:bg-white dark:text-onyx dark:ring-0'

  return (
    <div ref={wrapRef} className="relative">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <div
        className={`flex items-center gap-2.5 rounded-xl border bg-white/70 px-3 py-2 transition focus-within:border-toxic/70 focus-within:ring-2 focus-within:ring-toxic/20 dark:bg-white/[0.05] ${
          value ? 'border-toxic/40' : 'border-black/10 dark:border-white/12'
        }`}
      >
        <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-extrabold ${markerClass}`}>
          {marker}
        </span>
        <input
          ref={inputRef}
          id={id}
          type="text"
          value={text}
          autoComplete="off"
          spellCheck={false}
          role="combobox"
          aria-expanded={showList}
          aria-autocomplete="list"
          placeholder={placeholder}
          onChange={(e) => {
            setText(e.target.value)
            setOpen(true)
            if (value) onChange(null)
          }}
          onFocus={(e) => {
            setOpen(true)
            e.currentTarget.select()
          }}
          onKeyDown={onKeyDown}
          className="min-w-0 flex-1 bg-transparent py-1 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 dark:text-white dark:placeholder:text-white/35"
        />
        {text && (
          <button
            type="button"
            aria-label={isArabic ? 'مسح' : 'Clear'}
            onClick={() => {
              setText('')
              onChange(null)
              inputRef.current?.focus()
            }}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-black/5 hover:text-zinc-700 dark:hover:bg-white/10 dark:hover:text-white"
          >
            <IconClear />
          </button>
        )}
        {value && onSave && (
          <button
            type="button"
            aria-label={isArabic ? 'حفظ في المفضلة' : 'Save to favourites'}
            aria-pressed={isSaved}
            onClick={onSave}
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition hover:bg-black/5 dark:hover:bg-white/10 ${
              isSaved ? 'text-amber-400' : 'text-zinc-400 hover:text-zinc-700 dark:hover:text-white'
            }`}
          >
            <IconStar filled={isSaved} />
          </button>
        )}
        <button
          type="button"
          aria-label={isArabic ? 'استخدم موقعي' : 'Use my location'}
          onClick={locate}
          disabled={gpsBusy}
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition hover:bg-toxic/15 hover:text-toxic ${
            gpsBusy ? 'animate-pulse text-toxic' : 'text-zinc-500 dark:text-white/55'
          }`}
        >
          <IconGPS />
        </button>
      </div>

      {showList && (
        <ul
          role="listbox"
          className="absolute inset-x-0 top-full z-[1200] mt-1.5 max-h-72 overflow-y-auto rounded-xl border border-black/10 bg-white p-1 shadow-[0_18px_50px_-16px_rgba(0,0,0,0.45)] dark:border-white/12 dark:bg-zinc-900"
        >
          {searching && rows.length === 0 && (
            <li className="px-3 py-2.5 text-xs text-zinc-500 dark:text-white/45">{isArabic ? 'جاري البحث…' : 'Searching…'}</li>
          )}
          {searchFailed && (
            <li className="px-3 py-2.5 text-xs text-amber-600 dark:text-amber-300">
              {isArabic ? 'تعذّر البحث الآن. يمكنك النقر على الخريطة لتحديد النقطة.' : "Search is unavailable right now. You can click the map to set the point."}
            </li>
          )}
          {typing && !searching && !searchFailed && rows.length === 0 && (
            <li className="px-3 py-2.5 text-xs text-zinc-500 dark:text-white/45">{isArabic ? 'لا توجد نتائج.' : 'No results.'}</li>
          )}
          {rows.map((row, i) => (
            <li key={row.key} role="option" aria-selected={i === active}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => choose(row)}
                onMouseEnter={() => setActive(i)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-start transition ${
                  i === active ? 'bg-toxic/12' : 'hover:bg-black/[0.04] dark:hover:bg-white/[0.06]'
                }`}
              >
                <span className={row.kind === 'favorite' ? 'text-amber-400' : row.kind === 'recent' ? 'text-zinc-400 dark:text-white/40' : 'text-toxic'}>
                  {row.kind === 'favorite' ? <IconStar filled /> : row.kind === 'recent' ? <IconClock /> : <IconPin />}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-zinc-900 dark:text-white">{row.title}</span>
                  {row.subtitle && <span className="block truncate text-[11px] text-zinc-500 dark:text-white/40">{row.subtitle}</span>}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

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
}

export function SmartLocationInput({
  origin,
  destination,
  onOriginChange,
  onDestinationChange,
  labels = {},
  favorites = [],
  onSaveLocation,
}: Props) {
  const id = useId()
  const { locale } = useLocale()
  const isArabic = locale === 'ar'
  const { from = 'From', to = 'To', fromPlaceholder = 'Search or click the map', toPlaceholder = 'Where to?' } = labels

  const swap = () => {
    const o = origin
    onOriginChange(destination)
    onDestinationChange(o)
  }
  const saved = (p: LocationPoint | null) => !!p && favorites.some((f) => f.lat === p.lat && f.lng === p.lng)

  return (
    <div className="flex items-center gap-2">
      <div className="min-w-0 flex-1 space-y-2.5">
      <LocationField
        id={`${id}-from`}
        label={from}
        placeholder={fromPlaceholder}
        marker="A"
        value={origin}
        favorites={favorites}
        isSaved={saved(origin)}
        onSave={onSaveLocation && origin ? () => onSaveLocation(origin) : undefined}
        onChange={onOriginChange}
      />
      <LocationField
        id={`${id}-to`}
        label={to}
        placeholder={toPlaceholder}
        marker="B"
        value={destination}
        favorites={favorites}
        isSaved={saved(destination)}
        onSave={onSaveLocation && destination ? () => onSaveLocation(destination) : undefined}
        onChange={onDestinationChange}
      />
      </div>
      <button
        type="button"
        onClick={swap}
        disabled={!origin && !destination}
        aria-label={isArabic ? 'تبديل نقطتي الانطلاق والوصول' : 'Swap start and destination'}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-black/10 bg-white/80 text-zinc-600 transition hover:border-toxic/60 hover:text-toxic disabled:opacity-40 dark:border-white/15 dark:bg-white/[0.06] dark:text-white/70"
      >
        <IconSwap />
      </button>
    </div>
  )
}
