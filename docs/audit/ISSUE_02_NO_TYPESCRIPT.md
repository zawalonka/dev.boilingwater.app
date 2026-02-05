# Issue #2: No TypeScript Type Safety

**Severity:** 🔴 Critical  
**Status:** ❌ Missing  
**Priority:** P0 - Should precede feature expansion  
**Effort:** 4-6 weeks (full migration) or 1-2 weeks (PropTypes minimum)

---

## What It Means

Your code has **no type checking**. JavaScript doesn't know if a variable should be a number, string, object, or function—until it fails at runtime.

```javascript
// ❌ This code is valid JavaScript
function addNumbers(a, b) {
  return a + b
}

addNumbers(5, 10)        // ✅ Returns 15
addNumbers("5", 10)      // ❌ Returns "510" (string concatenation!)
addNumbers(null, 10)     // ❌ Returns 10 (null coerces to 0)
addNumbers({}, [])       // ❌ Returns "[object Object]" (what even is this?)
```

With TypeScript, you'd catch this **before the code runs**:

```typescript
// ✅ Type-safe version
function addNumbers(a: number, b: number): number {
  return a + b
}

addNumbers(5, 10)        // ✅ OK
addNumbers("5", 10)      // ❌ ERROR: Argument of type 'string' is not assignable to parameter of type 'number'
addNumbers(null, 10)     // ❌ ERROR: Argument of type 'null' is not assignable to parameter of type 'number'
```

---

## Why It's Critical for Your Project

### Scenario: Complex Boiling Point Function

Your physics engine has deeply nested calculations:

```javascript
// src/utils/physics/processes/boilingPoint/calculateBoilingPoint.js

export function calculateBoilingPoint(altitude, fluidProps) {
  if (!fluidProps) return null
  
  const pressure = getISAPressure(altitude)  // Returns number (Pa)
  const antoineResult = solveAntoineEquation(pressure, fluidProps.antoineCoefficients)
  
  // If solvent, apply boiling point elevation
  if (fluidProps.isSolution) {
    const kb = calculateDynamicKb(antoineResult.temperature, fluidProps)
    const elevation = fluidProps.vanHoffFactor * kb * fluidProps.molality
    return { temperature: antoineResult.temperature + elevation }
  }
  
  return antoineResult
}
```

**Without TypeScript, these questions are unanswered:**

| Question | Runtime Result | TypeScript Would Catch |
|----------|-----------------|------------------------|
| What does `solveAntoineEquation()` return? | Object? Number? Null? | ✅ Defined return type |
| Is `fluidProps.antoineCoefficients` always an array? | Maybe it's a string? | ✅ Property type validation |
| Does `calculateDynamicKb()` ever return undefined? | Find out after 3 hours of debugging | ✅ Caught immediately |
| Is `vanHoffFactor` a number or object? | Runtime error on multiplication | ✅ Type error in editor |
| Should I return an object or a number? | Inconsistent returns cause bugs | ✅ Return type enforced |

**Result:** A bug that crashes the app at runtime, hours spent debugging, users affected.

---

## Current State: Catastrophic Type Issues

### Issue 1: Explicitly Disabled Prop Validation

```json
// .eslintrc.json
{
  "rules": {
    "react/prop-types": "off"  // ← Removes the ONLY runtime type check
  }
}
```

This is like saying: "Don't warn me about type errors" — you're actively disabling safety.

### Issue 2: GameScene Has 30+ Untyped Props

```jsx
// src/components/GameScene.jsx

function GameScene({ 
  stage,                    // Should be: number (0 = gameplay, 1 = results)
  location,                 // Should be: { altitude: number, name?: string }
  workshopLayout,           // Should be: WorkshopLayout object
  workshopImages,           // Should be: { background: string, pot_empty: string, ... }
  workshopEffects,          // Should be: EffectsConfig?
  burnerConfig,             // Should be: BurnerConfig
  roomConfig,               // Should be: RoomConfig
  acUnitConfig,             // Should be: AcUnitConfig
  airHandlerConfig,         // Should be: AirHandlerConfig
  activeLevel,              // Should be: number
  activeExperiment,         // Should be: string
  showSelectors,            // Should be: boolean
  onStageChange,            // Should be: (stage: number) => void
  onWaterBoiled,            // Should be: () => void
  onSkipTutorial,           // Should be: () => void
  onLevelChange,            // Should be: (levelId: number) => void
  onExperimentChange,       // Should be: (experimentId: string) => void
  hasBoiledBefore,          // Should be: boolean
  onLocationChange,         // Should be: (location: Location) => void
  onEquipmentChange         // Should be: (type: string, id: string) => void
}) {
  // ... 1857 lines of code
}
```

