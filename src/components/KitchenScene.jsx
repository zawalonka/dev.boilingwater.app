import { useState, useEffect, useRef } from 'react'
import { 
  calculateBoilingPoint, 
  simulateTimeStep,
  formatTemperature 
} from '../utils/physics'
import { GAME_CONFIG } from '../constants/physics'
import '../styles/KitchenScene.css'

function KitchenScene({ stage, location, onStageChange }) {
  const [waterInPot, setWaterInPot] = useState(0) // kg
  const [temperature, setTemperature] = useState(GAME_CONFIG.ROOM_TEMPERATURE)
  const [heatOn, setHeatOn] = useState(false)
  const [isBoiling, setIsBoiling] = useState(false)
  const [showHook, setShowHook] = useState(false)
  const [timeElapsed, setTimeElapsed] = useState(0)
  
  const simulationRef = useRef(null)
  const altitude = location?.altitude || 0
  const boilingPoint = calculateBoilingPoint(altitude)

  // Simulation loop
  useEffect(() => {
    if (!heatOn || waterInPot <= 0) return

    simulationRef.current = setInterval(() => {
      const heatInput = 2000 // Watts (stove power)
      const deltaTime = GAME_CONFIG.TIME_STEP / 1000 // Convert ms to seconds

      const newState = simulateTimeStep(
        {
          waterMass: waterInPot,
          temperature: temperature,
          altitude: altitude
        },
        heatInput,
        deltaTime
      )

      setTemperature(newState.temperature)
      setWaterInPot(newState.waterMass)
      setTimeElapsed(prev => prev + deltaTime)

      // Check if boiling
      if (newState.isBoiling && !isBoiling) {
        setIsBoiling(true)
        setShowHook(true)
      }
    }, GAME_CONFIG.TIME_STEP)

    return () => {
      if (simulationRef.current) {
        clearInterval(simulationRef.current)
      }
    }
  }, [heatOn, waterInPot, temperature, altitude, isBoiling, boilingPoint])

  const handleFillPot = () => {
    setWaterInPot(GAME_CONFIG.DEFAULT_WATER_MASS)
    setTemperature(GAME_CONFIG.ROOM_TEMPERATURE)
  }

  const handleTurnOnHeat = () => {
    if (waterInPot > 0) {
      setHeatOn(true)
    }
  }

  const handleLearnMore = () => {
    onStageChange(1)
  }

  return (
    <div className="kitchen-scene">
      <div className="scene-header">
        <h1>🔥 Boiling Water</h1>
        <p className="tagline">Learn chemistry by doing it</p>
      </div>

      <div className="scene-content">
        {/* Kitchen Scene */}
        <div className="kitchen-visual">
          <div className="stove">
            <div className={`burner ${heatOn ? 'active' : ''}`}>
              {heatOn && <span className="heat-indicator">🔥</span>}
            </div>
            <div className={`pot ${waterInPot > 0 ? 'filled' : 'empty'}`}>
              {waterInPot > 0 && (
                <div className="water-content">
                  <div 
                    className={`water-level ${isBoiling ? 'boiling' : ''}`}
                    style={{ 
                      height: `${Math.min(waterInPot * 100, 100)}%`,
                      backgroundColor: temperature > 80 ? '#87CEEB' : temperature > 50 ? '#B0E0E6' : '#4682B4'
                    }}
                  >
                    {isBoiling && <div className="steam">💨💨💨</div>}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="sink">
            <button 
              className="action-button"
              onClick={handleFillPot}
              disabled={waterInPot > 0}
            >
              💧 Fill Pot with Water
            </button>
          </div>
        </div>

        {/* Controls */}
        <div className="controls">
          {waterInPot > 0 && !heatOn && (
            <button 
              className="action-button primary"
              onClick={handleTurnOnHeat}
            >
              🔥 Turn Heat to High
            </button>
          )}

          {heatOn && (
            <div className="status-display">
              <div className="temperature-reading">
                <span className="temp-value">{formatTemperature(temperature)}°C</span>
                <span className="temp-label">Current Temperature</span>
              </div>
              
              {!isBoiling && (
                <div className="info">
                  <p>⏱️ Heating water...</p>
                </div>
              )}

              {isBoiling && (
                <div className="info boiling-info">
                  <p>✨ Water is boiling!</p>
                </div>
              )}
            </div>
          )}

          {/* The Hook */}
          {showHook && altitude !== 0 && (
            <div className="hook-message">
              <p className="hook-text">
                💧 Your water boiled at {formatTemperature(boilingPoint)}°C 
                (not 100°C!) ❗
              </p>
              <button 
                className="action-button learn-more"
                onClick={handleLearnMore}
              >
                🤔 Curious why? Learn more
              </button>
            </div>
          )}

          {showHook && altitude === 0 && (
            <div className="hook-message">
              <p className="hook-text">
                💧 Your water boiled at exactly {formatTemperature(boilingPoint)}°C!
              </p>
              <button 
                className="action-button learn-more"
                onClick={handleLearnMore}
              >
                📚 Learn more about boiling
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Simplified Mode Indicator */}
      <div className="mode-indicator">
        <span className="badge">Simplified Mode</span>
      </div>
    </div>
  )
}

export default KitchenScene
