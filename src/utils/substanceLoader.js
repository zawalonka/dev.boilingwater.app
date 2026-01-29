import { ATMOSPHERE } from '../constants/physics'

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

// Catalog maps logical ids to categorized folder paths and labels
export const SUBSTANCE_CATALOG = {
  h2o: { path: 'pure/water-h2o', category: 'pure', displayName: 'Water', chemicalName: 'H2O' },
  'saltwater-3pct': { path: 'solutions/saltwater-3pct-nacl', category: 'solution', displayName: 'Saltwater (3% NaCl)', chemicalName: 'NaCl in H2O' },
  ethanol: { path: 'pure/ethanol-c2h5oh', category: 'pure', displayName: 'Ethanol', chemicalName: 'C2H5OH' },
  ammonia: { path: 'pure/ammonia-nh3', category: 'pure', displayName: 'Ammonia', chemicalName: 'NH3' },
  acetone: { path: 'pure/acetone-c3h6o', category: 'pure', displayName: 'Acetone', chemicalName: 'C3H6O' },
  'acetic-acid': { path: 'pure/acetic-acid-ch3cooh', category: 'pure', displayName: 'Acetic Acid', chemicalName: 'CH3COOH' },
  'hydrogen-peroxide': { path: 'pure/hydrogen-peroxide-h2o2', category: 'pure', displayName: 'Hydrogen Peroxide', chemicalName: 'H2O2' },
  methane: { path: 'pure/methane-ch4', category: 'pure', displayName: 'Methane', chemicalName: 'CH4' },
  propane: { path: 'pure/propane-c3h8', category: 'pure', displayName: 'Propane', chemicalName: 'C3H8' },
  'isopropyl-alcohol': { path: 'pure/isopropyl-alcohol-c3h8o', category: 'pure', displayName: 'Isopropyl Alcohol', chemicalName: 'C3H8O' },
  glycerin: { path: 'pure/glycerin-c3h8o3', category: 'pure', displayName: 'Glycerin', chemicalName: 'C3H8O3' },
  sucrose: { path: 'pure/sucrose-c12h22o11', category: 'pure', displayName: 'Sucrose', chemicalName: 'C12H22O11' }
}

function resolveCompoundPath(compoundId) {
  const entry = SUBSTANCE_CATALOG[compoundId]
  return entry?.path || compoundId
}

/**
 * Load a compound's complete metadata (info.json)
 * 
 * @param {string} compoundId - The compound identifier (e.g., 'h2o', 'saltwater-3pct')
 * @returns {Promise<Object>} Compound metadata including elements and phase transitions
 * @throws {Error} If compound file not found or invalid JSON
 */
