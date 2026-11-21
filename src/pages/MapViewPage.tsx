import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { BrandLogo } from '../components/brand/BrandLogo'
import { SmartLocationInput } from '../components/cards/SmartLocationInput'
import type { LocationPoint } from '../components/cards/SmartLocationInput'
import { GeminiCopilot } from '../components/copilot/GeminiCopilot'
import { useLocale } from '../contexts/LocaleContext'
import { useTheme } from '../contexts/ThemeContext'
import { useAuth } from '../contexts/AuthContext'
import { useSavedLocations } from '../hooks/useSavedLocations'
import { saveRecentLocation } from '../hooks/useReverseGeocode'
import { reverseGeocodeName } from '../lib/geo'
import { DRIVING_EFFICIENCY, useDirectionsRoutes } from '../lib/useDirectionsRoutes'
import { computeTripEmissions, projectYearlyImpact } from '../lib/vehicleProfiles'
import type { VehicleType } from '../lib/vehicleProfiles'
import type { RouteOption } from '../types'
import { sendGeminiMessage, type CopilotRouteMetrics } from '../services/gemini'

const MAP_DEFAULT_CENTER: L.LatLngTuple = [31.9539, 35.9106]
// Free Esri Canvas basemaps (no API key): a true near-black style for dark mode, a clean light-gray one for light mode.
const ESRI = 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas'
const TILESETS = {
  dark: { base: `${ESRI}/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}`, labels: `${ESRI}/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}` },
  light: { base: `${ESRI}/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}`, labels: `${ESRI}/World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}` },
}
const ATTRIBUTION = 'Tiles &copy; Esri &mdash; Esri, HERE, Garmin, &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'

const VEHICLES: VehicleType[] = ['petrol', 'diesel', 'hybrid', 'electric']

type Badge = 'best' | 'fastest' | 'eco' | 'alt'

interface RouteView {
  route: RouteOption
  badge: Badge
  title: string
  tagline: string
  stats: ReturnType<typeof computeTripEmissions>
  co2VsWorstPct: number
}

const AI_CONFIGURED = Boolean(
  (import.meta.env.VITE_GEMINI_API_KEY as string | undefined)?.trim() ||
    (import.meta.env.VITE_OPENROUTER_API_KEY as string | undefined)?.trim(),
)

/** Deterministic summary from the computed numbers — used when no AI key is configured. */
function localBriefing(view: RouteView, all: RouteView[], vehicle: VehicleType, ar: boolean): string {
  const { route, stats } = view
  const isEv = vehicle === 'electric'
  const energy = isEv ? stats.label : `${(stats.fuelLiters ?? 0).toFixed(2)} L`
  const parts: string[] = []
  parts.push(
    ar
      ? `${view.title}: ${route.distanceKm.toFixed(1)} كم خلال ${route.durationMin} دقيقة، تستهلك نحو ${energy} وتكلّف ${stats.costJODStr} دينار وتنتج ${stats.co2Kg.toFixed(2)} كغ CO₂.`
      : `${view.title}: ${route.distanceKm.toFixed(1)} km in ${route.durationMin} min, using about ${energy}, costing ${stats.costJODStr} JOD and emitting ${stats.co2Kg.toFixed(2)} kg of CO₂.`,
  )
  const others = all.filter((v) => v.route.id !== route.id)
  if (others.length) {
    const worst = others.reduce((a, b) => (b.stats.co2Kg > a.stats.co2Kg ? b : a))
    const dCo2 = worst.stats.co2Kg - stats.co2Kg
    const dJod = worst.stats.costJOD - stats.costJOD
    if (dCo2 > 0.005) {
      parts.push(
        ar
          ? `مقارنة بـ${worst.title} توفّر ${dCo2.toFixed(2)} كغ CO₂ و${dJod.toFixed(2)} دينار في الرحلة الواحدة.`
          : `Compared with ${worst.title}, it saves ${dCo2.toFixed(2)} kg of CO₂ and ${dJod.toFixed(2)} JOD per trip.`,
      )
    }
  }
  if (route.ascentStatus === 'measured' && (route.ascentM ?? 0) > 100) {
    parts.push(
      ar
        ? `يتضمن المسار صعوداً بنحو ${route.ascentM} م، وهذا يرفع الاستهلاك مقارنة بطريق مستوٍ.`
        : `The route climbs about ${route.ascentM} m, which raises consumption compared with flat terrain.`,
    )
  }
  if (route.distanceKm <= 2.5) {
    parts.push(ar ? 'الرحلة قصيرة، والمشي أو الدراجة خيار أنظف وأوفر.' : 'This trip is short — walking or cycling would be cleaner and cheaper.')
  }
  return parts.join(' ')
}

/* ── Leaflet helpers ─────────────────────────────────────────────── */

