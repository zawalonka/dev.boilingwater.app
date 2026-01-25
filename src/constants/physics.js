/**
 * PHYSICS CONSTANTS FOR THERMODYNAMICS
 * All values use SI units (meters, kilograms, seconds, Celsius, Joules) unless otherwise specified
 * 
 * These constants represent real physical properties of water and the atmosphere.
 * They are used throughout the game to simulate realistic heating and boiling behavior.
 */

// =====================================================================
// WATER PROPERTIES
// =====================================================================
// These constants describe how water behaves when you heat it or cool it
export const WATER_CONSTANTS = {
  // SPECIFIC HEAT CAPACITY (c)
  // How much energy is needed to raise the temperature of 1 gram of water by 1°C
  // = 4.186 Joules per gram per degree Celsius
  // 
  // This is why water is good for thermal storage—it takes a lot of energy to
  // change its temperature. For comparison, aluminum is 0.897 J/(g·°C), only 21% of water.
  // 
  // Formula: Q = m × c × ΔT
  // Example: To heat 1 liter (1000g) of water by 10°C:
  //   Q = 1000g × 4.186 J/(g·°C) × 10°C = 41,860 Joules
  SPECIFIC_HEAT_LIQUID: 4.186,
  
  // HEAT OF VAPORIZATION (latent heat)
  // Energy needed to convert 1 kilogram of liquid water to steam at 100°C
  // = 2,257 kilojoules per kilogram = 2,257,000 Joules per kilogram
  // 
  // This is MUCH larger than the sensible heat. For example, heating 1 kg of water
  // from 0°C to 100°C requires 418,600 J, but converting that 100°C water to steam
  // requires 2,257,000 J—5.4 times more energy!
  // 
  // This is why steam burns are so dangerous—the energy required for boiling is huge.
  // 
  // Used in formula: m_steam = Q / L_v
  // Example: 2,257,000 J of heat converts 1 kg of water to steam
  HEAT_OF_VAPORIZATION: 2257,
  
  // HEAT OF FUSION
  // Energy needed to melt 1 kilogram of ice at 0°C to liquid water at 0°C
  // = 334 kilojoules per kilogram = 334,000 Joules per kilogram
  // 
  // Not currently used in the game (we don't simulate freezing), but included
  // for educational completeness and future expansion.
  HEAT_OF_FUSION: 334,
  
  // DENSITY OF WATER
  // Mass per unit volume at 4°C (when water is densest)
  // = 1.0 kilogram per liter (or 1000 kg per cubic meter)
  // 
  // This is why 1 liter of water weighs 1 kg—convenient for calculations!
  // Density changes slightly with temperature (water is less dense at 0°C and 100°C),
  // but we use 1.0 as a reasonable average.
  // 
  // Used to convert between water volume and mass: mass = volume × density
  DENSITY: 1.0,
  
  // BOILING POINT AT STANDARD PRESSURE (sea level)
  // = 100°C by definition (standard atmospheric pressure = 101,325 Pa)
  // 
  // This is the reference temperature. At higher altitudes, boiling point decreases.
  // Example: Denver (1600m) → ~95°C; Mount Everest (8848m) → ~68°C
  BOILING_POINT_SEA_LEVEL: 100,
  
  // FREEZING POINT
  // Temperature at which liquid water becomes solid ice at standard pressure
  // = 0°C by definition
  // 
  // Not used in current game, but important for educational completeness.
  FREEZING_POINT: 0,
  
  // MOLECULAR MASS OF WATER (H₂O)
  // = 18.015 grams per mole
  // 
  // One mole of any substance contains Avogadro's number of molecules (~6.022 × 10²³).
  // Water's molecular formula H₂O: 1×hydrogen (1) + 2×oxygen (16) ≈ 18
  // 
  // Not directly used in our simplified game physics, but included for educational reference.
  MOLECULAR_MASS: 18.015
}

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
  // Each simulation step, the stove heat is applied for 0.1 seconds:
  // energyApplied = heatInputWatts × 0.1 seconds
  TIME_STEP: 100,
  
  // GAS BURNER OUTPUT (in Watts)
  // A typical medium heat setting on a household gas range
  // A standard household gas burner outputs 5,000-7,000 BTU/hour
  // 1700 Watts = ~5,800 BTU/hour (medium heat on a gas stove)
  // This heats 1 kg of water from 20°C to 100°C in about 3.5 minutes of real time
  GAS_BURNER_WATTS: 1700,
  
  // HEAT LOSS RATE (in Watts)
  // When pot is removed from the flame, it loses heat to the environment
  // This is ambient cooling due to air and pot material radiation
  // Realistic value: 200W for a pot containing hot water
  AMBIENT_COOLING_WATTS: 200,
  
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
