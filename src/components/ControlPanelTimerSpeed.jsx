// NOTE: Read the header comments before editing. Reassess splitting into subcomponents when adding new items or behaviors.
/**
 * ControlPanelTimerSpeed Component
 *
 * Timer and speed controls for the ControlPanel.
 */

function ControlPanelTimerSpeed({
  isAdvancedModeAvailable,
  isTimerRunning,
  timeElapsed,
  handleTimerToggle,
  handleTimerReset,
  liquidMass,
  activeExperiment,
  handleSpeedUp,
  timeSpeed,
  handleSpeedHalve,
  handleQuickPause,
  handleSpeedDouble
}) {
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
              title={isTimerRunning ? 'Pause timer' : 'Start timer'}
              aria-label={isTimerRunning ? 'Pause timer' : 'Start timer'}
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
              title={timeSpeed === 0 ? 'Resume' : 'Pause'}
              aria-label={timeSpeed === 0 ? 'Resume' : 'Pause'}
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
    </>
  )
}

export default ControlPanelTimerSpeed
