// NOTE: Read the header comments before editing. Reassess splitting into subcomponents when adding new items or behaviors.
/**
 * GameSceneView Component
 *
 * Render-only presenter for the GameScene UI. Receives fully prepared
 * state, config, and callbacks from the GameScene container.
 */

import ControlPanel from './ControlPanel'
import { GameSceneProvider } from './GameSceneContext'
import RoomControls from './RoomControls'
import Pot from './Pot'
import BurnerFlame from './BurnerFlame'
import BurnerKnob from './BurnerKnob'
import BurnerButtons from './BurnerButtons'
import WaterStream from './WaterStream'
import ExperimentScorecard from './ExperimentScorecard'

function GameSceneView({
  hasRequiredImages,
  fluidLoadError,
  backgroundImage,
  layout,
  sceneRef,
  showWaterStream,
  showAmbientSteam,
  fluidProps,
  flameImage,
  burnerHeat,
  flameFilter,
  flameAnimationDuration,
  flameGlowEnabled,
  burnerControlsLayout,
  burnerKnobLayout,
  wattageSteps,
  onHeatDown,
  onHeatUp,
  onBurnerKnob,
  potRef,
  isDragging,
  liquidMass,
  potPosition,
  potFullImage,
  potEmptyImage,
  steamConfig,
  steamStyle,
  isBoiling,
  temperature,
  boilingPoint,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  controlPanelContextValue,
  roomControlsEnabled,
  roomSummary,
  roomAlerts,
  acUnitConfig,
  airHandlerConfig,
  availableAcUnits,
  availableAirHandlers,
  selectedAcUnitId,
  selectedAirHandlerId,
  onAcEnabledChange,
  onAcSetpointChange,
  onAirHandlerModeChange,
  onAcUnitChange,
  onAirHandlerChange,
  showHook,
  boilStats,
  formatTemperature,
  formatTime,
  onCloseScorecard
}) {
  if (!hasRequiredImages) {
    return (
      <div className="info-screen">
        <div className="info-content">
          <h2>⚠️ Workshop Assets Missing</h2>
          <p>This workshop must provide all required images (background, pot, flame). Add them in the workshop JSON before running the scene.</p>
        </div>
      </div>
    )
  }

  if (fluidLoadError) {
    return (
      <div className="info-screen">
        <div className="info-content">
          <h2>⚠️ Substance Data Load Failed</h2>
          <p>{fluidLoadError.message || 'Unable to load substance properties from data files.'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="game-scene">
      {/*
        The outer game-scene div fills the entire browser viewport
        It's centered in the middle and has a black background for letterboxing
      */}

      <div
        ref={sceneRef}
        className="game-scene-inner"
        style={{
          backgroundImage: `url(${backgroundImage})`,
          width: `${layout.scene.width}px`,
          height: `${layout.scene.height}px`,
          backgroundSize: '100% 100%'
        }}
      >
        {/*
          ========== WATER STREAM (Water Source) ==========
          Pouring water effect from faucet area
          Appears only when pot is passing through the stream
        */}
        <WaterStream
          showWaterStream={showWaterStream}
          showAmbientSteam={showAmbientSteam}
          layout={layout}
          fluidProps={fluidProps}
        />

        {/*
          ========== FLAME (Burner visualization) ==========
          Located at center-right where the burner is
          Shows a flame image when heat is on
        */}
        <BurnerFlame
          flameImage={flameImage}
          burnerHeat={burnerHeat}
          flameLayout={layout.flame}
          glowEnabled={flameGlowEnabled}
          flameFilter={flameFilter}
          flameAnimationDuration={flameAnimationDuration}
        />

        <BurnerButtons
          burnerControlsLayout={burnerControlsLayout}
          burnerHeat={burnerHeat}
          wattageSteps={wattageSteps}
          onHeatDown={onHeatDown}
          onHeatUp={onHeatUp}
        />

        {/*
          ========== BURNER KNOB (Heat Control) ==========
          Tiny dial control at the bottom of the stove
          Render only when the workshop provides burnerKnob layout
        */}
        <BurnerKnob
          burnerKnobLayout={burnerKnobLayout}
          burnerHeat={burnerHeat}
          wattageSteps={wattageSteps}
          onClick={onBurnerKnob}
        />

        {/*
          ========== DRAGGABLE POT ==========
          The main interactive element
          User drags this to the sink to fill it, then moves it to the burner
        */}
        <Pot
          potRef={potRef}
          isDragging={isDragging}
          liquidMass={liquidMass}
          potPosition={potPosition}
          layout={layout}
          potFullImage={potFullImage}
          potEmptyImage={potEmptyImage}
          steamConfig={steamConfig}
          steamStyle={steamStyle}
          isBoiling={isBoiling}
          temperature={temperature}
          boilingPoint={boilingPoint}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
        />

        {/*
          ========== CONTROL PANEL ==========
          Extracted component handling all UI controls, status display, and location/altitude selection
        */}
        <GameSceneProvider value={controlPanelContextValue}>
          <ControlPanel />
        </GameSceneProvider>

        {/*
          ========== ROOM CONTROLS ==========
          AC and air handler controls, room state display
          Only visible for experiments with unlocksRoomControls flag (L1E4+)
        */}
        <RoomControls
          enabled={roomControlsEnabled}
          summary={roomSummary}
          alerts={roomAlerts}
          acUnit={acUnitConfig}
          airHandler={airHandlerConfig}
          availableAcUnits={availableAcUnits}
          availableAirHandlers={availableAirHandlers}
          selectedAcUnitId={selectedAcUnitId}
          selectedAirHandlerId={selectedAirHandlerId}
          onAcEnabledChange={onAcEnabledChange}
          onAcSetpointChange={onAcSetpointChange}
          onAirHandlerModeChange={onAirHandlerModeChange}
          onAcUnitChange={onAcUnitChange}
          onAirHandlerChange={onAirHandlerChange}
        />

        {/*
          ========== EDUCATIONAL HOOK ==========
          Shows experiment-specific results when boiling is achieved
          Always pauses simulation while visible
        */}

        <ExperimentScorecard
          show={showHook}
          boilStats={boilStats}
          formatTemperature={formatTemperature}
          formatTime={formatTime}
          onClose={onCloseScorecard}
        />
      </div>
    </div>
  )
}

export default GameSceneView
