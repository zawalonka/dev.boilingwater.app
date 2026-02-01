/**
 * EBULLIOSCOPY (BOILING POINT ELEVATION)
 * =======================================
 * 
 * Ebullioscopy is the study of how dissolved solutes raise the boiling
 * point of a solvent. It's one of the four colligative properties
 * (properties that depend on particle count, not identity).
 * 
 * EQUATION:
 *   ΔTb = i × Kb × m
 * 
 * Where:
 *   ΔTb = boiling point elevation (°C)
 *   i   = van't Hoff factor (number of particles per formula unit)
 *   Kb  = ebullioscopic constant (°C·kg/mol) - see dynamicKb.js
 *   m   = molality (mol solute / kg solvent)
 * 
 * VAN'T HOFF FACTOR (i):
 *   Non-electrolytes: i = 1 (sugar, ethanol)
 *   NaCl: i ≈ 1.9 (ideally 2, but ion pairing reduces it)
 *   CaCl₂: i ≈ 2.7 (ideally 3)
 *   Strong acids: i ≈ 2 (HCl) or 3 (H₂SO₄)
 * 
 * EXAMPLE - 3% SALTWATER:
 *   Molality: 0.513 mol/kg
 *   Van't Hoff: i = 1.9 (NaCl in water)
 *   Kb at 100°C: 0.512 °C·kg/mol
 *   ΔTb = 1.9 × 0.512 × 0.513 = 0.50°C
 *   
 *   At 10km altitude (Kb = 0.423):
 *   ΔTb = 1.9 × 0.423 × 0.513 = 0.41°C
 *   
 * See how the elevation is SMALLER at altitude? That's the dynamic Kb effect!
 * 
 * @see dynamicKb.js for temperature-dependent Kb calculation
 * @see https://en.wikipedia.org/wiki/Boiling-point_elevation
 */

/**
 * Calculate boiling point elevation for a solution
 * 
 * @param {number} vanHoffFactor - i, number of particles per formula unit
 * @param {number} Kb - Ebullioscopic constant in °C·kg/mol
 * @param {number} molality - Molality in mol/kg
 * @returns {number} Boiling point elevation in °C
 */
export function calculateBoilingPointElevation(vanHoffFactor, Kb, molality) {
  // Validate inputs
  if (!Number.isFinite(vanHoffFactor) || 
      !Number.isFinite(Kb) || 
      !Number.isFinite(molality)) {
    return 0
  }
  
  // ΔTb = i × Kb × m
  const elevation = vanHoffFactor * Kb * molality
  
  return elevation
}

/**
 * Calculate molality from mass percent concentration
 * Useful for converting "3% saltwater" to molality
 * 
 * @param {number} massPercent - Mass percent of solute (e.g., 3 for 3%)
 * @param {number} soluteMolarMass - Molar mass of solute in g/mol (58.44 for NaCl)
 * @returns {number} Molality in mol/kg
 */
export function massPercentToMolality(massPercent, soluteMolarMass) {
  if (!Number.isFinite(massPercent) || !Number.isFinite(soluteMolarMass)) {
    return 0
  }
  
  // In 100g of solution:
  //   Solute mass = massPercent grams
  //   Solvent mass = (100 - massPercent) grams = (100 - massPercent)/1000 kg
  //   Moles of solute = massPercent / soluteMolarMass
  //   Molality = moles / kg solvent
  
  const soluteMass = massPercent  // grams per 100g solution
  const solventMass = (100 - massPercent) / 1000  // kg per 100g solution
  const moles = soluteMass / soluteMolarMass
  
  return moles / solventMass
}

/**
 * Common solute data for reference
 */
export const COMMON_SOLUTES = {
  NaCl: { molarMass: 58.44, vanHoffFactor: 1.9 },
  KCl: { molarMass: 74.55, vanHoffFactor: 1.85 },
  CaCl2: { molarMass: 110.98, vanHoffFactor: 2.7 },
  sucrose: { molarMass: 342.3, vanHoffFactor: 1.0 },
  glucose: { molarMass: 180.16, vanHoffFactor: 1.0 },
}
