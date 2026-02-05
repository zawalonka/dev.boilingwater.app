/**
 * PHYSICS MODULE - PUBLIC API
 * ===========================
 * 
 * This is the main entry point for all physics calculations.
 * Import from here - don't import directly from formulas or processes.
 * 
 * STRUCTURE:
 *   src/utils/physics/
 *   ├── index.js              ← You are here (public API)
 *   ├── formulas/             ← Individual named equations (textbook)
 *   │   ├── antoineEquation.js
 *   │   ├── isaAtmosphere.js
 *   │   ├── dynamicKb.js
 *   │   ├── ebullioscopy.js
 *   │   ├── heatCapacity.js
 *   │   ├── latentHeat.js
 *   │   ├── newtonCooling.js
 *   │   ├── temperatureConversion.js
 *   │   ├── pidController.js      ← Control algorithm for AC/Air Handler
 *   │   └── gasExchange.js        ← Room air mixing physics
 *   └── processes/            ← Orchestrators that chain formulas (lab manual)
 *       ├── boilingPoint/     ← calculateBoilingPoint + stubs
 *       ├── heating/          ← applyHeatEnergy + stubs
 *       ├── simulation/       ← simulateTimeStep + stubs
 *       └── roomControl/      ← applyAcEffect, applyAirHandlerEffect + stubs
 * 
 * USAGE:
 *   import { calculateBoilingPoint, simulateTimeStep } from '../utils/physics'
 *   
 *   const bp = calculateBoilingPoint(5000, fluidProps)  // → 83.3°C
 *   const newState = simulateTimeStep(state, 2000, 0.1, fluidProps)
 * 
 * DESIGN PHILOSOPHY:
 * - Formulas: One file per named equation, heavily commented for education
 * - Processes: Chain formulas together, import through visible stubs
 * - Single source of truth: Edit a formula once, all processes get the fix
 */

// ============================================================
// PROCESSES (Main game functions - import these for simulation)
// ============================================================

export { 
  calculateBoilingPoint,
  calculateBoilingPointAtPressure,
  calculatePressure 
} from './processes/boilingPoint/calculateBoilingPoint.js'

export { 
  applyHeatEnergy,
  calculateHeatingEnergy 
} from './processes/heating/applyHeat.js'

export { 
  simulateTimeStep 
} from './processes/simulation/simulateTimeStep.js'

// Room Control - AC and Air Handler processes
export {
  applyAcEffect,
  calculateRoomAirMass
} from './processes/roomControl/applyAcEffect.js'

export {
  applyAirHandlerEffect
} from './processes/roomControl/applyAirHandlerEffect.js'


// ============================================================
// FORMULAS (Direct access for advanced use or education)
// ============================================================

// Antoine Equation - vapor pressure ↔ temperature
export { 
  solveAntoineForTemperature,
  solveAntoineForPressure 
} from './formulas/antoineEquation.js'

// ISA Atmosphere - altitude ↔ pressure
export { 
  calculatePressureISA,
  calculateTemperatureISA,
  calculateAltitudeFromPressure 
} from './formulas/isaAtmosphere.js'

// Dynamic Kb - temperature-dependent ebullioscopic constant
export { 
  calculateDynamicKb,
  getStandardKb,
  STANDARD_KB_VALUES 
} from './formulas/dynamicKb.js'

// Ebullioscopy - boiling point elevation
export { 
  calculateBoilingPointElevation,
  massPercentToMolality,
  COMMON_SOLUTES 
} from './formulas/ebullioscopy.js'

// Heat Capacity - Q = mcΔT
export { 
  calculateHeatEnergy,
  calculateTempChange,
  calculateHeatingTime,
  calculateEnergyTolerance,
  SPECIFIC_HEAT_VALUES 
} from './formulas/heatCapacity.js'

// Latent Heat - phase change energy
export { 
  calculateVaporizationEnergy,
  calculateVaporizedMass,
  calculateFusionEnergy,
  calculateMeltedMass,
  LATENT_HEAT_VALUES 
} from './formulas/latentHeat.js'

// Newton's Law of Cooling - dT/dt = -k(T - Tambient)
export { 
  calculateEffectiveCoolingCoeff,
  applyCoolingStep,
  temperatureAtTime,
  timeToCool,
  CONVECTIVE_HEAT_TRANSFER 
} from './formulas/newtonCooling.js'

// Temperature Conversion - °C ↔ °F ↔ K
export { 
  celsiusToFahrenheit,
  fahrenheitToCelsius,
  celsiusToKelvin,
  kelvinToCelsius,
  fahrenheitToKelvin,
  kelvinToFahrenheit,
  formatTemperature 
} from './formulas/temperatureConversion.js'

// PID Controller - control algorithm for AC/equipment
export {
  calculatePidOutput,
  createPidState,
  applyDeadband,
  PID_PRESETS
} from './formulas/pidController.js'

// Gas Exchange - room air mixing physics
export {
  calculateExchangeFraction,
  exchangeSpecies,
  exchangeComposition,
  cfmToM3PerHour,
  calculateACH,
  STANDARD_ATMOSPHERES
} from './formulas/gasExchange.js'

// Evaporation - pre-boiling mass transfer and evaporative cooling
// NOTE: simulateEvaporationWithMassTransfer is the preferred method (physically accurate)
// It uses Fuller-Schettler-Giddings diffusion + boundary layer mass transfer
// Hertz-Knudsen functions kept for fallback/reference
export {
  // Mass transfer model (preferred - uses diffusion physics)
  simulateEvaporationWithMassTransfer,
  // Hertz-Knudsen model (fallback - theoretical max rate)
  calculateEvaporationFlux,
  calculateNetEvaporationFlux,
  calculateEvaporatedMass,
  calculateEvaporativeCooling,
  estimatePotSurfaceArea,
  calculatePartialPressure,
  simulateEvaporationStep,
  DEFAULT_EVAPORATION_COEFFICIENT
} from './formulas/evaporation.js'

// Diffusion - Fuller-Schettler-Giddings equation for binary diffusion coefficients
export {
  calculateDiffusionCoefficient,
  calculateDiffusionInAir,
  calculateDiffusionVolumeSum,
  AIR_DIFFUSION_VOLUME,
  AIR_MOLAR_MASS
} from './formulas/diffusion.js'

// Mass Transfer - boundary layer correlations
export {
  calculateMassTransferCoefficient,
  calculateEvaporationMass,
  calculateSherwoodNumber,
  airKinematicViscosity
} from './formulas/massTransfer.js'
