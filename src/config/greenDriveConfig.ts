/**
 * GreenDrive Secure Config — Jordan-specific constants.
 * 
 * ✅ VERIFIED SOURCE: Jordan Ministry of Energy & Mineral Resources
 *    Oil Products Pricing Committee — Official May 2026 Pricing Decree
 * ✅ EV TARIFF: EMRC Time-of-Use tariff (Jordan Times, 2024–2026)
 *
 * Petrol 90:  1.000 JOD/L  (official May 2026)
 * Petrol 95:  1.310 JOD/L  (official May 2026)
 * Diesel:     0.790 JOD/L  (official May 2026)
 * EV peak:    0.160 JOD/kWh (17:00–23:00)
 * EV partial: 0.118 JOD/kWh (14:00–17:00 & 23:00–05:00)
 * EV off-peak:0.108 JOD/kWh (05:00–14:00) ← most common for daytime driving
 */
export const JORDAN_CONSTANTS = {
  // ── Fuel Prices (JOD per unit) ── May 2026 Official Decree ──────────────
  PETROL90_PRICE_JOD:  1.000,  // Petrol 90 Octane — most common in Jordan
  PETROL_PRICE_JOD:    1.310,  // Petrol 95 Octane — performance / hybrid
  DIESEL_PRICE_JOD:    0.790,  // Diesel

  // ── EMRC EV Time-of-Use Tariff (fils → JOD, confirmed 2024–2026) ────────
  EV_KWH_COST_JOD:       0.118,  // Partial-peak (representative daytime average)
  EV_KWH_OFFPEAK_JOD:    0.108,  // Off-peak 05:00–14:00 (cheapest charging)
  EV_KWH_PEAK_JOD:       0.160,  // Peak 17:00–23:00 (most expensive)

  // ── CO2 Intensities (kg CO2 per unit) ── IPCC/DEFRA 2023, NEPCO 2023 ───
  CO2_GRID_INTENSITY_KG_KWH: 0.61,   // NEPCO Jordan grid 2023 (coal+oil+20% RE)
  CO2_PETROL_INTENSITY_KG_L: 2.31,   // IPCC/DEFRA 2023
  CO2_DIESEL_INTENSITY_KG_L: 2.68,   // IPCC/DEFRA 2023

  // ── Physics Constants ────────────────────────────────────────────────────
  G: 9.80665, // Standard gravity m/s²
}

export const VEHICLE_PHYSICS = {
  // Average masses (kg)
  MASS: {
    petrol: 1550,
    diesel: 1650,
    hybrid: 1750,
    electric: 1950,
  },
  // Efficiency factors (L/100km or kWh/100km)
  BASE_EFFICIENCY: {
    petrol: 7.5,  // L/100km
    diesel: 6.0,  // L/100km
    hybrid: 4.5,  // L/100km
    electric: 18.0, // kWh/100km
  }
}
