/**
 * Output by Antigravity IDE
 * English / Arabic with RTL. Persists to localStorage; Firestore when signed in (via profile sync).
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
import { translations, type TranslationKey } from '../i18n/translations'
import type { LocaleCode } from '../types/profile'

interface LocaleCtx {
  locale: LocaleCode
  setLocale: (l: LocaleCode) => void
  t: (key: TranslationKey) => string
  dir: 'ltr' | 'rtl'
}

const LocaleContext = createContext<LocaleCtx | null>(null)

function readStoredLocale(): LocaleCode {
  try {
    const s = localStorage.getItem('greendrive-locale') as LocaleCode | null
    if (s === 'en' || s === 'ar') return s
  } catch {
    /* ignore */
  }
  return 'en'
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<LocaleCode>(() => readStoredLocale())

  const setLocale = useCallback((l: LocaleCode) => {
    setLocaleState(l)
    try {
      localStorage.setItem('greendrive-locale', l)
    } catch {
      /* ignore */
    }
    document.documentElement.lang = l
    document.documentElement.dir = l === 'ar' ? 'rtl' : 'ltr'
  }, [])

  useEffect(() => {
    document.documentElement.lang = locale
    document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr'
  }, [locale])

  const t = useCallback(
    (key: TranslationKey) => translations[locale][key] ?? translations.en[key] ?? key,
    [locale]
  )

  const dir: 'ltr' | 'rtl' = locale === 'ar' ? 'rtl' : 'ltr'

  const value = useMemo(() => ({ locale, setLocale, t, dir }), [locale, setLocale, t, dir])

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components -- useLocale is the public API
export function useLocale() {
  const c = useContext(LocaleContext)
  if (!c) throw new Error('useLocale must be used within LocaleProvider')
  return c
}
