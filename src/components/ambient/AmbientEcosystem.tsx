/**
 * Output by Antigravity IDE
 * Multi-layer ecosystem: mesh (parent) → topo → pulse → particles (parallax).
 * Parallax scroll updates DOM transforms only (no React state per scroll frame — 60fps friendly).
 */
import { useEffect, useRef } from 'react'
import { useReducedMotion } from 'framer-motion'
import { TopographicVeins } from './TopographicVeins'
import { FloatingParticles } from './FloatingParticles'
import { GreenEnergyPulse } from './GreenEnergyPulse'

export function AmbientEcosystem({ themeDark }: { themeDark: boolean }) {
  const reducedMotion = useReducedMotion()
  const midLayerRef = useRef<HTMLDivElement>(null)
  const fgLayerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const mid = midLayerRef.current
    const fg = fgLayerRef.current
    if (reducedMotion) {
      if (mid) mid.style.transform = 'translate3d(0, 0, 0)'
      if (fg) fg.style.transform = 'translate3d(0, 0, 0)'
      return
    }

    let raf = 0
    const apply = () => {
      const y = window.scrollY
      if (mid) mid.style.transform = `translate3d(0, ${y * 0.045}px, 0)`
      if (fg) fg.style.transform = `translate3d(0, ${y * 0.09}px, 0)`
    }
    const onScroll = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(apply)
    }
    apply()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('scroll', onScroll)
    }
  }, [reducedMotion])

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[1] overflow-hidden"
      aria-hidden
      data-ecosystem="antigravity"
    >
      <div
        ref={midLayerRef}
        className="absolute inset-0 overflow-hidden"
        style={{ transform: 'translate3d(0, 0, 0)', willChange: 'transform' }}
      >
        <TopographicVeins themeDark={themeDark} reducedMotion={!!reducedMotion} />
      </div>
      <GreenEnergyPulse themeDark={themeDark} reducedMotion={!!reducedMotion} />
      <div
        ref={fgLayerRef}
        className="absolute inset-0 overflow-hidden"
        style={{ transform: 'translate3d(0, 0, 0)', willChange: 'transform' }}
      >
        <FloatingParticles themeDark={themeDark} reducedMotion={!!reducedMotion} />
      </div>
    </div>
  )
}