**Without types, you can pass:**
- `stage="0"` (string instead of number) → breaks comparisons
- `location=undefined` → crashes when accessing `.altitude`
- `onStageChange=null` → crashes when calling `onStageChange(1)`
- Missing `burnerConfig` entirely → undefined reference error

### Issue 3: State Variables Without Contracts

```javascript
const [fluidProps, setFluidProps] = useState(null)
// What shape is fluidProps? Nobody knows!

const [roomState, roomSummary, alerts, ...] = useRoomEnvironment(...)
// What properties does roomState have?
// What's the structure of roomSummary?
```

Later in code:

```javascript
// This will crash if roomState is undefined or missing .temperature
const ambientTemperature = roomState.temperature

// Is this a string or number?
const locationName = location.name
```

---

## Real-World Bugs Without TypeScript

### Bug #1: Room Pressure Type Mismatch

```javascript
// src/utils/roomEnvironment.js
export function updateRoom(deltaTime, source, watts) {
  // What type is watts? Developer assumes number...
  
  const heatAdded = watts * deltaTime  // ← If watts is a string "2000", this concatenates!
  this.temperature += heatAdded / this.heatCapacity
}

// src/components/GameScene.jsx
updateRoom(deltaTime, 'experiment_burner', "2000")  // ← Accidental string
// Result: Temperature calculation is garbage, physics breaks
```

**With TypeScript:**
```typescript
export function updateRoom(deltaTime: number, source: string, watts: number) {
  // ← TypeScript enforces number type
}

// Editor error immediately: "Argument of type 'string' is not assignable to parameter of type 'number'"
```

### Bug #2: Array vs Object Confusion

```javascript
// Who knows what antoineCoefficients should be?
const { A, B, C } = fluidProps.antoineCoefficients

// Is it:
// A) { A: 10.2, B: 1000, C: 42 }        ✅ Object
// B) [10.2, 1000, 42]                    ❌ Array (code breaks)
// C) { coefficients: [10.2, 1000, 42] } ❌ Nested (code breaks)
```

Without types, you find out in production when water boils at the wrong temperature.

### Bug #3: Missing Optional Properties

```javascript
const boilingPoint = calculateBoilingPoint(altitude, fluidProps)
// Is boilingPoint a number or an object?
// { temperature: 100, isExtrapolated: true } ?

if (boilingPoint > temperature) {  // ← Crashes if boilingPoint is an object
  setIsBoiling(true)
}
```

---

## TypeScript vs PropTypes Trade-off

### Option A: Full TypeScript Migration (4-6 weeks)

**Pros:**
- Compile-time type checking (catches 100% of type errors before running)
- IDE autocomplete shows all available properties
- Refactoring is safe (rename a property → all usages break with error)
- Self-documenting code
- Better for large teams

**Cons:**
- Requires build step compilation
- Learning curve
- More verbose initially
- Converts entire `.js` → `.ts`

```typescript
// Full type safety
interface Location {
  altitude: number
  name?: string
  latitude?: number
  longitude?: number
}

interface FluidProps {
  name: string
  molarMass: number
  boilingPointSeaLevel: number
  specificHeat: number
  antoineCoefficients: AntoineCoefficients
  // ... 20+ properties
}

function calculateBoilingPoint(altitude: number, fluidProps: FluidProps): BoilingPointResult {
  // TypeScript checks EVERY reference
}
```

### Option B: PropTypes Only (1-2 weeks)

**Pros:**
- No build step needed
- Catches most errors at runtime
- Quick to implement
- Works with existing `.js` files

**Cons:**
- Runtime checking only (errors happen after user triggers code)
- IDE doesn't get autocomplete help
- Refactoring still dangerous
- Only validates props, not internal state

```javascript
// Runtime validation only
GameScene.propTypes = {
  stage: PropTypes.number.isRequired,
  location: PropTypes.shape({
    altitude: PropTypes.number.isRequired,
    name: PropTypes.string,
  }).isRequired,
  onStageChange: PropTypes.func.isRequired,
  // ... etc
}
```

