// NOTE: Read the header comments before editing. Reassess splitting into subcomponents when adding new items or behaviors.
import { useCallback, useEffect, useRef } from 'react'
import { simulateTimeStep } from '../utils/physics'

export function useGamePhysics({
  altitude,
  ambientTemperature,
  burnerHeat,
  fluidProps,
  layout,
  liquidMass,
  pauseTime,
  potPosition,
  residueMass,
  temperature,
  timeSpeed,
  timeStepMs,
  waterInPot,
  wattageSteps,
  onApplySimulationResult,
  timePotOnFlame,
  setTimePotOnFlame
}) {
  const simulationRef = useRef(null)
  const workerRef = useRef(null)
  const workerHandlerRef = useRef(null)
  const inFlightTickRef = useRef(false)
  const tickCounterRef = useRef(0)
  const pendingTicksRef = useRef(new Map())
  const workerQueueRef = useRef([])
  const lastWorkerWarnRef = useRef(0)
  const lastPhysicsTickRef = useRef(null)
  const WORKER_QUEUE_WARN_LIMIT = 20
  const WORKER_QUEUE_WARN_COOLDOWN_MS = 2000

  useEffect(() => {
    if (!window.Worker) return
    const worker = new Worker(new URL('../workers/physicsWorker.js', import.meta.url), { type: 'module' })
    workerRef.current = worker

    worker.onmessage = (event) => {
      workerHandlerRef.current?.(event.data)
    }

    worker.onerror = (error) => {
      console.error('Physics worker error:', error)
    }

    return () => {
      worker.terminate()
      workerRef.current = null
    }
  }, [])

  useEffect(() => {
    const worker = workerRef.current
    if (!worker) return
    worker.postMessage({ type: 'setFluidProps', fluidProps })
  }, [fluidProps])

  const dispatchWorkerStep = useCallback((state, request) => {
    const worker = workerRef.current
    if (!worker) return false

    const tickId = tickCounterRef.current + 1
    tickCounterRef.current = tickId

    const context = {
      deltaTime: request.deltaTime,
      heatInputWatts: request.heatInputWatts,
      prevWaterMass: state.waterMass
    }

    pendingTicksRef.current.set(tickId, context)
    inFlightTickRef.current = true

    worker.postMessage({
      type: 'step',
      tickId,
      state: {
        waterMass: state.waterMass,
        temperature: state.temperature,
        altitude: request.altitude,
        residueMass: request.residueMass
      },
      heatInputWatts: request.heatInputWatts,
      deltaTime: request.deltaTime,
      ambientTemperature: request.ambientTemperature
    })

    return true
  }, [])

  const handleWorkerMessage = useCallback((payload) => {
    if (!payload || payload.type !== 'stepResult') return
    const context = pendingTicksRef.current.get(payload.tickId)
    if (!context) return

    pendingTicksRef.current.delete(payload.tickId)
    inFlightTickRef.current = false
    onApplySimulationResult(payload.newState, context)

    const nextRequest = workerQueueRef.current.shift()
    if (nextRequest) {
      dispatchWorkerStep(payload.newState, nextRequest)
    }
  }, [dispatchWorkerStep, onApplySimulationResult])

  useEffect(() => {
    workerHandlerRef.current = handleWorkerMessage
  }, [handleWorkerMessage])

  useEffect(() => {
    if (liquidMass <= 0 || !fluidProps) return

    const flameX = layout.flame.xPercent
    const flameY = layout.flame.yPercent
    const heatActivationRadius = layout.flame.activationRadius

    simulationRef.current = setInterval(() => {
      const now = performance.now()
      if (pauseTime) {
        lastPhysicsTickRef.current = now
        return
      }

      const lastTick = lastPhysicsTickRef.current ?? now
      lastPhysicsTickRef.current = now
      const deltaTime = ((now - lastTick) / 1000) * timeSpeed

      const deltaX = Math.abs(potPosition.x - flameX)
      const deltaY = Math.abs(potPosition.y - flameY)
      const distanceToFlame = Math.sqrt(deltaX * deltaX + deltaY * deltaY)

      const potOverFlame = distanceToFlame <= heatActivationRadius

      let heatInputWatts = 0
      if (burnerHeat > 0 && potOverFlame) {
        const heatLevels = wattageSteps
        heatInputWatts = heatLevels[burnerHeat] || 0

        if (timePotOnFlame === null) {
          setTimePotOnFlame(0)
        } else {
          setTimePotOnFlame((prev) => (prev ?? 0) + deltaTime)
        }
      } else if (timePotOnFlame !== null) {
        setTimePotOnFlame(null)
      }

      const request = {
        deltaTime,
        heatInputWatts,
        altitude,
        residueMass,
        ambientTemperature
      }

      const worker = workerRef.current
      if (worker) {
        if (inFlightTickRef.current) {
          workerQueueRef.current.push(request)
          if (workerQueueRef.current.length >= WORKER_QUEUE_WARN_LIMIT) {
            const now = Date.now()
            if (now - lastWorkerWarnRef.current >= WORKER_QUEUE_WARN_COOLDOWN_MS) {
              lastWorkerWarnRef.current = now
              console.warn(
                `Physics worker backlog: ${workerQueueRef.current.length} ticks queued. Simulation is slowing down to keep physics consistent.`
              )
            }
          }
          return
        }
        const state = {
          waterMass: waterInPot,
          temperature: temperature,
          altitude: altitude,
          residueMass: residueMass
        }
        dispatchWorkerStep(state, request)
        return
      }

      const newState = simulateTimeStep(
        {
          waterMass: waterInPot,
          temperature: temperature,
          altitude: altitude,
          residueMass: residueMass
        },
        heatInputWatts,
        deltaTime,
        fluidProps,
        ambientTemperature
      )

      onApplySimulationResult(newState, {
        deltaTime,
        heatInputWatts,
        prevWaterMass: waterInPot
      })
    }, timeStepMs)

    return () => {
      if (simulationRef.current) {
        clearInterval(simulationRef.current)
      }
    }
  }, [altitude, ambientTemperature, burnerHeat, dispatchWorkerStep, fluidProps, layout.flame.activationRadius, layout.flame.xPercent, layout.flame.yPercent, liquidMass, onApplySimulationResult, pauseTime, potPosition.x, potPosition.y, residueMass, setTimePotOnFlame, temperature, timePotOnFlame, timeSpeed, timeStepMs, waterInPot, wattageSteps])
}

export default useGamePhysics
