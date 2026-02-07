// NOTE: Read the header comments before editing. Reassess splitting into subcomponents when adding new items or behaviors.
import { useCallback, useState } from 'react'

export function useTimeControls() {
  const [timeSpeed, setTimeSpeed] = useState(1)
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  const [timeElapsed, setTimeElapsed] = useState(0)

  const handleSpeedUp = useCallback(() => {
    setTimeSpeed((current) => {
      if (current < 1) return 0
      if (current === 0) return 1
      const doubled = current * 2
      return doubled <= 65536 ? doubled : 65536
    })
  }, [])

  const handleSpeedDouble = useCallback(() => {
    setTimeSpeed((current) => {
      if (current === 0) return 1
      const doubled = current * 2
      return doubled <= 65536 ? doubled : 65536
    })
  }, [])

  const handleSpeedHalve = useCallback(() => {
    const minSpeed = 1 / 65536
    setTimeSpeed((current) => {
      if (current === 1) return 0
      if (current === 0) return 0.5
      const halved = current / 2
      return halved >= minSpeed ? halved : minSpeed
    })
  }, [])

  const handleQuickPause = useCallback(() => {
    setTimeSpeed((current) => (current === 0 ? 1 : 0))
  }, [])

  const handleTimerToggle = useCallback(() => {
    setIsTimerRunning((prev) => !prev)
  }, [])

  const handleTimerReset = useCallback(() => {
    setTimeElapsed(0)
  }, [])

  return {
    timeSpeed,
    isTimerRunning,
    timeElapsed,
    setTimeElapsed,
    handleSpeedUp,
    handleSpeedDouble,
    handleSpeedHalve,
    handleQuickPause,
    handleTimerToggle,
    handleTimerReset
  }
}

export default useTimeControls
