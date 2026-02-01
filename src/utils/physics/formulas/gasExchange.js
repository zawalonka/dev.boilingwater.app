/**
 * GAS EXCHANGE (Room Air Mixing)
 * ==============================
 * 
 * When an air handler mixes fresh air with room air, the composition
 * changes based on the exchange rate and target composition.
 * 
 * This is based on the principle of mass balance in a well-mixed volume.
 * 
 * EQUATION:
 *   dC/dt = (Q/V) × (Ctarget - C)
 * 
 * Where:
 *   C       = concentration of species (volume fraction)
 *   Q       = volumetric flow rate (m³/s)
 *   V       = room volume (m³)
 *   Ctarget = target concentration (fresh air composition)
 * 
 * DISCRETE FORM:
 *   ΔC = (Q × Δt / V) × (Ctarget - C) × efficiency
 *   Cnew = C + ΔC
 * 
 * The (Q × Δt / V) term is the "air changes" fraction - what fraction
 * of the room volume is exchanged in this timestep.
 * 
 * EFFICIENCY:
 * Real air handlers aren't 100% efficient. Filters have different
 * capture rates for different contaminants:
 *   - HEPA: 99.97% for particles ≥0.3μm
 *   - Activated carbon: 60-90% for gases/odors
 *   - Standard filters: 20-40% for particles
 * 
 * AIR CHANGES PER HOUR (ACH):
 *   ACH = Q × 3600 / V
 * 
 * Typical values:
 *   - Home: 0.5-1 ACH
 *   - Office: 4-6 ACH  
 *   - Lab: 6-12 ACH
 *   - Clean room: 15-600+ ACH
 * 
 * EXAMPLE:
 *   Room: 30 m³
 *   Flow: 150 CFM = 255 m³/h = 0.071 m³/s
 *   ACH: 255/30 = 8.5 air changes per hour
 *   Per second: 0.071/30 = 0.00237 = 0.24% of room exchanged
 * 
 * @see https://en.wikipedia.org/wiki/Air_changes_per_hour
 */

/**
 * Calculate air exchange fraction for one timestep
 * 
 * @param {number} flowRateM3PerHour - Volumetric flow rate (m³/h)
 * @param {number} roomVolumeM3 - Room volume (m³)
 * @param {number} deltaTime - Time step (seconds)
 * @returns {number} Exchange fraction (0 to 1)
 */
export function calculateExchangeFraction(flowRateM3PerHour, roomVolumeM3, deltaTime) {
  if (flowRateM3PerHour <= 0 || roomVolumeM3 <= 0) return 0
  
  // Convert flow rate to m³/s
  const flowRateM3PerSec = flowRateM3PerHour / 3600
  
  // Volume exchanged this timestep
  const volumeExchanged = flowRateM3PerSec * deltaTime
  
  // Fraction of room volume (cap at 1.0)
  return Math.min(1, volumeExchanged / roomVolumeM3)
}

/**
 * Apply gas exchange to a single species
 * 
 * @param {number} currentFraction - Current volume fraction (0-1)
 * @param {number} targetFraction - Target volume fraction (0-1)
 * @param {number} exchangeFraction - Air exchange fraction (0-1)
 * @param {number} efficiency - Filter efficiency for this species (0-1)
 * @returns {object} { newFraction, amountChanged }
 */
export function exchangeSpecies(currentFraction, targetFraction, exchangeFraction, efficiency = 1.0) {
  const difference = targetFraction - currentFraction
  const change = difference * exchangeFraction * efficiency
  
  return {
    newFraction: currentFraction + change,
    amountChanged: change
  }
}

/**
 * Apply gas exchange to full composition
 * 
 * @param {object} composition - Current composition { species: fraction }
 * @param {object} targetComposition - Target composition { species: fraction }
 * @param {number} exchangeFraction - Air exchange fraction (0-1)
 * @param {object} efficiencies - Per-species efficiency { species: 0-1 }
 * @returns {object} { newComposition, changes }
 */
export function exchangeComposition(composition, targetComposition, exchangeFraction, efficiencies = {}) {
  const newComposition = {}
  const changes = {}
  
  // Get all species from both current and target
  const allSpecies = new Set([
    ...Object.keys(composition),
    ...Object.keys(targetComposition)
  ])
  
  for (const species of allSpecies) {
    const current = composition[species] || 0
    const target = targetComposition[species] || 0
    const efficiency = efficiencies[species] ?? 0.8  // Default 80% efficiency
    
    const result = exchangeSpecies(current, target, exchangeFraction, efficiency)
    newComposition[species] = result.newFraction
    changes[species] = result.amountChanged
  }
  
  return { newComposition, changes }
}

/**
 * Convert CFM (cubic feet per minute) to m³/h
 * @param {number} cfm - Flow rate in CFM
 * @returns {number} Flow rate in m³/h
 */
export function cfmToM3PerHour(cfm) {
  // 1 CFM = 1.699 m³/h
  return cfm * 1.699
}

/**
 * Calculate air changes per hour (ACH)
 * @param {number} flowRateM3PerHour - Flow rate (m³/h)
 * @param {number} roomVolumeM3 - Room volume (m³)
 * @returns {number} Air changes per hour
 */
export function calculateACH(flowRateM3PerHour, roomVolumeM3) {
  if (roomVolumeM3 <= 0) return 0
  return flowRateM3PerHour / roomVolumeM3
}

/**
 * Standard atmospheric compositions
 */
export const STANDARD_ATMOSPHERES = {
  earth: {
    N2: 0.7808,
    O2: 0.2095,
    Ar: 0.0093,
    CO2: 0.0004,
    H2O: 0.01  // ~40% relative humidity at 20°C
  },
  mars: {
    CO2: 0.9532,
    N2: 0.027,
    Ar: 0.016,
    O2: 0.0013,
    CO: 0.0007
  },
  clean_room: {
    N2: 0.7808,
    O2: 0.2095,
    Ar: 0.0093,
    CO2: 0.0004,
    H2O: 0.005  // Low humidity
  }
}
