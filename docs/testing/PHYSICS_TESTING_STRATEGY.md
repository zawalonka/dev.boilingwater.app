# Physics Testing Strategy for Scientific Sandbox

> **Purpose**: Define HOW to test physics formulas without hardcoding magic numbers, while ensuring mathematical correctness for college students and field experts.
>
> **Last Updated**: 2026-02-04  
> **Status**: ✅ READY TO IMPLEMENT - Temperature (±0.01°C) & Energy (Dynamic 0.01%) locked in

---

## 🎯 Testing Philosophy for Scientific Sandbox

### Core Principle
**Test the formula implementation, not the result.**

Rather than:
```javascript
// ❌ BAD - Magic number, no formula verification
it('calculates heat', () => {
  expect(calculateHeat(100, 4.186, 50)).toBe(20930000)
})
```

Test this way:
```javascript
// ✅ GOOD - Verifies formula Q = mcΔT is actually implemented
it('heat calculation uses Q = mcΔT formula', () => {
  const mass = 100
  const specificHeat = 4.186
  const deltaT = 50
  const result = calculateHeat(mass, specificHeat, deltaT)
  
  // Manually compute formula to verify implementation
  const expectedFromFormula = mass * specificHeat * deltaT
  expect(result).toBeCloseTo(expectedFromFormula, 5)
})

// ✅ EXCELLENT - Verify scaling properties (no mocked numbers needed)
it('heat scales linearly with mass', () => {
  const heat1 = calculateHeat(50, 4.186, 50)
  const heat2 = calculateHeat(100, 4.186, 50)
  expect(heat2).toBeCloseTo(heat1 * 2, 10)  // Math property, not magic!
})
```

### Why This Works for Sandbox
- **No brittle hardcoded values**: If formula changes (new constants, better coefficients), tests still pass
- **Educational**: Tests verify the textbook formula is implemented, not just that results match yesterday's code
- **Scalable**: Works for extreme values (cryo, space, etc.) without pre-computing expected results
- **Field-expert friendly**: Physicists can validate formula implementation, not just numeric outputs

---

## 📊 Physics Functions by Category

### 1. **TEMPERATURE CONVERSIONS** (Formulas)
Files: `temperatureConversion.js`

**Functions**:
- `celsiusToFahrenheit(celsius)`
- `fahrenheitToCelsius(fahrenheit)`
- `celsiusToKelvin(celsius)`
- `kelvinToCelsius(kelvin)`

**Mathematical Properties to Test**:
```javascript
// ✅ Round-trip conversions must be reversible
C → F → C = C (within floating-point tolerance)

// ✅ Reference points (no magic numbers, just physics knowledge)
0°C = 32°F = 273.15K
100°C = 212°F = 373.15K
-40°C = -40°F  (only point where they're equal)
```

**Conservation Law**: Identity under round-trip → verify reversibility
**Precision**: ±0.01 acceptable (floating-point rounding)

---

### 2. **LATENT HEAT** (Phase Change Energy)
Files: `latentHeat.js`

**Functions**:
- `calculateVaporizationEnergy(massKg, vaporizationHeatPerMassKJ)`
- `calculateFusionEnergy(massKg, fusionHeatPerMassKJ)`

**Mathematical Properties to Test**:
```javascript
// ✅ Linear scaling with mass
Q = m × Lv
Q(2m) = 2 × Q(m)  // Linear property

// ✅ Linear scaling with latent heat constant
Q(Lv1) / Q(Lv2) = Lv1 / Lv2  // Proportional

// ✅ Energy always positive (or zero)
Q ≥ 0

// ✅ For water at STP: well-known values
Q(1kg water vaporization, 2257 kJ/kg) = 2,257,000 J
Q(1kg water fusion, 334 kJ/kg) = 334,000 J
```

**Conservation Law**: Energy conservation → Q_out from burner = Q_in to phase change
**Critical for Sandbox**: Verify energy doesn't mysteriously vanish during vaporization

---

### 3. **HEAT CAPACITY** (Temperature Change)
Files: `heatCapacity.js`

