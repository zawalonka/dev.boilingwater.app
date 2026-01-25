/**
 * GameScene Component
 * 
 * This is the main interactive game environment for the Boiling Water educational app.
 * It displays a 1280x800 game window with a draggable pot, burner with flame, sink for filling water,
 * and physics simulation for heating/boiling water at different altitudes.
 * 
 * The component handles:
 * - Rendering the fixed-size game window and all visual elements
 * - Pot dragging via Pointer Events (works on mouse, touch, and pen)
 * - Physics simulation loop (runs every 100ms when heat is on)
 * - Water filling when pot touches sink
 * - Temperature display and boiling detection
 * - Educational messages about boiling points at different altitudes
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

function GameScene({ stage, location, onStageChange, themeLayout, themeImages }) {
  const layout = themeLayout || DEFAULT_LAYOUT
  const backgroundImage = themeImages?.background || '/assets/images/game/background.png'
  const potEmptyImage = themeImages?.pot_empty || '/assets/images/game/pot-empty.png'
  const potFullImage = themeImages?.pot_full || '/assets/images/game/pot-full.png'
  const flameImage = themeImages?.flame || '/assets/images/game/flame.png'
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

  // How many seconds have elapsed since heat was turned on (used for time calculations)
  const [timeElapsed, setTimeElapsed] = useState(0)

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

  // The dimensions of the game window (always 1280x800, but stored for calculations)
  const [sceneDimensions, setSceneDimensions] = useState({ width: 0, height: 0 })

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
        console.log(`Loaded fluid: ${props.name} (${props.formula})`, props)
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
      setTimeElapsed(prev => prev + deltaTime)  // Track elapsed time (accounts for speed)

      // Check if water just started boiling
      // We only show "boiling" if it wasn't boiling before but is now boiling
      if (newState.isBoiling && !isBoiling) {
        setIsBoiling(true)   // Mark as boiling
        setShowHook(true)    // Show the educational message
      }
    }, GAME_CONFIG.TIME_STEP)  // Repeat every TIME_STEP milliseconds

    // Cleanup function: runs when component unmounts or dependencies change
    // This stops the interval so we don't have multiple intervals running
    return () => {
      if (simulationRef.current) {
        clearInterval(simulationRef.current)
      }
    }
  }, [waterInPot, temperature, altitude, boilingPoint, isBoiling, timeSpeed, potPosition, burnerHeat, fluidProps, themeLayout])  // Re-run if any of these change

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
    if (inWaterStream && waterInPot === 0) {
      // Auto-fill with the default water amount (1.0 kg)
      setWaterInPot(GAME_CONFIG.DEFAULT_WATER_MASS)
      // Reset temperature to room temp when filling with fresh water
      setTemperature(GAME_CONFIG.ROOM_TEMPERATURE)
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
   * Cycle through time speed options: 1x → 2x → 4x → 8x → 1x
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

  // Check if pot is in the water stream area to show the pouring effect
  const showWaterStream =
    potPosition.x >= layout.waterStream.xRange[0] &&
    potPosition.x <= layout.waterStream.xRange[1] &&
    potPosition.y >= layout.waterStream.yRange[0] &&
    potPosition.y <= layout.waterStream.yRange[1]

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
        style={{ backgroundImage: `url(${backgroundImage})` }}
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
          {/* Show flame when burner is on (burnerHeat > 0) */}
          {burnerHeat > 0 && (
            <img 
              src={flameImage}
              alt="Flame"
              className="flame-graphic"
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
          
          {/* Show steam animation when water is actively boiling */}
          {isBoiling && <div className="steam-effect">💨</div>}
        </div>
        {/* 
          ========== STATUS PANEL ==========
          Combined info panel showing temperature, water status, burner setting, and game info
          Located in the top-left corner
        */}
        <div className="status-panel">
          <div className="status-header">
            <span className="burner-label">{['🔴 OFF', '🟡 LOW', '🟠 MED', '🔴 HIGH'][burnerHeat]}</span>
          </div>
          
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
            
            {/* Game controls - speed button */}
            {waterInPot > 0 && (
              <button 
                className="action-button speed-button status-button"
                onClick={handleSpeedUp}
              >
                ⚡ Speed: {timeSpeed}x
              </button>
            )}
            
            {/* Heating status */}
            {waterInPot > 0 && temperature < boilingPoint && (
              <p className="status-text">Heating...</p>
            )}
            
            {/* Boiling status */}
            {waterInPot > 0 && isBoiling && (
              <p className="status-text boiling">Boiling! 🫖</p>
            )}
            
            {/* Empty pot hint */}
            {waterInPot === 0 && (
              <p className="hint-text">Fill pot at water tap</p>
            )}
          </div>
        </div>

        {/* 
          ========== EDUCATIONAL HOOK ==========
          Shows a message about boiling points at different altitudes
          Appears when water starts boiling
        */}

        {/* 
          If at altitude (not at sea level) and water is boiling:
          Show message that water boiled at a different temperature than 100°C
        */}
        {showHook && altitude !== 0 && (
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
          If at sea level (altitude = 0) and water is boiling:
          Confirm that water boiled at 100°C as expected
        */}
        {showHook && altitude === 0 && (
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
