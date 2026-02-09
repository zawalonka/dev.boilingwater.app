// NOTE: Read the header comments before editing. Reassess splitting into subcomponents when adding new items or behaviors.
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
import { useGameSceneContext } from './GameSceneContext'
import LocationPopup from './LocationPopup'
import ControlPanelStatus from './ControlPanelStatus'
import ControlPanelTimerSpeed from './ControlPanelTimerSpeed'
import ControlPanelAltitude from './ControlPanelAltitude'

function ControlPanel() {
  const {
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
    showNextLevelButton,
    
    // Config
    burnerHeat,
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
    setLocationError
  } = useGameSceneContext()
  const activeExperiment = useWorkshopStore((state) => state.activeExperiment)
  return (
    <>
      {/* 
        ========== FLOATING STATUS PANEL ==========
        Combined info panel showing temperature, water status, and game info
        Floats outside game scene, positioned top-right below header
      */}
      <div className="status-panel">
        <div className="status-content">
          <ControlPanelStatus
            liquidMass={liquidMass}
            temperature={temperature}
            isBoiling={isBoiling}
            residueMass={residueMass}
            fluidName={fluidName}
            boilingPoint={boilingPoint}
            canBoil={canBoil}
            isPotOverFlame={isPotOverFlame}
            expectedBoilTime={expectedBoilTime}
            formatTemperature={formatTemperature}
            ambientTemperature={ambientTemperature}
            isBoilingPointExtrapolated={isBoilingPointExtrapolated}
            boilingPointVerifiedRange={boilingPointVerifiedRange}
            activeExperiment={activeExperiment}
            availableFluids={availableFluids}
            activeFluid={activeFluid}
            onFluidChange={handleFluidChange}
            showNextLevelButton={showNextLevelButton}
            onNextProgression={handleNextProgression}
            nextProgressionType={nextProgressionType}
            burnerHeat={burnerHeat}
            GAME_CONFIG={GAME_CONFIG}
          />

          <ControlPanelTimerSpeed
            isAdvancedModeAvailable={isAdvancedModeAvailable}
            isTimerRunning={isTimerRunning}
            timeElapsed={timeElapsed}
            handleTimerToggle={handleTimerToggle}
            handleTimerReset={handleTimerReset}
            liquidMass={liquidMass}
            activeExperiment={activeExperiment}
            handleSpeedUp={handleSpeedUp}
            timeSpeed={timeSpeed}
            handleSpeedHalve={handleSpeedHalve}
            handleQuickPause={handleQuickPause}
            handleSpeedDouble={handleSpeedDouble}
          />

          <ControlPanelAltitude
            activeExperiment={activeExperiment}
            altitude={altitude}
            locationName={locationName}
            onShowLocationPopup={() => setShowLocationPopup(true)}
          />
        </div>
      </div>

      {/* 
        ========== LOCATION SETUP POPUP (Exp 2+) ==========
        Modal that appears when user enters an altitude-based experiment
        User must select a location or altitude to proceed
      */}
      <LocationPopup
        show={showLocationPopup}
        isAllowed={isLocationPopupAllowed}
        isLoading={isLoadingLocation}
        locationError={locationError}
        userZipCode={userZipCode}
        manualAltitude={manualAltitude}
        onSearchLocation={handleSearchLocation}
        onSetManualAltitude={handleSetManualAltitude}
        onFindMyLocation={handleFindMyLocation}
        setUserZipCode={setUserZipCode}
        setManualAltitude={setManualAltitude}
        setLocationError={setLocationError}
      />
    </>
  )
}

export default ControlPanel
