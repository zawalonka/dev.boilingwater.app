/**
 * EVAPORATION PHYSICS
 * ===================
 * 
 * Evaporation occurs when liquid molecules at the surface gain enough kinetic
 * energy to escape into the gas phase. This happens at ANY temperature, not
 * just at the boiling point. The rate depends on vapor pressure difference.
 * 
 * TWO KEY PHENOMENA:
 * 
 * 1. EVAPORATION RATE (Hertz-Knudsen Equation)
 *    The rate at which molecules leave the liquid surface.
 *    φ = α × Psat / √(2πMRT)
 *    Where:
 *      φ = evaporation flux (mol/m²/s)
 *      α = evaporation coefficient (empirical, 0.1-1.0)
 *      Psat = saturation vapor pressure at liquid temp (Pa)
 *      M = molar mass (kg/mol)
 *      R = gas constant (8.314 J/mol·K)
 *      T = temperature (K)
 * 
 * 2. EVAPORATIVE COOLING
 *    Each molecule that escapes carries away its latent heat of vaporization.
 *    This cools the remaining liquid. A pot of acetone can cool BELOW room
 *    temperature due to rapid evaporation!
 *    
 *    Q_removed = m_evaporated × Lv
 *    ΔT = -Q_removed / (m_remaining × c_p)
 * 
 * NET EVAPORATION:
 * Evaporation only occurs if the air above the liquid is not saturated.
 * Net rate = evaporation rate × (1 - Ppartial/Psat)
 * When Ppartial = Psat, equilibrium is reached and net evaporation = 0.
 * 
 * PRACTICAL FACTORS:
 * - Surface area: larger surface = more evaporation
 * - Air movement: wind removes saturated air layer, increases rate
 * - Humidity: higher humidity for water → slower water evaporation
 * 
 * @see https://en.wikipedia.org/wiki/Hertz%E2%80%93Knudsen_equation
 * @see https://en.wikipedia.org/wiki/Evaporation
 */

// Physical constants
const R_GAS = 8.314  // J/(mol·K) - Universal gas constant

/**
 * @deprecated LEGACY - Evaporation coefficients are now in substance JSON files
 * Location: src/data/substances/compounds/{type}/{id}/liquid/state.json
 * Field: evaporationCoefficient.value
 * 
 * This table is kept ONLY as a fallback reference. Do not use directly.
 * Always read from fluidProps.evaporationCoefficient instead.
 * 
 * Values typically range 0.01-1.0. Lower = more resistance to evaporation.
 */
const LEGACY_EVAPORATION_COEFFICIENTS = {
  H2O: 0.04,         // Water - low due to hydrogen bonds (Eames 1997)
  C2H5OH: 0.3,       // Ethanol - moderate
  C3H6O: 0.5,        // Acetone - high (very volatile)
  CH4O: 0.35,        // Methanol - similar to ethanol
  NH3: 0.4,          // Ammonia - moderate-high
  C3H8O: 0.3,        // Isopropyl alcohol
  CH3COOH: 0.2,      // Acetic acid - lower due to dimerization
  default: 0.2       // Conservative default
}

// Default evaporation coefficient when not specified in substance data
export const DEFAULT_EVAPORATION_COEFFICIENT = 0.2

/**
 * Calculate evaporation rate using Hertz-Knudsen equation
 * 
 * PHYSICS:
 * The Hertz-Knudsen equation predicts the maximum evaporation rate based on
 * kinetic theory of gases. Real rates are reduced by the evaporation coefficient.
 * 
 * @param {number} vaporPressurePa - Saturation vapor pressure at liquid temp (Pa)
 * @param {number} temperatureK - Liquid temperature in Kelvin
 * @param {number} molarMassKg - Molar mass in kg/mol (e.g., 0.018 for water)
 * @param {number} alpha - Evaporation coefficient (0-1), default 0.2
 * @returns {number} Evaporation flux in mol/(m²·s)
 */
