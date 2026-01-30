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
  calculateBoilingPoint,  // Calculates fluid's boiling point based on altitude
  simulateTimeStep,       // Runs one time step of physics (heating/cooling/boiling)
  formatTemperature       // Formats temperature numbers for display (e.g., 98.5°C)
} from '../utils/physics'
import { loadSubstance, parseSubstanceProperties, DEFAULT_SUBSTANCE, getAvailableSubstances } from '../utils/substanceLoader'
import { GAME_CONFIG } from '../constants/physics'
import ControlPanel from './ControlPanel'
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

function GameScene({ stage, location, onStageChange, workshopLayout, workshopImages, workshopEffects, activeLevel, activeExperiment, showSelectors, onWaterBoiled, onSkipTutorial, onLevelChange, onExperimentChange, hasBoiledBefore = false, onLocationChange }) {
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

  // Should we display the educational message about boiling points?
  // (This appears when water starts boiling)
  const [showHook, setShowHook] = useState(false)

  // Time from when pot was placed over flame to boiling (for stats)
  const [boilTime, setBoilTime] = useState(0)
  
  // Time at which pot was first placed over flame (to track boil duration)
  const [timePotOnFlame, setTimePotOnFlame] = useState(null)

  // Burner heat setting (0-3) when boiling was achieved (for ideal time calculation)
  const [burnerHeatWhenBoiled, setBurnerHeatWhenBoiled] = useState(0)

  // Should we pause time flow while popup is visible?
  const [pauseTime, setPauseTime] = useState(false)

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

  // Resolve heat steps (supports both knob 4-step and button 9-step layouts)
  const wattageSteps = useMemo(() => {
    const customSteps = workshopLayout?.burnerControls?.wattageSteps
    if (customSteps && Array.isArray(customSteps) && customSteps.length > 0) return customSteps
    return [0, 400, 1700, 2500]
  }, [workshopLayout])
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
  const [hasSetLocation, setHasSetLocation] = useState(false)

  // Is location lookup currently in progress?
  const [isLoadingLocation, setIsLoadingLocation] = useState(false)

  // Location lookup error message
  const [locationError, setLocationError] = useState(null)

  // User's entered location display name (e.g., "Denver, USA")
  const [locationName, setLocationName] = useState(null)
  const [showLocationPopup, setShowLocationPopup] = useState(false)

  // ============================================================================
  // DERIVED STATE: Post-Tutorial Status
  // ============================================================================

  // Advanced mode is available after completing tutorial OR skipping it
  // showSelectors indicates tutorial has been passed/skipped (selectors only appear then)
  const isAdvancedModeAvailable = showSelectors && (hasBoiledBefore || activeLevel !== 0)
  
  // Check if current experiment requires location setup
  const isLocationBasedExperiment = activeExperiment === 'altitude-effect'
  const isLocationPopupAllowed = isLocationBasedExperiment || activeExperiment === 'different-fluids'
  // Altitude controls should be available once selectors are unlocked or when the experiment requires it
  const showAltitudeControls = showSelectors || isLocationBasedExperiment
  
  // Trigger location popup when entering Exp 2+ (altitude-effect)
  useEffect(() => {
    if (isLocationBasedExperiment && !hasSetLocation && !showLocationPopup) {
      setShowLocationPopup(true)
    }
  }, [activeExperiment, isLocationBasedExperiment, hasSetLocation, showLocationPopup])

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
  // REFERENCES: Direct access to DOM elements (not state, just object references)
  // ============================================================================

  // Stores reference to the pot div element (used to get its position during dragging)
  const potRef = useRef(null)

  // Stores reference to the game scene div (used to calculate coordinates relative to it)
  const sceneRef = useRef(null)

  // Stores reference to the heating simulation interval so we can stop it later
  const simulationRef = useRef(null)

  // ============================================================================
  // LOCATION & ALTITUDE: Affects boiling point
  // ============================================================================

  // Get the user's altitude in meters (defaults to 0 if location data not available)
  // Higher altitude = lower atmospheric pressure = lower boiling point
  const altitude = (activeExperiment === 'different-fluids' && editableAltitude !== null)
    ? editableAltitude
    : (location?.altitude || 0)

  // Pre-calculate what temperature fluid will boil at for this altitude
  // Note: This is recalculated only when altitude or fluidProps changes
  const boilingPoint = fluidProps ? calculateBoilingPoint(altitude, fluidProps) : null
  const canBoil = Boolean(fluidProps?.canBoil) && Number.isFinite(boilingPoint)
  const boilingPointSeaLevel = Number.isFinite(fluidProps?.boilingPointSeaLevel)
    ? fluidProps.boilingPointSeaLevel
    : null

  const fluidName = fluidProps?.name || 'Fluid'
  const liquidMass = Math.max(0, waterInPot - residueMass)

  // ============================================================================
  // ============================================================================
  // EFFECT 1: Load substance properties (runs once on component load)
  // ============================================================================

  // Load available fluids for dropdown (Level 3+)
  useEffect(() => {
    async function loadFluids() {
      const fluids = await getAvailableSubstances()
      setAvailableFluids(fluids)
    }
    loadFluids()
  }, [])

  // Load the current substance's properties from JSON
  useEffect(() => {
    async function initializeFluid() {
      try {
        const substanceData = await loadSubstance(activeFluid)
        const props = parseSubstanceProperties(substanceData)
        setFluidProps(props)
        setFluidLoadError(null)
        setResidueMass(0)
        // Debug log: useful for verifying fluid properties loaded correctly
        console.log(`✓ Loaded fluid: ${props.name} (${props.formula})`)
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
        if (timePotOnFlame === null) {
          setTimePotOnFlame(0)
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
        fluidProps                        // Fluid properties (specific heat, cooling, etc.)
      )

      // Update all the values returned from the physics simulation
      setTemperature(newState.temperature)      // Water is now hotter or cooler
      setWaterInPot(newState.waterMass)        // Water mass decreases if boiling (evaporation)
      
      // Track elapsed time only if timer is running
      if (isTimerRunning) {
        setTimeElapsed(prev => prev + deltaTime)  // Track elapsed time (accounts for speed)
      }

      // Check if water just started boiling
      // We only show "boiling" if it wasn't boiling before but is now boiling
      if (newState.isBoiling && !isBoiling) {
        setIsBoiling(true)   // Mark as boiling
        setShowHook(true)    // Show the educational message
        setPauseTime(true)   // Pause time while popup is visible
        // Calculate time it took to boil (from when pot was placed over flame)
        if (timePotOnFlame !== null) {
          const elapsedBoilTime = timePotOnFlame + deltaTime
          setBoilTime(elapsedBoilTime)
        }
        // Capture the burner heat setting when boiling is achieved
        setBurnerHeatWhenBoiled(burnerHeat)
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
  }, [waterInPot, liquidMass, residueMass, temperature, altitude, boilingPoint, canBoil, isBoiling, timeSpeed, potPosition, burnerHeat, fluidProps, workshopLayout, isTimerRunning])  // Re-run if any of these change

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
    setTemperature(GAME_CONFIG.ROOM_TEMPERATURE)
    setIsBoiling(false)
    setShowHook(false)
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
      // Reset temperature to room temp when filling with fresh water
      setTemperature(GAME_CONFIG.ROOM_TEMPERATURE)
      // Reset boiling state
      setIsBoiling(false)
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
  * Cycle through time speed options: 1x → 2x → 4x → 8x → 1x (Basic Mode)
   */
  const handleSpeedUp = () => {
    setTimeSpeed(current => {
      if (current === 1) return 2
      if (current === 2) return 4
      if (current === 4) return 8
      return 1  // Wrap back to 1x
    })
  }

  /**
   * Double the time speed (Advanced Mode)
   */
  const handleSpeedDouble = () => {
    setTimeSpeed(current => current * 2)
  }

  /**
   * Halve the time speed (Advanced Mode)
   */
  const handleSpeedHalve = () => {
    setTimeSpeed(current => Math.max(0.125, current / 2))  // Min 1/8x speed
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
      setLocationError(error.message || 'Location not found. Try a city name like "Denver" or "Tokyo"')
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
    
    if (isNaN(altitudeNum) || altitudeNum < 0) {
      setLocationError('Please enter a valid altitude in meters')
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
  // SPECIAL CASE: If substance boils at or below ambient temperature (20°C),
  // show upward steam instead of downward water stream
  const AMBIENT_TEMP = 20  // Room temperature (°C)
  const boilsAtAmbient = fluidProps && Number.isFinite(boilingPoint) && boilingPoint <= AMBIENT_TEMP
  
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
    
    // Energy to heat fluid from room temp (20°C) to boiling point
    const roomTemp = GAME_CONFIG.ROOM_TEMPERATURE
    const waterMass = GAME_CONFIG.DEFAULT_WATER_MASS * 1000  // grams
    if (!Number.isFinite(fluidProps.specificHeat)) return null
    const specificHeat = fluidProps.specificHeat  // J/(g·°C)
    const tempDifference = boilPointTarget - roomTemp
    
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

  // Stage 1: Educational info screen after first boil
  if (stage === 1) {
    return (
      <div className="info-screen">
        <div className="info-content">
          <h2>🎓 How Boiling Works</h2>
          <p>You just boiled {fluidName.toLowerCase()}! Here's what happened:</p>
          <ul>
            <li><strong>Heat Transfer:</strong> The burner transferred thermal energy to the fluid molecules</li>
            <li><strong>Temperature Rise:</strong> As molecules gained energy, they moved faster, increasing temperature</li>
            <li><strong>Phase Change:</strong> At {boilingPointSeaLevel !== null ? `${formatTemperature(boilingPointSeaLevel)}°C` : 'its boiling point'} (sea level), molecules gained enough energy to escape as vapor</li>
            <li><strong>Boiling Point:</strong> This temperature depends on atmospheric pressure—it changes with altitude!</li>
          </ul>
          <p className="fun-fact">🏔️ <strong>Fun Fact:</strong> At the top of Mount Everest, water boils at only 68°C (154°F) because of the lower air pressure!</p>
          <button className="action-button next-stage-button" onClick={handleNextStage}>
            Continue Exploring →
          </button>
        </div>
      </div>
    )
  }

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
              alt="Flame"
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
            alt={liquidMass > 0 ? 'Full Pot' : 'Empty Pot'}
            className="pot-image"
            draggable={false}  // Disable browser's native drag for images
          />
          
          {/* Show steam animation when water is actively boiling at/above boiling point (workshop-tunable, optional) */}
          {steamConfig.enabled && isBoiling && temperature >= boilingPoint && (
            <div className="steam-effect" style={steamStyle}>
              {steamConfig.asset ? (
                <img
                  src={steamConfig.asset}
                  alt="Steam effect"
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
          handleFluidChange={handleFluidChange}
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
          ========== EDUCATIONAL HOOK ==========
          Shows a message about boiling points at different altitudes
          Appears when water starts boiling
        */}

        {/* 
          If at altitude (not at sea level) and water is boiling:
          Show message that water boiled at a different temperature than 100°C
        */}

        {/* Tutorial Completion Popup - Centered modal with stats */}
        {showHook && activeExperiment === 'boiling-water' && (
          <div className="boil-stats-overlay">
            <div className="boil-stats-modal">
              <h2>🎉 Congratulations!</h2>
              <p className="modal-subtitle">You've successfully boiled {fluidName.toLowerCase()}!</p>
              
              <div className="stats-grid">
                <div className="stat-item">
                  <span className="stat-label">Final Temperature:</span>
                  <span className="stat-value">{formatTemperature(temperature)}°C</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Boiling Point:</span>
                  <span className="stat-value">{formatTemperature(boilingPoint)}°C</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Actual Time:</span>
                  <span className="stat-value">{formatTime(boilTime)}</span>
                </div>
                {burnerHeatWhenBoiled > 0 && (
                  <div className="stat-item">
                    <span className="stat-label">Ideal Time (Max Heat):</span>
                    <span className="stat-value">{formatTime(calculateIdealBoilTime(3, boilingPoint))}</span>
                  </div>
                )}
              </div>

              <p className="modal-insight">
                ⏱️ That wasn't too bad (thank goodness for time acceleration!). Let's see if it's any different at your location?
              </p>

              <button 
                className="action-button continue-button"
                onClick={() => {
                  setShowHook(false)
                  setPauseTime(false)
                  onExperimentChange?.('altitude-effect')
                }}
              >
                Continue to Altitude Experiment →
              </button>
            </div>
          </div>
        )}

        {/* Educational message for altitude-based experiments */}
        {showHook && isLocationBasedExperiment && altitude !== 0 && (
          <div className="hook-message">
            <p>
              💧 Your {fluidName.toLowerCase()} boiled at {formatTemperature(boilingPoint)}°C
              {boilingPointSeaLevel !== null ? ` (not ${formatTemperature(boilingPointSeaLevel)}°C!)` : '!'}
            </p>
            <button 
              className="action-button learn-more"
              onClick={handleLearnMore}
            >
              🤔 Curious why? Learn more
            </button>
          </div>
        )}

        {/* 
          If at sea level (altitude = 0) and water is boiling (levels 2+):
          Confirm that water boiled at 100°C as expected
        */}
        {showHook && activeLevel !== 'level-1' && altitude === 0 && (
          <div className="hook-message">
            <p>💧 Your {fluidName.toLowerCase()} boiled at exactly {formatTemperature(boilingPoint)}°C!</p>
            <button 
              className="action-button learn-more"
              onClick={handleLearnMore}
            >
              📚 Learn more
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default GameScene


