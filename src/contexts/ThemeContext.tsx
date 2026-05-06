/**
 * Output by Antigravity IDE
 * Dark / Light / System — persists to Firestore when authenticated.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { ThemePreference } from '../types/profile'

type Resolved = 'dark' | 'light'

interface ThemeCtx {
  preference: ThemePreference
  resolvedTheme: Resolved
  setPreference: (t: ThemePreference) => void
}

const ThemeContext = createContext<ThemeCtx | null>(null)

function getSystem(): Resolved {
  if (typeof window === 'undefined') return 'dark'
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
}

function readStoredTheme(fallback: ThemePreference): ThemePreference {
  try {
    const s = localStorage.getItem('greendrive-theme') as ThemePreference | null
    if (s === 'dark' || s === 'light' || s === 'system') return s
  } catch {
    /* ignore */
  }
  return fallback
}

export function ThemeProvider({
  children,
  initialPreference = 'dark',
}: {
  children: ReactNode
  initialPreference?: ThemePreference
}) {
  const [preference, setPreferenceState] = useState<ThemePreference>(() =>
    readStoredTheme(initialPreference)
  )
  const [system, setSystem] = useState<Resolved>(getSystem)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: light)')
    const fn = () => setSystem(mq.matches ? 'light' : 'dark')
    mq.addEventListener('change', fn)
    return () => mq.removeEventListener('change', fn)
  }, [])

  const resolvedTheme: Resolved =
    preference === 'system' ? system : preference === 'light' ? 'light' : 'dark'

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', resolvedTheme === 'dark')
    root.dataset.theme = resolvedTheme
  }, [resolvedTheme])

  const setPreference = useCallback((t: ThemePreference) => {
    setPreferenceState(t)
    try {
      localStorage.setItem('greendrive-theme', t)
    } catch {
      /* ignore */
    }
  }, [])

  const value = useMemo(
    () => ({ preference, resolvedTheme, setPreference }),
    [preference, resolvedTheme, setPreference]
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

// Hook colocated with provider for GreenDrive; fast-refresh prefers single-export files.
// eslint-disable-next-line react-refresh/only-export-components -- useTheme is the public API
export function useTheme() {
  const c = useContext(ThemeContext)
  if (!c) throw new Error('useTheme must be used within ThemeProvider')
  return c
}
