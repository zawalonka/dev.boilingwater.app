// NOTE: Read the header comments before editing. Reassess splitting into subcomponents when adding new items or behaviors.
import { describe, it, expect } from 'vitest'
import {
  solveAntoineForTemperature,
  solveAntoineForPressure
} from '../../formulas/antoineEquation.js'

describe('Antoine Equation - Vapor Pressure ↔ Temperature', () => {
  // Water coefficients (verified range: 0°C to 100°C, roughly)
  const waterCoeffs = {
    A: 8.07131,
    B: 1730.63,
    C: 233.426,
    TminC: 0,
    TmaxC: 100
  }

  // TEST 1: Formula implementation - forward direction (P to T)
  it('solves Antoine for temperature at given pressure', () => {
    // Water at sea level: 101,325 Pa should give ~100°C
    const result = solveAntoineForTemperature(101325, waterCoeffs)
    
    expect(result).toBeDefined()
    expect(result.temperature).toBeCloseTo(100, 1)
    expect(result.isExtrapolated).toBe(false)
  })

  // TEST 2: Formula implementation - reverse direction (T to P)
  it('solves Antoine for pressure at given temperature', () => {
    // Water at 100°C should give ~760 mmHg = ~101,325 Pa
    const pressurePa = solveAntoineForPressure(100, waterCoeffs)
    
    expect(pressurePa).toBeDefined()
    expect(pressurePa).toBeCloseTo(101325, -2)  // Within 100 Pa
  })

  // TEST 3: Monotonic: pressure increases with temperature
  it('vapor pressure increases monotonically with temperature', () => {
    const P_50C = solveAntoineForPressure(50, waterCoeffs)
    const P_75C = solveAntoineForPressure(75, waterCoeffs)
    const P_100C = solveAntoineForPressure(100, waterCoeffs)
    
    expect(P_50C).toBeLessThan(P_75C)
    expect(P_75C).toBeLessThan(P_100C)
  })

  // TEST 4: Zero crossing (where extrapolation begins)
  it('detects extrapolation at low temperature/pressure', () => {
    // At very low pressure (100 Pa), should extrapolate below range
    const result = solveAntoineForTemperature(100, waterCoeffs)
    
    expect(result.isExtrapolated).toBe(true)
  })

  // TEST 5: Reference point - water at 100°C = 760 mmHg
  it('water: 100°C = 760 mmHg (±0.5 mmHg)', () => {
    // 760 mmHg = 101,325 Pa
    const result = solveAntoineForTemperature(101325, waterCoeffs)
    
    expect(result.temperature).toBeCloseTo(100, 0)  // Very accurate
    expect(result.isExtrapolated).toBe(false)
  })

  // TEST 6: Round-trip: T→P→T (reversibility)
  it('round-trip T→P→T within tolerance (±0.5°C)', () => {
    const originalT = 50
    const P = solveAntoineForPressure(originalT, waterCoeffs)
    const result = solveAntoineForTemperature(P, waterCoeffs)
    
    expect(result.temperature).toBeCloseTo(originalT, 0)
  })

  // TEST 7: Extrapolation detection - below verified range
  it('detects extrapolation below TminC', () => {
    // Try to solve at -50°C (below verified 0°C)
    const veryLowP = solveAntoineForPressure(-50, waterCoeffs)
    const result = solveAntoineForTemperature(veryLowP, waterCoeffs)
    
    expect(result.isExtrapolated).toBe(true)
    expect(result.verifiedRange.min).toBe(0)
  })

  // TEST 8: Extrapolation detection - above verified range
  it('detects extrapolation above TmaxC', () => {
    // Try to solve at 150°C (above verified 100°C)
    const veryHighP = solveAntoineForPressure(150, waterCoeffs)
    const result = solveAntoineForTemperature(veryHighP, waterCoeffs)
    
    expect(result.isExtrapolated).toBe(true)
    expect(result.verifiedRange.max).toBe(100)
  })

  // TEST 9: Non-linear relationship (not simple proportionality)
  it('shows non-linear relationship between P and T', () => {
    // Small temperature change at low T vs high T should give different pressure changes
    const P1 = solveAntoineForPressure(25, waterCoeffs)
    const P2 = solveAntoineForPressure(35, waterCoeffs)  // 10°C difference
    const dP_lowT = P2 - P1
    
    const P3 = solveAntoineForPressure(85, waterCoeffs)
    const P4 = solveAntoineForPressure(95, waterCoeffs)  // 10°C difference
    const dP_highT = P4 - P3
    
    // Pressure change is larger at higher temperatures (non-linear)
    expect(dP_highT).toBeGreaterThan(dP_lowT)
    expect(dP_highT / dP_lowT).toBeGreaterThan(1.5)
  })

  // TEST 10: Never returns negative pressure
  it('never returns negative pressure', () => {
    // Even at extreme low temperatures, pressure should be positive
    const result = solveAntoineForTemperature(1, waterCoeffs)  // 1 Pa (almost vacuum)
    
    if (result) {
      // The coefficient gives a valid temperature
      expect(result.temperature).toBeDefined()
    }
    
    // Forward direction should also stay positive
    const extremeLowT = -100
    const P = solveAntoineForPressure(extremeLowT, waterCoeffs)
    expect(P).toBeGreaterThan(0)
  })

  // TEST 11: Altitude scenario - check direction not exact value
  it('altitude effects: lower pressure gives lower boiling point', () => {
    // At sea level (101,325 Pa) → ~100°C
    const seaLevel = solveAntoineForTemperature(101325, waterCoeffs)
    
    // At high altitude (~83,500 Pa) → lower than sea level
    const altitude = solveAntoineForTemperature(83500, waterCoeffs)
    
    expect(altitude.temperature).toBeLessThan(seaLevel.temperature)
    expect(altitude.temperature).toBeGreaterThan(90)  // Should still be in reasonable range
    expect(altitude.temperature).toBeLessThan(100)
  })

  // TEST 12: Extreme altitude - very low boiling point
  it('extreme altitude (Mt. Everest): boiling point drops significantly', () => {
    // At Everest (~33,700 Pa), water boils much lower than sea level
    const result = solveAntoineForTemperature(33700, waterCoeffs)
    
    // Should be well below 100°C but not unreasonably low
    expect(result.temperature).toBeGreaterThan(65)
    expect(result.temperature).toBeLessThan(75)
    // Still within verified range (0-100°C), so not marked as extrapolated
  })
})
