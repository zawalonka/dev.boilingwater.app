/**
 * SUBSTANCE LOADER
 * 
 * Loads substance definitions from the filesystem:
 * - Compound metadata from: src/data/substances/compounds/{id}/info.json
 * - Phase properties from: src/data/substances/compounds/{id}/{phase}/state.json
 * 
 * ARCHITECTURE:
 * - substanceCatalog.js: Maps logical IDs to file paths
 * - substanceLoader.js: Loads files and merges them (THIS FILE)
 * - substanceParser.js: Extracts physics-ready values
 * 
 * FUTURE SUPPORT FOR:
 * - Solids (ice, dry ice, salt crystals, etc.)
 * - Gases (steam, nitrogen, methane, etc.)
 * - Plasmas (ionized gases, lightning arcs)
 * - All 118 periodic table elements
 * 
 * To add a new substance:
 * 1. Add entry to SUBSTANCE_CATALOG in substanceCatalog.js
 * 2. Create JSON files: compound/info.json and compound/{phase}/state.json
 * 3. Add mappings in loadCompound() and loadPhaseState() below
 */

import { getAvailableSubstances } from './substanceCatalog'
import { parseSubstanceProperties } from './substanceParser'

/**
 * Load a periodic table element's data
 * Elements are stored in: src/data/substances/periodic-table/{id}.json
 * 
 * @param {string} symbol - Element symbol (e.g., 'H', 'O', 'N')
 * @returns {Promise<Object>} Element data with thermodynamic properties
 * @throws {Error} If element file not found
 */
async function loadElement(symbol) {
  try {
    let data
    // Map element symbols to their files
    // Format: XXX_Symbol_category.json (e.g., 001_H_nonmetal.json)
    switch (symbol) {
      case 'H':
        data = await import('../data/substances/periodic-table/001_H_nonmetal.json')
        break
      case 'He':
        data = await import('../data/substances/periodic-table/002_He_noble-gas.json')
        break
      case 'N':
        data = await import('../data/substances/periodic-table/007_N_nonmetal.json')
        break
      case 'O':
        data = await import('../data/substances/periodic-table/008_O_nonmetal.json')
        break
      case 'F':
        data = await import('../data/substances/periodic-table/009_F_halogen.json')
        break
      case 'Ne':
        data = await import('../data/substances/periodic-table/010_Ne_noble-gas.json')
        break
      case 'Cl':
        data = await import('../data/substances/periodic-table/017_Cl_halogen.json')
        break
      case 'Ar':
        data = await import('../data/substances/periodic-table/018_Ar_noble-gas.json')
        break
      default:
        throw new Error(`Element "${symbol}" not mapped in loader yet. Add to loadElement() switch statement.`)
    }
    return data.default || data
  } catch (error) {
    console.error(`Failed to load element "${symbol}":`, error)
    throw new Error(`Element "${symbol}" not found. Check periodic-table/ folder.`)
  }
}

/**
 * Load a compound's complete metadata (info.json)
 * Contains: molar mass, boiling/melting points, color, elements, etc.
 * 
 * CURRENT PHASE-INDEPENDENT PROPERTIES:
 * - id, name, chemicalFormula, molarMass
 * - electronegativity, state symbol
 * - phaseTransitions: { boilingPoint, meltingPoint, triplePoint, criticalPoint, altitudeLapseRate }
 * - components (for solutions)
 * - elements (which periodic table elements compose it)
 * - metadata (author, date, source)
 * 
 * @param {string} compoundId - The compound identifier (e.g., 'h2o', 'ethanol')
 * @returns {Promise<Object>} Compound metadata
 * @throws {Error} If compound file not found or invalid JSON
 */
