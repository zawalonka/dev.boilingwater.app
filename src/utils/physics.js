import { WATER_CONSTANTS, ATMOSPHERE, UNIVERSAL } from '../constants/physics'

/**
 * Calculate boiling point of water based on altitude
 * 
 * PHYSICS BACKGROUND:
 * Water boils when its vapor pressure equals atmospheric pressure. As altitude increases,
 * atmospheric pressure decreases, so water boils at lower temperatures.
 * Real-world example: At Denver (1600m), water boils at ~95°C instead of 100°C.
 * At Mount Everest (8848m), water boils at ~68°C.
 * 
 * We use a simplified linear model:
 * - Atmospheric pressure decreases exponentially with altitude (barometric formula)
 * - But boiling point changes roughly linearly: ~1°C per 300 meters
 * - This is an approximation; real Clausius-Clapeyron equation is more complex
 * 
 * @param {number} altitude - Altitude in meters above sea level (0 = sea level, 5000 = Denver)
 * @returns {number} Boiling point in Celsius (100 at sea level, ~95 at Denver, ~68 at Everest)
 */
export function calculateBoilingPoint(altitude) {
  // Safety check: treat null/undefined/negative as sea level
  if (!altitude || altitude < 0) altitude = 0
  
  // Linear approximation: 1°C decrease per 300m elevation
  // TEMP_LAPSE_RATE = 1/300 ≈ 0.00333 °C/meter
  const temperatureDrop = altitude * ATMOSPHERE.TEMP_LAPSE_RATE
  
  // Start from standard boiling point (100°C) and subtract elevation effect
  const boilingPoint = WATER_CONSTANTS.BOILING_POINT_SEA_LEVEL - temperatureDrop
  
  // Safety minimum: if user enters extreme altitude, don't let boiling point go below 50°C
  // (physically unrealistic for Earth conditions, but prevents nonsensical game states)
  return Math.max(boilingPoint, 50)
}

/**
 * Calculate atmospheric pressure at given altitude
 * 
 * PHYSICS BACKGROUND:
 * The barometric formula describes how air pressure decreases with altitude.
 * Formula: P = P₀ × e^(-Mgh/RT)
 * Where:
 *   P₀ = pressure at sea level (101,325 Pa)
 *   M = molar mass of air (0.029 kg/mol)
 *   g = gravitational acceleration (9.81 m/s²)
 *   h = altitude (meters)
 *   R = gas constant (8.314 J/(mol·K))
 *   T = temperature (Kelvin, ~288K = 15°C)
 * 
 * Real-world examples:
 * - Sea level (0m): ~101,325 Pa
 * - Denver (1600m): ~83,000 Pa (~82% of sea level)
 * - Mount Everest (8848m): ~34,000 Pa (~34% of sea level)
 * 
 * This explains why water boils at lower temperatures at high altitude—
 * lower atmospheric pressure means water molecules escape as vapor more easily.
 * 
 * @param {number} altitude - Altitude in meters (0 = sea level)
 * @returns {number} Atmospheric pressure in Pascals
 */
export function calculatePressure(altitude) {
  // Safety check: treat null/undefined/negative as sea level
  if (!altitude || altitude < 0) altitude = 0
  
  // Barometric formula constants
  // (We redefine them here to make the physics formula visible and educational)
  const M = 0.029        // Molar mass of dry air (kg/mol)
  const g = 9.81         // Gravitational acceleration (m/s²)
  const T = 288.15       // Standard temperature (Kelvin, ~15°C)
  
  // Calculate exponent: -Mgh/RT
  const exponent = -(M * g * altitude) / (UNIVERSAL.GAS_CONSTANT * T)
  
  // Apply exponential decay: P = P₀ × e^(exponent)
  const pressure = ATMOSPHERE.STANDARD_PRESSURE * Math.exp(exponent)
  
  return pressure
}

