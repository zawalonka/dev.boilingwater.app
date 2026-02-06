/**
 * ControlPanel Component
 * 
 * Displays the interactive status panel with controls for the game:
 * - Temperature and substance info
 * - Timer with start/stop/reset controls
 * - Speed controls (basic and advanced modes)
 * - Fluid selector dropdown
 * - Heat level controls
 * - Boiling status messages
 * - Altitude/location selection
 * 
 * All simulation state remains in GameScene; shared app state is read from stores.
 */

import { useWorkshopStore } from '../hooks/stores/workshopStore'

function ControlPanel({
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
  editableAltitude,
  showNextLevelButton,
  
  // Config
  burnerHeat,
  wattageSteps,
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
  nextProgressionType,
  handleSearchLocation,
  handleSetManualAltitude,
  handleFindMyLocation,
  setEditableAltitude,
  setShowLocationPopup,
  setUserZipCode,
  setManualAltitude,
  setLocationError,
  setLocationName,
  setIsLoadingLocation,
  setHasSetLocation
}) {
  const activeExperiment = useWorkshopStore((state) => state.activeExperiment)
  // Format time in mm:ss
  const formatTime = (seconds) => {
    if (seconds === null || seconds === undefined) return '--:--'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Format speed display (handle fractional speeds like 1/2, 1/4, etc.)
  const formatSpeed = (speed) => {
    if (speed === 0) {
      return '⏸ Pause'
    }
    if (speed >= 1) {
      return `${Math.round(speed)}x`
    }
    // For fractional speeds, show as 1/N
    const denominator = Math.round(1 / speed)
    return `1/${denominator}x`
  }

  return (
    <>
      {/* 
        ========== FLOATING STATUS PANEL ==========
        Combined info panel showing temperature, water status, and game info
        Floats outside game scene, positioned top-right below header
      */}
      <div className="status-panel">
        <div className="status-content">
          {/* Ambient/Room temperature */}
          <div className="status-item">
            <span className="label">Ambient:</span>
            <span className="value">{formatTemperature(ambientTemperature ?? GAME_CONFIG.ROOM_TEMPERATURE)}°C</span>
          </div>
          
          {/* Temperature display */}
          {liquidMass > 0 && (
            <div className="status-item">
              <span className="label">Temp:</span>
              <span className="value">{formatTemperature(temperature)}°C</span>
            </div>
          )}
          
          {/* Substance status */}
          <div className="status-item">
            <span className="label">Substance:</span>
            <span className="value">{fluidName}</span>
          </div>

          <div className="status-item">
            <span className="label">Liquid:</span>
            <span className="value">{liquidMass > 0 ? liquidMass.toFixed(2) + 'kg' : 'Empty'}</span>
          </div>

          {residueMass > 0 && (
            <div className="status-item">
              <span className="label">Residue:</span>
              <span className="value">{Math.round(residueMass * 1000)}g</span>
            </div>
          )}
          
          {/* Boiling point info */}
          <div className="status-item">
            <span className="label">Boils at:</span>
            <span className="value">{canBoil ? `${formatTemperature(boilingPoint, 2)}°C` : 'N/A'}</span>
          </div>
          
          {/* Extrapolation warning - shows when boiling point is outside verified Antoine range */}
          {isBoilingPointExtrapolated && canBoil && (
            <div className="status-item extrapolation-warning" title="The boiling point calculation is outside the empirically verified temperature range for this substance. Results are estimated and may have reduced accuracy.">
              <span className="label">⚠️</span>
              <span className="value warning-text">
                {boilingPointVerifiedRange?.max !== null && boilingPoint > boilingPointVerifiedRange.max
                  ? `Above verified range (${formatTemperature(boilingPointVerifiedRange.max, 0)}°C)`
                  : boilingPointVerifiedRange?.min !== null && boilingPoint < boilingPointVerifiedRange.min
                    ? `Below verified range (${formatTemperature(boilingPointVerifiedRange.min, 0)}°C)`
                    : 'Outside verified range'}
              </span>
            </div>
          )}
          
          {/* Timer controls - prominent display with start/stop/reset (Advanced Mode Only) */}
          {isAdvancedModeAvailable && (
            <div className="timer-controls">
              <div className="timer-display">
                <span className="timer-label">Timer:</span>
                <span className="timer-value">{formatTime(timeElapsed)}</span>
              </div>
              <span id="timer-controls-help" className="sr-only">
                Use these controls to start, pause, or reset the experiment timer.
              </span>
              <div className="timer-buttons">
                <button 
                  className="timer-button"
                  onClick={handleTimerToggle}
                  title={isTimerRunning ? "Pause timer" : "Start timer"}
                  aria-label={isTimerRunning ? "Pause timer" : "Start timer"}
                  aria-describedby="timer-controls-help"
                >
                    {isTimerRunning ? '⏸' : '▶'}
                </button>
                <button 
                  className="timer-button"
                  onClick={handleTimerReset}
                  title="Reset timer to zero"
                  aria-label="Reset timer"
                  aria-describedby="timer-controls-help"
                >
                    ↻
                </button>
              </div>
            </div>
          )}
          
          {/* Expected time to boil (environmental estimate) */}
          {liquidMass > 0 && expectedBoilTime !== null && !isBoiling && (
            <div className="status-item" title="Estimated time to reach boiling point at current burner setting">
              <span className="label">Est. Time:</span>
              <span className="value">{formatTime(expectedBoilTime)}</span>
            </div>
          )}
          
          {/* Fluid selector (Exp 3+: different-fluids and beyond) */}
          {activeExperiment !== 'boiling-water' && activeExperiment !== 'altitude-effect' && availableFluids.length > 0 && (
            <div className="fluid-selector">
              <label htmlFor="fluid-select">Fluid:</label>
              <select 
                id="fluid-select"
                value={activeFluid}
                onChange={handleFluidChange}
                className="fluid-dropdown"
                title="Select which fluid to boil"
                aria-describedby="fluid-select-help"
              >
                {availableFluids.map(fluidId => (
                  <option key={fluidId} value={fluidId}>
                    {fluidId.charAt(0).toUpperCase() + fluidId.slice(1).replace(/-/g, ' ')}
                  </option>
                ))}
              </select>
              <span id="fluid-select-help" className="sr-only">
                Choose which substance to heat and boil.
              </span>
            </div>
          )}

          {/* Game controls - speed controls (Tutorial/Exp 1 only) */}
          {liquidMass > 0 && activeExperiment === 'boiling-water' && (
            <span id="speed-control-help" className="sr-only">
              Increase simulation speed during the tutorial.
            </span>
          )}

          {liquidMass > 0 && activeExperiment === 'boiling-water' && (
            <button 
              className="action-button speed-button status-button"
              onClick={handleSpeedUp}
              aria-describedby="speed-control-help"
            >
              ⚡ Speed: {formatSpeed(timeSpeed)}
            </button>
          )}
          
          {/* Advanced speed controls with arrows (Advanced Mode Only) */}
          {isAdvancedModeAvailable && (
            <>
              <div className="speed-warning" id="speed-controls-warning">
                ⚠️ Speed acceleration is unreliable — results unverified
              </div>
              <span id="speed-controls-advanced-help" className="sr-only">
                Use these controls to slow down, pause, or speed up the simulation.
              </span>
              <div className="speed-controls-advanced">
              <button 
                className="speed-arrow"
                onClick={handleSpeedHalve}
                title="Halve speed"
                aria-label="Halve speed"
                aria-describedby="speed-controls-advanced-help speed-controls-warning"
              >
                ◀
              </button>
              <button 
                className="speed-arrow"
                onClick={handleQuickPause}
                title={timeSpeed === 0 ? "Resume" : "Pause"}
                aria-label={timeSpeed === 0 ? "Resume" : "Pause"}
                aria-describedby="speed-controls-advanced-help speed-controls-warning"
              >
                {timeSpeed === 0 ? '▶' : '⏸'}
              </button>
              <span className="speed-display">⚡ {formatSpeed(timeSpeed)}</span>
              <button 
                className="speed-arrow"
                onClick={handleSpeedDouble}
                title="Double speed"
                aria-label="Double speed"
                aria-describedby="speed-controls-advanced-help speed-controls-warning"
              >
                ▶
              </button>
              </div>
            </>
          )}
          
          {/* Heating status with progress */}
          {liquidMass > 0 && burnerHeat > 0 && isPotOverFlame && canBoil && temperature < boilingPoint && (
            <p className="status-text" title="Wait for the fluid to boil, or speed up time with the speed controls above">
              🔥 Heating: {formatTemperature(temperature, 2)}°C → {formatTemperature(boilingPoint, 2)}°C
            </p>
          )}

          {liquidMass > 0 && burnerHeat > 0 && isPotOverFlame && !canBoil && (
            <p className="status-text" title="This substance has no boiling data, so it won't boil">
              🔥 Heating: {formatTemperature(temperature)}°C (no boiling point data)
            </p>
          )}
          
          {/* Cooling - pot is off the flame */}
          {liquidMass > 0 && burnerHeat > 0 && !isPotOverFlame && temperature > (ambientTemperature ?? GAME_CONFIG.ROOM_TEMPERATURE) && (
            <p className="status-text" title="Position pot over flame to heat the fluid">
              ❄️ Cooling: {formatTemperature(temperature)}°C → {formatTemperature(ambientTemperature ?? GAME_CONFIG.ROOM_TEMPERATURE)}°C (place pot over flame)
            </p>
          )}
          
          {/* Waiting to heat */}
          {liquidMass > 0 && burnerHeat === 0 && (!canBoil || temperature < boilingPoint) && (
            <p className="status-text">
              💤 Turn on burner to heat the fluid
            </p>
          )}
          
          {/* Boiling status with water level */}
          {liquidMass > 0 && isBoiling && canBoil && temperature >= boilingPoint && (
            <p className="status-text boiling">
              💨 Boiling at {formatTemperature(temperature)}°C! ({Math.round(liquidMass * 1000)}g remaining)
            </p>
          )}
          
          {/* Water boiled off - can refill */}
          {liquidMass <= 0.1 && liquidMass > 0 && (
            <p className="status-text warning">
              ⚠️ Almost dry! Drag pot to tap to refill
            </p>
          )}
          
          {/* Empty pot hint */}
          {liquidMass === 0 && residueMass === 0 && (
            <p className="hint-text">💧 Drag pot to water tap to fill</p>
          )}

          {liquidMass === 0 && residueMass > 0 && (
            <p className="status-text warning">
              🧪 Residue remaining: {Math.round(residueMass * 1000)}g
            </p>
          )}

          {showNextLevelButton && (
            <button
              className="action-button continue-button"
              onClick={handleNextProgression}
            >
              {nextProgressionType === 'level' ? 'Next Level →' : 'Next Experiment →'}
            </button>
          )}

          {/* Altitude control (Exp 2+: altitude-effect and beyond) - bottom of panel */}
          {activeExperiment !== 'boiling-water' && (
            <div className="altitude-control">
              <span className="altitude-display">
                Altitude: {altitude.toLocaleString()}m
              </span>
              <span id="location-dialog-help" className="sr-only">
                Opens location and altitude settings.
              </span>
              {locationName ? (
                <button 
                  className="action-button location-button"
                  onClick={() => {
                    setShowLocationPopup(true)
                  }}
                  title="Change location"
                  aria-describedby="location-dialog-help"
                >
                  📍 {locationName}
                </button>
              ) : (
                <button 
                  className="action-button location-button"
                  onClick={() => {
                    setShowLocationPopup(true)
                  }}
                  title="Set your location"
                  aria-describedby="location-dialog-help"
                >
                  📍 Set Location
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 
        ========== LOCATION SETUP POPUP (Exp 2+) ==========
        Modal that appears when user enters an altitude-based experiment
        User must select a location or altitude to proceed
      */}
      {showLocationPopup && isLocationPopupAllowed && (
        <div className="location-panel">
          {/* Loading overlay */}
          {isLoadingLocation && (
            <div className="location-loading-overlay">
              <div className="location-loading-spinner">⏳</div>
              <div className="location-loading-text">Determining altitude from location...</div>
            </div>
          )}
          
          <h3>📍 Set Your Location</h3>
          <p className="location-subtitle">
            Notice how the boiling point changes with altitude? Enter your location or altitude to test.
          </p>

          {locationError && (
            <div className="location-error" id="location-error" role="alert">
              <span className="error-icon">⚠️</span>
              <span className="error-text">{locationError}</span>
            </div>
          )}

          <div className="location-section">
            <label className="section-title" htmlFor="location-input">Search for a Location (Worldwide)</label>
            <div className="location-inputs">
              <input
                id="location-input"
                type="text"
                placeholder="City, landmark, or place (Death Valley, Mt Everest, Tokyo)"
                value={userZipCode}
                onChange={(e) => {
                  setUserZipCode(e.target.value)
                  setLocationError(null)
                }}
                onKeyPress={(e) => e.key === 'Enter' && handleSearchLocation()}
                disabled={isLoadingLocation}
                aria-invalid={Boolean(locationError)}
                aria-describedby={`${locationError ? 'location-error ' : ''}location-search-help`}
                className="location-input location-search-input"
              />
              <button
                onClick={handleSearchLocation}
                disabled={isLoadingLocation || !userZipCode.trim()}
                className="location-button"
                title="Search worldwide"
                aria-label="Search location"
                aria-describedby="location-search-help"
              >
                {isLoadingLocation ? '⏳' : '🔍'}
              </button>
            </div>
            <small id="location-search-help" className="location-help">
              Enter a city, landmark, or place name.
            </small>
          </div>

          <div className="location-divider">or</div>

          <div className="location-section">
            <label className="section-title" htmlFor="altitude-input">Enter Altitude Manually</label>
            <div className="altitude-inputs">
              <input
                id="altitude-input"
                type="number"
                placeholder="Meters (negative = below sea level)"
                value={manualAltitude}
                onChange={(e) => {
                  setManualAltitude(e.target.value)
                  setLocationError(null)
                }}
                onKeyPress={(e) => e.key === 'Enter' && handleSetManualAltitude()}
                disabled={isLoadingLocation}
                aria-invalid={Boolean(locationError)}
                aria-describedby={`${locationError ? 'location-error ' : ''}manual-altitude-help`}
                className="altitude-input"
              />
              <button
                onClick={handleSetManualAltitude}
                disabled={isLoadingLocation || !manualAltitude.trim()}
                className="location-button"
                aria-label="Set altitude"
                aria-describedby="manual-altitude-help"
              >
                ✓
              </button>
            </div>
            <small id="manual-altitude-help" className="location-help">
              Negative values are allowed (below sea level).
            </small>
          </div>

          <div className="location-divider">or</div>

          <div className="location-section">
            <button
              onClick={handleFindMyLocation}
              disabled={isLoadingLocation}
              className="location-button find-my-location"
              aria-describedby="geolocation-help"
            >
              {isLoadingLocation ? '⏳ Getting your location...' : '📍 Use My Current Location'}
            </button>
            <small id="geolocation-help" className="location-help">Uses browser geolocation (needs permission)</small>
          </div>
        </div>
      )}
    </>
  )
}

export default ControlPanel
