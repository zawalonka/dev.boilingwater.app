// NOTE: Read the header comments before editing. Reassess splitting into subcomponents when adding new items or behaviors.
/**
 * ControlPanelAltitude Component
 *
 * Altitude and location controls for the ControlPanel.
 */

function ControlPanelAltitude({
  activeExperiment,
  altitude,
  locationName,
  onShowLocationPopup
}) {
  return (
    <>
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
              onClick={onShowLocationPopup}
              title="Change location"
              aria-describedby="location-dialog-help"
            >
              📍 {locationName}
            </button>
          ) : (
            <button
              className="action-button location-button"
              onClick={onShowLocationPopup}
              title="Set your location"
              aria-describedby="location-dialog-help"
            >
              📍 Set Location
            </button>
          )}
        </div>
      )}
    </>
  )
}

export default ControlPanelAltitude
