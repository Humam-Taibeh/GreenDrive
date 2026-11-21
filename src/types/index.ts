export interface FeatureCardData {
  id: string
  title: string
  subtitle: string
  body: string
  footerLeft: string
  score?: number
  highlighted?: boolean
  icon: 'pin' | 'tree' | 'fuel'
}

export interface RouteOption {
  id: string
  label: string
  focus: 'eco' | 'fast' | 'cheap'
  distanceKm: number
  durationMin: number
  staticDurationMin?: number // NEW: Time without traffic
  fuelLiters: number | null
  co2Kg: number
  savingsPercent: number
  polyline?: Array<{ lat: number; lng: number }>
  /**
   * Total climb in metres, summed from real elevation samples (Open-Meteo) along the polyline.
   * 0 when `ascentStatus === 'unavailable'` (calculations then assume flat terrain).
   */
  ascentM?: number
  /** 'measured' = real elevation data; 'unavailable' = Elevation API failed/blocked; undefined = not applicable (walking). */
  ascentStatus?: 'measured' | 'unavailable'
  /** Number of elevation samples behind `ascentM` (only when measured). */
  ascentSamples?: number
  /** Flag for mathematical winner of fuel economy */
  isCheapest?: boolean
}

export interface TeamMember {
  id: string
  name: string
  role: string
  experience: string
  placements: string
  satisfaction: string
  avatarUrl: string
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  text: string
  at: number
}

export interface HowItWorksStep {
  id: string
  title: string
  description: string
}

export interface IntelligenceItem {
  id: string
  title: string
  description: string
}

export interface ImpactTrip {
  id: string
  title: string
  description: string
  badge?: string
  posted: string
  icon: 'star' | 'plus' | 'waves'
}
export interface UserSavedLocation {
  id?: string
  label: string
  address: string
  lat: number
  lng: number
  createdAt?: number
}
