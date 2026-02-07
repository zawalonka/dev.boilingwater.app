// NOTE: Read the header comments before editing. Reassess splitting into subcomponents when adding new items or behaviors.
/**
 * DIFFUSION COEFFICIENT CALCULATION
 * 
 * Uses the Fuller-Schettler-Giddings equation to calculate binary gas-phase
 * diffusion coefficients from molecular properties.
 * 
 * This is the scientifically accurate method - no empirical "fudge factors".
 * All inputs come from substance data (atomic diffusion volumes, molar mass).
 * 
 * PHYSICS:
 * The Fuller-Schettler-Giddings correlation (1966) predicts diffusion coefficients
 * with typical accuracy of ±5-10% for most gas pairs.
 * 
 * EQUATION:
 *   D_AB = (0.00143 × T^1.75) / (P × M_AB^0.5 × (Σv_A^(1/3) + Σv_B^(1/3))²)
 * 
 * Where:
 *   D_AB = Binary diffusion coefficient (cm²/s)
 *   T = Temperature (K)
 *   P = Pressure (atm)
 *   M_AB = 2 / (1/M_A + 1/M_B) = reduced molar mass
 *   Σv_A, Σv_B = Sum of atomic diffusion volumes for each species
 * 
 * REFERENCES:
 * Fuller, E.N., Schettler, P.D., Giddings, J.C. (1966). Ind. Eng. Chem. 58(5), 18-27.
 * Reid, Prausnitz, Poling (1987). The Properties of Gases and Liquids, 4th ed.
 * 
 * @module physics/formulas/diffusion
 */

/**
 * Air diffusion volume (Σv for air)
 * This is a special value for the air mixture, from Fuller (1966)
 * Air is ~78% N₂ + 21% O₂ + 1% Ar
 */
export const AIR_DIFFUSION_VOLUME = 19.7  // Fuller (1966) tabulated value for air

/**
 * Air average molar mass (g/mol)
 * Standard dry air composition weighted average
 */
export const AIR_MOLAR_MASS = 28.97  // g/mol

/**
 * Calculate the sum of atomic diffusion volumes for a compound
 * 
 * @param {Array} elements - Array of {symbol, count, diffusionVolume} from compound
 * @returns {number} Sum of atomic diffusion volumes (Σv)
 * 
 * @example
 * // For ethanol C₂H₅OH:
 * calculateDiffusionVolumeSum([
 *   { symbol: 'C', count: 2, diffusionVolume: 15.9 },
 *   { symbol: 'H', count: 6, diffusionVolume: 2.31 },
 *   { symbol: 'O', count: 1, diffusionVolume: 6.11 }
 * ])
 * // Returns: 2×15.9 + 6×2.31 + 1×6.11 = 51.77
 */
export function calculateDiffusionVolumeSum(elements) {
  if (!Array.isArray(elements) || elements.length === 0) {
    return null
  }
  
  let sum = 0
  for (const element of elements) {
    const count = element.count || 1
    const diffusionVolume = element.diffusionVolume || element.atomicDiffusionVolume
    
    if (typeof diffusionVolume !== 'number') {
      console.warn(`Missing diffusion volume for ${element.symbol}`)
      return null
    }
    
    sum += count * diffusionVolume
  }
  
  return sum
}

/**
 * Calculate binary diffusion coefficient using Fuller-Schettler-Giddings equation
 * 
 * @param {object} params - Calculation parameters
 * @param {number} params.temperatureK - Temperature in Kelvin
 * @param {number} params.pressureAtm - Pressure in atmospheres (1 atm = 101325 Pa)
 * @param {number} params.molarMassA - Molar mass of species A (g/mol)
 * @param {number} params.molarMassB - Molar mass of species B (g/mol), default: air
 * @param {number} params.diffusionVolumeA - Sum of atomic diffusion volumes for A
 * @param {number} params.diffusionVolumeB - Sum of atomic diffusion volumes for B, default: air
 * @returns {number} Binary diffusion coefficient D_AB in cm²/s
 * 
 * @example
 * // Ethanol in air at 25°C, 1 atm
 * calculateDiffusionCoefficient({
 *   temperatureK: 298.15,
 *   pressureAtm: 1.0,
 *   molarMassA: 46.07,     // ethanol
 *   diffusionVolumeA: 51.77 // ethanol Σv
 * })
 * // Returns ~0.11 cm²/s (literature value: 0.102-0.119 cm²/s)
 */
export function calculateDiffusionCoefficient({
  temperatureK,
  pressureAtm,
  molarMassA,
  molarMassB = AIR_MOLAR_MASS,
  diffusionVolumeA,
  diffusionVolumeB = AIR_DIFFUSION_VOLUME
}) {
  // Input validation
  if (temperatureK <= 0 || pressureAtm <= 0 || molarMassA <= 0 || molarMassB <= 0) {
    return 0
  }
  if (!diffusionVolumeA || diffusionVolumeA <= 0 || !diffusionVolumeB || diffusionVolumeB <= 0) {
    return 0
  }
  
  // Reduced molar mass: M_AB = 2 / (1/M_A + 1/M_B)
  const M_AB = 2 / (1/molarMassA + 1/molarMassB)
  
  // Fuller-Schettler-Giddings equation
  // D_AB = 0.00143 × T^1.75 / (P × M_AB^0.5 × (Σv_A^(1/3) + Σv_B^(1/3))²)
  const numerator = 0.00143 * Math.pow(temperatureK, 1.75)
  const denominator = pressureAtm * Math.sqrt(M_AB) * 
    Math.pow(Math.pow(diffusionVolumeA, 1/3) + Math.pow(diffusionVolumeB, 1/3), 2)
  
  return numerator / denominator  // cm²/s
}

/**
 * Convert diffusion coefficient from cm²/s to m²/s
 * @param {number} D_cm2s - Diffusion coefficient in cm²/s
 * @returns {number} Diffusion coefficient in m²/s
 */
export function diffusionCm2ToM2(D_cm2s) {
  return D_cm2s * 1e-4  // 1 cm² = 10⁻⁴ m²
}

/**
 * Calculate diffusion coefficient for a substance in air at given conditions
 * 
 * This is a convenience function that combines molar mass and diffusion volume
 * calculations for the common case of vapor diffusing through air.
 * 
 * @param {object} params - Parameters
 * @param {number} params.temperatureC - Temperature in Celsius
 * @param {number} params.pressurePa - Pressure in Pascals
 * @param {number} params.molarMass - Substance molar mass (g/mol)
 * @param {number} params.diffusionVolumeSum - Σv for the substance
 * @returns {number} Diffusion coefficient in m²/s
 */
export function calculateDiffusionInAir({
  temperatureC,
  pressurePa,
  molarMass,
  diffusionVolumeSum
}) {
  const temperatureK = temperatureC + 273.15
  const pressureAtm = pressurePa / 101325
  
  const D_cm2s = calculateDiffusionCoefficient({
    temperatureK,
    pressureAtm,
    molarMassA: molarMass,
    diffusionVolumeA: diffusionVolumeSum
  })
  
  return diffusionCm2ToM2(D_cm2s)  // m²/s
}