/**
 * Calculate energy needed to heat water from T₁ to T₂
 * 
 * PHYSICS BACKGROUND:
 * The formula Q = mcΔT is the fundamental equation for sensible heat:
 * Where:
 *   Q = thermal energy (Joules)
 *   m = mass of water (kilograms)
 *   c = specific heat capacity (4,186 J/(kg·°C) for liquid water)
 *   ΔT = temperature change (°C)
 * 
 * Real-world example:
 * To heat 1 liter of water (1 kg) from 20°C to 100°C (ΔT = 80°C):
 * Q = 1 kg × 4,186 J/(kg·°C) × 80°C = 334,880 Joules
 * A 1000W electric kettle takes: 334,880 J ÷ 1000 W = 335 seconds ≈ 5.6 minutes
 * 
 * Note: This function assumes the water stays LIQUID (below boiling point).
 * Once water boils, additional energy goes to vaporization, not temperature increase.
 * 
 * @param {number} mass - Mass of water in kilograms
 * @param {number} tempStart - Starting temperature (°C)
 * @param {number} tempEnd - Ending temperature (°C)
 * @returns {number} Energy required in Joules
 */
export function calculateHeatingEnergy(mass, tempStart, tempEnd) {
  // Calculate temperature change
  const deltaT = tempEnd - tempStart
  
  // Convert mass from kg to grams for consistency with specific heat capacity units
  // (Some sources express c as J/(g·°C) instead of J/(kg·°C))
  const massGrams = mass * 1000
  
  // Apply Q = mcΔT formula
  // SPECIFIC_HEAT_LIQUID = 4.186 J/(g·°C) for water at 25°C
  const energy = massGrams * WATER_CONSTANTS.SPECIFIC_HEAT_LIQUID * deltaT
  
  return energy
}

/**
 * Calculate temperature change from applied heat energy
 * 
 * PHYSICS BACKGROUND:
 * When you apply heat to water, one of two things happens:
 * 
 * 1. BELOW BOILING POINT (liquid phase):
 *    Temperature increases using Q = mcΔT rearranged to ΔT = Q/(mc)
 *    Example: 100,000 J of heat → water goes from 20°C to 44°C
 * 
 * 2. AT BOILING POINT (phase change):
 *    Temperature stays constant while energy converts liquid → steam
 *    Energy requirement: Q_vaporization = m × L_v
 *    Where L_v = latent heat of vaporization (2,257,000 J/kg for water)
 *    Example: At 100°C, 100,000 J converts ~0.044 kg of water to steam
 * 
 * This function handles the transition: it calculates how much energy
 * goes to raising temperature vs. how much goes to vaporization.
 * 
 * @param {number} mass - Mass of water in kilograms
 * @param {number} currentTemp - Current water temperature (°C)
 * @param {number} energyJoules - Heat energy applied in Joules
 * @param {number} boilingPoint - Boiling point at current altitude (°C)
 * @returns {object} Object containing:
 *   - newTemp: temperature after energy application (°C)
 *   - energyToVaporization: energy remaining for phase change (J)
 *   - steamGenerated: mass of water converted to steam (kg)
 */
export function applyHeatEnergy(mass, currentTemp, energyJoules, boilingPoint) {
  const massGrams = mass * 1000
  
  // CASE 1: Apply energy as sensible heat (temperature increase)
  // ΔT = Q / (mc)
  const tempIncrease = energyJoules / (massGrams * WATER_CONSTANTS.SPECIFIC_HEAT_LIQUID)
  const potentialNewTemp = currentTemp + tempIncrease
  
  // If heating doesn't reach boiling point, we're done—just update temperature
  if (potentialNewTemp < boilingPoint) {
    return {
      newTemp: potentialNewTemp,
      energyToVaporization: 0,
      steamGenerated: 0
    }
  }
  
  // CASE 2: We reach or exceed boiling point
  // Step A: Calculate energy needed to reach boiling point
  const energyToBoiling = calculateHeatingEnergy(mass, currentTemp, boilingPoint)
  
  // Step B: Calculate remaining energy after reaching boiling point
  const remainingEnergy = energyJoules - energyToBoiling
  
  // Step C: Convert remaining energy into steam
  // m_steam = Q / L_v, where L_v = latent heat of vaporization
  // HEAT_OF_VAPORIZATION is in kJ/kg, so multiply by 1000 to get J/kg
  const steamGenerated = remainingEnergy / (WATER_CONSTANTS.HEAT_OF_VAPORIZATION * 1000)
  
  return {
    newTemp: boilingPoint,           // Temperature stays at boiling point
    energyToVaporization: remainingEnergy,
    steamGenerated: Math.max(0, steamGenerated) // Never negative
  }
}