export function calculateEvaporationFlux(vaporPressurePa, temperatureK, molarMassKg, alpha = 0.2) {
  if (vaporPressurePa <= 0 || temperatureK <= 0 || molarMassKg <= 0) {
    return 0
  }
  
  // Hertz-Knudsen: φ = α × P / √(2πMRT)
  const denominator = Math.sqrt(2 * Math.PI * molarMassKg * R_GAS * temperatureK)
  const flux = alpha * vaporPressurePa / denominator
  
  return flux  // mol/(m²·s)
}

/**
 * Calculate net evaporation rate considering ambient partial pressure
 * 
 * PHYSICS:
 * If the air above the liquid already contains vapor of that substance,
 * some molecules will condense back. Net evaporation = evap - condensation.
 * When partial pressure equals saturation pressure, equilibrium is reached.
 * 
 * @param {number} evapFlux - Evaporation flux in mol/(m²·s)
 * @param {number} satPressurePa - Saturation vapor pressure at liquid temp
 * @param {number} partialPressurePa - Current partial pressure in ambient air
 * @returns {number} Net evaporation flux in mol/(m²·s)
 */
export function calculateNetEvaporationFlux(evapFlux, satPressurePa, partialPressurePa) {
  if (satPressurePa <= 0) return 0
  
  // Driving force is the undersaturation of the air
  // Net flux = flux × (1 - P_partial / P_sat)
  // When P_partial = P_sat, net flux = 0 (equilibrium)
  // When P_partial > P_sat, net flux is negative (condensation)
  const drivingForce = 1 - (partialPressurePa / satPressurePa)
  
  return evapFlux * Math.max(0, drivingForce)  // Only positive evaporation for now
}

/**
 * Calculate mass evaporated per timestep
 * 
 * @param {number} netFluxMolPerM2S - Net evaporation flux (mol/m²/s)
 * @param {number} surfaceAreaM2 - Liquid surface area (m²)
 * @param {number} molarMassKg - Molar mass (kg/mol)
 * @param {number} deltaTimeS - Time step (seconds)
 * @returns {number} Mass evaporated (kg)
 */
export function calculateEvaporatedMass(netFluxMolPerM2S, surfaceAreaM2, molarMassKg, deltaTimeS) {
  // moles = flux × area × time
  const molesEvaporated = netFluxMolPerM2S * surfaceAreaM2 * deltaTimeS
  
  // mass = moles × molar mass
  return molesEvaporated * molarMassKg  // kg
}

/**
 * Calculate temperature drop from evaporative cooling
 * 
 * PHYSICS:
 * Evaporation is endothermic - it absorbs heat from the liquid.
 * Q = m × Lv (energy removed)
 * ΔT = Q / (m_remaining × c_p)
 * 
 * This can cool the liquid BELOW ambient temperature!
 * 
 * @param {number} massEvaporatedKg - Mass that evaporated (kg)
 * @param {number} massRemainingKg - Mass of liquid remaining (kg)
 * @param {number} latentHeatKJ - Latent heat of vaporization (kJ/kg)
 * @param {number} specificHeatJgC - Specific heat capacity (J/g·°C)
 * @returns {number} Temperature change (°C, typically negative)
 */
export function calculateEvaporativeCooling(massEvaporatedKg, massRemainingKg, latentHeatKJ, specificHeatJgC) {
  if (massRemainingKg <= 0 || specificHeatJgC <= 0) return 0
  
  // Energy removed = mass evaporated × latent heat
  const energyRemovedJ = massEvaporatedKg * latentHeatKJ * 1000  // Convert kJ to J
  
  // Temperature drop = energy / (mass × specific heat)
  // Convert remaining mass to grams for specific heat in J/(g·°C)
  const massRemainingG = massRemainingKg * 1000
  const tempDrop = energyRemovedJ / (massRemainingG * specificHeatJgC)
  
  return -tempDrop  // Negative because cooling
}

/**
 * Estimate surface area of liquid in a pot
 * 
 * For a cylindrical pot, surface area ≈ π × r²
 * We use a simple model based on pot geometry.
 * 
 * @param {number} potDiameterM - Pot diameter in meters (default 0.2 = 20cm)
 * @returns {number} Surface area in m²
 */
