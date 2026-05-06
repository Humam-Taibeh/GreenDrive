/**
 * Covers first paint until fonts, window load, landing chunk + hero/process DOM exist,
 * then extra frames so scroll targets are laid out before fade (reduces first-scroll jank).
 */
import { useEffect, useState } from 'react'
import { useTheme } from '../../contexts/ThemeContext'
import { prefetchMapRoute } from '../../lib/prefetchMapRoute'

const MIN_MS = 520
const FADE_MS = 380
const CAP_MS = 3800
const DOM_WAIT_MS = 2000

function raf3(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => resolve())
      })
    })
  })
}

function idleDeadline(timeoutMs: number): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window.requestIdleCallback === 'function') {
      window.requestIdleCallback(() => resolve(), { timeout: timeoutMs })
    } else {
      window.setTimeout(resolve, Math.min(48, timeoutMs))
    }
  })
}

/** Poll until landing sections exist (Suspense committed) or timeout */
function waitForLandingSections(timeoutMs: number): Promise<void> {
  const t0 = performance.now()
  return new Promise((resolve) => {
    const tick = () => {
      const hero = document.getElementById('hero-zone')
      const features = document.getElementById('features')
      const process = document.getElementById('how-it-works')
      if (hero && features && process) {
        hero.getBoundingClientRect()
        features.getBoundingClientRect()
        process.getBoundingClientRect()
        resolve()
        return
      }
      if (performance.now() - t0 >= timeoutMs) {
        resolve()
        return
      }
      requestAnimationFrame(tick)
    }
    tick()
  })
}

export function InitialLoader() {
  const { resolvedTheme } = useTheme()
  const dark = resolvedTheme === 'dark'
  const [phase, setPhase] = useState<'show' | 'exit' | 'gone'>('show')

  useEffect(() => {
    let cancelled = false
    const t0 = performance.now()

    const waitBoot = async () => {
      let elapsed = 0
      try {
        const fonts =
          document.fonts?.ready?.catch(() => undefined) ?? Promise.resolve(undefined)
        const loaded = new Promise<void>((resolve) => {
          if (document.readyState === 'complete') resolve()
          else window.addEventListener('load', () => resolve(), { once: true })
        })
        await Promise.race([Promise.all([fonts, loaded]), new Promise((r) => setTimeout(r, CAP_MS))])
        if (cancelled) return

        const path = window.location.pathname
        if (path === '/map') {
          await import('../../pages/MapViewPage').catch(() => undefined)
        } else {
          await import('../../pages/LandingPage').catch(() => undefined)
          prefetchMapRoute()
          await waitForLandingSections(DOM_WAIT_MS)
        }

        if (cancelled) return
        await raf3()
        await idleDeadline(48)
      } finally {
        elapsed = performance.now() - t0
      }

      if (cancelled) return
      if (elapsed < MIN_MS) await new Promise((r) => setTimeout(r, MIN_MS - elapsed))
      if (cancelled) return

      setPhase('exit')
      window.setTimeout(() => {
        if (!cancelled) setPhase('gone')
      }, FADE_MS)
    }

    void waitBoot()
    return () => {
      cancelled = true
    }
  }, [])

  if (phase === 'gone') return null

  return (
    <div
      className={`fixed inset-0 z-[10000] flex flex-col items-center justify-center transition-opacity duration-[380ms] ease-out ${
        phase === 'exit' ? 'pointer-events-none opacity-0' : 'opacity-100'
      } ${dark ? 'bg-[#000000]' : 'bg-[#f5faf8]'}`}
      role="status"
      aria-live="polite"
      aria-busy={phase === 'show'}
    >
      <div className="flex flex-col items-center gap-6 px-6">
        <div
          className={`h-11 w-11 rounded-full border-2 ${
            dark ? 'border-white/10 border-t-toxic' : 'border-black/10 border-t-toxic'
          } animate-spin`}
          style={{ animationDuration: '1.05s' }}
          aria-hidden
        />
        <div className="space-y-3 text-center">
          <div className={`gd-skeleton-bar mx-auto h-2 w-36 rounded-full ${dark ? 'opacity-90' : ''}`} />
          <div className={`gd-skeleton-bar mx-auto h-2 w-28 rounded-full ${dark ? 'opacity-80' : ''}`} />
        </div>
        <p className={`text-[11px] font-medium tracking-[0.22em] uppercase ${dark ? 'text-white/45' : 'text-zinc-500'}`}>
          GreenDrive
        </p>
      </div>
    </div>
  )
}
