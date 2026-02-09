// NOTE: Read the header comments before editing. Reassess splitting into subcomponents when adding new items or behaviors.
import { useCallback } from 'react'

export function useBoilingDetection({
  activeExperiment,
  activeFluid,
  activeLevel,
  altitude,
  boilingPoint,
  burnerHeat,
  canBoil,
  fluidProps,
  hasBoiledBefore,
  hasShownBoilPopup,
  isBoiling,
  locationName,
  roomAlerts,
  roomControlsEnabled,
  roomState,
  setBoilStats,
  setBoilTime,
  setBurnerHeatWhenBoiled,
  setHasBoiledBefore,
  setHasShownBoilPopup,
  setIsBoiling,
  setPauseTime,
  setShowHook,
  setShowSelectors,
  timePotOnFlame
}) {
  const handleBoilingState = useCallback((newState, context) => {
    if (newState.isBoiling && !isBoiling && !hasShownBoilPopup) {
      setIsBoiling(true)
      setHasShownBoilPopup(true)
      setShowHook(true)
      setPauseTime(true)

      const elapsedBoilTime = timePotOnFlame !== null ? timePotOnFlame + context.deltaTime : 0
      setBoilTime(elapsedBoilTime)
      setBurnerHeatWhenBoiled(burnerHeat)

      setBoilStats({
        temperature: newState.temperature,
        boilingPoint: boilingPoint,
        boilingPointSeaLevel: fluidProps?.boilingPointSeaLevel ?? null,
        altitude: altitude,
        locationName: locationName,
        fluidName: fluidProps?.name || 'Fluid',
        fluidId: activeFluid,
        timeToBoil: elapsedBoilTime,
        burnerHeat: burnerHeat,
        experiment: activeExperiment,
        level: activeLevel,
        roomData: roomControlsEnabled ? {
          initialComposition: roomState?.initialComposition || null,
          finalComposition: roomState?.composition || null,
          initialTemperature: roomState?.initialTemperature || null,
          finalTemperature: roomState?.temperature || null,
          energyTotals: roomState?.energyTotals || null,
          exposureEvents: roomState?.exposureEvents || [],
          alerts: roomAlerts || []
        } : null
      })

      if (activeExperiment === 'boiling-water' && !hasBoiledBefore) {
        setHasBoiledBefore(true)
        setShowSelectors(true)
      }
    }

    if (canBoil && newState.temperature < boilingPoint && isBoiling) {
      setIsBoiling(false)
    }

    if (!canBoil && isBoiling) {
      setIsBoiling(false)
    }
  }, [activeExperiment, activeFluid, activeLevel, altitude, boilingPoint, burnerHeat, canBoil, fluidProps?.boilingPointSeaLevel, fluidProps?.name, hasBoiledBefore, hasShownBoilPopup, isBoiling, locationName, roomAlerts, roomControlsEnabled, roomState?.composition, roomState?.energyTotals, roomState?.exposureEvents, roomState?.initialComposition, roomState?.initialTemperature, roomState?.temperature, setBoilStats, setBoilTime, setBurnerHeatWhenBoiled, setHasBoiledBefore, setHasShownBoilPopup, setIsBoiling, setPauseTime, setShowHook, setShowSelectors, timePotOnFlame])

  return {
    handleBoilingState
  }
}

export default useBoilingDetection
