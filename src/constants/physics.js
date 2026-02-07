// NOTE: Read the header comments before editing. Reassess splitting into subcomponents when adding new items or behaviors.
/**
 * UNIVERSAL PHYSICS CONSTANTS FOR THERMODYNAMICS
 * All values use SI units (meters, kilograms, seconds, Celsius, Joules) unless otherwise specified
 * 
 * These constants represent universal physical laws and atmospheric properties.
 * Substance-specific properties (water, ethanol, etc.) are now loaded from src/data/substances/
 * 
 * NOTE: WATER_CONSTANTS has been DEPRECATED and moved to src/data/substances/compounds/water-h2o/
 * This allows easy extension to other substances like ethanol, saltwater, oils, etc.
 */

// =====================================================================
// ATMOSPHERIC PROPERTIES
// =====================================================================
// These constants describe the Earth's atmosphere and how it changes with altitude
export const ATMOSPHERE = {
  // STANDARD ATMOSPHERIC PRESSURE AT SEA LEVEL
  // = 101,325 Pascals (Pa) = 101.325 kilopascals (kPa) = 1 atmosphere (atm)
  // 
  // This is the air pressure at sea level under standard conditions.
  // It's the weight of all the air above you pressing down. At higher altitudes,
  // there's less air above you, so pressure is lower.
  // 
  // Air pressure affects boiling point: water boils when its vapor pressure
  // equals atmospheric pressure. Lower pressure → lower boiling point.
  STANDARD_PRESSURE: 101325,
  
  // TEMPERATURE LAPSE RATE
  // How much temperature decreases per meter of altitude
  // = 1°C decrease per 300 meters elevation
  // = 1/300 ≈ 0.00333 °C per meter
  // 
  // Real atmosphere: more complex (changes with season, location, weather),
  // but 1°C per 300m is a good average for the lower atmosphere (troposphere).
  // 
  // Real-world examples:
  // - Denver (1600m): 1600m × (1°C/300m) ≈ 5.3°C cooler than sea level baseline
  // - Boiling point: 100°C - 5.3°C ≈ 94.7°C
  // 
  // - Mount Everest (8848m): 8848m × (1°C/300m) ≈ 29.5°C cooler than sea level
  // - Boiling point: 100°C - 29.5°C ≈ 70.5°C
  TEMP_LAPSE_RATE: 1 / 300
}

// =====================================================================
// UNIVERSAL CONSTANTS
// =====================================================================
// Fundamental physical constants used in atmospheric and gas calculations
export const UNIVERSAL = {
  // UNIVERSAL GAS CONSTANT (R)
  // = 8.314 Joules per mole per Kelvin (J/(mol·K))
  // 
  // This constant appears in the ideal gas law: PV = nRT
  // Where P = pressure, V = volume, n = moles, T = temperature (Kelvin)
  // 
  // It's also used in the barometric formula to relate atmospheric pressure
  // to altitude: P = P₀ × exp(-Mgh/RT)
  // 
  // The constant is "universal" because it's the same for ALL gases.
  GAS_CONSTANT: 8.314,
  
  // ABSOLUTE ZERO
  // The lowest possible temperature, where all molecular motion stops
  // = -273.15°C = 0 Kelvin (K)
  // 
  // Temperature conversions between Celsius and Kelvin:
  // K = °C + 273.15
  // °C = K - 273.15
  // 
  // Example: Room temperature = 20°C = 293.15K
  //          Water freezes = 0°C = 273.15K
  //          Water boils = 100°C = 373.15K
  ABSOLUTE_ZERO: -273.15
}

// =====================================================================
// GAME CONFIGURATION
// =====================================================================
// Settings that control how the game simulation works
export const GAME_CONFIG = {
  // SIMULATION TIME STEP (in milliseconds)
  // The game simulation updates every 100ms (0.1 seconds)
  // 
  // This controls how fast the simulation runs:
  // - Smaller values (e.g., 50ms) = more frequent updates = more accurate but uses more CPU
  // - Larger values (e.g., 200ms) = less frequent updates = less accurate but lighter
  // - 100ms is a good balance: updates 10 times per second (visible motion feels smooth)
  // 
  // Each simulation step, the stove heat is applied for 0.01 seconds:
  // energyApplied = heatInputWatts × 0.01 seconds
  TIME_STEP: 10,
  
  // GAS BURNER OUTPUT (in Watts)
  // A typical medium heat setting on a household gas range
  // A standard household gas burner outputs 5,000-7,000 BTU/hour
  // 1700 Watts = ~5,800 BTU/hour (medium heat on a gas stove)
  // This heats 1 kg of water from 20°C to 100°C in about 3.5 minutes of real time
  GAS_BURNER_WATTS: 1700,
  
  // HEAT TRANSFER COEFFICIENT (for Newton's Law of Cooling)
  // This is now loaded from the fluid JSON file (e.g., water.json)
  // Different fluids have different cooling rates based on their thermal properties
  // The coefficient determines exponential cooling: dT/dt = -k(T - T_ambient)
  // Typical range: 0.001 to 0.003 per second for liquids in metal containers
  // NOTE: AMBIENT_COOLING_WATTS has been deprecated in favor of exponential cooling model
  
  // DEFAULT STARTING TEMPERATURE (in Celsius)
  // Water always starts at room temperature
  // This is also the ambient temperature used for cooling calculations
  // 
  // 20°C is approximately room temperature in most environments.
  // Some people use 22-25°C, but 20°C is standard for physics/chemistry calculations.
  ROOM_TEMPERATURE: 20,
  
  // DEFAULT WATER AMOUNT (in kilograms)
  // The pot starts with 1 kilogram (1 liter) of water
  // 
  // 1 liter is roughly the amount in a typical kitchen mug or small pot.
  // This makes calculations easier: heating 1 kg by 10°C requires exactly
  // 1000g × 4.186 J/(g·°C) × 10°C = 41,860 Joules
  DEFAULT_WATER_MASS: 1.0,
  
  // HEATING TIME CALCULATIONS (in seconds)
  // For 1kg of water from 20°C (room temp) to 100°C (boiling at sea level)
  // Energy needed: Q = mcΔT = 1000g × 4.186 J/(g·°C) × 80°C = 334,880 Joules
  // Time = Energy / Power (Watts)
  HEATING_TIME_LOW: 837,      // 400W burner: ~14 minutes
  HEATING_TIME_MED: 197,      // 1700W burner: ~3.3 minutes  
  HEATING_TIME_HIGH: 134,     // 2500W burner: ~2.2 minutes
  
  // EDUCATIONAL LANGUAGE LEVELS
  // Used for displaying explanations at different complexity levels
  // (Not currently implemented in the game, but framework is ready)
  // 
  // Level 1 (BEGINNER): Very simple, everyday language
  // Level 2 (INTERMEDIATE): Physics terms introduced, formulas shown
  // Level 3 (STANDARD): Full physics terminology, detailed explanations
  // Level 4 (EXPERT): Advanced formulas, real-world edge cases discussed
  LANGUAGE_LEVELS: {
    BEGINNER: 1,
    INTERMEDIATE: 2,
    STANDARD: 3,
    EXPERT: 4
  }
}
