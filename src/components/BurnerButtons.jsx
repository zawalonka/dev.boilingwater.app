// NOTE: Read the header comments before editing. Reassess splitting into subcomponents when adding new items or behaviors.
/**
 * BurnerButtons Component
 *
 * Button-based burner controls for workshops that replace the knob.
 */

function BurnerButtons({ burnerControlsLayout, burnerHeat, wattageSteps, onHeatDown, onHeatUp }) {
  if (!burnerControlsLayout || burnerControlsLayout.type !== 'buttons') return null

  return (
    <>
      <div
        className="burner-wattage-display"
        style={{
          left: `${burnerControlsLayout.wattageDisplay.xPercent}%`,
          top: `${burnerControlsLayout.wattageDisplay.yPercent}%`,
          width: `${burnerControlsLayout.wattageDisplay.widthPercent}%`,
          height: `${burnerControlsLayout.wattageDisplay.heightPercent}%`,
          border: `${burnerControlsLayout.wattageDisplay.borderPx || 1}px solid ${burnerControlsLayout.wattageDisplay.borderColor || '#333'}`,
          background: burnerControlsLayout.wattageDisplay.backgroundColor || '#f0f0f0',
          color: burnerControlsLayout.wattageDisplay.textColor || '#000'
        }}
      >
        {`${wattageSteps[burnerHeat] || 0} W`}
      </div>

      <span id="burner-controls-help" className="sr-only">
        Adjust the burner power level to change heating intensity.
      </span>

      <button
        className="burner-btn burner-btn-down"
        style={{
          left: `${burnerControlsLayout.downButton.xPercent}%`,
          top: `${burnerControlsLayout.downButton.yPercent}%`,
          width: `${burnerControlsLayout.downButton.sizePercent}%`,
          height: `${burnerControlsLayout.downButton.sizePercent}%`
        }}
        onClick={onHeatDown}
        aria-label="Burner down"
        aria-describedby="burner-controls-help"
        title="Decrease burner wattage"
      >
        {burnerControlsLayout.downButton.symbol || '↓'}
        <div className="burner-btn-label">{burnerControlsLayout.downButton.label || 'down'}</div>
      </button>

      <button
        className="burner-btn burner-btn-up"
        style={{
          left: `${burnerControlsLayout.upButton.xPercent}%`,
          top: `${burnerControlsLayout.upButton.yPercent}%`,
          width: `${burnerControlsLayout.upButton.sizePercent}%`,
          height: `${burnerControlsLayout.upButton.sizePercent}%`
        }}
        onClick={onHeatUp}
        aria-label="Burner up"
        aria-describedby="burner-controls-help"
        title="Increase burner wattage"
      >
        {burnerControlsLayout.upButton.symbol || '↑'}
        <div className="burner-btn-label">{burnerControlsLayout.upButton.label || 'up'}</div>
      </button>
    </>
  )
}

export default BurnerButtons
