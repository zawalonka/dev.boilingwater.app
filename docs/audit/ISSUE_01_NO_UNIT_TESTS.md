# Issue #1: No Unit Tests or Test Framework

**Severity:** 🔴 Critical  
**Status:** ❌ Missing  
**Priority:** P0 - Must have before production  
**Effort:** 2-3 weeks (to write tests for critical paths)

---

## What It Means

Your project has **zero automated tests**. When you change code, there's no system checking if you broke anything.

---

## Why It's Critical

### Scenario: You Modify the Physics Engine

```javascript
// src/utils/physics.js - You make this change:

// OLD (working)
export function simulateTimeStep(state, heat, deltaTime, fluidProps) {
  const newTemp = state.temperature + (heat / (state.waterMass * fluidProps.specificHeat)) * deltaTime
  return { ...state, temperature: newTemp }
}

// NEW (you refactor to be "cleaner")
export function simulateTimeStep(state, heat, deltaTime, fluidProps) {
  const newTemp = state.temperature + (heat * deltaTime) / (state.waterMass * fluidProps.specificHeat)
  return { ...state, temperature: newTemp }
}
```

This **looks the same** mathematically, but introduces a bug (order of operations changed).

### Without Tests ❌
- You don't notice until a user reports "water boils at wrong temperature"
- You can't pinpoint where the bug came from
- You have to manually test every scenario yourself

### With Tests ✅
- Test runs automatically: `assert boilingPointAt20kPressure === 68.3°C` fails immediately
- You know exactly what broke
- You can confidently refactor

---

## Test Coverage Explained

**Industry Standard: 70-80% Coverage**

This means 70-80% of your **code lines** are executed during tests.

### Example: calculateBoilingPoint Function

```javascript
export function calculateBoilingPoint(altitude, fluidProps) {
  if (!fluidProps) return null                    // Line 1
  
  const pressure = getPressureAtAltitude(altitude) // Line 2
  if (pressure < 0) return null                   // Line 3
  
  return solveAntoineEquation(pressure, fluidProps) // Line 4
}
```

An **80% coverage test suite** would test 3-4 of these 4 lines:

| Test Case | What It Tests | Status |
|-----------|---------------|--------|
| Normal altitude (0m) | Lines 1, 2, 4 | ✅ Tested |
| High altitude (20km) | Lines 1, 2, 4 | ✅ Tested |
| Negative pressure edge case | Line 3 | ✅ Tested |
| Some weird edge case | ? | ❌ Untested (20% gap) |

---

## The Test Pyramid

```
        ┌─────────────────────────┐
        │   E2E Tests (10%)       │
        │  User clicks → water    │
        │  boils in game window   │
        │  (slow, expensive)      │
        ├─────────────────────────┤
        │ Integration Tests (30%) │
        │ Physics + Room env +    │
        │ UI state together       │
        │ (medium speed/cost)     │
        ├─────────────────────────┤
        │  Unit Tests (60%)       │
        │ calculateBoilingPoint() │
        │ returns 84.5 at 5000m   │
        │ (fast, cheap, many)     │
        └─────────────────────────┘
```

**Your project has:** Zero at all levels ❌

---

## How This Affects Your Project Today

### Physics Calculations Are Especially Vulnerable

```javascript
// src/utils/physics/formulas/latentHeat.js
export function calculateVaporizationEnergy(massKg, heatOfVapKJ) {
  const heatOfVapJ = heatOfVapKJ * 1000
  return massKg * heatOfVapJ
}
```

**Without tests, these questions are unanswered:**
- Is this calculation correct? (1 kg water at 2257 kJ/kg should = 2,257,000 J ✓)
- What if someone passes 0? Does it return 0 or crash?
- What if they pass negative numbers? (physically impossible but program should handle it)
- Is the conversion factor correct? (1000 is right, but documented why?)
- Does it work with all fluid types?

### With Tests

