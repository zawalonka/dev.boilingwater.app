/**
 * SUBSTANCE LOADER UTILITY
 * 
 * Loads substance property definitions from the new periodic-table-driven architecture:
 * - Elements: src/data/substances/periodic-table/{id}.json
 * - Compounds: src/data/substances/compounds/{id}/info.json + {phase}/state.json
 * - Mixtures: src/data/substances/compounds/{id}/info.json + {phase}/state.json
 * 
 * The physics engine consumes the assembled fluidProps object with ALL values
 * loaded from JSON (no hardcoded substance values in physics.js).
 * 
 * To add a new substance:
 * 1. Create compound info: src/data/substances/compounds/{id}/info.json
 * 2. Create phase states: src/data/substances/compounds/{id}/{phase}/state.json (solid/liquid/gas)
 * 3. Reference elements in compounds that exist in periodic-table/
 * 4. Use: const props = await loadSubstancePhase('h2o', 'liquid')
 */

/**
 * Load a compound's complete metadata (info.json)
 * 
 * @param {string} compoundId - The compound identifier (e.g., 'h2o', 'saltwater-3pct')
 * @returns {Promise<Object>} Compound metadata including elements and phase transitions
 * @throws {Error} If compound file not found or invalid JSON
 */
async function loadCompound(compoundId) {
  try {
    const data = await import(/* @vite-ignore */`../data/substances/compounds/${compoundId}/info.json`, { assert: { type: 'json' } })
    return data.default || data
  } catch (error) {
    console.error(`Failed to load compound "${compoundId}":`, error)
    throw new Error(`Compound "${compoundId}" not found. Check src/data/substances/compounds/${compoundId}/info.json`)
  }
}

/**
 * Load a specific phase state for a substance (solid/liquid/gas)
 * Pulls all thermodynamic data from the phase file
 * 
 * @param {string} compoundId - The compound identifier (e.g., 'h2o')
 * @param {string} phase - The phase ('solid', 'liquid', or 'gas')
 * @returns {Promise<Object>} Phase state data with all properties
 * @throws {Error} If phase file not found or invalid JSON
 */
async function loadPhaseState(compoundId, phase) {
  try {
    const data = await import(/* @vite-ignore */`../data/substances/compounds/${compoundId}/${phase}/state.json`, { assert: { type: 'json' } })
    return data.default || data
  } catch (error) {
    console.error(`Failed to load phase "${phase}" for compound "${compoundId}":`, error)
    throw new Error(`Phase "${phase}" not found for "${compoundId}". Check src/data/substances/compounds/${compoundId}/${phase}/state.json`)
  }
}

/**
 * Load a complete substance definition (compound + specific phase)
 * Returns the raw JSON data structure; use parseSubstanceProperties() to extract physics values
 * 
 * @param {string} substanceId - The compound identifier (e.g., 'h2o')
 * @param {string} phase - The phase to load ('liquid' by default, can be 'solid' or 'gas')
 * @returns {Promise<Object>} Complete substance data with compound metadata and phase properties
 * @throws {Error} If substance or phase not found
 */
export async function loadSubstance(substanceId, phase = 'liquid') {
  try {
    const compound = await loadCompound(substanceId)
    const phaseState = await loadPhaseState(substanceId, phase)
    
    // Merge compound metadata with phase-specific properties
    return {
      ...compound,
      phaseState,
      currentPhase: phase
    }
  } catch (error) {
    console.error(`Failed to load substance "${substanceId}" phase "${phase}":`, error)
    throw error
  }
}

/**
 * Extract physics-engine-ready values from loaded substance data
 * All thermodynamic values come from the JSON files (NO hardcoded values in physics.js)
 * 
 * STRUCTURE:
 * - Identification: id, name, formula from compound info.json
 * - Boiling point data: from compound info.json phaseTransitions
 * - Thermodynamic data: from phase state.json (density, specific heat, latent heat, etc.)
 * - Cooling model: Default cooling coefficient (can be overridden per phase in future)
 * 
 * @param {Object} substanceData - Complete substance data from loadSubstance()
 * @returns {Object} Simplified object ready for physics calculations
 */
