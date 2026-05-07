/**
 * Vehicle emission & efficiency profiles — scientifically grounded values.
 *
 * ✅ Prices: Jordan Ministry of Energy, May 2026 official decree
 * ✅ CO₂:    IPCC/DEFRA 2023
 * ✅ EV:     NEPCO 2023 grid intensity + EMRC TOU average tariff
 */

import { JORDAN_CONSTANTS, VEHICLE_PHYSICS } from '../config/greenDriveConfig'

export type VehicleType = 'petrol' | 'diesel' | 'hybrid' | 'electric'

export interface VehicleProfile {
  label: string
  labelAr: string
  /** Approximate vehicle mass in kg for mgh calculations */
  massKg: number
  /** kg CO₂ per litre of liquid fuel (null for EV) */
  co2PerLitre: number | null
  /** kWh per km (null for combustion) */
  kWhPerKm: number | null
  /** kg CO₂ per kWh — Jordan NEPCO factor (null for combustion) */
  co2PerKWh: number | null
  /** Base fuel consumption in L/100 km at flat, normal driving */
  baseLPer100km: number | null
  /** Jordan fuel price in JOD per litre (null for EV) */
  fuelPriceJOD: number | null
  /** Jordan electricity price in JOD per kWh (null for combustion) */
  electricityPriceJOD: number | null
}

export const VEHICLE_PROFILES: Record<VehicleType, VehicleProfile> = {
  petrol: {
    label: 'Petrol',
    labelAr: 'بنزين',
    massKg: VEHICLE_PHYSICS.MASS.petrol,
    co2PerLitre: JORDAN_CONSTANTS.CO2_PETROL_INTENSITY_KG_L,
    kWhPerKm: null,
    co2PerKWh: null,
    baseLPer100km: VEHICLE_PHYSICS.BASE_EFFICIENCY.petrol,
    // ✅ Petrol 90 — most common in Jordan (1.000 JOD/L, May 2026)
    fuelPriceJOD: JORDAN_CONSTANTS.PETROL90_PRICE_JOD,
    electricityPriceJOD: null,
  },
  diesel: {
    label: 'Diesel',
    labelAr: 'ديزل',
    massKg: VEHICLE_PHYSICS.MASS.diesel,
    co2PerLitre: JORDAN_CONSTANTS.CO2_DIESEL_INTENSITY_KG_L,
    kWhPerKm: null,
    co2PerKWh: null,
    baseLPer100km: VEHICLE_PHYSICS.BASE_EFFICIENCY.diesel,
    // ✅ Diesel — 0.790 JOD/L (May 2026)
    fuelPriceJOD: JORDAN_CONSTANTS.DIESEL_PRICE_JOD,
    electricityPriceJOD: null,
  },
  hybrid: {
    label: 'Hybrid',
    labelAr: 'هجين',
    massKg: VEHICLE_PHYSICS.MASS.hybrid,
    co2PerLitre: JORDAN_CONSTANTS.CO2_PETROL_INTENSITY_KG_L,
    kWhPerKm: null,
    co2PerKWh: null,
    baseLPer100km: VEHICLE_PHYSICS.BASE_EFFICIENCY.hybrid,
    // ✅ Petrol 95 — hybrids typically spec higher octane (1.310 JOD/L, May 2026)
    fuelPriceJOD: JORDAN_CONSTANTS.PETROL_PRICE_JOD,
    electricityPriceJOD: null,
  },
  electric: {
    label: 'Electric',
    labelAr: 'كهربائي',
    massKg: VEHICLE_PHYSICS.MASS.electric,
    co2PerLitre: null,
    kWhPerKm: VEHICLE_PHYSICS.BASE_EFFICIENCY.electric / 100, // convert kWh/100km → kWh/km
    co2PerKWh: JORDAN_CONSTANTS.CO2_GRID_INTENSITY_KG_KWH,
    baseLPer100km: null,
    fuelPriceJOD: null,
    // ✅ EMRC TOU partial-peak average — 0.118 JOD/kWh (2024–2026)
    electricityPriceJOD: JORDAN_CONSTANTS.EV_KWH_COST_JOD,
  },
}

/**
 * Compute CO₂ (kg), fuel consumption, and exact cost (JOD) for a trip.
 *
 * AUDIT NOTE — Cost chain is strictly:
 *   totalVolume × profile.pricePerUnit = costJOD
 * The elevation/efficiency multiplier ONLY affects volume, NEVER price.
 * This prevents any accidental markup on the price constant.
 */
