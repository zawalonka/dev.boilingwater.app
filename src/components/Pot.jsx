// NOTE: Read the header comments before editing. Reassess splitting into subcomponents when adding new items or behaviors.
import React from 'react'

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

      {steamConfig.enabled && isBoiling && temperature >= boilingPoint && (
        <div className="steam-effect" style={steamStyle}>
          {steamConfig.asset ? (
            <img
              src={steamConfig.asset}
              alt="Steam rising from the pot"
              className="steam-sprite"
              draggable={false}
            />
          ) : (
            steamConfig.symbol || '💨'
          )}
        </div>
      )}
    </div>
  )
}

export default Pot
