import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { BatteryCharging, Bot, Car, Crosshair, Leaf, MapPin, Radar, Truck } from 'lucide-react'
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
import { computeTripEmissions } from '../lib/vehicleProfiles'
import type { VehicleType } from '../lib/vehicleProfiles'
import type { RouteOption } from '../types'
import {
  type CopilotRouteMetrics,
} from '../services/gemini'

const MAP_DEFAULT_CENTER = { lat: 31.9539, lng: 35.9106 }
const ROUTE_COLORS = ['#36FF97', '#7CFFC4', '#B8FFE0']

const ICON_SIZE = 14
const ICON_STROKE = 1.5


const CalculateButton = memo(function CalculateButton({ onClick, disabled, loading }: { onClick: () => void; disabled: boolean; loading: boolean }) {
  const { t } = useLocale()
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className="w-full rounded-xl border border-toxic/50 bg-toxic px-5 py-3 text-sm font-black uppercase tracking-wider text-onyx shadow-[0_0_28px_-10px_rgba(54,255,151,0.7)] transition hover:shadow-[0_0_42px_-8px_rgba(54,255,151,0.85)] disabled:opacity-45"
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
}: {
  route: RouteOption
  selected: boolean
  onSelect: () => void
  onAnalyze: () => void
  color: string
}) {
  const isOptimal = route.id === 'fast' && route.label === 'Optimal Route'

  const focusTitle =
    isOptimal                ? 'OPTIMAL'
    : route.id === 'fast'    ? 'FASTEST'
    : route.id === 'eco'     ? 'ECO-FRIENDLY'
    : 'BALANCED'

  const descriptor =
    isOptimal                ? 'Fastest & Greenest'
    : route.id === 'fast'    ? 'Quickest Path'
    : route.id === 'eco'     ? 'Most Cost-Saving'
    : 'Optimum Balance'

  // Optimal gets a gold accent ring to distinguish it from plain FASTEST
  const borderStyle = selected
    ? isOptimal
      ? 'border-amber-400 bg-amber-400/10 ring-2 ring-amber-400 shadow-[0_0_30px_-14px_rgba(251,191,36,0.75)]'
      : 'border-toxic bg-toxic/10 ring-2 ring-toxic shadow-[0_0_30px_-14px_rgba(54,255,151,0.75)]'
    : isOptimal
      ? 'border-amber-400/30 bg-amber-400/[0.03] hover:border-amber-400/50 hover:ring-1 hover:ring-amber-400/40'
      : 'border-white/12 bg-white/[0.04] hover:border-toxic/40 hover:ring-1 hover:ring-toxic/30'

  return (
    <div
      className={`relative w-full cursor-pointer rounded-xl border p-3 transition-all duration-300 ${borderStyle}`}
      onClick={onSelect}
    >
      <div className="flex items-center justify-between">
        <p className={`flex items-center gap-2 text-xs font-black uppercase tracking-tighter ${isOptimal ? 'text-amber-300' : ''}`}>
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
          {focusTitle}
          {isOptimal && <span className="text-[9px] font-mono text-amber-400/70 normal-case tracking-normal">⚡ fastest+greenest</span>}
        </p>
        <span className="text-[10px] font-mono text-white/40">{descriptor}</span>
      </div>
      <div className="mt-3 space-y-2">
        <div className="flex items-baseline justify-between gap-1">
          <p className="text-base font-bold text-white">{route.durationMin} min</p>
          <p className="text-xs font-mono text-white/60">{route.distanceKm.toFixed(1)} km</p>
        </div>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onAnalyze(); }}
          className={`flex w-full items-center justify-center gap-1.5 rounded-lg py-2.5 text-[10px] font-black uppercase tracking-widest transition ${
            selected
              ? isOptimal
                ? 'bg-amber-400 text-black hover:bg-amber-300 shadow-[0_0_15px_-5px_rgba(251,191,36,0.5)]'
                : 'bg-toxic text-onyx hover:bg-toxic/90 shadow-[0_0_15px_-5px_rgba(54,255,151,0.4)]'
              : 'bg-toxic/20 text-toxic hover:bg-toxic/30 shadow-[0_0_15px_-5px_rgba(54,255,151,0.2)]'
          }`}
        >
          <Bot size={12} />
          VIEW MORE DETAIL
        </button>
      </div>
    </div>
  )
})

