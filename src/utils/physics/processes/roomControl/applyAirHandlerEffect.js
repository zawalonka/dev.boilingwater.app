// NOTE: Read the header comments before editing. Reassess splitting into subcomponents when adding new items or behaviors.
/**
 * APPLY AIR HANDLER EFFECT
 * ========================
 * 
 * This process answers the question:
 * "How does the air handler change room composition this timestep?"
 * 
 * FORMULA CHAIN:
 * 1. PID Controller → Calculate flow level (0-100%) based on contamination
 * 2. Flow % × Max CFM → Actual flow rate
 * 3. Gas Exchange → Convert flow to composition change
 * 
 * SEE STUB FILES IN THIS FOLDER:
 *   _pidController.js - Control algorithm for flow level
 *   _gasExchange.js   - Physics for composition change
 * 
 * AIR HANDLER JSON PROVIDES (SI units):
 *   - maxFlowRateM3PerHour: Maximum volumetric flow (m³/h)
 *   - maxFlowRateCFM: Alternative CFM spec (converted internally)
 *   - filtrationEfficiency: Per-species efficiency { CO2: 0.8, H2O: 0.7, ... }
 *   - targetComposition: Target atmosphere to maintain
 * 
 * INPUT:
 *   composition, targetComposition, airHandler config, pidState, deltaTime, roomVolume
 * 
 * OUTPUT:
 *   { newComposition, flowPercent, flowRateM3PerHour, changes, updatedPidState }
 */

// Import through stubs
import { calculatePidOutput, createPidState } from './_pidController.js'
import { calculateExchangeFraction, exchangeComposition, calculateACH } from './_gasExchange.js'

/**
 * Calculate total contamination deviation from target
 * Used as PID error input
 * 
 * @param {object} current - Current composition
 * @param {object} target - Target composition
 * @returns {number} Total weighted deviation (0 = perfect, higher = more contaminated)
 */
function calculateContaminationLevel(current, target) {
  let totalDeviation = 0
  
  // Check all species
  const allSpecies = new Set([...Object.keys(current), ...Object.keys(target)])
  
  for (const species of allSpecies) {
    const currentVal = current[species] || 0
    const targetVal = target[species] || 0
    const deviation = Math.abs(currentVal - targetVal)
    
    // Weight certain contaminants more heavily (safety factor)
    const weight = getContaminantWeight(species)
    totalDeviation += deviation * weight
  }
  
  return totalDeviation
}

/**
 * Get safety weighting for a contaminant species
 * Higher weight = air handler responds more aggressively
 */
function getContaminantWeight(species) {
  const weights = {
    // Toxic gases - high priority
    NH3: 10,      // Ammonia
    H2S: 10,      // Hydrogen sulfide
    CO: 8,        // Carbon monoxide
    Cl2: 10,      // Chlorine gas
    
    // Common concerns
    CO2: 3,       // Carbon dioxide (high levels cause drowsiness)
    H2O: 1,       // Water vapor (humidity)
    
    // Inert - low priority
    N2: 0.5,
    O2: 2,        // Need to maintain O2 levels
    Ar: 0.1
  }
  return weights[species] ?? 1
}

/**
 * Apply air handler effect to room composition
 * 
 * @param {object} composition - Current room air composition { species: fraction }
 * @param {object} targetComposition - Target composition to maintain
 * @param {object} airHandler - Air handler config from workshop JSON
 * @param {object} pidState - Current PID state for flow control
 * @param {number} deltaTime - Time step (seconds)
 * @param {number} roomVolumeM3 - Room volume (m³), default 30
 * @returns {object} { newComposition, flowPercent, flowRateM3PerHour, ach, changes, updatedPidState, status }
 */
export function applyAirHandlerEffect(composition, targetComposition, airHandler, pidState, deltaTime, roomVolumeM3 = 30) {
  // No air handler configured
  if (!airHandler || !airHandler.flowCharacteristics) {
    return {
      newComposition: { ...composition },
      flowPercent: 0,
      flowRateM3PerHour: 0,
      ach: 0,
      changes: {},
      updatedPidState: pidState || createPidState(),
      status: 'No Air Handler'
    }
  }
  
  const maxFlowM3PerHour = airHandler.flowCharacteristics.maxFlowRateM3PerHour || 255
  const efficiencies = airHandler.filtrationEfficiency || {}
  const pidGains = airHandler.pidTuning || { Kp: 100, Ki: 5, Kd: 10, integralWindupLimit: 50 }
  
  // STEP 1: Calculate contamination level (used as PID setpoint error)
  // setpoint = 0 (no contamination), measured = contamination level
  const contaminationLevel = calculateContaminationLevel(composition, targetComposition)
  
  // PID with setpoint 0 and measured = contamination
  // Higher contamination = more negative error = stronger response
  const pidResult = calculatePidOutput(0, contaminationLevel, pidState || createPidState(), pidGains, deltaTime)
  
  // Output is negative when contamination exists, we want positive flow
  // Clamp to 0-1 range (can't have negative flow)
  const flowPercent = Math.max(0, Math.min(1, Math.abs(pidResult.output)))
  
  // Minimum flow threshold - don't run at <5% (mechanical consideration)
  const effectiveFlowPercent = flowPercent < 0.05 ? 0 : flowPercent
  
  // STEP 2: Calculate actual flow rate
  const flowRateM3PerHour = effectiveFlowPercent * maxFlowM3PerHour
  
  // STEP 3: Apply gas exchange physics
  const exchangeFraction = calculateExchangeFraction(flowRateM3PerHour, roomVolumeM3, deltaTime)
  const exchangeResult = exchangeComposition(composition, targetComposition, exchangeFraction, efficiencies)
  
  // Calculate air changes per hour
  const ach = calculateACH(flowRateM3PerHour, roomVolumeM3)
  
  return {
    newComposition: exchangeResult.newComposition,
    flowPercent: Math.round(effectiveFlowPercent * 100),
    flowRateM3PerHour,
    ach,
    changes: exchangeResult.changes,
    updatedPidState: pidResult.updatedState,
    status: getAirHandlerStatus(effectiveFlowPercent)
  }
}

/**
 * Generate status text for UI
 */
function getAirHandlerStatus(flowPercent) {
  if (flowPercent < 0.05) return 'Standby'
  if (flowPercent < 0.3) return 'Low'
  if (flowPercent < 0.7) return 'Medium'
  return 'High'
}