export function parseSubstanceProperties(substanceData) {
  const compound = substanceData  // Merge happened in loadSubstance
  const phaseState = substanceData.phaseState
  const currentPhase = substanceData.currentPhase
  
  // Extract phase-specific numeric values (density, specific heat, etc.)
  // Handle nested structure: { value: 1.0, unit: 'kg/L' } OR flat { density: 1.0 }
  const extractValue = (obj) => obj?.value !== undefined ? obj.value : obj
  
  return {
    // Identification (from compound metadata)
    id: compound.id,
    name: compound.name,
    formula: compound.chemicalFormula,
    currentPhase: currentPhase,
    
    // Phase transition temperatures (from compound info.json)
    boilingPointSeaLevel: compound.phaseTransitions?.boilingPoint || 100,
    meltingPoint: compound.phaseTransitions?.meltingPoint || 0,
    triplePoint: compound.phaseTransitions?.triplePoint,
    criticalPoint: compound.phaseTransitions?.criticalPoint,
    
    // Altitude lapse rate (linear approximation for boiling point)
    // Formula: ΔTb = altitude × lapse_rate (°C per meter)
    // For water: ~0.00333°C/meter (roughly 1°C per 300m)
    altitudeLapseRate: 0.00333,  // Will be substance-specific in future
    
    // Thermodynamic properties (extracted from phase state.json)
    specificHeat: extractValue(phaseState.specificHeat),  // J/(g·°C)
    heatOfVaporization: extractValue(phaseState.latentHeatOfVaporization),  // kJ/kg
    heatOfFusion: extractValue(phaseState.latentHeatOfFusion),  // kJ/kg
    density: extractValue(phaseState.density),  // kg/L
    thermalConductivity: extractValue(phaseState.thermalConductivity),  // W/(m·K)
    
    // Cooling model: Default coefficient (0.0015 for water)
    // In future, can be loaded from phase state per substance
    coolingCoefficient: 0.0015,  // 1/s (default for water-like fluids)
    
    // Optional advanced properties for chemistry students
    molarMass: compound.molarMass,
    electricalConductivity: extractValue(phaseState.electricalConductivity),  // S/m
    vanThoffFactor: extractValue(phaseState.vanThoffFactor),  // i (dimensionless)
    saturationPoint: extractValue(phaseState.saturationPoint),  // g/L
    
    // Antoine coefficients (if available for vapor pressure calculations)
    antoineCoefficients: phaseState.antoineCoefficients,
    
    // Compressibility (for altitude/pressure effects)
    compressibility: extractValue(phaseState.compressibility),  // 1/Pa
    volumetricExpansionCoefficient: extractValue(phaseState.volumetricExpansionCoefficient),  // 1/K
    
    // Metadata
    metadata: compound.metadata,
    lastUpdated: compound.lastUpdated
  }
}

/**
 * List all available compounds
 * Returns compound IDs that can be loaded
 * 
 * @returns {Array<string>} Array of compound IDs
 */
export function getAvailableSubstances() {
  // Hardcoded list; in future, could scan manifest or directory
  return [
    'h2o',
    'saltwater-3pct',
    'ethanol',
    'ammonia',
    'acetone',
    'acetic-acid',
    'hydrogen-peroxide',
    'methane',
    'propane',
    'isopropyl-alcohol',
    'glycerin',
    'sucrose'
  ]
}

/**
 * Default substance for game startup
 * Used if no explicit substance selection is made
 */
export const DEFAULT_SUBSTANCE = 'h2o'

/**
 * Backward compatibility: Legacy function names
 * These maintain the old API for gradual migration
 */
export const loadFluid = loadSubstance
export const parseFluidProperties = parseSubstanceProperties
export const getAvailableFluids = getAvailableSubstances
export const DEFAULT_FLUID = DEFAULT_SUBSTANCE