---

## How TypeScript Would Have Prevented Your Current Bugs

### Your File: GameScene.jsx (1857 lines)

```typescript
// BEFORE: No types, 30+ untyped props
function GameScene({ stage, location, workshopLayout, ... }) {
  const [waterInPot, setWaterInPot] = useState(0)
  const [temperature, setTemperature] = useState(GAME_CONFIG.ROOM_TEMPERATURE)
  
  const ambientTemperature = roomControlsEnabled && roomSummary?.temperature != null
    ? roomSummary.temperature
    : GAME_CONFIG.ROOM_TEMPERATURE
  // ↑ What type is roomSummary? Nobody knows!
}

// AFTER: Fully typed
interface GameSceneProps {
  stage: GameStage
  location: Location
  workshopLayout: WorkshopLayout
  workshopImages: WorkshopImages
  burnerConfig: BurnerConfig
  roomConfig: RoomConfig
  activeLevel: number
  activeExperiment: string
  showSelectors: boolean
  onStageChange: (stage: GameStage) => void
  onWaterBoiled?: () => void
  onLocationChange?: (location: Location) => void
  // ... etc - 30 props fully typed
}

interface RoomSummary {
  temperature: number
  pressure: number
  composition: Record<string, number>
  alerts: Alert[]
}

function GameScene(props: GameSceneProps) {
  const { stage, location, onStageChange } = props
  
  // ✅ TypeScript knows these types
  const [waterInPot, setWaterInPot] = useState<number>(0)
  const [temperature, setTemperature] = useState<number>(GAME_CONFIG.ROOM_TEMPERATURE)
  
  // ✅ roomSummary is typed as RoomSummary
  const ambientTemperature: number = roomControlsEnabled && roomSummary?.temperature != null
    ? roomSummary.temperature
    : GAME_CONFIG.ROOM_TEMPERATURE
}
```

---

## Implementation Path

### Path 1: PropTypes Quick Fix (1-2 weeks) - Start Here

**Day 1-2:**
```bash
npm install prop-types
npm install --save-dev eslint-plugin-prop-types
```

**Day 3-4:** Add PropTypes to critical components

```javascript
// src/components/GameScene.jsx
import PropTypes from 'prop-types'

GameScene.propTypes = {
  stage: PropTypes.number.isRequired,
  location: PropTypes.shape({
    altitude: PropTypes.number.isRequired,
    name: PropTypes.string,
    latitude: PropTypes.number,
    longitude: PropTypes.number,
  }).isRequired,
  workshopLayout: PropTypes.object.isRequired,
  workshopImages: PropTypes.shape({
    background: PropTypes.string.isRequired,
    pot_empty: PropTypes.string.isRequired,
    pot_full: PropTypes.string.isRequired,
    flame: PropTypes.string.isRequired,
  }).isRequired,
  burnerConfig: PropTypes.object.isRequired,
  roomConfig: PropTypes.object.isRequired,
  acUnitConfig: PropTypes.object.isRequired,
  airHandlerConfig: PropTypes.object.isRequired,
  activeLevel: PropTypes.number.isRequired,
  activeExperiment: PropTypes.string.isRequired,
  showSelectors: PropTypes.bool.isRequired,
  onStageChange: PropTypes.func.isRequired,
  onWaterBoiled: PropTypes.func,
  onSkipTutorial: PropTypes.func,
  onLevelChange: PropTypes.func,
  onExperimentChange: PropTypes.func,
  hasBoiledBefore: PropTypes.bool,
  onLocationChange: PropTypes.func,
  onEquipmentChange: PropTypes.func,
}
```

**Day 5:** Extend to physics functions

```javascript
// src/utils/physics/formulas/latentHeat.js
import PropTypes from 'prop-types'

export function calculateVaporizationEnergy(massKg, heatOfVapKJ) {
  if (typeof massKg !== 'number') throw new Error('massKg must be a number')
  if (typeof heatOfVapKJ !== 'number') throw new Error('heatOfVapKJ must be a number')
  
  const heatOfVapJ = heatOfVapKJ * 1000
  return massKg * heatOfVapJ
}
```

**Benefits:** Catches most type errors, minimal setup time  
**Limitation:** Only checks at runtime, no editor help

---

### Path 2: Full TypeScript Migration (4-6 weeks) - Best Long-term

