// NOTE: Read the header comments before editing. Reassess splitting into subcomponents when adding new items or behaviors.
import { describe, it, expect } from 'vitest'
import {
  calculateEffectiveCoolingCoeff,
  applyCoolingStep,
  temperatureAtTime,
  timeToCool,
  CONVECTIVE_HEAT_TRANSFER
} from '../../formulas/newtonCooling.js'
import { SPECIFIC_HEAT_VALUES } from '../../formulas/heatCapacity.js'

describe('Newton\'s Law of Cooling - dT/dt = -k(T - Tambient)', () => {
  // TEST 1: Effective cooling coefficient calculation
  it('calculates effective cooling coefficient k from physical properties', () => {
    const hA = CONVECTIVE_HEAT_TRANSFER.potInStillAir  // 0.3 W/°C
    const massKg = 1  // 1 kg
    const c = SPECIFIC_HEAT_VALUES.water  // 4.186 J/(g·°C)
    
    const k = calculateEffectiveCoolingCoeff(hA, massKg, c)
    
    // k = hA / (m × c)
    // k = 0.3 / (1 × 4186) = 0.0000716 /s
    expect(k).toBeCloseTo(0.0000716, 6)
    expect(k).toBeGreaterThan(0)
  })

  // TEST 2: Cooling is faster with large temperature difference
  it('cooling rate is proportional to temperature difference', () => {
    const ambientC = 20
    const hA = CONVECTIVE_HEAT_TRANSFER.potInStillAir
    const k = 0.0001
    const dt = 1  // 1 second time step
    
    // Hot water cooling
    const hot100C = applyCoolingStep(100, ambientC, k, dt)
    const coolFrom100 = 100 - hot100C
    
    // Lukewarm water cooling
    const warm30C = applyCoolingStep(30, ambientC, k, dt)
    const coolFrom30 = 30 - warm30C
    
    // Larger temperature difference → larger cooling
    expect(coolFrom100).toBeGreaterThan(coolFrom30)
  })

  // TEST 3: At equilibrium, cooling stops (rate ≈ 0)
  it('approaches ambient temperature (no cooling at equilibrium)', () => {
    const ambientC = 20
    const k = 0.0001
    const dt = 1
    
    // Temperature AT ambient
    const result = applyCoolingStep(ambientC, ambientC, k, dt)
    expect(result).toBe(ambientC)  // No change
  })

  // TEST 4: Analytical solution T(t) at specific times
  it('temperature at time t matches analytical solution', () => {
    const T0 = 100  // Initial: 100°C
    const Tamb = 20  // Ambient: 20°C
    const k = 0.0001  // Cooling coefficient
    const time = 3600  // After 1 hour
    
    const T = temperatureAtTime(T0, Tamb, k, time)
    
    // T(t) = Tamb + (T0 - Tamb) × e^(-kt)
    // T = 20 + 80 × e^(-0.36)
    const expected = 20 + 80 * Math.exp(-0.36)
    expect(T).toBeCloseTo(expected, 5)
  })

  // TEST 5: Boundary condition: T(0) = T0
  it('initial temperature is preserved at t=0', () => {
    const T0 = 95
    const Tamb = 15
    const k = 0.00015
    
    const T = temperatureAtTime(T0, Tamb, k, 0)
    expect(T).toBe(T0)
  })

  // TEST 6: Boundary condition: T(∞) → Tambient
  it('temperature approaches ambient as t→∞', () => {
    const T0 = 100
    const Tamb = 20
    const k = 0.0001
    const time = 100000  // Very long time
    
    const T = temperatureAtTime(T0, Tamb, k, time)
    expect(T).toBeCloseTo(Tamb, 1)
  })

  // TEST 7: Time to reach target temperature
  it('calculates time to cool to target temperature', () => {
    const T0 = 100  // Start at 100°C
    const Tamb = 20  // Ambient 20°C
    const k = 0.0001
    const Ttarget = 30  // Cool to 30°C
    
    const timeNeeded = timeToCool(T0, Ttarget, Tamb, k)
    
    // Verify: at timeNeeded, we should be ≈ Ttarget
    const tempAtTime = temperatureAtTime(T0, Tamb, k, timeNeeded)
    expect(tempAtTime).toBeCloseTo(Ttarget, 1)
    expect(timeNeeded).toBeGreaterThan(0)
  })

  // TEST 8: Discrete step clamping (shouldn't overshoot ambient)
  it('discrete step does not overshoot ambient temperature', () => {
    const ambientC = 20
    const k = 0.5  // Very large k to force aggressive cooling
    const dt = 10  // Long time step
    
    // Try to cool from 25°C to way below ambient (should clamp to ambient)
    const result = applyCoolingStep(25, ambientC, k, dt)
    expect(result).toBeGreaterThanOrEqual(ambientC)
  })

  // TEST 9: Different ambient temperatures both work
  it('cooling works with different ambient temperatures', () => {
    const T0 = 50
    const k = 0.0001
    const time = 7200
    
    // Cool in cold room (5°C)
    const coolRoom = temperatureAtTime(T0, 5, k, time)
    
    // Cool in warm room (25°C)
    const warmRoom = temperatureAtTime(T0, 25, k, time)
    
    // Cold room → lower final temperature
    expect(coolRoom).toBeLessThan(warmRoom)
    expect(coolRoom).not.toBe(warmRoom)
  })

  // TEST 10: Extreme: Cryogenic approach (liquid N2 at -196°C approaching room 20°C)
  it('handles extreme: liquid nitrogen warming to room temp', () => {
    const coldN2 = -196
    const roomC = 20
    const k = 0.0002  // Slightly higher due to extreme difference
    const time = 3600  // 1 hour
    
    const T = temperatureAtTime(coldN2, roomC, k, time)
    
    // Should be warming (not cooling), moving toward room temperature
    expect(T).toBeGreaterThan(coldN2)
    expect(T).toBeLessThan(roomC)
  })
})
