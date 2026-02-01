/**
 * ANTOINE EQUATION
 * ================
 * 
 * The Antoine equation is an empirical correlation that relates vapor pressure
 * to temperature for pure substances. It's one of the most widely used equations
 * in chemical engineering for predicting boiling points at different pressures.
 * 
 * EQUATION:
 *   log₁₀(Pvap) = A - B/(C + T)
 * 
 * Where:
 *   Pvap = vapor pressure (typically mmHg)
 *   T = temperature (°C)
 *   A, B, C = substance-specific empirical constants
 * 
 * REARRANGED FOR TEMPERATURE (what we usually need):
 *   T = B/(A - log₁₀(Pvap)) - C
 * 
 * PHYSICAL MEANING:
 * A liquid boils when its vapor pressure equals the surrounding atmospheric
 * pressure. So to find the boiling point at a given altitude, we:
 *   1. Get the atmospheric pressure at that altitude
 *   2. Solve Antoine for T where Pvap = Patm
 * 
 * ACCURACY:
 *   - Within verified range (TminC to TmaxC): ±0.5°C
 *   - Outside range: accuracy degrades gradually, not a cliff
 *   - Near critical point: Antoine breaks down entirely
 * 
 * IMPORTANT NOTE ON TminC/TmaxC:
 * These define the EMPIRICALLY VERIFIED range, NOT hard limits!
 * The Antoine equation produces a smooth, continuous curve. We do NOT clamp
 * results to this range. Instead, we return metadata so the UI can warn users
 * when extrapolating beyond verified data.
 * 
 * @see https://en.wikipedia.org/wiki/Antoine_equation
 * @see NIST Chemistry WebBook for coefficient values
 */

/**
 * Solve Antoine equation for temperature at given vapor pressure
 * 
 * @param {number} pressurePa - Atmospheric pressure in Pascals
 * @param {object} coefficients - { A, B, C, TminC, TmaxC } from substance JSON
 * @returns {object|null} { temperature: °C, isExtrapolated: bool, verifiedRange: {min, max} }
 */
export function solveAntoineForTemperature(pressurePa, coefficients) {
  if (!coefficients) return null
  
  const { A, B, C, TminC, TmaxC } = coefficients
  if (!A || !B || !C) return null
  
  // Convert pressure from Pa to mmHg
  // Standard: 1 mmHg = 133.322 Pa (exactly)
  const MMHG_PER_PA = 1 / 133.322
  const pressureMmHg = pressurePa * MMHG_PER_PA
  
  // Rearrange Antoine equation:
  //   log₁₀(P) = A - B/(C + T)
  //   A - log₁₀(P) = B/(C + T)
  //   C + T = B / (A - log₁₀(P))
  //   T = B / (A - log₁₀(P)) - C
  
  const logP = Math.log10(pressureMmHg)
  const denominator = A - logP
  
  // Prevent division by zero
  if (Math.abs(denominator) < 1e-10) return null
  
  const temperature = (B / denominator) - C
  
  // Check if result is within empirically verified range
  // Use small tolerance (0.5°C) to avoid false positives at exact boundaries
  const TOLERANCE = 0.5
  const hasMinBound = Number.isFinite(TminC)
  const hasMaxBound = Number.isFinite(TmaxC)
  const belowMin = hasMinBound && temperature < (TminC - TOLERANCE)
  const aboveMax = hasMaxBound && temperature > (TmaxC + TOLERANCE)
  const isExtrapolated = belowMin || aboveMax
  
  return {
    temperature,
    isExtrapolated,
    verifiedRange: {
      min: hasMinBound ? TminC : null,
      max: hasMaxBound ? TmaxC : null
    }
  }
}

/**
 * Solve Antoine equation for vapor pressure at given temperature
 * (The forward direction, less commonly needed in this simulation)
 * 
 * @param {number} temperatureC - Temperature in Celsius
 * @param {object} coefficients - { A, B, C } from substance JSON
 * @returns {number|null} Vapor pressure in Pascals
 */
export function solveAntoineForPressure(temperatureC, coefficients) {
  if (!coefficients) return null
  
  const { A, B, C } = coefficients
  if (!A || !B || !C) return null
  
  // Direct Antoine equation: log₁₀(P) = A - B/(C + T)
  const logP = A - B / (C + temperatureC)
  const pressureMmHg = Math.pow(10, logP)
  
  // Convert mmHg to Pa
  const PA_PER_MMHG = 133.322
  return pressureMmHg * PA_PER_MMHG
}
