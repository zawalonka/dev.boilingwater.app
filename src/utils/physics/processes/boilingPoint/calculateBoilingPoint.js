/**
 * CALCULATE BOILING POINT
 * =======================
 * 
 * This process answers the question:
 * "At what temperature will this liquid boil at this altitude?"
 * 
 * FORMULA CHAIN:
 * 1. ISA Atmosphere   → altitude (m) → pressure (Pa)
 * 2. Antoine Equation → pressure (Pa) → base boiling point (°C)
 * 3. Dynamic Kb       → base BP → temperature-dependent Kb
 * 4. Ebullioscopy     → Kb, molality, van't Hoff → elevation (°C)
 * 5. Final BP = base BP + elevation
 * 
 * SEE STUB FILES IN THIS FOLDER:
 *   _isaAtmosphere.js   - Altitude to pressure conversion
 *   _antoineEquation.js - Pressure to temperature conversion
 *   _dynamicKb.js       - Temperature-dependent ebullioscopic constant
 *   _ebullioscopy.js    - Boiling point elevation for mixtures
 * 
 * INPUT:
 *   altitude (meters above sea level)
 *   fluidProps (substance properties from JSON)
 * 
 * OUTPUT:
 *   { temperature, isExtrapolated, verifiedRange, baseBoilingPoint, elevation }
 */

import { ATMOSPHERE } from '../../../../constants/physics.js'

// Import formulas through stubs (for traceability)
import { calculatePressureISA } from './_isaAtmosphere.js'
import { solveAntoineForTemperature } from './_antoineEquation.js'
import { calculateDynamicKb } from './_dynamicKb.js'
import { calculateBoilingPointElevation } from './_ebullioscopy.js'

/**
 * Calculate the boiling point of a fluid at a given altitude
 * 
 * @param {number} altitude - Altitude in meters above sea level
 * @param {object} fluidProps - Fluid properties containing:
 *   - boilingPointSeaLevel: °C at sea level (required)
 *   - antoineCoefficients: {A, B, C, TminC, TmaxC} (optional, for accuracy)
 *   - vanHoffFactor: i factor for electrolytes (optional)
 *   - molality: mol solute / kg solvent (optional)
 *   - altitudeLapseRate: °C/m fallback rate (optional)
 * @returns {object} { temperature, isExtrapolated, verifiedRange, baseBoilingPoint, elevation }
 */
export function calculateBoilingPoint(altitude, fluidProps) {
  if (!fluidProps || !Number.isFinite(fluidProps.boilingPointSeaLevel)) {
    return null
  }
  
  // Safety: treat invalid altitude as sea level
  if (altitude === null || altitude === undefined || Number.isNaN(altitude)) {
    altitude = 0
  }
  
  // STEP 1: Calculate atmospheric pressure at altitude (ISA model)
  const atmosphericPressure = calculatePressureISA(altitude)
  
  // STEP 2: Use Antoine equation if available (highly accurate, ±0.5°C)
  if (fluidProps.antoineCoefficients) {
    const antoineResult = solveAntoineForTemperature(
      atmosphericPressure, 
      fluidProps.antoineCoefficients
    )
    
    if (antoineResult && Number.isFinite(antoineResult.temperature)) {
      // STEP 3 & 4: Calculate dynamic boiling point elevation
      const elevation = calculateDynamicElevation(antoineResult.temperature, fluidProps)
      const finalTemp = antoineResult.temperature + elevation
      
      return {
        temperature: finalTemp,
        isExtrapolated: antoineResult.isExtrapolated,
        verifiedRange: antoineResult.verifiedRange,
        baseBoilingPoint: antoineResult.temperature,
        elevation: elevation
      }
    }
  }
  
  // FALLBACK: Linear lapse rate approximation (±2°C accuracy)
  // Used for substances without Antoine coefficients
  const lapseRate = Number.isFinite(fluidProps.altitudeLapseRate)
    ? fluidProps.altitudeLapseRate
    : ATMOSPHERE.TEMP_LAPSE_RATE
  
  const temperatureDrop = altitude * lapseRate
  const baseBoilingPoint = fluidProps.boilingPointSeaLevel - temperatureDrop
  
  // Calculate dynamic elevation for fallback path
  const elevation = calculateDynamicElevation(baseBoilingPoint, fluidProps)
  const finalTemp = baseBoilingPoint + elevation
  
  return {
    temperature: finalTemp,
    isExtrapolated: false,  // Can't determine without Antoine range
    verifiedRange: { min: null, max: null },
    baseBoilingPoint: baseBoilingPoint,
    elevation: elevation
  }
}