```javascript
// src/utils/physics/formulas/__tests__/latentHeat.test.js

import { describe, it, expect } from 'vitest'
import { calculateVaporizationEnergy } from '../latentHeat'

describe('calculateVaporizationEnergy', () => {
  it('should calculate energy for 1kg water', () => {
    expect(calculateVaporizationEnergy(1, 2257)).toBe(2257000)
  })
  
  it('should handle zero mass', () => {
    expect(calculateVaporizationEnergy(0, 2257)).toBe(0)
  })
  
  it('should scale linearly with mass', () => {
    expect(calculateVaporizationEnergy(2, 2257)).toBe(4514000)
    expect(calculateVaporizationEnergy(0.5, 2257)).toBe(1128500)
  })
  
  it('should reject negative mass', () => {
    expect(() => calculateVaporizationEnergy(-1, 2257)).toThrow('Mass cannot be negative')
  })
  
  it('should work with ethanol (lower Lv)', () => {
    expect(calculateVaporizationEnergy(1, 838)).toBe(838000)
  })
})
```

All 5 tests run in **< 10ms**. If any break, you know immediately.

---

## Real Cost Comparison

### Without Tests

| Change | Time to Find Bug | User Impact | Severity |
|--------|------------------|-------------|----------|
| Fix altitude formula | 2-3 hours manual testing | Boiling points wrong at high altitude | 🔴 High |
| Refactor cooling calculation | 4-5 hours of testing | Water cools too fast/slow | 🔴 High |
| Add room pressure feedback | 6-8 hours of testing | Complex physics breaks silently | 🔴 Critical |
| Update Antoine coefficients | 1-2 hours manual testing | Substances boil at wrong temps | 🔴 High |

### With Tests

| Change | Time to Find Bug | User Impact | Severity |
|--------|------------------|-------------|----------|
| Fix altitude formula | 30 seconds (test fails) | Caught before deploy | ✅ None |
| Refactor cooling calculation | 30 seconds | Caught before deploy | ✅ None |
| Add room pressure feedback | 30 seconds | Caught before deploy | ✅ None |
| Update Antoine coefficients | 30 seconds | Caught before deploy | ✅ None |

---

## Critical Areas That Need Tests

### 1. Physics Engine (`src/utils/physics/`)

```javascript
// Priority: HIGHEST
// Why: All game mechanics depend on this

- calculateBoilingPoint(altitude, fluidProps)  // Affects every experiment
- simulateTimeStep(state, heat, deltaTime)     // Runs every 100ms
- solveAntoineEquation(pressure, coefficients) // Core calculation
- calculateVaporizationEnergy()                // Phase change logic
```

### 2. Room Environment (`src/utils/roomEnvironment.js`)

```javascript
// Priority: HIGH
// Why: Feedback loop - pressure affects boiling point affects pressure

- applyAcControl()                             // Temperature regulation
- applyScrubber()                              // Air composition
- addVapor()                                   // Boiling → room pressure
```

### 3. Substance Loader (`src/utils/substanceLoader.js`)

```javascript
// Priority: MEDIUM
// Why: Wrong data = wrong physics

- loadSubstance()                              // Verify JSON loads correctly
- parseSubstanceProperties()                   // Verify parsing logic
- getAvailableSubstances()                     // Verify catalog integrity
```

### 4. UI State Management (`src/App.jsx`, `src/components/GameScene.jsx`)

```javascript
// Priority: MEDIUM
// Why: Prevent regression on complex state flows

- Level/experiment transitions
- Pot dragging and collision detection
- Equipment switching logic
```

---

## Implementation Steps

### Step 1: Set Up Testing Infrastructure (1 day)

```bash
# Install dependencies
npm install --save-dev vitest @vitest/ui @testing-library/react @testing-library/jest-dom jsdom

# Update package.json
npm set-script test "vitest"
npm set-script test:ui "vitest --ui"
npm set-script test:coverage "vitest --coverage"
```

### Step 2: Create First Test File (1 day)

