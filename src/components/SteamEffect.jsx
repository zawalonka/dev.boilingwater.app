// NOTE: Read the header comments before editing. Reassess splitting into subcomponents when adding new items or behaviors.
/**
 * SteamEffect Component
 *
 * Renders the steam overlay when boiling.
 */

function SteamEffect({ enabled, style, asset, symbol }) {
  if (!enabled) return null

  return (
    <div className="steam-effect" style={style}>
      {asset ? (
        <img
          src={asset}
          alt="Steam rising from the pot"
          className="steam-sprite"
          draggable={false}
        />
      ) : (
        symbol || '💨'
      )}
    </div>
  )
}

export default SteamEffect