**Week 1: Setup**
```bash
npm install --save-dev typescript ts-loader @types/react @types/react-dom @types/node
npx tsc --init

# Create tsconfig.json with strict mode
```

**Week 2-3: Convert core utils**
```
src/utils/physics/         # .js → .ts
src/utils/roomEnvironment/ # .js → .ts
src/hooks/                 # .js → .ts
src/constants/             # .js → .ts
```

**Week 4-5: Convert components**
```
src/components/ # .jsx → .tsx
src/App.jsx     # → .tsx
```

**Week 6: Testing and polish**
```
npm run build    # Catches all type errors
npm run type-check
```

---

## Critical Areas for Type Safety

### 1. Physics Engine (HIGHEST PRIORITY)

```typescript
// src/utils/physics/types.ts

export interface AntoineCoefficients {
  A: number
  B: number
  C: number
  TminC: number
  TmaxC: number
  note?: string
}

export interface FluidProperties {
  name: string
  chemicalFormula: string
  molarMass: number
  boilingPointSeaLevel: number
  specificHeat: number
  heatOfVaporization: number
  thermalConductivity: number
  antoineCoefficients: AntoineCoefficients
  isSolution: boolean
  vanHoffFactor?: number
  molality?: number
  canBoil: boolean
}

export interface BoilingPointResult {
  temperature: number
  isExtrapolated: boolean
  verifiedRange: { min: number | null; max: number | null }
}

// Every function is now type-safe
export function calculateBoilingPoint(
  altitude: number,
  fluidProps: FluidProperties
): BoilingPointResult | null
```

### 2. Room Environment

```typescript
export interface RoomState {
  roomVolume: number
  roomTemperature: number
  acTargetTemperature: number
  roomPressure: number
  composition: Record<string, number>
  heatLog: HeatLogEntry[]
  compositionLog: CompositionLogEntry[]
  alerts: Alert[]
}

export interface HeatLogEntry {
  timestamp: number
  source: 'experiment_burner' | 'ac_cooling' | 'reaction'
  watts: number
}
```

### 3. UI State

```typescript
export interface GameSceneProps {
  stage: GameStage
  location: Location
  workshopLayout: WorkshopLayout
  // ... all 30 props typed
}

export type GameStage = 0 | 1 | 2  // Stage 0 = gameplay, etc.

export interface Location {
  altitude: number
  name?: string
  latitude?: number
  longitude?: number
}
```

---

## Real Impact: Before vs After

### Refactoring the Physics Engine

**WITHOUT TypeScript:**
```javascript
// OLD CODE
export function calculateBoilingPoint(altitude, fluidProps) {
  const pressure = getISAPressure(altitude)
  return solveAntoineEquation(pressure, fluidProps.antoine)  // ← What shape is this?
}

// REFACTORED (did I break anything?)
export function calculateBoilingPoint(altitude, fluidProps) {
  const pressure = getISAPressure(altitude)
  const result = solveAntoineEquation(pressure, fluidProps.antoineCoefficients)  // ← Changed property name
  return result.temperature  // ← Changed return type
}

// Testing: You have to manually test every experiment to find the bug
// Time: 3-4 hours debugging
```

**WITH TypeScript:**
```typescript
// OLD CODE
export function calculateBoilingPoint(
  altitude: number,
  fluidProps: FluidProperties
): BoilingPointResult {
  const pressure = getISAPressure(altitude)
  return solveAntoineEquation(pressure, fluidProps.antoine)
}
// ❌ ERROR: Property 'antoine' does not exist on type 'FluidProperties'

// REFACTORED
export function calculateBoilingPoint(
  altitude: number,
  fluidProps: FluidProperties
): BoilingPointResult {
  const pressure = getISAPressure(altitude)
  const result = solveAntoineEquation(pressure, fluidProps.antoineCoefficients)
  return result.temperature  // ❌ ERROR: Property 'temperature' does not exist on type 'BoilingPointResult'
}

// Testing: Editor shows errors immediately, before even running tests
// Time: < 1 minute fix
```

---

## Cost-Benefit Analysis

### Without TypeScript (Current)

| Event | Cost | Impact |
|-------|------|--------|
| Type error in production | 4-8 hours debugging | User reports bug |
| Refactoring physics | 3-4 hours verification | Risk of breaking other systems |
| New developer onboarding | 2-3 days learning prop shapes | Productivity hit |
| Adding feature | 1-2 hours of manual testing | Missed edge cases |
| **Total per month** | **40-50 hours wasted** | **🔴 High risk** |

