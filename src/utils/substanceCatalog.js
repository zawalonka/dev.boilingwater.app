/**
 * SUBSTANCE CATALOG
 * 
 * Maps logical substance IDs to their physical file locations.
 * This is the single source of truth for all available substances.
 * 
 * When adding a new substance:
 * 1. Add an entry to SUBSTANCE_CATALOG below
 * 2. Create the compound info: src/data/substances/compounds/{path}/info.json
 * 3. Create phase states: src/data/substances/compounds/{path}/{phase}/state.json
 * 4. Add the phase mappings in substanceLoader.js
 * 
 * Architecture:
 * - "Element": Single periodic table element (H, O, N, etc.)
 * - "Pure" substances: Single chemical compound (H2O, C2H5OH, etc.)
 * - "Solution": Mixture of compounds (saltwater, sugar solution, etc.)
 * - "Mixture": Multiple pure substances mixed (future: oil+water, etc.)
 */

export const SUBSTANCE_CATALOG = {
  // ELEMENTS (from periodic table)
  // Note: Elements use symbol as ID, stored in src/data/substances/periodic-table/
  H: {
    path: 'periodic-table/001_H_nonmetal',
    category: 'element',
    displayName: 'Hydrogen',
    chemicalName: 'H',
    atomicNumber: 1,
    states: ['solid', 'liquid', 'gas'],
    color: { gas: 'rgba(200, 230, 255, 0.3)' }  // Pale blue
  },
  O: {
    path: 'periodic-table/008_O_nonmetal',
    category: 'element',
    displayName: 'Oxygen',
    chemicalName: 'O',
    atomicNumber: 8,
    states: ['solid', 'liquid', 'gas'],
    color: { gas: 'rgba(180, 220, 255, 0.4)', liquid: 'rgba(150, 200, 255, 0.6)' }  // Pale blue
  },
  N: {
    path: 'periodic-table/007_N_nonmetal',
    category: 'element',
    displayName: 'Nitrogen',
    chemicalName: 'N',
    atomicNumber: 7,
    states: ['solid', 'liquid', 'gas'],
    color: { gas: 'rgba(230, 230, 240, 0.2)' }  // Nearly colorless
  },

  // PURE SUBSTANCES (single chemical compound)
  h2o: {
    path: 'pure/water-h2o',
    category: 'pure',
    displayName: 'Water',
    chemicalName: 'H2O',
    states: ['solid', 'liquid', 'gas']
  },
  ethanol: {
    path: 'pure/ethanol-c2h5oh',
    category: 'pure',
    displayName: 'Ethanol',
    chemicalName: 'C2H5OH',
    states: ['liquid', 'gas']
  },
  ammonia: {
    path: 'pure/ammonia-nh3',
    category: 'pure',
    displayName: 'Ammonia',
    chemicalName: 'NH3',
    states: ['liquid', 'gas']
  },
  acetone: {
    path: 'pure/acetone-c3h6o',
    category: 'pure',
    displayName: 'Acetone',
    chemicalName: 'C3H6O',
    states: ['liquid', 'gas']
  },
  'acetic-acid': {
    path: 'pure/acetic-acid-ch3cooh',
    category: 'pure',
    displayName: 'Acetic Acid',
    chemicalName: 'CH3COOH',
    states: ['liquid', 'gas']
  },
  'hydrogen-peroxide': {
    path: 'pure/hydrogen-peroxide-h2o2',
    category: 'pure',
    displayName: 'Hydrogen Peroxide',
    chemicalName: 'H2O2',
    states: ['liquid', 'gas']
  },
  methane: {
    path: 'pure/methane-ch4',
    category: 'pure',
    displayName: 'Methane',
    chemicalName: 'CH4',
    states: ['liquid', 'gas']
  },
  propane: {
    path: 'pure/propane-c3h8',
    category: 'pure',
    displayName: 'Propane',
    chemicalName: 'C3H8',
    states: ['liquid', 'gas']
  },
  'isopropyl-alcohol': {
    path: 'pure/isopropyl-alcohol-c3h8o',
    category: 'pure',
    displayName: 'Isopropyl Alcohol',
    chemicalName: 'C3H8O',
    states: ['liquid', 'gas']
  },
  glycerin: {
    path: 'pure/glycerin-c3h8o3',
    category: 'pure',
    displayName: 'Glycerin',
    chemicalName: 'C3H8O3',
    states: ['liquid']
  },
  sucrose: {
    path: 'pure/sucrose-c12h22o11',
    category: 'pure',
    displayName: 'Sucrose',
    chemicalName: 'C12H22O11',
    states: ['liquid']
  },

  // SOLUTIONS (mixture with solvent + solute)
  'saltwater-3pct': {
    path: 'solutions/saltwater-3pct-nacl',
    category: 'solution',
    displayName: 'Saltwater (3% NaCl)',
    chemicalName: 'NaCl in H2O',
    states: ['liquid']
  }
}

/**
 * Get the file path for a compound
 * @param {string} compoundId - The compound identifier
 * @returns {string} The path within src/data/substances/compounds/
 */
export function resolveCompoundPath(compoundId) {
  const entry = SUBSTANCE_CATALOG[compoundId]
  return entry?.path || compoundId
}

/**
 * Get available states for a substance
 * @param {string} compoundId - The compound identifier
 * @returns {Array<string>} Available states (e.g., ['liquid', 'gas'])
 */
export function getAvailableStates(compoundId) {
  const entry = SUBSTANCE_CATALOG[compoundId]
  return entry?.states || ['liquid']
}

/**
 * Get all available substance IDs
 * @returns {Array<string>} Array of substance IDs
 */
export function getAvailableSubstances() {
  return Object.keys(SUBSTANCE_CATALOG)
}

/**
 * Get catalog entry metadata for a substance
 * @param {string} compoundId - The compound identifier
 * @returns {Object} Full catalog entry {path, category, displayName, chemicalName, states}
 */
export function getSubstanceInfo(compoundId) {
  return SUBSTANCE_CATALOG[compoundId]
}
