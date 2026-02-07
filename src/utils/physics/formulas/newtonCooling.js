// NOTE: Read the header comments before editing. Reassess splitting into subcomponents when adding new items or behaviors.
/**
 * NEWTON'S LAW OF COOLING
 * ========================
 * 
 * Newton's Law of Cooling describes how the temperature of an object
 * changes over time as it equilibrates with its surroundings. It applies
 * to both cooling (hot object in cool room) and heating (cold object in warm room).
 * 
 * EQUATION:
 *   dT/dt = -k × (T - Tambient)
 * 
 * Where:
 *   dT/dt    = rate of temperature change (°C/s)
 *   k        = heat transfer coefficient (1/s)
 *   T        = current temperature (°C)
 *   Tambient = ambient/room temperature (°C)
 * 
 * SOLUTION (for constant Tambient):
 *   T(t) = Tambient + (T0 - Tambient) × e^(-kt)
 * 
 * PHYSICAL MEANING:
 * - Hot objects cool FASTER when the temperature difference is larger
 * - As the object approaches room temperature, cooling slows exponentially
 * - A pot of water at 100°C cools much faster than one at 30°C
 * 
 * THE HEAT TRANSFER COEFFICIENT (k):
 * This is NOT a simple constant! It depends on:
 *   - Convection: still air vs. moving air vs. liquid
 *   - Container: insulated vs. metal vs. glass
 *   - Surface area: large pot vs. small pot
 *   - Fluid properties: specific heat, thermal conductivity
 * 
 * PHYSICS-BASED k CALCULATION:
 *   k_eff = (h × A) / (m × c)
 * 
 * Where:
 *   h = convective heat transfer coefficient (W/(m²·K))
 *       - Still air: ~5-25 W/(m²·K)
 *       - Moving air: ~10-200 W/(m²·K)
 *       - Water: ~500-10,000 W/(m²·K)
 *   A = surface area of container (m²)
 *   m = mass of fluid (kg)
 *   c = specific heat of fluid (J/(kg·K))
 * 
 * For a typical pot in still air:
 *   h ≈ 10 W/(m²·K), A ≈ 0.03 m², so h×A ≈ 0.3 W/K
 *   For 1 kg water (c = 4186 J/(kg·K)):
 *   k_eff ≈ 0.3 / 4186 ≈ 0.000072 /s
 * 
 * @see https://en.wikipedia.org/wiki/Newton%27s_law_of_cooling
 */

/**
 * Calculate the effective cooling coefficient based on physical properties
 * 
 * @param {number} convectiveHeatTransfer - h × A in Watts per °C (typically 0.2-0.5 for pot in still air)
 * @param {number} massKg - Mass of fluid in kilograms
 * @param {number} specificHeat - Specific heat capacity in J/(g·°C)
 * @returns {number} Effective cooling coefficient in 1/s
 */
export function calculateEffectiveCoolingCoeff(convectiveHeatTransfer, massKg, specificHeat) {
  // Convert specific heat from J/(g·°C) to J/(kg·°C)
  const specificHeatJPerKgC = specificHeat * 1000
  
  // Thermal mass = m × c (total heat capacity in J/°C)
  const thermalMass = massKg * specificHeatJPerKgC
  
  // k_eff = (h × A) / (m × c)
  if (thermalMass <= 0) return 0.0015  // Fallback default
  
  return convectiveHeatTransfer / thermalMass
}

/**
 * Apply Newton's Law of Cooling for a discrete time step
 * 
 * @param {number} currentTemp - Current temperature (°C)
 * @param {number} ambientTemp - Ambient/room temperature (°C)
 * @param {number} coolingCoeff - Cooling coefficient k (1/s)
 * @param {number} deltaTime - Time step in seconds
 * @returns {number} New temperature after cooling/heating (°C)
 */
export function applyCoolingStep(currentTemp, ambientTemp, coolingCoeff, deltaTime) {
  // dT/dt = -k(T - Tambient)
  // For discrete step: ΔT = -k × (T - Tambient) × Δt
  const tempDifference = currentTemp - ambientTemp
  const tempChange = coolingCoeff * tempDifference * deltaTime
  let newTemp = currentTemp - tempChange
  
  // Clamp to ambient (don't overshoot in either direction)
  if (tempDifference > 0) {
    // Was cooling - don't go below ambient
    newTemp = Math.max(newTemp, ambientTemp)
  } else if (tempDifference < 0) {
    // Was warming - don't go above ambient
    newTemp = Math.min(newTemp, ambientTemp)
  }
  
  return newTemp
}

/**
 * Calculate temperature at time t using the analytical solution
 * (Useful for "what temperature will it be in X minutes?" questions)
 * 
 * @param {number} initialTemp - Starting temperature (°C)
 * @param {number} ambientTemp - Ambient temperature (°C)
 * @param {number} coolingCoeff - Cooling coefficient k (1/s)
 * @param {number} time - Time elapsed in seconds
 * @returns {number} Temperature at time t (°C)
 */
export function temperatureAtTime(initialTemp, ambientTemp, coolingCoeff, time) {
  // T(t) = Tambient + (T0 - Tambient) × e^(-kt)
  const tempDiff = initialTemp - ambientTemp
  return ambientTemp + tempDiff * Math.exp(-coolingCoeff * time)
}

/**
 * Calculate time to reach a target temperature
 * 
 * @param {number} initialTemp - Starting temperature (°C)
 * @param {number} targetTemp - Target temperature (°C)
 * @param {number} ambientTemp - Ambient temperature (°C)
 * @param {number} coolingCoeff - Cooling coefficient k (1/s)
 * @returns {number} Time in seconds (Infinity if target can't be reached)
 */
export function timeToCool(initialTemp, targetTemp, ambientTemp, coolingCoeff) {
  // From T(t) = Tambient + (T0 - Tambient) × e^(-kt)
  // Solve for t: t = -ln((Ttarget - Tambient)/(T0 - Tambient)) / k
  
  const initialDiff = initialTemp - ambientTemp
  const targetDiff = targetTemp - ambientTemp
  
  // Can't reach target if it's on the wrong side of ambient
  if (initialDiff * targetDiff < 0) return Infinity
  
  // Can't reach target if we're already there or past it
  if (Math.abs(targetDiff) >= Math.abs(initialDiff)) return 0
  
  const ratio = targetDiff / initialDiff
  if (ratio <= 0 || coolingCoeff <= 0) return Infinity
  
  return -Math.log(ratio) / coolingCoeff
}

/**
 * Typical convective heat transfer values (h × A) for common scenarios
 * Units: W/°C (Watts per degree temperature difference)
 */
export const CONVECTIVE_HEAT_TRANSFER = {
  potInStillAir: 0.3,      // Typical pot on counter in still room
  potWithLid: 0.15,        // Pot with lid (reduced surface area)
  cupInStillAir: 0.1,      // Coffee cup
  largeStockpot: 0.5,      // Large pot with more surface area
  potWithFan: 0.8,         // Active cooling with fan
}
