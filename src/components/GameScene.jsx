// NOTE: Read the header comments before editing. Reassess splitting into subcomponents when adding new items or behaviors.
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

import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { 
  calculateBoilingPoint,           // Calculates fluid's boiling point based on altitude
  calculateBoilingPointAtPressure, // Calculates fluid's boiling point based on pressure (for room feedback)
  formatTemperature                // Formats temperature numbers for display (e.g., 98.5°C)
} from '../utils/physics'
import { loadSubstance, loadSubstanceInfo, parseSubstanceProperties, DEFAULT_SUBSTANCE, getAvailableSubstances } from '../utils/substanceLoader'
import { GAME_CONFIG } from '../constants/physics'
import { LEVELS, EXPERIMENTS } from '../constants/workshops'
import GameSceneView from './GameSceneView'
import { useRoomEnvironment } from '../hooks/useRoomEnvironment'
import { usePotDragging } from '../hooks/usePotDragging'
import { useTimeControls } from '../hooks/useTimeControls'
import { useGamePhysics } from '../hooks/useGamePhysics'
import { useBoilingDetection } from '../hooks/useBoilingDetection'
import { useLocationControls } from '../hooks/useLocationControls'
import { useRoomSimulation } from '../hooks/useRoomSimulation'
import { useSimulationResultApplier } from '../hooks/useSimulationResultApplier'
import { calculateExpectedBoilTime } from '../utils/boilTimeUtils'
import { useGameStore } from '../hooks/stores/gameStore'
import { useWorkshopStore } from '../hooks/stores/workshopStore'
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

