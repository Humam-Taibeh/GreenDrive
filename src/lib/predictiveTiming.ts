/**
 * Predictive Eco Timing — src/lib/predictiveTiming.ts
 *
 * Simulates the same route at 5 departure offsets (0, 15, 30, 45, 60 min)
 * and identifies the optimal departure window for minimum CO₂ + fuel cost.
 *
 * DESIGN PRINCIPLES:
 *  - Reuses existing vehicleProfiles + elevationFuel math → no new physics invented
 *  - Traffic multipliers are heuristic (time-of-day, not heavy ML)
 *  - EV grid awareness: Jordan solar peak (11:00–15:00) lowers CO₂/kWh
 *  - All values explainable — no black-box claims
 *  - Lightweight: pure functions, no async, runs in <1ms
 */

import { VEHICLE_PROFILES } from './vehicleProfiles'
import type { VehicleType } from './vehicleProfiles'
import { estimateFuelLitersFromTerrain } from './elevationFuel'
import { getTrafficWindow } from './trafficModel'

// ─── Traffic trend multiplier ────────────────────────────────────────────────

/**
 * Fine-grained traffic trend within the current hour window.
 * Uses the Amman window multiplier as base, then applies a local trend
 * for the sub-hour offset.
 *
 * Trend logic: if currently in peak traffic, waiting 15–45 min often
 * provides partial relief as the peak shifts or dissipates slightly.
 * If in light traffic, no meaningful change within 60 min.
 */
function estimateTrafficMultiplier(offsetMinutes: number, nowHour: number): number {
  const totalMin = nowHour * 60 + offsetMinutes
  const futureHour = Math.floor(totalMin / 60) % 24

  const window = getTrafficWindow(futureHour)
  const base = window.multiplier

  // Sub-hour trend: peak windows taper at the edges (last 15 min of peak)
  const minuteInHour = totalMin % 60

  // During heavy peak (multiplier > 1.4): benefit from waiting
  if (base > 1.4) {
    if (offsetMinutes === 0) return base                       // right in it
    if (offsetMinutes <= 15) return base - 0.05               // slight easing
    if (offsetMinutes <= 30) return base - 0.12               // noticeable easing
    if (offsetMinutes <= 45) return Math.max(base - 0.18, 1.05) // significant
    return Math.max(base - 0.22, 1.0)                         // near-clear
  }

  // During moderate traffic (1.15–1.4): small variation
  if (base > 1.15) {
    if (offsetMinutes <= 15) return base + 0.02               // slightly worse (building)
    if (offsetMinutes <= 30) return base                      // stable
    return Math.max(base - 0.06, 1.0)                        // slight improvement
  }

  // Light traffic: marginal changes only
  void minuteInHour
  return base + (offsetMinutes <= 15 ? 0.01 : 0)
}

// ─── Jordan EV grid CO₂ factor ───────────────────────────────────────────────

/**
 * Jordan-specific grid CO₂ intensity by hour (kg CO₂/kWh).
 *
 * Rationale (NEPCO + RE mix):
 *  - Solar active 10:00–16:00 → lower intensity (~0.45–0.50 kg/kWh)
 *  - Evening fossil peak 18:00–22:00 → higher intensity (~0.68–0.72 kg/kWh)
 *  - Night baseline → ~0.58 kg/kWh (gas peakers partially offline)
 *
 * Baseline from previous audit: 0.61 kg/kWh (NEPCO 2023 annual average).
 */
export function jordanGridCO2Factor(hour: number): number {
  if (hour >= 11 && hour <= 15) return 0.45  // solar peak — cleanest window
  if (hour >= 10 && hour <= 16) return 0.52  // solar shoulder
  if (hour >= 18 && hour <= 22) return 0.70  // evening fossil peak
  if (hour >= 23 || hour <= 5)  return 0.58  // night — reduced demand
  return 0.61                                // default NEPCO average
}

// ─── Core simulation ─────────────────────────────────────────────────────────

export interface RouteSnapshot {
  /** Distance in km */
  distanceKm: number
  /** Free-flow duration in minutes */
  durationMin: number
  /** Net ascent in metres */
  ascentM: number
  /** Route efficiency factor (eco=0.92, fast=0.72, cheap=0.85) */
  efficiency: number
}