async function loadCompound(compoundId) {
  try {
    let data
    // Map compound IDs to their info.json file paths
    // This switch statement grows as we add more substances
    // Future optimization: dynamically construct path from SUBSTANCE_CATALOG
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
 * Contains: thermodynamic properties, Antoine coefficients, etc.
 * 
 * PHASE-SPECIFIC PROPERTIES:
 * - density, specificHeat, thermalConductivity
 * - latentHeatOfVaporization, latentHeatOfFusion
 * - antoineCoefficients (for vapor pressure/boiling point calculations)
 * - compressibility, volumetricExpansionCoefficient
 * - electricalConductivity, refractiveIndex, color
 * - entropy, saturation point (for advanced chemistry)
 * 
 * @param {string} compoundId - The compound identifier (e.g., 'h2o')
 * @param {string} phase - The phase ('solid', 'liquid', or 'gas')
 * @returns {Promise<Object>} Phase state data with all thermodynamic properties
 * @throws {Error} If phase file not found or invalid JSON
 */
async function loadPhaseState(compoundId, phase) {
  try {
    let data
    const key = `${compoundId}-${phase}`
    // Map compound + phase to their state.json files
    // This switch statement grows as we add more substances
    // Future optimization: dynamically construct path from SUBSTANCE_CATALOG
    switch (key) {
      // h2o phases (3 states)
      case 'h2o-solid':
        data = await import('../data/substances/compounds/pure/water-h2o/solid/state.json')
        break
      case 'h2o-liquid':
        data = await import('../data/substances/compounds/pure/water-h2o/liquid/state.json')
        break
      case 'h2o-gas':
        data = await import('../data/substances/compounds/pure/water-h2o/gas/state.json')
        break
      // saltwater phases (liquid only)
      case 'saltwater-3pct-liquid':
        data = await import('../data/substances/compounds/solutions/saltwater-3pct-nacl/liquid/state.json')
        break
      // ethanol phases (2 states)
      case 'ethanol-liquid':
        data = await import('../data/substances/compounds/pure/ethanol-c2h5oh/liquid/state.json')
        break
      case 'ethanol-gas':
        data = await import('../data/substances/compounds/pure/ethanol-c2h5oh/gas/state.json')
        break
      // ammonia phases (2 states)
      case 'ammonia-liquid':
        data = await import('../data/substances/compounds/pure/ammonia-nh3/liquid/state.json')
        break
      case 'ammonia-gas':
        data = await import('../data/substances/compounds/pure/ammonia-nh3/gas/state.json')
        break
      // acetone phases (2 states)
      case 'acetone-liquid':
        data = await import('../data/substances/compounds/pure/acetone-c3h6o/liquid/state.json')
        break
      case 'acetone-gas':
        data = await import('../data/substances/compounds/pure/acetone-c3h6o/gas/state.json')
        break
      // acetic-acid phases (2 states)
      case 'acetic-acid-liquid':
        data = await import('../data/substances/compounds/pure/acetic-acid-ch3cooh/liquid/state.json')
        break
      case 'acetic-acid-gas':
        data = await import('../data/substances/compounds/pure/acetic-acid-ch3cooh/gas/state.json')
        break
      // hydrogen-peroxide phases (2 states)
      case 'hydrogen-peroxide-liquid':
        data = await import('../data/substances/compounds/pure/hydrogen-peroxide-h2o2/liquid/state.json')
        break
      case 'hydrogen-peroxide-gas':
        data = await import('../data/substances/compounds/pure/hydrogen-peroxide-h2o2/gas/state.json')
        break
      // methane phases (2 states)
      case 'methane-liquid':
        data = await import('../data/substances/compounds/pure/methane-ch4/liquid/state.json')
        break
      case 'methane-gas':
        data = await import('../data/substances/compounds/pure/methane-ch4/gas/state.json')
        break
      // propane phases (2 states)
      case 'propane-liquid':
        data = await import('../data/substances/compounds/pure/propane-c3h8/liquid/state.json')
        break
      case 'propane-gas':
        data = await import('../data/substances/compounds/pure/propane-c3h8/gas/state.json')
        break
      // isopropyl-alcohol phases (2 states)
      case 'isopropyl-alcohol-liquid':
        data = await import('../data/substances/compounds/pure/isopropyl-alcohol-c3h8o/liquid/state.json')
        break
      case 'isopropyl-alcohol-gas':
        data = await import('../data/substances/compounds/pure/isopropyl-alcohol-c3h8o/gas/state.json')
        break
      // glycerin phases (liquid only)
      case 'glycerin-liquid':
        data = await import('../data/substances/compounds/pure/glycerin-c3h8o3/liquid/state.json')
        break
      // sucrose phases (liquid only)
      case 'sucrose-liquid':
        data = await import('../data/substances/compounds/pure/sucrose-c12h22o11/liquid/state.json')
        break
      default:
        throw new Error(`Phase "${phase}" for compound "${compoundId}" not mapped in loader`)
    }
    return data.default || data
  } catch (error) {
    console.error(`Failed to load phase "${phase}" for compound "${compoundId}":`, error)
    throw new Error(`Phase "${phase}" not found for "${compoundId}". Check loadPhaseState() switch statement.`)
  }
}

/**
 * Load a complete substance definition (compound + specific phase)
 * Returns the merged raw JSON data; use parseSubstanceProperties() to extract physics values
 * 
 * WHAT THIS DOES:
 * 1. Loads compound metadata (constant across all phases) OR element data
 * 2. Loads phase-specific properties (if compound)
 * 3. Merges them into a single object
 * 4. Returns raw data (NOT parsed yet)
 * 
 * SUPPORTS:
 * - Elements: loadSubstance('H', 'gas') - loads from periodic table
 * - Compounds: loadSubstance('h2o', 'liquid') - loads compound + phase
 * 
 * USE WITH PARSER:
 * ```js
 * const rawData = await loadSubstance('O', 'gas')  // Element
 * const physicsProps = parseSubstanceProperties(rawData)
 * // Now pass physicsProps to physics engine
 * ```
 * 
 * @param {string} substanceId - The substance identifier (e.g., 'h2o' or 'H')
 * @param {string} phase - The phase to load ('liquid' by default, can be 'solid' or 'gas')
 * @returns {Promise<Object>} Complete substance data with metadata and phase properties
 * @throws {Error} If substance or phase not found
 */
export async function loadSubstance(substanceId, phase = 'liquid') {
  try {
    // Check if this is an element (single capital letter or 1-2 letter symbol)
    const isElement = /^[A-Z][a-z]?$/.test(substanceId)
    
    if (isElement) {
      // Load element directly (contains all phase data in one file)
      const element = await loadElement(substanceId)
      return {
        ...element,
        currentPhase: phase,
        isElement: true,
        // Elements store boiling/melting in nist/iupac objects
        phaseTransitions: {
          boilingPoint: element.nist?.boilingPoint || element.iupac?.boilingPoint,
          meltingPoint: element.nist?.meltingPoint || element.iupac?.meltingPoint
        },
        // Create a phaseState object for parser compatibility
        phaseState: {
          specificHeat: { value: element.nist?.specificHeatCapacity || element.iupac?.specificHeatCapacity },
          density: { value: element.nist?.density || element.iupac?.density },
          thermalConductivity: { value: element.nist?.thermalConductivity || element.iupac?.thermalConductivity }
        }
      }
    } else {
      // Load compound + phase state
      const compound = await loadCompound(substanceId)
      const phaseState = await loadPhaseState(substanceId, phase)

      // Merge compound metadata with phase-specific properties
      // phaseState overwrites any duplicate keys (phase-specific takes priority)
      return {
        ...compound,
        phaseState,
        currentPhase: phase,
        isElement: false
      }
    }
  } catch (error) {
    console.error(`Failed to load substance "${substanceId}" phase "${phase}":`, error)
    throw error
  }
}

/**
 * Load and parse a substance in one step
 * 
 * Convenience function that combines:
 * 1. loadSubstance() - Load raw JSON
 * 2. parseSubstanceProperties() - Extract physics-ready values
 * 
 * This is typically what physics engine and GameScene should call.
 * 
 * @param {string} substanceId - The compound identifier (e.g., 'h2o')
 * @param {string} phase - The phase ('liquid' by default)
 * @returns {Promise<Object>} Physics-ready substance properties
 */
export async function loadSubstancePhase(substanceId, phase = 'liquid') {
  const rawData = await loadSubstance(substanceId, phase)
  return parseSubstanceProperties(rawData)
}

// Re-export from catalog for convenience
export { getAvailableSubstances } from './substanceCatalog'

// Re-export from parser for convenience  
export { parseSubstanceProperties } from './substanceParser'

// Default substance constant
export const DEFAULT_SUBSTANCE = 'h2o'