function pinIcon(label: 'A' | 'B') {
  const fill = label === 'A' ? '#36FF97' : '#FFFFFF'
  const html = `<svg xmlns="http://www.w3.org/2000/svg" width="38" height="50" viewBox="0 0 42 54" class="gd-pin-svg">
    <path d="M21 2C11.6 2 4 9.6 4 19c0 13.1 15.2 30.4 16 31.1a1.4 1.4 0 0 0 2 0C22.8 49.4 38 32.1 38 19 38 9.6 30.4 2 21 2Z" fill="${fill}" stroke="rgba(0,0,0,.6)" stroke-width="1.8"/>
    <circle cx="21" cy="19" r="9" fill="#050706"/>
    <text x="21" y="23" text-anchor="middle" font-size="12" font-family="Inter,Arial,sans-serif" font-weight="800" fill="${fill}">${label}</text>
  </svg>`
  return L.divIcon({ className: 'gd-pin', html, iconSize: [38, 50], iconAnchor: [19, 48] })
}

/* ── UI atoms ────────────────────────────────────────────────────── */

const Icon = {
  back: (
    <svg viewBox="0 0 24 24" className="h-4 w-4 rtl:-scale-x-100" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 18l-6-6 6-6" />
    </svg>
  ),
  plus: (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  ),
  minus: (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
      <path d="M5 12h14" />
    </svg>
  ),
  fit: (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 9V5h4M20 9V5h-4M4 15v4h4M20 15v4h-4" />
    </svg>
  ),
  spark: (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor">
      <path d="M12 2l1.8 5.4L19 9l-5.2 1.6L12 16l-1.8-5.4L5 9l5.2-1.6L12 2zm7 11l.9 2.6L22.5 16l-2.6.9L19 19.5l-.9-2.6-2.6-.9 2.6-.9L19 13z" />
    </svg>
  ),
}

const MapButton = ({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) => (
  <button
    type="button"
    aria-label={label}
    title={label}
    onClick={onClick}
    className="flex h-10 w-10 items-center justify-center rounded-xl border border-black/10 bg-white/90 text-zinc-800 shadow-lg backdrop-blur-md transition hover:border-toxic/60 hover:text-toxic dark:border-white/12 dark:bg-zinc-900/85 dark:text-white"
  >
    {children}
  </button>
)

const Metric = ({ label, value, unit }: { label: string; value: string; unit: string }) => (
  <div className="min-w-0 rounded-lg bg-black/[0.04] px-2.5 py-2 dark:bg-white/[0.05]">
    <p className="truncate text-[10px] font-medium text-zinc-500 dark:text-white/45">{label}</p>
    <p className="mt-0.5 truncate text-sm font-bold tabular-nums text-zinc-900 dark:text-white" dir="ltr">
      {value} <span className="text-[10px] font-medium text-zinc-500 dark:text-white/45">{unit}</span>
    </p>
  </div>
)

const badgeStyle: Record<Badge, string> = {
  best: 'bg-amber-400/15 text-amber-600 dark:text-amber-300',
  fastest: 'bg-sky-400/15 text-sky-600 dark:text-sky-300',
  eco: 'bg-toxic/15 text-emerald-700 dark:text-toxic',
  alt: 'bg-zinc-500/10 text-zinc-600 dark:text-white/60',
}

const RouteCard = memo(function RouteCard({
  view,
  selected,
  analyzing,
  isArabic,
  vehicle,
  onSelect,
  onAnalyze,
}: {
  view: RouteView
  selected: boolean
  analyzing: boolean
  isArabic: boolean
  vehicle: VehicleType
  onSelect: () => void
  onAnalyze: () => void
}) {
  const { route, stats } = view
  const isEv = vehicle === 'electric'
  const energy = isEv ? stats.label.replace(' kWh', '') : (stats.fuelLiters ?? 0).toFixed(2)
  return (
    <div
      role="button"
      tabIndex={0}
      aria-pressed={selected}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onSelect()
        }
      }}
      className={`cursor-pointer rounded-2xl border p-3.5 transition ${
        selected
          ? 'border-toxic bg-toxic/[0.08] shadow-[0_0_0_1px_rgba(54,255,151,0.55),0_14px_40px_-20px_rgba(54,255,151,0.6)]'
          : 'border-black/10 bg-white/60 hover:border-toxic/40 dark:border-white/10 dark:bg-white/[0.04]'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${badgeStyle[view.badge]}`}>{view.title}</span>
        {view.co2VsWorstPct > 0 && (
          <span dir="ltr" className="text-[11px] font-semibold text-emerald-600 dark:text-toxic">
            {isArabic ? `CO₂ -${view.co2VsWorstPct}%` : `${view.co2VsWorstPct}% less CO₂`}
          </span>
        )}
      </div>
      <p className="mt-1 text-[11px] text-zinc-500 dark:text-white/45">{view.tagline}</p>

      <div className="mt-2.5 flex items-baseline gap-2" dir="ltr">
        <span className="text-2xl font-extrabold tabular-nums text-zinc-950 dark:text-white">{route.durationMin}</span>
        <span className="text-xs font-medium text-zinc-500 dark:text-white/50">{isArabic ? 'دقيقة' : 'min'}</span>
        <span className="mx-1 text-zinc-300 dark:text-white/20">·</span>
        <span className="text-sm font-semibold tabular-nums text-zinc-700 dark:text-white/75">{route.distanceKm.toFixed(1)} {isArabic ? 'كم' : 'km'}</span>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <Metric label={isEv ? (isArabic ? 'الطاقة' : 'Energy') : isArabic ? 'الوقود' : 'Fuel'} value={energy} unit={isEv ? (isArabic ? 'ك.و.س' : 'kWh') : isArabic ? 'لتر' : 'L'} />
        <Metric label={isArabic ? 'التكلفة' : 'Cost'} value={stats.costJODStr} unit={isArabic ? 'دينار' : 'JOD'} />
        <Metric label="CO₂" value={stats.co2Kg.toFixed(2)} unit={isArabic ? 'كغ' : 'kg'} />
      </div>

      <div className="mt-2.5 flex items-center justify-between gap-2">
        {route.ascentStatus === 'measured' ? (
          <p className="text-[11px] text-zinc-500 dark:text-white/45" dir="ltr">
            ↑ {route.ascentM} {isArabic ? 'م صعود' : 'm climb'}
          </p>
        ) : (
          <p className="text-[11px] text-amber-600 dark:text-amber-300">
            {isArabic ? 'الارتفاع غير متاح — حُسب على أرض مستوية' : 'Elevation unavailable — assumed flat'}
          </p>
        )}
        <button
          type="button"
          disabled={analyzing}
          onClick={(e) => {
            e.stopPropagation()
            onAnalyze()
          }}
          className="inline-flex items-center gap-1.5 rounded-lg border border-toxic/35 bg-toxic/10 px-2.5 py-1.5 text-[11px] font-bold text-emerald-700 transition hover:bg-toxic/20 disabled:cursor-wait disabled:opacity-60 dark:text-toxic"
        >
          <span className={analyzing ? 'animate-pulse' : ''}>{Icon.spark}</span>
          {analyzing ? (isArabic ? 'جاري التحليل…' : 'Analyzing…') : isArabic ? 'اسأل الذكاء الاصطناعي' : 'Ask AI'}
        </button>
      </div>
    </div>
  )
})