function GameScene({ workshopLayout, workshopImages, workshopEffects, burnerConfig, roomConfig, acUnitConfig, airHandlerConfig, onLevelChange, onExperimentChange, onEquipmentChange }) {
  const stage = useGameStore((state) => state.gameStage)
  const location = useGameStore((state) => state.userLocation)
  const showSelectors = useGameStore((state) => state.showSelectors)
  const hasBoiledBefore = useGameStore((state) => state.hasBoiledBefore)
  const setGameStage = useGameStore((state) => state.setGameStage)
  const setUserLocation = useGameStore((state) => state.setUserLocation)
  const setShowSelectors = useGameStore((state) => state.setShowSelectors)
  const setHasBoiledBefore = useGameStore((state) => state.setHasBoiledBefore)

  const activeLevel = useWorkshopStore((state) => state.activeLevel)
  const activeExperiment = useWorkshopStore((state) => state.activeExperiment)
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

  const {
    timeSpeed,
    isTimerRunning,
    timeElapsed,
    setTimeElapsed,
    handleSpeedUp,
    handleSpeedDouble,
    handleSpeedHalve,
    handleQuickPause,
    handleTimerToggle,
    handleTimerReset
  } = useTimeControls()


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

  // The dimensions of the game window (workshop-provided, default 1280x800)
  const [sceneDimensions, setSceneDimensions] = useState({ width: 0, height: 0 })

  // ============================================================================
  // LOCATION & ALTITUDE INPUT: For Level 2+ altitude effects experiment
  // ============================================================================

  const {
    userZipCode,
    manualAltitude,
    editableAltitude,
    hasSetLocation,
    isLoadingLocation,
    locationError,
    locationName,
    showLocationPopup,
    setUserZipCode,
    setManualAltitude,
    setLocationError,
    setShowLocationPopup,
    handleSearchLocation,
    handleSetManualAltitude,
    handleFindMyLocation
  } = useLocationControls({ location, setUserLocation })

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

  const handlePotFill = useCallback(() => {
    const fillMass = GAME_CONFIG.DEFAULT_WATER_MASS
    const nonVolatileFraction = fluidProps?.nonVolatileMassFraction ?? 0
    setWaterInPot(fillMass)
    setResidueMass(fillMass * nonVolatileFraction)
    setTemperature(ambientTemperature)
    setIsBoiling(false)
    setHasShownBoilPopup(false)
    setBurnerHeatWhenBoiled(0)
  }, [ambientTemperature, fluidProps?.nonVolatileMassFraction, setBurnerHeatWhenBoiled, setHasShownBoilPopup, setIsBoiling, setResidueMass, setTemperature, setWaterInPot])

  const {
    potPosition,
    isDragging,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp
  } = usePotDragging({
    layout,
    potRef,
    sceneRef,
    sceneDimensions,
    liquidMass,
    onFill: handlePotFill
  })

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

  const { handleBoilingState } = useBoilingDetection({
    activeExperiment,
    activeFluid,
    activeLevel,
    altitude,
    boilingPoint,
    burnerHeat,
    canBoil,
    fluidProps,
    getNextProgression,
    hasBoiledBefore,
    hasShownBoilPopup,
    isBoiling,
    locationName,
    roomAlerts,
    roomControlsEnabled,
    roomState,
    setBoilStats,
    setBoilTime,
    setBurnerHeatWhenBoiled,
    setHasBoiledBefore,
    setHasShownBoilPopup,
    setIsBoiling,
    setPauseTime,
    setShowHook,
    setShowNextLevelButton,
    setShowSelectors,
    timePotOnFlame
  })

  // ============================================================================
  // EFFECT 3: Physics simulation loop (runs continuously when water is in pot)
  // ============================================================================

  const applySimulationResult = useSimulationResultApplier({
    activeFluid,
    fluidProps,
    roomControlsEnabled,
    roomConfig,
    roomState,
    updateRoom,
    addVapor,
    isTimerRunning,
    setTimeElapsed,
    setTemperature,
    setWaterInPot,
    handleBoilingState
  })

  useGamePhysics({
    altitude,
    ambientTemperature,
    burnerHeat,
    fluidProps,
    layout,
    liquidMass,
    pauseTime,
    potPosition,
    residueMass,
    temperature,
    timeSpeed,
    timeStepMs: GAME_CONFIG.TIME_STEP,
    waterInPot,
    wattageSteps,
    onApplySimulationResult: applySimulationResult,
    timePotOnFlame,
    setTimePotOnFlame
  })

  useRoomSimulation({
    enabled: roomControlsEnabled,
    roomConfig,
    timeSpeed,
    pauseTime,
    updateRoom,
    timeStepMs: GAME_CONFIG.TIME_STEP
  })

  // ============================================================================
  // FLUID SELECTION
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
    // Transition from Stage 0 (gameplay) to Stage 1 (educational content)
    setGameStage(1)
  }

  function getNextExperimentInLevel() {
    // Get all experiments for current level, sorted by order
    const levelExperiments = EXPERIMENTS[activeLevel]?.slice().sort((a, b) => (a.order || 0) - (b.order || 0)) || []
    const currentIndex = levelExperiments.findIndex((exp) => exp.id === activeExperiment)
    const nextExp = currentIndex >= 0 ? levelExperiments[currentIndex + 1] : null
    return nextExp?.id ?? null
  }

  function getNextLevelId() {
    const sortedLevels = LEVELS.slice().sort((a, b) => (a.order || 0) - (b.order || 0))
    const currentIndex = sortedLevels.findIndex((level) => level.id === activeLevel)
    const nextLevel = currentIndex >= 0 ? sortedLevels[currentIndex + 1] : null
    return nextLevel?.id ?? null
  }

  function getNextProgression() {
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
    setGameStage(stage + 1)
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
  const expectedBoilTime = calculateExpectedBoilTime({
    fluidProps,
    canBoil,
    liquidMass,
    temperature,
    boilingPoint,
    burnerHeat,
    wattageSteps
  })

  // Format time in mm:ss
  const formatTime = (seconds) => {
    if (seconds === null || seconds === undefined) return '--:--'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
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

  const controlPanelContextValue = {
    // Game state
    liquidMass,
    temperature,
    isBoiling,
    residueMass,
    fluidName,
    boilingPoint,
    canBoil,
    isPotOverFlame,
    expectedBoilTime,
    formatTemperature,
    ambientTemperature,

    // Extrapolation warning data
    isBoilingPointExtrapolated,
    boilingPointVerifiedRange,

    // UI state
    timeSpeed,
    isTimerRunning,
    timeElapsed,
    activeFluid,
    availableFluids,
    isAdvancedModeAvailable,
    altitude,
    locationName,
    showLocationPopup,
    isLocationPopupAllowed,
    locationError,
    isLoadingLocation,
    userZipCode,
    manualAltitude,
    showNextLevelButton,

    // Config
    burnerHeat,
    GAME_CONFIG,

    // Callbacks
    handleTimerToggle,
    handleTimerReset,
    handleSpeedUp,
    handleSpeedDouble,
    handleSpeedHalve,
    handleQuickPause,
    handleFluidChange,
    handleNextProgression,
    nextProgressionType: getNextProgression()?.type,
    handleSearchLocation,
    handleSetManualAltitude,
    handleFindMyLocation,
    setShowLocationPopup,
    setUserZipCode,
    setManualAltitude,
    setLocationError
  }

  const handleCloseScorecard = () => {
    setShowHook(false)
    setPauseTime(false)
  }

  // Stage 0: Interactive game scene
  return (
    <GameSceneView
      hasRequiredImages={hasRequiredImages}
      fluidLoadError={fluidLoadError}
      backgroundImage={backgroundImage}
      layout={layout}
      sceneRef={sceneRef}
      showWaterStream={showWaterStream}
      showAmbientSteam={showAmbientSteam}
      fluidProps={fluidProps}
      flameImage={flameImage}
      burnerHeat={burnerHeat}
      flameFilter={flameFilter}
      flameAnimationDuration={flameAnimationDuration}
      flameGlowEnabled={effects.flameGlow.enabled}
      burnerControlsLayout={layout.burnerControls}
      burnerKnobLayout={layout.burnerKnob}
      wattageSteps={wattageSteps}
      onHeatDown={handleHeatDown}
      onHeatUp={handleHeatUp}
      onBurnerKnob={handleBurnerKnob}
      potRef={potRef}
      isDragging={isDragging}
      liquidMass={liquidMass}
      potPosition={potPosition}
      potFullImage={potFullImage}
      potEmptyImage={potEmptyImage}
      steamConfig={steamConfig}
      steamStyle={steamStyle}
      isBoiling={isBoiling}
      temperature={temperature}
      boilingPoint={boilingPoint}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      controlPanelContextValue={controlPanelContextValue}
      roomControlsEnabled={roomControlsEnabled}
      roomSummary={roomSummary}
      roomAlerts={roomAlerts}
      acUnitConfig={acUnitConfig}
      airHandlerConfig={airHandlerConfig}
      availableAcUnits={roomConfig?.availableAcUnits}
      availableAirHandlers={roomConfig?.availableAirHandlers}
      selectedAcUnitId={acUnitConfig?.id || roomConfig?.defaults?.acUnit}
      selectedAirHandlerId={airHandlerConfig?.id || roomConfig?.defaults?.airHandler}
      onAcEnabledChange={setAcEnabled}
      onAcSetpointChange={setAcSetpoint}
      onAirHandlerModeChange={setAirHandlerMode}
      onAcUnitChange={(id) => onEquipmentChange?.('ac-units', id)}
      onAirHandlerChange={(id) => onEquipmentChange?.('air-handlers', id)}
      showHook={showHook}
      boilStats={boilStats}
      formatTemperature={formatTemperature}
      formatTime={formatTime}
      onCloseScorecard={handleCloseScorecard}
    />
  )
}

export default GameScene