export function estimatePotSurfaceArea(potDiameterM = 0.2) {
  const radius = potDiameterM / 2
  return Math.PI * radius * radius  // ≈ 0.0314 m² for 20cm pot
}

/**
 * Calculate partial pressure of a substance in the room
 * 
 * @param {object} composition - Room air composition (volume fractions)
 * @param {string} substanceId - Substance identifier (e.g., 'C3H6O' for acetone)
 * @param {number} totalPressurePa - Total atmospheric pressure
 * @returns {number} Partial pressure in Pa
 */
export function calculatePartialPressure(composition, substanceId, totalPressurePa) {
  const fraction = composition[substanceId] || 0
  return fraction * totalPressurePa
}

/**
 * Complete evaporation simulation for one timestep
 * 
 * This is the main function that brings together all the physics.
 * Call this every simulation tick to update evaporation state.
 * 
 * @param {object} params - Simulation parameters
 * @param {number} params.liquidTempC - Current liquid temperature (°C)
 * @param {number} params.liquidMassKg - Current liquid mass (kg)
 * @param {number} params.vaporPressurePa - Saturation vapor pressure at liquid temp
 * @param {number} params.molarMassKg - Molar mass (kg/mol)
 * @param {number} params.latentHeatKJ - Latent heat of vaporization (kJ/kg)
 * @param {number} params.specificHeatJgC - Specific heat (J/g·°C)
 * @param {number} params.surfaceAreaM2 - Liquid surface area (m²)
 * @param {number} params.partialPressurePa - Current partial pressure in room
 * @param {number} params.alpha - Evaporation coefficient (0-1)
 * @param {number} params.deltaTimeS - Time step (seconds)
 * @returns {object} { massEvaporatedKg, tempChangeC, newTempC, newMassKg }
 */
export function simulateEvaporationStep({
  liquidTempC,
  liquidMassKg,
  vaporPressurePa,
  molarMassKg,
  latentHeatKJ,
  specificHeatJgC,
  surfaceAreaM2,
  partialPressurePa = 0,
  alpha = 0.2,
  deltaTimeS
}) {
  // No evaporation if no liquid
  if (liquidMassKg <= 0) {
    return {
      massEvaporatedKg: 0,
      tempChangeC: 0,
      newTempC: liquidTempC,
      newMassKg: 0
    }
  }
  
  const liquidTempK = liquidTempC + 273.15
  
  // Step 1: Calculate evaporation flux (Hertz-Knudsen)
  const evapFlux = calculateEvaporationFlux(vaporPressurePa, liquidTempK, molarMassKg, alpha)
  
  // Step 2: Account for existing vapor in room (reduces net evaporation)
  const netFlux = calculateNetEvaporationFlux(evapFlux, vaporPressurePa, partialPressurePa)
  
  // Step 3: Calculate mass evaporated this timestep
  let massEvaporated = calculateEvaporatedMass(netFlux, surfaceAreaM2, molarMassKg, deltaTimeS)
  
  // Can't evaporate more than we have
  massEvaporated = Math.min(massEvaporated, liquidMassKg)
  
  // Step 4: Calculate evaporative cooling
  const newMass = liquidMassKg - massEvaporated
  const tempChange = calculateEvaporativeCooling(massEvaporated, newMass, latentHeatKJ, specificHeatJgC)
  
  // Apply cooling (can go below ambient!)
  const newTemp = liquidTempC + tempChange
  
  return {
    massEvaporatedKg: massEvaporated,
    tempChangeC: tempChange,
    newTempC: newTemp,
    newMassKg: newMass
  }
}

// NOTE: getEvaporationCoefficient() function REMOVED
// Evaporation coefficients are now loaded from substance JSON files.
// Use: fluidProps.evaporationCoefficient ?? DEFAULT_EVAPORATION_COEFFICIENT
// The legacy lookup table (LEGACY_EVAPORATION_COEFFICIENTS) is kept only as reference.
