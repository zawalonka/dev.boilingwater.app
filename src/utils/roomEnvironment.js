// NOTE: Read the header comments before editing. Reassess splitting into subcomponents when adding new items or behaviors.
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
 * Convert Unicode subscript digits to ASCII
 * Atmosphere composition uses ASCII formulas (H2O, C2H5OH)
 * but substance files use Unicode subscripts (H₂O, C₂H₅OH)
 * 
 * @param {string} formula - Chemical formula with possible Unicode subscripts
 * @returns {string} Formula with ASCII digits
 */
export function normalizeFormula(formula) {
  if (!formula) return formula
  
  // Unicode subscript digits: ₀₁₂₃₄₅₆₇₈₉
  const subscriptMap = {
    '₀': '0', '₁': '1', '₂': '2', '₃': '3', '₄': '4',
    '₅': '5', '₆': '6', '₇': '7', '₈': '8', '₉': '9'
  }
  
  return formula.replace(/[₀₁₂₃₄₅₆₇₈₉]/g, char => subscriptMap[char] || char)
}

/**
 * Get the atmosphere key for a substance
 * Uses the chemical formula from fluidProps, normalized to ASCII
 * Falls back to hardcoded mapping for solutions and edge cases
 * 
 * @param {string} substanceId - Substance ID from catalog
 * @param {object} fluidProps - Loaded fluid properties (optional, for formula lookup)
 * @returns {string} Atmosphere key for room composition tracking
 */
export function getAtmosphereKey(substanceId, fluidProps = null) {
  // If we have fluid props with a chemical formula, use it (normalized to ASCII)
  if (fluidProps?.chemicalFormula) {
    return normalizeFormula(fluidProps.chemicalFormula)
  }
  
  // Fallback mapping for solutions and edge cases
  // Solutions release their solvent's vapor
  const SOLUTION_SOLVENT_MAP = {
    'saltwater-3pct': 'H2O',
    'saltwater-10pct': 'H2O',
    'saltwater-26pct': 'H2O',
  }
  
  return SOLUTION_SOLVENT_MAP[substanceId] || substanceId
}

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
    acEnabled: false,  // AC on/off switch (default OFF, user must enable)
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
    
    // Energy tracking for scorecard
    energyTotals: {
      acHeatingJoules: 0,
      acCoolingJoules: 0,
      airHandlerJoules: 0,  // Based on flow rate and time
      burnerWasteJoules: 0
    },
    
    // Initial state snapshot for before/after comparison
    initialComposition: { ...atmosphere },
    initialTemperature: room.initialTempC || 20,
    initialPressure: initialPressure,
    
    // Exposure tracking for health consequences
    exposureEvents: [],  // { substanceId, concentration, durationSec, severity }
    
    // Timestamps
    startTime: Date.now(),
    lastUpdate: Date.now()
  }
}

/**
 * Add vapor from boiling substance to room composition
 * @param {object} roomState - Current room state
 * @param {string} substanceId - Substance being vaporized (e.g., 'water', 'ethanol')
 * @param {number} massEvaporatedKg - Mass evaporated this timestep (kg)
 * @param {number} molarMassKgPerMol - Molar mass of substance (kg/mol)
 * @param {string} chemicalFormula - Chemical formula (e.g., 'H₂O') for atmosphere key lookup
 * @returns {object} Updated room state
 */
