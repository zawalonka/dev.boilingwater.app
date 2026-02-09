// NOTE: Read the header comments before editing. Reassess splitting into subcomponents when adding new items or behaviors.
/**
 * LATENT HEAT (Phase Change Energy)
 * ==================================
 *
 * When a substance changes phase (solid↔liquid or liquid↔gas), energy
 * is absorbed or released WITHOUT changing temperature. This energy
 * is called latent heat.
 *
 * EQUATIONS:
 *   Fusion (melting/freezing):     Q = m × Lf
 *   Vaporization (boiling/condensing): Q = m × Lv
 *
 * Where:
 *   Q  = energy (Joules)
 *   m  = mass (kilograms)
 *   Lf = latent heat of fusion (J/kg)
 *   Lv = latent heat of vaporization (J/kg)
 *
 * PHYSICAL MEANING:
 * During phase change, all added energy goes into breaking molecular bonds
 * (or forming them) rather than increasing kinetic energy (temperature).
 *
 * WATER VALUES:
 *   Lf = 334,000 J/kg (334 kJ/kg) - to melt ice
 *   Lv = 2,257,000 J/kg (2,257 kJ/kg) - to boil water
 *
 * Note: Lv is ~6.75× larger than Lf! Boiling takes much more energy than melting.
 *
 * EXAMPLE - BOILING WATER:
 * To convert 1 kg of 100°C water to 100°C steam:
 *   Q = 1 kg × 2,257,000 J/kg = 2,257,000 J
 *   With a 1000W stove: 2,257,000 J ÷ 1000 W = 2,257 seconds ≈ 37.6 minutes!
 *
 * This is why watched pots seem to take forever once they hit boiling.
 *
 * OTHER SUBSTANCES (Lv in kJ/kg):
 *   Ethanol:   838 (much less than water - evaporates easily)
 *   Acetone:   518
 *   Ammonia:  1,369
 *   Mercury:    295
 *
 * @see https://en.wikipedia.org/wiki/Latent_heat
 */

/**
 * Calculate energy needed to vaporize a given mass
 *
 * @param {number} massKg - Mass to vaporize in kilograms
 * @param {number} heatOfVapKJ - Latent heat of vaporization in kJ/kg
 * @returns {number} Energy required in Joules
 */
export function calculateVaporizationEnergy(massKg: number, heatOfVapKJ: number): number {
  // Convert kJ/kg to J/kg
  const heatOfVapJ = heatOfVapKJ * 1000
  return massKg * heatOfVapJ
}

/**
 * Calculate mass that can be vaporized with given energy
 *
 * @param {number} energyJ - Available energy in Joules
 * @param {number} heatOfVapKJ - Latent heat of vaporization in kJ/kg
 * @returns {number} Mass that can be vaporized in kilograms
 */
export function calculateVaporizedMass(energyJ: number, heatOfVapKJ: number): number {
  if (heatOfVapKJ <= 0) return 0

  // Convert kJ/kg to J/kg
  const heatOfVapJ = heatOfVapKJ * 1000
  return energyJ / heatOfVapJ
}

/**
 * Calculate energy needed to melt a given mass
 *
 * @param {number} massKg - Mass to melt in kilograms
 * @param {number} heatOfFusionKJ - Latent heat of fusion in kJ/kg
 * @returns {number} Energy required in Joules
 */
export function calculateFusionEnergy(massKg: number, heatOfFusionKJ: number): number {
  const heatOfFusionJ = heatOfFusionKJ * 1000
  return massKg * heatOfFusionJ
}

/**
 * Calculate mass that can be melted with given energy
 *
 * NOTE: Currently UNUSED - kept for future ice/freezing features.
 * The game currently only simulates:
 *   1. Heating water (Q = mcΔT)
 *   2. Boiling water (liquid → gas via calculateVaporizedMass)
 *
 * This function would be used for:
 *   - Starting experiments with ice cubes
 *   - Melting ice to liquid water
 *   - Reverse phase change (freezing water back to ice)
 *   - Complete phase transition chains (solid → liquid → gas)
 *
 * EXAMPLE USE CASE (future):
 *   Energy available: 334,000 J
 *   Water heat of fusion: 334 kJ/kg
 *   Result: calculateMeltedMass(334000, 334) = 1 kg of ice melted
 *
 * @param {number} energyJ - Available energy in Joules
 * @param {number} heatOfFusionKJ - Latent heat of fusion in kJ/kg
 * @returns {number} Mass that can be melted in kilograms
 */
export function calculateMeltedMass(energyJ: number, heatOfFusionKJ: number): number {
  if (heatOfFusionKJ <= 0) return 0

  const heatOfFusionJ = heatOfFusionKJ * 1000
  return energyJ / heatOfFusionJ
}

/**
 * Reference latent heat values
 */
export const LATENT_HEAT_VALUES: {
  vaporization: Record<string, number>
  fusion: Record<string, number>
} = {
  // Heat of vaporization (kJ/kg)
  vaporization: {
    water: 2257,
    ethanol: 838,
    methanol: 1100,
    acetone: 518,
    ammonia: 1369,
    benzene: 394,
    mercury: 295,
  },
  // Heat of fusion (kJ/kg)
  fusion: {
    water: 334,
    ethanol: 108,
    ammonia: 332,
    benzene: 127,
    mercury: 11.3,
  }
}
