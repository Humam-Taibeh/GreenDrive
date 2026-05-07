import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Bot, Crosshair, MapPin, Radar } from 'lucide-react'
import { Link } from 'react-router-dom'
import { BrandLogo } from '../components/brand/BrandLogo'
import { SmartLocationInput } from '../components/cards/SmartLocationInput'
import { GeminiCopilot } from '../components/copilot/GeminiCopilot'
import type { LocationPoint } from '../components/cards/SmartLocationInput'
import { useLocale } from '../contexts/LocaleContext'
import { useTheme } from '../contexts/ThemeContext'
import { useAuth } from '../contexts/AuthContext'
import { useSavedLocations } from '../hooks/useSavedLocations'
import { getCurrentPosition, saveRecentLocation } from '../hooks/useReverseGeocode'
import { useDirectionsRoutes } from '../lib/useDirectionsRoutes'
import { 
  computeTripEmissions, 
  calculateTrafficWaste, 
  projectYearlyImpact 
} from '../lib/vehicleProfiles'
import type { VehicleType } from '../lib/vehicleProfiles'
import type { RouteOption } from '../types'
import {
  sendGeminiMessage,
  type CopilotRouteMetrics,
} from '../services/gemini'

const MAP_DEFAULT_CENTER = { lat: 31.9539, lng: 35.9106 }
const ROUTE_COLORS = ['#36FF97', '#7CFFC4', '#B8FFE0']

const ICON_SIZE = 14
const ICON_STROKE = 1.5


const CalculateButton = memo(function CalculateButton({ onClick, disabled, loading, isDark }: { onClick: () => void; disabled: boolean; loading: boolean; isDark: boolean }) {
  const { t } = useLocale()
  
  const bgStyle = isDark 
    ? 'bg-toxic text-onyx shadow-[0_0_28px_-10px_rgba(54,255,151,0.7)] hover:shadow-[0_0_42px_-8px_rgba(54,255,151,0.85)]' 
    : 'bg-emerald-600 text-white shadow-lg hover:bg-emerald-700 shadow-emerald-600/20'

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className={`w-full rounded-xl border border-transparent px-5 py-3 text-sm font-black uppercase tracking-wider transition-all duration-300 disabled:opacity-45 ${bgStyle}`}
    >
      {loading ? t('map.load') : t('map.analyze')}
    </button>
  )
})