export function addVaporToRoom(roomState, substanceId, massEvaporatedKg, molarMassKgPerMol, chemicalFormula = null) {
  if (massEvaporatedKg <= 0) return roomState

  // Map substance ID to atmosphere key using formula if available
  const atmosphereKey = getAtmosphereKey(substanceId, chemicalFormula ? { chemicalFormula } : null)

  // Calculate moles added
  const molesAdded = massEvaporatedKg / molarMassKgPerMol
  
  // Approximate total moles in room (ideal gas at STP: ~1200 mol for 30m³)
  const R = 8.314  // J/(mol·K)
  const tempK = roomState.temperature + 273.15
  const totalMolesApprox = (roomState.pressure * roomState.volumeM3) / (R * tempK)
  
  // Update composition using atmosphere key (e.g., 'H2O' not 'water')
  const newComposition = { ...roomState.composition }
  const currentFraction = newComposition[atmosphereKey] || 0
  const addedFraction = molesAdded / (totalMolesApprox + molesAdded)
  
  // Normalize: reduce all existing fractions slightly, add new substance
  const scaleFactor = totalMolesApprox / (totalMolesApprox + molesAdded)
  for (const species of Object.keys(newComposition)) {
    newComposition[species] *= scaleFactor
  }
  newComposition[atmosphereKey] = (currentFraction * scaleFactor) + addedFraction
  
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
 * Toxic exposure thresholds and health consequences
 * Based on OSHA PEL (Permissible Exposure Limits) and IDLH (Immediately Dangerous to Life or Health)
 */
const TOXIC_THRESHOLDS = {
  NH3: {  // Ammonia
    name: 'Ammonia',
    safePPM: 25,       // OSHA PEL: 25 ppm
    warningPPM: 50,    // Noticeable irritation
    dangerPPM: 300,    // IDLH: 300 ppm
    consequences: {
      warning: 'Eye and respiratory irritation. Headache developing.',
      danger: 'Severe respiratory distress! Immediate evacuation required.',
      critical: 'Life-threatening exposure. Pulmonary edema risk.'
    }
  },
  acetone: {
    name: 'Acetone',
    safePPM: 250,      // OSHA PEL: 250 ppm
    warningPPM: 500,
    dangerPPM: 2500,   // IDLH: 2500 ppm
    consequences: {
      warning: 'Mild dizziness and headache. Eyes watering.',
      danger: 'Significant CNS depression. Confusion and weakness.',
      critical: 'Loss of consciousness possible. Evacuate immediately.'
    }
  },
  C2H5OH: {  // Ethanol
    name: 'Ethanol',
    safePPM: 1000,     // OSHA PEL: 1000 ppm
    warningPPM: 2000,
    dangerPPM: 3300,   // IDLH: 3300 ppm
    consequences: {
      warning: 'Feeling lightheaded. Sweet smell noticeable.',
      danger: 'Intoxication symptoms. Impaired judgment.',
      critical: 'Severe intoxication. Risk of unconsciousness.'
    }
  },
  CH4: {  // Methane (asphyxiant, not directly toxic)
    name: 'Methane',
    safePPM: 10000,    // 1% - starts displacing oxygen
    warningPPM: 50000, // 5% - LEL (Lower Explosive Limit)
    dangerPPM: 150000, // 15% - UEL (Upper Explosive Limit)
    consequences: {
      warning: 'Oxygen being displaced. Ventilate immediately.',
      danger: 'EXPLOSIVE ATMOSPHERE! No sparks or flames!',
      critical: 'Asphyxiation risk. Explosive mixture present.'
    }
  }
}

/**
 * Track toxic exposure based on current room composition
 * @param {object} roomState - Current room state
 * @param {object} airHandler - Air handler config (for filter effectiveness)
 * @param {number} deltaTime - Time step (seconds)
 * @returns {object} Updated room state with exposure events
 */
function trackExposure(roomState, airHandler, deltaTime) {
  const exposureEvents = [...(roomState.exposureEvents || [])]
  const composition = roomState.composition
  
  // Check each toxic substance
  for (const [substanceId, thresholds] of Object.entries(TOXIC_THRESHOLDS)) {
    const fraction = composition[substanceId] || 0
    const ppm = fraction * 1000000  // Convert fraction to ppm
    
    if (ppm > thresholds.safePPM) {
      // Determine severity
      let severity = 'warning'
      let consequence = thresholds.consequences.warning
      if (ppm > thresholds.dangerPPM) {
        severity = 'critical'
        consequence = thresholds.consequences.critical
      } else if (ppm > thresholds.warningPPM) {
        severity = 'danger'
        consequence = thresholds.consequences.danger
      }
      
      // Check if filter would protect (pro air handler with activated carbon)
      const filterEfficiency = airHandler?.filtrationEfficiency?.[substanceId] || 0
      const isProtected = filterEfficiency > 0.5 && roomState.airHandlerMode !== 'off'
      
      // Add or update exposure event
      const existingIdx = exposureEvents.findIndex(e => e.substanceId === substanceId)
      if (existingIdx >= 0) {
        exposureEvents[existingIdx].durationSec += deltaTime
        exposureEvents[existingIdx].peakPPM = Math.max(exposureEvents[existingIdx].peakPPM, ppm)
        exposureEvents[existingIdx].severity = severity
        exposureEvents[existingIdx].consequence = consequence
        exposureEvents[existingIdx].isProtected = isProtected
      } else {
        exposureEvents.push({
          substanceId,
          name: thresholds.name,
          startTime: Date.now() - roomState.startTime,
          durationSec: deltaTime,
          peakPPM: ppm,
          severity,
          consequence,
          isProtected
        })
      }
    }
  }
  
  return {
    ...roomState,
    exposureEvents
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
 * Calculate combined system airflow (AC + Air Handler)
 * AC has its own base CFM. Air handler augments when connected and running.
 * @param {object} acUnit - AC unit config
 * @param {object} airHandler - Air handler config  
 * @param {string} airHandlerMode - Current air handler mode
 * @returns {object} { totalCFM, totalM3PerHour, acContribution, ahContribution }
 */
function calculateCombinedAirflow(acUnit, airHandler, airHandlerMode) {
  // AC base airflow (always running when AC is on)
  const acCFM = acUnit?.airflowCharacteristics?.baseCFM || 150
  const acM3h = acUnit?.airflowCharacteristics?.baseM3PerHour || 255
  
  // Air handler augments when running
  let ahCFM = 0
  let ahM3h = 0
  if (airHandler && airHandlerMode !== 'off') {
    const flowPercent = airHandler.operatingModes?.[airHandlerMode]?.flowPercent || 0
    ahCFM = (airHandler.flowCharacteristics?.maxFlowRateCFM || 0) * (flowPercent / 100)
    ahM3h = (airHandler.flowCharacteristics?.maxFlowRateM3PerHour || 0) * (flowPercent / 100)
  }
  
  return {
    totalCFM: acCFM + ahCFM,
    totalM3PerHour: acM3h + ahM3h,
    acContribution: acCFM,
    ahContribution: ahCFM
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
  
  // Calculate combined airflow for this timestep
  const airflow = calculateCombinedAirflow(acUnit, airHandler, state.airHandlerMode)
  
  // 1. Apply external heat (burner waste heat radiating into room)
  if (options.externalHeat) {
    const wasteHeatFraction = 0.1  // 10% of burner heat goes to room
    const roomHeat = options.externalHeat * wasteHeatFraction
    state = applyHeatToRoom(state, roomHeat, deltaTime, 'burner_waste')
  }
  
  // 2. Apply AC control (effectiveness scales with airflow)
  // Skip if AC is disabled
  let acResult = { newTemp: state.temperature, heatOutput: 0, updatedPidState: state.acPidState }
  if (state.acEnabled && acUnit) {
    // More airflow = faster air exchange = AC works better
    const airflowEffectiveness = Math.min(1.5, airflow.totalCFM / 150)  // 150 CFM = baseline
    acResult = applyAcControl(
      state.temperature,
      state.acSetpoint,
      acUnit,
      state.acPidState,
      deltaTime * airflowEffectiveness,  // Effective time step scaled by airflow
      state.volumeM3
    )
  }
  
  // Track AC energy usage
  const acJoules = Math.abs(acResult.heatOutput) * deltaTime
  const updatedEnergyTotals = { ...state.energyTotals }
  if (acResult.heatOutput > 0) {
    updatedEnergyTotals.acHeatingJoules += acJoules
  } else if (acResult.heatOutput < 0) {
    updatedEnergyTotals.acCoolingJoules += acJoules
  }
  
  state = {
    ...state,
    temperature: acResult.newTemp,
    acPidState: acResult.updatedPidState,
    acHeatOutput: acResult.heatOutput,
    currentAirflow: airflow,
    energyTotals: updatedEnergyTotals
  }
  
  // Log AC heat
  if (Math.abs(acResult.heatOutput) > 10) {
    state = applyHeatToRoom(state, 0, deltaTime, acResult.heatOutput > 0 ? 'ac_heating' : 'ac_cooling')
  }
  
  // 3. Apply vapor from boiling (if provided)
  if (options.vaporInput) {
    const { substanceId, massKg, molarMass, chemicalFormula } = options.vaporInput
    state = addVaporToRoom(state, substanceId, massKg, molarMass, chemicalFormula)
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
  
  // Track air handler energy (based on CFM and typical fan power ~0.5W per CFM)
  const ahPowerWatts = airflow.ahContribution * 0.5
  state = {
    ...state,
    composition: scrubberResult.newComposition,
    scrubberActivity: scrubberResult.activity || 0,
    energyTotals: {
      ...state.energyTotals,
      airHandlerJoules: state.energyTotals.airHandlerJoules + (ahPowerWatts * deltaTime)
    }
  }
  
  // 5. Check for toxic exposure and track consequences
  state = trackExposure(state, airHandler, deltaTime)
  
  // 6. Room pressure leak (slow return toward ambient)
  const ambientPressure = 101325  // Hardcoded sea level - See TODO.md #3 (room phase 2)
  const pressureDiff = state.pressure - ambientPressure
  const leakRate = state.leakRatePaPerSecond || 10
  const pressureChange = Math.sign(pressureDiff) * Math.min(Math.abs(pressureDiff), leakRate * deltaTime)
  state = {
    ...state,
    pressure: state.pressure - pressureChange
  }
  
  // 7. Check for safety alerts
  const newAlerts = checkCompositionAlerts(state.composition)
  
  // 8. Log composition periodically (every 10 seconds of sim time)
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
    acEnabled: roomState.acEnabled,
    acSetpoint: roomState.acSetpoint,
    airHandlerMode: roomState.airHandlerMode,
    scrubberActivity: roomState.scrubberActivity || 0
  }
}
