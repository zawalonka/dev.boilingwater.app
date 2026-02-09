// NOTE: Read the header comments before editing. Reassess splitting into subcomponents when adding new items or behaviors.
/**
 * Boil time utilities
 *
 * Helper calculations for expected and ideal boil time.
 */

export function calculateExpectedBoilTime({
  fluidProps,
  canBoil,
  liquidMass,
  temperature,
  boilingPoint,
  burnerHeat,
  wattageSteps
}) {
  if (!fluidProps || !canBoil || liquidMass === 0 || temperature >= boilingPoint) return null
  const powerWatts = wattageSteps[burnerHeat] || 0
  if (powerWatts === 0) return null

  if (!Number.isFinite(fluidProps.specificHeat)) return null
  const specificHeat = fluidProps.specificHeat * 1000 // Convert J/g to J/kg
  const tempDelta = boilingPoint - temperature
  const energyNeeded = liquidMass * specificHeat * tempDelta // Joules
  const timeSeconds = energyNeeded / powerWatts // Seconds
  return timeSeconds
}

export function calculateIdealBoilTime({
  heatLevel,
  boilPointTarget,
  wattageSteps,
  fluidProps,
  canBoil,
  ambientTemperature,
  defaultWaterMassKg
}) {
  const watts = wattageSteps[heatLevel] || wattageSteps[2]

  if (watts === 0) return null
  if (!fluidProps || !canBoil || !Number.isFinite(boilPointTarget)) return null

  const waterMass = defaultWaterMassKg * 1000 // grams
  if (!Number.isFinite(fluidProps.specificHeat)) return null
  const specificHeat = fluidProps.specificHeat // J/(g·°C)
  const tempDifference = boilPointTarget - ambientTemperature

  const energyNeeded = waterMass * specificHeat * tempDifference // Joules
  const timeSeconds = energyNeeded / watts

  return timeSeconds
}
