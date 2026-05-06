/** Output by Antigravity IDE — user cloud profile (Firestore) */
export type ThemePreference = 'dark' | 'light' | 'system'
export type LocaleCode = 'en' | 'ar'

export interface UserPreferences {
  theme: ThemePreference
  locale: LocaleCode
}

export interface EcoRouteSummary {
  id: string
  label: string
  co2KgSaved: number
  savedAt: number
}

export interface UserProfileDoc {
  uid: string
  email: string | null
  displayName: string | null
  firstName: string | null
  vehicleType: string | null
  currentChargePercent: number
  photoURL: string | null
  preferences: UserPreferences
  totalCo2SavedKg: number
  savedRoutes: EcoRouteSummary[]
  co2History: { t: number; kg: number }[]
  homeLocation?: { lat: number; lng: number; address: string; label: string } | null
  workLocation?: { lat: number; lng: number; address: string; label: string } | null
  updatedAt: number
}
