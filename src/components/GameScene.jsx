/**
 * GameScene Component
 * 
 * This is the main interactive game environment for the Boiling Water educational app.
 * It displays a workshop-defined game window (default 1280x800) with a draggable pot, burner with flame,
 * sink for filling water, and physics simulation for heating/boiling water at different altitudes.
 * 
 * The component handles:
 * - Rendering the fixed-size game window and all visual elements
 * - Pot dragging via Pointer Events (works on mouse, touch, and pen)
 * - Physics simulation loop (runs every 100ms when heat is on)
 * - Water filling when pot touches sink
 * - Temperature display and boiling detection
 * - Educational messages about boiling points at different altitudes
 * - Stage 1 overlay with post-boil explainer and progression button
 */

import { useState, useRef, useEffect, useMemo } from 'react'
import { 
  calculateBoilingPoint,           // Calculates fluid's boiling point based on altitude
  calculateBoilingPointAtPressure, // Calculates fluid's boiling point based on pressure (for room feedback)
  simulateTimeStep,                // Runs one time step of physics (heating/cooling/boiling)
  formatTemperature,               // Formats temperature numbers for display (e.g., 98.5°C)
  // Evaporation physics (pre-boiling)
  solveAntoineForPressure,         // Get vapor pressure at current temperature
  simulateEvaporationWithMassTransfer, // Mass transfer model (physically accurate evaporation)
  estimatePotSurfaceArea           // Estimate liquid surface area
} from '../utils/physics'
import { loadSubstance, loadSubstanceInfo, parseSubstanceProperties, DEFAULT_SUBSTANCE, getAvailableSubstances } from '../utils/substanceLoader'
import { GAME_CONFIG } from '../constants/physics'
import { LEVELS, EXPERIMENTS } from '../constants/workshops'
import ControlPanel from './ControlPanel'
import RoomControls from './RoomControls'
import { useRoomEnvironment } from '../hooks/useRoomEnvironment'
import { getAtmosphereKey } from '../utils/roomEnvironment'
import '../styles/GameScene.css'

// Default layout values (used if workshop layout not provided)
const DEFAULT_LAYOUT = {
  scene: { width: 1280, height: 800 },
  pot: {
    start: { xPercent: 75, yPercent: 45 },
    sizePercent: 36,
    dragBounds: { minX: 8, maxX: 92, minY: 8, maxY: 92 }
  },
  flame: {
    xPercent: 62.6,
    yPercent: 53.4,
    activationRadius: 6.25,
    sizePercentByHeat: [35, 37, 40, 45],
    minSizePxByHeat: [180, 200, 220, 240]
  },
  burnerKnob: {
    xPercent: 66.5,
    yPercent: 67.8,
    sizePercent: 5
  },
  waterStream: {
    xRange: [26, 30],
    yRange: [44, 72],
    start: { xPercent: 28.8, yPercent: 44.0 },
    end: { xPercent: 27.8, yPercent: 70.7 },
    widthPercent: 2
  }
}