const RouteSkeleton = () => (
  <div className="space-y-3" aria-hidden>
    {[0, 1].map((i) => (
      <div key={i} className="rounded-2xl border border-black/10 p-3.5 dark:border-white/10">
        <div className="gd-skeleton-bar h-4 w-28 rounded-full" />
        <div className="gd-skeleton-bar mt-3 h-7 w-36 rounded-lg" />
        <div className="mt-3 grid grid-cols-3 gap-2">
          {[0, 1, 2].map((j) => (
            <div key={j} className="gd-skeleton-bar h-11 rounded-lg" />
          ))}
        </div>
      </div>
    ))}
  </div>
)

/* ── Page ────────────────────────────────────────────────────────── */

export function MapViewPage() {
  const { t, locale } = useLocale()
  const { resolvedTheme } = useTheme()
  const { profile, user } = useAuth()
  const { savedLocations, saveLocation } = useSavedLocations()
  const isArabic = locale === 'ar'
  const isDark = resolvedTheme === 'dark'

  const [vehicle, setVehicle] = useState<VehicleType>((profile?.vehicleType as VehicleType) || 'petrol')
  const [origin, setOrigin] = useState<LocationPoint | null>(null)
  const [destination, setDestination] = useState<LocationPoint | null>(null)
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null)
  const [isCopilotOpen, setIsCopilotOpen] = useState(false)
  const [briefing, setBriefing] = useState<string | null>(null)
  const [analysisLoadingId, setAnalysisLoadingId] = useState<string | null>(null)
  const [analysisMetrics, setAnalysisMetrics] = useState<CopilotRouteMetrics | null>(null)
  const [localCharge, setLocalCharge] = useState<number>(() => {
    try {
      const s = localStorage.getItem('gd-charge')
      return s ? parseInt(s, 10) : 85
    } catch {
      return 85
    }
  })
  const analysisAbortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (profile?.vehicleType) setVehicle(profile.vehicleType as VehicleType)
  }, [profile?.vehicleType])

  useEffect(() => {
    if (profile?.currentChargePercent !== undefined) setLocalCharge(profile.currentChargePercent)
  }, [profile?.currentChargePercent])

  useEffect(() => {
    const sync = () => {
      try {
        const s = localStorage.getItem('gd-charge')
        if (s) setLocalCharge(parseInt(s, 10))
      } catch {
        /* ignore */
      }
    }
    window.addEventListener('storage', sync)
    window.addEventListener('gd-charge-update', sync)
    return () => {
      window.removeEventListener('storage', sync)
      window.removeEventListener('gd-charge-update', sync)
    }
  }, [])

  /* ── routing ── */
  const originMemo = useMemo(() => (origin ? { lat: origin.lat, lng: origin.lng } : null), [origin])
  const destMemo = useMemo(() => (destination ? { lat: destination.lat, lng: destination.lng } : null), [destination])
  const directions = useDirectionsRoutes(originMemo, destMemo, vehicle)
  const { fetchRoutes, reset } = directions
  const hasBoth = Boolean(origin && destination)

  useEffect(() => {
    if (!hasBoth) {
      reset()
      return
    }
    const id = window.setTimeout(fetchRoutes, 250)
    return () => window.clearTimeout(id)
  }, [hasBoth, fetchRoutes, reset])

  const liveRoutes = useMemo<RouteOption[]>(() => (directions.status === 'ok' ? directions.routes : []), [directions])

  const views = useMemo<RouteView[]>(() => {
    if (liveRoutes.length === 0) return []
    const withStats = liveRoutes.map((route) => ({
      route,
      stats: computeTripEmissions(Math.max(route.distanceKm, 0.1), route.ascentM ?? 0, DRIVING_EFFICIENCY, vehicle),
    }))
    const fastestId = withStats.reduce((a, b) => (b.route.durationMin < a.route.durationMin ? b : a)).route.id
    const greenestId = withStats.reduce((a, b) => (b.stats.co2Kg < a.stats.co2Kg ? b : a)).route.id
    const worstCo2 = Math.max(...withStats.map((w) => w.stats.co2Kg), 0.0001)
    let alt = 0
    const single = withStats.length === 1
    return withStats.map(({ route, stats }): RouteView => {
      let badge: Badge = 'alt'
      if (single || (fastestId === greenestId && route.id === fastestId)) badge = 'best'
      else if (route.id === fastestId) badge = 'fastest'
      else if (route.id === greenestId) badge = 'eco'
      if (badge === 'alt') alt += 1
      const title =
        badge === 'best'
          ? isArabic ? 'الأفضل' : 'Best choice'
          : badge === 'fastest'
            ? isArabic ? 'الأسرع' : 'Fastest'
            : badge === 'eco'
              ? isArabic ? 'الأوفر والأنظف' : 'Most efficient'
              : isArabic ? `بديل ${alt}` : `Alternative ${alt}`
      const tagline =
        badge === 'best'
          ? isArabic ? 'أسرع وأقل استهلاكاً' : 'Quickest and lowest consumption'
          : badge === 'fastest'
            ? isArabic ? 'أقل وقت في الطريق' : 'Least time on the road'
            : badge === 'eco'
              ? isArabic ? 'أقل وقود وانبعاثات' : 'Lowest fuel and emissions'
              : isArabic ? 'مسار آخر متاح' : 'Another available path'
      return {
        route,
        badge,
        title,
        tagline,
        stats,
        co2VsWorstPct: Math.round(((worstCo2 - stats.co2Kg) / worstCo2) * 100),
      }
    })
  }, [liveRoutes, vehicle, isArabic])

  const defaultSelectedId = useMemo(() => {
    const pick = views.find((v) => v.badge === 'best') ?? views.find((v) => v.badge === 'eco') ?? views[0]
    return pick?.route.id ?? null
  }, [views])
  const effectiveSelectedId = views.some((v) => v.route.id === selectedRouteId) ? selectedRouteId : defaultSelectedId
  const selectedView = views.find((v) => v.route.id === effectiveSelectedId) ?? null
  const selectedRoute = selectedView?.route ?? null
  const yearly = useMemo(
    () => projectYearlyImpact(selectedView?.stats.costJOD ?? 0, selectedView?.stats.co2Kg ?? 0),
    [selectedView],
  )

  /* ── map ── */
  const mapEl = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const tileRef = useRef<L.LayerGroup | null>(null)
  const markerARef = useRef<L.Marker | null>(null)
  const markerBRef = useRef<L.Marker | null>(null)
  const routeLayerRef = useRef<L.LayerGroup | null>(null)
  const routeLinesRef = useRef<Map<string, { casing: L.Polyline; line: L.Polyline }>>(new Map())
  const panelRef = useRef<HTMLElement>(null)

  const originRef = useRef(origin)
  const destRef = useRef(destination)
  useEffect(() => {
    originRef.current = origin
    destRef.current = destination
  }, [origin, destination])

  const setPoint = useCallback((which: 'origin' | 'destination', p: LocationPoint | null) => {
    if (which === 'origin') setOrigin(p)
    else setDestination(p)
    if (p) saveRecentLocation({ display: p.display, lat: p.lat, lng: p.lng, savedAt: Date.now() })
    setSelectedRouteId(null)
    setBriefing(null)
  }, [])

  const setPointFromMap = useCallback(
    async (which: 'origin' | 'destination', lat: number, lng: number) => {
      const placeholder = `${lat.toFixed(5)}, ${lng.toFixed(5)}`
      setPoint(which, { display: placeholder, lat, lng })
      const display = await reverseGeocodeName(lat, lng)
      const current = which === 'origin' ? originRef.current : destRef.current
      if (current && current.lat === lat && current.lng === lng) setPoint(which, { display, lat, lng })
    },
    [setPoint],
  )

  const mapActionRef = useRef(setPointFromMap)
  useEffect(() => {
    mapActionRef.current = setPointFromMap
  }, [setPointFromMap])

  // create the map once
  useEffect(() => {
    if (!mapEl.current || mapRef.current) return
    const map = L.map(mapEl.current, {
      center: MAP_DEFAULT_CENTER,
      zoom: 12,
      zoomControl: false,
      attributionControl: true,
      worldCopyJump: true,
    })
    map.attributionControl.setPrefix(false)
    routeLayerRef.current = L.layerGroup().addTo(map)
    map.on('click', (e: L.LeafletMouseEvent) => {
      const which = !originRef.current ? 'origin' : 'destination'
      void mapActionRef.current(which, e.latlng.lat, e.latlng.lng)
    })
    mapRef.current = map
    const linesAtMount = routeLinesRef.current
    return () => {
      map.remove()
      mapRef.current = null
      tileRef.current = null
      markerARef.current = null
      markerBRef.current = null
      routeLayerRef.current = null
      linesAtMount.clear()
    }
  }, [])

  // tiles follow the theme
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    tileRef.current?.remove()
    const set = isDark ? TILESETS.dark : TILESETS.light
    // keepBuffer + updateWhenIdle:false keep neighbouring tiles loaded so panning never exposes empty (black) areas.
    const opts = { maxNativeZoom: 16, maxZoom: 19, keepBuffer: 4, updateWhenIdle: false, updateInterval: 100 }
    // Dark mode: base tiles are blended over a deep emerald-black background (cheap alpha compositing, no CSS filters).
    const base = L.tileLayer(set.base, { ...opts, attribution: ATTRIBUTION, className: 'gd-tiles-base', opacity: isDark ? 0.4 : 1 })
    const labels = L.tileLayer(set.labels, { ...opts, className: 'gd-tiles-labels', pane: 'shadowPane' })
    tileRef.current = L.layerGroup([base, labels]).addTo(map)
    base.bringToBack()
  }, [isDark])

  const fitPadding = useCallback(() => {
    const panel = panelRef.current
    const desktop = window.matchMedia('(min-width: 1024px)').matches
    const w = panel?.offsetWidth ?? 0
    const h = panel?.offsetHeight ?? 0
    if (desktop) {
      const side = w + 56
      return isArabic
        ? { paddingTopLeft: L.point(48, 48), paddingBottomRight: L.point(side, 48) }
        : { paddingTopLeft: L.point(side, 48), paddingBottomRight: L.point(48, 48) }
    }
    return { paddingTopLeft: L.point(32, 72), paddingBottomRight: L.point(32, Math.min(h, window.innerHeight * 0.6) + 24) }
  }, [isArabic])

  // markers (draggable)
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    const sync = (
      ref: React.MutableRefObject<L.Marker | null>,
      point: LocationPoint | null,
      which: 'origin' | 'destination',
      label: 'A' | 'B',
    ) => {
      if (!point) {
        ref.current?.remove()
        ref.current = null
        return
      }
      if (!ref.current) {
        const m = L.marker([point.lat, point.lng], { icon: pinIcon(label), draggable: true, keyboard: false, autoPan: true }).addTo(map)
        m.on('dragend', () => {
          const ll = m.getLatLng()
          void mapActionRef.current(which, ll.lat, ll.lng)
        })
        ref.current = m
      } else {
        ref.current.setLatLng([point.lat, point.lng])
      }
    }
    sync(markerARef, origin, 'origin', 'A')
    sync(markerBRef, destination, 'destination', 'B')
  }, [origin, destination])

  // fit view to points while no routes are drawn
  useEffect(() => {
    const map = mapRef.current
    if (!map || views.length > 0) return
    if (origin && destination) {
      map.fitBounds(L.latLngBounds([origin.lat, origin.lng], [destination.lat, destination.lng]), { ...fitPadding(), maxZoom: 15, animate: true })
    } else if (origin || destination) {
      const p = (origin ?? destination)!
      map.flyTo([p.lat, p.lng], Math.max(map.getZoom(), 14), { duration: 0.6 })
    }
  }, [origin, destination, views.length, fitPadding])

  // draw routes
  useEffect(() => {
    const map = mapRef.current
    const group = routeLayerRef.current
    if (!map || !group) return
    group.clearLayers()
    routeLinesRef.current.clear()
    if (liveRoutes.length === 0) return
    const all: L.LatLngTuple[] = []
    liveRoutes.forEach((r) => {
      const pts = (r.polyline ?? []).map((p): L.LatLngTuple => [p.lat, p.lng])
      pts.forEach((p) => all.push(p))
      const casing = L.polyline(pts, { color: '#000', weight: 9, opacity: 0.3, lineJoin: 'round', lineCap: 'round', interactive: false })
      const line = L.polyline(pts, { color: '#36FF97', weight: 5, opacity: 0.4, lineJoin: 'round', lineCap: 'round' })
      line.on('click', (e: L.LeafletMouseEvent) => {
        L.DomEvent.stopPropagation(e)
        setSelectedRouteId(r.id)
      })
      group.addLayer(casing)
      group.addLayer(line)
      routeLinesRef.current.set(r.id, { casing, line })
    })
    if (all.length) map.fitBounds(L.latLngBounds(all), { ...fitPadding(), animate: true })
  }, [liveRoutes, fitPadding])

  // highlight the selected route
  useEffect(() => {
    routeLinesRef.current.forEach(({ casing, line }, id) => {
      const on = id === effectiveSelectedId
      line.setStyle({ color: on ? '#36FF97' : isDark ? '#7a9a8a' : '#64748b', weight: on ? 6 : 4, opacity: on ? 1 : 0.55 })
      casing.setStyle({ weight: on ? 11 : 8, opacity: on ? 0.4 : 0.2 })
      if (on) {
        casing.bringToFront()
        line.bringToFront()
      }
    })
  }, [effectiveSelectedId, liveRoutes, isDark])

  const fitAll = () => {
    const map = mapRef.current
    if (!map) return
    const pts: L.LatLngTuple[] = []
    const selectedPolyline = selectedRoute?.polyline
    if (selectedPolyline?.length) selectedPolyline.forEach((p) => pts.push([p.lat, p.lng]))
    else {
      if (origin) pts.push([origin.lat, origin.lng])
      if (destination) pts.push([destination.lat, destination.lng])
    }
    if (pts.length > 1) map.fitBounds(L.latLngBounds(pts), { ...fitPadding(), animate: true })
    else map.setView(pts[0] ?? MAP_DEFAULT_CENTER, pts[0] ? 14 : 12, { animate: true })
  }

  /* ── AI briefing ── */
  const handleAnalyzeRoute = async (view: RouteView) => {
    if (analysisLoadingId) return
    analysisAbortRef.current?.abort()
    const ctrl = new AbortController()
    analysisAbortRef.current = ctrl

    const { route, stats } = view
    setIsCopilotOpen(true)
    if (!AI_CONFIGURED) {
      setBriefing(localBriefing(view, views, vehicle, isArabic))
      return
    }
    setAnalysisLoadingId(route.id)

    const distKm = Math.max(route.distanceKm || 0, 0.1)
    const ascentM = route.ascentM ?? 0
    const ascentKnown = route.ascentStatus === 'measured'
    const yearly = projectYearlyImpact(stats.costJOD || 0, stats.co2Kg || 0)
    const fuelDisplay = stats.fuelLiters != null ? `${stats.fuelLiters.toFixed(2)} L` : stats.label

    const payload = `Analyze this ${view.title} route:
- Distance: ${distKm.toFixed(1)} km
- Time: ${route.durationMin ?? 0} min (no live traffic data)
- Energy/Fuel: ${fuelDisplay}
- Cost: ${stats.costJODStr} JOD
- CO2: ${stats.co2Kg.toFixed(2)} kg
- Ascent: ${ascentKnown ? `${ascentM} m (measured from elevation samples)` : 'UNKNOWN — elevation data was unavailable, so the energy/fuel/CO2/cost above assume flat terrain. State this limitation briefly and do not discuss hills.'}

Yearly projection if driven daily (250 days): ${yearly.jod} JOD and ${yearly.co2} kg CO2 per year, equal to the absorption of about ${yearly.trees} mature trees.

Provide a 2-3 sentence, high-accuracy briefing of its pros/cons for this Jordan trip. Use only the provided numbers. Mention Amman terrain if ascent > 100m.`

    const metrics: CopilotRouteMetrics = {
      fuelSavedLiters: (stats.fuelLiters ?? parseFloat(stats.label)) || 0,
      ascentM,
      estJodSaved: stats.costJOD || 0,
      selectedRouteId: route.id,
      distanceKm: distKm,
    }

    try {
      const reply = await sendGeminiMessage(payload, {
        firstName: profile?.firstName,
        vehicleType: vehicle,
        locale,
        destination: destination?.display,
        hasActiveRoute: true,
        activeRouteData: { type: view.title, distance: `${distKm.toFixed(1)} km`, duration: `${route.durationMin ?? 0} min` },
        copilotRouteMetrics: metrics,
      })
      if (ctrl.signal.aborted) return
      setBriefing(reply)
      setAnalysisMetrics(metrics)
    } catch {
      /* the briefing is optional; the rest of the page keeps working */
    } finally {
      if (!ctrl.signal.aborted) setAnalysisLoadingId(null)
    }
  }

  /* ── render ── */
  const hint = !origin
    ? isArabic ? 'انقر على الخريطة لتحديد نقطة الانطلاق (A)' : 'Click the map to set your start (A)'
    : !destination
      ? isArabic ? 'انقر على الخريطة لتحديد الوجهة (B)' : 'Click the map to set your destination (B)'
      : null

  return (
    <div dir={isArabic ? 'rtl' : 'ltr'} className="relative h-svh w-full overflow-hidden bg-[#eef2f1] text-zinc-900 dark:bg-onyx dark:text-white">
      <div ref={mapEl} className="gd-map absolute inset-0 z-0" />

      {/* Left panel (bottom sheet on small screens) */}
      <aside
        ref={panelRef}
        className="absolute inset-x-3 bottom-3 z-[1000] flex max-h-[58svh] flex-col rounded-3xl border border-black/10 bg-white/95 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.55)] backdrop-blur-xl dark:border-white/12 dark:bg-[#0a0f0d]/95 lg:inset-x-auto lg:bottom-auto lg:top-4 lg:max-h-[calc(100svh-2rem)] lg:w-[25.5rem] lg:start-4"
      >
        <div className="flex items-center justify-between gap-3 px-4 pt-4 pb-3">
          <Link
            to="/"
            aria-label={isArabic ? 'العودة إلى الصفحة الرئيسية' : 'Back to home'}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-black/10 text-zinc-700 transition hover:border-toxic/60 hover:text-toxic dark:border-white/12 dark:text-white/80"
          >
            {Icon.back}
          </Link>
          <BrandLogo wordmarkClassName="text-base" />
          <span className="w-9" aria-hidden />
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 pb-4">
          <div>
            <h1 className="font-heading text-lg font-extrabold text-zinc-950 dark:text-white">
              {isArabic ? 'خطط رحلتك' : 'Plan your trip'}
            </h1>
            <p className="mt-0.5 text-xs text-zinc-500 dark:text-white/45">
              {isArabic ? 'قارن المسارات حسب الوقت والوقود والتكلفة والانبعاثات.' : 'Compare routes by time, fuel, cost and CO₂.'}
            </p>
          </div>

          <SmartLocationInput
            origin={origin}
            destination={destination}
            onOriginChange={(p) => setPoint('origin', p)}
            onDestinationChange={(p) => setPoint('destination', p)}
            favorites={user ? savedLocations : []}
            onSaveLocation={
              user
                ? (p) => void saveLocation({ label: p.display.split(',')[0] ?? p.display, address: p.display, lat: p.lat, lng: p.lng })
                : undefined
            }
            labels={{
              from: isArabic ? 'من' : 'From',
              to: isArabic ? 'إلى' : 'To',
              fromPlaceholder: isArabic ? 'ابحث أو انقر على الخريطة' : 'Search or click the map',
              toPlaceholder: isArabic ? 'إلى أين؟' : 'Where to?',
            }}
          />

          <div>
            <p className="mb-1.5 text-[11px] font-semibold text-zinc-600 dark:text-white/55">{t('vehicle.title')}</p>
            <div className="grid grid-cols-4 gap-1 rounded-xl border border-black/10 bg-black/[0.04] p-1 dark:border-white/10 dark:bg-white/[0.04]">
              {VEHICLES.map((v) => (
                <button
                  key={v}
                  type="button"
                  aria-pressed={vehicle === v}
                  onClick={() => setVehicle(v)}
                  className={`rounded-lg px-1 py-2 text-[11px] font-semibold transition ${
                    vehicle === v
                      ? 'bg-toxic text-onyx shadow-[0_6px_16px_-8px_rgba(54,255,151,0.9)]'
                      : 'text-zinc-600 hover:text-zinc-900 dark:text-white/60 dark:hover:text-white'
                  }`}
                >
                  {t(`vehicle.${v}` as 'vehicle.petrol')}
                </button>
              ))}
            </div>
          </div>

          {!hasBoth && (
            <ol className="space-y-2.5 rounded-2xl border border-dashed border-toxic/35 bg-toxic/[0.05] p-3.5">
              {(isArabic
                ? ['حدّد نقطة الانطلاق (A) بالبحث أو بالنقر على الخريطة', 'حدّد الوجهة (B)', 'قارن المسارات حسب الوقت والوقود والتكلفة والانبعاثات']
                : ['Set your start (A) by searching or clicking the map', 'Set your destination (B)', 'Compare routes by time, fuel, cost and CO₂']
              ).map((step, i) => (
                <li key={step} className="flex items-start gap-3 text-xs text-zinc-700 dark:text-white/70">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-toxic/20 text-[11px] font-extrabold text-emerald-700 dark:text-toxic">{i + 1}</span>
                  <span className="pt-0.5 leading-relaxed">{step}</span>
                </li>
              ))}
            </ol>
          )}

          {/* results */}
          {directions.status === 'loading' && (
            <div>
              <p className="mb-2 flex items-center gap-2 text-xs font-semibold text-emerald-700 dark:text-toxic">
                <span className="h-2 w-2 animate-pulse rounded-full bg-toxic" />
                {isArabic ? 'جاري حساب المسارات…' : 'Calculating routes…'}
              </p>
              <RouteSkeleton />
            </div>
          )}

          {directions.status === 'error' && (
            <div role="alert" className="rounded-2xl border border-amber-400/40 bg-amber-400/10 p-3.5 text-xs leading-relaxed text-amber-800 dark:text-amber-200">
              <p className="font-bold">
                {directions.message === 'NO_ROUTE'
                  ? isArabic ? 'لا يوجد مسار بين النقطتين' : 'No road route between these points'
                  : isArabic ? 'تعذّر حساب المسارات الآن' : 'Could not calculate routes right now'}
              </p>
              <p className="mt-1">
                {directions.message === 'NO_ROUTE'
                  ? isArabic ? 'جرّب تحريك الدبوس إلى طريق قريب.' : 'Try moving a pin onto a nearby road.'
                  : isArabic ? 'تحقق من الاتصال بالإنترنت ثم أعد المحاولة.' : 'Check your connection and try again.'}
              </p>
              <button
                type="button"
                onClick={fetchRoutes}
                className="mt-2.5 rounded-lg border border-amber-500/50 px-3 py-1.5 font-bold transition hover:bg-amber-400/20"
              >
                {isArabic ? 'إعادة المحاولة' : 'Try again'}
              </button>
            </div>
          )}

          {views.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-semibold text-zinc-600 dark:text-white/55">
                {isArabic ? `${views.length} ${views.length === 1 ? 'مسار' : 'مسارات'}` : `${views.length} ${views.length === 1 ? 'route' : 'routes'} found`}
              </p>
              {views.map((v) => (
                <RouteCard
                  key={v.route.id}
                  view={v}
                  selected={v.route.id === effectiveSelectedId}
                  analyzing={analysisLoadingId === v.route.id}
                  isArabic={isArabic}
                  vehicle={vehicle}
                  onSelect={() => setSelectedRouteId(v.route.id)}
                  onAnalyze={() => void handleAnalyzeRoute(v)}
                />
              ))}
              {selectedView && (
                <div className="rounded-2xl border border-toxic/25 bg-toxic/[0.06] p-3.5">
                  <p className="text-[11px] font-bold text-emerald-700 dark:text-toxic">
                    {isArabic ? 'لو كررت هذه الرحلة يومياً (250 يوم عمل)' : 'If you drive this trip daily (250 working days)'}
                  </p>
                  <p className="mt-1 text-sm font-bold text-zinc-900 dark:text-white" dir="ltr">
                    {yearly.jod} {isArabic ? 'دينار' : 'JOD'} · {yearly.co2} {isArabic ? 'كغ' : 'kg'} CO₂
                  </p>
                  <p className="mt-0.5 text-[11px] text-zinc-500 dark:text-white/45">
                    {isArabic ? `يعادل امتصاص نحو ${yearly.trees} شجرة ناضجة سنوياً` : `Equal to what about ${yearly.trees} mature trees absorb per year`}
                  </p>
                </div>
              )}
              <p className="text-[10px] leading-relaxed text-zinc-400 dark:text-white/30">
                {isArabic
                  ? 'تقديرات تعتمد على المسافة والارتفاع ونوع المركبة، بدون بيانات ازدحام مباشرة. الخرائط: OpenStreetMap · الارتفاع: Open-Meteo.'
                  : 'Estimates from distance, elevation and vehicle type — no live traffic. Maps: OpenStreetMap · Elevation: Open-Meteo.'}
              </p>
            </div>
          )}
        </div>
      </aside>

      {/* Map controls */}
      <div className="absolute end-4 top-4 z-[1000] flex flex-col gap-2">
        <MapButton label={isArabic ? 'تكبير' : 'Zoom in'} onClick={() => mapRef.current?.zoomIn()}>{Icon.plus}</MapButton>
        <MapButton label={isArabic ? 'تصغير' : 'Zoom out'} onClick={() => mapRef.current?.zoomOut()}>{Icon.minus}</MapButton>
        <MapButton label={isArabic ? 'عرض المسار كاملاً' : 'Fit to route'} onClick={fitAll}>{Icon.fit}</MapButton>
      </div>

      {hint && (
        <div className="pointer-events-none absolute inset-x-0 top-4 z-[1000] flex justify-center px-16 lg:px-0">
          <p className="rounded-full border border-black/10 bg-white/90 px-4 py-2 text-center text-xs font-semibold text-zinc-800 shadow-lg backdrop-blur-md dark:border-white/12 dark:bg-zinc-900/85 dark:text-white">
            {hint}
          </p>
        </div>
      )}

      <GeminiCopilot
        isOpen={isCopilotOpen}
        onOpenChange={setIsCopilotOpen}
        selectedRoute={selectedRoute}
        destination={destination?.display}
        hasActiveRoute={!!selectedRoute}
        activeRouteData={
          selectedView
            ? {
                type: selectedView.title,
                distance: `${selectedView.route.distanceKm.toFixed(1)} km`,
                duration: `${selectedView.route.durationMin} min`,
              }
            : undefined
        }
        isDark={isDark}
        briefing={briefing}
        metrics={analysisMetrics}
        currentCharge={localCharge}
      />
    </div>
  )
}