**Functions**:
- `calculateTemperatureChange(energyJ, massKg, specificHeatJperKgK)`
- `calculateEnergy(massKg, specificHeatJperKgK, temperatureChangeK)`

**Mathematical Properties to Test**:
```javascript
// ✅ Formula: Q = mcΔT
ΔT = Q / (mc)
Q = m × c × ΔT

// ✅ Inverse relationship: More energy → larger temp change
Q(50J) = temp_change_1
Q(100J) = temp_change_2
temp_change_2 / temp_change_1 ≈ 100/50 = 2

// ✅ Scaling properties
ΔT(m=100) / ΔT(m=50) = 0.5  // Double mass → half temp rise for same energy

// ✅ Physical bounds
ΔT ≥ 0 when Q ≥ 0
```

**Conservation Law**: Energy conservation → Q_input = m × c × ΔT (exactly)
**Critical for Sandbox**: Temperature rise must be proportional to energy added

---

### 4. **NEWTON'S LAW OF COOLING** (Heat Transfer)
Files: `newtonCooling.js`

**Functions**:
- `calculateTemperatureAtTime(T0, Tambient, kEffective, timeSeconds)`
- `calculateCoolingRate(tempDifference, kEffective)`

**Mathematical Properties to Test**:
```javascript
// ✅ Exponential decay: T(t) = Tambient + (T0 - Tambient) × e^(-kt)

// ✅ Boundary conditions
T(0) = T0  (at t=0, temperature is initial)
T(∞) → Tambient  (eventually reaches room temp)

// ✅ Faster cooling when temp difference is larger
rate(T=100, Troom=20) > rate(T=30, Troom=20)

// ✅ No cooling when at equilibrium
T(t) = Tambient when T0 = Tambient  (for all t)

// ✅ Monotonic cooling (always decreasing if T0 > Tambient)
If T0 > Tambient, then T(t1) > T(t2) for t1 < t2
```

**Conservation Law**: Energy leaves object at rate proportional to temp difference
**Critical for Sandbox**: Must account for room temperature (hot water cools faster than cool water)

---

### 5. **ANTOINE EQUATION** (Vapor Pressure)
Files: `antoineEquation.js`

**Functions**:
- `calculateVaporPressure(celsius, coefficientsA_B_C, substance)`
- `calculateBoilingTemp(pressureMMHg, coefficientsA_B_C, substance)`

**Mathematical Properties to Test**:
```javascript
// ✅ Formula: log₁₀(Pvap) = A - B/(C + T)

// ✅ Monotonic increasing: Higher temp → Higher vapor pressure
P(T1) < P(T2)  for T1 < T2

// ✅ Round-trip conversion (within Antoine accuracy)
T = calculateBoilingTemp(P)
P' = calculateVaporPressure(T)
P' ≈ P  (±0.5 mmHg typical for water)

// ✅ Physical reference points (textbook values)
For water:
  P(100°C) ≈ 760 mmHg
  P(0°C) ≈ 4.6 mmHg
  P(50°C) ≈ 92.5 mmHg

// ✅ Outside verified range: still works, just less accurate
Extrapolation returns metadata: { value, isExtrapolated: true }
```

**Conservation Law**: Equilibrium → vapor pressure equals atmospheric pressure at boiling point
**Critical for Sandbox**: Allows boiling point calculations at any altitude

---

### 6. **DYNAMIC EBULLIOSCOPY (Colligative Properties)**
Files: `dynamicKb.js`, `ebullioscopy.js`

**Functions**:
- `calculateDynamicKb(boilingTempK, solventProps)`
- `calculateBoilingPointElevation(molality, dynamicKb)`

**Mathematical Properties to Test**:
```javascript
// ✅ Formula: ΔTb = Kb × m
Where Kb depends on temp (not static!)

// ✅ Non-negativity
Kb ≥ 0
ΔTb ≥ 0 (boiling point only goes up with solute)

// ✅ Linear scaling with molality
ΔTb(0.1m) / ΔTb(0.2m) = 0.1/0.2  (linear proportionality)

// ✅ Verify temp-dependency: Kb changes with T
Kb(100°C) ≠ Kb(50°C)
```

