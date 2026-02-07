// NOTE: Read the header comments before editing. Reassess splitting into subcomponents when adding new items or behaviors.
/**
 * DYNAMIC EBULLIOSCOPIC CONSTANT (Kb)
 * ====================================
 * 
 * The ebullioscopic constant Kb tells us how much a dissolved solute
 * raises the boiling point of a solvent. Contrary to what many textbooks
 * suggest, Kb is NOT actually a constant - it depends on temperature!
 * 
 * EQUATION:
 *   Kb = (R × Tb² × Msolvent) / ΔHvap
 * 
 * Where:
 *   R = 8.314 J/(mol·K) - Universal gas constant
 *   Tb = boiling temperature in Kelvin
 *   Msolvent = molar mass of solvent in kg/mol
 *   ΔHvap = enthalpy of vaporization in J/mol
 * 
 * PHYSICAL MEANING:
 * Kb represents the sensitivity of boiling point to solute concentration.
 * Higher Kb = more elevation per mole of solute.
 * 
 * WHY IT'S TEMPERATURE-DEPENDENT:
 * The Tb² term dominates! At lower temperatures, Kb is smaller because
 * the squared temperature makes a huge difference.
 * 
 * WATER EXAMPLE:
 *   At 100°C (373.15K): Kb ≈ 0.512 °C·kg/mol (textbook value)
 *   At  66°C (339.15K): Kb ≈ 0.423 °C·kg/mol (at 10km altitude!)
 *   At  50°C (323.15K): Kb ≈ 0.384 °C·kg/mol
 * 
 * This is why we calculate Kb dynamically at the actual boiling temperature,
 * not use the tabulated value (which is always for 100°C at sea level).
 * 
 * @see Colligative properties - chemistry textbooks
 * @see https://en.wikipedia.org/wiki/Boiling-point_elevation
 */

// Universal gas constant
const R = 8.314  // J/(mol·K)

/**
 * Calculate ebullioscopic constant at a specific boiling temperature
 * 
 * @param {number} boilingTempC - Boiling temperature in Celsius
 * @param {number} solventMolarMass - Molar mass of solvent in g/mol (default: 18.015 for water)
 * @param {number} heatOfVapKJ - Heat of vaporization in kJ/mol (default: 40.66 for water)
 * @returns {number} Kb in °C·kg/mol
 */
export function calculateDynamicKb(boilingTempC, solventMolarMass = 18.015, heatOfVapKJ = 40.66) {
  // Convert to SI units
  const Tb = boilingTempC + 273.15          // Celsius → Kelvin
  const Msolvent = solventMolarMass / 1000  // g/mol → kg/mol
  const deltaHvap = heatOfVapKJ * 1000      // kJ/mol → J/mol
  
  // Apply the formula: Kb = (R × Tb² × Msolvent) / ΔHvap
  const Kb = (R * Tb * Tb * Msolvent) / deltaHvap
  
  return Kb
}

/**
 * Get the standard Kb value (at normal boiling point) for reference
 * This is what textbooks report, useful for validation
 * 
 * @param {number} normalBoilingPointC - Normal boiling point in Celsius (100 for water)
 * @param {number} solventMolarMass - Molar mass in g/mol
 * @param {number} heatOfVapKJ - Heat of vaporization in kJ/mol
 * @returns {number} Standard Kb in °C·kg/mol
 */
export function getStandardKb(normalBoilingPointC, solventMolarMass, heatOfVapKJ) {
  return calculateDynamicKb(normalBoilingPointC, solventMolarMass, heatOfVapKJ)
}

/**
 * Reference values for common solvents (at their normal boiling points)
 * Useful for validation and education
 */
export const STANDARD_KB_VALUES = {
  water: { bp: 100, Kb: 0.512, molarMass: 18.015, heatOfVap: 40.66 },
  ethanol: { bp: 78.37, Kb: 1.22, molarMass: 46.07, heatOfVap: 38.56 },
  benzene: { bp: 80.1, Kb: 2.53, molarMass: 78.11, heatOfVap: 30.72 },
  chloroform: { bp: 61.2, Kb: 3.63, molarMass: 119.38, heatOfVap: 29.24 },
}
