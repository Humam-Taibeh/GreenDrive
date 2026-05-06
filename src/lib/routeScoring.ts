/** Output by Antigravity IDE — weighted route scoring utility. */
import type { RoutePrefs } from '../components/cards/RoutePrefsPanel'

export function scoreRoute(
  route: { co2Kg: number; durationMin: number; distanceKm: number; ascentM?: number; focus: string },
  allRoutes: { co2Kg: number; durationMin: number }[],
  prefs: RoutePrefs,
): number {
  const maxCo2 = Math.max(...allRoutes.map((r) => r.co2Kg), 0.01)
  const maxTime = Math.max(...allRoutes.map((r) => r.durationMin), 1)

  const ecoW = prefs.ecoWeight / 100
  const timeW = 1 - ecoW

  const co2Norm = route.co2Kg / maxCo2
  const timeNorm = route.durationMin / maxTime

  let score = ecoW * co2Norm + timeW * timeNorm
  const sensitivity = 0.5 + ecoW * 1.5

  if (route.ascentM && route.ascentM > 40) {
    const hillFactor = route.ascentM / 150
    score += (prefs.avoidHills ? 0.3 : 0.1) * hillFactor * sensitivity
  }

  if (route.focus === 'fast') {
    score += (prefs.avoidTraffic ? 0.2 : 0.05) * sensitivity
  }

  return score
}
