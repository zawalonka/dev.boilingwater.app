import { useState, useEffect, useRef } from 'react'
import { 
  calculateBoilingPoint, 
  simulateTimeStep,
  formatTemperature 
} from '../utils/physics'
import { loadSubstance, parseSubstanceProperties, DEFAULT_SUBSTANCE } from '../utils/substanceLoader'
import { GAME_CONFIG } from '../constants/physics'
import '../styles/KitchenScene.css'

function KitchenScene({ stage, location, onStageChange }) {
  const [waterInPot, setWaterInPot] = useState(0) // kg
  const [residueMass, setResidueMass] = useState(0)
  const [temperature, setTemperature] = useState(GAME_CONFIG.ROOM_TEMPERATURE)
  const [heatOn, setHeatOn] = useState(false)
  const [isBoiling, setIsBoiling] = useState(false)
  const [showHook, setShowHook] = useState(false)
  const [timeElapsed, setTimeElapsed] = useState(0)
  const [fluidProps, setFluidProps] = useState(null)
  
  const simulationRef = useRef(null)
  const altitude = location?.altitude || 0
  const boilingPoint = fluidProps ? calculateBoilingPoint(altitude, fluidProps) : null
  const canBoil = Boolean(fluidProps?.canBoil) && Number.isFinite(boilingPoint)
  const liquidMass = Math.max(0, waterInPot - residueMass)
  const fluidName = fluidProps?.name || 'Fluid'

  useEffect(() => {
    async function initializeFluid() {
      try {
        const substanceData = await loadSubstance(DEFAULT_SUBSTANCE)
        const props = parseSubstanceProperties(substanceData)
        setFluidProps(props)
      } catch (error) {
        console.error('Failed to load fluid properties:', error)
        setFluidProps(null)
      }
    }

    initializeFluid()
  }, [])

  // Simulation loop
  useEffect(() => {
    if (!heatOn || liquidMass <= 0 || !fluidProps) return

    simulationRef.current = setInterval(() => {
      const heatInput = 2000 // Watts (stove power)
      const deltaTime = GAME_CONFIG.TIME_STEP / 1000 // Convert ms to seconds

      const newState = simulateTimeStep(
        {
          waterMass: waterInPot,
          temperature: temperature,
          altitude: altitude,
          residueMass: residueMass
        },
        heatInput,
        deltaTime,
        fluidProps
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
  }, [heatOn, waterInPot, liquidMass, residueMass, temperature, altitude, isBoiling, boilingPoint, fluidProps])

  const handleFillPot = () => {
    const fillMass = GAME_CONFIG.DEFAULT_WATER_MASS
    const nonVolatileFraction = fluidProps?.nonVolatileMassFraction ?? 0
    setWaterInPot(fillMass)
    setResidueMass(fillMass * nonVolatileFraction)
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
        <h1>🔥 Boiling {fluidName}</h1>
        <p className="tagline">Learn chemistry by doing it</p>
      </div>

      <div className="scene-content">
        {/* Kitchen Scene */}
        <div className="kitchen-visual">
          <div className="stove">
            <div className={`burner ${heatOn ? 'active' : ''}`}>
              {heatOn && <span className="heat-indicator">🔥</span>}
            </div>
            <div className={`pot ${liquidMass > 0 ? 'filled' : 'empty'}`}>
              {liquidMass > 0 && (
                <div className="water-content">
                  <div 
                    className={`water-level ${isBoiling ? 'boiling' : ''}`}
                    style={{ 
                      height: `${Math.min(liquidMass * 100, 100)}%`,
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
              disabled={liquidMass > 0}
            >
              💧 Fill Pot
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
                  <p>⏱️ Heating {fluidName.toLowerCase()}...</p>
                </div>
              )}

              {isBoiling && (
                <div className="info boiling-info">
                  <p>✨ {fluidName} is boiling!</p>
                </div>
              )}
            </div>
          )}

          {/* The Hook */}
          {showHook && altitude !== 0 && (
            <div className="hook-message">
              <p className="hook-text">
                💧 Your {fluidName.toLowerCase()} boiled at {formatTemperature(boilingPoint)}°C 
                {canBoil ? '(not the sea-level value!)' : ''}
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
                💧 Your {fluidName.toLowerCase()} boiled at exactly {formatTemperature(boilingPoint)}°C!
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