/** Placeholder card for when Google Maps can't produce a 3rd alternative path */
const PlaceholderCard = memo(function PlaceholderCard({ slotLabel }: { slotLabel: string }) {
  return (
    <div className="relative w-full rounded-xl border border-white/6 bg-white/[0.02] p-3 opacity-50">
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-2 text-xs font-black uppercase tracking-tighter text-white/30">
          <span className="h-2 w-2 rounded-full bg-white/20" />
          {slotLabel}
        </p>
        <span className="text-[10px] font-mono text-white/20">Unavailable</span>
      </div>
      <div className="mt-3 space-y-2">
        <p className="text-xs text-white/25 font-mono leading-relaxed">
          No alternative route available for this corridor.
        </p>
        <div className="flex w-full items-center justify-center rounded-lg border border-white/8 py-2.5 text-[10px] font-black uppercase tracking-widest text-white/20">
          — SECTOR LOCKED —
        </div>
      </div>
    </div>
  )
})


export function MapViewPage() {
  const { t, locale } = useLocale()
  const { resolvedTheme } = useTheme()
  const { profile, user } = useAuth()
  const { savedLocations, saveLocation } = useSavedLocations()
  const isArabic = locale === 'ar'
  const isDark = resolvedTheme === 'dark'

  const [activeTab, setActiveTab] = useState<'planner' | 'results' | 'saved'>('planner')
  const [clickMode, setClickMode] = useState<'origin' | 'destination'>('origin')
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
  const [plannerExpanded, setPlannerExpanded] = useState(true)
  const [isCopilotOpen, setIsCopilotOpen] = useState(false)

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

  const mapStyles = useMemo<google.maps.MapTypeStyle[]>(
    () => isDark ? [
      { elementType: 'geometry', stylers: [{ color: '#000000' }] },
      { elementType: 'labels.text.fill', stylers: [{ color: '#8B949E' }] },
      { elementType: 'labels.text.stroke', stylers: [{ color: '#000000' }] },
      { featureType: 'poi', stylers: [{ visibility: 'off' }] },
      { featureType: 'poi.business', stylers: [{ visibility: 'off' }] },
      { featureType: 'transit', stylers: [{ visibility: 'off' }] },
      { featureType: 'landscape', stylers: [{ visibility: 'off' }] },
      { featureType: 'administrative.neighborhood', stylers: [{ visibility: 'off' }] },
      { featureType: 'administrative.locality', stylers: [{ visibility: 'on' }] },
      { featureType: 'road.local', stylers: [{ visibility: 'off' }] },
      { featureType: 'road.local', elementType: 'labels', stylers: [{ visibility: 'off' }] },
      { featureType: 'road.arterial', elementType: 'geometry', stylers: [{ color: '#2E3A46' }] },
      { featureType: 'road.arterial', elementType: 'labels.text.fill', stylers: [{ color: '#CBD5E1' }] },
      { featureType: 'road.arterial', elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
      { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#4B5563' }] },
      { featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{ color: '#E5E7EB' }] },
      { featureType: 'road.highway', elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
      { featureType: 'water', stylers: [{ visibility: 'off' }] },
    ] : [
      { elementType: 'geometry', stylers: [{ color: '#F6F8FA' }] },
      { elementType: 'labels.text.fill', stylers: [{ color: '#334155' }] },
      { elementType: 'labels.text.stroke', stylers: [{ color: '#FFFFFF' }] },
      { featureType: 'poi', stylers: [{ visibility: 'off' }] },
      { featureType: 'poi.business', stylers: [{ visibility: 'off' }] },
      { featureType: 'transit', stylers: [{ visibility: 'off' }] },
      { featureType: 'landscape', stylers: [{ visibility: 'off' }] },
      { featureType: 'administrative.neighborhood', stylers: [{ visibility: 'off' }] },
      { featureType: 'administrative.locality', stylers: [{ visibility: 'on' }] },
      { featureType: 'road.local', stylers: [{ visibility: 'off' }] },
      { featureType: 'road.local', elementType: 'labels', stylers: [{ visibility: 'off' }] },
      { featureType: 'road.arterial', elementType: 'geometry', stylers: [{ color: '#94A3B8' }] },
      { featureType: 'road.arterial', elementType: 'labels.text.fill', stylers: [{ color: '#1E293B' }] },
      { featureType: 'road.arterial', elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
      { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#64748B' }] },
      { featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{ color: '#0F172A' }] },
      { featureType: 'road.highway', elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
      { featureType: 'water', stylers: [{ visibility: 'off' }] },
    ],
    [isDark],
  )

  const mapOptions = useMemo<google.maps.MapOptions>(
    () => {
      const mapId = import.meta.env.VITE_GOOGLE_MAP_ID || 'DEMO_MAP_ID'
      return {
        center: MAP_DEFAULT_CENTER,
        zoom: 12,
        disableDefaultUI: true,
        clickableIcons: false,
        gestureHandling: 'greedy',
        // If we have a Map ID (custom or demo), we MUST NOT provide styles in the code
        styles: mapId ? undefined : mapStyles,
        backgroundColor: isDark ? '#000000' : '#F3F5F7',
      }
    },
    [mapStyles, isDark],
  )

  const liveRoutes = useMemo<RouteOption[]>(
    () => (directions.status === 'ok' ? directions.routes : []),
    [directions],
  )
  const hasRealResults = analyzeTriggered && liveRoutes.length > 0
  const selectedRoute =
    liveRoutes.find((r) => r.id === selectedRouteId) ??
    liveRoutes.find((r) => r.id === 'eco') ??
    liveRoutes[0] ??
    null


  const copilotRouteMetrics = useMemo((): CopilotRouteMetrics | undefined => {
    if (!selectedRoute || liveRoutes.length === 0) return undefined
    const selectedEm = computeTripEmissions(
      selectedRoute.distanceKm,
      selectedRoute.ascentM ?? 70,
      selectedRoute.id === 'eco' ? 0.92 : selectedRoute.id === 'fast' ? 0.72 : 0.85,
      vehicle,
    )
    const fastest = liveRoutes.find((r) => r.id === 'fast') ?? liveRoutes[0]
    const fastEm = computeTripEmissions(
      fastest.distanceKm,
      fastest.ascentM ?? 70,
      fastest.id === 'eco' ? 0.92 : fastest.id === 'fast' ? 0.72 : 0.85,
      vehicle,
    )
    const fuelSaved =
      selectedEm.fuelLiters !== null && fastEm.fuelLiters !== null
        ? Math.max(0, fastEm.fuelLiters - selectedEm.fuelLiters)
        : 0
    const estFuelPricePerLiterJod = 0.95
    const jodSaved = fuelSaved * estFuelPricePerLiterJod
    return {
      fuelSavedLiters: fuelSaved,
      ascentM: Math.round(selectedRoute.ascentM ?? 70),
      estJodSaved: jodSaved,
      selectedRouteId: selectedRoute.id,
    }
  }, [liveRoutes, selectedRoute, vehicle])

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

  const geocodeAddress = useCallback(async (query: string): Promise<LocationPoint | null> => {
    if (!geocoderRef.current || !query.trim()) return null
    return new Promise((resolve) => {
      geocoderRef.current!.geocode({ address: query }, (results, status) => {
        if (status !== 'OK' || !results?.[0]?.geometry?.location) {
          resolve(null)
          return
        }
        const loc = results[0].geometry.location
        resolve({
          display: results[0].formatted_address.split(',').slice(0, 2).join(',').trim(),
          lat: loc.lat(),
          lng: loc.lng(),
        })
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
          mapId: import.meta.env.VITE_GOOGLE_MAP_ID || 'DEMO_MAP_ID',
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
      markerAAtMount?.setMap(null)
      markerBAtMount?.setMap(null)
      mapRef.current = null
      clearAllPolys()
    }
  }, [apiKey, placeMarker, reverseGeocode, clearAllPolys, mapOptions])

  useEffect(() => {
    const ref = (window as unknown as Record<string, unknown>)['__gdClickModeRef'] as { current: 'origin' | 'destination' } | undefined
    if (ref) ref.current = clickMode
  }, [clickMode])

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
        strokeOpacity: 0.34,
        strokeWeight: 3,
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
    setPlannerExpanded(false)
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
      ? directions.message || 'TACTICAL ALERT: No route found for this pair. Adjust A/B points and retry.'
      : null

  const panelBg = isDark ? 'bg-black/60 text-white border-white/12' : 'bg-white/72 text-zinc-900 border-black/10'
  const panelInner = isDark ? 'bg-white/[0.04] border-white/12' : 'bg-white/80 border-black/10'
  const chipMuted = isDark ? 'text-white/65' : 'text-zinc-600'
  const chipActive = isDark ? 'bg-[rgba(54,255,151,0.12)] text-toxic' : 'bg-[rgba(54,255,151,0.16)] text-emerald-700'
  const plannerAnchor = isArabic ? 'right-4' : 'left-4'
  const controlsAnchor = isArabic ? 'left-4' : 'right-4'
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

      <header className="absolute left-0 right-0 top-0 z-40 p-4">
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

      <div className="absolute left-4 right-4 top-[84px] z-30 mx-auto max-w-[1200px]">
        <div className={`inline-flex rounded-2xl border p-1 backdrop-blur-[20px] ${panelBg}`}>
          <button
            type="button"
            onClick={() => setActiveTab('planner')}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${activeTab === 'planner' ? chipActive : chipMuted}`}
          >
            Planner
          </button>
          {hasRealResults && (
            <button
              type="button"
              onClick={() => setActiveTab('results')}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${activeTab === 'results' ? chipActive : chipMuted}`}
            >
              Results
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
                  <div className={`pointer-events-none absolute top-[56px] h-[90px] w-px border-l border-dashed border-toxic/55 ${isArabic ? 'right-[18px]' : 'left-[18px]'}`} />
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
                      fromPlaceholder: 'Set Start (A)',
                      toPlaceholder: 'Set Destination (B)',
                    }}
                    apiReady={mapReady}
                  />
                </div>

                <div className="mt-2">
                  <CalculateButton onClick={handleAnalyze} disabled={!origin || !destination} loading={directions.status === 'loading'} />
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
                <span className="mr-1 inline-flex align-middle"><MapPin size={ICON_SIZE} strokeWidth={ICON_STROKE} /></span>
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
              <span className="mr-1 inline-flex align-middle"><Crosshair size={ICON_SIZE} strokeWidth={ICON_STROKE} /></span>
              {myLocationBusy ? 'Locating…' : 'My Location'}
            </motion.button>
          </div>
        </div>
      )}


      {/* Redundant local AI FAB removed to resolve ghosting effect — global GeminiCopilot handles chat */}


      {previewStats && !hasRealResults && (
        <div className={`absolute bottom-6 left-1/2 z-30 -translate-x-1/2 rounded-2xl border px-4 py-2 text-xs backdrop-blur-[20px] ${panelBg}`}>
          Live Preview · <span dir="ltr">~{previewStats.distanceKm.toFixed(1)} km</span> · <span dir="ltr">{previewStats.durationMin} min</span>
        </div>
      )}

      <AnimatePresence>
        {activeTab === 'results' && hasRealResults && (
          <motion.section
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 32 }}
            className={`absolute bottom-6 left-4 right-4 z-30 mx-auto w-full transition-all duration-500 ${isCopilotOpen ? 'max-w-[calc(100%-460px)] mr-auto ml-4 sm:ml-6' : 'max-w-[1000px]'}`}
          >
            <div className={`grid grid-cols-1 gap-3 sm:grid-cols-3 rounded-2xl border p-3 backdrop-blur-[24px] shadow-2xl ${panelBg}`}>
              {(() => {
                // Build guaranteed 3 fixed slots: [FAST, ECO, BALANCED]
                const fastRoute  = liveRoutes.find(r => r.id === 'fast') ?? liveRoutes.find(r => r.id === 'eco') ?? null
                const ecoRoute   = liveRoutes.find(r => r.id === 'eco')  ?? null
                const balRoute   = liveRoutes.find(r => r.id === 'cheap') ?? null

                const slots: Array<{ route: RouteOption | null; label: string; colorIdx: number }> = [
                  { route: fastRoute,  label: 'FASTEST',      colorIdx: 0 },
                  { route: ecoRoute,   label: 'ECO-FRIENDLY', colorIdx: 1 },
                  { route: balRoute,   label: 'BALANCED',     colorIdx: 2 },
                ]

                return slots.map(({ route: r, label, colorIdx }) =>
                  r ? (
                    <RouteCard
                      key={r.id + label}
                      route={r}
                      selected={selectedRoute?.id === r.id}
                      onSelect={() => setSelectedRouteId(r.id)}
                      onAnalyze={() => { setSelectedRouteId(r.id); setIsCopilotOpen(true) }}
                      color={ROUTE_COLORS[colorIdx] ?? '#36FF97'}
                    />
                  ) : (
                    <PlaceholderCard key={label} slotLabel={label} />
                  )
                )
              })()}
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
            Tactical Alert
          </p>
          <p>{tacticalAlert}</p>
        </div>
      )}

    </div>
  )
}

