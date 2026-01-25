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

  // How much water is currently in the pot, in kilograms (0 = empty, typically 1.0kg = full)
  const [waterInPot, setWaterInPot] = useState(0)

  // Current temperature of the water in Celsius (starts at room temperature)
  const [temperature, setTemperature] = useState(GAME_CONFIG.ROOM_TEMPERATURE)

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
  // EFFECT 2: Physics simulation loop (runs continuously when water is in pot)
  // ============================================================================

  useEffect(() => {
    // This effect handles the physics simulation of heating/cooling water
    // It runs continuously while there's water in the pot
    // Heat is only applied when the pot is over the flame
    if (waterInPot <= 0) return

    // Define the heat activation area around the flame
    // Flame is at ~62.6% X, ~53.4% Y with 40% size container
    // Activation radius: 6.25% of game window (requires tight positioning for precision)
    const flameX = 62.6
    const flameY = 53.4
    const heatActivationRadius = 6.25
    
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
      } else {
        // No heat applied - use ambient cooling instead
        heatInputWatts = -GAME_CONFIG.AMBIENT_COOLING_WATTS  // -200W
      }

      // Convert the TIME_STEP from milliseconds to seconds
      // If TIME_STEP = 100 (milliseconds), deltaTime = 0.1 (seconds)
      // Multiply by timeSpeed to speed up simulation (2x, 4x, 8x, etc.)
      const deltaTime = (GAME_CONFIG.TIME_STEP / 1000) * timeSpeed

      // Call the physics engine function to calculate what happens in this time step
      // It takes:
      // - Current water properties (mass, temperature, altitude)
      // - Heat being applied (Watts, can be negative for cooling)
      // - Time elapsed in this step (seconds × speed multiplier)
      // And returns new temperature, water mass, and whether it's boiling
      const newState = simulateTimeStep(
        {
          waterMass: waterInPot,         // How much water (kg)
          temperature: temperature,      // Current temperature (°C)
          altitude: altitude             // Current altitude (meters)
        },
        heatInputWatts,                   // How much heat to apply (Watts, can be negative)
        deltaTime                         // How much time this step represents (seconds)
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
  }, [waterInPot, temperature, altitude, boilingPoint, isBoiling, timeSpeed, potPosition, burnerHeat])  // Re-run if any of these change

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
    const inWaterStream = newXPercent >= 26 && newXPercent <= 30 && newYPercent >= 44 && newYPercent <= 72
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

  // ============================================================================
  // CALCULATED VALUES (derived from state)
  // ============================================================================

  // Original background image dimensions (what it is in the PNG file)
  const baseWidth = 1280   // pixels - current display width
  const baseHeight = 800   // pixels - current display height

  // Calculate scale factors (not used much since we use percentages, but kept for reference)
  const scaleX = sceneDimensions.width / baseWidth
  const scaleY = sceneDimensions.height / baseHeight
  const scale = Math.min(scaleX, scaleY)

  // Calculate where the flame should appear on the burner
  // Original burner location was designed for 1024x1024 image at pixel (641, 567)
  // But we're now displaying at 1280x800, so adjust the percentages
  // If original was 1024x1024: 641/1024 = 62.6% X, 567/1024 = 55.4% Y
  // Adjusted Y by -2% to move flame up slightly
  const flameX = (641 / 1024) * 100    // = ~62.6% across (adjusted for original square aspect)
  const flameY = (567 / 1024) * 100 - 2    // = ~53.4% down (moved up by 2%)

  // Calculate water stream position (from original 1024x1024: starts at 295,451 ends at 285,724)
  const waterStreamStartX = (295 / 1024) * 100  // = ~28.8%
  const waterStreamStartY = (451 / 1024) * 100  // = ~44.0%
  const waterStreamEndX = (285 / 1024) * 100    // = ~27.8%
  const waterStreamEndY = (724 / 1024) * 100    // = ~70.7%
  const waterStreamHeight = waterStreamEndY - waterStreamStartY  // = ~26.7%

  // Check if pot is in the water stream area to show the pouring effect
  const showWaterStream = potPosition.x >= 26 && potPosition.x <= 30 && potPosition.y >= 44 && potPosition.y <= 72

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
              width: '2%',
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
            left: `${flameX}%`,     // ~62.6% across (at burner location)
            top: `${flameY}%`,      // ~55.4% down (at burner location)
            width: burnerHeat === 0 ? '0%' : ['35%', '37%', '40%', '45%'][burnerHeat],  // Scale flame with heat
            height: burnerHeat === 0 ? '0%' : ['35%', '37%', '40%', '45%'][burnerHeat],
            minWidth: burnerHeat === 0 ? '0px' : ['180px', '200px', '220px', '240px'][burnerHeat],
            minHeight: burnerHeat === 0 ? '0px' : ['180px', '200px', '220px', '240px'][burnerHeat]
          }}
        >
          {/* Show flame when burner is on (burnerHeat > 0) */}
          {burnerHeat > 0 && (
            <img 
              src="/assets/images/game/flame.png" 
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
            left: `${(681 / 1024) * 100}%`,  // 66.5% - positioned at top-left
            top: `${(695 / 1024) * 100}%`,   // 67.8% - positioned at top-left
            width: '5%',                      // Knob: 5% of game window (64 pixels)
            height: '5%',                     // Knob: 5% of game window (40 pixels)
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
