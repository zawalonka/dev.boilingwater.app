// NOTE: Read the header comments before editing. Reassess splitting into subcomponents when adding new items or behaviors.
/**
 * useRoomSimulation Hook
 *
 * Drives the room environment simulation loop.
 */

import { useEffect, useRef } from 'react'

export function useRoomSimulation({
  enabled,
  roomConfig,
  timeSpeed,
  pauseTime,
  updateRoom,
  timeStepMs
}) {
  const lastRoomTickRef = useRef(null)

  useEffect(() => {
    if (!enabled || !roomConfig) return

    const roomSimRef = setInterval(() => {
      const now = performance.now()
      if (pauseTime) {
        lastRoomTickRef.current = now
        return
      }
      const lastTick = lastRoomTickRef.current ?? now
      lastRoomTickRef.current = now
      const deltaTime = ((now - lastTick) / 1000) * timeSpeed

      updateRoom(deltaTime, null, 0)
    }, timeStepMs)

    return () => clearInterval(roomSimRef)
  }, [enabled, pauseTime, roomConfig, timeSpeed, timeStepMs, updateRoom])
}

export default useRoomSimulation
