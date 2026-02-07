// NOTE: Read the header comments before editing. Reassess splitting into subcomponents when adding new items or behaviors.
/**
 * WaterStream Component
 *
 * Renders the water stream or ambient boiling steam near the faucet.
 */

function WaterStream({
  showWaterStream,
  showAmbientSteam,
  layout,
  fluidProps
}) {
  if (!showWaterStream && !showAmbientSteam) return null

  const waterStreamStartX = layout.waterStream.start.xPercent
  const waterStreamStartY = layout.waterStream.start.yPercent
  const waterStreamEndY = layout.waterStream.end.yPercent
  const waterStreamHeight = waterStreamEndY - waterStreamStartY

  return (
    <>
      {showWaterStream && (
        <div
          className="water-stream"
          style={{
            left: `${waterStreamStartX}%`,
            top: `${waterStreamStartY}%`,
            width: `${layout.waterStream.widthPercent}%`,
            height: `${waterStreamHeight}%`
          }}
        />
      )}

      {showAmbientSteam && fluidProps && (
        <div
          className="ambient-boil-steam"
          style={{
            left: `${waterStreamStartX}%`,
            top: `${waterStreamStartY}%`,
            width: `${layout.waterStream.widthPercent}%`,
            height: `${waterStreamHeight}%`,
            backgroundColor: fluidProps.color?.gas || 'rgba(200, 230, 255, 0.4)',
            opacity: 0.6
          }}
        />
      )}
    </>
  )
}

export default WaterStream
