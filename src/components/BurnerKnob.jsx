// NOTE: Read the header comments before editing. Reassess splitting into subcomponents when adding new items or behaviors.
/**
 * BurnerKnob Component
 *
 * Clickable knob for cycling burner heat settings.
 */

function BurnerKnob({ burnerKnobLayout, burnerHeat, wattageSteps, onClick }) {
  if (!burnerKnobLayout) return null

  return (
    <div
      className="burner-knob"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' || e.key === ' ' ? e.preventDefault() : null}
      aria-label="Burner control knob - click to adjust heat"
      style={{
        left: `${burnerKnobLayout.xPercent}%`,
        top: `${burnerKnobLayout.yPercent}%`,
        width: `${burnerKnobLayout.sizePercent}%`,
        height: `${burnerKnobLayout.sizePercent}%`
      }}
      onClick={onClick}
      title={`Burner: ${wattageSteps[burnerHeat] || 0} W`}
    >
      <div className="knob-rim"></div>
      <div className="knob-center"></div>
      <div
        className="knob-pointer"
        style={{ transform: `rotate(${180 + burnerHeat * 90}deg)` }}
      ></div>
    </div>
  )
}

export default BurnerKnob
