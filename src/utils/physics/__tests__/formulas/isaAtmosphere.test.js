// NOTE: Read the header comments before editing. Reassess splitting into subcomponents when adding new items or behaviors.
import { describe, it, expect } from 'vitest'
import {
  calculatePressureISA,
  calculateTemperatureISA,
  calculateAltitudeFromPressure
} from '../../formulas/isaAtmosphere.js'

describe('ISA (International Standard Atmosphere) - Altitude/Pressure/Temperature', () => {
  // TEST 1: Sea level reference (0m = 101,325 Pa)
  it('sea level pressure: 0m → 101,325 Pa (±100 Pa)', () => {
    const P = calculatePressureISA(0)
    expect(P).toBeCloseTo(101325, -2)  // Within 100 Pa
  })

  // TEST 2: Pressure decreases with altitude
  it('pressure decreases monotonically with altitude', () => {
    const P_0m = calculatePressureISA(0)
    const P_1000m = calculatePressureISA(1000)
    const P_5000m = calculatePressureISA(5000)
    const P_10000m = calculatePressureISA(10000)
    
    expect(P_0m).toBeGreaterThan(P_1000m)
    expect(P_1000m).toBeGreaterThan(P_5000m)
    expect(P_5000m).toBeGreaterThan(P_10000m)
  })

  // TEST 3: Denver (5,500 ft ≈ 1,609m) - pressure decreases
  it('Denver (1,609m) has lower pressure than sea level', () => {
    const P_sea = calculatePressureISA(0)
    const P_denver = calculatePressureISA(1609)
    
    // Should be significantly lower (roughly 82-84% of sea level)
    expect(P_denver).toBeLessThan(P_sea)
    expect(P_denver).toBeGreaterThan(80000)  // At least ~80 kPa
    expect(P_denver).toBeLessThan(85000)     // But less than ~85 kPa
  })

  // TEST 4: La Paz (3,640m) - mid-altitude marker
  it('La Paz (3,640m) between Denver and Everest', () => {
    const P_denver = calculatePressureISA(1609)
    const P_lapaz = calculatePressureISA(3640)
    const P_everest = calculatePressureISA(8848)
    
    // Pressure should decrease monotonically with altitude
    expect(P_denver).toBeGreaterThan(P_lapaz)
    expect(P_lapaz).toBeGreaterThan(P_everest)
    expect(P_lapaz).toBeGreaterThan(60000)  // Roughly 60+ kPa
  })

  // TEST 5: Mt. Everest (8,848m) - extreme low pressure
  it('Mt. Everest (8,848m) extreme low pressure (~30-35 kPa)', () => {
    const P = calculatePressureISA(8848)
    
    // Everest pressure is roughly 30-35 kPa depending on ISA variant
    expect(P).toBeGreaterThan(30000)
    expect(P).toBeLessThan(35000)
  })

  // TEST 6: Extreme altitude (above troposphere at ~11km)
  it('handles extreme altitude above 11km (constant at tropopause)', () => {
    // ISA model caps T at 216.65 K -> pressure becomes constant
    const P_11km = calculatePressureISA(11000)
    const P_15km = calculatePressureISA(15000)
    const P_20km = calculatePressureISA(20000)
    
    // Above 11km, temperature is constant, so pressure follows a new curve
    // It should still decrease but more slowly
    expect(P_11km).toBeGreaterThan(P_15km)
    expect(P_15km).toBeGreaterThan(P_20km)
  })

  // TEST 7: Temperature decreases with altitude (troposphere)
  it('temperature decreases with altitude', () => {
    const T0 = calculateTemperatureISA(0)
    const T1000 = calculateTemperatureISA(1000)
    const T5000 = calculateTemperatureISA(5000)
    
    expect(T0).toBeGreaterThan(T1000)
    expect(T1000).toBeGreaterThan(T5000)
  })

  // TEST 8: Sea level temperature (288.15 K = 15°C)
  it('sea level temperature: 0m → 288.15 K (15°C)', () => {
    const T = calculateTemperatureISA(0)
    expect(T).toBeCloseTo(288.15, 5)
  })

  // TEST 9: Reverse calculation: altitude from pressure
  it('reverse lookup: pressure → altitude', () => {
    const originalAlt = 5000
    const P = calculatePressureISA(originalAlt)
    const recoveredAlt = calculateAltitudeFromPressure(P)
    
    expect(recoveredAlt).toBeCloseTo(originalAlt, 5)
  })

  // TEST 10: Never returns negative or zero pressure
  it('always returns positive pressure', () => {
    const altitudes = [0, 1000, 5000, 10000, 15000, 20000]
    
    for (const alt of altitudes) {
      const P = calculatePressureISA(alt)
      expect(P).toBeGreaterThan(0)
      expect(Number.isFinite(P)).toBe(true)
    }
  })

  // TEST 11: Invalid altitude inputs default to sea level
  it('handles invalid altitude inputs (null/undefined/NaN)', () => {
    const P_null = calculatePressureISA(null)
    const P_undefined = calculatePressureISA(undefined)
    const P_nan = calculatePressureISA(NaN)
    
    // All should return sea level pressure
    expect(P_null).toBeCloseTo(101325, -2)
    expect(P_undefined).toBeCloseTo(101325, -2)
    expect(P_nan).toBeCloseTo(101325, -2)
  })

  // TEST 12: Extreme: Negative altitude (below sea level)
  it('handles negative altitude (pressurization)', () => {
    const P_sea = calculatePressureISA(0)
    const P_negative = calculatePressureISA(-500)  // 500m below sea level
    
    // Pressure should increase going below sea level
    expect(P_negative).toBeGreaterThan(P_sea)
  })
})
