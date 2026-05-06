import type { RouteOption } from '../types'

/**
 * Mock routes — Amman area (ZU campus area → Downtown-ish) ≈ 12–14 km.
 *
 * VALIDATION OF PREVIOUS NUMBERS:
 *  Eco route: 13.1 km, fuelLiters=0.76, co2Kg=1.72
 *  → 0.76 L / 13.1 km * 100 = 5.8 L/100km — too low for city driving ❌
 *  → 1.72 / 0.76 = 2.26 kg CO₂/L — close but slightly under petrol's 2.31 ❌
 *
 *  Fast route: 12.4 km, fuelLiters=0.89, co2Kg=2.05
 *  → 0.89 / 12.4 * 100 = 7.18 L/100km ✅ (valid range)
 *  → 2.05 / 0.89 = 2.30 kg CO₂/L ≈ 2.31 ✅
 *
 * CORRECTED:
 *  Using petrol baseline 8.0 L/100km (city Amman), 2.31 kg CO₂/L.
 *  Eco route gets terrain-smart advantage: flatter path, ~6.8 L/100km effective.
 *  Savings vs Fastest: ~19% CO₂ (realistic for Amman hill avoidance).
 *
 * Polyline: real Amman coords, ZU area (31.95°N, 35.91°E) → Shmeisani area.
 */
const base = { lat: 31.9539, lng: 35.9106 }

export const MOCK_ROUTES: RouteOption[] = [
  {
    id: 'eco',
    label: 'Eco-Friendly',
    focus: 'eco',
    distanceKm: 13.1,
    durationMin: 27,          // slightly longer — avoids steep hills
    fuelLiters: 0.89,         // 13.1 km × 6.8 L/100km = 0.89 L ✅
    co2Kg: 2.06,              // 0.89 × 2.31 = 2.06 kg ✅
    savingsPercent: 19,       // vs Fastest (2.54 kg) → (2.54-2.06)/2.54 = 18.9% ✅
    polyline: [
      base,
      { lat: 31.949, lng: 35.918 },
      { lat: 31.944, lng: 35.928 },
      { lat: 31.937, lng: 35.938 },
      { lat: 31.932, lng: 35.948 },
    ],
  },
  {
    id: 'fast',
    label: 'Fastest',
    focus: 'fast',
    distanceKm: 12.4,
    durationMin: 21,
    fuelLiters: 1.10,         // 12.4 km × 8.9 L/100km (Amman hills fast mode) = 1.10 L ✅
    co2Kg: 2.54,              // 1.10 × 2.31 = 2.54 kg ✅
    savingsPercent: 0,        // reference route — worst emissions
    polyline: [
      base,
      { lat: 31.948, lng: 35.905 },
      { lat: 31.942, lng: 35.912 },
      { lat: 31.938, lng: 35.924 },
      { lat: 31.934, lng: 35.936 },
    ],
  },
  {
    id: 'cheap',
    label: 'Cheapest',
    focus: 'cheap',
    distanceKm: 12.7,
    durationMin: 24,
    fuelLiters: 0.96,         // 12.7 km × 7.6 L/100km = 0.97 L ✅
    co2Kg: 2.22,              // 0.96 × 2.31 = 2.22 kg ✅
    savingsPercent: 13,       // vs Fastest: (2.54-2.22)/2.54 = 12.6% ✅
    polyline: [
      base,
      { lat: 31.951, lng: 35.908 },
      { lat: 31.946, lng: 35.919 },
      { lat: 31.939, lng: 35.931 },
      { lat: 31.933, lng: 35.942 },
    ],
  },
]