**Conservation Law**: Boiling point elevation depends only on solute count, not identity (colligative property)
**Critical for Sandbox**: Explains why salt water boils higher than pure water

---

### 7. **ISA ATMOSPHERE MODEL** (Altitude/Pressure)
Files: `isaAtmosphere.js`

**Functions**:
- `calculatePressureAtAltitude(altitudeM, temperatureC)`
- `calculateTemperatureAtAltitude(altitudeM)`
- `calculateDensityAtAltitude(altitudeM)`

**Mathematical Properties to Test**:
```javascript
// ✅ Monotonic decreasing: Higher altitude → Lower pressure
P(h1) > P(h2)  for h1 < h2

// ✅ Physical reference points
P(0m, sea level) ≈ 101,325 Pa (1 atm)
P(~5,500m, Denver) ≈ 83,500 Pa (~0.82 atm)
P(8,848m, Everest) ≈ 33,700 Pa (~0.33 atm)

// ✅ Exponential decay (at least locally)
P decays exponentially in troposphere (steeper higher up)

// ✅ Pressure never negative
P(h) > 0 for all altitudes
```

**Conservation Law**: Pressure decreases with altitude (hydrostatic equilibrium)
**Critical for Sandbox**: Explains why water boils at lower temp at altitude

---

### 8. **NEWTON'S COOLING + HEATING + PHASE CHANGE** (Complex Process)
Files: `processes/heating/`, `processes/simulation/`

**Functions**:
- `simulateTimeStep(state, energyAdded, deltaTime, fluidProps)`
- `applyHeatEnergy(currentTemp, energyJ, massKg, heatCapacity, ...)`

**Mathematical Properties to Test**:
```javascript
// ✅ ENERGY CONSERVATION (most critical!)
// Total energy in = temp rise + heat loss to room + phase change energy
// Energy_in = Energy_temp_rise + Energy_cooling + Energy_vaporization

// ✅ Phase boundaries
// At 0°C (ice): won't heat above 0 until fusion complete
// At boiling point: won't heat above until vaporization complete

// ✅ Smoothness: No sudden jumps
d(Temperature)/d(Time) is continuous (except at phase transitions)

// ✅ Monotonicity when heating
If energy_in > energy_loss: Temperature increases
If energy_in < energy_loss: Temperature decreases

// ✅ No energy loss after phase change
Once water becomes steam at 100°C, no heat should be "hidden"
```

**Conservation Law**: First Law of Thermodynamics → Energy in = Work out + Change in internal energy
**Critical for Sandbox**: Verify no mysterious energy loss during long simulations

---

## 🧪 Proposed Test File Organization

```
src/utils/physics/__tests__/
├── formulas/
│   ├── temperatureConversion.test.js       (5 tests, <10 min)
│   ├── latentHeat.test.js                  (6 tests, <10 min)
│   ├── heatCapacity.test.js                (8 tests, <10 min)
│   ├── newtonCooling.test.js               (8 tests, <15 min)
│   ├── antoineEquation.test.js             (10 tests, <20 min)
│   ├── isaAtmosphere.test.js               (6 tests, <15 min)
│   ├── dynamicKb.test.js                   (4 tests, <10 min)
│   └── ebullioscopy.test.js                (4 tests, <10 min)
└── processes/
    ├── heating.test.js                     (10 tests, <25 min)
    ├── cooling.test.js                     (8 tests, <20 min)
    └── integration.test.js                 (6 tests, energy conservation, <30 min)
```

**Total**: ~85 tests, ~3 hours implementation

---

## ⚡ Testing Strategy by Priority

### 🔴 CRITICAL (Must test - sandbox breaks without this)
1. **Temperature Conversions** - Used everywhere
2. **Heat Capacity (Q = mcΔT)** - Core heating physics
3. **Latent Heat** - Phase transitions (water → steam)
4. **Energy Conservation** - Verify no mysterious energy loss

