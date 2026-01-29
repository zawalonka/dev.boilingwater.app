import { ATMOSPHERE, UNIVERSAL, GAME_CONFIG } from '../constants/physics'

/**
 * Calculate boiling point based on altitude
 * Now accepts fluid properties for different substances
 * 
 * PHYSICS BACKGROUND:
 * Liquids boil when their vapor pressure equals atmospheric pressure. As altitude increases,
 * atmospheric pressure decreases, so liquids boil at lower temperatures.
 * Real-world example: At Denver (1600m), water boils at ~95°C instead of 100°C.
 * At Mount Everest (8848m), water boils at ~68°C.
 * 
 * We use a simplified linear model:
 * - Atmospheric pressure decreases exponentially with altitude (barometric formula)
 * - But boiling point changes roughly linearly: ~1°C per 300 meters
 * - This is an approximation; real Clausius-Clapeyron equation is more complex
 * 
 * @param {number} altitude - Altitude in meters above sea level (0 = sea level, 5000 = Denver)
 * @param {object} fluidProps - Fluid properties object containing boilingPointSeaLevel and altitudeLapseRate
 * @returns {number} Boiling point in Celsius (100 at sea level for water, ~95 at Denver, ~68 at Everest)
 */
export function calculateBoilingPoint(altitude, fluidProps) {
  if (!fluidProps || !Number.isFinite(fluidProps.boilingPointSeaLevel)) {
    return null
  }

  // Safety check: treat null/undefined/negative as sea level
  if (!altitude || altitude < 0) altitude = 0
  
  // Linear approximation using fluid-specific lapse rate
  const lapseRate = Number.isFinite(fluidProps.altitudeLapseRate)
    ? fluidProps.altitudeLapseRate
    : ATMOSPHERE.TEMP_LAPSE_RATE
  const temperatureDrop = altitude * lapseRate
  
  // Start from fluid's standard boiling point and subtract elevation effect
  const boilingPoint = fluidProps.boilingPointSeaLevel - temperatureDrop
  
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
 * Calculate energy needed to heat a fluid from T₁ to T₂
 * Now accepts fluid properties for different substances
 * 
 * PHYSICS BACKGROUND:
 * The formula Q = mcΔT is the fundamental equation for sensible heat:
 * Where:
 *   Q = thermal energy (Joules)
 *   m = mass of fluid (kilograms)
 *   c = specific heat capacity (varies by substance: 4.186 for water, 2.44 for ethanol, etc.)
 *   ΔT = temperature change (°C)
 * 
 * Real-world example (water):
 * To heat 1 liter of water (1 kg) from 20°C to 100°C (ΔT = 80°C):
 * Q = 1 kg × 4,186 J/(kg·°C) × 80°C = 334,880 Joules
 * A 1000W electric kettle takes: 334,880 J ÷ 1000 W = 335 seconds ≈ 5.6 minutes
 * 
 * Note: This function assumes the fluid stays LIQUID (below boiling point).
 * Once fluid boils, additional energy goes to vaporization, not temperature increase.
 * 
 * @param {number} mass - Mass of fluid in kilograms
 * @param {number} tempStart - Starting temperature (°C)
 * @param {number} tempEnd - Ending temperature (°C)
 * @param {object} fluidProps - Fluid properties object containing specificHeat
 * @returns {number} Energy required in Joules
 */
export function calculateHeatingEnergy(mass, tempStart, tempEnd, fluidProps) {
  // Calculate temperature change
  const deltaT = tempEnd - tempStart
  
  // Convert mass from kg to grams for consistency with specific heat capacity units
  // (Specific heat is typically expressed as J/(g·°C))
  const massGrams = mass * 1000
  
  // Apply Q = mcΔT formula
  const energy = massGrams * fluidProps.specificHeat * deltaT
  
  return energy
}

/**
 * Calculate temperature change from applied heat energy
 * Now accepts fluid properties for extensibility to different substances
 * 
 * PHYSICS BACKGROUND:
 * When you apply heat to a liquid, one of two things happens:
 * 
 * 1. BELOW BOILING POINT (liquid phase):
 *    Temperature increases using Q = mcΔT rearranged to ΔT = Q/(mc)
 *    Example: 100,000 J of heat → water goes from 20°C to 44°C
 * 
 * 2. AT BOILING POINT (phase change):
 *    Temperature stays constant while energy converts liquid → vapor
 *    Energy requirement: Q_vaporization = m × L_v
 *    Where L_v = latent heat of vaporization (2,257 kJ/kg for water, 838 kJ/kg for ethanol)
 *    Example: At 100°C, 100,000 J converts ~0.044 kg of water to steam
 * 
 * This function handles the transition: it calculates how much energy
 * goes to raising temperature vs. how much goes to vaporization.
 * 
 * @param {number} mass - Mass of fluid in kilograms
 * @param {number} currentTemp - Current fluid temperature (°C)
 * @param {number} energyJoules - Heat energy applied in Joules
 * @param {number} boilingPoint - Boiling point at current altitude (°C)
 * @param {object} fluidProps - Fluid properties object containing specificHeat and heatOfVaporization
 * @returns {object} Object containing:
 *   - newTemp: temperature after energy application (°C)
 *   - energyToVaporization: energy remaining for phase change (J)
 *   - steamGenerated: mass of fluid converted to vapor (kg)
 */
export function applyHeatEnergy(mass, currentTemp, energyJoules, boilingPoint, fluidProps) {
  if (!Number.isFinite(fluidProps?.specificHeat) || mass <= 0) {
    return {
      newTemp: currentTemp,
      energyToVaporization: 0,
      steamGenerated: 0
    }
  }

  const massGrams = mass * 1000
  
  // CASE 1: Apply energy as sensible heat (temperature increase)
  // ΔT = Q / (mc)
  const tempIncrease = energyJoules / (massGrams * fluidProps.specificHeat)
  const potentialNewTemp = currentTemp + tempIncrease

  const canBoil = Number.isFinite(boilingPoint) && Number.isFinite(fluidProps?.heatOfVaporization) && fluidProps.heatOfVaporization > 0
  
  // If heating doesn't reach boiling point, we're done—just update temperature
  if (!canBoil || potentialNewTemp < boilingPoint) {
    return {
      newTemp: potentialNewTemp,
      energyToVaporization: 0,
      steamGenerated: 0
    }
  }
  
  // CASE 2: We reach or exceed boiling point
  // Step A: Calculate energy needed to reach boiling point
  const energyToBoiling = calculateHeatingEnergy(mass, currentTemp, boilingPoint, fluidProps)
  
  // Step B: Calculate remaining energy after reaching boiling point
  const remainingEnergy = energyJoules - energyToBoiling
  
  // Step C: Convert remaining energy into vapor
  // m_vapor = Q / L_v, where L_v = latent heat of vaporization
  // heatOfVaporization is in kJ/kg, so multiply by 1000 to get J/kg
  const steamGenerated = remainingEnergy / (fluidProps.heatOfVaporization * 1000)
  
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
 * Simulate one discrete time step of the fluid heating/boiling process
 * Now with Newton's Law of Cooling and fluid property support
 * 
 * GAME SIMULATION LOOP:
 * The game calls this function every 100ms (TIME_STEP from constants).
 * Each call represents 0.1 seconds of real time, during which:
 * 1. Heat energy is applied (heatInputWatts × deltaTime = Joules)
 * 2. Fluid temperature increases or fluid vaporizes
 * 3. Fluid mass decreases as vapor escapes
 * 4. Natural cooling occurs when heat input is negative or zero (Newton's Law)
 * 
 * NEWTON'S LAW OF COOLING:
 * When a hot object cools, the rate of temperature change is proportional
 * to the temperature difference between the object and its surroundings:
 * 
 *   dT/dt = -k(T - T_ambient)
 * 
 * Where:
 *   k = heat transfer coefficient (depends on fluid, container, air movement)
 *   T = current temperature
 *   T_ambient = room temperature (typically 20°C)
 * 
 * This creates exponential decay: hot fluids cool quickly at first, then
 * progressively slower as they approach room temperature.
 * 
 * Example: Water at 100°C with k=0.0015/s in a metal pot:
 *   - At 100°C: cooling rate = -0.0015 × (100-20) = -0.12°C/s (fast)
 *   - At 60°C: cooling rate = -0.0015 × (60-20) = -0.06°C/s (medium)
 *   - At 30°C: cooling rate = -0.0015 × (30-20) = -0.015°C/s (slow)
 * 
 * EXAMPLE WALKTHROUGH (water):
 * Starting state: 1 kg of water at 20°C, altitude 0m (sea level)
 * Stove provides: 2000W heat input, simulation step: 0.1 seconds
 * 
 * Step 1: Calculate boiling point = 100°C (at sea level for water)
 * Step 2: Energy applied = 2000W × 0.1s = 200 Joules
 * Step 3: Call applyHeatEnergy(1.0, 20, 200, 100, waterProps)
 *         ΔT = 200 / (1000g × 4.186 J/(g·°C)) = 0.048°C
 *         New temperature = 20.048°C (still far from boiling)
 * Step 4: Return updated state with new temperature
 * 
 * After many iterations (~ 335 iterations at 100ms each = 33.5 seconds):
 * Water reaches 100°C, then remaining energy converts to steam
 * 
 * @param {object} state - Current simulation state containing:
 *   - waterMass: mass of fluid remaining (kg)
 *   - temperature: current fluid temperature (°C)
 *   - altitude: altitude above sea level (meters)
 * @param {number} heatInputWatts - Power input from stove (Watts = Joules/second)
 *                                  Use 0 or negative for natural cooling only
 * @param {number} deltaTime - Time step duration (seconds, typically 0.1)
 * @param {object} fluidProps - Fluid properties (specificHeat, heatOfVaporization, coolingCoefficient, etc.)
 * @returns {object} Updated state with:
 *   - temperature: new fluid temperature (°C)
 *   - waterMass: remaining fluid after vaporization (kg)
 *   - energyToVaporization: energy used for phase change (J)
 *   - steamGenerated: mass of fluid converted to vapor (kg)
 *   - allEvaporated: boolean flag if fluid mass drops to zero
 */
export function simulateTimeStep(state, heatInputWatts, deltaTime, fluidProps) {
  const { waterMass, temperature, altitude } = state
  const residueMass = Number.isFinite(state.residueMass) ? state.residueMass : 0
  const evaporableMass = Math.max(0, waterMass - residueMass)
  
  // Safety check: if fluid is completely gone, mark it and return early
  if (waterMass <= 0 || evaporableMass <= 0) {
    return { ...state, allEvaporated: evaporableMass <= 0 }
  }

  if (!fluidProps) {
    return { ...state }
  }
  
  // Calculate what the boiling point is at this altitude
  const boilingPoint = calculateBoilingPoint(altitude, fluidProps)
  const canBoil = Boolean(fluidProps.canBoil) && Number.isFinite(boilingPoint)
  
  // HEATING PHASE: Apply heat energy from burner
  let currentTemp = temperature
  let result = { newTemp: currentTemp, energyToVaporization: 0, steamGenerated: 0 }
  
  if (heatInputWatts > 0) {
    // Convert heat power to energy: E = P × t
    const energyApplied = heatInputWatts * deltaTime
    
    // Apply all the energy to the fluid and get back new state
    result = applyHeatEnergy(waterMass, currentTemp, energyApplied, boilingPoint, fluidProps)
    currentTemp = result.newTemp
  }
  
  // COOLING PHASE: Apply Newton's Law of Cooling
  // Only cool if temperature is above ambient (and not actively boiling)
  const AMBIENT_TEMP = GAME_CONFIG.ROOM_TEMPERATURE || 20  // Room temperature in Celsius
  
  if (currentTemp > AMBIENT_TEMP && heatInputWatts <= 0) {
    // Newton's Law: dT/dt = -k(T - T_ambient)
    // Discrete approximation: ΔT = -k × (T - T_ambient) × Δt
    const tempDifference = currentTemp - AMBIENT_TEMP
    const coolingRate = fluidProps.coolingCoefficient * tempDifference * deltaTime
    currentTemp = currentTemp - coolingRate
    
    // Never cool below ambient temperature
    currentTemp = Math.max(currentTemp, AMBIENT_TEMP)
  }
  
  // Return updated game state with all new values
  const steamGenerated = canBoil
    ? Math.min(result.steamGenerated, evaporableMass)
    : 0
  const nextWaterMass = Math.max(waterMass - steamGenerated, residueMass)

  return {
    ...state,
    temperature: currentTemp,
    waterMass: nextWaterMass,
    energyToVaporization: result.energyToVaporization,
    steamGenerated: steamGenerated,
    isBoiling: canBoil && currentTemp >= boilingPoint && steamGenerated > 0
  }
}