```javascript
// src/utils/physics/formulas/__tests__/latentHeat.test.js

import { describe, it, expect } from 'vitest'
import { 
  calculateVaporizationEnergy,
  calculateVaporizedMass,
  calculateFusionEnergy
} from '../latentHeat'

describe('Latent Heat Calculations', () => {
  describe('calculateVaporizationEnergy', () => {
    it('should calculate energy for 1kg water', () => {
      const energy = calculateVaporizationEnergy(1, 2257)
      expect(energy).toBe(2257000)
    })

    it('should handle zero mass', () => {
      const energy = calculateVaporizationEnergy(0, 2257)
      expect(energy).toBe(0)
    })

    it('should scale with different fluids', () => {
      expect(calculateVaporizationEnergy(1, 2257)).toBe(2257000)  // Water
      expect(calculateVaporizationEnergy(1, 838)).toBe(838000)    // Ethanol
      expect(calculateVaporizationEnergy(1, 518)).toBe(518000)    // Acetone
    })
  })

  describe('calculateVaporizedMass', () => {
    it('should calculate mass from energy', () => {
      const mass = calculateVaporizedMass(2257000, 2257)
      expect(mass).toBeCloseTo(1, 5)
    })

    it('should handle zero energy', () => {
      expect(calculateVaporizedMass(0, 2257)).toBe(0)
    })
  })

  describe('calculateFusionEnergy', () => {
    it('should calculate energy for ice melting', () => {
      const energy = calculateFusionEnergy(1, 334)
      expect(energy).toBe(334000)
    })
  })
})
```

### Step 3: Run Tests

```bash
npm run test
```

**Output:**
```
✓ src/utils/physics/formulas/__tests__/latentHeat.test.js (5 tests)

Test Files  1 passed (1)
     Tests  5 passed (5)
  Start at  14:32:05
  Duration  245ms
```

### Step 4: Expand Test Coverage (1-2 weeks)

Target critical paths:
- Physics formulas (Antoine, ISA, cooling)
- Boiling point calculations
- Room environment feedback loops
- Substance loading/parsing
- State transitions

---

## Why This Is Crucial for Boiling Water

Your project is an **educational physics simulator** that teaches real science. This makes testing even more critical:

1. **Physics calculations must be bulletproof**
   - One formula bug spreads misinformation to students
   - Users rely on accuracy for learning
   - Wrong boiling points undermine educational value

2. **Complex feedback loops require regression testing**
   - Room pressure → boiling point → vapor release → room pressure
   - Without tests, you can't safely refactor interconnected systems

3. **Altitude system is globally used**
   - Every experiment depends on `calculateBoilingPoint()`
   - One bug affects all 118 substances globally

4. **Multiple experimental flows**
   - Boiling water (tutorial)
   - Altitude effects
   - Different fluids
   - Dangerous liquids (L1E4+)
   - Each needs to work independently

---

## Success Metrics

Once testing is implemented:

| Metric | Target | Current |
|--------|--------|---------|
| Test Coverage | 70%+ | 0% |
| Physics Formulas Tested | 100% | 0% |
| Critical Paths Tested | 100% | 0% |
| Test Execution Time | < 1 second | N/A |
| CI/CD Test Stage | ✅ Pass required | ❌ No tests run |

---

## Next Steps

1. **Read:** [Vitest docs](https://vitest.dev/) (30 minutes)
2. **Install:** Testing dependencies (5 minutes)
3. **Write:** First 5 tests for physics formulas (2 hours)
4. **Expand:** 20-30 more tests for core paths (1 week)
5. **Integrate:** CI/CD pipeline runs tests on every push (1 day)

---

## Related Issues

- [Issue #2: No TypeScript](../INDUSTRY_STANDARDS_AUDIT.md#2-no-typescript-type-safety) (would make tests easier)
- [Issue #5: No CI/CD Testing](../INDUSTRY_STANDARDS_AUDIT.md#5-no-cicd-testing-pipeline) (needs tests to run)
- [Remediation Phase 1](../INDUSTRY_STANDARDS_AUDIT.md#phase-1-foundation-weeks-1-2)

---

**Status:** Ready for implementation  
**Blocking:** Production deployment  
**Time to implement:** 2-3 weeks
