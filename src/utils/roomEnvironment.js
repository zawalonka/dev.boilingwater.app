/**
 * Room Environment Manager
 * 
 * Manages room state including temperature, pressure, and air composition.
 * Integrates with AC unit and air handler systems.
 */

import { applyAcControl, createPidState } from './acUnitHandler'
import { applyScrubber, checkCompositionAlerts, EARTH_ATMOSPHERE } from './airHandlerScrubber'
import { calculatePressure } from './physics/index.js'

/**
 * Calculate initial room pressure based on pressureMode and altitude
 * @param {object} roomConfig - Room config from room.json
 * @param {number} altitude - Altitude in meters
 * @returns {number} Pressure in Pa
 */
function getInitialPressure(roomConfig, altitude) {
  const pressureMode = roomConfig?.pressureMode || 'location'
  
  switch (pressureMode) {
    case 'sealevel':
      return 101325
    case 'custom':
      return roomConfig?.room?.initialPressurePa || 101325
    case 'location':
    default:
      // Use ISA model to calculate pressure from altitude
      return calculatePressure(altitude || 0)
  }
}

/**
 * Create initial room state from room.json config
 * @param {object} roomConfig - Room config from room.json
 * @param {number} altitude - Altitude in meters (for pressureMode 'location')
 * @returns {object} Initial room state
 */
export function createRoomState(roomConfig, altitude = 0) {
  const room = roomConfig?.room || {}
  const atmosphere = roomConfig?.atmosphere || EARTH_ATMOSPHERE
  const initialPressure = getInitialPressure(roomConfig, altitude)
  
  return {
    // Physical properties
    volumeM3: room.volumeM3 || 30,
    heatCapacityJPerC: room.heatCapacityJPerC || 36000,
    leakRatePaPerSecond: room.leakRatePaPerSecond || 10,
    
    // Current state
    temperature: room.initialTempC || 20,
    pressure: initialPressure,
    composition: { ...atmosphere },
    
    // AC state
    acSetpoint: room.initialTempC || 20,
    acPidState: createPidState(),
    acHeatOutput: 0,
    
    // Air handler state
    airHandlerMode: roomConfig?.defaults?.airHandlerMode || 'off',
    scrubberActivity: 0,  // 0-1 activity level from PID
    targetComposition: { ...atmosphere },  // Original atmosphere to restore to
    
    // Logging
    heatLog: [],
    compositionLog: [],
    alerts: [],
    
    // Timestamps
    startTime: Date.now(),
    lastUpdate: Date.now()
  }
}

/**
 * Add vapor from boiling substance to room composition
 * @param {object} roomState - Current room state
 * @param {string} substanceId - Substance being vaporized (e.g., 'H2O', 'C2H5OH')
 * @param {number} massEvaporatedKg - Mass evaporated this timestep (kg)
 * @param {number} molarMassKgPerMol - Molar mass of substance (kg/mol)
 * @returns {object} Updated room state
 */
export function addVaporToRoom(roomState, substanceId, massEvaporatedKg, molarMassKgPerMol) {
  if (massEvaporatedKg <= 0) return roomState

  // Calculate moles added
  const molesAdded = massEvaporatedKg / molarMassKgPerMol
  
  // Approximate total moles in room (ideal gas at STP: ~1200 mol for 30m³)
  const R = 8.314  // J/(mol·K)
  const tempK = roomState.temperature + 273.15
  const totalMolesApprox = (roomState.pressure * roomState.volumeM3) / (R * tempK)
  
  // Update composition
  const newComposition = { ...roomState.composition }
  const currentFraction = newComposition[substanceId] || 0
  const addedFraction = molesAdded / (totalMolesApprox + molesAdded)
  
  // Normalize: reduce all existing fractions slightly, add new substance
  const scaleFactor = totalMolesApprox / (totalMolesApprox + molesAdded)
  for (const species of Object.keys(newComposition)) {
    newComposition[species] *= scaleFactor
  }
  newComposition[substanceId] = (currentFraction * scaleFactor) + addedFraction
  
  // Pressure increase from added moles (closed system)
  const newTotalMoles = totalMolesApprox + molesAdded
  const newPressure = (newTotalMoles * R * tempK) / roomState.volumeM3
  
  return {
    ...roomState,
    composition: newComposition,
    pressure: newPressure
  }
}

/**
 * Apply heat to room from external source (burner waste heat, etc.)
 * @param {object} roomState - Current room state
 * @param {number} heatWatts - Heat input (positive = heating, negative = cooling)
 * @param {number} deltaTime - Time step (seconds)
 * @param {string} source - Heat source identifier for logging
 * @returns {object} Updated room state
 */
