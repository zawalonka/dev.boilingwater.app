/**
 * Air Handler / Scrubber
 * 
 * Filters room air composition, removing contaminants and restoring
 * target atmosphere levels. Used for safety when boiling hazardous substances.
 * 
 * REFACTORED: Now uses physics module for calculations.
 * All physics formulas are in src/utils/physics/formulas/
 * Process orchestration is in src/utils/physics/processes/roomControl/
 */

import { 
  applyAirHandlerEffect,
  createPidState,
  STANDARD_ATMOSPHERES
} from './physics/index.js'

/**
 * Default atmospheric composition (Earth sea level)
 * @deprecated Use STANDARD_ATMOSPHERES.EARTH from physics module
 */
export const EARTH_ATMOSPHERE = STANDARD_ATMOSPHERES.EARTH

// Internal state for air handler PID
let airHandlerPidState = null

/**
 * Initialize or reset air handler PID state
 * @returns {object} Fresh PID state
 */
export function resetAirHandlerState() {
  airHandlerPidState = createPidState()
  return airHandlerPidState
}

/**
 * Apply scrubber/air handler to room composition
 * When enabled, automatically adjusts power based on detected contamination.
 * 
 * This is now a wrapper around the physics module's applyAirHandlerEffect.
 * The physics module handles:
 *   1. PID control algorithm (determines flow level 0-100%)
 *   2. Gas exchange physics (converts flow to composition change)
 *   3. Per-species filtration efficiency
 * 
 * @param {object} composition - Current air composition (volume fractions, 0-1)
 * @param {object} airHandler - Air handler config (from JSON)
 * @param {number} roomVolume - Room volume (m³)
 * @param {number} deltaTime - Time step (seconds)
 * @param {string} operatingMode - 'off' | 'on' (simple toggle)
 * @param {object} targetComposition - Target atmosphere to maintain (defaults to initial room atmosphere)
 * @returns {object} { newComposition, contaminantsRemoved, flowRate, activity }
 */
export function applyScrubber(composition, airHandler, roomVolume, deltaTime, operatingMode = 'on', targetComposition = null) {
  if (!airHandler || operatingMode === 'off') {
    return {
      newComposition: { ...composition },
      contaminantsRemoved: {},
      flowRate: 0,
      activity: 0
    }
  }

  // Initialize PID state if needed
  if (!airHandlerPidState) {
    airHandlerPidState = createPidState()
  }

  const target = targetComposition || airHandler.targetComposition || EARTH_ATMOSPHERE

  // Use physics module for all calculations
  const result = applyAirHandlerEffect(
    composition,
    target,
    airHandler,
    airHandlerPidState,
    deltaTime,
    roomVolume
  )

  // Update internal PID state
  airHandlerPidState = result.updatedPidState

  // Map to legacy return format for backward compatibility
  return {
    newComposition: result.newComposition,
    contaminantsRemoved: result.changes,
    flowRate: result.flowRateM3PerHour,
    activity: result.flowPercent / 100,  // Normalize to 0-1
    status: result.status,
    ach: result.ach  // Air changes per hour
  }
}

/**
 * Check for safety alerts based on room composition
 * @param {object} composition - Current air composition
 * @returns {Array<object>} Array of { severity, species, message }
 */
export function checkCompositionAlerts(composition) {
  const alerts = []

  // Oxygen levels
  const o2 = composition.O2 || 0
  if (o2 < 0.16) {
    alerts.push({ severity: 'critical', species: 'O2', message: 'Oxygen depletion - dangerous!' })
  } else if (o2 < 0.195) {
    alerts.push({ severity: 'warning', species: 'O2', message: 'Low oxygen' })
  }

  // CO2 levels
  const co2 = composition.CO2 || 0
  if (co2 > 0.03) {
    alerts.push({ severity: 'critical', species: 'CO2', message: 'Dangerous CO₂ levels!' })
  } else if (co2 > 0.01) {
    alerts.push({ severity: 'warning', species: 'CO2', message: 'High CO₂' })
  }

  // Ammonia (very toxic)
  const nh3 = composition.NH3 || 0
  if (nh3 > 0.0025) {  // 25 ppm
    alerts.push({ severity: 'critical', species: 'NH3', message: 'Toxic: Ammonia detected!' })
  } else if (nh3 > 0.001) {
    alerts.push({ severity: 'warning', species: 'NH3', message: 'Ammonia vapors present' })
  }

  // Ethanol vapors
  const ethanol = composition.C2H5OH || 0
  if (ethanol > 0.03) {  // 3% - flammable
    alerts.push({ severity: 'critical', species: 'C2H5OH', message: 'Flammable: Ethanol vapors!' })
  } else if (ethanol > 0.01) {
    alerts.push({ severity: 'warning', species: 'C2H5OH', message: 'Ethanol vapors present' })
  }

  // Generic toxic marker
  const toxic = composition.toxic_generic || 0
  if (toxic > 0.001) {
    alerts.push({ severity: 'critical', species: 'toxic', message: 'Toxic vapors detected!' })
  }

  return alerts
}

/**
 * Get air handler status text for UI display
 * @param {string} operatingMode - Current mode
 * @param {number} flowRate - Flow rate in m³/hour
 * @returns {string} Status text
 */
export function getAirHandlerStatus(operatingMode, flowRate) {
  if (operatingMode === 'off' || flowRate === 0) return 'Off'
  return `${operatingMode.charAt(0).toUpperCase() + operatingMode.slice(1)} (${Math.round(flowRate)} m³/h)`
}
