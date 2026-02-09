// NOTE: Read the header comments before editing. Reassess splitting into subcomponents when adding new items or behaviors.
/**
 * ExperimentScorecard Component
 *
 * Render-only modal for experiment completion stats.
 */

function ExperimentScorecard({ show, boilStats, formatTemperature, formatTime, onClose }) {
  if (!show || !boilStats) return null

  return (
    <div className="boil-stats-overlay">
      <div className="boil-stats-modal">
        {/* EXPERIMENT 1: Tutorial - Basic Boiling */}
        {boilStats.experiment === 'boiling-water' && (
          <>
            <h2>🎉 You Boiled Water!</h2>
            <p className="modal-subtitle">Great job completing the tutorial!</p>

            <div className="stats-grid">
              <div className="stat-item">
                <span className="stat-label">Boiling Point:</span>
                <span className="stat-value">{formatTemperature(boilStats.boilingPoint)}°C</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Time to Boil:</span>
                <span className="stat-value">{formatTime(boilStats.timeToBoil)}</span>
              </div>
            </div>

            <div className="info-content">
              <h3>🎓 What You Learned</h3>
              <ul>
                <li><strong>Heat Transfer:</strong> The burner transferred thermal energy to the water molecules</li>
                <li><strong>Temperature Rise:</strong> As molecules gained energy, they moved faster, increasing temperature</li>
                <li><strong>Boiling Point:</strong> At {formatTemperature(boilStats.boilingPointSeaLevel ?? 100)}°C (sea level), water molecules gain enough energy to escape as vapor</li>
              </ul>
              <p className="fun-fact">🏔️ <strong>Next Up:</strong> Try the Altitude experiment to see how location changes the boiling point!</p>
            </div>
          </>
        )}

        {/* EXPERIMENT 2: Altitude Effect */}
        {boilStats.experiment === 'altitude-effect' && (
          <>
            <h2>📍 Altitude Experiment Complete!</h2>
            <p className="modal-subtitle">
              You boiled water at {boilStats.locationName || `${boilStats.altitude.toLocaleString()}m altitude`}
            </p>

            <div className="stats-grid">
              <div className="stat-item">
                <span className="stat-label">Your Altitude:</span>
                <span className="stat-value">{boilStats.altitude.toLocaleString()} m</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Boiling Point Here:</span>
                <span className="stat-value">{formatTemperature(boilStats.boilingPoint)}°C</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Sea Level Boiling Point:</span>
                <span className="stat-value">{formatTemperature(boilStats.boilingPointSeaLevel ?? 100)}°C</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Difference:</span>
                <span className="stat-value">
                  {formatTemperature((boilStats.boilingPointSeaLevel ?? 100) - boilStats.boilingPoint)}°C lower
                </span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Time to Boil:</span>
                <span className="stat-value">{formatTime(boilStats.timeToBoil)}</span>
              </div>
            </div>

            <div className="info-content">
              <h3>🎓 Why Does Altitude Matter?</h3>
              <ul>
                <li><strong>Lower Pressure:</strong> At higher altitudes, there&apos;s less air pushing down on the water</li>
                <li><strong>Easier Escape:</strong> Water molecules need less energy to escape as vapor</li>
                <li><strong>Result:</strong> Water boils at a lower temperature ({formatTemperature(boilStats.boilingPoint)}°C vs {formatTemperature(boilStats.boilingPointSeaLevel ?? 100)}°C)</li>
              </ul>
              <p className="fun-fact">🏔️ <strong>Fun Fact:</strong> At the top of Mount Everest (8,849m), water boils at only ~68°C!</p>
            </div>
          </>
        )}

        {/* EXPERIMENT 3: Different Fluids */}
        {boilStats.experiment === 'different-fluids' && (
          <>
            <h2>🧪 {boilStats.fluidName} Boiled!</h2>
            <p className="modal-subtitle">You successfully boiled {boilStats.fluidName.toLowerCase()}</p>

            <div className="stats-grid">
              <div className="stat-item">
                <span className="stat-label">Substance:</span>
                <span className="stat-value">{boilStats.fluidName}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Boiling Point:</span>
                <span className="stat-value">{formatTemperature(boilStats.boilingPoint)}°C</span>
              </div>
              {boilStats.altitude > 0 && (
                <div className="stat-item">
                  <span className="stat-label">Altitude:</span>
                  <span className="stat-value">{boilStats.altitude.toLocaleString()} m</span>
                </div>
              )}
              <div className="stat-item">
                <span className="stat-label">Sea Level Boiling Point:</span>
                <span className="stat-value">{formatTemperature(boilStats.boilingPointSeaLevel)}°C</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Time to Boil:</span>
                <span className="stat-value">{formatTime(boilStats.timeToBoil)}</span>
              </div>
            </div>

            <div className="info-content">
              <h3>🎓 Why Different Boiling Points?</h3>
              <ul>
                <li><strong>Molecular Bonds:</strong> Different substances have different intermolecular forces</li>
                <li><strong>Stronger Bonds = Higher BP:</strong> Water (100°C) has strong hydrogen bonds</li>
                <li><strong>Weaker Bonds = Lower BP:</strong> Acetone (56°C) and ethanol (78°C) have weaker bonds</li>
              </ul>
              <p className="fun-fact">💡 <strong>Try This:</strong> Compare how long it takes to boil different substances with the same heat setting!</p>
            </div>
          </>
        )}

        {/* L1E4: Dangerous Liquids - Room Environment Scorecard */}
        {boilStats.experiment === 'dangerous-liquids' && (
          <>
            <h2>⚠️ Hazardous Material Handled!</h2>
            <p className="modal-subtitle">
              You boiled {boilStats.fluidName} in a controlled environment
            </p>

            <div className="stats-grid">
              <div className="stat-item">
                <span className="stat-label">Substance:</span>
                <span className="stat-value">{boilStats.fluidName}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Boiling Point:</span>
                <span className="stat-value">{formatTemperature(boilStats.boilingPoint)}°C</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Time to Boil:</span>
                <span className="stat-value">{formatTime(boilStats.timeToBoil)}</span>
              </div>
            </div>

            {/* Room Environment Section */}
            {boilStats.roomData && (
              <>
                <h3>🏠 Room Environment</h3>
                <div className="stats-grid">
                  <div className="stat-item">
                    <span className="stat-label">Room Temp Change:</span>
                    <span className="stat-value">
                      {formatTemperature(boilStats.roomData.initialTemperature)}°C → {formatTemperature(boilStats.roomData.finalTemperature)}°C
                    </span>
                  </div>
                  {boilStats.roomData.energyTotals && (
                    <>
                      <div className="stat-item">
                        <span className="stat-label">AC Cooling Used:</span>
                        <span className="stat-value">
                          {(boilStats.roomData.energyTotals.acCoolingJoules / 1000).toFixed(1)} kJ
                        </span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">Air Handler Energy:</span>
                        <span className="stat-value">
                          {(boilStats.roomData.energyTotals.airHandlerJoules / 1000).toFixed(1)} kJ
                        </span>
                      </div>
                    </>
                  )}
                </div>

                {/* Composition Changes */}
                <h3>🌬️ Air Composition</h3>
                <div className="composition-comparison">
                  <div className="comp-column">
                    <strong>Before:</strong>
                    <ul className="comp-list">
                      {Object.entries(boilStats.roomData.initialComposition || {}).slice(0, 5).map(([gas, fraction]) => (
                        <li key={gas}>{gas}: {(fraction * 100).toFixed(2)}%</li>
                      ))}
                    </ul>
                  </div>
                  <div className="comp-column">
                    <strong>After:</strong>
                    <ul className="comp-list">
                      {Object.entries(boilStats.roomData.finalComposition || {}).slice(0, 5).map(([gas, fraction]) => (
                        <li key={gas}>{gas}: {(fraction * 100).toFixed(2)}%</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Exposure Events / Consequences */}
                {boilStats.roomData.exposureEvents?.length > 0 && (
                  <>
                    <h3>⚠️ Exposure Report</h3>
                    {boilStats.roomData.exposureEvents.map((event, idx) => (
                      <div key={idx} className={`exposure-event severity-${event.severity}`}>
                        <strong>{event.name}</strong>
                        <p>Peak: {event.peakPPM.toFixed(0)} ppm | Duration: {formatTime(event.durationSec)}</p>
                        <p className="consequence">{event.consequence}</p>
                        {event.isProtected && (
                          <p className="protected-note">✓ Air handler provided protection</p>
                        )}
                      </div>
                    ))}
                  </>
                )}

                {/* Safety Tips */}
                <div className="info-content">
                  <h3>🎓 Lab Safety</h3>
                  <ul>
                    <li><strong>Ventilation:</strong> Always use proper ventilation with hazardous materials</li>
                    <li><strong>Filters Matter:</strong> Standard filters don&apos;t stop toxic gases - use activated carbon</li>
                    <li><strong>Monitor Air:</strong> Watch for composition changes - rising vapor displaces oxygen</li>
                  </ul>
                </div>
              </>
            )}
          </>
        )}

        {/* FALLBACK: Unknown experiment - show generic stats */}
        {!['boiling-water', 'altitude-effect', 'different-fluids', 'dangerous-liquids'].includes(boilStats.experiment) && (
          <>
            <h2>📋 Experiment Complete!</h2>
            <p className="modal-subtitle">You boiled {boilStats.fluidName.toLowerCase()}!</p>

            <div className="stats-grid">
              <div className="stat-item">
                <span className="stat-label">Substance:</span>
                <span className="stat-value">{boilStats.fluidName}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Boiling Point:</span>
                <span className="stat-value">{formatTemperature(boilStats.boilingPoint)}°C</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Time to Boil:</span>
                <span className="stat-value">{formatTime(boilStats.timeToBoil)}</span>
              </div>
            </div>
          </>
        )}

        <button
          className="action-button continue-button"
          onClick={onClose}
        >
          Close Scorecard
        </button>
      </div>
    </div>
  )
}

export default ExperimentScorecard
