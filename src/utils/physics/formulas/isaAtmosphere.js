/**
 * ISA (INTERNATIONAL STANDARD ATMOSPHERE)
 * ========================================
 * 
 * The International Standard Atmosphere is a model of how atmospheric
 * pressure and temperature vary with altitude. It's the global standard
 * used in aviation, meteorology, and engineering.
 * 
 * KEY INSIGHT:
 * Temperature DECREASES with altitude in the troposphere (0-11km).
 * This temperature drop causes pressure to decrease faster than a
 * simple "isothermal" model would predict.
 * 
 * TROPOSPHERE MODEL (0-11km):
 *   T = T₀ - L × h     (temperature decreases linearly)
 *   P = P₀ × (T/T₀)^(g×M/(R×L))  (pressure follows)
 * 
 * CONSTANTS:
 *   T₀ = 288.15 K (15°C at sea level)
 *   L  = 0.0065 K/m (temperature lapse rate)
 *   P₀ = 101,325 Pa (standard sea level pressure)
 *   g  = 9.80665 m/s² (standard gravity)
 *   M  = 0.0289644 kg/mol (molar mass of dry air)
 *   R  = 8.31447 J/(mol·K) (universal gas constant)
 * 
 * REAL-WORLD EXAMPLES:
 *   Sea level (0m):      101,325 Pa → water boils at 100°C
 *   Denver (1,609m):      83,436 Pa → water boils at ~95°C
 *   La Paz (3,640m):      64,591 Pa → water boils at ~87°C
 *   Mt. Everest (8,848m): 31,436 Pa → water boils at ~70°C
 *   10,000m:              26,436 Pa → water boils at ~66°C
 * 
 * WHY NOT SIMPLER FORMULAS?
 * The "barometric formula" (P = P₀ × e^(-Mgh/RT)) assumes constant temperature.
 * This gives WRONG results at high altitude:
 *   - Barometric at 10km: ~30,900 Pa
 *   - ISA at 10km: ~26,400 Pa (more accurate)
 *   - Error: ~17%!
 * 
 * @see https://en.wikipedia.org/wiki/International_Standard_Atmosphere
 * @see ICAO Doc 7488 for official standard
 */

import { ATMOSPHERE } from '../../../constants/physics.js'

// ISA Troposphere Constants
const ISA = {
  T0: 288.15,           // Sea level temperature (K)
  L: 0.0065,            // Temperature lapse rate (K/m)
  P0: 101325,           // Sea level pressure (Pa)
  g: 9.80665,           // Standard gravity (m/s²)
  M: 0.0289644,         // Molar mass of dry air (kg/mol)
  R: 8.31447,           // Universal gas constant (J/(mol·K))
}

// Pre-calculate the exponent (it's a constant)
// (g × M) / (R × L) ≈ 5.2559
const ISA_EXPONENT = (ISA.g * ISA.M) / (ISA.R * ISA.L)

/**
 * Calculate atmospheric pressure at a given altitude using ISA troposphere model
 * 
 * @param {number} altitudeM - Altitude in meters above sea level
 * @returns {number} Atmospheric pressure in Pascals
 */
export function calculatePressureISA(altitudeM) {
  // Safety: treat null/undefined/NaN as sea level
  if (altitudeM === null || altitudeM === undefined || Number.isNaN(altitudeM)) {
    altitudeM = 0
  }
  
  // Calculate temperature at altitude: T = T₀ - L × h
  const T = ISA.T0 - ISA.L * altitudeM
  
  // Handle extreme altitudes (above troposphere at ~11km)
  if (T <= 0) {
    // Troposphere ends at ~11km. Return pressure at that boundary.
    const T11km = ISA.T0 - ISA.L * 11000  // ~216.65 K
    return ISA.P0 * Math.pow(T11km / ISA.T0, ISA_EXPONENT)  // ~22,632 Pa
  }
  
  // ISA pressure formula: P = P₀ × (T/T₀)^exponent
  const pressure = ISA.P0 * Math.pow(T / ISA.T0, ISA_EXPONENT)
  
  return pressure
}

/**
 * Calculate temperature at a given altitude using ISA lapse rate
 * (Useful for atmospheric modeling, not directly for boiling point)
 * 
 * @param {number} altitudeM - Altitude in meters
 * @returns {number} Temperature in Kelvin
 */
export function calculateTemperatureISA(altitudeM) {
  if (altitudeM === null || altitudeM === undefined || Number.isNaN(altitudeM)) {
    altitudeM = 0
  }
  
  const T = ISA.T0 - ISA.L * altitudeM
  
  // Clamp at tropopause (~11km, ~216.65K)
  return Math.max(T, 216.65)
}

/**
 * Reverse calculation: Find altitude from pressure
 * (Useful for "what altitude gives this pressure?" questions)
 * 
 * @param {number} pressurePa - Atmospheric pressure in Pascals
 * @returns {number} Altitude in meters
 */
export function calculateAltitudeFromPressure(pressurePa) {
  if (pressurePa >= ISA.P0) return 0
  if (pressurePa <= 0) return Infinity
  
  // Invert the ISA formula:
  // P = P₀ × (T/T₀)^exp
  // (P/P₀)^(1/exp) = T/T₀
  // T = T₀ × (P/P₀)^(1/exp)
  // T₀ - L×h = T₀ × (P/P₀)^(1/exp)
  // h = (T₀ - T₀ × (P/P₀)^(1/exp)) / L
  // h = T₀/L × (1 - (P/P₀)^(1/exp))
  
  const pressureRatio = pressurePa / ISA.P0
  const tempRatio = Math.pow(pressureRatio, 1 / ISA_EXPONENT)
  const altitude = (ISA.T0 / ISA.L) * (1 - tempRatio)
  
  return altitude
}
