// NOTE: Read the header comments before editing. Reassess splitting into subcomponents when adding new items or behaviors.
import { describe, it, expect } from 'vitest'
import {
  calculateVaporizationEnergy,
  calculateVaporizedMass,
  calculateFusionEnergy,
  calculateMeltedMass,
  LATENT_HEAT_VALUES
} from '../../formulas/latentHeat.js'
import { calculateEnergyTolerance } from '../../formulas/heatCapacity.js'

describe('Latent Heat - Phase Change Energy', () => {
  // TEST 1: Formula Q = m × Lv verification (vaporization)
  it('implements Q = m × Lv for vaporization', () => {
    const massKg = 1
    const Lv = LATENT_HEAT_VALUES.vaporization.water  // 2257 kJ/kg
    
    const energyJ = calculateVaporizationEnergy(massKg, Lv)
    // Q = 1 kg × 2,257,000 J/kg = 2,257,000 J
    const expectedJ = 2_257_000
    
    expect(energyJ).toBeCloseTo(expectedJ, 1)
  })

  // TEST 2: Linear scaling with mass for vaporization
  it('vaporization scales linearly with mass', () => {
    const Lv = LATENT_HEAT_VALUES.vaporization.water
    const energy1kg = calculateVaporizationEnergy(1, Lv)
    const energy3kg = calculateVaporizationEnergy(3, Lv)
    
    expect(energy3kg).toBeCloseTo(energy1kg * 3, 5)
  })

  // TEST 3: Water vaporization - practical example (1kg at 100°C)
  it('water vaporization: 1kg → 2,257,000 J (±225.7 J)', () => {
    const energy = calculateVaporizationEnergy(1, LATENT_HEAT_VALUES.vaporization.water)
    const expected = 2_257_000
    
    // Dynamic tolerance: 0.01% = 225.7 J
    expect(energy).toBeCloseTo(expected, 1)
  })

  // TEST 4: Formula Q = m × Lf verification (fusion/melting)
  it('implements Q = m × Lf for melting', () => {
    const massKg = 1
    const Lf = LATENT_HEAT_VALUES.fusion.water  // 334 kJ/kg
    
    const energyJ = calculateFusionEnergy(massKg, Lf)
    const expectedJ = 334_000
    
    expect(energyJ).toBeCloseTo(expectedJ, 1)
  })

  // TEST 5: Water fusion - practical example (1kg ice → liquid)
  it('water fusion: 1kg → 334,000 J (±33.4 J)', () => {
    const energy = calculateFusionEnergy(1, LATENT_HEAT_VALUES.fusion.water)
    const expected = 334_000
    
    expect(energy).toBeCloseTo(expected, 1)
  })

  // TEST 6: Inverse formula for vaporization: mass = Q / Lv
  it('inverse formula: mass = Q / Lv', () => {
    const Lv = LATENT_HEAT_VALUES.vaporization.water
    const originalMass = 2.5
    
    const Q = calculateVaporizationEnergy(originalMass, Lv)
    const recoveredMass = calculateVaporizedMass(Q, Lv)
    
    expect(recoveredMass).toBeCloseTo(originalMass, 5)
  })

  // TEST 7: Inverse formula for fusion: mass = Q / Lf
  it('inverse formula: mass = Q / Lf', () => {
    const Lf = LATENT_HEAT_VALUES.fusion.water
    const originalMass = 1.75
    
    const Q = calculateFusionEnergy(originalMass, Lf)
    const recoveredMass = calculateMeltedMass(Q, Lf)
    
    expect(recoveredMass).toBeCloseTo(originalMass, 5)
  })

  // TEST 8: Vaporization >> Fusion (Lv is ~6.75× larger than Lf for water)
  it('vaporization requires much more energy than fusion', () => {
    const massKg = 1
    const fusionEnergy = calculateFusionEnergy(massKg, LATENT_HEAT_VALUES.fusion.water)
    const vaporizationEnergy = calculateVaporizationEnergy(massKg, LATENT_HEAT_VALUES.vaporization.water)
    
    // Vapor should be ~6.75× larger
    const ratio = vaporizationEnergy / fusionEnergy
    expect(ratio).toBeCloseTo(6.75, 1)
  })

  // TEST 9: Different substances have different latent heats
  it('different substances have different latent heats', () => {
    const massKg = 1
    
    const waterVapor = calculateVaporizationEnergy(massKg, LATENT_HEAT_VALUES.vaporization.water)
    const ethanolVapor = calculateVaporizationEnergy(massKg, LATENT_HEAT_VALUES.vaporization.ethanol)
    
    // Ethanol has lower latent heat (838 vs 2257 kJ/kg)
    expect(ethanolVapor).toBeLessThan(waterVapor)
    expect(waterVapor / ethanolVapor).toBeCloseTo(2257 / 838, 1)
  })

  // TEST 10: Zero energy division protection
  it('handles zero or invalid latent heat gracefully', () => {
    expect(calculateVaporizationEnergy(1, 0)).toBe(0)
    expect(calculateVaporizedMass(100000, 0)).toBe(0)
  })
})
