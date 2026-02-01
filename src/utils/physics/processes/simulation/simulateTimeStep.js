/**
 * SIMULATE TIME STEP
 * ==================
 * 
 * This process answers the question:
 * "What happens to the fluid in the next 0.1 seconds?"
 * 
 * This is the MAIN GAME LOOP for the physics simulation. It's called
 * every frame (typically every 100ms) to update the fluid state.
 * 
 * FORMULA CHAIN:
 * 1. Boiling Point Process → Get current boiling point at altitude
 * 2. IF burner on:
 *    - Heating Process → Apply energy, update temp, maybe generate steam
 * 3. IF burner off:
 *    - Newton Cooling → Equilibrate toward ambient temperature
 * 4. Update mass (subtract evaporated vapor)
 * 5. Return new state
 * 
 * SEE STUB FILES IN THIS FOLDER:
 *   _boilingPoint.js  - Altitude-adjusted boiling point
 *   _heating.js       - Energy application and vaporization
 *   _newtonCooling.js - Natural cooling/heating toward ambient
 * 
 * INPUT:
 *   state: { waterMass, temperature, altitude }
 *   heatInputWatts: Power from burner (0 = off)
 *   deltaTime: Time step in seconds
 *   fluidProps: Substance properties from JSON
 *   ambientTemp: Room temperature (°C)
 * 
 * OUTPUT:
 *   Updated state with new temperature, mass, and phase info
 */

import { GAME_CONFIG } from '../../../../constants/physics.js'

// Import from stubs
import { calculateBoilingPoint } from './_boilingPoint.js'
import { applyHeatEnergy } from './_heating.js'
import { 
  calculateEffectiveCoolingCoeff, 
  applyCoolingStep,
  CONVECTIVE_HEAT_TRANSFER 
} from './_newtonCooling.js'

/**
 * Simulate one discrete time step of the fluid heating/boiling process
 * 
 * @param {object} state - Current simulation state:
 *   - waterMass: mass of fluid remaining (kg)
 *   - temperature: current fluid temperature (°C)
 *   - altitude: altitude above sea level (meters)
 *   - residueMass: minimum mass (non-evaporable residue)
 * @param {number} heatInputWatts - Power from stove (Watts, 0 = off)
 * @param {number} deltaTime - Time step duration (seconds, typically 0.1)
 * @param {object} fluidProps - Fluid properties from substance JSON
 * @param {number} ambientTemp - Ambient/room temperature for cooling (°C)
 * @returns {object} Updated state
 */
export function simulateTimeStep(state, heatInputWatts, deltaTime, fluidProps, ambientTemp = 20) {
  const { waterMass, temperature, altitude } = state
  const residueMass = Number.isFinite(state.residueMass) ? state.residueMass : 0
  const evaporableMass = Math.max(0, waterMass - residueMass)
  
  // Safety: if fluid is completely gone, return early
  if (waterMass <= 0 || evaporableMass <= 0) {
    return { ...state, allEvaporated: evaporableMass <= 0 }
  }
  
  if (!fluidProps) {
    return { ...state }
  }
  
  // STEP 1: Calculate boiling point at this altitude
  const boilingPointResult = calculateBoilingPoint(altitude, fluidProps)
  const boilingPoint = boilingPointResult?.temperature ?? null
  const canBoil = Boolean(fluidProps.canBoil) && Number.isFinite(boilingPoint)
  
  let currentTemp = temperature
  let result = { newTemp: currentTemp, energyToVaporization: 0, steamGenerated: 0 }
  
  // STEP 2: HEATING - Apply energy from burner
  if (heatInputWatts > 0) {
    // Convert power to energy: E = P × t
    const energyApplied = heatInputWatts * deltaTime
    
    result = applyHeatEnergy(waterMass, currentTemp, energyApplied, boilingPoint, fluidProps)
    currentTemp = result.newTemp
  }
  
  // STEP 3: COOLING - Apply Newton's Law when burner is off
  const AMBIENT = Number.isFinite(ambientTemp) ? ambientTemp : (GAME_CONFIG.ROOM_TEMPERATURE || 20)
  
  if (heatInputWatts <= 0 && Math.abs(currentTemp - AMBIENT) > 0.01) {
    // Calculate physics-based cooling coefficient
    const convectiveHT = CONVECTIVE_HEAT_TRANSFER.potInStillAir  // 0.3 W/°C
    const specificHeat = fluidProps.specificHeat || 4.186
    const coolingCoeff = calculateEffectiveCoolingCoeff(convectiveHT, waterMass, specificHeat)
    
    // Apply cooling step
    currentTemp = applyCoolingStep(currentTemp, AMBIENT, coolingCoeff, deltaTime)
  }
  
  // STEP 4: Update mass (subtract evaporated vapor)
  const steamGenerated = canBoil
    ? Math.min(result.steamGenerated, evaporableMass)
    : 0
  const nextWaterMass = Math.max(waterMass - steamGenerated, residueMass)
  
  // STEP 5: Return updated state
  return {
    ...state,
    temperature: currentTemp,
    waterMass: nextWaterMass,
    energyToVaporization: result.energyToVaporization,
    steamGenerated: steamGenerated,
    isBoiling: canBoil && currentTemp >= boilingPoint && steamGenerated > 0,
    // Pass through extrapolation metadata for UI warning
    isExtrapolated: boilingPointResult?.isExtrapolated ?? false,
    verifiedRange: boilingPointResult?.verifiedRange ?? { min: null, max: null }
  }
}