export function applyHeatToRoom(roomState, heatWatts, deltaTime, source = 'unknown') {
  if (heatWatts === 0) return roomState

  const heatJoules = heatWatts * deltaTime
  const tempChange = heatJoules / roomState.heatCapacityJPerC
  
  // Log heat event
  const newHeatLog = [...roomState.heatLog]
  if (newHeatLog.length === 0 || newHeatLog[newHeatLog.length - 1].source !== source) {
    newHeatLog.push({
      timestamp: Date.now() - roomState.startTime,
      source,
      watts: heatWatts
    })
  }
  
  // Keep log from growing too large (keep last 1000 entries)
  if (newHeatLog.length > 1000) {
    newHeatLog.shift()
  }
  
  return {
    ...roomState,
    temperature: roomState.temperature + tempChange,
    heatLog: newHeatLog
  }
}

/**
 * Simulate one timestep of room environment
 * @param {object} roomState - Current room state
 * @param {object} acUnit - AC unit config (from JSON)
 * @param {object} airHandler - Air handler config (from JSON)
 * @param {number} deltaTime - Time step (seconds)
 * @param {object} options - { externalHeat, vaporInput }
 * @returns {object} Updated room state
 */
export function simulateRoomStep(roomState, acUnit, airHandler, deltaTime, options = {}) {
  let state = { ...roomState }
  
  // 1. Apply external heat (burner waste heat radiating into room)
  if (options.externalHeat) {
    const wasteHeatFraction = 0.1  // 10% of burner heat goes to room
    const roomHeat = options.externalHeat * wasteHeatFraction
    state = applyHeatToRoom(state, roomHeat, deltaTime, 'burner_waste')
  }
  
  // 2. Apply AC control
  const acResult = applyAcControl(
    state.temperature,
    state.acSetpoint,
    acUnit,
    state.acPidState,
    deltaTime,
    state.volumeM3  // Room volume in m³ (physics calculates air mass internally)
  )
  state = {
    ...state,
    temperature: acResult.newTemp,
    acPidState: acResult.updatedPidState,
    acHeatOutput: acResult.heatOutput
  }
  
  // Log AC heat
  if (Math.abs(acResult.heatOutput) > 10) {
    state = applyHeatToRoom(state, 0, deltaTime, acResult.heatOutput > 0 ? 'ac_heating' : 'ac_cooling')
  }
  
  // 3. Apply vapor from boiling (if provided)
  if (options.vaporInput) {
    const { substanceId, massKg, molarMass } = options.vaporInput
    state = addVaporToRoom(state, substanceId, massKg, molarMass)
  }
  
  // 4. Apply air handler/scrubber (uses automatic PID-like control)
  const scrubberResult = applyScrubber(
    state.composition,
    airHandler,
    state.volumeM3,
    deltaTime,
    state.airHandlerMode,
    state.targetComposition  // Original atmosphere to restore to
  )
  state = {
    ...state,
    composition: scrubberResult.newComposition,
    scrubberActivity: scrubberResult.activity || 0
  }
  
  // 5. Room pressure leak (slow return toward ambient)
  const ambientPressure = 101325  // TODO: Use location altitude
  const pressureDiff = state.pressure - ambientPressure
  const leakRate = state.leakRatePaPerSecond || 10
  const pressureChange = Math.sign(pressureDiff) * Math.min(Math.abs(pressureDiff), leakRate * deltaTime)
  state = {
    ...state,
    pressure: state.pressure - pressureChange
  }
  
  // 6. Check for safety alerts
  const newAlerts = checkCompositionAlerts(state.composition)
  
  // 7. Log composition periodically (every 10 seconds of sim time)
  const simTime = Date.now() - state.startTime
  const lastLogTime = state.compositionLog.length > 0 
    ? state.compositionLog[state.compositionLog.length - 1].timestamp 
    : 0
  if (simTime - lastLogTime > 10000) {
    state = {
      ...state,
      compositionLog: [
        ...state.compositionLog.slice(-99),  // Keep last 100 entries
        { timestamp: simTime, composition: { ...state.composition } }
      ]
    }
  }
  
  state = {
    ...state,
    alerts: newAlerts,
    lastUpdate: Date.now()
  }
  
  return state
}

/**
 * Get room state summary for UI display
 * @param {object} roomState - Current room state
 * @returns {object} Summary object for display
 */
export function getRoomSummary(roomState) {
  return {
    temperature: Math.round(roomState.temperature * 10) / 10,
    pressure: Math.round(roomState.pressure),
    pressureKPa: Math.round(roomState.pressure / 100) / 10,
    humidity: Math.round((roomState.composition.H2O || 0) * 100 * 10) / 10,
    o2Percent: Math.round((roomState.composition.O2 || 0) * 100 * 10) / 10,
    co2Percent: Math.round((roomState.composition.CO2 || 0) * 100 * 100) / 100,
    alerts: roomState.alerts,
    acStatus: roomState.acHeatOutput,
    acSetpoint: roomState.acSetpoint,
    airHandlerMode: roomState.airHandlerMode,
    scrubberActivity: roomState.scrubberActivity || 0
  }
}
