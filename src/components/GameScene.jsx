/**
 * GameScene Component
 * 
 * This is the main interactive game environment for the Boiling Water educational app.
 * It displays a theme-defined game window (default 1280x800) with a draggable pot, burner with flame,
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

import { useState, useRef, useEffect } from 'react'
import { 
  calculateBoilingPoint,  // Calculates fluid's boiling point based on altitude
  simulateTimeStep,       // Runs one time step of physics (heating/cooling/boiling)
  formatTemperature       // Formats temperature numbers for display (e.g., 98.5°C)
} from '../utils/physics'
import { loadFluid, parseFluidProperties, DEFAULT_FLUID } from '../utils/fluidLoader'
import { GAME_CONFIG } from '../constants/physics'
import '../styles/GameScene.css'

// Default layout values (used if theme layout not provided)
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

function GameScene({ stage, location, onStageChange, themeLayout, themeImages, themeEffects, activeLevel, activeExperiment, showSelectors, onWaterBoiled, onSkipTutorial, onLevelChange, onExperimentChange, hasBoiledBefore = false, onLocationChange }) {
  const layout = themeLayout || DEFAULT_LAYOUT
  const backgroundImage = themeImages?.background || '/assets/images/game/background.png'
  const potEmptyImage = themeImages?.pot_empty || '/assets/images/game/pot-empty.png'
  const potFullImage = themeImages?.pot_full || '/assets/images/game/pot-full.png'
  const flameImage = themeImages?.flame || '/assets/images/game/flame.png'
  // Theme-driven optional visual effects (steam, flame glow)
  // Default: effects DISABLED unless theme provides effects.json
  // This ensures simple themes have no VFX overhead; only showcase themes (like alpha) enable them
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
      color: null, // falls back to --theme-flame-glow
      blurPx: 16,
      flickerMs: null,
      intensityByHeat: [0, 1, 1.08, 1.16]
    },
    waterStream: {
      enabled: false
    }
  }

  const effects = {
    steam: { ...defaultEffects.steam, ...(themeEffects?.steam || {}) },
    flameGlow: { ...defaultEffects.flameGlow, ...(themeEffects?.flameGlow || {}) },
    waterStream: { ...defaultEffects.waterStream, ...(themeEffects?.waterStream || {}) }
  }
  // ============================================================================
  // STATE VARIABLES: These change during gameplay
  // ============================================================================

  // How much water is currently in the pot, in kilograms (0 = empty, typically 1.0kg = full)
  const [waterInPot, setWaterInPot] = useState(0)

  // Current temperature of the water in Celsius (starts at room temperature)
  const [temperature, setTemperature] = useState(GAME_CONFIG.ROOM_TEMPERATURE)

  // Fluid properties (loaded from JSON, defaults to water)
  // Contains specific heat, heat of vaporization, cooling coefficient, etc.
  const [fluidProps, setFluidProps] = useState(null)

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
  const [potPosition, setPotPosition] = useState({ x: layout.pot.start.xPercent, y: layout.pot.start.yPercent })

  // Is the user currently dragging the pot? (true = dragging, false = not dragging)
  const [isDragging, setIsDragging] = useState(false)

  // When dragging starts, we store the offset between the mouse and pot center
  // This prevents the pot from "jumping" to the cursor position
  // Example: if user clicks 50 pixels left of pot center, dragOffset.x = -50
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })

  // The dimensions of the game window (theme-provided, default 1280x800)
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
    setPotPosition({ x: layout.pot.start.xPercent, y: layout.pot.start.yPercent })
  }, [themeLayout])

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
  const altitude = location?.altitude || 0

  // Pre-calculate what temperature fluid will boil at for this altitude
  // At sea level (0m): 100°C for water
  // At Denver (1609m): ~95°C for water
  // At Mount Everest base camp (5364m): ~68°C for water
  // Note: This is recalculated only when altitude or fluidProps changes
  const boilingPoint = fluidProps ? calculateBoilingPoint(altitude, fluidProps) : 100

  // ============================================================================
  // ============================================================================
  // EFFECT 1: Load fluid properties (runs once on component load)
  // ============================================================================

  useEffect(() => {
    // Load the current fluid's properties from JSON
    // For now, we always load water, but this makes it easy to add fluid selection later
    async function initializeFluid() {
      try {
        const fluidData = await loadFluid(DEFAULT_FLUID)  // 'water'
        const props = parseFluidProperties(fluidData)
        setFluidProps(props)
        // Debug log: useful for verifying fluid properties loaded correctly
        console.log(`✓ Loaded fluid: ${props.name} (${props.formula})`)
      } catch (error) {
        console.error('Failed to load fluid properties:', error)
        // Set a fallback with basic water properties
        setFluidProps({
          id: 'water',
          name: 'Water',
          formula: 'H₂O',
          specificHeat: 4.186,
          heatOfVaporization: 2257,
          boilingPointSeaLevel: 100,
          altitudeLapseRate: 0.00333,
          coolingCoefficient: 0.0015
        })
      }
    }
    initializeFluid()
  }, [themeLayout])

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
    if (waterInPot <= 0 || !fluidProps) return  // Wait for fluid props to load

    // Define the heat activation area around the flame (theme-driven)
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
        // Map burner heat setting to watts: off=0, low=400W, med=1700W, high=2500W
        const heatLevels = [0, 400, 1700, 2500]
        heatInputWatts = heatLevels[burnerHeat]
        
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
          altitude: altitude             // Current altitude (meters)
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
      if (newState.temperature < boilingPoint && isBoiling) {
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
  }, [waterInPot, temperature, altitude, boilingPoint, isBoiling, timeSpeed, potPosition, burnerHeat, fluidProps, themeLayout, isTimerRunning])  // Re-run if any of these change

  // ============================================================================
  // POT DRAGGING HANDLERS: Three functions handle the drag lifecycle
  // ============================================================================

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
    if (inWaterStream && waterInPot < 0.1) {  // Refill if nearly empty (< 0.1kg)
      // Auto-fill with the default water amount (1.0 kg)
      setWaterInPot(GAME_CONFIG.DEFAULT_WATER_MASS)
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
    setBurnerHeat(current => {
      if (current === 0) return 1
      if (current === 1) return 2
      if (current === 2) return 3
      return 0  // Wrap back to off
    })
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

  // Flame position (theme-driven)
  const flameX = layout.flame.xPercent
  const flameY = layout.flame.yPercent

  // Calculate water stream position (from original 1024x1024: starts at 295,451 ends at 285,724)
  const waterStreamStartX = layout.waterStream.start.xPercent
  const waterStreamStartY = layout.waterStream.start.yPercent
  const waterStreamEndX = layout.waterStream.end.xPercent
  const waterStreamEndY = layout.waterStream.end.yPercent
  const waterStreamHeight = waterStreamEndY - waterStreamStartY

  // Theme-driven optional glow/steam tuning
  const flameGlowConfig = effects.flameGlow
  const flameGlowIntensity = flameGlowConfig.intensityByHeat?.[burnerHeat] ?? 1
  const flameGlowBlur = (flameGlowConfig.blurPx ?? 16) * flameGlowIntensity
  const flameGlowColor = flameGlowConfig.color || 'var(--theme-flame-glow, #ff3300)'
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
  // Only show if theme has explicitly enabled waterStream effect
  const showWaterStream = effects.waterStream.enabled &&
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
    if (!fluidProps || waterInPot === 0 || temperature >= boilingPoint) return null
    const heatPowers = [0, 400, 1700, 2500]  // Watts per burner setting
    const powerWatts = heatPowers[burnerHeat] || 0
    if (powerWatts === 0) return null
    
    const specificHeat = fluidProps.specificHeat * 1000  // Convert kJ to J
    const tempDelta = boilingPoint - temperature
    const energyNeeded = waterInPot * specificHeat * tempDelta  // Joules
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
    const heatLevels = [0, 400, 1700, 2500]  // watts
    const watts = heatLevels[heatLevel] || heatLevels[2]  // default to medium if invalid
    
    if (watts === 0) return null  // Can't boil without heat
    
    // Energy to heat water from room temp (20°C) to boiling point
    const roomTemp = GAME_CONFIG.ROOM_TEMPERATURE
    const waterMass = GAME_CONFIG.DEFAULT_WATER_MASS * 1000  // grams
    const specificHeat = fluidProps?.specificHeat || 4.186  // J/(g·°C)
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
          <p>You just boiled water! Here's what happened:</p>
          <ul>
            <li><strong>Heat Transfer:</strong> The burner transferred thermal energy to the water molecules</li>
            <li><strong>Temperature Rise:</strong> As molecules gained energy, they moved faster, increasing temperature</li>
            <li><strong>Phase Change:</strong> At 100°C (sea level), molecules gained enough energy to escape as vapor</li>
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
          ========== FLAME (Burner visualization) ==========
          Located at center-right where the burner is
          Shows a flame image when heat is on
        */}
        <div 
          className="stove-burner"
          style={{
            left: `${flameX}%`,
            top: `${flameY}%`,
            width: burnerHeat === 0 ? '0%' : `${layout.flame.sizePercentByHeat[burnerHeat]}%`,
            height: burnerHeat === 0 ? '0%' : `${layout.flame.sizePercentByHeat[burnerHeat]}%`,
            minWidth: burnerHeat === 0 ? '0px' : `${layout.flame.minSizePxByHeat[burnerHeat]}px`,
            minHeight: burnerHeat === 0 ? '0px' : `${layout.flame.minSizePxByHeat[burnerHeat]}px`
          }}
        >
          {/* Show flame image when burner is on; glow/animation effects applied only if theme enables them */}
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

        {/* 
          ========== BURNER KNOB (Heat Control) ==========
          Tiny dial control at the bottom of the stove
          Click to cycle through: off → low → med → high → off
          Top-left positioned at (681, 695) in the original 1024x1024 image
          Centered using transform: translate(-50%, -50%)
        */}
        <div 
          className="burner-knob"
          style={{
            left: `${layout.burnerKnob.xPercent}%`,
            top: `${layout.burnerKnob.yPercent}%`,
            width: `${layout.burnerKnob.sizePercent}%`,
            height: `${layout.burnerKnob.sizePercent}%`,
          }}
          onClick={handleBurnerKnob}
          title={`Burner: ${['OFF', 'LOW (400W)', 'MED (1700W)', 'HIGH (2500W)'][burnerHeat]}`}
        >
          {/* Outer knob rim */}
          <div className="knob-rim"></div>
          {/* Inner knob center */}
          <div className="knob-center"></div>
          {/* Indicator line showing current position */}
          <div className="knob-pointer" style={{ transform: `rotate(${180 + burnerHeat * 90}deg)` }}></div>
        </div>

        {/* 
          ========== DRAGGABLE POT ==========
          The main interactive element
          User drags this to the sink to fill it, then moves it to the burner
        */}
        <div
          ref={potRef}
          className={`pot-draggable ${isDragging ? 'dragging' : ''} ${waterInPot > 0 ? 'filled' : 'empty'}`}
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
            - pot-empty.png: when waterInPot === 0
            - pot-full.png: when waterInPot > 0
          */}
          <img
            src={waterInPot > 0 ? potFullImage : potEmptyImage}
            alt={waterInPot > 0 ? 'Full Pot' : 'Empty Pot'}
            className="pot-image"
            draggable={false}  // Disable browser's native drag for images
          />
          
          {/* Show steam animation when water is actively boiling at/above boiling point (theme-tunable, optional) */}
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
          ========== FLOATING STATUS PANEL ==========
          Combined info panel showing temperature, water status, and game info
          Floats outside game scene, positioned top-right below header
          No longer locked to game-scene-inner
        */}
        <div className="status-panel">
          <div className="status-content">
            {/* Ambient/Room temperature */}
            <div className="status-item">
              <span className="label">Ambient:</span>
              <span className="value">{GAME_CONFIG.ROOM_TEMPERATURE}°C</span>
            </div>
            
            {/* Temperature display */}
            {waterInPot > 0 && (
              <div className="status-item">
                <span className="label">Temp:</span>
                <span className="value">{formatTemperature(temperature)}°C</span>
              </div>
            )}
            
            {/* Water status */}
            <div className="status-item">
              <span className="label">Water:</span>
              <span className="value">{waterInPot > 0 ? waterInPot.toFixed(2) + 'kg' : 'Empty'}</span>
            </div>
            
            {/* Boiling point info */}
            {waterInPot > 0 && (
              <div className="status-item">
                <span className="label">Boils at:</span>
                <span className="value">{formatTemperature(boilingPoint)}°C</span>
              </div>
            )}
            
            {/* Timer controls - prominent display with start/stop/reset (Advanced Mode Only) */}
            {waterInPot > 0 && isAdvancedModeAvailable && (
              <div className="timer-controls">
                <div className="timer-display">
                  <span className="timer-label">Timer:</span>
                  <span className="timer-value">{formatTime(timeElapsed)}</span>
                </div>
                <div className="timer-buttons">
                  <button 
                    className="timer-button"
                    onClick={handleTimerToggle}
                    title={isTimerRunning ? "Pause timer" : "Start timer"}
                  >
                    {isTimerRunning ? '⏸' : '▶'}
                  </button>
                  <button 
                    className="timer-button"
                    onClick={handleTimerReset}
                    title="Reset timer to zero"
                  >
                    ↻
                  </button>
                </div>
              </div>
            )}
            
            {/* Expected time to boil (environmental estimate) */}
            {waterInPot > 0 && expectedBoilTime !== null && !isBoiling && (
              <div className="status-item" title="Estimated time to reach boiling point at current burner setting">
                <span className="label">Est. Time:</span>
                <span className="value">{formatTime(expectedBoilTime)}</span>
              </div>
            )}
            
            
            {/* Game controls - speed controls (Tutorial/Exp 1 only) */}
            {waterInPot > 0 && activeExperiment === 'boiling-water' && (
              <button 
                className="action-button speed-button status-button"
                onClick={handleSpeedUp}
              >
                ⚡ Speed: {timeSpeed}x
              </button>
            )}
            
            {/* Advanced speed controls with arrows (Advanced Mode Only) */}
            {waterInPot > 0 && isAdvancedModeAvailable && (
              <div className="speed-controls-advanced">
                <button 
                  className="speed-arrow"
                  onClick={handleSpeedHalve}
                  title="Halve speed"
                >
                  ◀
                </button>
                <span className="speed-display">⚡ {timeSpeed}x</span>
                <button 
                  className="speed-arrow"
                  onClick={handleSpeedDouble}
                  title="Double speed"
                >
                  ▶
                </button>
              </div>
            )}
            
            {/* Heating status with progress */}
            {waterInPot > 0 && burnerHeat > 0 && isPotOverFlame && temperature < boilingPoint && (
              <p className="status-text" title="Wait for water to boil, or speed up time with the speed controls above">
                🔥 Heating: {formatTemperature(temperature)}°C → {formatTemperature(boilingPoint)}°C
              </p>
            )}
            
            {/* Cooling - pot is off the flame */}
            {waterInPot > 0 && burnerHeat > 0 && !isPotOverFlame && temperature > GAME_CONFIG.ROOM_TEMPERATURE && (
              <p className="status-text" title="Position pot over flame to heat water">
                ❄️ Cooling: {formatTemperature(temperature)}°C → {GAME_CONFIG.ROOM_TEMPERATURE}°C (place pot over flame)
              </p>
            )}
            
            {/* Waiting to heat */}
            {waterInPot > 0 && burnerHeat === 0 && temperature < boilingPoint && (
              <p className="status-text">
                💤 Turn on burner to heat water
              </p>
            )}
            
            {/* Boiling status with water level */}
            {waterInPot > 0 && isBoiling && temperature >= boilingPoint && (
              <p className="status-text boiling">
                💨 Boiling at {formatTemperature(temperature)}°C! ({Math.round(waterInPot * 1000)}g remaining)
              </p>
            )}
            
            {/* Water boiled off - can refill */}
            {waterInPot <= 0.1 && waterInPot > 0 && (
              <p className="status-text warning">
                ⚠️ Almost dry! Drag pot to tap to refill
              </p>
            )}
            
            {/* Empty pot hint */}
            {waterInPot === 0 && (
              <p className="hint-text">💧 Drag pot to water tap to fill</p>
            )}
            
            {/* Location/Altitude display in status panel (enabled when selectors unlocked or experiment needs it) */}
            {showAltitudeControls && (altitude !== null && altitude !== undefined) && (
              <div className="status-item location-status">
                {locationName ? (
                  <>
                    <span className="label">📍 Location:</span>
                    <span className="value">{locationName} <span className="altitude-value">({Math.round(altitude)}m)</span></span>
                  </>
                ) : (
                  <>
                    <span className="label">📍 Altitude:</span>
                    <span className="value">{Math.round(altitude)}m</span>
                  </>
                )}
                <button 
                  className="location-change-btn"
                  onClick={handleResetLocation}
                  title="Change location"
                >
                  ✏️
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 
          ========== LOCATION SETUP POPUP (Exp 2+) ==========
          Modal that appears when user enters an altitude-based experiment
          User must select a location or altitude to proceed
        */}
        {showLocationPopup && isLocationBasedExperiment && (
          <div className="location-panel">
            <h3>📍 Set Your Location</h3>
            <p className="location-subtitle">
              Notice how the boiling point changes with altitude? Enter your location or altitude to test.
            </p>

            {locationError && (
              <div className="location-error">
                <span className="error-icon">⚠️</span>
                <span className="error-text">{locationError}</span>
              </div>
            )}

            <div className="location-section">
              <label className="section-title">Search for a Location (Worldwide)</label>
              <div className="location-inputs">
                <input
                  type="text"
                  placeholder="Enter city, landmark, or region (e.g., Denver, Tokyo, Sydney)"
                  value={userZipCode}
                  onChange={(e) => {
                    setUserZipCode(e.target.value)
                    setLocationError(null)
                  }}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearchLocation()}
                  disabled={isLoadingLocation}
                  className="location-input location-search-input"
                />
                <button
                  onClick={handleSearchLocation}
                  disabled={isLoadingLocation || !userZipCode.trim()}
                  className="location-button"
                  title="Search worldwide"
                >
                  {isLoadingLocation ? '⏳' : '🔍'}
                </button>
              </div>
            </div>

            <div className="location-divider">or</div>

            <div className="location-section">
              <label className="section-title">Enter Altitude Manually</label>
              <div className="altitude-inputs">
                <input
                  type="number"
                  placeholder="Meters above sea level (0-10000)"
                  value={manualAltitude}
                  onChange={(e) => {
                    setManualAltitude(e.target.value)
                    setLocationError(null)
                  }}
                  onKeyPress={(e) => e.key === 'Enter' && handleSetManualAltitude()}
                  disabled={isLoadingLocation}
                  className="altitude-input"
                  min="0"
                  max="10000"
                />
                <button
                  onClick={handleSetManualAltitude}
                  disabled={isLoadingLocation || !manualAltitude.trim()}
                  className="location-button"
                >
                  ✓
                </button>
              </div>
            </div>

            <div className="location-divider">or</div>

            <div className="location-section">
              <button
                onClick={handleFindMyLocation}
                disabled={isLoadingLocation}
                className="location-button find-my-location"
              >
                {isLoadingLocation ? '⏳ Getting your location...' : '📍 Use My Current Location'}
              </button>
              <small className="location-help">Uses browser geolocation (needs permission)</small>
            </div>
          </div>
        )}

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
              <p className="modal-subtitle">You've successfully boiled water!</p>
              
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
            <p>💧 Your water boiled at {formatTemperature(boilingPoint)}°C (not 100°C!) ❗</p>
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
            <p>💧 Your water boiled at exactly {formatTemperature(boilingPoint)}°C!</p>
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
