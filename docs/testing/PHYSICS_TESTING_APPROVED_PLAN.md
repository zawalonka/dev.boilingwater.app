# Physics Testing: APPROVED PLAN & TODO

> **Status**: ✅ PLAN APPROVED - READY FOR IMPLEMENTATION  
> **Created**: 2026-02-04  
> **Updated**: 2026-02-04 - Temperature ±0.01°C (2 decimals) ✅; Energy: Dynamic tolerance (Option 3) ✅ LOCKED  
> **Context**: User wants rigorous scientific sandbox testing with no magic numbers  

---

## 🎯 TESTING PHILOSOPHY (CONFIRMED)

### Approach: Mathematical Properties (No Hardcoded Values)
- Test **formula implementation**, not results
- Use **scaling properties** (2× mass = 2× energy)
- Use **inverse relationships** (can reverse calculation)
- Test **extreme values** (no artificial clamps)
- Educational: Verify textbook formulas are correctly implemented

### Why
✅ Works with extreme values (liquid N2 at -196°C to superheated steam at 300°C)  
✅ Future-proof (new constants don't break tests)  
✅ Professional scientific software standard  
✅ Educationally rigorous  

---

## ✅ CONFIRMED DECISIONS

| Decision | Value | Rationale |
|----------|-------|-----------|
| **Temp tolerance** | ±0.01°C | 2 decimal places (high precision) |
| **Energy tolerance** | ✅ Dynamic 0.01% | `Math.max(1, expected * 0.0001)` — scales with magnitude |
| **Pressure tolerance** | ±0.5 mmHg | Antoine verification range |
| **Extreme values** | YES | No artificial clamps on physics |
| **Zero mass** | Throw error | Physically invalid |
| **Zero energy** | Return same temp | Silently OK |

---

## ✅ CONFIRMED: Energy Tolerance Strategy (Option 3 - Dynamic)

### Problem with Percent-Based Tolerances
**Current approach**: ±1% for all energy comparisons  
**Why this is questionable**:

| Scenario | Energy (J) | ±1% Tolerance | Acceptable Error | Scientific Validity |
|----------|-----------|---------------|------------------|---------------------|
| Small heating | 100 J | ±1 J | ✅ Reasonable | OK |
| Phase change (1kg water) | 2,257,000 J | ±22,570 J | ❌ **22.5 kJ error!** | Unacceptable |
| Long simulation (100 steps) | 10,000,000 J | ±100,000 J | ❌ **100 kJ drift!** | Energy leaks hidden |
| Cryogenic (liquid N₂) | 50,000 J | ±500 J | ⚠️ Borderline | Depends on precision needed |

### Proposed Solution
**Use context-dependent absolute tolerances**:
- Small energy transfers (<1000 J): ±1 J
- Medium energy (1-100 kJ): ±10 J  
- Large energy (>100 kJ): ±100 J or calculate based on physics precision

**Alternative**: Dynamic tolerance based on significant figures
```javascript
// Example approach
const tolerance = Math.max(1, expectedValue * 0.0001)  // 0.01% or minimum 1J
expect(result).toBeCloseTo(expected, calculateTolerance(expected))
```

### Decision: Option 3 — Dynamic Tolerance (LOCKED)
**Chosen**: `Math.max(1, expected * 0.0001)` — 0.01% or minimum 1J

**Why**:
- Expert chemist: Numerical analysis standard (IEEE floating-point precision)
- Novice: Auto-scaling = appears perfect without arbitrary brackets
- Self-correcting: Large values get stricter, small values don't become absurd

**Helper Function** (add to `src/utils/physics.js`):
```javascript
/**
 * Calculate tolerance for close comparison based on magnitude.
 * Uses 0.01% precision (4 significant figures) with 1J floor.
 * @param {number} expected - Expected value in joules
 * @returns {number} Decimal places for toBeCloseTo (negative = tolerance value)
 */
export const calculateEnergyTolerance = (expected) => {
  // 0.01% minimum, floor at 1J (prevents absurd tolerance on tiny values)
  const toleranceJ = Math.max(1, Math.abs(expected) * 0.0001)
  return -Math.log10(toleranceJ)  // Convert to decimal places for toBeCloseTo
}
```

**Usage**:
```javascript
expect(result).toBeCloseTo(expected, calculateEnergyTolerance(expected))
```

**Examples**:
- 100 J energy: tolerance = max(1, 0.01) = ±1 J ✅
- 2,257,000 J (water vaporization): tolerance = max(1, 225.7) = ±225.7 J ✅ (0.01%)
- 10,000,000 J (long sim): tolerance = max(1, 1000) = ±1000 J ✅ (0.01%)

---
| **Antoine extrapolation** | YES + metadata | Return `isExtrapolated: true` |
| **Room temp default** | 20°C | Standard for testing |

---

## 📋 IMPLEMENTATION CHECKLIST (Ready to Execute)

### **Phase 1: Core Formula Tests** (2 hours, 19 tests)

```
TASK: Create src/utils/physics/__tests__/formulas/

[ ] temperatureConversion.test.js (5 tests)
    [ ] Round-trip C→F→C (reversibility; ±0.01°C)
    [ ] Reference points (0°C=32°F, 100°C=212°F, -40°C=-40°F)
    [ ] Extreme: -196°C to 300°C
    [ ] Formula verification: °F = °C × 9/5 + 32
    [ ] Kelvin conversions (both directions)

[ ] heatCapacity.test.js (8 tests)
    [ ] Formula Q = mcΔT verified
    [ ] Linear scaling with mass (2× = 2×)
    [ ] Linear scaling with ΔT (2× = 2×)
    [ ] Linear scaling with specific heat
    [ ] Inverse: ΔT = Q/(mc) works
    [ ] Zero ΔT → zero Q
    [ ] Negative mass → throws
    [ ] Extreme: -196°C to 300°C

[ ] latentHeat.test.js (6 tests)
    [ ] Formula Q = m × Lv verified
    [ ] Linear scaling with mass (2× = 2×)
    [ ] Water vaporization: 1kg → 2,257,000 J (✅ dynamic ±225.7 J)
    [ ] Water fusion: 1kg → 334,000 J (✅ dynamic ±33.4 J)
    [ ] Negative mass → throws
    [ ] Extreme substances (ethanol, ammonia, mercury)
```

### **Phase 2: Physical Process Tests** (1.5 hours, 24 tests)

```
TASK: Continue src/utils/physics/__tests__/formulas/

[ ] newtonCooling.test.js (8 tests)
    [ ] Cooling rate α temp difference (larger = faster)
    [ ] At equilibrium: no cooling (rate ≈ 0)
    [ ] Exponential decay shape
    [ ] Boundary: T(0) = T₀
    [ ] Boundary: T(∞) → Tambient
    [ ] Room 20°C vs 5°C both work
    [ ] Extreme: -196°C approaching 20°C
    [ ] k parameter effect

[ ] antoineEquation.test.js (10 tests)
    [ ] Monotonic: T↑ → P↑
    [ ] Formula: log₁₀(P) = A - B/(C+T)
    [ ] Water: 100°C = 760 mmHg (±0.5)
    [ ] Water: 0°C = 4.6 mmHg (±0.5)
    [ ] Round-trip T→P→T (±0.5°C)
    [ ] Extrapolation → `isExtrapolated: true`
    [ ] Non-linear behavior
    [ ] Never negative pressure
    [ ] Extreme: -196°C, 300°C, 5000m altitude
    [ ] Critical point behavior

[ ] isaAtmosphere.test.js (6 tests)
    [ ] Pressure decreases with altitude
    [ ] Sea level: 101,325 Pa (±0.1%)
    [ ] Denver (5500m): 83,500 Pa (±1%)
    [ ] Everest (8848m): 33,700 Pa (±1%)
    [ ] Never negative pressure
    [ ] Temperature decrease in troposphere
```

### **Phase 3: Integration Tests** (1.5 hours, 5 macro tests)

```
TASK: Create src/utils/physics/__tests__/integration/

[ ] energyConservation.test.js (5 tests)
    [ ] Simple heating: Energy_in = m×c×ΔT (✅ dynamic tolerance)
    [ ] Heating + cooling: Energy_in = ΔT_rise + Room_loss (✅ dynamic tolerance)
    [ ] Long simulation: 100 steps, no energy gaps (✅ dynamic tolerance)
    [ ] Phase change: Vaporization = m×Lv (✅ dynamic tolerance)
    [ ] Cooling: Energy loss matches Newton (✅ dynamic tolerance)
```

---

## 🔧 IMPLEMENTATION RUNNER TODO

1. **Get physics function signatures**
   - Read each formula file to see exports
   - Note: May need to check how they handle extreme values currently

2. **Write Phase 1 tests** (2 hours)
   - Create test structure/template
   - Implement all 19 formula tests
   - Run locally: `npm run test:ci`

3. **Write Phase 2 tests** (1.5 hours)
   - Continue with physical process tests
   - Run locally: `npm run test:ci`
   - Check if CI/CD pipeline catches any failures

4. **Write Phase 3 integration tests** (1.5 hours)
   - Import multiple functions
   - Verify energy conservation across time steps
   - Run full test suite

5. **Commit & Push to Dev**
   - Commit: "Add comprehensive physics formula tests (48 tests)"
   - Push: `git push dev main` (test on dev site first)
   - Verify: Tests pass in GitHub Actions CI pipeline

---

## 📊 Test Template (Copy-Paste Starter)

```javascript
import { describe, it, expect } from 'vitest'
import { FUNCTION_NAME, calculateEnergyTolerance } from '../formulas/FILENAME'

describe('FUNCTION_NAME - PHYSICS_CONCEPT', () => {
  // TEST 1: Formula verification
  it('implements FORMULA correctly', () => {
    const input1 = VALUE1
    const input2 = VALUE2
    const result = FUNCTION_NAME(input1, input2)
    const expectedFromFormula = input1 * input2  // Your formula here
    expect(result).toBeCloseTo(expectedFromFormula, calculateEnergyTolerance(expectedFromFormula))
  })

  // TEST 2: Scaling property
  it('scales linearly with input', () => {
    const small = FUNCTION_NAME(X, Y)
    const large = FUNCTION_NAME(2*X, Y)
    expect(large).toBeCloseTo(small * 2, 10)
  })

  // TEST 3: Extreme values
  it('handles extreme values without clamps', () => {
    const result = FUNCTION_NAME(EXTREME_INPUT, Y)
    expect(result).toBeDefined()
    expect(Number.isFinite(result)).toBe(true)
  })

  // TEST 4: Boundary condition
  it('handles boundary conditions', () => {
    const result = FUNCTION_NAME(0, Y)  // or other boundary
    expect(result).toBeCloseTo(EXPECTED_BOUNDARY, 5)
  })

  // TEST 5: Error handling
  it('throws on invalid input', () => {
    expect(() => FUNCTION_NAME(-1, Y)).toThrow()
  })
})
```

---

## 📁 File Structure (Final)

```
src/utils/physics/__tests__/
├── formulas/
│   ├── temperatureConversion.test.js
│   ├── heatCapacity.test.js
│   ├── latentHeat.test.js
│   ├── newtonCooling.test.js
│   ├── antoineEquation.test.js
│   └── isaAtmosphere.test.js
└── integration/
    └── energyConservation.test.js
```

---

## ✅ ACCEPTANCE CRITERIA

- [ ] **All 48 tests written** (not copy-paste, each tests real logic)
- [ ] **All tests pass locally** (`npm run test:ci`)
- [ ] **All tests pass in CI/CD** (GitHub Actions)
- [ ] **Coverage report** shows physics functions tested
- [ ] **No console errors** during test run
- [ ] **One commit** with all tests (not scattered commits)

---

## 🚀 RUNNING THE TESTS

```bash
# Local testing
npm run test:ci

# Watch mode (if writing incrementally)
npm run test

# With coverage report
npm run test:coverage

# View results
npm run test:ui
```

---

## 📝 HANDOFF NOTES

**Key Context**:
- User is physics/thermodynamics expert who wants real science
- No tolerance for artificial limits ("water only 0-100°C" type clamps)
- Sandbox should handle cryogenic, high-altitude, exotic scenarios
- Tests should verify formula implementation, not hardcoded results
- Already has CI/CD pipeline (GitHub Actions) running tests + SonarCloud
- Previously only had 1 test file (unitUtils.test.js with temperature conversions)

**Questions for Next AI**:
- If a formula throws on edge cases, should test verify error OR handle gracefully?
- Do we need to test integration between heating + cooling + phase change continuously?

**Not in Scope**:
- Component tests (later Phase)
- React rendering tests (later Phase)
- UI interaction tests (later Phase)

---

**Status**: Ready to implement  
**Approval**: ✅ User approved all decisions  
**Time Estimate**: 4-5 hours implementation + debugging  
**Next Action**: Start writing Phase 1 tests