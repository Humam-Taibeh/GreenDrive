/**
 * Output by Antigravity IDE
 * Multi-layer ecosystem: mesh (parent) → topo → pulse → particles (parallax).
 */
import { useReducedMotion } from 'framer-motion'
import { TopographicVeins } from './TopographicVeins'
import { FloatingParticles } from './FloatingParticles'
import { GreenEnergyPulse } from './GreenEnergyPulse'

export function AmbientEcosystem({ themeDark }: { themeDark: boolean }) {
  const reducedMotion = useReducedMotion()

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[1] overflow-hidden"
      aria-hidden
      data-ecosystem="antigravity"
    >
      <div
        className="absolute inset-0 overflow-hidden"
      >
        <TopographicVeins themeDark={themeDark} reducedMotion={!!reducedMotion} />
      </div>
      <GreenEnergyPulse themeDark={themeDark} reducedMotion={!!reducedMotion} />
      <div
        className="absolute inset-0 overflow-hidden"
      >
        <FloatingParticles themeDark={themeDark} reducedMotion={!!reducedMotion} />
      </div>
    </div>
  )
}
