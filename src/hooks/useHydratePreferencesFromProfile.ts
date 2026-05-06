/**
 * Output by Antigravity IDE
 * Apply Firestore preferences when profile loads (per uid).
 */
import { useEffect, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { useLocale } from '../contexts/LocaleContext'

export function useHydratePreferencesFromProfile() {
  const { profile, loading } = useAuth()
  const { setPreference } = useTheme()
  const { setLocale } = useLocale()
  const lastUid = useRef<string | null>(null)

  useEffect(() => {
    if (loading || !profile) return
    if (lastUid.current === profile.uid) return
    lastUid.current = profile.uid
    setPreference(profile.preferences.theme)
    setLocale(profile.preferences.locale)
  }, [loading, profile, setPreference, setLocale])
}
