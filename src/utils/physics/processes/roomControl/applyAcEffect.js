/**
 * APPLY AC EFFECT
 * ===============
 * 
 * This process answers the question:
 * "How does the AC change room temperature this timestep?"
 * 
 * FORMULA CHAIN:
 * 1. PID Controller → Calculate power level (0-100%) based on error
 * 2. Power × Max Watts → Actual heating/cooling watts
 * 3. Heat Capacity (Q=mcΔT) → Convert watts to temperature change
 * 
 * SEE STUB FILES IN THIS FOLDER:
 *   _pidController.js - Control algorithm for power level
 *   _heatCapacity.js  - Physics for temperature change
 * 
 * AC UNIT JSON PROVIDES (SI units):
 *   - coolingMaxWatts: Maximum cooling power (W)
 *   - heatingMaxWatts: Maximum heating power (W)
 *   - responseTimeSeconds: How fast AC responds
 *   - deadbandDegrees: Don't activate within this range of setpoint
 *   - pidTuning: { Kp, Ki, Kd, integralWindupLimit }
 * 
 * INPUT:
 *   roomTemp (°C), setpoint (°C), acUnit config, pidState, deltaTime
 * 
 * OUTPUT:
 *   { newTemp, powerPercent, heatOutputWatts, updatedPidState }
 */

// Import through stubs
import { calculatePidOutput, applyDeadband } from './_pidController.js'
import { calculateTempChange } from './_heatCapacity.js'

// Air has specific heat of ~1.006 kJ/(kg·K) and density of ~1.2 kg/m³
// For 30m³ room: mass = 36 kg, heat capacity = 36 × 1006 = 36,216 J/°C
const AIR_SPECIFIC_HEAT = 1.006  // kJ/(kg·K) = J/(g·K)
const AIR_DENSITY = 1.2  // kg/m³ at 20°C

/**
 * Calculate room air mass from volume
 * @param {number} volumeM3 - Room volume (m³)
 * @returns {number} Air mass in kg
 */
export function calculateRoomAirMass(volumeM3) {
  return volumeM3 * AIR_DENSITY
}

/**
 * Apply AC heating/cooling effect to room temperature
 * 
 * @param {number} roomTemp - Current room temperature (°C)
 * @param {number} setpoint - AC target temperature (°C)
 * @param {object} acUnit - AC unit config from workshop JSON
 * @param {object} pidState - Current PID state
 * @param {number} deltaTime - Time step (seconds)
 * @param {number} roomVolumeM3 - Room volume (m³), default 30
 * @returns {object} { newTemp, powerPercent, heatOutputWatts, updatedPidState, status }
 */
export function applyAcEffect(roomTemp, setpoint, acUnit, pidState, deltaTime, roomVolumeM3 = 30) {
  // No AC configured
  if (!acUnit || !acUnit.thermalCharacteristics) {
    return {
      newTemp: roomTemp,
      powerPercent: 0,
      heatOutputWatts: 0,
      updatedPidState: pidState,
      status: 'No AC'
    }
  }
  
  const { coolingMaxWatts, heatingMaxWatts, deadbandDegrees = 0.5 } = acUnit.thermalCharacteristics
  const pidGains = acUnit.pidTuning || { Kp: 50, Ki: 2, Kd: 10, integralWindupLimit: 100 }
  
  // STEP 1: PID calculates power level
  const pidResult = calculatePidOutput(setpoint, roomTemp, pidState, pidGains, deltaTime)
  
  // STEP 2: Apply deadband
  const output = applyDeadband(pidResult.output, pidResult.error, deadbandDegrees)
  
  // STEP 3: Map output to watts
  // output > 0 means heating needed, output < 0 means cooling needed
  let heatOutputWatts = 0
  if (output > 0) {
    heatOutputWatts = output * heatingMaxWatts
  } else if (output < 0) {
    heatOutputWatts = output * coolingMaxWatts  // Negative watts = cooling
  }
  
  // STEP 4: Apply response time lag (AC doesn't instantly reach full power)
  const responseTime = acUnit.thermalCharacteristics.responseTimeSeconds || 5
  const responseFactor = Math.min(1, deltaTime / responseTime)
  heatOutputWatts = heatOutputWatts * responseFactor + (1 - responseFactor) * (pidState.lastHeatOutput || 0)
  
  // STEP 5: Apply heat capacity physics (Q = mcΔT → ΔT = Q/(mc))
  // Energy = Power × time
  const energyJoules = heatOutputWatts * deltaTime
  const roomAirMassKg = calculateRoomAirMass(roomVolumeM3)
  
  // Use physics formula for temperature change
  // Note: Air specific heat is in J/(g·K), so we need mass in grams
  const tempChange = calculateTempChange(roomAirMassKg, AIR_SPECIFIC_HEAT, energyJoules)
  
  // STEP 6: Apply rate constraints (max °C/s the room can change)
  const maxRatePerSec = acUnit.constraints?.maxRateOfChangePerSec || 1
  const constrainedTempChange = Math.max(
    -maxRatePerSec * deltaTime,
    Math.min(maxRatePerSec * deltaTime, tempChange)
  )
  
  // Calculate power percentage for display
  const maxWatts = Math.max(coolingMaxWatts, heatingMaxWatts)
  const powerPercent = maxWatts > 0 ? (Math.abs(heatOutputWatts) / maxWatts) * 100 : 0
  
  return {
    newTemp: roomTemp + constrainedTempChange,
    powerPercent: Math.round(powerPercent),
    heatOutputWatts,
    updatedPidState: {
      ...pidResult.updatedState,
      lastHeatOutput: heatOutputWatts
    },
    status: getAcStatus(heatOutputWatts, powerPercent)
  }
}

/**
 * Generate status text for UI
 */
function getAcStatus(watts, percent) {
  if (Math.abs(watts) < 10) return 'Idle'
  const mode = watts > 0 ? 'Heating' : 'Cooling'
  return `${mode} ${percent}%`
}
