// NOTE: Read the header comments before editing. Reassess splitting into subcomponents when adding new items or behaviors.
import SteamEffect from './SteamEffect'

function Pot({
  potRef,
  isDragging,
  liquidMass,
  potPosition,
  layout,
  potFullImage,
  potEmptyImage,
  steamConfig,
  steamStyle,
  isBoiling,
  temperature,
  boilingPoint,
  onPointerDown,
  onPointerMove,
  onPointerUp
}) {
  const showSteam = steamConfig.enabled && isBoiling && temperature >= boilingPoint

  return (
    <div
      ref={potRef}
      className={`pot-draggable ${isDragging ? 'dragging' : ''} ${liquidMass > 0 ? 'filled' : 'empty'}`}
      style={{
        left: `${potPosition.x}%`,
        top: `${potPosition.y}%`,
        width: `${layout.pot.sizePercent}%`,
        height: `${layout.pot.sizePercent}%`,
        touchAction: 'none'
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onDragStart={(e) => e.preventDefault()}
    >
      <img
        src={liquidMass > 0 ? potFullImage : potEmptyImage}
        alt={liquidMass > 0 ? 'Pot filled with liquid' : 'Empty pot'}
        className="pot-image"
        draggable={false}
      />

      <SteamEffect
        enabled={showSteam}
        style={steamStyle}
        asset={steamConfig.asset}
        symbol={steamConfig.symbol}
      />
    </div>
  )
}

export default Pot
