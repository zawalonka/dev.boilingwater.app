// NOTE: Read the header comments before editing. Reassess splitting into subcomponents when adding new items or behaviors.
/**
 * LocationPopup Component
 *
 * Modal for selecting a location or entering altitude.
 */

function LocationPopup({
  show,
  isAllowed,
  isLoading,
  locationError,
  userZipCode,
  manualAltitude,
  onSearchLocation,
  onSetManualAltitude,
  onFindMyLocation,
  setUserZipCode,
  setManualAltitude,
  setLocationError
}) {
  if (!show || !isAllowed) return null

  return (
    <div className="location-panel">
      {isLoading && (
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
            onKeyPress={(e) => e.key === 'Enter' && onSearchLocation()}
            disabled={isLoading}
            aria-invalid={Boolean(locationError)}
            aria-describedby={`${locationError ? 'location-error ' : ''}location-search-help`}
            className="location-input location-search-input"
          />
          <button
            onClick={onSearchLocation}
            disabled={isLoading || !userZipCode.trim()}
            className="location-button"
            title="Search worldwide"
            aria-label="Search location"
            aria-describedby="location-search-help"
          >
            {isLoading ? '⏳' : '🔍'}
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
            onKeyPress={(e) => e.key === 'Enter' && onSetManualAltitude()}
            disabled={isLoading}
            aria-invalid={Boolean(locationError)}
            aria-describedby={`${locationError ? 'location-error ' : ''}manual-altitude-help`}
            className="altitude-input"
          />
          <button
            onClick={onSetManualAltitude}
            disabled={isLoading || !manualAltitude.trim()}
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
          onClick={onFindMyLocation}
          disabled={isLoading}
          className="location-button find-my-location"
          aria-describedby="geolocation-help"
        >
          {isLoading ? '⏳ Getting your location...' : '📍 Use My Current Location'}
        </button>
        <small id="geolocation-help" className="location-help">Uses browser geolocation (needs permission)</small>
      </div>
    </div>
  )
}

export default LocationPopup
