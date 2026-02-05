import { describe, it, expect } from 'vitest'
import {
  calculateHeatEnergy,
  calculateTempChange,
  calculateEnergyTolerance,
  SPECIFIC_HEAT_VALUES
} from '../../formulas/heatCapacity.js'
import {
  calculateVaporizationEnergy,
  LATENT_HEAT_VALUES
} from '../../formulas/latentHeat.js'
import {
  applyCoolingStep,
  temperatureAtTime,
  calculateEffectiveCoolingCoeff,
  CONVECTIVE_HEAT_TRANSFER
} from '../../formulas/newtonCooling.js'

describe('Energy Conservation - Integration Tests', () => {
  // TEST 1: Simple heating - verify energy into system equals temperature change
  it('simple heating: Energy_in = m × c × ΔT conservation', () => {
    const massKg = 1
    const c = SPECIFIC_HEAT_VALUES.water
    const tempChangeC = 50  // Heat from 20°C to 70°C
    
    // Energy required to achieve this temp change
    const energyRequired = calculateHeatEnergy(massKg, c, tempChangeC)
    
    // Now verify we can recover the temperature change
    const recoveredTempChange = calculateTempChange(massKg, c, energyRequired)
    
    // Energy should be conserved
    expect(recoveredTempChange).toBeCloseTo(tempChangeC, 5)
    expect(energyRequired).toBeCloseTo(209300, calculateEnergyTolerance(209300))
  })

  // TEST 2: Heating + cooling - energy in vs energy lost
  it('heating + cooling: Energy_in - Room_loss = Net_ΔT', () => {
    const massKg = 1
    const c = SPECIFIC_HEAT_VALUES.water
    const hA = CONVECTIVE_HEAT_TRANSFER.potInStillAir
    const k = calculateEffectiveCoolingCoeff(hA, massKg, c)
    
    // Scenario: Add 100,000 J of energy, then cool for 1 hour
    const energyIn = 100000
    const tempIncrease = calculateTempChange(massKg, c, energyIn)
    const startTempC = 20 + tempIncrease  // Starting from 20°C room
    
    // Cool for 3600 seconds (1 hour)
    const ambientC = 20
    const finalTemp = temperatureAtTime(startTempC, ambientC, k, 3600)
    
    // Final temp should be less than max (20 + tempIncrease) but more than ambient
    expect(finalTemp).toBeGreaterThan(ambientC)
    expect(finalTemp).toBeLessThan(startTempC)
    
    // Energy lost = m×c×(T_final - T_ambient)
    const energyRemaining = calculateHeatEnergy(massKg, c, finalTemp - ambientC)
    const energyLost = energyIn - energyRemaining
    
    // Energy lost should be positive
    expect(energyLost).toBeGreaterThan(0)
    expect(energyLost).toBeLessThan(energyIn)
  })

  // TEST 3: Long simulation - 100 time steps without energy drift
  it('long simulation: 100 steps shows no catastrophic energy drift', () => {
    const massKg = 1
    const c = SPECIFIC_HEAT_VALUES.water
    const hA = CONVECTIVE_HEAT_TRANSFER.potInStillAir
    const k = calculateEffectiveCoolingCoeff(hA, massKg, c)
    const dt = 1  // 1 second time step
    const steps = 100
    
    let currentTemp = 100  // Start hot
    const ambientC = 20
    let totalEnergyLost = 0
    
    // Simulate 100 steps
    for (let i = 0; i < steps; i++) {
      const tempBefore = currentTemp
      currentTemp = applyCoolingStep(tempBefore, ambientC, k, dt)
      
      // Energy lost this step (roughly)
      const energyThisStep = Math.abs(calculateHeatEnergy(massKg, c, currentTemp - tempBefore))
      totalEnergyLost += energyThisStep
    }
    
    // Final temperature should be approaching ambient
    expect(currentTemp).toBeGreaterThan(ambientC)
    expect(currentTemp).toBeLessThan(100)
    
    // Total energy lost should equal initial energy content
    const initialEnergy = calculateHeatEnergy(massKg, c, 100 - ambientC)
    const finalEnergy = calculateHeatEnergy(massKg, c, currentTemp - ambientC)
    const expectedLoss = initialEnergy - finalEnergy
    
    // Within a reasonable tolerance for discrete stepping
    expect(totalEnergyLost).toBeCloseTo(expectedLoss, 0)
  })

  // TEST 4: Phase change - vaporization energy
  it('phase change: Vaporization Q = m × Lv conservation', () => {
    const massKg = 1
    const Lv = LATENT_HEAT_VALUES.vaporization.water  // 2257 kJ/kg
    
    // Energy required to vaporize 1kg water
    const energyRequired = calculateVaporizationEnergy(massKg, Lv)
    
    // This energy should equal the latent heat formula
    expect(energyRequired).toBeCloseTo(2_257_000, calculateEnergyTolerance(2_257_000))
    
    // Verify the energy is significant vs sensible heat
    const sensibleHeat = calculateHeatEnergy(massKg, SPECIFIC_HEAT_VALUES.water, 100)
    
    // Latent heat >> sensible heat for full phase change
    expect(energyRequired).toBeGreaterThan(sensibleHeat * 5)
  })

  // TEST 5: Cooling matches Newton's law - exponential decay
  it('cooling: Temperature decay follows Newton\'s law', () => {
    const massKg = 1
    const c = SPECIFIC_HEAT_VALUES.water
    const hA = CONVECTIVE_HEAT_TRANSFER.potInStillAir
    const k = calculateEffectiveCoolingCoeff(hA, massKg, c)
    const ambientC = 20
    const startTemp = 100
    
    // Get temperatures at three times
    const T_0s = temperatureAtTime(startTemp, ambientC, k, 0)
    const T_1800s = temperatureAtTime(startTemp, ambientC, k, 1800)
    const T_3600s = temperatureAtTime(startTemp, ambientC, k, 3600)
    
    // Verify initial condition
    expect(T_0s).toBe(startTemp)
    
    // Verify exponential decay: rate of cooling slows down
    const cool_first_1800s = startTemp - T_1800s
    const cool_second_1800s = T_1800s - T_3600s
    
    // Cooling should be slower in second period (closer to ambient)
    expect(cool_first_1800s).toBeGreaterThan(cool_second_1800s)
    
    // Energy lost first half should be more than second half
    const energyFirst = calculateHeatEnergy(massKg, c, cool_first_1800s)
    const energySecond = calculateHeatEnergy(massKg, c, cool_second_1800s)
    
    expect(Math.abs(energyFirst)).toBeGreaterThan(Math.abs(energySecond))
  })

  // TEST 6: Heating + Cooling + Phase change sequence
  it('sequence: Heat → maintain temp → cool conservation', () => {
    const massKg = 1
    const c = SPECIFIC_HEAT_VALUES.water
    const hA = CONVECTIVE_HEAT_TRANSFER.potInStillAir
    const k = calculateEffectiveCoolingCoeff(hA, massKg, c)
    const ambientC = 20
    
    // Phase 1: Heat from 20°C to 50°C
    const energy1 = calculateHeatEnergy(massKg, c, 50 - ambientC)
    const tempAfterHeating = ambientC + calculateTempChange(massKg, c, energy1)
    expect(tempAfterHeating).toBeCloseTo(50, 5)
    
    // Phase 2: Cool for 30 minutes (1800 seconds)
    const tempAfterCooling = temperatureAtTime(tempAfterHeating, ambientC, k, 1800)
    expect(tempAfterCooling).toBeLessThan(tempAfterHeating)
    expect(tempAfterCooling).toBeGreaterThan(ambientC)
    
    // Energy accounting: lost energy = initial - final
    const initialEnergyFromAmbient = calculateHeatEnergy(massKg, c, tempAfterHeating - ambientC)
    const finalEnergyFromAmbient = calculateHeatEnergy(massKg, c, tempAfterCooling - ambientC)
    const energyLostByCooling = initialEnergyFromAmbient - finalEnergyFromAmbient
    
    // Should match energy conservation
    expect(energyLostByCooling).toBeGreaterThan(0)
    expect(energyLostByCooling).toBeLessThan(initialEnergyFromAmbient)
  })

  // TEST 7: No energy loss at equilibrium
  it('equilibrium: No energy loss when T = T_ambient', () => {
    const massKg = 1
    const c = SPECIFIC_HEAT_VALUES.water
    const ambientC = 20
    
    // At equilibrium, no heat transfer
    const energyAtEquilibrium = calculateHeatEnergy(massKg, c, 0)
    expect(energyAtEquilibrium).toBe(0)
    
    // Temperature difference drives energy transfer
    const energyFrom50C = calculateHeatEnergy(massKg, c, 50 - ambientC)
    expect(energyFrom50C).toBeGreaterThan(0)
  })

  // TEST 8: Energy scales with mass
  it('energy conservation scales correctly with mass', () => {
    const c = SPECIFIC_HEAT_VALUES.water
    const dT = 30
    
    const energy_1kg = calculateHeatEnergy(1, c, dT)
    const energy_5kg = calculateHeatEnergy(5, c, dT)
    const energy_0_5kg = calculateHeatEnergy(0.5, c, dT)
    
    // Energy should be proportional to mass
    expect(energy_5kg).toBeCloseTo(energy_1kg * 5, 5)
    expect(energy_0_5kg).toBeCloseTo(energy_1kg * 0.5, 5)
  })
})