### 🟠 HIGH PRIORITY (Tests educational value)
5. **Newton's Cooling** - Explains room temperature effects
6. **Antoine Equation** - Explains altitude effects
7. **ISA Atmosphere** - Pressure at altitude

### 🟡 MEDIUM PRIORITY (Tests sandbox extremes)
8. **Dynamic Kb** - Colligative properties (salt water, etc.)
9. **Ebullioscopy** - Boiling point elevation

### 🟢 NICE-TO-HAVE (Tests corner cases)
10. **PID Controller** - AC/heating algorithm
11. **Diffusion** - Room air mixing
12. **Gas Exchange** - Air handler system

---

## 📋 Test Case Template (No Hardcoded Values)

Each formula test file will follow this pattern:

```javascript
import { describe, it, expect } from 'vitest'
import { calculateHeat } from '../formulas/heatCapacity'

describe('Heat Capacity Formula (Q = mcΔT)', () => {
  // ✅ TEST 1: Verify formula implementation
  it('implements Q = mcΔT correctly', () => {
    const m = 100
    const c = 4.186
    const deltaT = 50
    const result = calculateHeat(m, c, deltaT)
    const expectedFromFormula = m * c * deltaT
    expect(result).toBeCloseTo(expectedFromFormula, 5)
  })

  // ✅ TEST 2: Verify scaling property
  it('scales linearly with mass', () => {
    const heat1 = calculateHeat(50, 4.186, 50)
    const heat2 = calculateHeat(100, 4.186, 50)
    expect(heat2).toBeCloseTo(heat1 * 2, 10)
  })

  // ✅ TEST 3: Verify boundary condition
  it('returns zero energy when temperature change is zero', () => {
    expect(calculateHeat(100, 4.186, 0)).toBeCloseTo(0, 10)
  })

  // ✅ TEST 4: Verify energy conservation
  it('energy is never negative', () => {
    expect(calculateHeat(100, 4.186, 50)).toBeGreaterThan(0)
    expect(calculateHeat(100, 4.186, 0)).toBeGreaterThanOrEqual(0)
  })

  // ✅ TEST 5: Verify inverse relationship
  it('inverse relationship: ΔT = Q / (mc)', () => {
    const Q = calculateHeat(100, 4.186, 50)
    const recoveredDeltaT = Q / (100 * 4.186)
    expect(recoveredDeltaT).toBeCloseTo(50, 10)
  })
})
```

---

## 🤔 Questions for Review

Before implementation, please confirm:

### 1. **Precision/Tolerance**
   - Temperature conversions: ±0.01°C (2 decimal places) ✅ APPROVED
   - Heat calculations: Dynamic 0.01% (`Math.max(1J, value * 0.0001)`) ✅ APPROVED
   - Pressure: ±0.5 mmHg acceptable?
   - Antoine extrapolation: Should we test outside verified range?

### 2. **Edge Cases**
   - Negative temperatures (cryogenic)?
   - Zero mass? (Should throw?)
   - Zero energy input? (Should be silently OK?)
   - Extreme altitudes (space)? (Should handle gracefully?)

### 3. **Phase Transition Boundaries**
   - Exactly at boiling point: which phase?
   - During vaporization: test temperature holding?
   - Partial phase change: test energy accounting?

### 4. **Room Temperature Effects**
   - Should we create mock room state?
   - Default room temp = 20°C?
   - Test heating above/below room temp?

### 5. **Conservation Law Testing**
   - Create a "macro test" that verifies: Energy_in = ΔTemp_rise + Heat_loss + Phase_change_energy?
   - Run with different burner powers and time steps?

---

## 🎯 Next Steps (Awaiting Review)

1. **Confirm** the testing philosophy above
2. **Clarify** answers to the 5 review questions
3. **Approval** to start writing tests (no implementation yet)
4. **Decide** which test categories should go in first week

---

**Status**: Ready for discussion  
**Author**: GitHub Copilot (AI-assisted)  
**Last Updated**: 2026-02-04
