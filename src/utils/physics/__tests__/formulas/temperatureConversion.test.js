import { describe, it, expect } from 'vitest'
import {
  celsiusToFahrenheit,
  fahrenheitToCelsius,
  celsiusToKelvin,
  kelvinToCelsius,
  fahrenheitToKelvin,
  kelvinToFahrenheit,
  formatTemperature
} from '../../formulas/temperatureConversion.js'

describe('Temperature Conversion - All Scales', () => {
  // TEST 1: Round-trip C→F→C (reversibility)
  it('implements reversible C↔F conversion', () => {
    const originalC = 42.3
    const F = celsiusToFahrenheit(originalC)
    const backToC = fahrenheitToCelsius(F)
    
    // Allow tiny floating-point error (±0.01°C)
    expect(backToC).toBeCloseTo(originalC, 2)
  })

  // TEST 2: Reference point - water freezing (0°C = 32°F)
  it('verifies reference: 0°C = 32°F', () => {
    expect(celsiusToFahrenheit(0)).toBeCloseTo(32, 10)
    expect(fahrenheitToCelsius(32)).toBeCloseTo(0, 10)
  })

  // TEST 3: Reference point - water boiling (100°C = 212°F)
  it('verifies reference: 100°C = 212°F', () => {
    expect(celsiusToFahrenheit(100)).toBeCloseTo(212, 10)
    expect(fahrenheitToCelsius(212)).toBeCloseTo(100, 10)
  })

  // TEST 4: Reference point - equal scales (-40°C = -40°F)
  it('verifies reference: -40°C = -40°F (equal point)', () => {
    expect(celsiusToFahrenheit(-40)).toBeCloseTo(-40, 10)
    expect(fahrenheitToCelsius(-40)).toBeCloseTo(-40, 10)
  })

  // TEST 5: Extreme low temperature (-196°C, liquid nitrogen)
  it('handles extreme cold (-196°C to -321°F)', () => {
    const liquidN2C = -196
    const liquidN2F = celsiusToFahrenheit(liquidN2C)
    // Expected: -196 × 9/5 + 32 = -320.8°F
    expect(liquidN2F).toBeCloseTo(-320.8, 1)
    // Reversible
    expect(fahrenheitToCelsius(liquidN2F)).toBeCloseTo(liquidN2C, 2)
  })

  // TEST 6: Extreme high temperature (300°C, superheated steam)
  it('handles extreme heat (300°C to 572°F)', () => {
    const superheatC = 300
    const superheatF = celsiusToFahrenheit(superheatC)
    // Expected: 300 × 9/5 + 32 = 572°F
    expect(superheatF).toBeCloseTo(572, 1)
    expect(fahrenheitToCelsius(superheatF)).toBeCloseTo(superheatC, 2)
  })

  // TEST 7: Celsius to Kelvin (0°C = 273.15 K)
  it('converts Celsius to Kelvin (0°C = 273.15 K)', () => {
    expect(celsiusToKelvin(0)).toBeCloseTo(273.15, 10)
    expect(celsiusToKelvin(100)).toBeCloseTo(373.15, 10)
    expect(celsiusToKelvin(-273.15)).toBeCloseTo(0, 10)
  })

  // TEST 8: Kelvin to Celsius (round-trip)
  it('converts Kelvin to Celsius (reversible)', () => {
    const tempK = 298.15  // ~25°C
    const tempC = kelvinToCelsius(tempK)
    expect(tempC).toBeCloseTo(25, 10)
    expect(celsiusToKelvin(tempC)).toBeCloseTo(tempK, 10)
  })

  // TEST 9: Fahrenheit to Kelvin via composites
  it('converts F→K and K→F through composites', () => {
    const tempF = 68  // Room temperature
    const tempK = fahrenheitToKelvin(tempF)
    // 68°F = 20°C = 293.15 K
    expect(tempK).toBeCloseTo(293.15, 1)
    expect(kelvinToFahrenheit(tempK)).toBeCloseTo(tempF, 1)
  })

  // TEST 10: Format temperature function
  it('formats temperature with correct decimal places', () => {
    expect(formatTemperature(20.456, 1)).toBe('20.5')
    expect(formatTemperature(20.456, 2)).toBe('20.46')
    expect(formatTemperature(20.456, 0)).toBe('20')
    expect(formatTemperature(Infinity, 1)).toBe('--')
    expect(formatTemperature(NaN, 1)).toBe('--')
  })
})