/**
 * Helper: Calculate dynamic boiling point elevation for mixtures
 * Uses dynamic Kb at actual boiling temperature
 * 
 * @param {number} baseBoilingPointC - Base boiling point of pure solvent (°C)
 * @param {object} fluidProps - Fluid properties with vanHoffFactor and molality
 * @returns {number} Boiling point elevation in °C
 */
function calculateDynamicElevation(baseBoilingPointC, fluidProps) {
  if (!fluidProps) return 0
  
  const { vanHoffFactor, molality } = fluidProps
  
  // If we have dynamic parameters, use them
  if (Number.isFinite(vanHoffFactor) && Number.isFinite(molality)) {
    // Calculate Kb at actual boiling temperature
    // TODO: Get solvent molar mass and ΔHvap from JSON for non-water solvents
    const Kb = calculateDynamicKb(baseBoilingPointC)
    return calculateBoilingPointElevation(vanHoffFactor, Kb, molality)
  }
  
  // Legacy fallback: use pre-computed boilingPointElevation if available
  return Number.isFinite(fluidProps.boilingPointElevation) 
    ? fluidProps.boilingPointElevation 
    : 0
}

/**
 * Calculate the boiling point of a fluid at a given pressure
 * 
 * This is useful when you have direct pressure measurements (e.g., room pressure)
 * rather than deriving pressure from altitude.
 * 
 * @param {number} pressurePa - Atmospheric pressure in Pascals
 * @param {object} fluidProps - Fluid properties (same as calculateBoilingPoint)
 * @returns {object} { temperature, isExtrapolated, verifiedRange, baseBoilingPoint, elevation }
 */
export function calculateBoilingPointAtPressure(pressurePa, fluidProps) {
  if (!fluidProps || !Number.isFinite(fluidProps.boilingPointSeaLevel)) {
    return null
  }
  
  // Safety: treat invalid pressure as sea level
  if (!Number.isFinite(pressurePa) || pressurePa <= 0) {
    pressurePa = ATMOSPHERE.SEA_LEVEL_PRESSURE
  }
  
  // Use Antoine equation if available (highly accurate, ±0.5°C)
  if (fluidProps.antoineCoefficients) {
    const antoineResult = solveAntoineForTemperature(
      pressurePa, 
      fluidProps.antoineCoefficients
    )
    
    if (antoineResult && Number.isFinite(antoineResult.temperature)) {
      const elevation = calculateDynamicElevation(antoineResult.temperature, fluidProps)
      const finalTemp = antoineResult.temperature + elevation
      
      return {
        temperature: finalTemp,
        isExtrapolated: antoineResult.isExtrapolated,
        verifiedRange: antoineResult.verifiedRange,
        baseBoilingPoint: antoineResult.temperature,
        elevation: elevation
      }
    }
  }
  
  // FALLBACK: Estimate based on pressure ratio
  // This is less accurate but works for substances without Antoine coefficients
  const pressureRatio = pressurePa / ATMOSPHERE.SEA_LEVEL_PRESSURE
  // Rough approximation: ~3°C drop per 10% pressure reduction
  const temperatureDrop = (1 - pressureRatio) * 30
  const baseBoilingPoint = fluidProps.boilingPointSeaLevel - temperatureDrop
  
  const elevation = calculateDynamicElevation(baseBoilingPoint, fluidProps)
  const finalTemp = baseBoilingPoint + elevation
  
  return {
    temperature: finalTemp,
    isExtrapolated: false,
    verifiedRange: { min: null, max: null },
    baseBoilingPoint: baseBoilingPoint,
    elevation: elevation
  }
}

// Also export the pressure function for direct use
export { calculatePressureISA as calculatePressure }