export interface TimingSimResult {
  offsetMin: number            // 0 | 15 | 30 | 45 | 60
  departureHour: number        // e.g. 22 (hour of departure)
  departureMinute: number
  trafficMultiplier: number    // e.g. 1.55
  adjustedTimeMin: number      // travel time with traffic
  fuelL: number | null         // null for EV
  kWhConsumed: number | null   // null for combustion
  co2Kg: number
  costJOD: number
  gridCO2Factor: number | null // null for combustion
  /** Lower = better. Composite of CO₂ (70%) + time (30%), normalised. */
  score: number
}

/**
 * Simulate a single route at a given departure offset.
 * Reuses physics from elevationFuel + vehicleProfiles exactly.
 */
export function simulateRouteAtOffset(
  offsetMinutes: number,
  route: RouteSnapshot,
  vehicle: VehicleType,
  nowHour: number,
  nowMinute: number,
): TimingSimResult {
  const totalMin = nowHour * 60 + nowMinute + offsetMinutes
  const departureHour = Math.floor(totalMin / 60) % 24
  const departureMinute = totalMin % 60

  const trafficMultiplier = estimateTrafficMultiplier(offsetMinutes, nowHour)

  // Stop-and-go fuel penalty: each 0.1 above 1.0 multiplier → +20% fuel
  // Physical basis: idle & acceleration cycles waste ~2× the free-flow fuel delta
  const stopGoFuelFactor = 1 + (trafficMultiplier - 1) * 2.0

  const adjustedTimeMin = Math.round(route.durationMin * trafficMultiplier)

  const profile = VEHICLE_PROFILES[vehicle]

  if (vehicle === 'electric') {
    // EV: terrain-aware kWh + stop-go penalty + time-of-day grid CO₂
    const baseKWh = estimateFuelLitersFromTerrain({
      distanceKm: route.distanceKm,
      ascentM: route.ascentM,
      efficiency: route.efficiency,
      baseLPer100km: undefined,  // not used for EV path; we compute kWh directly
    }) // Note: this returns an L-equivalent; for EV we use the kWh path below

    // Direct kWh calculation (mirrors computeTripEmissions EV branch)
    const hillFactor = 1 + (route.ascentM / 100) * 0.001 * 10
    const kWhBase = route.distanceKm * profile.kWhPerKm! * hillFactor * (0.7 + route.efficiency * 0.3)
    void baseKWh // not used for EV
    const kWhConsumed = Math.round(kWhBase * stopGoFuelFactor * 100) / 100

    const gridCO2Factor = jordanGridCO2Factor(departureHour)
    const co2Kg = Math.round(kWhConsumed * gridCO2Factor * 100) / 100
    const costJOD = Math.round(kWhConsumed * profile.electricityPriceJOD! * 100) / 100

    return {
      offsetMin: offsetMinutes,
      departureHour,
      departureMinute,
      trafficMultiplier,
      adjustedTimeMin,
      fuelL: null,
      kWhConsumed,
      co2Kg,
      costJOD,
      gridCO2Factor,
      score: 0, // computed below by getBestDepartureTime
    }
  }

  // Combustion: terrain-aware fuel × stop-go penalty
  const baseFuelL = estimateFuelLitersFromTerrain({
    distanceKm: route.distanceKm,
    ascentM: route.ascentM,
    efficiency: route.efficiency,
    baseLPer100km: profile.baseLPer100km ?? 8.0,
  })
  const fuelL = Math.round(baseFuelL * stopGoFuelFactor * 100) / 100
  const co2Kg = Math.round(fuelL * profile.co2PerLitre! * 100) / 100
  const costJOD = Math.round(fuelL * profile.fuelPriceJOD! * 100) / 100

  return {
    offsetMin: offsetMinutes,
    departureHour,
    departureMinute,
    trafficMultiplier,
    adjustedTimeMin,
    fuelL,
    kWhConsumed: null,
    co2Kg,
    costJOD,
    gridCO2Factor: null,
    score: 0,
  }
}

// ─── Best departure selector ──────────────────────────────────────────────────

