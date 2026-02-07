// NOTE: Read the header comments before editing. Reassess splitting into subcomponents when adding new items or behaviors.
/**
 * BurnerFlame Component
 *
 * Renders the burner flame image and optional glow effect.
 */

function BurnerFlame({
  flameImage,
  burnerHeat,
  flameLayout,
  glowEnabled,
  flameFilter,
  flameAnimationDuration
}) {
  if (!flameLayout) return null

  const sizePercent = flameLayout.sizePercentByHeat?.[burnerHeat]
    ?? flameLayout.sizePercentByHeat?.at(-1)
    ?? 0
  const minSizePx = flameLayout.minSizePxByHeat?.[burnerHeat]
    ?? flameLayout.minSizePxByHeat?.at(-1)
    ?? 0
  const isBurnerOn = burnerHeat > 0

  return (
    <div
      className="stove-burner"
      style={{
        left: `${flameLayout.xPercent}%`,
        top: `${flameLayout.yPercent}%`,
        width: isBurnerOn ? `${sizePercent}%` : '0%',
        height: isBurnerOn ? `${sizePercent}%` : '0%',
        minWidth: isBurnerOn ? `${minSizePx}px` : '0px',
        minHeight: isBurnerOn ? `${minSizePx}px` : '0px'
      }}
    >
      {isBurnerOn && (
        <img
          src={flameImage}
          alt="Gas burner flame"
          className="flame-graphic"
          style={{
            filter: glowEnabled ? flameFilter : 'none',
            animationDuration: glowEnabled ? flameAnimationDuration : '0s'
          }}
        />
      )}
    </div>
  )
}

export default BurnerFlame