export function computeTripEmissions(
  distanceKm: number,
  ascentM: number,
  efficiencyFactor: number,   // 0.72 (fast/aggressive) → 0.92 (eco/smooth)
  vehicle: VehicleType,
): { co2Kg: number; fuelLiters: number | null; costJOD: number; costJODStr: string; label: string } {
  const profile = VEHICLE_PROFILES[vehicle]
  const g = JORDAN_CONSTANTS.G

  // ── Elevation energy penalty (W = mgh) ──────────────────────────────────────
  const workJoules = profile.massKg * g * Math.max(0, ascentM)
  const workMJ     = workJoules / 1_000_000

  // ── ZERO-FUEL GUARD: ensure minimum sensible distance ──────────────────────
  const safeDist = Math.max(distanceKm, 0.1)

  let co2Kg: number
  let fuelLiters: number | null
  let costJOD: number
  let label: string

  if (vehicle === 'electric') {
    // EV: energy in kWh. 1 kWh = 3.6 MJ. Ascent penalty at 85% motor efficiency.
    const elevationKWh = (workMJ / 3.6) / 0.85
    const baseKWh      = safeDist * profile.kWhPerKm!
    // efficiencyFactor range: 0.72→0.92 maps to ×(1.12 - eff×0.22) = ×1.02→×0.92
    // This ONLY scales energy consumed, not price.
    const totalKWh = Math.max(baseKWh, (baseKWh + elevationKWh) * (1.12 - efficiencyFactor * 0.22))

    co2Kg     = Number((totalKWh * profile.co2PerKWh!).toFixed(4))
    fuelLiters = null
    // ✅ PRICE: totalKWh × 0.118 JOD/kWh — no other multipliers touch this line
    costJOD   = Number((totalKWh * profile.electricityPriceJOD!).toFixed(2))
    label     = `${totalKWh.toFixed(2)} kWh`
  } else {
    // ICE: energy in MJ. 1L petrol ≈ 34.2 MJ, 1L diesel ≈ 38.0 MJ. Engine eff ≈ 25%.
    const fuelEnergyDensity = vehicle === 'diesel' ? 38.0 : 34.2
    const engineEfficiency  = 0.25
    const elevationLiters   = (workMJ / fuelEnergyDensity) / engineEfficiency
    const baseLiters        = safeDist * (profile.baseLPer100km! / 100)
    // ✅ efficiencyFactor multiplier applied ONLY to volume consumption here:
    const rawLiters   = (baseLiters + elevationLiters) * (1.12 - efficiencyFactor * 0.22)
    // ZERO-FUEL GUARD: never return less than flat base consumption
    const totalLiters = Math.max(baseLiters, rawLiters)

    co2Kg     = Number((totalLiters * profile.co2PerLitre!).toFixed(4))
    fuelLiters = Number(totalLiters.toFixed(3))
    // ✅ PRICE: totalLiters × verified JOD/L constant — no elevation or eff multiplier
    costJOD   = Number((totalLiters * profile.fuelPriceJOD!).toFixed(2))
    label     = `${totalLiters.toFixed(2)} L`
  }

  const costJODStr = costJOD.toFixed(2)

  // ── Debug Audit Logger (remove before production) ──────────────────────────
  if (import.meta.env.DEV) {
    console.table({
      Vehicle:          vehicle,
      'Distance (km)':  safeDist,
      'Ascent (m)':     ascentM,
      'Eff. Factor':    efficiencyFactor,
      'Volume (L/kWh)': fuelLiters ?? label,
      'Price (JOD/unit)': profile.fuelPriceJOD ?? profile.electricityPriceJOD,
      'Exact Cost (JOD)': costJODStr,
    })
  }

  return { co2Kg, fuelLiters, costJOD, costJODStr, label }
}

/**
 * NEW: Calculates "Traffic Waste" metrics.
 * Compares real-time duration vs static duration to find fuel/JOD lost to idling.
 */
export function calculateTrafficWaste(
  totalDurationMin: number,
  staticDurationMin: number,
  vehicleType: VehicleType
) {
  const trafficDelayMin = Math.max(0, totalDurationMin - staticDurationMin)
  if (trafficDelayMin <= 0) return null

  const idleRates = { petrol: 1.2, diesel: 1.0, hybrid: 0.4, electric: 1.5 }
  const rate = idleRates[vehicleType] || 1.2
  const wastedVolume = (trafficDelayMin / 60) * rate
  
  const prices = { petrol: 1.000, diesel: 0.790, hybrid: 1.310, electric: 0.118 }
  const price = prices[vehicleType] || 1.000
  const wastedJod = wastedVolume * price

  return {
    delayMin: trafficDelayMin,
    volume: wastedVolume,
    jod: wastedJod,
    jodStr: wastedJod.toFixed(2)
  }
}

/**
 * NEW: Projects the impact of a single trip's savings over a year (250 days).
 */
export function projectYearlyImpact(savingsJod: number, savingsCo2: number) {
  const DAYS = 250 
  return {
    jod: (savingsJod * DAYS).toFixed(0),
    co2: (savingsCo2 * DAYS).toFixed(1),
    trees: Math.round((savingsCo2 * DAYS) / 21) 
  }
}
