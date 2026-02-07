import { simulateTimeStep } from '../utils/physics'

let cachedFluidProps = null

self.onmessage = (event) => {
  const payload = event.data
  if (!payload || !payload.type) return

  if (payload.type === 'setFluidProps') {
    cachedFluidProps = payload.fluidProps || null
    return
  }

  if (payload.type === 'step') {
    const { tickId, state, heatInputWatts, deltaTime, ambientTemperature } = payload
    const newState = simulateTimeStep(
      state,
      heatInputWatts,
      deltaTime,
      cachedFluidProps,
      ambientTemperature
    )

    self.postMessage({ type: 'stepResult', tickId, newState })
  }
}
