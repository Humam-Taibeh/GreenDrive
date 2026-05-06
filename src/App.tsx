/**
 * Output by Antigravity IDE
 * GreenDrive Enterprise — Antigravity IDE
 */
import { lazy, Suspense, useCallback, useEffect, useState } from 'react'
import { BrowserRouter, Navigate, useLocation } from 'react-router-dom'
import { LazyMotion, AnimatePresence, domMax, m, useReducedMotion } from 'framer-motion'
import { ThemeProvider, useTheme } from './contexts/ThemeContext'
import { LocaleProvider } from './contexts/LocaleContext'
import { AuthProvider } from './contexts/AuthContext'
import { InitialLoader } from './components/layout/InitialLoader'
import { Navbar } from './components/layout/Navbar'
import { LandingRouteSkeleton, MapRouteSkeleton } from './components/layout/RouteSkeletons'
import { ErrorBoundary } from './components/error/ErrorBoundary'

const LandingPage = lazy(async () => {
  const mod = await import('./pages/LandingPage')
  return { default: mod.LandingPage }
})

const MapViewPage = lazy(async () => {
  const mod = await import('./pages/MapViewPage')
  return { default: mod.MapViewPage }
})

const AuthVaultPage = lazy(async () => {
  const mod = await import('./pages/AuthVaultPage')
  return { default: mod.AuthVaultPage }
})



const LiquidMeshBackground = lazy(async () => {
  const mod = await import('./components/layout/LiquidMeshBackground')
  return { default: mod.LiquidMeshBackground }
})

const AmbientEcosystem = lazy(async () => {
  const mod = await import('./components/ambient/AmbientEcosystem')
  return { default: mod.AmbientEcosystem }
})

const PreferenceBridge = lazy(async () => {
  const mod = await import('./components/PreferenceBridge')
  return { default: mod.PreferenceBridge }
})

const easeOut = [0.16, 1, 0.3, 1] as const

/** Opacity-only route transitions — avoids CSS transform on the page wrapper (transform breaks position:fixed descendants). */
function landingOpacityOnlyMotion(reduce: boolean | null) {
  if (reduce) {
    return {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
      transition: { duration: 0.12, ease: easeOut },
    }
  }
  return {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.28, ease: easeOut },
  }
}

function mapOpacityOnlyMotion(reduce: boolean | null) {
  if (reduce) {
    return {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
      transition: { duration: 0.12, ease: easeOut },
    }
  }
  return {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.28, ease: easeOut, delay: 0.02 },
  }
}

function ThemedShell() {
  const { pathname } = useLocation()
  const { resolvedTheme } = useTheme()
  const reduceMotion = useReducedMotion()
  const themeDark = resolvedTheme === 'dark'
  const [meshDisabled, setMeshDisabled] = useState(() => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem('gd-disable-mesh') === '1'
  })
  const [autoDisabled, setAutoDisabled] = useState(false)
  const showMesh = (pathname === '/' || pathname === '/auth') && !meshDisabled

  useEffect(() => {
    let raf = 0
    let frames = 0
    let lowFpsHits = 0
    let sampleStart = performance.now()

    const loop = (now: number) => {
      frames += 1
      const elapsed = now - sampleStart
      if (elapsed >= 1000) {
        const fps = (frames * 1000) / elapsed
        frames = 0
        sampleStart = now
        if (fps < 50) {
          lowFpsHits += 1
          if (lowFpsHits >= 2) {
            setAutoDisabled(true)
            setMeshDisabled(true)
            try {
              localStorage.setItem('gd-disable-mesh', '1')
            } catch {
              /* ignore */
            }
            return
          }
        } else {
          lowFpsHits = 0
        }
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])

  const toggleMesh = useCallback(() => {
    setAutoDisabled(false)
    setMeshDisabled((prev) => {
      const next = !prev
      try {
        localStorage.setItem('gd-disable-mesh', next ? '1' : '0')
      } catch {
        /* ignore */
      }
      return next
    })
  }, [])

  return (
    <LazyMotion features={domMax} strict>
      <InitialLoader />
      {showMesh && (
        <Suspense fallback={null}>
          <LiquidMeshBackground themeDark={themeDark} />
        </Suspense>
      )}
      <Suspense fallback={null}>
        <AmbientEcosystem themeDark={themeDark} />
      </Suspense>
      <Suspense fallback={null}>
        <PreferenceBridge />
      </Suspense>
      {/* Navbar must stay OUTSIDE any transformed ancestor (route m.div uses y/scale) or position:fixed breaks */}
      {pathname === '/' && <Navbar />}
      <div className="relative z-10 isolate h-auto min-h-[100dvh] min-h-svh overflow-visible text-zinc-950 dark:text-white">
        <AnimatePresence mode="wait">
          {pathname === '/' && (
            <m.div
              key="page-landing"
              className="w-full"
              style={{ willChange: 'opacity' }}
              {...landingOpacityOnlyMotion(reduceMotion)}
            >
              <Suspense fallback={<LandingRouteSkeleton />}>
                <LandingPage
                  fxControl={{
                    disabled: meshDisabled,
                    autoDisabled,
                    onToggle: toggleMesh,
                  }}
                />
              </Suspense>
            </m.div>
          )}
          {pathname === '/map' && (
            <m.div
              key="page-map"
              className="w-full"
              style={{ willChange: 'opacity' }}
              {...mapOpacityOnlyMotion(reduceMotion)}
            >
              <Suspense fallback={<MapRouteSkeleton />}>
                <MapViewPage />
              </Suspense>
            </m.div>
          )}
          {pathname === '/auth' && (
            <m.div
              key="page-auth"
              className="w-full"
              style={{ willChange: 'opacity' }}
              {...landingOpacityOnlyMotion(reduceMotion)}
            >
              <Suspense fallback={<LandingRouteSkeleton />}>
                <AuthVaultPage />
              </Suspense>
            </m.div>
          )}
          {pathname !== '/' && pathname !== '/map' && pathname !== '/auth' && <Navigate to="/" replace />}
        </AnimatePresence>
      </div>
    </LazyMotion>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <LocaleProvider>
        <AuthProvider>
          <BrowserRouter>
            <ErrorBoundary>
              <ThemedShell />
            </ErrorBoundary>
          </BrowserRouter>
        </AuthProvider>
      </LocaleProvider>
    </ThemeProvider>
  )
}
