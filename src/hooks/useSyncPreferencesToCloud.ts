/**
 * Output by Antigravity IDE
 * Push theme + locale to Firestore when user is signed in.
 */
import { useEffect, useRef } from 'react'
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db, firebaseConfigured } from '../firebase/config'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { useLocale } from '../contexts/LocaleContext'

export function useSyncPreferencesToCloud() {
  const { user } = useAuth()
  const { preference } = useTheme()
  const { locale } = useLocale()
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const { cloudHealthy } = useAuth()

  useEffect(() => {
    if (!firebaseConfigured || !db || !user) return
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      if (!cloudHealthy) return

      const ref = doc(db!, 'users', user.uid)
      void updateDoc(ref, {
        preferences: { theme: preference, locale },
        updatedAt: serverTimestamp(),
      }).catch(() => {
        /* silent fail for stability */
      })
    }, 2000)
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [user, preference, locale])
}
