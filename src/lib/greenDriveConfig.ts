/**
 * GreenDrive Deterministic Config — Jordan-Specific Constants.
 * These values are verified for the Jordan market and are used to prevent AI hallucinations.
 */

export const JORDAN_CONSTANTS = {
  // Fuel Prices (JOD per unit)
  PRICE_PETROL: 1.18,   // JOD/L (95 Octane approx)
  PRICE_DIESEL: 0.85,   // JOD/L
  PRICE_EV: 0.12,       // JOD/kWh (Tier 3 / Public Fast Charge)

  // CO2 Intensity (kg CO2 per unit)
  CO2_PETROL: 2.31,     // kg CO2 per liter petrol
  CO2_DIESEL: 2.68,     // kg CO2 per liter diesel
  CO2_GRID: 0.45,       // kg CO2 per kWh (Jordan average grid intensity)

  // Physics Constants
  G: 9.80665,           // Gravity (m/s^2)
  ASCENT_PENALTY: 1.25, // Energy loss factor during ascent
  REGEN_EFFICIENCY: 0.65 // Efficiency of regenerative braking during descent
} as const