const RouteCard = memo(function RouteCard({
  route,
  selected,
  onSelect,
  onAnalyze,
  color,
  isDark,
  analyzing
}: {
  route: RouteOption & { categoryTitle: string; descriptor: string }
  selected: boolean
  onSelect: () => void
  onAnalyze: () => void
  color: string
  isDark: boolean
  analyzing?: boolean
}) {
  const { t } = useLocale()
  const isOptimal = route.categoryTitle.includes('Optimal') || route.categoryTitle.includes('الأمثل')
  
  // Refined border and background based on theme
  const borderStyle = selected
    ? isOptimal
      ? 'border-amber-400 bg-amber-400/10 ring-2 ring-amber-400 shadow-[0_0_30px_-14px_rgba(251,191,36,0.75)]'
      : 'border-toxic bg-toxic/10 ring-2 ring-toxic shadow-[0_0_30px_-14px_rgba(54,255,151,0.75)]'
    : isOptimal
      ? `border-amber-400/30 ${isDark ? 'bg-amber-400/[0.03]' : 'bg-amber-50/40'} hover:border-amber-400/50 hover:ring-1 hover:ring-amber-400/40`
      : `${isDark ? 'border-white/12 bg-white/[0.04]' : 'border-black/10 bg-black/[0.02]'} hover:border-toxic/40 hover:ring-1 hover:ring-toxic/30`

  const textPrimary = isDark ? 'text-white' : 'text-zinc-900'
  const textSecondary = isDark ? 'text-white/60' : 'text-zinc-500'
  const textMuted = isDark ? 'text-white/40' : 'text-zinc-400'

  return (
    <div
      className={`relative w-full cursor-pointer rounded-xl border p-3 transition-all duration-300 ${borderStyle}`}
      onClick={onSelect}
    >
      <div className="flex flex-wrap items-start justify-between gap-x-2 gap-y-1">
        <div className="flex flex-col items-start gap-1">
          <p className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-tighter ${isOptimal ? 'text-amber-500' : isDark ? 'text-white/90' : 'text-zinc-800'}`}>
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
            {route.categoryTitle}
          </p>
          {isOptimal && (
            <span className="text-[9px] font-mono text-amber-500/70 normal-case tracking-normal">
              ⚡ {t('map.fastGreenest')}
            </span>
          )}
        </div>
        <span className={`text-[10px] font-mono ${textMuted} whitespace-nowrap`}>
          {route.descriptor}
        </span>
      </div>
      <div className="mt-3 space-y-2">
        <div className="flex items-baseline justify-between gap-1">
          <p className={`text-base font-bold ${textPrimary}`}>{route.durationMin} min</p>
          <p className={`text-xs font-mono ${textSecondary}`}>{route.distanceKm.toFixed(1)} km</p>
        </div>
        <button
          type="button"
          disabled={analyzing}
          onClick={(e) => { e.stopPropagation(); onAnalyze(); }}
          className={`flex w-full items-center justify-center gap-1.5 rounded-lg py-2.5 text-[10px] font-black uppercase tracking-widest transition ${
            isDark 
              ? 'bg-white/5 text-white hover:bg-white/10' 
              : 'bg-zinc-100 text-zinc-900 hover:bg-zinc-200'
          } ${analyzing ? 'opacity-50 cursor-wait' : ''}`}
        >
          <Bot size={12} className={analyzing ? 'animate-pulse text-toxic' : isDark ? 'text-toxic' : 'text-emerald-600'} />
          {analyzing ? t('cop.thinking') : t('map.moreDetails')}
        </button>
      </div>
    </div>
  )
})

/** Placeholder card for when Google Maps can't produce a 3rd alternative path */
const PlaceholderCard = memo(function PlaceholderCard({ slotLabel }: { slotLabel: string }) {
  const { t } = useLocale()
  return (
    <div className="relative w-full rounded-xl border border-black/5 bg-black/[0.02] p-3 opacity-50 dark:border-white/6 dark:bg-white/[0.02]">
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-2 text-xs font-black uppercase tracking-tighter text-zinc-400 dark:text-white/30">
          <span className="h-2 w-2 rounded-full bg-zinc-200 dark:bg-white/20" />
          {slotLabel}
        </p>
        <span className="text-[10px] font-mono text-zinc-400 dark:text-white/20">{t('map.unavailable')}</span>
      </div>
      <div className="mt-3 space-y-2">
        <p className="text-xs text-zinc-400 dark:text-white/25 font-mono leading-relaxed">
          {t('map.noRoute')}
        </p>
        <div className="flex w-full items-center justify-center rounded-lg border border-black/8 py-2.5 text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-white/20">
          {t('map.sectorLocked')}
        </div>
      </div>
    </div>
  )
})


export function MapViewPage() {
  const { t, locale } = useLocale()
  const { resolvedTheme } = useTheme()
  const { profile } = useAuth()
  const { savedLocations, saveLocation } = useSavedLocations()
  const isArabic = locale === 'ar'
  const isDark = resolvedTheme === 'dark' || document.documentElement.classList.contains('dark')

  const [activeTab, setActiveTab] = useState<'planner' | 'results' | 'saved'>('planner')
  const [clickMode, setClickMode] = useState<'origin' | 'destination'>('origin')
  
  // ⚡ THEME SYNC: Sync HTML class with resolvedTheme for MapView sub-components
  useEffect(() => {
    const root = document.documentElement
    if (resolvedTheme === 'dark') root.classList.add('dark')
    else root.classList.remove('dark')
  }, [resolvedTheme])
  const [vehicle, setVehicle] = useState<VehicleType>((profile?.vehicleType as VehicleType) || 'petrol')
  
  // Sync vehicle type if profile updates (e.g. after registration)
  useEffect(() => {
    if (profile?.vehicleType) {
      setVehicle(profile.vehicleType as VehicleType)
    }
  }, [profile?.vehicleType])
  const [origin, setOrigin] = useState<LocationPoint | null>(null)
  const [destination, setDestination] = useState<LocationPoint | null>(null)
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null)
  const [analyzeTriggered, setAnalyzeTriggered] = useState(false)
  const [mapReady, setMapReady] = useState(false)
  const [mapError, setMapError] = useState<string | null>(null)
  const [myLocationBusy, setMyLocationBusy] = useState(false)
  const [isCopilotOpen, setIsCopilotOpen] = useState(false)
  const [briefing, setBriefing] = useState<string | null>(null)
  const [analysisLoadingId, setAnalysisLoadingId] = useState<string | null>(null)
  const [analysisMetrics, setAnalysisMetrics] = useState<any>(null)
  const [localCharge, setLocalCharge] = useState<number>(() => {
    try {
      const s = localStorage.getItem('gd-charge')
      return s ? parseInt(s, 10) : 85
    } catch { return 85 }
  })
  const analysisAbortRef = useRef<AbortController | null>(null)

  // Sync local charge if profile updates
  useEffect(() => {
    if (profile?.currentChargePercent !== undefined) {
      setLocalCharge(profile.currentChargePercent)
    }
  }, [profile?.currentChargePercent])

  // Listen for local storage changes (from Navbar settings)
  useEffect(() => {
    const handleStorage = () => {
      const s = localStorage.getItem('gd-charge')
      if (s) setLocalCharge(parseInt(s))
    }
    window.addEventListener('storage', handleStorage)
    // Custom event if Navbar uses dispatchEvent for same-tab sync
    window.addEventListener('gd-charge-update', handleStorage as any)
    return () => {
      window.removeEventListener('storage', handleStorage)
      window.removeEventListener('gd-charge-update', handleStorage as any)
    }
  }, [])

  const mapEl = useRef<HTMLDivElement>(null)
  const mapRef = useRef<google.maps.Map | null>(null)
  const geocoderRef = useRef<google.maps.Geocoder | null>(null)
  const markerARef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null)
  const markerBRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null)
  const routePolysRef = useRef<google.maps.Polyline[]>([])
  const ghostPolyRef = useRef<google.maps.Polyline | null>(null)
  const analyzeRef = useRef<() => void>(() => {})

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY?.trim()

  const originMemo = useMemo(() => origin ? { lat: origin.lat, lng: origin.lng } : null, [origin?.lat, origin?.lng])
  const destMemo = useMemo(() => destination ? { lat: destination.lat, lng: destination.lng } : null, [destination?.lat, destination?.lng])

  const directions = useDirectionsRoutes(
    originMemo,
    destMemo,
    vehicle,
  )

  // Priority: Re-fetch routes immediately if vehicle changes while results are active
  useEffect(() => {
    if (analyzeTriggered && origin && destination) {
      directions.fetchRoutes()
    }
  }, [vehicle, analyzeTriggered, origin, destination, directions.fetchRoutes])

  const mapOptions = useMemo((): google.maps.MapOptions => {
    return {
      center: MAP_DEFAULT_CENTER,
      zoom: 12,
      disableDefaultUI: true,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      clickableIcons: false,
      backgroundColor: isDark ? '#17263c' : '#F3F5F7',
      // Advanced Markers REQUIRE a mapId. custom 'styles' cannot be used with mapId.
      // We use the native colorScheme instead for modern dark mode support.
      mapId: import.meta.env.VITE_GOOGLE_MAP_ID || 'DEMO_MAP_ID',
      colorScheme: isDark ? 'DARK' : 'LIGHT',
    };
  }, [isDark])

  const liveRoutes = useMemo<RouteOption[]>(
    () => (directions.status === 'ok' ? directions.routes : []),
    [directions],
  )

  const categorizedRoutes = useMemo(() => {
    if (liveRoutes.length === 0) return []

    const routesWithMetrics = liveRoutes.map(r => {
      const stats = computeTripEmissions(Math.max(r.distanceKm || 0, 0.1), r.ascentM ?? 60, 0.85, vehicle)
      return {
        ...r,
        fuelVolume: (stats.fuelLiters ?? parseFloat(stats.label)) || 0,
        cost: stats.costJOD || 0
      }
    })

    const minTime = Math.min(...routesWithMetrics.map(r => r.durationMin))
    const minFuel = Math.min(...routesWithMetrics.map(r => r.fuelVolume))

    const timeTied = routesWithMetrics.filter(r => r.durationMin === minTime)
    const fuelTied = routesWithMetrics.filter(r => r.fuelVolume === minFuel)

    const fastestWinnerId = timeTied.reduce((best, r) =>
      r.fuelVolume < best.fuelVolume ? r : best
    , timeTied[0]!).id

    const greenestWinnerId = fuelTied.reduce((best, r) =>
      r.durationMin < best.durationMin ? r : best
    , fuelTied[0]!).id

    const isOptimal = fastestWinnerId === greenestWinnerId

    const assignedExclusive = new Set<string>()
    let alternativeCount = 0

    return routesWithMetrics.map(r => {
      const isTheFastest = r.id === fastestWinnerId
      const isTheGreenest = r.id === greenestWinnerId

      let titleKey = 'map.balanced'
      let descKey = 'map.descBalanced'

      if (isOptimal && isTheFastest) {
        if (!assignedExclusive.has('optimal')) {
          titleKey = 'map.optimal'
          descKey = 'map.descOptimal'
          assignedExclusive.add('optimal')
        } else {
          alternativeCount++
        }
      } else if (isTheFastest) {
        if (!assignedExclusive.has('fastest')) {
          titleKey = 'map.fastest'
          descKey = 'map.descFastest'
          assignedExclusive.add('fastest')
        } else {
          alternativeCount++
        }
      } else if (isTheGreenest) {
        if (!assignedExclusive.has('eco')) {
          titleKey = 'map.ecoFriendly'
          descKey = 'map.descEco'
          assignedExclusive.add('eco')
        } else {
          alternativeCount++
        }
      } else {
        alternativeCount++
      }

      const baseTitle = t(titleKey as any)
      const finalTitle = (titleKey === 'map.balanced' && alternativeCount > 1)
        ? `${baseTitle} ${alternativeCount}`
        : baseTitle

      return {
        ...r,
        categoryTitle: finalTitle,
        descriptor: t(descKey as any)
      }
    })
  }, [liveRoutes, vehicle, t])

  const handleAnalyzeRoute = async (route: any) => {
    if (analysisLoadingId) return
    analysisAbortRef.current?.abort()
    const ctrl = new AbortController()
    analysisAbortRef.current = ctrl

    setAnalysisLoadingId(route.id)
    setIsCopilotOpen(true)

    const distKm = Math.max(route.distanceKm || 0, 0.1)
    const ascentM = route.ascentM ?? 60
    const stats = computeTripEmissions(distKm, ascentM, 0.85, vehicle)
    const waste = calculateTrafficWaste(route.durationMin || 0, route.staticDurationMin ?? route.durationMin ?? 0, vehicle)
    const yearly = projectYearlyImpact(stats.costJOD || 0, stats.co2Kg || 0)

    const fuelDisplay = stats.fuelLiters != null ? `${stats.fuelLiters.toFixed(2)} L` : stats.label
    const costDisplay = stats.costJODStr || '0.00'
    const co2Display = (stats.co2Kg || 0).toFixed(2)

    const payload = `Analyze this ${route.categoryTitle ?? 'route'}:
- Distance: ${distKm.toFixed(1)} km
- Time: ${route.durationMin ?? 0} min
- Energy/Fuel: ${fuelDisplay}
- Cost: ${costDisplay} JOD
- CO2: ${co2Display} kg
- Ascent: ${ascentM} m

TACTICAL SUSTAINABILITY METRICS (Yearly/Traffic):
- Yearly Projection: If taken daily, this trip costs ${yearly.jod} JOD/year and emits ${yearly.co2} kg CO2.
- Bio-Equivalent: Equal to the absorption capacity of ${yearly.trees} mature trees per year.
${waste ? `- Traffic Waste: You are losing ${waste.jodStr} JOD specifically to idling and congestion on this corridor.` : '- Flow: This route has minimal traffic delay penalty.'}

Provide a 2-3 sentence, high-accuracy tactical briefing of its pros/cons for this Jordan trip. Use only the provided numbers. Mention Amman terrain if ascent > 100m.`

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
        locale: locale as any,
        destination: destination?.display,
        hasActiveRoute: true,
        activeRouteData: {
          type: route.categoryTitle ?? 'Route',
          distance: `${distKm.toFixed(1)} km`,
          duration: `${route.durationMin ?? 0} min`
        },
        copilotRouteMetrics: metrics
      })
      if (ctrl.signal.aborted) return
      setBriefing(reply)
      setAnalysisMetrics(metrics)
    } catch {
    } finally {
      if (!ctrl.signal.aborted) setAnalysisLoadingId(null)
    }
  }

  const hasRealResults = analyzeTriggered && liveRoutes.length > 0
  const selectedRoute =
    liveRoutes.find((r) => r.id === selectedRouteId) ??
    liveRoutes.find((r) => r.id === 'eco') ??
    liveRoutes[0] ??
    null


  const previewStats = useMemo(() => {
    if (!origin || !destination) return null
    const kmPerDegLat = 111
    const avgLat = ((origin.lat + destination.lat) / 2) * (Math.PI / 180)
    const kmPerDegLng = 111 * Math.cos(avgLat)
    const dLat = Math.abs(origin.lat - destination.lat) * kmPerDegLat
    const dLng = Math.abs(origin.lng - destination.lng) * kmPerDegLng
    const straightKm = Math.sqrt(dLat ** 2 + dLng ** 2)
    return {
      distanceKm: Math.max(0.2, Math.round(straightKm * 1.24 * 10) / 10),
      durationMin: Math.max(3, Math.round((straightKm * 1.24 / 38) * 60)),
    }
  }, [origin, destination])


  const reverseGeocode = useCallback(async (latLng: google.maps.LatLng): Promise<string> => {
    if (!geocoderRef.current) return `${latLng.lat().toFixed(5)}, ${latLng.lng().toFixed(5)}`
    return new Promise((resolve) => {
      geocoderRef.current!.geocode({ location: latLng }, (results, status) => {
        if (status === 'OK' && results?.[0]) resolve(results[0].formatted_address.split(',').slice(0, 2).join(',').trim())
        else resolve(`${latLng.lat().toFixed(5)}, ${latLng.lng().toFixed(5)}`)
      })
    })
  }, [])



  const neonMarkerSvg = useCallback((label: 'A' | 'B', accent: string) => {
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='42' height='54' viewBox='0 0 42 54'>
      <defs>
        <filter id='g' x='-50%' y='-50%' width='200%' height='200%'>
          <feGaussianBlur stdDeviation='2.3' result='b'/>
          <feMerge><feMergeNode in='b'/><feMergeNode in='SourceGraphic'/></feMerge>
        </filter>
      </defs>
      <path d='M21 2C11.6 2 4 9.6 4 19c0 13.1 15.2 30.4 16 31.1a1.4 1.4 0 0 0 2 0C22.8 49.4 38 32.1 38 19 38 9.6 30.4 2 21 2Z' fill='${accent}' filter='url(#g)'/>
      <circle cx='21' cy='19' r='7.6' fill='#050706' stroke='rgba(255,255,255,0.22)'/>
      <text x='21' y='22.5' text-anchor='middle' font-size='10' font-family='Inter,Arial' font-weight='700' fill='${accent}'>${label}</text>
    </svg>`
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
  }, [])

  const placeMarker = useCallback((which: 'origin' | 'destination', pos: google.maps.LatLng) => {
    if (!mapRef.current) return
    const ref = which === 'origin' ? markerARef : markerBRef
    const color = which === 'origin' ? '#36FF97' : '#FFFFFF'
    if (ref.current) {
      ref.current.position = pos
      return
    }
    ref.current = new google.maps.marker.AdvancedMarkerElement({
      map: mapRef.current,
      position: pos,
      content: (() => {
        const div = document.createElement('div')
        // AdvancedMarkerElement anchors to bottom-center by default.
        // We ensure the image has no bottom gap by using display: block.
        div.innerHTML = `<img src="${neonMarkerSvg(which === 'origin' ? 'A' : 'B', color)}" style="width:38px; height:48px; display: block;" />`
        return div
      })(),
    })
    // Bounce effect for AdvancedMarkerElement
    const el = ref.current.element as HTMLElement
    el.style.transition = 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
    el.style.transform = 'translateY(-20px)'
    window.setTimeout(() => { el.style.transform = 'translateY(0)' }, 50)
  }, [neonMarkerSvg])

  const clearAllPolys = useCallback(() => {
    routePolysRef.current.forEach((p) => p.setMap(null))
    routePolysRef.current = []
    ghostPolyRef.current?.setMap(null)
    ghostPolyRef.current = null
  }, [])

  useEffect(() => {
    if (!apiKey || !mapEl.current) return
    let cancelled = false
    let clickListener: google.maps.MapsEventListener | null = null
    ;(async () => {
      try {
        const { importLibrary, setOptions } = await import('@googlemaps/js-api-loader')
        if (!(window as any).__gdMapsConfigured) {
          try {
            setOptions({ key: apiKey, v: 'weekly' })
            ;(window as any).__gdMapsConfigured = true
          } catch (e) {
            console.warn('Maps config error:', e)
          }
        }
        const [{ Map }] = await Promise.all([
          importLibrary('maps') as Promise<google.maps.MapsLibrary>,
          importLibrary('places').catch(() => null),
          importLibrary('marker').catch(() => null),
          importLibrary('routes').catch(() => null),
        ])
        if (cancelled || !mapEl.current) return
        const map = new Map(mapEl.current, {
          ...mapOptions,
        })
        mapRef.current = map
        geocoderRef.current = new google.maps.Geocoder()
        const clickModeRef = { current: 'origin' as 'origin' | 'destination' }
        ;(window as unknown as Record<string, unknown>)['__gdClickModeRef'] = clickModeRef
        clickListener = map.addListener('click', async (e: google.maps.MapMouseEvent) => {
          if (!e.latLng) return
          // High-precision coordinate capture for Jordanian constants matching
          const lat = e.latLng.lat()
          const lng = e.latLng.lng()
          const exactLatLng = new google.maps.LatLng(lat, lng)
          
          const mode = clickModeRef.current
          placeMarker(mode, exactLatLng)
          const display = await reverseGeocode(exactLatLng)
          const point = { display, lat, lng }
          
          if (mode === 'origin') {
            setOrigin(point)
            clickModeRef.current = 'destination'
            setClickMode('destination')
          } else {
            setDestination(point)
          }
          setAnalyzeTriggered(false)
          setSelectedRouteId(null)
          clearAllPolys()
        })
        setMapReady(true)
      } catch (e) {
        console.warn(e)
        setMapError('TACTICAL ALERT: map system offline. Check Google Maps credentials.')
      }
    })()
    const markerAAtMount = markerARef.current
    const markerBAtMount = markerBRef.current
    return () => {
      cancelled = true
      if (clickListener) google.maps.event.removeListener(clickListener)
      if (markerAAtMount) markerAAtMount.map = null
      if (markerBAtMount) markerBAtMount.map = null
      mapRef.current = null
      clearAllPolys()
    }
  }, [apiKey, placeMarker, reverseGeocode, clearAllPolys, mapOptions])

  useEffect(() => {
    const ref = (window as unknown as Record<string, unknown>)['__gdClickModeRef'] as { current: 'origin' | 'destination' } | undefined
    if (ref) ref.current = clickMode
  }, [clickMode])
  
  // ⚡ DYNAMIC THEME SYNC: Update map styles when isDark changes without re-init
  useEffect(() => {
    if (mapRef.current && mapOptions) {
      mapRef.current.setOptions(mapOptions)
    }
  }, [isDark, mapOptions])

  useEffect(() => {
    if (origin) saveRecentLocation({ display: origin.display, lat: origin.lat, lng: origin.lng, savedAt: Date.now() })
    if (mapReady && origin) {
      const pos = new google.maps.LatLng(origin.lat, origin.lng)
      placeMarker('origin', pos)
      // Pan to single point if destination isn't set yet
      if (!destination && mapRef.current) {
        mapRef.current.panTo(pos)
        mapRef.current.setZoom(15)
      }
    }
  }, [origin, mapReady, placeMarker, destination])

  useEffect(() => {
    if (destination) saveRecentLocation({ display: destination.display, lat: destination.lat, lng: destination.lng, savedAt: Date.now() })
    if (mapReady && destination) {
      const pos = new google.maps.LatLng(destination.lat, destination.lng)
      placeMarker('destination', pos)
      // Pan to single point if origin isn't set yet
      if (!origin && mapRef.current) {
        mapRef.current.panTo(pos)
        mapRef.current.setZoom(15)
      }
    }
  }, [destination, mapReady, placeMarker, origin])

  useEffect(() => {
    if (!mapReady || !mapRef.current) return
    if (!origin || !destination || hasRealResults) {
      ghostPolyRef.current?.setMap(null)
      ghostPolyRef.current = null
      return
    }
    const path = [{ lat: origin.lat, lng: origin.lng }, { lat: destination.lat, lng: destination.lng }]
    if (!ghostPolyRef.current) {
      ghostPolyRef.current = new google.maps.Polyline({
        map: mapRef.current,
        path,
        geodesic: true,
        strokeColor: '#36FF97',
        strokeOpacity: 0.35,
        strokeWeight: 2,
        icons: [{ icon: { path: 'M 0,-1 0,1', strokeOpacity: 1, scale: 3 }, offset: '0', repeat: '14px' }],
      })
    } else {
      ghostPolyRef.current.setPath(path)
    }
  }, [origin, destination, mapReady, hasRealResults])

  // Tactical UX: Auto-fit map to show both Points A and B
  useEffect(() => {
    if (!mapReady || !mapRef.current || !origin || !destination || hasRealResults) return
    const bounds = new google.maps.LatLngBounds()
    bounds.extend({ lat: origin.lat, lng: origin.lng })
    bounds.extend({ lat: destination.lat, lng: destination.lng })
    mapRef.current.fitBounds(bounds, { top: 80, right: 80, bottom: 80, left: 80 })
  }, [origin, destination, mapReady, hasRealResults])

  useEffect(() => {
    if (!mapReady || !mapRef.current) return
    routePolysRef.current.forEach((p) => p.setMap(null))
    routePolysRef.current = []
    if (!hasRealResults) return
    routePolysRef.current = liveRoutes.map((r, i) => {
      const poly = new google.maps.Polyline({
        map: mapRef.current!,
        path: r.polyline ?? [],
        geodesic: true,
        strokeColor: ROUTE_COLORS[i] ?? '#36FF97',
        strokeOpacity: 0.45,
        strokeWeight: 4,
      })
      return poly
    })
    const bounds = new google.maps.LatLngBounds()
    liveRoutes.forEach((r) => r.polyline?.forEach((p) => bounds.extend(p)))
    if (!bounds.isEmpty()) mapRef.current.fitBounds(bounds, 72)
  }, [hasRealResults, liveRoutes, mapReady])

  useEffect(() => {
    if (!mapReady || routePolysRef.current.length === 0 || !hasRealResults) return
    liveRoutes.forEach((r, i) => {
      const poly = routePolysRef.current[i]
      if (!poly) return
      poly.setOptions({
        strokeOpacity: selectedRoute?.id === r.id ? 1 : 0.34,
        strokeWeight: selectedRoute?.id === r.id ? 5 : 3,
      })
    })
  }, [hasRealResults, liveRoutes, mapReady, selectedRoute?.id])


  const runAnalyze = useCallback(() => {
    if (!origin || !destination) return
    setAnalyzeTriggered(true)
    setActiveTab('results')
    directions.fetchRoutes()
  }, [origin, destination, directions])

  useEffect(() => {
    analyzeRef.current = runAnalyze
  }, [runAnalyze])

  const handleAnalyze = useCallback(() => {
    runAnalyze()
  }, [runAnalyze])


  const handleLocateMe = useCallback(async () => {
    setMyLocationBusy(true)
    try {
      const pos = await getCurrentPosition()
      const latLng = new google.maps.LatLng(pos.coords.latitude, pos.coords.longitude)
      placeMarker('origin', latLng)
      const display = await reverseGeocode(latLng)
      setOrigin({ display, lat: latLng.lat(), lng: latLng.lng() })
      mapRef.current?.panTo(latLng)
      mapRef.current?.setZoom(Math.max(mapRef.current?.getZoom() ?? 12, 13))
      setClickMode('destination')
    } finally {
      setMyLocationBusy(false)
    }
  }, [placeMarker, reverseGeocode])

  const showGoogle = Boolean(apiKey) && !mapError
  const tacticalAlert =
    analyzeTriggered && (directions.status === 'fallback' || directions.status === 'error')
      ? (directions as any).message || 'TACTICAL ALERT: No route found for this pair. Adjust A/B points and retry.'
      : null

  const panelBg = isDark ? 'bg-black/60 text-white border-white/12' : 'bg-white/72 text-zinc-900 border-black/10'
  const panelInner = isDark ? 'bg-white/[0.04] border-white/12' : 'bg-white/80 border-black/10'
  const chipMuted = isDark ? 'text-white/65' : 'text-zinc-600'
  const chipActive = isDark ? 'bg-[rgba(54,255,151,0.12)] text-toxic' : 'bg-[rgba(54,255,151,0.16)] text-emerald-700'
  const plannerAnchor = 'start-4'
  const controlsAnchor = 'end-4'
  const dirAttr: 'rtl' | 'ltr' = isArabic ? 'rtl' : 'ltr'

  return (
    <div dir={dirAttr} className={`relative h-svh w-full overflow-hidden ${isDark ? 'bg-onyx text-white' : 'bg-[#F5F8FB] text-zinc-900'}`}>
      <div className="absolute inset-0">
        {showGoogle ? (
          <div ref={mapEl} className="h-full w-full bg-black" />
        ) : (
          <div className={`flex h-full w-full items-center justify-center text-sm ${isDark ? 'bg-[#070807] text-white/60' : 'bg-[#F3F5F7] text-zinc-600'}`}>
            {mapError || 'Google Maps API key is required.'}
          </div>
        )}
      </div>

      <header className="absolute inset-x-0 top-0 z-40 p-4">
        <div className={`mx-auto grid max-w-[1200px] grid-cols-3 items-center rounded-2xl border px-4 py-2.5 backdrop-blur-[20px] ${panelBg}`}>
          <div className="justify-self-start">
            <Link
              to="/"
              className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition hover:border-toxic/45 hover:text-toxic ${isDark ? 'border-white/15 bg-white/[0.04] text-white/80' : 'border-black/12 bg-white/75 text-zinc-700'}`}
            >
              {isArabic ? '← عودة' : '← Back'}
            </Link>
          </div>

          <div className="justify-self-center">
            <BrandLogo />
          </div>

          <div className="justify-self-end">
            <span className={`hidden text-[10px] uppercase tracking-widest font-bold sm:block ${isDark ? 'text-white/35' : 'text-zinc-500'}`}>
              {t('map.secure')}
            </span>
          </div>
        </div>
      </header>

      <div className="absolute inset-x-4 top-[84px] z-30 mx-auto max-w-[1200px]">
        <div className={`inline-flex rounded-2xl border p-1 backdrop-blur-[20px] ${panelBg}`}>
          <button
            type="button"
            onClick={() => setActiveTab('planner')}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${activeTab === 'planner' ? chipActive : chipMuted}`}
          >
            {t('map.planner')}
          </button>
          {hasRealResults && (
            <button
              type="button"
              onClick={() => setActiveTab('results')}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${activeTab === 'results' ? chipActive : chipMuted}`}
            >
              {t('map.results')}
            </button>
          )}
        </div>
      </div>

      <AnimatePresence>
        {activeTab === 'planner' && (
          <motion.section
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            className={`absolute ${plannerAnchor} top-[132px] z-30 w-[min(448px,calc(100vw-2rem))] rounded-2xl border p-3 backdrop-blur-[20px] ${panelBg}`}
          >
            <div className="planner-stack relative">
              <div className={`pointer-events-none absolute top-[56px] h-[90px] w-px border-s border-dashed border-toxic/55 start-[18px]`} />
              <SmartLocationInput
                origin={origin}
                destination={destination}
                onOriginChange={(p) => {
                  setOrigin(p)
                  setAnalyzeTriggered(false)
                  setSelectedRouteId(null)
                  clearAllPolys()
                }}
                onDestinationChange={(p) => {
                  setDestination(p)
                  setAnalyzeTriggered(false)
                  setSelectedRouteId(null)
                  clearAllPolys()
                }}
                favorites={savedLocations}
                onSaveLocation={(p) => saveLocation({ label: p.display.split(',')[0], address: p.display, lat: p.lat, lng: p.lng })}
                labels={{
                  from: `${origin ? '● ' : ''}${t('map.from') || 'From'}`,
                  to: `${destination ? '● ' : ''}${t('map.to') || 'To'}`,
                  fromPlaceholder: t('map.setStart'),
                  toPlaceholder: t('map.setDest'),
                }}
                apiReady={mapReady}
              />
            </div>

            <div className="mt-4">
              <CalculateButton 
                onClick={handleAnalyze} 
                disabled={!origin || !destination} 
                loading={directions.status === 'loading'} 
                isDark={isDark}
              />
            </div>
          </motion.section>
        )}
      </AnimatePresence>
      <style>{`
        .planner-stack .sm\\:flex-row { flex-direction: column !important; align-items: stretch !important; gap: 0.5rem !important; }
        .planner-stack .sm\\:mt-6 { margin-top: 0 !important; }
      `}</style>

      {!hasRealResults && (
        <div className={`absolute ${controlsAnchor} top-[132px] z-30 rounded-2xl border p-2 backdrop-blur-[20px] ${panelBg}`}>
          <div className={`flex items-center gap-1 rounded-xl border p-1 ${panelInner}`}>
            {(['origin', 'destination'] as const).map((mode) => (
              <motion.button
                key={mode}
                type="button"
                onClick={() => setClickMode(mode)}
                whileTap={{ scale: 0.94 }}
                whileHover={{ scale: 1.03 }}
                className={`rounded-xl px-3 py-2 text-xs font-semibold transition ${
                  clickMode === mode
                    ? chipActive
                    : chipMuted
                }`}
              >
                <span className="me-1 inline-flex align-middle"><MapPin size={ICON_SIZE} strokeWidth={ICON_STROKE} /></span>
                {mode === 'origin' ? 'A' : 'B'}
              </motion.button>
            ))}
            <motion.button
              type="button"
              onClick={handleLocateMe}
              disabled={myLocationBusy}
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.03 }}
              className={`rounded-xl border px-3 py-2 text-xs font-semibold transition disabled:opacity-50 ${isDark ? 'border-toxic/35 bg-[rgba(54,255,151,0.08)] text-toxic' : 'border-toxic/45 bg-[rgba(54,255,151,0.12)] text-emerald-700'}`}
            >
              <span className="me-1 inline-flex align-middle"><Crosshair size={ICON_SIZE} strokeWidth={ICON_STROKE} /></span>
              {myLocationBusy ? t('map.locating') : t('map.myLocation')}
            </motion.button>
          </div>
        </div>
      )}


      {/* Redundant local AI FAB removed to resolve ghosting effect — global GeminiCopilot handles chat */}


      {previewStats && !hasRealResults && (
        <div className={`absolute bottom-6 inset-x-0 mx-auto z-30 w-fit rounded-2xl border px-4 py-2 text-xs font-bold backdrop-blur-[20px] ${panelBg}`}>
          {t('map.livePreview')} · <span dir="ltr" className="text-emerald-700">~{previewStats.distanceKm.toFixed(1)} {t('map.dist')}</span> · <span dir="ltr" className="text-emerald-700">{previewStats.durationMin} {t('map.time')}</span>
        </div>
      )}

      <AnimatePresence>
        {activeTab === 'results' && hasRealResults && (
          <motion.section
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 32 }}
            className={`absolute bottom-6 inset-x-4 z-30 mx-auto w-full transition-all duration-500 ${isCopilotOpen ? 'max-w-[calc(100%-460px)] me-auto ms-4 sm:ms-6' : 'max-w-[1000px]'}`}
          >
            <div className={`grid grid-cols-1 gap-3 sm:grid-cols-3 rounded-2xl border p-3 backdrop-blur-[24px] shadow-2xl ${panelBg}`}>
              {categorizedRoutes.map((r, i) => (
                <RouteCard
                  key={r.id + i}
                  route={r}
                  selected={selectedRouteId === r.id}
                  onSelect={() => setSelectedRouteId(r.id)}
                  onAnalyze={() => handleAnalyzeRoute(r)}
                  analyzing={analysisLoadingId === r.id}
                  color={ROUTE_COLORS[i] ?? '#36FF97'}
                  isDark={isDark}
                />
              ))}
              {categorizedRoutes.length === 1 && <PlaceholderCard slotLabel={t('map.fastest')} />}
              {categorizedRoutes.length === 2 && <PlaceholderCard slotLabel={t('map.alternative')} />}
              <div className="sm:col-span-3 mt-1 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={handleAnalyze}
                  className={`flex w-full items-center justify-center gap-2 rounded-xl border border-toxic/30 bg-toxic/5 py-2.5 text-[10px] font-bold uppercase tracking-widest text-toxic transition hover:bg-toxic/10 shadow-[0_0_15px_-5px_rgba(54,255,151,0.2)]`}
                >
                  <Radar size={14} />
                  {t('map.analyze')}
                </button>
              </div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      <GeminiCopilot 
        isOpen={isCopilotOpen} 
        onOpenChange={setIsCopilotOpen}
        selectedRoute={selectedRoute}
        destination={destination?.display}
        hasActiveRoute={!!selectedRoute}
        activeRouteData={selectedRoute ? {
          type: selectedRoute.id === 'fast' ? 'Fastest' : selectedRoute.id === 'eco' ? 'Eco-Friendly' : 'Balanced',
          distance: `${selectedRoute.distanceKm.toFixed(1)} km`,
          duration: `${selectedRoute.durationMin} min`
        } : undefined}
        isDark={isDark}
        briefing={briefing}
        metrics={analysisMetrics}
        currentCharge={localCharge}
      />

      

      {directions.status === 'loading' && (
        <div className={`absolute bottom-6 ${controlsAnchor} z-40 rounded-2xl border border-toxic/35 px-3 py-1.5 text-xs font-semibold text-toxic backdrop-blur-[20px] ${isDark ? 'bg-black/60' : 'bg-white/82 text-emerald-700'}`}>
          {t('routes.calculating')}
        </div>
      )}

      {tacticalAlert && (
        <div className={`absolute ${controlsAnchor} top-[196px] z-40 w-[min(420px,calc(100vw-2rem))] rounded-2xl border border-amber-400/35 p-3 text-xs backdrop-blur-[20px] ${isDark ? 'bg-black/60 text-amber-200' : 'bg-white/85 text-amber-700'}`}>
          <p className="mb-1 inline-flex items-center gap-1 font-semibold text-amber-300">
            <span><Radar size={ICON_SIZE} strokeWidth={ICON_STROKE} /></span>
            {t('map.tacticalAlert')}
          </p>
          <p>{tacticalAlert}</p>
        </div>
      )}

    </div>
  )
}