export interface BestDepartureResult {
  bestOffsetMin: number        // 0 | 15 | 30 | 45 | 60
  bestSim: TimingSimResult
  allSims: TimingSimResult[]
  /** vs leave-now (t=0) */
  co2SavingPercent: number
  fuelSavingPercent: number    // 0 for EV
  kWhSavingPercent: number     // 0 for combustion
  /** "+2 min" or "−1 min" */
  timeImpactLabel: string
  /** Human-readable summary */
  summary: string
  /** Is the best time right now? */
  leaveNow: boolean
}

const OFFSETS = [0, 15, 30, 45, 60] as const

/**
 * Run all 5 simulations and pick the optimal departure.
 *
 * Scoring: 70% weight on CO₂ + 30% weight on adjusted time.
 * Both normalised to [0,1] across the 5 options.
 * Lower score = better.
 */
export function getBestDepartureTime(
  route: RouteSnapshot,
  vehicle: VehicleType,
  nowHour: number,
  nowMinute: number,
): BestDepartureResult {
  // Run all simulations
  const sims = OFFSETS.map((offset) =>
    simulateRouteAtOffset(offset, route, vehicle, nowHour, nowMinute),
  )

  // Normalise CO₂ and time to [0,1]
  const co2Values = sims.map((s) => s.co2Kg)
  const timeValues = sims.map((s) => s.adjustedTimeMin)
  const co2Min = Math.min(...co2Values)
  const co2Max = Math.max(...co2Values)
  const timeMin = Math.min(...timeValues)
  const timeMax = Math.max(...timeValues)

  const co2Range = co2Max - co2Min || 1
  const timeRange = timeMax - timeMin || 1

  const scored = sims.map((s) => ({
    ...s,
    score:
      0.7 * ((s.co2Kg - co2Min) / co2Range) +
      0.3 * ((s.adjustedTimeMin - timeMin) / timeRange),
  }))

  // Pick lowest score (best)
  const best = scored.reduce((a, b) => (a.score < b.score ? a : b))
  const nowSim = scored[0]! // t=0 baseline

  // Savings vs leave-now
  const co2Saving = nowSim.co2Kg - best.co2Kg
  const co2SavingPercent =
    nowSim.co2Kg > 0 ? Math.round((co2Saving / nowSim.co2Kg) * 100) : 0

  const fuelSaving =
    nowSim.fuelL !== null && best.fuelL !== null ? nowSim.fuelL - best.fuelL : 0
  const fuelSavingPercent =
    nowSim.fuelL && nowSim.fuelL > 0
      ? Math.round((fuelSaving / nowSim.fuelL) * 100)
      : 0

  const kWhSaving =
    nowSim.kWhConsumed !== null && best.kWhConsumed !== null
      ? nowSim.kWhConsumed - best.kWhConsumed
      : 0
  const kWhSavingPercent =
    nowSim.kWhConsumed && nowSim.kWhConsumed > 0
      ? Math.round((kWhSaving / nowSim.kWhConsumed) * 100)
      : 0

  const timeDelta = best.adjustedTimeMin - nowSim.adjustedTimeMin
  const timeImpactLabel =
    timeDelta === 0 ? 'same time' : timeDelta > 0 ? `+${timeDelta} min` : `${timeDelta} min`

  const leaveNow = best.offsetMin === 0

  // Human summary
  let summary: string
  if (leaveNow) {
    summary = `Now is the best time — traffic is already at or near its lightest.`
  } else if (vehicle === 'electric' && kWhSavingPercent > 0) {
    summary = `Leave in ${best.offsetMin} min → save ${kWhSavingPercent}% energy & ${co2SavingPercent}% CO₂ (${timeImpactLabel}). Jordan solar output peaks around that time.`
  } else if (co2SavingPercent > 0 || fuelSavingPercent > 0) {
    summary = `Leave in ${best.offsetMin} min → save ${co2SavingPercent}% CO₂ & ${fuelSavingPercent}% fuel (${timeImpactLabel}).`
  } else {
    summary = `No meaningful improvement expected by waiting — conditions are stable.`
  }

  return {
    bestOffsetMin: best.offsetMin,
    bestSim: best,
    allSims: scored,
    co2SavingPercent,
    fuelSavingPercent,
    kWhSavingPercent,
    timeImpactLabel,
    summary,
    leaveNow,
  }
}