function GameScene({ stage, location, onStageChange, workshopLayout, workshopImages, workshopEffects, burnerConfig, roomConfig, acUnitConfig, airHandlerConfig, activeLevel, activeExperiment, showSelectors, onWaterBoiled, onSkipTutorial, onLevelChange, onExperimentChange, hasBoiledBefore = false, onLocationChange, onEquipmentChange }) {
  const layout = workshopLayout || DEFAULT_LAYOUT
  const backgroundImage = workshopImages?.background || null
  const potEmptyImage = workshopImages?.pot_empty || null
  const potFullImage = workshopImages?.pot_full || null
  const flameImage = workshopImages?.flame || null
  const hasRequiredImages = Boolean(backgroundImage && potEmptyImage && potFullImage && flameImage)
  // Workshop-driven optional visual effects (steam, flame glow)
  // Default: effects DISABLED unless workshop provides effects.json
  // This ensures simple workshops have no VFX overhead; only showcase workshops (like alpha) enable them
  const defaultEffects = {
    steam: {
      enabled: false,
      symbol: '💨',
      color: 'rgba(255, 255, 255, 0.95)',
      glow: 'rgba(255, 255, 255, 0.45)',
      sizeRem: 1.5,
      risePx: -40,
      durationMs: 1500,
      offset: { xPercent: 0, yPx: -30 }
    },
    flameGlow: {
      enabled: false,
      color: null, // falls back to --workshop-flame-glow
      blurPx: 16,
      flickerMs: null,
      intensityByHeat: [0, 1, 1.08, 1.16]
    },
    waterStream: {
      enabled: false
    }
  }

  const effects = {
    steam: { ...defaultEffects.steam, ...(workshopEffects?.steam || {}) },
    flameGlow: { ...defaultEffects.flameGlow, ...(workshopEffects?.flameGlow || {}) },
    waterStream: { ...defaultEffects.waterStream, ...(workshopEffects?.waterStream || {}) }
  }
  // ============================================================================
  // STATE VARIABLES: These change during gameplay
  // ============================================================================

  // How much water is currently in the pot, in kilograms (0 = empty, typically 1.0kg = full)
  const [waterInPot, setWaterInPot] = useState(0)

  // Non-volatile residue mass (kg) remaining after evaporation (e.g., salt in saltwater)
  const [residueMass, setResidueMass] = useState(0)

  // Current temperature of the water in Celsius (starts at room temperature)
  const [temperature, setTemperature] = useState(GAME_CONFIG.ROOM_TEMPERATURE)

  // Fluid properties (loaded from JSON, defaults to water)
  // Contains specific heat, heat of vaporization, cooling coefficient, etc.
  const [fluidProps, setFluidProps] = useState(null)

  // Track fluid loading errors instead of falling back to hardcoded defaults
  const [fluidLoadError, setFluidLoadError] = useState(null)

  // Active fluid selection (for Level 3+)
  const [activeFluid, setActiveFluid] = useState(DEFAULT_SUBSTANCE)

  // Available fluids for dropdown
  const [availableFluids, setAvailableFluids] = useState([])

  // Burner heat setting: 0=off, 1=low, 2=med, 3=high
  // Controls the output power of the gas burner
  // Only applies heat when pot is over the flame AND knob is turned on
  const [burnerHeat, setBurnerHeat] = useState(0)

  // Time speed multiplier (1x = normal, 2x = double speed, 4x = 4x speed, etc.)
  const [timeSpeed, setTimeSpeed] = useState(1)

  // Has the water reached its boiling point? (true once boiling starts)
  const [isBoiling, setIsBoiling] = useState(false)

  // Has the boil popup been shown for this experiment? (prevents re-triggering)
  // Only resets on fluid/level change, not on temperature fluctuation
  const [hasShownBoilPopup, setHasShownBoilPopup] = useState(false)

  // Should we display the educational message about boiling points?
  // (This appears when water starts boiling)
  const [showHook, setShowHook] = useState(false)

  // Time from when pot was placed over flame to boiling (for stats)
  const [boilTime, setBoilTime] = useState(0)
  
  // Time at which pot was first placed over flame (to track boil duration)
  const [timePotOnFlame, setTimePotOnFlame] = useState(null)

  // Burner heat setting (0-3) when boiling was achieved (for ideal time calculation)
  const [burnerHeatWhenBoiled, setBurnerHeatWhenBoiled] = useState(0)

  // Snapshot of experiment stats captured at the moment of boiling
  const [boilStats, setBoilStats] = useState(null)

  // Should we pause time flow while popup is visible?
  const [pauseTime, setPauseTime] = useState(false)
  const [showNextLevelButton, setShowNextLevelButton] = useState(false)

  // How many seconds have elapsed since heat was turned on (used for time calculations)
  const [timeElapsed, setTimeElapsed] = useState(0)
  
  // Is the timer running? (user can start/stop manually)
  const [isTimerRunning, setIsTimerRunning] = useState(false)

  // Where is the pot positioned on the screen? Uses percentages (0-100%)
  // x: 0% = left edge, 100% = right edge
  // y: 0% = top edge, 100% = bottom edge
  // The pot's center is positioned at these coordinates
  // Support both old (pot.start) and new (pot.empty) layout structures
  const potStartPos = layout.pot.start || layout.pot.empty || { xPercent: 50, yPercent: 50 }
  const [potPosition, setPotPosition] = useState({ x: potStartPos.xPercent, y: potStartPos.yPercent })

  // Resolve heat steps from burner config (new system) or legacy workshopLayout (fallback)
  const wattageSteps = useMemo(() => {
    // New system: burnerConfig from room.json + burners/{id}.json
    if (burnerConfig?.wattageSteps && Array.isArray(burnerConfig.wattageSteps) && burnerConfig.wattageSteps.length > 0) {
      return burnerConfig.wattageSteps
    }
    // Legacy fallback: burnerControls in workshop.json
    const customSteps = workshopLayout?.burnerControls?.wattageSteps
    if (customSteps && Array.isArray(customSteps) && customSteps.length > 0) return customSteps
    return [0, 400, 1700, 2500]
  }, [burnerConfig, workshopLayout])
  const maxHeatIndex = wattageSteps.length - 1

  // Is the user currently dragging the pot? (true = dragging, false = not dragging)
  const [isDragging, setIsDragging] = useState(false)

  // When dragging starts, we store the offset between the mouse and pot center
  // This prevents the pot from "jumping" to the cursor position
  // Example: if user clicks 50 pixels left of pot center, dragOffset.x = -50
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })

  // The dimensions of the game window (workshop-provided, default 1280x800)
  const [sceneDimensions, setSceneDimensions] = useState({ width: 0, height: 0 })

  // ============================================================================
  // LOCATION & ALTITUDE INPUT: For Level 2+ altitude effects experiment
  // ============================================================================

  // User's entered zip code (for location lookup)
  const [userZipCode, setUserZipCode] = useState('')

  // User's selected country (USA, UK, Australia, Canada)
  const [userCountry, setUserCountry] = useState('USA')

  // Manual altitude input (in meters) as fallback
  const [manualAltitude, setManualAltitude] = useState('')
  // Editable altitude input for different-fluids experiment
  const [editableAltitude, setEditableAltitude] = useState(null)
  // Track if user has confirmed any location/altitude to avoid reopening popup
  // Initialize based on whether location prop already has data
  const [hasSetLocation, setHasSetLocation] = useState(
    () => Boolean(location?.altitude !== 0 || location?.name)
  )

  // Is location lookup currently in progress?
  const [isLoadingLocation, setIsLoadingLocation] = useState(false)

  // Location lookup error message
  const [locationError, setLocationError] = useState(null)

  // User's entered location display name (e.g., "Denver, USA")
  // Initialize from location prop if available
  const [locationName, setLocationName] = useState(() => location?.name || null)
  const [showLocationPopup, setShowLocationPopup] = useState(false)

  // ============================================================================
  // DERIVED STATE: Post-Tutorial Status
  // ============================================================================

  // Find current experiment object (needed for order check and room controls)
  const currentExperimentObj = useMemo(() => {
    const experiments = EXPERIMENTS[activeLevel] || []
    return experiments.find(exp => exp.id === activeExperiment) || null
  }, [activeLevel, activeExperiment])

  // Advanced mode is available after completing tutorial OR skipping it
  // showSelectors indicates tutorial has been passed/skipped (selectors only appear then)
  const isAdvancedModeAvailable = showSelectors && (hasBoiledBefore || activeLevel !== 0)
  
  // Check if current experiment requires location setup (order >= 2 means past tutorial)
  const currentExperimentOrder = currentExperimentObj?.order ?? 1
  // L1E2 (altitude-effect) is THE altitude experiment - it prompts for location
  // All other experiments after L1E2 just use whatever altitude was previously set
  const isAltitudeExperiment = activeExperiment === 'altitude-effect'
  // Location popup allowed for any experiment past tutorial (order >= 2) or any level > 1
  const isLocationPopupAllowed = activeLevel > 1 || currentExperimentOrder >= 2
  // Altitude controls should be available once selectors are unlocked or for altitude experiment
  const showAltitudeControls = showSelectors || isAltitudeExperiment
  
  // Trigger location popup ONLY for altitude-effect experiment (L1E2) if location not yet set
  useEffect(() => {
    if (isAltitudeExperiment && !hasSetLocation && !showLocationPopup) {
      setShowLocationPopup(true)
    }
  }, [activeExperiment, isAltitudeExperiment, hasSetLocation, showLocationPopup])

  // Reset pot position when layout changes
  useEffect(() => {
    const potStartPos = layout.pot.start || layout.pot.empty || { xPercent: 50, yPercent: 50 }
    setPotPosition({ x: potStartPos.xPercent, y: potStartPos.yPercent })
  }, [workshopLayout])

  // Clamp burner heat to available steps when layout changes
  useEffect(() => {
    if (burnerHeat > maxHeatIndex) {
      setBurnerHeat(maxHeatIndex)
    }
  }, [maxHeatIndex, burnerHeat])

  // ============================================================================
  // LOCATION & ALTITUDE: Affects boiling point (must be before room environment)
  // ============================================================================

  // Get the user's altitude in meters (defaults to 0 if location data not available)
  // Higher altitude = lower atmospheric pressure = lower boiling point
  const altitude = (activeExperiment === 'different-fluids' && editableAltitude !== null)
    ? editableAltitude
    : (location?.altitude || 0)

  // ============================================================================
  // ROOM ENVIRONMENT: Temperature, pressure, composition tracking (L1E4+)
  // ============================================================================
  
  // Room controls are enabled when the experiment has unlocksRoomControls flag
  const roomControlsEnabled = Boolean(currentExperimentObj?.unlocksRoomControls)
  
  // Initialize room environment hook (manages room temp, pressure, composition)
  // Pass altitude so room pressure uses ISA calculation based on player's location
  const {
    roomState,
    summary: roomSummary,
    alerts: roomAlerts,
    updateRoom,
    addVapor,
    setAcEnabled,
    setAcSetpoint,
    setAirHandlerMode,
    resetRoom
  } = useRoomEnvironment(roomConfig, acUnitConfig, airHandlerConfig, altitude)

  // ============================================================================
  // REFERENCES: Direct access to DOM elements (not state, just object references)
  // ============================================================================

  // Stores reference to the pot div element (used to get its position during dragging)
  const potRef = useRef(null)

  // Stores reference to the game scene div (used to calculate coordinates relative to it)
  const sceneRef = useRef(null)

  // Stores reference to the heating simulation interval so we can stop it later
  const simulationRef = useRef(null)

  // Pre-calculate what temperature fluid will boil at
  // PRESSURE FEEDBACK LOOP:
  // - Before L1E4: Use altitude to derive pressure (standard behavior)
  // - At L1E4+ (room controls enabled): Use room pressure directly
  //   This creates a feedback loop: boiling → vapor release → pressure rise → BP shift
  const boilingPointResult = useMemo(() => {
    if (!fluidProps) return null
    
    // When room controls are enabled, use room pressure for feedback loop
    if (roomControlsEnabled && roomSummary?.pressure) {
      return calculateBoilingPointAtPressure(roomSummary.pressure, fluidProps)
    }
    
    // Standard: derive pressure from altitude
    return calculateBoilingPoint(altitude, fluidProps)
  }, [fluidProps, altitude, roomControlsEnabled, roomSummary?.pressure])
  
  const boilingPoint = boilingPointResult?.temperature ?? null
  const isBoilingPointExtrapolated = boilingPointResult?.isExtrapolated ?? false
  const boilingPointVerifiedRange = boilingPointResult?.verifiedRange ?? { min: null, max: null }
  const canBoil = Boolean(fluidProps?.canBoil) && Number.isFinite(boilingPoint)
  const boilingPointSeaLevel = Number.isFinite(fluidProps?.boilingPointSeaLevel)
    ? fluidProps.boilingPointSeaLevel
    : null

  const fluidName = fluidProps?.name || 'Fluid'
  const liquidMass = Math.max(0, waterInPot - residueMass)

  // ============================================================================
  // AMBIENT TEMPERATURE: For cooling/heating equilibration
  // Before L1E4: Fixed at 20°C
  // At L1E4+: Uses room environment temperature (affected by AC)
  // ============================================================================
  const ambientTemperature = roomControlsEnabled && roomSummary?.temperature != null
    ? roomSummary.temperature
    : GAME_CONFIG.ROOM_TEMPERATURE

  // ============================================================================
  // ============================================================================
  // EFFECT 1: Load substance properties (runs once on component load, or when room controls change)
  // ============================================================================

  // Load available fluids for dropdown (Level 3+)
  // L1E3: Only safe fluids (no requiresRoomControls flag)
  // L1E4+: All fluids (room controls available for hazardous materials)
  useEffect(() => {
    async function loadFluids() {
      const fluids = await getAvailableSubstances()
      const ambientTemperature = GAME_CONFIG.ROOM_TEMPERATURE

      const fluidCandidates = await Promise.all(
        fluids.all.map(async (substanceId) => {
          try {
            const info = await loadSubstanceInfo(substanceId)
            const props = parseSubstanceProperties(info)

            const meltingPoint = props?.meltingPoint
            const boilingPoint = props?.boilingPointSeaLevel
            
            // Check if substance requires room controls (hazardous materials)
            const needsRoomControls = info?.gameFlags?.requiresRoomControls || false
            
            // Filter out dangerous substances if room controls not enabled
            if (needsRoomControls && !roomControlsEnabled) {
              return null  // Skip hazardous materials in L1E3
            }

            if (
              Number.isFinite(meltingPoint) &&
              Number.isFinite(boilingPoint) &&
              ambientTemperature > meltingPoint &&
              ambientTemperature < boilingPoint
            ) {
              return substanceId
            }
          } catch (error) {
            return null
          }

          return null
        })
      )

      const filteredFluids = fluidCandidates.filter(Boolean)
      setAvailableFluids(filteredFluids)
    }
    loadFluids()
  }, [roomControlsEnabled])  // Re-filter when room controls unlock (L1E3 → L1E4)

  useEffect(() => {
    setShowNextLevelButton(false)
  }, [activeExperiment, activeLevel])

  // Load the current substance's properties from JSON
  useEffect(() => {
    async function initializeFluid() {
      try {
        const substanceData = await loadSubstance(activeFluid)
        const props = parseSubstanceProperties(substanceData)
        setFluidProps(props)
        setFluidLoadError(null)
        setResidueMass(0)
      } catch (error) {
        console.error('Failed to load fluid properties:', error)
        setFluidProps(null)
        setFluidLoadError(error)
      }
    }
    initializeFluid()
  }, [activeFluid, workshopLayout])

  // EFFECT 2: Initialize the game window dimensions (runs once on component load)
  // ============================================================================

  useEffect(() => {
    // This "effect" runs only once when the component first appears
    // It sets up the game window to be exactly 1280x800 pixels
    const updateDimensions = () => {
      if (sceneRef.current) {
        // We set dimensions to a fixed size (matching the background image dimensions)
        // This ensures all percentage-based positioning stays consistent
        setSceneDimensions({
          width: layout.scene.width,   // Fixed width in pixels
          height: layout.scene.height  // Fixed height in pixels
        })
      }
    }

    // Call it immediately when component loads
    updateDimensions()
    
    // Empty dependency array [] means: only run once, never again
    // If we removed the [], it would run every time any state changes
  }, [])

  // ============================================================================
  // EFFECT 3: Physics simulation loop (runs continuously when water is in pot)
  // ============================================================================

  // ============================================================================
  // EFFECT 3: Physics simulation loop (runs continuously when water is in pot)
  // ============================================================================

  useEffect(() => {
    // This effect handles the physics simulation of heating/cooling water
    // It runs continuously while there's water in the pot
    // Heat is only applied when the pot is over the flame
    // Now uses Newton's Law of Cooling for realistic temperature decay
    if (liquidMass <= 0 || !fluidProps) return  // Wait for fluid props to load

    // Define the heat activation area around the flame (workshop-driven)
    const flameX = layout.flame.xPercent
    const flameY = layout.flame.yPercent
    const heatActivationRadius = layout.flame.activationRadius
    
    // Start a repeating timer that runs every TIME_STEP milliseconds (e.g., every 100ms)
    simulationRef.current = setInterval(() => {
      // Skip simulation if time is paused (e.g., popup visible)
      if (pauseTime) return
      
      // Calculate distance from pot center to flame center
      const deltaX = Math.abs(potPosition.x - flameX)
      const deltaY = Math.abs(potPosition.y - flameY)
      const distanceToFlame = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
      
      // Check if pot is within the heat activation area
      const potOverFlame = distanceToFlame <= heatActivationRadius
      
      // Determine heat output based on burner knob setting and pot position
      // Heat only applies when BOTH conditions are true:
      // 1. Burner knob is turned on (not set to 0/off)
      // 2. Pot is positioned over the flame
      let heatInputWatts = 0
      if (burnerHeat > 0 && potOverFlame) {
        const heatLevels = wattageSteps
        heatInputWatts = heatLevels[burnerHeat] || 0
        
        // Track when pot is first placed over flame with heat on
        // Initialize to 0 if just started, otherwise accumulate time
        if (timePotOnFlame === null) {
          setTimePotOnFlame(0)
        } else {
          // Accumulate time while heating (deltaTime calculated below, use TIME_STEP for now)
          const dt = (GAME_CONFIG.TIME_STEP / 1000) * timeSpeed
          setTimePotOnFlame(prev => (prev ?? 0) + dt)
        }
      } else if (timePotOnFlame !== null) {
        // Reset if pot is removed from flame or heat is turned off
        setTimePotOnFlame(null)
      }
      // If heat is off or pot is not over flame, heatInputWatts stays 0
      // Newton's Law of Cooling will handle the temperature decay automatically

      // Convert the TIME_STEP from milliseconds to seconds
      // If TIME_STEP = 100 (milliseconds), deltaTime = 0.1 (seconds)
      // Multiply by timeSpeed to speed up simulation (2x, 4x, 8x, etc.)
      const deltaTime = (GAME_CONFIG.TIME_STEP / 1000) * timeSpeed

      // Call the physics engine function to calculate what happens in this time step
      // It takes:
      // - Current fluid properties (mass, temperature, altitude)
      // - Heat being applied (Watts, 0 for natural cooling)
      // - Time elapsed in this step (seconds × speed multiplier)
      // - Fluid properties (specific heat, cooling coefficient, etc.)
      // - Ambient temperature for equilibration
      // And returns new temperature, fluid mass, and whether it's boiling
      const newState = simulateTimeStep(
        {
          waterMass: waterInPot,         // How much fluid (kg)
          temperature: temperature,      // Current temperature (°C)
          altitude: altitude,            // Current altitude (meters)
          residueMass: residueMass       // Non-volatile residue (kg)
        },
        heatInputWatts,                   // How much heat to apply (Watts)
        deltaTime,                        // How much time this step represents (seconds)
        fluidProps,                       // Fluid properties (specific heat, cooling, etc.)
        ambientTemperature                // Room temperature for equilibration
      )

      // Update all the values returned from the physics simulation
      setTemperature(newState.temperature)      // Water is now hotter or cooler
      setWaterInPot(newState.waterMass)        // Water mass decreases if boiling (evaporation)
      
      // Room environment: Track burner heat and vapor release
      // The main room simulation (AC, air handler) runs in a separate effect
      // Here we only add external heat sources and vapor from boiling
      if (roomControlsEnabled && roomConfig) {
        // Track burner heat (waste heat radiating into room)
        if (heatInputWatts > 0) {
          updateRoom(deltaTime, 'experiment_burner', heatInputWatts)
        }
        
        // ========== PRE-BOILING EVAPORATION (Mass Transfer Model) ==========
        // Even below boiling point, volatile substances evaporate!
        // This cools the liquid (can go BELOW ambient) and adds vapor to room.
        // Uses Fuller-Schettler-Giddings diffusion + boundary layer mass transfer.
        // Only runs when NOT boiling (boiling evaporation is handled separately).
        if (!newState.isBoiling && fluidProps?.antoineCoefficients && newState.waterMass > 0) {
          // Get vapor pressure at current temperature
          const vaporPressure = solveAntoineForPressure(newState.temperature, fluidProps.antoineCoefficients)
          
          if (vaporPressure && vaporPressure > 0) {
            // Get partial pressure of this substance already in room air
            // Use atmosphere key from chemical formula (e.g., 'H₂O' -> 'H2O')
            const atmosphereKey = getAtmosphereKey(activeFluid, fluidProps)
            const roomComposition = roomState?.composition || {}
            const totalPressure = roomState?.pressure || 101325
            const partialPressure = (roomComposition[atmosphereKey] || 0) * totalPressure
            
            // Calculate evaporation using mass transfer model (physically accurate)
            // Uses diffusion coefficient from Fuller-Schettler-Giddings equation
            // and natural convection mass transfer correlations
            const evapResult = simulateEvaporationWithMassTransfer({
              liquidTempC: newState.temperature,
              liquidMassKg: newState.waterMass,
              vaporPressurePa: vaporPressure,
              pressurePa: totalPressure,
              molarMassGmol: fluidProps.molarMass || 18.015,
              latentHeatKJ: fluidProps.heatOfVaporization || 2257,
              specificHeatJgC: fluidProps.specificHeat || 4.186,
              potDiameterM: 0.2,  // 20cm pot
              partialPressurePa: partialPressure,
              diffusionVolumeSum: fluidProps.diffusionVolumeSum,  // Calculated at load time from element data
              deltaTimeS: deltaTime
            })
            
            // Apply evaporative cooling (can cool below ambient!)
            // IMPORTANT: Apply to newState.temperature (from heating sim), not prev!
            if (evapResult.massEvaporatedKg > 1e-9) {
              // Combine heating result + evaporative cooling
              const finalTemp = newState.temperature + evapResult.tempChangeC
              setTemperature(finalTemp)
              setWaterInPot(evapResult.newMassKg)
              
              // Add vapor to room air composition (pass formula for atmosphere key)
              addVapor(activeFluid, evapResult.massEvaporatedKg, fluidProps?.molarMass || 18.015, fluidProps?.chemicalFormula)
            }
          }
        }
        
        // If water is boiling, add boiling-phase vapor to room
        if (newState.isBoiling && newState.waterMass < waterInPot) {
          const evaporatedMass = waterInPot - newState.waterMass
          addVapor(activeFluid, evaporatedMass, fluidProps?.molarMass || 18.015, fluidProps?.chemicalFormula)
        }
      }
      
      // Track elapsed time only if timer is running
      if (isTimerRunning) {
        setTimeElapsed(prev => prev + deltaTime)  // Track elapsed time (accounts for speed)
      }

      // Check if water just started boiling
      // We only show "boiling" if it wasn't boiling before but is now boiling
      // hasShownBoilPopup prevents re-triggering if temp fluctuates around boiling point
      if (newState.isBoiling && !isBoiling && !hasShownBoilPopup) {
        setIsBoiling(true)   // Mark as boiling
        setHasShownBoilPopup(true)  // Prevent re-triggering
        setShowHook(true)    // Show the educational message
        setPauseTime(true)   // Pause time while popup is visible
        setShowNextLevelButton(Boolean(getNextProgression()))
        // Calculate time it took to boil (from when pot was placed over flame)
        const elapsedBoilTime = timePotOnFlame !== null ? timePotOnFlame + deltaTime : 0
        setBoilTime(elapsedBoilTime)
        // Capture the burner heat setting when boiling is achieved
        setBurnerHeatWhenBoiled(burnerHeat)
        
        // Capture snapshot of all experiment stats at moment of boiling
        setBoilStats({
          temperature: newState.temperature,
          boilingPoint: boilingPoint,
          boilingPointSeaLevel: fluidProps?.boilingPointSeaLevel ?? null,
          altitude: altitude,
          locationName: locationName,
          fluidName: fluidProps?.name || 'Fluid',
          fluidId: activeFluid,
          timeToBoil: elapsedBoilTime,
          burnerHeat: burnerHeat,
          experiment: activeExperiment,
          level: activeLevel,
          // Room environment data (L1E4+)
          roomData: roomControlsEnabled ? {
            initialComposition: roomState?.initialComposition || null,
            finalComposition: roomState?.composition || null,
            initialTemperature: roomState?.initialTemperature || null,
            finalTemperature: roomState?.temperature || null,
            energyTotals: roomState?.energyTotals || null,
            exposureEvents: roomState?.exposureEvents || [],
            alerts: roomAlerts || []
          } : null
        })
        
        onWaterBoiled?.()    // Notify parent that water has boiled
      }
      
      // Stop boiling if temperature drops below boiling point (pot removed from heat)
      if (canBoil && newState.temperature < boilingPoint && isBoiling) {
        setIsBoiling(false)
      }

      if (!canBoil && isBoiling) {
        setIsBoiling(false)
      }
    }, GAME_CONFIG.TIME_STEP)  // Repeat every TIME_STEP milliseconds

    // Cleanup function: runs when component unmounts or dependencies change
    // This stops the interval so we don't have multiple intervals running
    return () => {
      if (simulationRef.current) {
        clearInterval(simulationRef.current)
      }
    }
  }, [waterInPot, liquidMass, residueMass, temperature, altitude, boilingPoint, canBoil, isBoiling, hasShownBoilPopup, timeSpeed, potPosition, burnerHeat, fluidProps, workshopLayout, isTimerRunning, pauseTime])  // Re-run if any of these change

  // ============================================================================
  // EFFECT 4: Room environment simulation (AC, air handler) - runs independently
  // ============================================================================

  useEffect(() => {
    // This effect handles room environment simulation (temperature regulation, air handling)
    // It runs independently of whether there's liquid in the pot
    // Only active when room controls are enabled (L1E4+)
    if (!roomControlsEnabled || !roomConfig) return
    
    const roomSimRef = setInterval(() => {
      // Skip if time is paused
      if (pauseTime) return
      
      // Calculate timestep (same as main simulation)
      const deltaTime = (GAME_CONFIG.TIME_STEP / 1000) * timeSpeed
      
      // Update room environment (AC maintains temperature, air handler cleans air)
      // Pass 0 for heat since we're not tracking burner heat here (that happens in main sim)
      updateRoom(deltaTime, null, 0)
    }, GAME_CONFIG.TIME_STEP)
    
    return () => clearInterval(roomSimRef)
  }, [roomControlsEnabled, roomConfig, timeSpeed, pauseTime, updateRoom])

  // ============================================================================
  // POT DRAGGING HANDLERS: Three functions handle the drag lifecycle
  // ============================================================================

  /**
   * handleFluidChange - Called when user selects a different fluid from dropdown
   * Resets pot and loads new fluid properties
   */
  const handleFluidChange = (e) => {
    const newFluid = e.target.value
    setActiveFluid(newFluid)
    // Reset pot state when switching fluids
    setWaterInPot(0)
    setTemperature(ambientTemperature)  // Start at current room temperature
    setIsBoiling(false)
    setHasShownBoilPopup(false)  // Allow popup to trigger again for new fluid
    setShowHook(false)
    setBoilStats(null)
  }

  /**
   * handlePointerDown - Called when user presses pointer (mouse/touch/pen) on pot
   * Starts the dragging process
   */
  const handlePointerDown = (e) => {
    // Prevent any default browser behavior (like native drag-and-drop)
    e.preventDefault()

    // Safety check: make sure the pot element exists
    if (!potRef.current || !sceneRef.current) return

    // Request "pointer capture" - this tells the browser that all pointer events
    // should go to this element while dragging, even if cursor moves outside it
    // Without this, moving too fast could lose the drag
    try {
      potRef.current.setPointerCapture(e.pointerId)
    } catch (_) {
      // If the browser doesn't support this, continue anyway (older browsers)
    }

    // Mark that we are now dragging
    setIsDragging(true)

    // Calculate the "drag offset" - the distance between where the user clicked
    // and the pot's center. This prevents the pot from jumping to the cursor.
    // 
    // Example: If pot center is at pixel 500 and user clicks at pixel 450 (left side)
    // Then dragOffset = 450 - 500 = -50
    // Later, when pot follows cursor to position 550, the offset keeps it from snapping
    const rect = potRef.current.getBoundingClientRect()  // Get pot's current size/position
    const centerX = rect.left + rect.width / 2           // Calculate center X position
    const centerY = rect.top + rect.height / 2           // Calculate center Y position

    setDragOffset({
      x: e.clientX - centerX,  // How far left/right from center
      y: e.clientY - centerY   // How far up/down from center
    })
  }

  /**
   * handlePointerMove - Called continuously while pointer is held down and dragging
   * Updates the pot position to follow the cursor
   */
  const handlePointerMove = (e) => {
    // Only process this if we're currently dragging
    if (!isDragging || !sceneRef.current) return

    // Get the game scene's position on screen
    const sceneRect = sceneRef.current.getBoundingClientRect()

    // Calculate where the user's cursor is, relative to the game scene
    // Subtract the drag offset so the pot follows the cursor correctly
    // newX and newY are in pixels
    let newX = e.clientX - sceneRect.left - dragOffset.x
    let newY = e.clientY - sceneRect.top - dragOffset.y

    // Convert from pixel coordinates to percentages (0-100%)
    // This makes pot position independent of screen size
    // If game window is 1280 pixels wide and newX is 640, then newXPercent = 50%
    let newXPercent = (newX / sceneDimensions.width) * 100
    let newYPercent = (newY / sceneDimensions.height) * 100

    // Apply boundary constraints: keep pot mostly on screen
    // Min values (8%) and max values (92%) account for the pot's transparent corners
    // A 36% size pot with center at 8% means left edge is at 8-18 = -10% (mostly off)
    // A 36% size pot with center at 92% means right edge is at 92+18 = 110% (mostly off)
    // But visible pot can nearly reach the edges
    newXPercent = Math.max(8, Math.min(newXPercent, 92))
    newYPercent = Math.max(8, Math.min(newYPercent, 92))

    // Update the pot's position state
    setPotPosition({ x: newXPercent, y: newYPercent })

    // AUTO-FILL: Check if pot is in the water stream area
    // Water stream is from (295,451) to (285,724) in original 1024x1024 image
    // Converting to percentages: X is around 27-29%, Y is from 44% to 71%
    // We check if pot center is passing through this vertical stream AND pot is empty
    const inWaterStream =
      newXPercent >= layout.waterStream.xRange[0] &&
      newXPercent <= layout.waterStream.xRange[1] &&
      newYPercent >= layout.waterStream.yRange[0] &&
      newYPercent <= layout.waterStream.yRange[1]
    if (inWaterStream && liquidMass < 0.1) {  // Refill if nearly empty (< 0.1kg)
      // Auto-fill with the default water amount (1.0 kg)
      const fillMass = GAME_CONFIG.DEFAULT_WATER_MASS
      const nonVolatileFraction = fluidProps?.nonVolatileMassFraction ?? 0
      setWaterInPot(fillMass)
      setResidueMass(fillMass * nonVolatileFraction)
      // Reset temperature to current room/ambient temp when filling with fresh fluid
      setTemperature(ambientTemperature)
      // Reset boiling state
      setIsBoiling(false)
      setHasShownBoilPopup(false)  // Allow popup to trigger for fresh fill
      // Reset burner heat tracking
      setBurnerHeatWhenBoiled(0)
    }
  }

  /**
   * handlePointerUp - Called when user releases pointer (stops dragging)
   */
  const handlePointerUp = (e) => {
    // Release the pointer capture so other elements can receive events again
    try {
      if (potRef.current?.hasPointerCapture?.(e.pointerId)) {
        potRef.current.releasePointerCapture(e.pointerId)
      }
    } catch (_) {
      // If release fails, continue anyway
    }

    // Mark that we're no longer dragging
    setIsDragging(false)
  }

  // ============================================================================
  // BUTTON HANDLERS
  // ============================================================================

  /**
  * Cycle through time speed options: 1x → 2x → 4x → ... → 65536x (Basic Mode)
   */
  const handleSpeedUp = () => {
    setTimeSpeed(current => {
      // From fractional speeds, go to pause (0)
      if (current < 1) return 0
      // From pause, go to 1x
      if (current === 0) return 1
      // Normal progression (doubling)
      const doubled = current * 2
      return doubled <= 65536 ? doubled : 65536  // Cap at 65536x
    })
  }

  /**
   * Double the time speed (Advanced Mode)
   */
  const handleSpeedDouble = () => {
    setTimeSpeed(current => {
      // Handle pause state: 0 -> 1x
      if (current === 0) return 1
      const doubled = current * 2
      return doubled <= 65536 ? doubled : 65536  // Cap at 65536x
    })
  }

  /**
   * Halve the time speed (Advanced Mode)
   * Progression: 1x -> 0 (pause) -> 1/2x -> 1/4x -> ... -> 1/65536x
   */
  const handleSpeedHalve = () => {
    const minSpeed = 1 / 65536  // 1/65536x as slowest
    setTimeSpeed(current => {
      // At 1x, go to pause (0)
      if (current === 1) return 0
      // At pause, go to 1/2x
      if (current === 0) return 0.5
      // Normal halving
      const halved = current / 2
      return halved >= minSpeed ? halved : minSpeed  // Min 1/65536x speed
    })
  }

  /**
   * Quick pause button - toggle between current speed and 0 (pause)
   */
  const handleQuickPause = () => {
    setTimeSpeed(current => {
      // If already paused, return to 1x
      if (current === 0) return 1
      // Otherwise pause
      return 0
    })
  }

  /**
   * Toggle timer (start/stop)
   */
  const handleTimerToggle = () => {
    setIsTimerRunning(prev => !prev)
  }
  
  /**
   * Reset timer to zero
   */
  const handleTimerReset = () => {
    setTimeElapsed(0)
  }

  /**
  * Cycle through burner heat settings: off → low → med → high → off
   * 0=off, 1=low (400W), 2=med (1700W), 3=high (2500W)
   */
  const handleBurnerKnob = () => {
    setBurnerHeat(current => (current >= maxHeatIndex ? 0 : current + 1))
  }

  const handleHeatDown = () => {
    setBurnerHeat(current => Math.max(0, current - 1))
  }

  const handleHeatUp = () => {
    setBurnerHeat(current => Math.min(maxHeatIndex, current + 1))
  }

  /**
   * Transitions to the next stage (more educational content) when user clicks "Learn More"
   */
  const handleLearnMore = () => {
    // Call the parent component callback to change the game stage
    // This transitions from Stage 0 (gameplay) to Stage 1 (educational content)
    onStageChange(1)
  }

  const getNextExperimentInLevel = () => {
    // Get all experiments for current level, sorted by order
    const levelExperiments = EXPERIMENTS[activeLevel]?.slice().sort((a, b) => (a.order || 0) - (b.order || 0)) || []
    const currentIndex = levelExperiments.findIndex((exp) => exp.id === activeExperiment)
    const nextExp = currentIndex >= 0 ? levelExperiments[currentIndex + 1] : null
    return nextExp?.id ?? null
  }

  const getNextLevelId = () => {
    const sortedLevels = LEVELS.slice().sort((a, b) => (a.order || 0) - (b.order || 0))
    const currentIndex = sortedLevels.findIndex((level) => level.id === activeLevel)
    const nextLevel = currentIndex >= 0 ? sortedLevels[currentIndex + 1] : null
    return nextLevel?.id ?? null
  }

  const getNextProgression = () => {
    // Check for next experiment in current level first
    const nextExp = getNextExperimentInLevel()
    if (nextExp) {
      return { type: 'experiment', id: nextExp }
    }
    // If no next experiment, check for next level
    const nextLevel = getNextLevelId()
    if (nextLevel) {
      // Get first experiment of next level
      const firstExp = EXPERIMENTS[nextLevel]?.[0]?.id
      return { type: 'level', levelId: nextLevel, experimentId: firstExp }
    }
    return null
  }

  const handleNextProgression = () => {
    const progression = getNextProgression()
    if (!progression) return

    setShowHook(false)
    setPauseTime(false)
    setShowNextLevelButton(false)
    setBoilStats(null)

    if (progression.type === 'experiment') {
      onExperimentChange?.(progression.id)
    } else if (progression.type === 'level') {
      onLevelChange?.(progression.levelId)
      onExperimentChange?.(progression.experimentId)
    }
  }

  /**
   * Proceed to next stage from info screen
   */
  const handleNextStage = () => {
    onStageChange(stage + 1)
  }

  // ============================================================================
  // LOCATION & ALTITUDE HANDLERS
  // ============================================================================

  /**
   * Handle location search - works worldwide (city names, landmarks, etc.)
   */
  const handleSearchLocation = async () => {
    if (!userZipCode.trim()) {
      setLocationError('Please enter a location (city, landmark, region, etc.)')
      return
    }

    setIsLoadingLocation(true)
    setLocationError(null)

    try {
      const { getAltitudeFromLocationName } = await import('../utils/locationUtils')
      const result = await getAltitudeFromLocationName(userZipCode)
      
      // Update the location through parent component
      onLocationChange?.({
        altitude: result.altitude,
        name: result.name,
        fullName: result.fullName,
        latitude: result.latitude,
        longitude: result.longitude
      })

      setLocationName(result.name)
      setLocationError(null)
      setUserZipCode('')  // Clear input after successful search
      setManualAltitude('')  // Clear manual input
      setHasSetLocation(true)
      setShowLocationPopup(false)  // Close popup after selection
    } catch (error) {
      setLocationError(error.message || 'Location not found. Try a city, landmark, or geographic feature.')
      console.error('Location search error:', error)
    } finally {
      setIsLoadingLocation(false)
    }
  }

  /**
   * Handle manual altitude entry
   */
  const handleSetManualAltitude = () => {
    const altitudeNum = parseFloat(manualAltitude)
    
    // Allow any number (negative for below sea level: Death Valley -86m, Dead Sea -430m)
    if (isNaN(altitudeNum)) {
      setLocationError('Please enter a valid altitude in meters (negative for below sea level)')
      return
    }

    onLocationChange?.({
      altitude: altitudeNum,
      latitude: null,
      longitude: null
    })

    // Manual altitude entry clears location name (shows only altitude in panel)
    setLocationName('')
    setUserZipCode('')
    setManualAltitude('')
    setLocationError(null)
    setHasSetLocation(true)
    setShowLocationPopup(false)  // Close popup after selection
  }

  /**
   * Handle browser geolocation
   */
  const handleFindMyLocation = async () => {
    setIsLoadingLocation(true)
    setLocationError(null)

    try {
      const { getUserLocation } = await import('../utils/locationUtils')
      const result = await getUserLocation()
      
      onLocationChange?.({
        altitude: result.altitude,
        name: result.name,
        latitude: result.latitude,
        longitude: result.longitude
      })

      setLocationName(result.name)
      setUserZipCode('')
      setManualAltitude('')
      setLocationError(null)
      setHasSetLocation(true)
      setShowLocationPopup(false)  // Close popup after selection
    } catch (error) {
      setLocationError(error.message || 'Could not access your location')
      console.error('Geolocation error:', error)
    } finally {
      setIsLoadingLocation(false)
    }
  }

  /**
   * Reset location - show popup again to change location
   */
  const handleResetLocation = () => {
    setLocationName(null)
    setUserZipCode('')
    setManualAltitude('')
    setLocationError(null)
    setHasSetLocation(false)
    setShowLocationPopup(true)  // Show popup again for selection
    onLocationChange?.({
      altitude: 0,
      name: null,
      latitude: null,
      longitude: null
    })
  }

  // ============================================================================
  // CALCULATED VALUES (derived from state)
  // ============================================================================

  // Original background image dimensions (what it is in the PNG file)
  const baseWidth = layout.scene.width   // pixels - current display width
  const baseHeight = layout.scene.height   // pixels - current display height

  // Calculate scale factors (not used much since we use percentages, but kept for reference)
  const scaleX = sceneDimensions.width / baseWidth
  const scaleY = sceneDimensions.height / baseHeight
  const scale = Math.min(scaleX, scaleY)

  // Flame position (workshop-driven)
  const flameX = layout.flame.xPercent
  const flameY = layout.flame.yPercent

  // Calculate water stream position (from original 1024x1024: starts at 295,451 ends at 285,724)
  const waterStreamStartX = layout.waterStream.start.xPercent
  const waterStreamStartY = layout.waterStream.start.yPercent
  const waterStreamEndX = layout.waterStream.end.xPercent
  const waterStreamEndY = layout.waterStream.end.yPercent
  const waterStreamHeight = waterStreamEndY - waterStreamStartY

  // Workshop-driven optional glow/steam tuning
  const flameGlowConfig = effects.flameGlow
  const flameGlowIntensity = flameGlowConfig.intensityByHeat?.[burnerHeat] ?? 1
  const flameGlowBlur = (flameGlowConfig.blurPx ?? 16) * flameGlowIntensity
  const flameGlowColor = flameGlowConfig.color || 'var(--workshop-flame-glow, #ff3300)'
  const flameFilter = flameGlowConfig.enabled
    ? `drop-shadow(0 0 ${flameGlowBlur}px ${flameGlowColor})`
    : undefined
  const flameAnimationDuration = flameGlowConfig.flickerMs
    ? `${flameGlowConfig.flickerMs}ms`
    : undefined

  const steamConfig = effects.steam
  const steamStyle = {
    '--steam-duration': `${(steamConfig.durationMs ?? 1500) / 1000}s`,
    '--steam-rise': `${steamConfig.risePx ?? -40}px`,
    '--steam-size': `${steamConfig.sizeRem ?? 1.5}rem`,
    '--steam-color': steamConfig.color,
    '--steam-glow': steamConfig.glow,
    top: `${steamConfig.offset?.yPx ?? -30}px`,
    left: `calc(50% + ${steamConfig.offset?.xPercent ?? 0}%)`
  }

  // Check if pot is in the water stream area to show the pouring effect
  // Only show if workshop has explicitly enabled waterStream effect
  // SPECIAL CASE: If substance boils at or below ambient temperature,
  // show upward steam instead of downward water stream
  const boilsAtAmbient = fluidProps && Number.isFinite(boilingPoint) && boilingPoint <= ambientTemperature
  
  const showWaterStream = !boilsAtAmbient && effects.waterStream.enabled &&
    potPosition.x >= layout.waterStream.xRange[0] &&
    potPosition.x <= layout.waterStream.xRange[1] &&
    potPosition.y >= layout.waterStream.yRange[0] &&
    potPosition.y <= layout.waterStream.yRange[1]
  
  const showAmbientSteam = boilsAtAmbient && effects.waterStream.enabled &&
    potPosition.x >= layout.waterStream.xRange[0] &&
    potPosition.x <= layout.waterStream.xRange[1] &&
    potPosition.y >= layout.waterStream.yRange[0] &&
    potPosition.y <= layout.waterStream.yRange[1]

  // Check if pot is positioned over the burner (for status display)
  const heatActivationRadius = layout.flame.activationRadius
  const deltaXToFlame = Math.abs(potPosition.x - flameX)
  const deltaYToFlame = Math.abs(potPosition.y - flameY)
  const distanceToFlameCenter = Math.sqrt(deltaXToFlame * deltaXToFlame + deltaYToFlame * deltaYToFlame)
  const isPotOverFlame = distanceToFlameCenter <= heatActivationRadius

  // Calculate expected time to boil (in real-world seconds)
  // Q = m * c * ΔT  (energy needed)
  // Time = Q / Power (in seconds)
  const calculateExpectedBoilTime = () => {
    if (!fluidProps || !canBoil || liquidMass === 0 || temperature >= boilingPoint) return null
    const powerWatts = wattageSteps[burnerHeat] || 0
    if (powerWatts === 0) return null
    
    if (!Number.isFinite(fluidProps.specificHeat)) return null
    const specificHeat = fluidProps.specificHeat * 1000  // Convert J/g to J/kg
    const tempDelta = boilingPoint - temperature
    const energyNeeded = liquidMass * specificHeat * tempDelta  // Joules
    const timeSeconds = energyNeeded / powerWatts  // Seconds
    return timeSeconds
  }

  const expectedBoilTime = calculateExpectedBoilTime()

  // Format time in mm:ss
  const formatTime = (seconds) => {
    if (seconds === null || seconds === undefined) return '--:--'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Calculate ideal boil time based on burner heat setting
  // (Energy needed: Q = mcΔT = 1000g × 4.186 J/(g·°C) × 80°C = 334,880 Joules)
  // (Time = Energy / Power in Watts, but accounting for altitude pressure effects)
  const calculateIdealBoilTime = (heatLevel, boilPointTarget) => {
    const watts = wattageSteps[heatLevel] || wattageSteps[2]  // default to medium if invalid
    
    if (watts === 0) return null  // Can't boil without heat
    if (!fluidProps || !canBoil || !Number.isFinite(boilPointTarget)) return null
    
    // Energy to heat fluid from current ambient temp to boiling point
    const waterMass = GAME_CONFIG.DEFAULT_WATER_MASS * 1000  // grams
    if (!Number.isFinite(fluidProps.specificHeat)) return null
    const specificHeat = fluidProps.specificHeat  // J/(g·°C)
    const tempDifference = boilPointTarget - ambientTemperature
    
    const energyNeeded = waterMass * specificHeat * tempDifference  // Joules
    const timeSeconds = energyNeeded / watts
    
    return timeSeconds
  }

  // Drag boundaries: how far the pot center can move (in percentages)
  // These are conservative to keep the pot mostly on screen
  const maxXPercent = layout.pot.dragBounds.maxX
  const maxYPercent = layout.pot.dragBounds.maxY
  const minXPercent = layout.pot.dragBounds.minX
  const minYPercent = layout.pot.dragBounds.minY

  // ============================================================================
  // RENDER: Build and return the UI
  // ============================================================================

  if (!hasRequiredImages) {
    return (
      <div className="info-screen">
        <div className="info-content">
          <h2>⚠️ Workshop Assets Missing</h2>
          <p>This workshop must provide all required images (background, pot, flame). Add them in the workshop JSON before running the scene.</p>
        </div>
      </div>
    )
  }

  if (fluidLoadError) {
    return (
      <div className="info-screen">
        <div className="info-content">
          <h2>⚠️ Substance Data Load Failed</h2>
          <p>{fluidLoadError.message || 'Unable to load substance properties from data files.'}</p>
        </div>
      </div>
    )
  }

  // Stage 0: Interactive game scene
  return (
    <div className="game-scene">
      {/* 
        The outer game-scene div fills the entire browser viewport
        It's centered in the middle and has a black background for letterboxing
      */}

      <div 
        ref={sceneRef}
        className="game-scene-inner"
        style={{
          backgroundImage: `url(${backgroundImage})`,
          width: `${layout.scene.width}px`,
          height: `${layout.scene.height}px`,
          backgroundSize: '100% 100%'
        }}
      >
        {/* 
          ========== WATER STREAM (Water Source) ==========
          Pouring water effect from faucet area
          Appears only when pot is passing through the stream
        */}
        {showWaterStream && (
          <div 
            className="water-stream"
            style={{
              left: `${waterStreamStartX}%`,
              top: `${waterStreamStartY}%`,
              width: `${layout.waterStream.widthPercent}%`,
              height: `${waterStreamHeight}%`
            }}
          />
        )}
        
        {/* 
          ========== AMBIENT-BOILING STEAM (For low-boiling substances) ==========
          Upward steam effect for substances that boil at or below 20°C (room temp)
          Examples: Hydrogen (-252°C), Oxygen (-183°C), Nitrogen (-196°C)
          Shows colored steam rising instead of downward water stream
        */}
        {showAmbientSteam && fluidProps && (
          <div 
            className="ambient-boil-steam"
            style={{
              left: `${waterStreamStartX}%`,
              top: `${waterStreamStartY}%`,
              width: `${layout.waterStream.widthPercent}%`,
              height: `${waterStreamHeight}%`,
              // Use substance-specific color from catalog if available
              backgroundColor: fluidProps.color?.gas || 'rgba(200, 230, 255, 0.4)',
              opacity: 0.6
            }}
          />
        )}

        {/* 
          ========== FLAME (Burner visualization) ==========
          Located at center-right where the burner is
          Shows a flame image when heat is on
        */}
        <div 
          className="stove-burner"
          style={{
            left: `${flameX}%`,
            top: `${flameY}%`,
            width: burnerHeat === 0 ? '0%' : `${(layout.flame.sizePercentByHeat?.[burnerHeat] ?? layout.flame.sizePercentByHeat?.at(-1) ?? 0)}%`,
            height: burnerHeat === 0 ? '0%' : `${(layout.flame.sizePercentByHeat?.[burnerHeat] ?? layout.flame.sizePercentByHeat?.at(-1) ?? 0)}%`,
            minWidth: burnerHeat === 0 ? '0px' : `${(layout.flame.minSizePxByHeat?.[burnerHeat] ?? layout.flame.minSizePxByHeat?.at(-1) ?? 0)}px`,
            minHeight: burnerHeat === 0 ? '0px' : `${(layout.flame.minSizePxByHeat?.[burnerHeat] ?? layout.flame.minSizePxByHeat?.at(-1) ?? 0)}px`
          }}
        >
          {/* Show flame image when burner is on; glow/animation effects applied only if workshop enables them */}
          {burnerHeat > 0 && (
            <img 
              src={flameImage}
              alt="Gas burner flame"
              className="flame-graphic"
              style={{
                filter: effects.flameGlow.enabled ? flameFilter : 'none',
                animationDuration: effects.flameGlow.enabled ? flameAnimationDuration : '0s'
              }}
            />
          )}
        </div>

        {/* Button-based burner controls (for workshops that replace the knob) */}
        {layout.burnerControls?.type === 'buttons' && (
          <>
            <div
              className="burner-wattage-display"
              style={{
                left: `${layout.burnerControls.wattageDisplay.xPercent}%`,
                top: `${layout.burnerControls.wattageDisplay.yPercent}%`,
                width: `${layout.burnerControls.wattageDisplay.widthPercent}%`,
                height: `${layout.burnerControls.wattageDisplay.heightPercent}%`,
                border: `${layout.burnerControls.wattageDisplay.borderPx || 1}px solid ${layout.burnerControls.wattageDisplay.borderColor || '#333'}`,
                background: layout.burnerControls.wattageDisplay.backgroundColor || '#f0f0f0',
                color: layout.burnerControls.wattageDisplay.textColor || '#000',
              }}
            >
              {`${wattageSteps[burnerHeat] || 0} W`}
            </div>

            <span id="burner-controls-help" className="sr-only">
              Adjust the burner power level to change heating intensity.
            </span>

            <button
              className="burner-btn burner-btn-down"
              style={{
                left: `${layout.burnerControls.downButton.xPercent}%`,
                top: `${layout.burnerControls.downButton.yPercent}%`,
                width: `${layout.burnerControls.downButton.sizePercent}%`,
                height: `${layout.burnerControls.downButton.sizePercent}%`,
              }}
              onClick={handleHeatDown}
              aria-label="Burner down"
              aria-describedby="burner-controls-help"
              title="Decrease burner wattage"
            >
              {layout.burnerControls.downButton.symbol || '↓'}
              <div className="burner-btn-label">{layout.burnerControls.downButton.label || 'down'}</div>
            </button>

            <button
              className="burner-btn burner-btn-up"
              style={{
                left: `${layout.burnerControls.upButton.xPercent}%`,
                top: `${layout.burnerControls.upButton.yPercent}%`,
                width: `${layout.burnerControls.upButton.sizePercent}%`,
                height: `${layout.burnerControls.upButton.sizePercent}%`,
              }}
              onClick={handleHeatUp}
              aria-label="Burner up"
              aria-describedby="burner-controls-help"
              title="Increase burner wattage"
            >
              {layout.burnerControls.upButton.symbol || '↑'}
              <div className="burner-btn-label">{layout.burnerControls.upButton.label || 'up'}</div>
            </button>
          </>
        )}

        {/* 
          ========== BURNER KNOB (Heat Control) ==========
          Tiny dial control at the bottom of the stove
          Render only when the workshop provides burnerKnob layout
        */}
        {layout.burnerKnob && (
          <div 
            className="burner-knob"
            style={{
              left: `${layout.burnerKnob.xPercent}%`,
              top: `${layout.burnerKnob.yPercent}%`,
              width: `${layout.burnerKnob.sizePercent}%`,
              height: `${layout.burnerKnob.sizePercent}%`,
            }}
            onClick={handleBurnerKnob}
            title={`Burner: ${wattageSteps[burnerHeat] || 0} W`}
          >
            {/* Outer knob rim */}
            <div className="knob-rim"></div>
            {/* Inner knob center */}
            <div className="knob-center"></div>
            {/* Indicator line showing current position */}
            <div className="knob-pointer" style={{ transform: `rotate(${180 + burnerHeat * 90}deg)` }}></div>
          </div>
        )}

        {/* 
          ========== DRAGGABLE POT ==========
          The main interactive element
          User drags this to the sink to fill it, then moves it to the burner
        */}
        <div
          ref={potRef}
          className={`pot-draggable ${isDragging ? 'dragging' : ''} ${liquidMass > 0 ? 'filled' : 'empty'}`}
          style={{
            left: `${potPosition.x}%`,      // Current X position (updated while dragging)
            top: `${potPosition.y}%`,       // Current Y position (updated while dragging)
            width: `${layout.pot.sizePercent}%`,
            height: `${layout.pot.sizePercent}%`,
            touchAction: 'none'             // Disable default browser touch behaviors (scroll, zoom, etc.)
          }}
          onPointerDown={handlePointerDown}  // Start dragging when user clicks
          onPointerMove={handlePointerMove}  // Update position while dragging
          onPointerUp={handlePointerUp}      // Stop dragging when user releases
          onDragStart={(e) => e.preventDefault()}  // Prevent native browser image drag-and-drop
        >
          {/* 
            Show the appropriate pot image based on whether it has water
            - pot-empty.png: when liquidMass === 0
            - pot-full.png: when liquidMass > 0
          */}
          <img
            src={liquidMass > 0 ? potFullImage : potEmptyImage}
            alt={liquidMass > 0 ? 'Pot filled with liquid' : 'Empty pot'}
            className="pot-image"
            draggable={false}  // Disable browser's native drag for images
          />
          
          {/* Show steam animation when water is actively boiling at/above boiling point (workshop-tunable, optional) */}
          {steamConfig.enabled && isBoiling && temperature >= boilingPoint && (
            <div className="steam-effect" style={steamStyle}>
              {steamConfig.asset ? (
                <img
                  src={steamConfig.asset}
                  alt="Steam rising from the pot"
                  className="steam-sprite"
                  draggable={false}
                />
              ) : (
                steamConfig.symbol || '💨'
              )}
            </div>
          )}
        </div>

        {/* 
          ========== CONTROL PANEL ==========
          Extracted component handling all UI controls, status display, and location/altitude selection
        */}
        <ControlPanel
          // Game state
          liquidMass={liquidMass}
          temperature={temperature}
          isBoiling={isBoiling}
          residueMass={residueMass}
          fluidName={fluidName}
          boilingPoint={boilingPoint}
          canBoil={canBoil}
          isPotOverFlame={isPotOverFlame}
          expectedBoilTime={expectedBoilTime}
          formatTemperature={formatTemperature}
          ambientTemperature={ambientTemperature}
          
          // Extrapolation warning data
          isBoilingPointExtrapolated={isBoilingPointExtrapolated}
          boilingPointVerifiedRange={boilingPointVerifiedRange}
          
          // UI state
          timeSpeed={timeSpeed}
          isTimerRunning={isTimerRunning}
          timeElapsed={timeElapsed}
          activeExperiment={activeExperiment}
          activeFluid={activeFluid}
          availableFluids={availableFluids}
          isAdvancedModeAvailable={isAdvancedModeAvailable}
          altitude={altitude}
          locationName={locationName}
          showLocationPopup={showLocationPopup}
          isLocationPopupAllowed={isLocationPopupAllowed}
          locationError={locationError}
          isLoadingLocation={isLoadingLocation}
          userZipCode={userZipCode}
          manualAltitude={manualAltitude}
          editableAltitude={editableAltitude}
          showNextLevelButton={showNextLevelButton}
          
          // Config
          burnerHeat={burnerHeat}
          wattageSteps={wattageSteps}
          GAME_CONFIG={GAME_CONFIG}
          
          // Callbacks
          handleTimerToggle={handleTimerToggle}
          handleTimerReset={handleTimerReset}
          handleSpeedUp={handleSpeedUp}
          handleSpeedDouble={handleSpeedDouble}
          handleSpeedHalve={handleSpeedHalve}
          handleQuickPause={handleQuickPause}
          handleFluidChange={handleFluidChange}
          handleNextProgression={handleNextProgression}
          nextProgressionType={getNextProgression()?.type}
          handleSearchLocation={handleSearchLocation}
          handleSetManualAltitude={handleSetManualAltitude}
          handleFindMyLocation={handleFindMyLocation}
          onLocationChange={onLocationChange}
          setEditableAltitude={setEditableAltitude}
          setShowLocationPopup={setShowLocationPopup}
          setUserZipCode={setUserZipCode}
          setManualAltitude={setManualAltitude}
          setLocationError={setLocationError}
          setLocationName={setLocationName}
          setIsLoadingLocation={setIsLoadingLocation}
          setHasSetLocation={setHasSetLocation}
        />

        {/* 
          ========== ROOM CONTROLS ==========
          AC and air handler controls, room state display
          Only visible for experiments with unlocksRoomControls flag (L1E4+)
        */}
        <RoomControls
          enabled={roomControlsEnabled}
          summary={roomSummary}
          alerts={roomAlerts}
          acUnit={acUnitConfig}
          airHandler={airHandlerConfig}
          availableAcUnits={roomConfig?.availableAcUnits}
          availableAirHandlers={roomConfig?.availableAirHandlers}
          selectedAcUnitId={acUnitConfig?.id || roomConfig?.defaults?.acUnit}
          selectedAirHandlerId={airHandlerConfig?.id || roomConfig?.defaults?.airHandler}
          onAcEnabledChange={setAcEnabled}
          onAcSetpointChange={setAcSetpoint}
          onAirHandlerModeChange={setAirHandlerMode}
          onAcUnitChange={(id) => onEquipmentChange?.('ac-units', id)}
          onAirHandlerChange={(id) => onEquipmentChange?.('air-handlers', id)}
        />

        {/* 
          ========== EDUCATIONAL HOOK ==========
          Shows experiment-specific results when boiling is achieved
          Always pauses simulation while visible
        */}

        {/* Scorecard Popup - Centered modal with experiment-specific stats */}
        {showHook && boilStats && (
          <div className="boil-stats-overlay">
            <div className="boil-stats-modal">
              {/* EXPERIMENT 1: Tutorial - Basic Boiling */}
              {boilStats.experiment === 'boiling-water' && (
                <>
                  <h2>🎉 You Boiled Water!</h2>
                  <p className="modal-subtitle">Great job completing the tutorial!</p>

                  <div className="stats-grid">
                    <div className="stat-item">
                      <span className="stat-label">Boiling Point:</span>
                      <span className="stat-value">{formatTemperature(boilStats.boilingPoint)}°C</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Time to Boil:</span>
                      <span className="stat-value">{formatTime(boilStats.timeToBoil)}</span>
                    </div>
                  </div>

                  <div className="info-content">
                    <h3>🎓 What You Learned</h3>
                    <ul>
                      <li><strong>Heat Transfer:</strong> The burner transferred thermal energy to the water molecules</li>
                      <li><strong>Temperature Rise:</strong> As molecules gained energy, they moved faster, increasing temperature</li>
                      <li><strong>Boiling Point:</strong> At {formatTemperature(boilStats.boilingPointSeaLevel ?? 100)}°C (sea level), water molecules gain enough energy to escape as vapor</li>
                    </ul>
                    <p className="fun-fact">🏔️ <strong>Next Up:</strong> Try the Altitude experiment to see how location changes the boiling point!</p>
                  </div>
                </>
              )}

              {/* EXPERIMENT 2: Altitude Effect */}
              {boilStats.experiment === 'altitude-effect' && (
                <>
                  <h2>📍 Altitude Experiment Complete!</h2>
                  <p className="modal-subtitle">
                    You boiled water at {boilStats.locationName || `${boilStats.altitude.toLocaleString()}m altitude`}
                  </p>

                  <div className="stats-grid">
                    <div className="stat-item">
                      <span className="stat-label">Your Altitude:</span>
                      <span className="stat-value">{boilStats.altitude.toLocaleString()} m</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Boiling Point Here:</span>
                      <span className="stat-value">{formatTemperature(boilStats.boilingPoint)}°C</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Sea Level Boiling Point:</span>
                      <span className="stat-value">{formatTemperature(boilStats.boilingPointSeaLevel ?? 100)}°C</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Difference:</span>
                      <span className="stat-value">
                        {formatTemperature((boilStats.boilingPointSeaLevel ?? 100) - boilStats.boilingPoint)}°C lower
                      </span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Time to Boil:</span>
                      <span className="stat-value">{formatTime(boilStats.timeToBoil)}</span>
                    </div>
                  </div>

                  <div className="info-content">
                    <h3>🎓 Why Does Altitude Matter?</h3>
                    <ul>
                      <li><strong>Lower Pressure:</strong> At higher altitudes, there's less air pushing down on the water</li>
                      <li><strong>Easier Escape:</strong> Water molecules need less energy to escape as vapor</li>
                      <li><strong>Result:</strong> Water boils at a lower temperature ({formatTemperature(boilStats.boilingPoint)}°C vs {formatTemperature(boilStats.boilingPointSeaLevel ?? 100)}°C)</li>
                    </ul>
                    <p className="fun-fact">🏔️ <strong>Fun Fact:</strong> At the top of Mount Everest (8,849m), water boils at only ~68°C!</p>
                  </div>
                </>
              )}

              {/* EXPERIMENT 3: Different Fluids */}
              {boilStats.experiment === 'different-fluids' && (
                <>
                  <h2>🧪 {boilStats.fluidName} Boiled!</h2>
                  <p className="modal-subtitle">You successfully boiled {boilStats.fluidName.toLowerCase()}</p>

                  <div className="stats-grid">
                    <div className="stat-item">
                      <span className="stat-label">Substance:</span>
                      <span className="stat-value">{boilStats.fluidName}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Boiling Point:</span>
                      <span className="stat-value">{formatTemperature(boilStats.boilingPoint)}°C</span>
                    </div>
                    {boilStats.altitude > 0 && (
                      <div className="stat-item">
                        <span className="stat-label">Altitude:</span>
                        <span className="stat-value">{boilStats.altitude.toLocaleString()} m</span>
                      </div>
                    )}
                    <div className="stat-item">
                      <span className="stat-label">Sea Level Boiling Point:</span>
                      <span className="stat-value">{formatTemperature(boilStats.boilingPointSeaLevel)}°C</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Time to Boil:</span>
                      <span className="stat-value">{formatTime(boilStats.timeToBoil)}</span>
                    </div>
                  </div>

                  <div className="info-content">
                    <h3>🎓 Why Different Boiling Points?</h3>
                    <ul>
                      <li><strong>Molecular Bonds:</strong> Different substances have different intermolecular forces</li>
                      <li><strong>Stronger Bonds = Higher BP:</strong> Water (100°C) has strong hydrogen bonds</li>
                      <li><strong>Weaker Bonds = Lower BP:</strong> Acetone (56°C) and ethanol (78°C) have weaker bonds</li>
                    </ul>
                    <p className="fun-fact">💡 <strong>Try This:</strong> Compare how long it takes to boil different substances with the same heat setting!</p>
                  </div>
                </>
              )}

              {/* L1E4: Dangerous Liquids - Room Environment Scorecard */}
              {boilStats.experiment === 'dangerous-liquids' && (
                <>
                  <h2>⚠️ Hazardous Material Handled!</h2>
                  <p className="modal-subtitle">
                    You boiled {boilStats.fluidName} in a controlled environment
                  </p>

                  <div className="stats-grid">
                    <div className="stat-item">
                      <span className="stat-label">Substance:</span>
                      <span className="stat-value">{boilStats.fluidName}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Boiling Point:</span>
                      <span className="stat-value">{formatTemperature(boilStats.boilingPoint)}°C</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Time to Boil:</span>
                      <span className="stat-value">{formatTime(boilStats.timeToBoil)}</span>
                    </div>
                  </div>

                  {/* Room Environment Section */}
                  {boilStats.roomData && (
                    <>
                      <h3>🏠 Room Environment</h3>
                      <div className="stats-grid">
                        <div className="stat-item">
                          <span className="stat-label">Room Temp Change:</span>
                          <span className="stat-value">
                            {formatTemperature(boilStats.roomData.initialTemperature)}°C → {formatTemperature(boilStats.roomData.finalTemperature)}°C
                          </span>
                        </div>
                        {boilStats.roomData.energyTotals && (
                          <>
                            <div className="stat-item">
                              <span className="stat-label">AC Cooling Used:</span>
                              <span className="stat-value">
                                {(boilStats.roomData.energyTotals.acCoolingJoules / 1000).toFixed(1)} kJ
                              </span>
                            </div>
                            <div className="stat-item">
                              <span className="stat-label">Air Handler Energy:</span>
                              <span className="stat-value">
                                {(boilStats.roomData.energyTotals.airHandlerJoules / 1000).toFixed(1)} kJ
                              </span>
                            </div>
                          </>
                        )}
                      </div>

                      {/* Composition Changes */}
                      <h3>🌬️ Air Composition</h3>
                      <div className="composition-comparison">
                        <div className="comp-column">
                          <strong>Before:</strong>
                          <ul className="comp-list">
                            {Object.entries(boilStats.roomData.initialComposition || {}).slice(0, 5).map(([gas, fraction]) => (
                              <li key={gas}>{gas}: {(fraction * 100).toFixed(2)}%</li>
                            ))}
                          </ul>
                        </div>
                        <div className="comp-column">
                          <strong>After:</strong>
                          <ul className="comp-list">
                            {Object.entries(boilStats.roomData.finalComposition || {}).slice(0, 5).map(([gas, fraction]) => (
                              <li key={gas}>{gas}: {(fraction * 100).toFixed(2)}%</li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* Exposure Events / Consequences */}
                      {boilStats.roomData.exposureEvents?.length > 0 && (
                        <>
                          <h3>⚠️ Exposure Report</h3>
                          {boilStats.roomData.exposureEvents.map((event, idx) => (
                            <div key={idx} className={`exposure-event severity-${event.severity}`}>
                              <strong>{event.name}</strong>
                              <p>Peak: {event.peakPPM.toFixed(0)} ppm | Duration: {formatTime(event.durationSec)}</p>
                              <p className="consequence">{event.consequence}</p>
                              {event.isProtected && (
                                <p className="protected-note">✓ Air handler provided protection</p>
                              )}
                            </div>
                          ))}
                        </>
                      )}

                      {/* Safety Tips */}
                      <div className="info-content">
                        <h3>🎓 Lab Safety</h3>
                        <ul>
                          <li><strong>Ventilation:</strong> Always use proper ventilation with hazardous materials</li>
                          <li><strong>Filters Matter:</strong> Standard filters don't stop toxic gases - use activated carbon</li>
                          <li><strong>Monitor Air:</strong> Watch for composition changes - rising vapor displaces oxygen</li>
                        </ul>
                      </div>
                    </>
                  )}
                </>
              )}

              {/* FALLBACK: Unknown experiment - show generic stats */}
              {!['boiling-water', 'altitude-effect', 'different-fluids', 'dangerous-liquids'].includes(boilStats.experiment) && (
                <>
                  <h2>📋 Experiment Complete!</h2>
                  <p className="modal-subtitle">You boiled {boilStats.fluidName.toLowerCase()}!</p>

                  <div className="stats-grid">
                    <div className="stat-item">
                      <span className="stat-label">Substance:</span>
                      <span className="stat-value">{boilStats.fluidName}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Boiling Point:</span>
                      <span className="stat-value">{formatTemperature(boilStats.boilingPoint)}°C</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Time to Boil:</span>
                      <span className="stat-value">{formatTime(boilStats.timeToBoil)}</span>
                    </div>
                  </div>
                </>
              )}

              <button
                className="action-button continue-button"
                onClick={() => {
                  setShowHook(false)
                  setPauseTime(false)
                }}
              >
                Close Scorecard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default GameScene


