/** Output by Antigravity IDE — landing-only world-class nav: glass on scroll, IO scroll-spy, layoutId underline */
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence, LayoutGroup, useReducedMotion } from 'framer-motion'
import { BrandLogo } from '../brand/BrandLogo'
import { SettingsVault } from './SettingsVault'
import { useLocale } from '../../contexts/LocaleContext'
import { useTheme } from '../../contexts/ThemeContext'
import { useAuth } from '../../contexts/AuthContext'
import { firebaseConfigured } from '../../firebase/config'
import { handleInPageNavClick } from '../../lib/scrollToSection'
import { prefetchMapRoute } from '../../lib/prefetchMapRoute'
import { Settings } from 'lucide-react'

/** Minimal nav labels mapped to sections */
const navKeys = [
  { href: '#overview', key: 'nav.hero' as const },
  { href: '#features', key: 'nav.features' as const },
  { href: '#process', key: 'nav.how' as const },
  { href: '#impact', key: 'nav.impact' as const },
  { href: '#intelligence', key: 'nav.api' as const },
  { href: '#team', key: 'nav.contact' as const },
] as const

const NAV_SECTION_HASHES = navKeys.map((n) => n.href) as readonly string[]

const SCROLL_GLASS_PX = 48
const ELASTIC_SNAP = { type: 'spring' as const, stiffness: 520, damping: 34, mass: 0.5 }