async function loadCompound(compoundId) {
  try {
    let data
    switch (compoundId) {
      case 'h2o':
        data = await import('../data/substances/compounds/pure/water-h2o/info.json')
        break
      case 'saltwater-3pct':
        data = await import('../data/substances/compounds/solutions/saltwater-3pct-nacl/info.json')
        break
      case 'ethanol':
        data = await import('../data/substances/compounds/pure/ethanol-c2h5oh/info.json')
        break
      case 'ammonia':
        data = await import('../data/substances/compounds/pure/ammonia-nh3/info.json')
        break
      case 'acetone':
        data = await import('../data/substances/compounds/pure/acetone-c3h6o/info.json')
        break
      case 'acetic-acid':
        data = await import('../data/substances/compounds/pure/acetic-acid-ch3cooh/info.json')
        break
      case 'hydrogen-peroxide':
        data = await import('../data/substances/compounds/pure/hydrogen-peroxide-h2o2/info.json')
        break
      case 'methane':
        data = await import('../data/substances/compounds/pure/methane-ch4/info.json')
        break
      case 'propane':
        data = await import('../data/substances/compounds/pure/propane-c3h8/info.json')
        break
      case 'isopropyl-alcohol':
        data = await import('../data/substances/compounds/pure/isopropyl-alcohol-c3h8o/info.json')
        break
      case 'glycerin':
        data = await import('../data/substances/compounds/pure/glycerin-c3h8o3/info.json')
        break
      case 'sucrose':
        data = await import('../data/substances/compounds/pure/sucrose-c12h22o11/info.json')
        break
      default:
        throw new Error(`Unknown compound ID: ${compoundId}`)
    }
    return data.default || data
  } catch (error) {
    console.error(`Failed to load compound "${compoundId}":`, error)
    throw new Error(`Compound "${compoundId}" not found. Check SUBSTANCE_CATALOG.`)
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
    let data
    const key = `${compoundId}-${phase}`
    switch (key) {
      // h2o phases
      case 'h2o-solid':
        data = await import('../data/substances/compounds/pure/water-h2o/solid/state.json')
        break
      case 'h2o-liquid':
        data = await import('../data/substances/compounds/pure/water-h2o/liquid/state.json')
        break
      case 'h2o-gas':
        data = await import('../data/substances/compounds/pure/water-h2o/gas/state.json')
        break
      // saltwater phases (liquid only - does not have gas phase)
      case 'saltwater-3pct-liquid':
        data = await import('../data/substances/compounds/solutions/saltwater-3pct-nacl/liquid/state.json')
        break
      // ethanol phases
      case 'ethanol-liquid':
        data = await import('../data/substances/compounds/pure/ethanol-c2h5oh/liquid/state.json')
        break
      case 'ethanol-gas':
        data = await import('../data/substances/compounds/pure/ethanol-c2h5oh/gas/state.json')
        break
      // ammonia phases
      case 'ammonia-liquid':
        data = await import('../data/substances/compounds/pure/ammonia-nh3/liquid/state.json')
        break
      case 'ammonia-gas':
        data = await import('../data/substances/compounds/pure/ammonia-nh3/gas/state.json')
        break
      // acetone phases
      case 'acetone-liquid':
        data = await import('../data/substances/compounds/pure/acetone-c3h6o/liquid/state.json')
        break
      case 'acetone-gas':
        data = await import('../data/substances/compounds/pure/acetone-c3h6o/gas/state.json')
        break
      // acetic-acid phases
      case 'acetic-acid-liquid':
        data = await import('../data/substances/compounds/pure/acetic-acid-ch3cooh/liquid/state.json')
        break
      case 'acetic-acid-gas':
        data = await import('../data/substances/compounds/pure/acetic-acid-ch3cooh/gas/state.json')
        break
      // hydrogen-peroxide phases
      case 'hydrogen-peroxide-liquid':
        data = await import('../data/substances/compounds/pure/hydrogen-peroxide-h2o2/liquid/state.json')
        break
      case 'hydrogen-peroxide-gas':
        data = await import('../data/substances/compounds/pure/hydrogen-peroxide-h2o2/gas/state.json')
        break
      // methane phases
      case 'methane-liquid':
        data = await import('../data/substances/compounds/pure/methane-ch4/liquid/state.json')
        break
      case 'methane-gas':
        data = await import('../data/substances/compounds/pure/methane-ch4/gas/state.json')
        break
      // propane phases
      case 'propane-liquid':
        data = await import('../data/substances/compounds/pure/propane-c3h8/liquid/state.json')
        break
      case 'propane-gas':
        data = await import('../data/substances/compounds/pure/propane-c3h8/gas/state.json')
        break
      // isopropyl-alcohol phases
      case 'isopropyl-alcohol-liquid':
        data = await import('../data/substances/compounds/pure/isopropyl-alcohol-c3h8o/liquid/state.json')
        break
      case 'isopropyl-alcohol-gas':
        data = await import('../data/substances/compounds/pure/isopropyl-alcohol-c3h8o/gas/state.json')
        break
      // glycerin phases (liquid only - does not have gas phase)
      case 'glycerin-liquid':
        data = await import('../data/substances/compounds/pure/glycerin-c3h8o3/liquid/state.json')
        break
      // sucrose phases (liquid only - does not have gas phase)
      case 'sucrose-liquid':
        data = await import('../data/substances/compounds/pure/sucrose-c12h22o11/liquid/state.json')
        break
      default:
        throw new Error(`Phase "${phase}" for compound "${compoundId}" not mapped in loader`)
    }
    return data.default || data
  } catch (error) {
    console.error(`Failed to load phase "${phase}" for compound "${compoundId}":`, error)
    throw new Error(`Phase "${phase}" not found for "${compoundId}". Check switch statement in substanceLoader.js`)
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
  
  const boilingPointSeaLevel = Number.isFinite(compound.phaseTransitions?.boilingPoint)
    ? compound.phaseTransitions.boilingPoint
    : null

  const heatOfVaporization = extractValue(phaseState.latentHeatOfVaporization)

  const components = Array.isArray(compound.components) ? compound.components : []
  const nonVolatileMassFraction = components.reduce((sum, component) => {
    if (!component || typeof component.massFraction !== 'number') return sum
    const role = component.role || 'component'
    const isVolatile = component.isVolatile === true || role === 'solvent' || role === 'volatile'
    return sum + (isVolatile ? 0 : component.massFraction)
  }, 0)
  const clampedNonVolatile = Math.min(Math.max(nonVolatileMassFraction, 0), 1)
  const volatileMassFraction = Math.max(0, 1 - clampedNonVolatile)

  const canBoil = Number.isFinite(boilingPointSeaLevel) && Number.isFinite(heatOfVaporization)

  return {
    // Identification (from compound metadata)
    id: compound.id,
    name: compound.name,
    formula: compound.chemicalFormula,
    currentPhase: currentPhase,
    
    // Phase transition temperatures (from compound info.json)
    boilingPointSeaLevel: boilingPointSeaLevel,
    meltingPoint: compound.phaseTransitions?.meltingPoint || 0,
    triplePoint: compound.phaseTransitions?.triplePoint,
    criticalPoint: compound.phaseTransitions?.criticalPoint,
    
    // Altitude lapse rate (linear approximation for boiling point)
    // Formula: ΔTb = altitude × lapse_rate (°C per meter)
    // For water: ~0.00333°C/meter (roughly 1°C per 300m)
    altitudeLapseRate: Number.isFinite(compound.phaseTransitions?.altitudeLapseRate)
      ? compound.phaseTransitions.altitudeLapseRate
      : ATMOSPHERE.TEMP_LAPSE_RATE,  // Default atmospheric lapse rate
    
    // Thermodynamic properties (extracted from phase state.json)
    specificHeat: extractValue(phaseState.specificHeat),  // J/(g·°C)
    heatOfVaporization: heatOfVaporization,  // kJ/kg
    heatOfFusion: extractValue(phaseState.latentHeatOfFusion),  // kJ/kg
    density: extractValue(phaseState.density),  // kg/L
    thermalConductivity: extractValue(phaseState.thermalConductivity),  // W/(m·K)
    
    // Cooling model: Default coefficient (0.0015 for water)
    // In future, can be loaded from phase state per substance
    coolingCoefficient: extractValue(phaseState.coolingCoefficient) ?? 0.0015,  // 1/s (default for water-like fluids)
    
    // Optional advanced properties for chemistry students
    molarMass: compound.molarMass,
    electricalConductivity: extractValue(phaseState.electricalConductivity),  // S/m
    vanThoffFactor: extractValue(phaseState.vanThoffFactor),  // i (dimensionless)
    saturationPoint: extractValue(phaseState.saturationPoint),  // g/L

    // Mixture/phase behavior
    components: components,
    canBoil: canBoil,
    nonVolatileMassFraction: clampedNonVolatile,
    volatileMassFraction: volatileMassFraction,
    
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
  return Object.keys(SUBSTANCE_CATALOG)
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
