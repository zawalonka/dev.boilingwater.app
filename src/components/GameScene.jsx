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
  calculateBoilingPoint,  // Calculates water's boiling point based on altitude
  simulateTimeStep,       // Runs one time step of physics (heating/cooling/boiling)
  formatTemperature       // Formats temperature numbers for display (e.g., 98.5°C)
} from '../utils/physics'
import { GAME_CONFIG } from '../constants/physics'
import '../styles/GameScene.css'

function GameScene({ stage, location, onStageChange }) {
  // ============================================================================
  // STATE VARIABLES: These change during gameplay
  // ============================================================================

  // How much water is currently in the pot, in kilograms (0 = empty, typically 0.5kg = full)
  const [waterInPot, setWaterInPot] = useState(0)

  // Current temperature of the water in Celsius (starts at room temperature)
  const [temperature, setTemperature] = useState(GAME_CONFIG.ROOM_TEMPERATURE)

  // Is the heat burner currently turned on? (true = heat is on, false = heat is off)
  const [heatOn, setHeatOn] = useState(false)

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
  const [potPosition, setPotPosition] = useState({ x: 75, y: 45 })

  // Is the user currently dragging the pot? (true = dragging, false = not dragging)
  const [isDragging, setIsDragging] = useState(false)

  // When dragging starts, we store the offset between the mouse and pot center
  // This prevents the pot from "jumping" to the cursor position
  // Example: if user clicks 50 pixels left of pot center, dragOffset.x = -50
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })

  // The dimensions of the game window (always 1280x800, but stored for calculations)
  const [sceneDimensions, setSceneDimensions] = useState({ width: 0, height: 0 })

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

  // Pre-calculate what temperature water will boil at for this altitude
  // At sea level (0m): 100°C
  // At Denver (1609m): ~95°C
  // At Mount Everest base camp (5364m): ~68°C
  const boilingPoint = calculateBoilingPoint(altitude)

  // ============================================================================
  // EFFECT 1: Initialize the game window dimensions (runs once on component load)
  // ============================================================================

  useEffect(() => {
    // This "effect" runs only once when the component first appears
    // It sets up the game window to be exactly 1280x800 pixels
    const updateDimensions = () => {
      if (sceneRef.current) {
        // We set dimensions to a fixed size (matching the background image dimensions)
        // This ensures all percentage-based positioning stays consistent
        setSceneDimensions({
          width: 1280,   // Fixed width in pixels
          height: 800    // Fixed height in pixels
        })
      }
    }

    // Call it immediately when component loads
    updateDimensions()
    
    // Empty dependency array [] means: only run once, never again
    // If we removed the [], it would run every time any state changes
  }, [])

  // ============================================================================
  // EFFECT 2: Physics simulation loop (runs when heat is on)
  // ============================================================================

  useEffect(() => {
    // This effect handles the physics simulation of heating water
    // It only runs if both of these are true:
    // 1. The heat is turned on (heatOn === true)
    // 2. There's actually water in the pot (waterInPot > 0)
    if (!heatOn || waterInPot <= 0) return

    // Start a repeating timer that runs every TIME_STEP milliseconds (e.g., every 100ms)
    simulationRef.current = setInterval(() => {
      // Amount of heat energy being input to the water (in Joules)
      // This is how much energy is transferred to the water each time step
      const heatInput = 2000  // 2000 Joules per time step

      // Convert the TIME_STEP from milliseconds to seconds
      // If TIME_STEP = 100 (milliseconds), deltaTime = 0.1 (seconds)
      const deltaTime = GAME_CONFIG.TIME_STEP / 1000

      // Call the physics engine function to calculate what happens in this time step
      // It takes:
      // - Current water properties (mass, temperature, altitude)
      // - Heat being applied
      // - Time elapsed in this step
      // And returns new temperature, water mass, and whether it's boiling
      const newState = simulateTimeStep(
        {
          waterMass: waterInPot,         // How much water (kg)
          temperature: temperature,      // Current temperature (°C)
          altitude: altitude             // Current altitude (meters)
        },
        heatInput,                        // How much heat to apply (Joules)
        deltaTime                         // How much time this step represents (seconds)
      )

      // Update all the values returned from the physics simulation
      setTemperature(newState.temperature)      // Water is now hotter
      setWaterInPot(newState.waterMass)        // Water mass decreases if boiling (evaporation)
      setTimeElapsed(prev => prev + deltaTime)  // Track elapsed time

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
  }, [heatOn, waterInPot, temperature, altitude, isBoiling, boilingPoint])

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

    // AUTO-FILL: Check if pot is touching the sink (top-left corner)
    // Sink is in region: x from 1% to 11%, y from 2% to 14%
    // We check if pot center is in this region AND pot is empty
    const nearSink = newXPercent < 12 && newYPercent < 15
    if (nearSink && waterInPot === 0) {
      // Auto-fill with the default water amount
      setWaterInPot(GAME_CONFIG.DEFAULT_WATER_MASS)  // Typically 0.5 kg
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
   * Turns on the heat burner when user clicks "Turn Heat On" button
   */
  const handleTurnOnHeat = () => {
    // Only allow heat to turn on if there's water in the pot
    // No point heating an empty pot!
    if (waterInPot > 0) {
      setHeatOn(true)
      // Once true, the physics simulation effect will start running
    }
  }

  /**
   * Transitions to the next stage (more educational content) when user clicks "Learn More"
   */
  const handleLearnMore = () => {
    // Call the parent component callback to change the game stage
    // This transitions from Stage 0 (gameplay) to Stage 1 (educational content)
    onStageChange(1)
  }

  // ============================================================================
  // CALCULATED VALUES (derived from state)
  // ============================================================================

  // Original background image dimensions (what it is in the PNG file)
  const baseWidth = 1280   // pixels
  const baseHeight = 800   // pixels

  // Calculate scale factors (not used much since we use percentages, but kept for reference)
  const scaleX = sceneDimensions.width / baseWidth
  const scaleY = sceneDimensions.height / baseHeight
  const scale = Math.min(scaleX, scaleY)

  // Calculate where the flame should appear on the burner
  // The burner is located at pixel coordinates (641, 567) on the original 1280x800 background
  // Convert to percentages so it stays in the right place regardless of screen size
  const flameX = (641 / baseWidth) * 100    // = ~50% across the game window
  const flameY = (567 / baseHeight) * 100   // = ~71% down the game window

  // Drag boundaries: how far the pot center can move (in percentages)
  // These are conservative to keep the pot mostly on screen
  const maxXPercent = 92   // Pot center can't go further right than 92%
  const maxYPercent = 92   // Pot center can't go further down than 92%
  const minXPercent = 8    // Pot center can't go further left than 8%
  const minYPercent = 8    // Pot center can't go further up than 8%

  // ============================================================================
  // RENDER: Build and return the UI
  // ============================================================================

  return (
    <div className="game-scene">
      {/* 
        The outer game-scene div fills the entire browser viewport
        It's centered in the middle and has a black background for letterboxing
      */}

      <div 
        ref={sceneRef}
        className="game-scene-inner"
      >
        {/* 
          ========== SINK (Water source) ==========
          Located in the top-left corner
          Clicking the pot here auto-fills it with water
        */}
        <div 
          className="sink"
          style={{
            left: '1%',      // 1% from the left edge of game window
            top: '2%',       // 2% from the top edge of game window
            width: '10%',    // 10% of game window width (128 pixels)
            height: '12%'    // 12% of game window height (96 pixels)
          }}
        >
          <span className="sink-icon">💧</span>
        </div>

        {/* 
          ========== FLAME (Burner visualization) ==========
          Located at center-right where the burner is
          Shows a flame image when heat is on
        */}
        <div 
          className="stove-burner"
          style={{
            left: `${flameX}%`,     // ~50% across (at burner location)
            top: `${flameY}%`,      // ~71% down (at burner location)
            width: '15%',           // 15% of game window width (192 pixels)
            height: '15%',          // 15% of game window height (120 pixels)
            minWidth: '80px',       // Never smaller than 80 pixels (for readability)
            minHeight: '80px'       // Never smaller than 80 pixels (for readability)
          }}
        >
          {/* Only show the flame image if heat is currently on */}
          {heatOn && (
            <img 
              src="/assets/images/game/flame.png" 
              alt="Flame"
              className="flame-graphic"
            />
          )}
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
            width: '36%',                   // Pot is 36% of game window width (461 pixels)
            height: '36%',                  // Pot is 36% of game window height (288 pixels)
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
            src={waterInPot > 0 ? '/assets/images/game/pot-full.png' : '/assets/images/game/pot-empty.png'}
            alt={waterInPot > 0 ? 'Full Pot' : 'Empty Pot'}
            className="pot-image"
            draggable={false}  // Disable browser's native drag for images
          />
          
          {/* Show steam animation when water is actively boiling */}
          {isBoiling && <div className="steam-effect">💨</div>}
        </div>

        {/* 
          ========== CONTROLS PANEL ==========
          Status display and buttons
          Located in the bottom-right corner of the game window
        */}
        <div className="controls-panel">
          <div className="control-section">
            {/* 
              Show the "Turn Heat On" button if:
              - Heat is NOT on (!heatOn)
              - AND there's water in the pot (waterInPot > 0)
            */}
            {!heatOn && waterInPot > 0 && (
              <button 
                className="action-button primary"
                onClick={handleTurnOnHeat}
              >
                🔥 Turn Heat On
              </button>
            )}

            {/* 
              Show the temperature display while heat is on
              This replaces the "Turn Heat On" button
            */}
            {heatOn && (
              <div className="status-display">
                {/* Display the current water temperature */}
                <div className="temperature-reading">
                  <span className="temp-value">{formatTemperature(temperature)}°C</span>
                  <span className="temp-label">Temperature</span>
                </div>
                
                {/* Show "Heating..." while water is warming but not yet boiling */}
                {!isBoiling && (
                  <p className="status-text">Heating...</p>
                )}

                {/* Show "Boiling!" once water reaches boiling point */}
                {isBoiling && (
                  <p className="status-text boiling">Boiling! 🫖</p>
                )}
              </div>
            )}

            {/* 
              Show the hint text when pot is empty and heat is off
              This guides the player on what to do next
            */}
            {waterInPot === 0 && !heatOn && (
              <p className="hint-text">Drag the pot to the tap (top-left) to fill it</p>
            )}
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

        {/* 
          ========== BETA BADGE ==========
          Indicates this is a beta/test version
          Located in top-right corner
        */}
        <div className="mode-indicator">
          <span className="badge">Beta</span>
        </div>
      </div>
    </div>
  )
}

export default GameScene