export function Navbar() {
  const [open, setOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [simulationMode, setSimulationMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem('gd-simulation-mode') === '1'
    } catch {
      return false
    }
  })
  const [unitSystem, setUnitSystem] = useState<'metric' | 'imperial'>(() => {
    try {
      return localStorage.getItem('gd-unit-system') === 'imperial' ? 'imperial' : 'metric'
    } catch {
      return 'metric'
    }
  })
  const [vehicle, setVehicle] = useState<'petrol' | 'hybrid' | 'electric'>(() => {
    try {
      const saved = localStorage.getItem('gd-vehicle')
      return saved === 'hybrid' || saved === 'electric' ? saved : 'petrol'
    } catch {
      return 'petrol'
    }
  })
  const [charge, setCharge] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('gd-charge')
      return saved ? parseInt(saved) : 85
    } catch {
      return 85
    }
  })
  const { t, locale, setLocale } = useLocale()
  const { preference, setPreference, resolvedTheme } = useTheme()
  const { user, signOut, profile, updateVehicleType, updateChargeLevel } = useAuth()
  const reduceMotion = useReducedMotion()
  const [activeSection, setActiveSection] = useState<string>(NAV_SECTION_HASHES[0] ?? '#overview')
  const startPath = '/auth'

  // Sync vehicle type from profile if logged in
  useEffect(() => {
    if (profile?.vehicleType) {
      setVehicle(profile.vehicleType as 'petrol' | 'hybrid' | 'electric')
    }
    if (profile?.currentChargePercent !== undefined) {
      setCharge(profile.currentChargePercent)
    }
  }, [profile?.vehicleType, profile?.currentChargePercent])

  const isLight = resolvedTheme === 'light'
  const ink = isLight ? 'text-zinc-900' : 'text-white'
  const border = isLight ? 'border-black/10' : 'border-white/10'
  const panelBg = isLight ? 'bg-white/95' : 'bg-black/85'
  const panelHover = isLight ? 'hover:bg-black/[0.04]' : 'hover:bg-white/5'
  const panelBorder = isLight ? 'border-black/12' : 'border-white/15'

  const lineTransition = reduceMotion
    ? { duration: 0.16 }
    : ELASTIC_SNAP

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > SCROLL_GLASS_PX)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    let observer: IntersectionObserver | null = null

    const init = () => {
      if (observer) observer.disconnect()
      observer = new IntersectionObserver(
        (entries) => {
          const hit = entries.find((e) => e.isIntersecting)
          if (hit) {
            setActiveSection(`#${hit.target.id}`)
          }
        },
        { root: null, rootMargin: '-30% 0px -70% 0px', threshold: 0 }
      )

      NAV_SECTION_HASHES.forEach((hash) => {
        const el = document.querySelector(hash)
        if (el) observer?.observe(el)
      })
    }

    init()

    const mut = new MutationObserver(() => {
      init()
    })
    mut.observe(document.body, { childList: true, subtree: true })

    return () => {
      observer?.disconnect()
      mut.disconnect()
    }
  }, [])

  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSettingsOpen(false)
    }
    window.addEventListener('keydown', onEsc)
    return () => window.removeEventListener('keydown', onEsc)
  }, [])

  const selectVehicle = (v: 'petrol' | 'hybrid' | 'electric') => {
    setVehicle(v)
    try {
      localStorage.setItem('gd-vehicle', v)
    } catch {
      /* ignore */
    }
    // Persist to Firebase if authenticated
    if (user) {
      void updateVehicleType(v)
    }
  }

  const selectCharge = (level: number) => {
    setCharge(level)
    try {
      localStorage.setItem('gd-charge', level.toString())
    } catch {
      /* ignore */
    }
    if (user) {
      void updateChargeLevel(level)
    }
  }

  const toggleSimulationMode = () => {
    setSimulationMode((prev) => {
      const next = !prev
      try {
        localStorage.setItem('gd-simulation-mode', next ? '1' : '0')
      } catch {
        /* ignore */
      }
      return next
    })
  }

  const selectUnitSystem = (u: 'metric' | 'imperial') => {
    setUnitSystem(u)
    try {
      localStorage.setItem('gd-unit-system', u)
    } catch {
      /* ignore */
    }
  }

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-[200] w-full pt-[env(safe-area-inset-top,0px)] transition-[background-color,backdrop-filter,box-shadow,border-color] duration-300 ease-out ${
        scrolled
          ? `glass-nav shadow-[0_24px_80px_-48px_rgba(54,255,151,0.2)] ${isLight ? 'bg-white/50' : ''}`
          : 'border-b border-transparent bg-transparent shadow-none [--tw-backdrop-blur:0] [backdrop-filter:none] [-webkit-backdrop-filter:none]'
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4 sm:gap-4 sm:px-8 lg:px-12">
        <div className="order-1 min-w-0 rtl:order-3">
          <BrandLogo className="min-w-0" />
        </div>

        <nav className="order-2 hidden flex-1 justify-center md:flex" aria-label={t('nav.landmark')}>
          <LayoutGroup>
            <ul className="flex items-center gap-2 text-sm font-medium lg:gap-3">
              {navKeys.map((l) => {
                const active = activeSection === l.href
                return (
                  <li key={l.href} className="relative">
                    <a
                      href={l.href}
                      className={`relative inline-block rounded-lg px-2.5 py-2 transition-colors duration-200 ${
                        active
                          ? 'font-semibold text-toxic nav-active-pulse'
                          : `${isLight ? 'text-zinc-600' : 'text-white/80'} hover:text-toxic`
                      }`}
                      onClick={(e) => {
                        handleInPageNavClick(e, l.href)
                        setActiveSection(l.href)
                      }}
                      aria-current={active ? 'location' : undefined}
                    >
                      {t(l.key)}
                      {active && (
                        <motion.span
                          layoutId="gd-nav-active-line"
                          className="pointer-events-none absolute inset-x-1 -bottom-0.5 h-[3px] rounded-full bg-toxic shadow-[0_0_12px_rgba(54,255,151,0.95),0_0_28px_rgba(54,255,151,0.4)] transition-all duration-[400ms] ease-[cubic-bezier(0.23,1,0.32,1)]"
                          transition={lineTransition}
                          initial={false}
                          style={{ willChange: 'transform' }}
                          aria-hidden
                        />
                      )}
                    </a>
                  </li>
                )
              })}
            </ul>
          </LayoutGroup>
        </nav>

        <div className="order-3 flex shrink-0 items-center gap-2 sm:gap-3 rtl:order-1">
          {firebaseConfigured && (
            <>
              {!user ? (
                <Link
                  to="/auth"
                  className={`hidden rounded-xl border px-3 py-2 text-xs font-semibold backdrop-blur-md sm:inline-flex ${border} ${isLight ? 'bg-black/5' : 'bg-white/5'} ${ink}`}
                >
                  {t('nav.signIn')}
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => void signOut()}
                  className={`hidden rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-bold uppercase tracking-wider text-red-400 backdrop-blur-md transition hover:bg-red-500/20 sm:inline-flex`}
                >
                  {t('nav.signOut')}
                </button>
              )}
            </>
          )}

          <Link
            to={startPath}
            onMouseEnter={prefetchMapRoute}
            onFocus={prefetchMapRoute}
            className="btn-primary-toxic hidden rounded-full bg-toxic px-5 py-2.5 text-xs font-extrabold text-onyx shadow-[0_0_28px_-4px_rgba(54,255,151,0.65)] transition hover:bg-white sm:inline-flex lg:px-6 lg:text-sm"
            style={{ fontWeight: 800 }}
          >
            {t('nav.start')}
          </Link>
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            className={`hidden h-10 w-10 items-center justify-center rounded-xl border backdrop-blur-md sm:inline-flex ${border} ${isLight ? 'bg-black/5' : 'bg-white/5'} ${ink}`}
            title="Settings Vault"
          >
            <Settings className="h-4 w-4" />
          </button>
          <button
            type="button"
            className={`inline-flex h-11 w-11 items-center justify-center rounded-xl border backdrop-blur-md md:hidden ${border} ${isLight ? 'border-black/15 bg-black/5' : 'border-white/15 bg-white/5'} ${ink}`}
            aria-expanded={open}
            aria-label={t('nav.menu')}
            onClick={() => setOpen((o) => !o)}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {open ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            style={{ willChange: 'opacity, transform' }}
            className={`overflow-hidden border-t backdrop-blur-2xl md:hidden ${border} ${panelBg}`}
          >
            <ul className={`flex flex-col gap-1 px-4 py-4 text-sm font-medium ${ink}`}>
              {navKeys.map((l) => {
                const active = activeSection === l.href
                return (
                  <li key={l.href}>
                    <a
                      href={l.href}
                      className={`block rounded-xl px-3 py-3 transition-colors ${
                        active
                          ? 'bg-toxic/12 font-semibold text-toxic ring-1 ring-toxic/35'
                          : `${panelHover} ${isLight ? 'text-zinc-800' : 'text-white/90'}`
                      }`}
                      aria-current={active ? 'location' : undefined}
                      onClick={(e) => {
                        handleInPageNavClick(e, l.href)
                        setActiveSection(l.href)
                        setOpen(false)
                      }}
                    >
                      {t(l.key)}
                    </a>
                  </li>
                )
              })}
              {firebaseConfigured && (
                <li>
                  {!user ? (
                    <Link
                      to="/auth"
                      className={`mt-2 block w-full rounded-xl border py-3 text-center text-sm font-semibold ${panelBorder}`}
                      onClick={() => setOpen(false)}
                    >
                      {t('nav.signIn')}
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setOpen(false)
                        void signOut()
                      }}
                      className="mt-2 block w-full rounded-xl border border-red-500/30 bg-red-500/10 py-3 text-center text-sm font-bold uppercase tracking-wider text-red-400"
                    >
                      {t('nav.signOut')}
                    </button>
                  )}
                </li>
              )}
              <li>
                <Link
                  to={startPath}
                  onMouseEnter={prefetchMapRoute}
                  onFocus={prefetchMapRoute}
                  className="btn-primary-toxic mt-2 block rounded-full bg-toxic px-4 py-3.5 text-center font-extrabold text-onyx"
                  style={{ fontWeight: 800 }}
                  onClick={() => setOpen(false)}
                >
                  {t('nav.start')}
                </Link>
              </li>
              <li>
                <button
                  type="button"
                  className={`mt-2 w-full rounded-xl border py-3 text-center text-sm ${panelBorder}`}
                  onClick={() => {
                    setOpen(false)
                    setSettingsOpen(true)
                  }}
                >
                  Settings Vault
                </button>
              </li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
      <SettingsVault
        open={settingsOpen}
        locale={locale}
        preference={preference}
        simulationMode={simulationMode}
        unitSystem={unitSystem}
        vehicle={vehicle}
        currentCharge={charge}
        user={user}
        onClose={() => setSettingsOpen(false)}
        onSetPreference={setPreference}
        onToggleSimulationMode={toggleSimulationMode}
        onSetUnitSystem={selectUnitSystem}
        onSetLocale={setLocale}
        onSetVehicle={selectVehicle}
        onSetCharge={selectCharge}
        onSignOut={() => {
          setSettingsOpen(false)
          void signOut()
        }}
        t={t}
      />
    </header>
  )
}
