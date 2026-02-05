import { describe, it, expect } from 'vitest'
import {
  calculateHeatEnergy,
  calculateTempChange,
  calculateEnergyTolerance,
  SPECIFIC_HEAT_VALUES
} from '../../formulas/heatCapacity.js'

describe('Heat Capacity - Q = mcΔT', () => {
  // TEST 1: Formula Q = mcΔT verification
  it('implements Q = mcΔT correctly', () => {
    // Heating 1 kg water by 10°C
    const massKg = 1
    const specificHeat = SPECIFIC_HEAT_VALUES.water  // 4.186 J/(g·°C)
    const tempChangeC = 10
    
    const result = calculateHeatEnergy(massKg, specificHeat, tempChangeC)
    // Q = 1000g × 4.186 J/(g·°C) × 10°C = 41,860 J
    const expected = 41860
    
    expect(result).toBeCloseTo(expected, calculateEnergyTolerance(expected))
  })

  // TEST 2: Linear scaling with mass (2× mass = 2× energy)
  it('scales linearly with mass', () => {
    const c = SPECIFIC_HEAT_VALUES.water
    const dT = 50
    
    const energy1kg = calculateHeatEnergy(1, c, dT)
    const energy2kg = calculateHeatEnergy(2, c, dT)
    
    expect(energy2kg).toBeCloseTo(energy1kg * 2, 5)
  })

  // TEST 3: Linear scaling with temperature change (2× ΔT = 2× energy)
  it('scales linearly with temperature change', () => {
    const massKg = 1.5
    const c = SPECIFIC_HEAT_VALUES.ethanol
    
    const energy10C = calculateHeatEnergy(massKg, c, 10)
    const energy20C = calculateHeatEnergy(massKg, c, 20)
    
    expect(energy20C).toBeCloseTo(energy10C * 2, 5)
  })

  // TEST 4: Linear scaling with specific heat (2× c = 2× energy)
  it('scales linearly with specific heat', () => {
    const massKg = 2
    const dT = 15
    
    const energyWater = calculateHeatEnergy(massKg, SPECIFIC_HEAT_VALUES.water, dT)
    const energyIce = calculateHeatEnergy(massKg, SPECIFIC_HEAT_VALUES.ice, dT)
    
    // Ice has lower specific heat, so less energy needed
    expect(energyIce).toBeLessThan(energyWater)
    // Ratio should match specific heat ratio
    const ratio = SPECIFIC_HEAT_VALUES.ice / SPECIFIC_HEAT_VALUES.water
    expect(energyIce / energyWater).toBeCloseTo(ratio, 5)
  })

  // TEST 5: Inverse formula: ΔT = Q / (mc)
  it('inverse formula ΔT = Q / (mc) works', () => {
    const massKg = 2
    const c = SPECIFIC_HEAT_VALUES.water
    const originalDT = 35
    
    const Q = calculateHeatEnergy(massKg, c, originalDT)
    const recoveredDT = calculateTempChange(massKg, c, Q)
    
    expect(recoveredDT).toBeCloseTo(originalDT, calculateEnergyTolerance(Q))
  })

  // TEST 6: Zero temperature change → zero energy
  it('zero ΔT gives zero energy', () => {
    const result = calculateHeatEnergy(5, SPECIFIC_HEAT_VALUES.water, 0)
    expect(result).toBe(0)
  })

  // TEST 7: Cooling (negative temperature change)
  it('handles cooling with negative ΔT', () => {
    const cooling = calculateHeatEnergy(1, SPECIFIC_HEAT_VALUES.water, -20)
    expect(cooling).toBeLessThan(0)  // Negative = heat removed
    expect(Math.abs(cooling)).toBeCloseTo(83720, calculateEnergyTolerance(83720))
  })

  // TEST 8: Different substances have different energy requirements
  it('different substances require different energy', () => {
    const massKg = 1
    const dT = 50
    
    const waterEnergy = calculateHeatEnergy(massKg, SPECIFIC_HEAT_VALUES.water, dT)
    const copperEnergy = calculateHeatEnergy(massKg, SPECIFIC_HEAT_VALUES.copper, dT)
    
    // Copper has much lower specific heat
    expect(copperEnergy).toBeLessThan(waterEnergy)
    // Water/copper ratio ≈ 4.186/0.385 ≈ 10.9
    expect(waterEnergy / copperEnergy).toBeCloseTo(10.87, 1)
  })
})
