/**
 * TEMPERATURE CONVERSION
 * ======================
 * 
 * Temperature can be expressed in different scales. The three most common are:
 * 
 * CELSIUS (°C):
 *   - Water freezes at 0°C, boils at 100°C (at sea level)
 *   - Used worldwide for everyday temperatures
 *   - Named after Anders Celsius (1701-1744)
 * 
 * FAHRENHEIT (°F):
 *   - Water freezes at 32°F, boils at 212°F
 *   - Used in USA for everyday temperatures
 *   - Named after Daniel Fahrenheit (1686-1736)
 * 
 * KELVIN (K):
 *   - Absolute zero is 0 K (-273.15°C)
 *   - Water freezes at 273.15 K, boils at 373.15 K
 *   - Used in scientific calculations (thermodynamics)
 *   - Named after Lord Kelvin (1824-1907)
 *   - Note: No degree symbol for Kelvin (just "K", not "°K")
 * 
 * CONVERSION FORMULAS:
 *   °C to °F: °F = (°C × 9/5) + 32
 *   °F to °C: °C = (°F - 32) × 5/9
 *   °C to K:  K = °C + 273.15
 *   K to °C:  °C = K - 273.15
 * 
 * HELPFUL REFERENCE POINTS:
 *   -40°   = -40°C = -40°F (the only point where they're equal!)
 *   0°C    = 32°F = 273.15 K (freezing water)
 *   20°C   = 68°F (comfortable room temperature)
 *   37°C   = 98.6°F (human body temperature)
 *   100°C  = 212°F = 373.15 K (boiling water at sea level)
 */

// Offset between Celsius and Kelvin
const KELVIN_OFFSET = 273.15

/**
 * Convert Celsius to Fahrenheit
 * Formula: °F = (°C × 9/5) + 32
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
 * 
 * @param {number} fahrenheit - Temperature in Fahrenheit
 * @returns {number} Temperature in Celsius
 */
export function fahrenheitToCelsius(fahrenheit) {
  return (fahrenheit - 32) * 5/9
}

/**
 * Convert Celsius to Kelvin
 * Formula: K = °C + 273.15
 * 
 * @param {number} celsius - Temperature in Celsius
 * @returns {number} Temperature in Kelvin
 */
export function celsiusToKelvin(celsius) {
  return celsius + KELVIN_OFFSET
}

/**
 * Convert Kelvin to Celsius
 * Formula: °C = K - 273.15
 * 
 * @param {number} kelvin - Temperature in Kelvin
 * @returns {number} Temperature in Celsius
 */
export function kelvinToCelsius(kelvin) {
  return kelvin - KELVIN_OFFSET
}

/**
 * Convert Fahrenheit to Kelvin
 * 
 * @param {number} fahrenheit - Temperature in Fahrenheit
 * @returns {number} Temperature in Kelvin
 */
export function fahrenheitToKelvin(fahrenheit) {
  return celsiusToKelvin(fahrenheitToCelsius(fahrenheit))
}

/**
 * Convert Kelvin to Fahrenheit
 * 
 * @param {number} kelvin - Temperature in Kelvin
 * @returns {number} Temperature in Fahrenheit
 */
export function kelvinToFahrenheit(kelvin) {
  return celsiusToFahrenheit(kelvinToCelsius(kelvin))
}

/**
 * Format temperature with specified decimal precision
 * Used for display in UI
 * 
 * @param {number} temp - Temperature value to format
 * @param {number} precision - Number of decimal places (default: 1)
 * @returns {string} Formatted temperature string
 */
export function formatTemperature(temp, precision = 1) {
  if (!Number.isFinite(temp)) return '--'
  return temp.toFixed(precision)
}