/**
 * Convert Celsius to Fahrenheit
 * Formula: °F = (°C × 9/5) + 32
 * Example: 100°C = 212°F
 * 
 * @param {number} celsius - Temperature in Celsius
 * @returns {number} Temperature in Fahrenheit
 */
export function celsiusToFahrenheit(celsius) {
  return (celsius * 9/5) + 32
}

/**
 * Convert Fahrenheit to Celsius
 * Formula: °C = (°F - 32) × 5/9
 * Example: 212°F = 100°C
 * 
 * @param {number} fahrenheit - Temperature in Fahrenheit
 * @returns {number} Temperature in Celsius
 */
export function fahrenheitToCelsius(fahrenheit) {
  return (fahrenheit - 32) * 5/9
}

/**
 * Format temperature with specified decimal precision
 * Used for display in UI (e.g., "87.3°C" instead of "87.23456789°C")
 * 
 * @param {number} temp - Temperature value to format
 * @param {number} precision - Number of decimal places (default: 1)
 * @returns {string} Formatted temperature string (e.g., "87.3" for precision=1)
 */
export function formatTemperature(temp, precision = 1) {
  return temp.toFixed(precision)
}

/**
 * Simulate one discrete time step of the water heating/boiling process
 * 
 * GAME SIMULATION LOOP:
 * The game calls this function every 100ms (TIME_STEP from constants).
 * Each call represents 0.1 seconds of real time, during which:
 * 1. Heat energy is applied (heatInputWatts × deltaTime = Joules)
 * 2. Water temperature increases or water vaporizes
 * 3. Water mass decreases as steam escapes
 * 
 * EXAMPLE WALKTHROUGH:
 * Starting state: 1 kg of water at 20°C, altitude 0m (sea level)
 * Stove provides: 2000W heat input, simulation step: 0.1 seconds
 * 
 * Step 1: Calculate boiling point = 100°C (at sea level)
 * Step 2: Energy applied = 2000W × 0.1s = 200 Joules
 * Step 3: Call applyHeatEnergy(1.0, 20, 200, 100)
 *         ΔT = 200 / (1000g × 4.186 J/(g·°C)) = 0.048°C
 *         New temperature = 20.048°C (still far from boiling)
 * Step 4: Return updated state with new temperature
 * 
 * After many iterations (~ 335 iterations at 100ms each = 33.5 seconds):
 * Water reaches 100°C, then remaining energy converts to steam
 * 
 * @param {object} state - Current simulation state containing:
 *   - waterMass: mass of water remaining (kg)
 *   - temperature: current water temperature (°C)
 *   - altitude: altitude above sea level (meters)
 * @param {number} heatInputWatts - Power input from stove (Watts = Joules/second)
 * @param {number} deltaTime - Time step duration (seconds, typically 0.1)
 * @returns {object} Updated state with:
 *   - temperature: new water temperature (°C)
 *   - waterMass: remaining water after vaporization (kg)
 *   - energyToVaporization: energy used for phase change (J)
 *   - steamGenerated: mass of water converted to steam (kg)
 *   - allEvaporated: boolean flag if water mass drops to zero
 */
export function simulateTimeStep(state, heatInputWatts, deltaTime) {
  const { waterMass, temperature, altitude } = state
  
  // Safety check: if water is completely gone, mark it and return early
  if (waterMass <= 0) {
    return { ...state, allEvaporated: true }
  }
  
  // Calculate what the boiling point is at this altitude
  const boilingPoint = calculateBoilingPoint(altitude)
  
  // Convert heat power to energy: E = P × t
  // heatInputWatts is Watts (J/s), deltaTime is seconds, result is Joules
  const energyApplied = heatInputWatts * deltaTime
  
  // Apply all the energy to the water and get back new state
  const result = applyHeatEnergy(waterMass, temperature, energyApplied, boilingPoint)
  
  // Temperature cannot drop below ambient temperature (20°C)
  // Water naturally approaches ambient temperature but cannot go below it
  const AMBIENT_TEMP = 20  // Room temperature in Celsius
  const finalTemp = Math.max(result.newTemp, AMBIENT_TEMP)
  
  // Return updated game state with all new values
  return {
    ...state,
    temperature: finalTemp,
    waterMass: waterMass - result.steamGenerated,
    energyToVaporization: result.energyToVaporization,
    steamGenerated: result.steamGenerated,
    isBoiling: finalTemp >= boilingPoint
  }
}
