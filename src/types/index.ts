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
  fuelLiters: number | null
  co2Kg: number
  savingsPercent: number
  polyline?: Array<{ lat: number; lng: number }>
  /** Net elevation gain in metres — used for terrain-aware scoring */
  ascentM?: number
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
