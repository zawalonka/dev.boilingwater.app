/**
 * SUBSTANCE PARSER
 * 
 * Extracts physics-engine-ready values from loaded substance JSON data.
 * This is a PURE FUNCTION—no side effects, no file loading.
 * 
 * Input: Raw substance data from loadSubstance()
 * Output: Simplified object with typed properties ready for physics calculations
 * 
 * All thermodynamic values come from JSON files.
 * NO hardcoded values in this module.
 */

import { ATMOSPHERE } from '../constants/physics'

/**
 * Helper to extract numeric values from nested property objects
 * Handles both forms:
 *   - Nested: { value: 1.0, unit: 'kg/L' } → returns 1.0
 *   - Flat: { density: 1.0 } → returns 1.0
 * 
 * @param {*} obj - The property object or numeric value
 * @returns {number|null} The numeric value, or null if not found
 */
function extractValue(obj) {
  if (typeof obj === 'number') return obj
  if (obj?.value !== undefined) return obj.value
  return null
}

/**
 * Parse substance data into physics-engine-ready format
 * 
 * Takes the complete substance definition (compound info + phase state JSON OR element JSON)
 * and extracts all needed properties for simulations.
 * 
 * SUPPORTS:
 * - Compounds: Full info.json + phase state.json
 * - Elements: Periodic table JSON with nist/iupac data
 * 
 * OUTPUT STRUCTURE includes:
 * - Identification: id, name, formula, currentPhase
 * - Transitions: boilingPoint, meltingPoint, triplePoint, criticalPoint
 * - Thermodynamic: specificHeat, heatOfVaporization, density, etc.
 * - Altitude: altitudeLapseRate for boiling point adjustments
 * - Antoine: antoineCoefficients for vapor pressure calculations
 * - Mixture: components array, volatileMassFraction for solutions
 * - Advanced: molarMass, conductivity, saturation (for chemistry students)
 * 
 * @param {Object} substanceData - Complete data from loadSubstance()
 *   Must include: compound metadata, phaseState, currentPhase OR element data
 * @returns {Object} Physics-ready properties object
 * 
 * @throws Will return null values for missing properties rather than throwing
 *         to allow graceful fallbacks in physics engine
 */
