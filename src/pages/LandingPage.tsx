/** Output by Antigravity IDE */
import { lazy, Suspense, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Hero } from '../components/sections/Hero'
import { FeatureMatrix } from '../components/sections/FeatureMatrix'
import { HowItWorks } from '../components/sections/HowItWorks'
import { IntelligenceSection } from '../components/sections/IntelligenceSection'
import { Footer } from '../components/layout/Footer'
import type { FxControlProps } from '../components/layout/Footer'
import { scrollToSectionByHash } from '../lib/scrollToSection'
import { prefetchMapRoute } from '../lib/prefetchMapRoute'

const LiveImpact = lazy(async () => {
  const m = await import('../components/sections/LiveImpact')
  return { default: m.LiveImpact }
})

const TeamSection = lazy(async () => {
  const m = await import('../components/sections/TeamSection')
  return { default: m.TeamSection }
})

export function LandingPage({ fxControl }: { fxControl: FxControlProps }) {
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    prefetchMapRoute()
  }, [])

  useEffect(() => {
    const hash = window.location.hash
    if (!hash) return
    const run = () => scrollToSectionByHash(hash)
    requestAnimationFrame(() => {
      requestAnimationFrame(run)
    })
  }, [])

  useEffect(() => {
    const st = location.state as { scrollToHero?: boolean } | undefined
    if (!st?.scrollToHero) return
    const run = () => scrollToSectionByHash('#overview', { block: 'start' })
    requestAnimationFrame(() => {
      requestAnimationFrame(run)
    })
    navigate('.', { replace: true, state: null })
  }, [location.state, location.key, navigate])

  return (
    <>
      <Hero />
      <FeatureMatrix />
      <HowItWorks />
      <Suspense fallback={null}>
        <LiveImpact />
      </Suspense>
      <IntelligenceSection />
      <Suspense fallback={null}>
        <TeamSection />
      </Suspense>
      <Footer fxControl={fxControl} />
    </>
  )
}
