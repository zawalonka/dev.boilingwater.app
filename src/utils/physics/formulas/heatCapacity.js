/**
 * HEAT CAPACITY (Q = mcΔT)
 * ========================
 * 
 * The heat capacity equation describes how much thermal energy is needed
 * to change the temperature of a substance. It's one of the most fundamental
 * equations in thermodynamics.
 * 
 * EQUATION:
 *   Q = m × c × ΔT
 * 
 * Where:
 *   Q  = heat energy (Joules)
 *   m  = mass (kilograms or grams, must match c units)
 *   c  = specific heat capacity (J/(g·°C) or J/(kg·°C))
 *   ΔT = temperature change (°C or K, they're equivalent for differences)
 * 
 * REARRANGED FORMS:
 *   ΔT = Q / (m × c)     Find temperature change from energy
 *   m = Q / (c × ΔT)     Find mass that can be heated
 *   c = Q / (m × ΔT)     Find specific heat experimentally
 * 
 * SPECIFIC HEAT VALUES (J/(g·°C)):
 *   Water:    4.186  (exceptionally high - why water is great for cooling!)
 *   Ethanol:  2.44   (lower - heats/cools faster than water)
 *   Acetone:  2.13   (even lower)
 *   Ice:      2.09   (solid water has lower specific heat)
 *   Aluminum: 0.897  (metals are generally low)
 *   Copper:   0.385  (very low - heats quickly)
 * 
 * REAL-WORLD EXAMPLE:
 * Heating 1 liter of water (1 kg) from 20°C to 100°C:
 *   ΔT = 80°C
 *   Q = 1000g × 4.186 J/(g·°C) × 80°C = 334,880 J
 *   With a 1000W kettle: time = 334,880 J ÷ 1000 W = 335 seconds ≈ 5.6 minutes
 * 
 * @see https://en.wikipedia.org/wiki/Specific_heat_capacity
 */

/**
 * Calculate energy needed to heat a substance by a given temperature change
 * 
 * @param {number} massKg - Mass in kilograms
 * @param {number} specificHeat - Specific heat capacity in J/(g·°C)
 * @param {number} tempChange - Temperature change in °C (can be negative for cooling)
 * @returns {number} Energy in Joules (positive = heat added, negative = heat removed)
 */
export function calculateHeatEnergy(massKg, specificHeat, tempChange) {
  // Convert kg to g to match typical specificHeat units (J/(g·°C))
  const massG = massKg * 1000
  
  // Q = mcΔT
  return massG * specificHeat * tempChange
}

/**
 * Calculate temperature change from applied heat energy
 * 
 * @param {number} massKg - Mass in kilograms
 * @param {number} specificHeat - Specific heat capacity in J/(g·°C)
 * @param {number} energyJ - Energy in Joules
 * @returns {number} Temperature change in °C
 */
export function calculateTempChange(massKg, specificHeat, energyJ) {
  // Convert kg to g
  const massG = massKg * 1000
  
  // ΔT = Q / (mc)
  if (massG <= 0 || specificHeat <= 0) return 0
  return energyJ / (massG * specificHeat)
}

/**
 * Calculate how long a heater takes to heat a substance
 * 
 * @param {number} massKg - Mass in kilograms
 * @param {number} specificHeat - Specific heat capacity in J/(g·°C)
 * @param {number} tempStart - Starting temperature (°C)
 * @param {number} tempEnd - Target temperature (°C)
 * @param {number} powerWatts - Heater power in Watts
 * @returns {number} Time in seconds
 */
export function calculateHeatingTime(massKg, specificHeat, tempStart, tempEnd, powerWatts) {
  if (powerWatts <= 0) return Infinity
  
  const energyNeeded = calculateHeatEnergy(massKg, specificHeat, tempEnd - tempStart)
  
  // time = energy / power
  return Math.abs(energyNeeded) / powerWatts
}

/**
 * Reference specific heat values (J/(g·°C))
 */
export const SPECIFIC_HEAT_VALUES = {
  water: 4.186,
  ice: 2.09,
  steam: 2.01,
  ethanol: 2.44,
  methanol: 2.53,
  acetone: 2.13,
  glycerol: 2.43,
  ammonia_liquid: 4.70,
  aluminum: 0.897,
  copper: 0.385,
  iron: 0.449,
  air: 1.006,
}