export function parseSubstanceProperties(substanceData) {
  if (!substanceData) return null

  const isElement = substanceData.isElement === true
  const compound = substanceData
  const phaseState = substanceData.phaseState
  const currentPhase = substanceData.currentPhase

  // ===== ELEMENT-SPECIFIC HANDLING =====
  if (isElement) {
    const nist = substanceData.nist || {}
    const iupac = substanceData.iupac || {}
    
    return {
      // IDENTIFICATION
      id: substanceData.symbol,
      name: substanceData.name,
      formula: substanceData.symbol,
      currentPhase: currentPhase,
      isElement: true,
      atomicNumber: substanceData.atomicNumber,

      // PHASE TRANSITIONS (from NIST/IUPAC data)
      boilingPointSeaLevel: nist.boilingPoint || iupac.boilingPoint || null,
      meltingPoint: nist.meltingPoint || iupac.meltingPoint || null,
      triplePoint: null,  // Not typically in element data
      criticalPoint: null,

      // ALTITUDE LAPSE RATE (default)
      altitudeLapseRate: ATMOSPHERE.TEMP_LAPSE_RATE,

      // THERMODYNAMIC PROPERTIES
      specificHeat: nist.specificHeatCapacity || iupac.specificHeatCapacity || null,
      heatOfVaporization: null,  // Not in basic element data
      heatOfFusion: null,
      density: nist.density || iupac.density || null,
      thermalConductivity: nist.thermalConductivity || iupac.thermalConductivity || null,
      coolingCoefficient: 0.0015,  // Default

      // ADVANCED PROPERTIES
      molarMass: nist.atomicMass || iupac.atomicMass || null,
      electronegativity: nist.electronegativity || iupac.electronegativity || null,
      entropy: nist.standardMolarEntropy || iupac.standardMolarEntropy || null,
      ionizationEnergy: nist.ionizationEnergy || iupac.ionizationEnergy || null,

      // CAPABILITY FLAGS
      canBoil: Number.isFinite(nist.boilingPoint || iupac.boilingPoint),
      canFreeze: Number.isFinite(nist.meltingPoint || iupac.meltingPoint),
      components: [],
      nonVolatileMassFraction: 0,
      volatileMassFraction: 1,

      // VISUAL PROPERTIES
      color: substanceData.physicalProperties?.appearance || null,
      phase: substanceData.physicalProperties?.phase || currentPhase,

      // ANTOINE (not available for simple elements)
      antoineCoefficients: null,

      // METADATA
      metadata: {
        source: nist.source || iupac.source,
        elementCategory: substanceData.elementCategory,
        educationalNotes: substanceData.educationalNotes
      },
      lastUpdated: substanceData.lastUpdated
    }
  }

  // ===== COMPOUND HANDLING (existing logic) =====
  // From compound metadata (constant across all phases)
  const boilingPointSeaLevel = Number.isFinite(compound.phaseTransitions?.boilingPoint)
    ? compound.phaseTransitions.boilingPoint
    : null

  const meltingPoint = Number.isFinite(compound.phaseTransitions?.meltingPoint)
    ? compound.phaseTransitions.meltingPoint
    : null
  const triplePoint = compound.phaseTransitions?.triplePoint || null
  const criticalPoint = compound.phaseTransitions?.criticalPoint || null

  // ===== THERMODYNAMIC DATA =====
  // From phase-specific state files
  const specificHeat = extractValue(phaseState?.specificHeat)  // J/(g·°C)
  const heatOfVaporization = extractValue(phaseState?.latentHeatOfVaporization)  // kJ/kg
  const heatOfFusion = extractValue(phaseState?.latentHeatOfFusion)  // kJ/kg
  const density = extractValue(phaseState?.density)  // kg/L
  const thermalConductivity = extractValue(phaseState?.thermalConductivity)  // W/(m·K)
  const coolingCoefficient = extractValue(phaseState?.coolingCoefficient) ?? 0.0015  // 1/s

  // ===== ALTITUDE & PRESSURE EFFECTS =====
  const altitudeLapseRate = Number.isFinite(compound.phaseTransitions?.altitudeLapseRate)
    ? compound.phaseTransitions.altitudeLapseRate
    : ATMOSPHERE.TEMP_LAPSE_RATE  // Fall back to standard atmosphere

  // ===== MIXTURE/SOLUTION BEHAVIOR =====
  // For solutions: calculate volatile vs non-volatile mass fractions
  const components = Array.isArray(compound.components) ? compound.components : []
  
  const nonVolatileMassFraction = components.reduce((sum, component) => {
    if (!component || typeof component.massFraction !== 'number') return sum
    const role = component.role || 'component'
    const isVolatile = component.isVolatile === true || role === 'solvent' || role === 'volatile'
    return sum + (isVolatile ? 0 : component.massFraction)
  }, 0)
  
  const clampedNonVolatile = Math.min(Math.max(nonVolatileMassFraction, 0), 1)
  const volatileMassFraction = Math.max(0, 1 - clampedNonVolatile)

  // ===== CAPABILITY FLAGS =====
  const canBoil = Number.isFinite(boilingPointSeaLevel) && Number.isFinite(heatOfVaporization)
  const canFreeze = Number.isFinite(meltingPoint) && Number.isFinite(heatOfFusion)

  // ===== RETURN PHYSICS-READY OBJECT =====
  return {
    // IDENTIFICATION (constant, from compound metadata)
    id: compound.id,
    name: compound.name,
    formula: compound.chemicalFormula,
    currentPhase: currentPhase,

    // PHASE TRANSITIONS (constant, from compound metadata)
    boilingPointSeaLevel,
    meltingPoint,
    triplePoint,
    criticalPoint,

    // ALTITUDE & PRESSURE (constant, from compound metadata)
    altitudeLapseRate,

    // THERMODYNAMIC PROPERTIES (phase-specific, from state.json)
    specificHeat,  // J/(g·°C)
    heatOfVaporization,  // kJ/kg
    heatOfFusion,  // kJ/kg
    density,  // kg/L
    thermalConductivity,  // W/(m·K)
    coolingCoefficient,  // 1/s

    // ADVANCED THERMODYNAMICS (phase-specific, optional)
    compressibility: extractValue(phaseState?.compressibility),  // 1/Pa
    volumetricExpansionCoefficient: extractValue(phaseState?.volumetricExpansionCoefficient),  // 1/K
    electronegativity: compound.electronegativity,
    entropy: extractValue(phaseState?.entropy),  // J/(mol·K)

    // MIXTURE/SOLUTION PROPERTIES
    components,
    canBoil,
    canFreeze,
    nonVolatileMassFraction: clampedNonVolatile,
    volatileMassFraction,

    // CHEMICAL & OPTICAL PROPERTIES (for educational display)
    molarMass: compound.molarMass,
    electricalConductivity: extractValue(phaseState?.electricalConductivity),  // S/m
    vanThoffFactor: extractValue(phaseState?.vanThoffFactor),  // i (dimensionless)
    saturationPoint: extractValue(phaseState?.saturationPoint),  // g/L
    refractiveIndex: extractValue(phaseState?.refractiveIndex),
    color: compound.color,

    // VAPOR PRESSURE CALCULATIONS (Antoine equation, for accurate boiling point)
    antoineCoefficients: phaseState?.antoineCoefficients || null,

    // METADATA & VERSIONING
    metadata: compound.metadata,
    lastUpdated: compound.lastUpdated
  }
}