### With TypeScript

| Event | Cost | Impact |
|-------|------|--------|
| Type error caught | < 1 minute (editor shows it) | 🟢 Prevented |
| Refactoring physics | 30 minutes (TypeScript validates) | Safe, confident |
| New developer onboarding | 4-6 hours (types are docs) | ✅ Clear expectations |
| Adding feature | 30 minutes (types guide implementation) | ✅ Fewer bugs |
| **Total per month** | **5-10 hours overhead** | **🟢 Very safe** |

**ROI: 5× time savings within 2 months**

---

## Why This Matters More for Physics Code

Your project teaches **real science**. Type safety is extra critical because:

1. **Physics calculations must be correct**
   - One unit mismatch (Joules vs kilojoules) breaks everything
   - Types document units: `temperatureC: number`, `energyJ: number`, `energyKJ: number`

2. **Constants must not vary**
   - `Lv = 2257 kJ/kg` (water)
   - `Lv = 838 kJ/kg` (ethanol)
   - Without types, you can't distinguish between them

3. **Feedback loops are fragile**
   - Room pressure → boiling point → vapor release → room pressure
   - One type error breaks the entire loop

---

## Success Metrics

Once TypeScript is implemented:

| Metric | Target | Current |
|--------|--------|---------|
| Type Coverage | 100% | 0% |
| Props Validated | Yes | ❌ No |
| IDE Autocomplete | Full | Minimal |
| Refactoring Safety | Very High | Very Low |
| Compile-time Errors | Caught | Never |

---
## AI-Assisted Coding: TypeScript is CRITICAL

### Why TypeScript Matters 10x More with AI Code Generation

AI tools (GitHub Copilot, Cursor, ChatGPT) generate code **fast** but have specific blind spots that TypeScript catches:

**Common AI Type Mistakes:**

1. **Overuses `any` type**
   ```typescript
   // ❌ AI generates this
   function processData(data: any): any {
     return data.map((item: any) => item.value)
   }
   
   // ✅ Strict TypeScript catches it
   function processData(data: DataItem[]): number[] {
     return data.map(item => item.value)
   }
   ```

2. **Forgets return types**
   ```typescript
   // ❌ AI often skips return type
   async function fetchUserData(id: string) {
     const response = await fetch(`/api/users/${id}`)
     return response.json()  // What type is this?
   }
   
   // ✅ Explicit return type
   async function fetchUserData(id: string): Promise<User> {
     const response = await fetch(`/api/users/${id}`)
     return response.json() as User
   }
   ```

3. **Misses optional properties**
   ```typescript
   // ❌ AI assumes all properties exist
   interface FluidProps {
     antoineCoefficients: number[]  // Always present?
   }
   
   // ✅ Explicit optionality
   interface FluidProps {
     antoineCoefficients?: number[]  // May be undefined
   }
   ```

4. **Uses non-null assertions unsafely**
   ```typescript
   // ❌ AI loves the ! operator
   const user = users.find(u => u.id === id)!
   user.name  // Crashes if user is undefined
   
   // ✅ Safe handling
   const user = users.find(u => u.id === id)
   if (user) {
     return user.name
   }
   ```

### TypeScript ESLint Rules for AI Code

Add these to `tsconfig.json` and `.eslintrc.json` to catch AI mistakes:

**tsconfig.json (Strict Mode):**
```json
{
  "compilerOptions": {
    "strict": true,  // Enables all strict checks
    "noImplicitAny": true,  // No implicit 'any'
    "strictNullChecks": true,  // Can't use undefined without checking
    "strictFunctionTypes": true,  // Function param checking
    "noUncheckedIndexedAccess": true,  // Array/object access safety
    "noUnusedLocals": true,  // Catch unused variables
    "noUnusedParameters": true,  // Catch unused params
    "noImplicitReturns": true,  // All code paths must return
    "noFallthroughCasesInSwitch": true  // Switch statement safety
  }
}
```

