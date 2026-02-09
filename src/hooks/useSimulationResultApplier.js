// NOTE: Read the header comments before editing. Reassess splitting into subcomponents when adding new items or behaviors.
/**
 * useSimulationResultApplier Hook
 *
 * Applies physics simulation results and handles room/vapor side effects.
 */

import { useCallback } from 'react'
import { solveAntoineForPressure, simulateEvaporationWithMassTransfer } from '../utils/physics'
import { getAtmosphereKey } from '../utils/roomEnvironment'

export function useSimulationResultApplier({
  activeFluid,
  fluidProps,
  roomControlsEnabled,
  roomConfig,
  roomState,
  updateRoom,
  addVapor,
  isTimerRunning,
  setTimeElapsed,
  setTemperature,
  setWaterInPot,
  handleBoilingState
}) {
  return useCallback((newState, context) => {
    setTemperature(newState.temperature)
    setWaterInPot(newState.waterMass)

    if (roomControlsEnabled && roomConfig) {
      if (context.heatInputWatts > 0) {
        updateRoom(context.deltaTime, 'experiment_burner', context.heatInputWatts)
      }

      if (!newState.isBoiling && fluidProps?.antoineCoefficients && newState.waterMass > 0) {
        const vaporPressure = solveAntoineForPressure(newState.temperature, fluidProps.antoineCoefficients)

        if (vaporPressure && vaporPressure > 0) {
          const atmosphereKey = getAtmosphereKey(activeFluid, fluidProps)
          const roomComposition = roomState?.composition || {}
          const totalPressure = roomState?.pressure || 101325
          const partialPressure = (roomComposition[atmosphereKey] || 0) * totalPressure

          const evapResult = simulateEvaporationWithMassTransfer({
            liquidTempC: newState.temperature,
            liquidMassKg: newState.waterMass,
            vaporPressurePa: vaporPressure,
            pressurePa: totalPressure,
            molarMassGmol: fluidProps.molarMass || 18.015,
            latentHeatKJ: fluidProps.heatOfVaporization || 2257,
            specificHeatJgC: fluidProps.specificHeat || 4.186,
            potDiameterM: 0.2,
            partialPressurePa: partialPressure,
            diffusionVolumeSum: fluidProps.diffusionVolumeSum,
            deltaTimeS: context.deltaTime
          })

          if (evapResult.massEvaporatedKg > 1e-9) {
            const finalTemp = newState.temperature + evapResult.tempChangeC
            setTemperature(finalTemp)
            setWaterInPot(evapResult.newMassKg)

            addVapor(
              activeFluid,
              evapResult.massEvaporatedKg,
              fluidProps?.molarMass || 18.015,
              fluidProps?.chemicalFormula
            )
          }
        }
      }

      if (newState.isBoiling && newState.waterMass < context.prevWaterMass) {
        const evaporatedMass = context.prevWaterMass - newState.waterMass
        addVapor(activeFluid, evaporatedMass, fluidProps?.molarMass || 18.015, fluidProps?.chemicalFormula)
      }
    }

    if (isTimerRunning) {
      setTimeElapsed((prev) => prev + context.deltaTime)
    }

    handleBoilingState(newState, context)
  }, [activeFluid, addVapor, fluidProps, handleBoilingState, isTimerRunning, roomConfig, roomControlsEnabled, roomState, setTemperature, setTimeElapsed, setWaterInPot, updateRoom])
}

export default useSimulationResultApplier
