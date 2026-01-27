/**
 * SUBSTANCE LOADER UTILITY
 * 
 * Dynamically loads substance property definitions from JSON files.
 * This allows extension to liquids, solids, gases, and mixtures without
 * modifying core game code.
 * 
 * To add a new substance:
 * 1. Create a new JSON file in src/data/fluids/ (e.g., ethanol.json)
 * 2. Follow the same structure as water.json
 * 3. Import and use: const ethanol = await loadSubstance('ethanol')
 */

/**
 * Load a substance's properties from its JSON definition
 * 
 * @param {string} substanceId - The substance identifier (e.g., 'water', 'ethanol')
 * @returns {Promise<Object>} Substance properties object
 * @throws {Error} If substance file not found or invalid JSON
 */
export async function loadSubstance(substanceId) {
  try {
    // Dynamic import of the JSON file
    const substanceData = await import(`../data/fluids/${substanceId}.json`)
    
    // Validate required properties exist
    validateSubstanceData(substanceData.default || substanceData)
    
    return substanceData.default || substanceData
  } catch (error) {
    console.error(`Failed to load substance "${substanceId}":`, error)
    throw new Error(`Substance "${substanceId}" not found or invalid. Check src/data/fluids/${substanceId}.json`)
  }
}

/**
 * Validate that a substance definition contains all required properties
 * 
 * @param {Object} substanceData - The substance data to validate
 * @throws {Error} If required properties are missing
 */
function validateSubstanceData(substanceData) {
  const required = [
    'id',
    'name',
    'properties.specificHeatLiquid',
    'properties.heatOfVaporization',
    'properties.density',
    'properties.boilingPoint',
    'coolingModel.heatTransferCoefficient'
  ];
  
  for (const path of required) {
    const value = getNestedProperty(substanceData, path)
    if (value === undefined || value === null) {
      throw new Error(`Missing required property: ${path}`)
    }
  }
}

/**
 * Get a nested property from an object using dot notation
 * 
 * @param {Object} obj - The object to traverse
 * @param {string} path - Dot-separated path (e.g., 'properties.density')
 * @returns {*} The value at the path, or undefined if not found
 */
function getNestedProperty(obj, path) {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

/**
 * Convert substance JSON format to a simplified object for physics calculations
 * Extracts numeric values from the structured format
 * 
 * @param {Object} substanceData - Raw substance data from JSON
 * @returns {Object} Simplified fluid properties for physics engine
 */
export function parseSubstanceProperties(substanceData) {
  const props = substanceData.properties
  
  return {
    // Identification
    id: substanceData.id,
    name: substanceData.name,
    formula: substanceData.chemicalFormula,
    
    // Thermodynamic properties (extract numeric values)
    specificHeat: props.specificHeatLiquid.value,        // J/(g·°C)
    heatOfVaporization: props.heatOfVaporization.value,  // kJ/kg
    heatOfFusion: props.heatOfFusion?.value || 0,        // kJ/kg
    density: props.density.value,                         // kg/L
    
    // Phase transition temperatures
    boilingPointSeaLevel: props.boilingPoint.seaLevel,   // °C
    altitudeLapseRate: props.boilingPoint.altitudeLapseRate, // °C/m
    freezingPoint: props.freezingPoint?.value || 0,      // °C
    
    // Cooling model
    coolingCoefficient: substanceData.coolingModel.heatTransferCoefficient, // 1/s
    
    // Optional properties
    molecularMass: props.molecularMass?.value,
    thermalConductivity: props.thermalConductivity?.value,
    viscosity: props.viscosity?.value,
    
    // Visual properties (for rendering)
    visual: substanceData.visualProperties,
    
    // Metadata
    metadata: substanceData.metadata
  }
}

/**
 * List all available substances in the fluids directory
 * 
 * @returns {Array<string>} Array of substance IDs
 */
export function getAvailableSubstances() {
  // In a real implementation, this would scan the directory
  // For now, we'll return a hardcoded list that can be expanded
  return ['water']
  
  // Future: Add scanning logic or manifest file
  // return ['water', 'ethanol', 'saltwater', 'vegetable-oil', 'glycerin'];
}

/**
 * Default substance (water) - used as fallback
 */
export const DEFAULT_SUBSTANCE = 'water'

// Compatibility exports (legacy naming)
export const loadFluid = loadSubstance
export const parseFluidProperties = parseSubstanceProperties
export const getAvailableFluids = getAvailableSubstances
export const DEFAULT_FLUID = DEFAULT_SUBSTANCE
