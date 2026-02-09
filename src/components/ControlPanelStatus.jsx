// NOTE: Read the header comments before editing. Reassess splitting into subcomponents when adding new items or behaviors.
/**
 * ControlPanelStatus Component
 *
 * Status and informational blocks for the ControlPanel.
 */

function ControlPanelStatus({
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
  isBoilingPointExtrapolated,
  boilingPointVerifiedRange,
  activeExperiment,
  availableFluids,
  activeFluid,
  onFluidChange,
  showNextLevelButton,
  onNextProgression,
  nextProgressionType,
  burnerHeat,
  GAME_CONFIG
}) {
  // Format time in mm:ss
  const formatTime = (seconds) => {
    if (seconds === null || seconds === undefined) return '--:--'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <>
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
            onChange={onFluidChange}
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
          onClick={onNextProgression}
        >
          {nextProgressionType === 'level' ? 'Next Level →' : 'Next Experiment →'}
        </button>
      )}
    </>
  )
}

export default ControlPanelStatus
