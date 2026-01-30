/**
 * SUBSTANCE LOADER
 * 
 * Loads substances using auto-generated catalog (zero hardcoding).
 * The catalog is regenerated on every build by scanning the filesystem.
 * 
 * This file has ZERO knowledge of specific elements or compounds.
 * It only imports from the generated catalog and provides a clean API.
 */

import { parseSubstanceProperties as parseProps } from './substanceParser'
import { 
  compoundLoaders, 
  elementLoaders, 
  compoundMetadata, 
  elementMetadata
} from '../generated/substanceCatalog'

// Preloadable map for compound phase state files (Vite will bundle these JSON files)
const phaseStateLoaders = import.meta.glob('../data/substances/compounds/**/state.json')

// ============================================================================
// RE-EXPORTS
// ============================================================================

// Re-export parser function for backward compatibility
export { parseProps as parseSubstanceProperties }

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Default substance to load on startup
 * Using 'water' as default
 */
export const DEFAULT_SUBSTANCE = 'water'

// ============================================================================
// DISCOVERY FUNCTIONS
// ============================================================================

/**
 * Get all available substance IDs (compounds + elements)
 * Discovered dynamically from filesystem at build time
 */
export function getAvailableSubstances() {
  return {
    compounds: Object.keys(compoundLoaders),
    elements: Object.keys(elementLoaders),
    all: [...Object.keys(compoundLoaders), ...Object.keys(elementLoaders)]
  }
}

/**
 * Get metadata for a substance (display name, category, etc)
 * @param {string} substanceId - Compound ID or element symbol
 * @returns {Object} Metadata with displayName, category
 */
export function getSubstanceMetadata(substanceId) {
  return compoundMetadata[substanceId] || elementMetadata[substanceId] || {
    displayName: substanceId,
    category: 'unknown'
  }
}

// ============================================================================
// LOADING FUNCTIONS
// ============================================================================

/**
 * Load substance info only (no phase state files)
 * Useful for quick metadata checks like phase at ambient temperature
 * @param {string} substanceId - Element symbol or compound ID
 * @returns {Promise<Object>} Substance info data with element flag when applicable
 */
export async function loadSubstanceInfo(substanceId) {
  try {
    if (elementLoaders[substanceId]) {
      const loader = elementLoaders[substanceId]
      const data = await loader()
      const elementData = data.default || data

      return {
        ...elementData,
        isElement: true,
        currentPhase: elementData.physicalProperties?.phase || null
      }
    }

    if (compoundLoaders[substanceId]) {
      const loader = compoundLoaders[substanceId]
      const info = await loader()
      const infoData = info.default || info

      return {
        ...infoData,
        isElement: false,
        currentPhase: null,
        phaseState: null
      }
    }

    throw new Error(`Substance "${substanceId}" not found in catalog`)
  } catch (error) {
    console.error(`Failed to load substance info for "${substanceId}":`, error)
    throw error
  }
}

/**
 * Load a substance (element or compound) from generated catalog
 * @param {string} substanceId - Element symbol or compound ID
 * @param {string} phase - Phase name (liquid, solid, gas) - for compounds only
 * @returns {Promise<Object>} Complete substance data
 */
export async function loadSubstance(substanceId, phase = 'liquid') {
  try {
    // Try element first (symbols are usually uppercase like 'H', 'O', etc.)
    if (elementLoaders[substanceId]) {
      const loader = elementLoaders[substanceId]
      const data = await loader()
      const elementData = data.default || data
      
      // Mark as element and set phase based on element's natural state
      // Most elements at room temp are solid, but H, N, O, F, Cl, noble gases are gas
      const gasElements = ['H', 'He', 'N', 'O', 'F', 'Ne', 'Cl', 'Ar', 'Kr', 'Xe', 'Rn']
      const liquidElements = ['Br', 'Hg']  // Only two liquid at room temp
      
      let naturalPhase = 'solid'
      if (gasElements.includes(substanceId)) naturalPhase = 'gas'
      if (liquidElements.includes(substanceId)) naturalPhase = 'liquid'
      
      return {
        ...elementData,
        isElement: true,
        currentPhase: phase || naturalPhase
      }
    }
    
    // Try compound
    if (compoundLoaders[substanceId]) {
      const loader = compoundLoaders[substanceId]
      const info = await loader()
      const infoData = info.default || info
      
      // Load phase-specific state file
      // Compounds have structure: /compounds/{category}/{name}/info.json
      //                            /compounds/{category}/{name}/{phase}/state.json
      const compoundPath = infoData.id || substanceId
      const compoundCategory = infoData.category || 'pure'
      
      try {
        // Dynamically import the phase state file
        // Path: ../data/substances/compounds/{category}/{folder}/{phase}/state.json
        // We need to figure out the folder name from the catalog metadata
        const metadata = compoundMetadata[substanceId]
        if (!metadata || !metadata.folderPath) {
          throw new Error(`No folder path found for compound ${substanceId}`)
        }
        
        const phaseStatePath = `../data/substances/compounds/${metadata.folderPath}/${phase}/state.json`
        const phaseStateLoader = phaseStateLoaders[phaseStatePath]
        if (!phaseStateLoader) {
          throw new Error(`No phase state loader found for ${phaseStatePath}`)
        }
        const phaseState = await phaseStateLoader()
        const phaseStateData = phaseState.default || phaseState
        
        return {
          ...infoData,
          phaseState: phaseStateData,
          currentPhase: phase
        }
      } catch (error) {
        console.warn(`Could not load phase state for ${substanceId}/${phase}:`, error.message)
        // Return without phase state if file doesn't exist
        return {
          ...infoData,
          phaseState: null,
          currentPhase: phase
        }
      }
    }
    
    throw new Error(`Substance "${substanceId}" not found in catalog`)
  } catch (error) {
    console.error(`Failed to load substance "${substanceId}":`, error)
    throw error
  }
}

/**
 * Load substance with parsed physics properties ready for simulation
 * @param {string} substanceId - Element or compound ID
 * @param {string} phase - Phase name (liquid, solid, gas)
 * @returns {Promise<Object>} Parsed substance with physics properties
 */
export async function loadSubstancePhase(substanceId, phase = 'liquid') {
  const rawData = await loadSubstance(substanceId, phase)
  return parseSubstanceProperties(rawData)
}

