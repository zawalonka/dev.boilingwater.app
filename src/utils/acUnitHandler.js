// NOTE: Read the header comments before editing. Reassess splitting into subcomponents when adding new items or behaviors.
/**
 * AC Unit Handler
 * 
 * PID-controlled temperature regulation for room environment.
 * Loads AC unit config from workshop JSON and applies heating/cooling.
 * 
 * REFACTORED: Now uses physics module for calculations.
 * All physics formulas are in src/utils/physics/formulas/
 * Process orchestration is in src/utils/physics/processes/roomControl/
 */

import { 
  applyAcEffect, 
  createPidState as createPhysicsPidState 
} from './physics/index.js'

/**
 * Initialize PID state for AC controller
 * @returns {object} Initial PID state
 */
export function createPidState() {
  return {
    ...createPhysicsPidState(),
    lastHeatOutput: 0
  }
}

/**
 * Apply PID-controlled AC heating/cooling to room temperature
 * 
 * This is now a wrapper around the physics module's applyAcEffect.
 * The physics module handles:
 *   1. PID control algorithm (determines power level 0-100%)
 *   2. Heat capacity formula Q=mcΔT (converts watts to temp change)
 *   3. Rate constraints and deadband
 * 
 * @param {number} roomTemp - Current room temperature (°C)
 * @param {number} setpoint - AC target temperature (°C)
 * @param {object} acUnit - AC unit configuration (from JSON)
 * @param {object} pidState - Current PID state
 * @param {number} deltaTime - Time step (seconds)
 * @param {number} roomVolumeM3 - Room volume in m³, default 30
 * @returns {object} { newTemp, heatOutput, updatedPidState, powerPercent, status }
 */
export function applyAcControl(roomTemp, setpoint, acUnit, pidState, deltaTime, roomVolumeM3 = 30) {
  // Use physics module for all calculations
  const result = applyAcEffect(roomTemp, setpoint, acUnit, pidState, deltaTime, roomVolumeM3)
  
  // Map to legacy return format for backward compatibility
  return {
    newTemp: result.newTemp,
    heatOutput: result.heatOutputWatts,
    updatedPidState: result.updatedPidState,
    powerPercent: result.powerPercent,
    status: result.status
  }
}

/**
 * Get AC status text for UI display
 * @param {number} heatOutput - Current heat output in watts
 * @param {object} acUnit - AC unit config
 * @returns {string} Status text
 * @deprecated Use the status field from applyAcControl result instead
 */
export function getAcStatus(heatOutput, acUnit) {
  if (!acUnit) return 'No AC'
  if (Math.abs(heatOutput) < 10) return 'Idle'
  if (heatOutput > 0) return `Heating ${Math.round(heatOutput)}W`
  return `Cooling ${Math.round(Math.abs(heatOutput))}W`
}