**.eslintrc.json (TypeScript Rules):**
```json
{
  "extends": [
    "plugin:@typescript-eslint/recommended",
    "plugin:@typescript-eslint/recommended-requiring-type-checking"
  ],
  "rules": {
    // AI overuses 'any' type
    "@typescript-eslint/no-explicit-any": "error",
    
    // AI forgets return types
    "@typescript-eslint/explicit-function-return-type": ["warn", {
      "allowExpressions": true,
      "allowTypedFunctionExpressions": true
    }],
    
    // AI creates unused variables
    "@typescript-eslint/no-unused-vars": ["error", {
      "argsIgnorePattern": "^_"
    }],
    
    // AI uses non-null assertions unsafely
    "@typescript-eslint/no-non-null-assertion": "warn",
    
    // AI misses async/await patterns
    "@typescript-eslint/no-floating-promises": "error",
    
    // AI uses 'as' casts too liberally
    "@typescript-eslint/consistent-type-assertions": ["warn", {
      "assertionStyle": "as",
      "objectLiteralTypeAssertions": "never"
    }],
    
    // AI forgets to handle all enum cases
    "@typescript-eslint/switch-exhaustiveness-check": "error"
  }
}
```

### Update Copilot Instructions for TypeScript

Create or update `.github/copilot-instructions.md`:

```markdown
## TypeScript Rules

- NEVER use `any` type. Use `unknown` if type is truly dynamic.
- ALWAYS add explicit return types to functions.
- ALWAYS mark optional properties with `?`.
- NEVER use non-null assertion (`!`) without null check.
- ALWAYS use type guards before accessing properties.
- Use `const` assertions for literal types.
- Prefer `interface` over `type` for object shapes.

## Physics Code

- All physics functions must have typed parameters and return types.
- Document units in type names: `temperatureC`, `pressurePa`, `energyKJ`.
- Never mix units (no implicit conversions).

## Examples

```typescript
// ✅ GOOD: Explicit types, safe access
function calculateBoilingPoint(
  altitude: number,  // meters
  fluidProps: FluidProperties
): BoilingPointResult | null {
  if (!fluidProps.antoineCoefficients) {
    return null
  }
  
  const pressure = getISAPressure(altitude)
  return solveAntoineEquation(pressure, fluidProps.antoineCoefficients)
}

// ❌ BAD: Implicit any, unsafe access
function calculateBoilingPoint(altitude, fluidProps) {
  const pressure = getISAPressure(altitude)
  return solveAntoineEquation(pressure, fluidProps.antoineCoefficients!)
}
```
```

### Pre-commit Hooks for TypeScript

```bash
# .husky/pre-commit
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Type check before commit
npm run type-check

# Lint TypeScript files
npx lint-staged
```

```json
// package.json
{
  "scripts": {
    "type-check": "tsc --noEmit"
  },
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ]
  }
}
```

**This blocks AI-generated broken TypeScript from being committed.**

### AI Coding Best Practices for TypeScript

1. **Review AI type suggestions critically** — AI defaults to `any` too often
2. **Run type checker immediately** — `npm run type-check` after AI generates code
3. **Use strict mode from day 1** — Easier than retrofitting
4. **Add types to Copilot instructions** — Guide AI behavior
5. **Test edge cases** — AI focuses on happy path, types catch sad path
6. **Use type guards** — AI forgets runtime checks

---
## Recommendation

**For Boiling Water, I recommend a hybrid approach:**

1. **Immediate (Week 1):** Add PropTypes to critical components
   - `<GameScene>` (30 props)
   - Physics functions (15+ functions)
   - Room environment functions (10+ functions)
   - Time: 3-4 days
   - Benefit: Catch most type errors at runtime

2. **Medium-term (Weeks 3-6):** Migrate to TypeScript
   - Start with utilities (physics, room, location)
   - Move to hooks
   - Finally convert components
   - Time: 4-6 weeks
   - Benefit: Full type safety, IDE support, refactoring confidence

---

## Related Issues

- [Issue #1: No Unit Tests](ISSUE_01_NO_UNIT_TESTS.md) (types make tests easier)
- [Issue #3: Massive Components](../INDUSTRY_STANDARDS_AUDIT.md#3-massive-monolithic-component-files) (types help during refactoring)
- [Remediation Phase 1](../INDUSTRY_STANDARDS_AUDIT.md#phase-1-foundation-weeks-1-2)

---

**Status:** Ready for decision  
**Blocking:** Production deployment  
**Recommended first step:** Add PropTypes to critical components (3-4 days)  
**Long-term fix:** Migrate to TypeScript (4-6 weeks)
