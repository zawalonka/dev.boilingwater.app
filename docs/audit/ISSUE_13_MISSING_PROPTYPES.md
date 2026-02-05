# Issue #13: Missing PropTypes Validation

**Severity:** 🟡 Low  
**Status:** ⚠️ No type checking  
**Priority:** P3  
**Effort:** 1-2 days

---

## What It Means

Your React components have **no PropTypes** — they don't validate the data being passed to them. Wrong data types cause silent failures and confusing bugs.

```javascript
// Current state: No PropTypes
export function Pot({ waterMass, temperature, color }) {
  // No validation
  // waterMass could be string, object, null, undefined
  // temperature could be any type
  // color could be missing
  
  return (
    <div style={{ background: color }}>
      Mass: {waterMass}kg
      Temp: {temperature}°C
    </div>
  )
}

// Used incorrectly:
<Pot 
  waterMass="100"        // ← String, not number!
  temperature={null}     // ← null, not number
  color={123}            // ← Number, not string!
/>

// No warning about wrong types
// Silent bugs result
```

**Current state:** Components accept any data type, no validation.  
**After fix:** Components validate all props, warn about mismatches.

---

## Why It's Important

### 1. Silent Bugs

```javascript
// src/components/Temperature.jsx
export function Temperature({ value, unit }) {
  const display = value.toFixed(1)  // ← Crashes if value is string
  return <div>{display}°{unit}</div>
}

// Used incorrectly:
<Temperature value="25.5" unit="C" />

// Runtime error: "value.toFixed is not a function"
// Entire component crashes
// No warning beforehand

// With PropTypes:
// Warning during development:
// "Invalid prop `value` of type `string`, expected `number`"
// Caught before runtime error
```

### 2. Silent Data Corruption

```javascript
// src/components/Burner.jsx
export function Burner({ maxWatts, currentWatts }) {
  const percentage = (currentWatts / maxWatts) * 100
  return <div style={{ width: percentage + '%' }}>...</div>
}

// Used incorrectly:
<Burner 
  maxWatts="2000"     // ← String!
  currentWatts={500}  // ← Number
/>

// Calculation: "500" / "2000" * 100
// Result: "5002000" (string concatenation, not math!)
// Progress bar shows "5002000%" width
// Component breaks silently

// With PropTypes:
// Warning: "Invalid prop `maxWatts` of type `string`, expected `number`"
// Bug caught in development
```

### 3. Impossible to Debug

```javascript
// Bug report: "Temperature display is broken"
// 
// You look at component - looks fine
// You look at parent - seems to pass correct data
// Hours debugging, can't find issue
//
// Root cause: Parent sometimes passes string instead of number
// But there's no validation to catch it

// With PropTypes:
// Warnings immediately show the problem
// "Hey, this component expects number but got string"
```

---

## Real Bugs Without PropTypes

### Bug #1: Type Mismatch Crashes Component

```javascript
// src/utils/physics.js
export function calculateBoilingPoint(altitude, fluidProps) {
  const pressure = ISAmodel.calculatePressure(altitude)  // ← Expects number
  return solveAntoine(pressure, fluidProps)
}

// Used incorrectly:
calculateBoilingPoint("5000", fluidProps)  // ← Passing string!

// ISA model: tries to do math with string
// Result: NaN (Not a Number)
// Returns NaN
// UI shows: "Boiling point: NaN°C"

// Bug reported: "Calculator is broken at altitude 5000m"
// Root cause hidden by lack of validation
```

### Bug #2: Missing Required Prop

```javascript
// src/components/Workshop.jsx
export function Workshop({ id, name, description, imageUrl }) {
  return (
    <div>
      <img src={imageUrl} alt={name} />  // ← Crashes if imageUrl missing
      <h1>{name}</h1>
      <p>{description}</p>
    </div>
  )
}

// Used without imageUrl:
<Workshop 
  id="1"
  name="Alpha Kitchen"
  description="First workshop"
  // imageUrl forgot!
/>

// Error: "Cannot set src attribute of null"
// Or image broken with no alt text
// No warning about missing prop

// With PropTypes:
// Warning: "Failed prop type: The prop `imageUrl` is marked as required"
// Caught before rendering
```

### Bug #3: Wrong Array Structure

```javascript
// src/components/WorkshopList.jsx
export function WorkshopList({ workshops }) {
  return (
    <ul>
      {workshops.map(w => <li key={w.id}>{w.name}</li>)}  // ← Expects array of objects
    </ul>
  )
}

// Used incorrectly:
<WorkshopList workshops="alpha,beta,gamma" />  // ← Passing string!

// JS tries: "alpha,beta,gamma".map(...)
// Result: ["a", "l", "p", "h", ...] (maps over characters!)
// Output: 
// - a
// - l
// - p
// - h
// - a

// Bug: List shows individual characters instead of workshops
// No warning about wrong data structure

// With PropTypes:
// Warning: "Invalid prop `workshops` of type `string`, expected `array`"
```

---

## Current State: No Type Validation

```javascript
// Your components accept anything
export function Pot({ waterMass, temperature, color }) {
  // No PropTypes
  // No validation
  // Could be any type
  
  return <div>...</div>
}

// No validation means:
// ❌ Wrong types accepted silently
// ❌ Wrong data structures accepted
// ❌ Missing required props accepted
// ❌ Bugs only found at runtime
// ❌ Hard to debug
```

---

## Solution: PropTypes

### What PropTypes Does

```javascript
// Validates at runtime:
// ✅ Prop type matches expected type
// ✅ Required props are provided
// ✅ Prop values are in valid range
// ✅ Prop values match specific values

// Warnings appear during development:
// "Invalid prop `value` of type `string`, expected `number`"
```

### Installation

```bash
npm install prop-types
```

### Basic Usage

```javascript
// src/components/Pot.jsx
import PropTypes from 'prop-types'

export function Pot({ waterMass, temperature, color }) {
  return (
    <div style={{ background: color }}>
      Mass: {waterMass}kg
      Temp: {temperature}°C
    </div>
  )
}

Pot.propTypes = {
  waterMass: PropTypes.number.isRequired,
  temperature: PropTypes.number.isRequired,
  color: PropTypes.string.isRequired
}

Pot.defaultProps = {
  waterMass: 1.0,
  temperature: 20,
  color: '#8B7355'
}

// Now if you pass wrong types:
// <Pot waterMass="100" />
// Warning: "Invalid prop `waterMass` of type `string`, expected `number`"
```

---

## PropTypes Validators

### Basic Types

```javascript
import PropTypes from 'prop-types'

MyComponent.propTypes = {
  // Primitive types
  stringProp: PropTypes.string,
  numberProp: PropTypes.number,
  boolProp: PropTypes.bool,
  arrayProp: PropTypes.array,
  objectProp: PropTypes.object,
  funcProp: PropTypes.func,
  
  // Required versions
  requiredString: PropTypes.string.isRequired,
  requiredNumber: PropTypes.number.isRequired,
  
  // Special types
  nodeProp: PropTypes.node,              // Anything renderable
  elementProp: PropTypes.element,         // React element
  
  // Specific values
  statusProp: PropTypes.oneOf(['active', 'inactive', 'pending']),
  typeProp: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number
  ]),
  
  // Collections
  arrayOfNumbers: PropTypes.arrayOf(PropTypes.number),
  objectWithShape: PropTypes.shape({
    id: PropTypes.number.isRequired,
    name: PropTypes.string.isRequired,
    active: PropTypes.bool
  }),
  
  // Custom validation
  customNumber: PropTypes.number.isRequired.validate((props, propName, componentName) => {
    const value = props[propName]
    if (value < 0 || value > 100) {
      return new Error(`${componentName}: ${propName} must be between 0-100`)
    }
  })
}
```

---

## Real PropTypes Examples

### Example 1: Physics Component

```javascript
// src/components/Temperature.jsx
import PropTypes from 'prop-types'

export function Temperature({ current, target, unit }) {
  return (
    <div className="temperature">
      <div className="current">{current.toFixed(1)}°{unit}</div>
      <div className="target">Target: {target.toFixed(1)}°</div>
    </div>
  )
}

Temperature.propTypes = {
  current: PropTypes.number.isRequired,
  target: PropTypes.number.isRequired,
  unit: PropTypes.oneOf(['C', 'F', 'K']).isRequired
}

Temperature.defaultProps = {
  current: 20,
  target: 100,
  unit: 'C'
}

// Usage:
<Temperature current={25.5} target={100} unit="C" />  // ✅ Valid
<Temperature current="25.5" target={100} unit="C" />  // ⚠️ Warning: string not number
<Temperature current={25.5} target={100} unit="X" />  // ⚠️ Warning: X not in ['C', 'F', 'K']
<Temperature current={25.5} unit="C" />               // ⚠️ Warning: target is required
```

### Example 2: Data Structure

```javascript
// src/components/WorkshopSelector.jsx
import PropTypes from 'prop-types'

export function WorkshopSelector({ workshops, onSelect, disabled }) {
  return (
    <select onChange={e => onSelect(e.target.value)} disabled={disabled}>
      {workshops.map(w => (
        <option key={w.id} value={w.id}>{w.name}</option>
      ))}
    </select>
  )
}

WorkshopSelector.propTypes = {
  workshops: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      description: PropTypes.string,
      imageUrl: PropTypes.string
    })
  ).isRequired,
  onSelect: PropTypes.func.isRequired,
  disabled: PropTypes.bool
}

WorkshopSelector.defaultProps = {
  disabled: false
}

// Valid:
<WorkshopSelector 
  workshops={[
    { id: '1', name: 'Alpha', description: '...' },
    { id: '2', name: 'Beta' }
  ]}
  onSelect={id => console.log(id)}
/>

// Invalid:
<WorkshopSelector 
  workshops="alpha,beta"  // ⚠️ Should be array
  onSelect={() => {}}
/>
```

---

## Implementation Plan

### Phase 1: Identify Components (1 hour)

```bash
# Find all components
ls src/components/*.jsx

# For each component, determine its props
# Are they required? What types?
```

### Phase 2: Add PropTypes (2-3 hours)

```javascript
// For each component:
// 1. Import PropTypes
// 2. Define propTypes object
// 3. Define defaultProps
// 4. Test with invalid props
```

### Phase 3: Fix Warnings (1-2 hours)

```bash
npm run dev

# Browser console shows PropTypes warnings
# Fix each one:
# - Pass correct types to components
# - Add missing required props
# - Fix data structures
```

### Phase 4: Lint Check (30 min)

```bash
# Enable ESLint rule for PropTypes
# Ensure all components have them
```

---

## Before and After

### Before: No Validation

```javascript
export function Burner({ maxWatts, currentWatts }) {
  const percentage = (currentWatts / maxWatts) * 100
  return <div style={{ width: percentage + '%' }} />
}

// Used incorrectly:
<Burner maxWatts="2000" currentWatts={500} />
// No warning
// Math fails silently
// Progress bar shows wrong value
```

### After: With PropTypes

```javascript
import PropTypes from 'prop-types'

export function Burner({ maxWatts, currentWatts }) {
  const percentage = (currentWatts / maxWatts) * 100
  return <div style={{ width: percentage + '%' }} />
}

Burner.propTypes = {
  maxWatts: PropTypes.number.isRequired,
  currentWatts: PropTypes.number.isRequired
}

// Used incorrectly:
<Burner maxWatts="2000" currentWatts={500} />
// Warning appears:
// "Invalid prop `maxWatts` of type `string`, expected `number`"
// Bug caught before runtime
```

---

## Disabling PropTypes in Production

```javascript
// vite.config.mjs
export default defineConfig({
  define: {
    'process.env.NODE_ENV': '"production"'
  },
  plugins: [
    react({
      babel: {
        plugins: [
          ['@babel/plugin-transform-react-constant-elements'],
          ['babel-plugin-transform-remove-prop-types', {
            removeImport: true
          }]
        ]
      }
    })
  ]
})
```

**Result:** PropTypes stripped from production build (smaller bundle).

---

## Integration with TypeScript

PropTypes are a temporary measure. Eventually:

```
Phase 1: Add PropTypes (catches bugs now)
         ↓
Phase 2: Migrate to TypeScript (full type safety)
         ↓
Phase 3: Remove PropTypes (TypeScript has them)
```

For now: PropTypes + ESLint = good middle ground.

---

## Benefits Summary

| Aspect | Before | After |
|--------|--------|-------|
| **Type validation** | None | Comprehensive |
| **Bug detection** | Runtime | Development |
| **Developer clarity** | Guess prop types | Clear documentation |
| **Error messages** | Cryptic crashes | Clear warnings |
| **New developer onboarding** | Confusing | Self-documenting |

---

## Timeline and Effort

| Task | Duration |
|------|----------|
| Identify all components | 1 hour |
| Add PropTypes to components | 2-3 hours |
| Fix warnings | 1-2 hours |
| Testing | 1 hour |
| **Total** | **5-7 hours** |

**Calendar: 1 day**

---

## Integration with Other Issues

- [Issue #2: No TypeScript](ISSUE_02_NO_TYPESCRIPT.md) (PropTypes → TypeScript migration path)
- [Issue #6: Incomplete ESLint](ISSUE_06_INCOMPLETE_ESLINT.md) (Can require PropTypes in rules)
- [Remediation Phase 3](../INDUSTRY_STANDARDS_AUDIT.md#phase-3-polish-week-6)

---

## Recommendation

**Do this in Phase 3 (Polish) or alongside Phase 1:**

Can do before TypeScript migration (temporary type safety) or skip if planning immediate TypeScript migration.

1. Identify all components (1 hour)
2. Add PropTypes to each (2-3 hours)
3. Fix warnings as they appear (1-2 hours)
4. Test with invalid props (30 min)
5. Commit "feat: add PropTypes validation to all components"

**Alternative:** Skip PropTypes if planning TypeScript migration soon. TypeScript provides better type safety anyway.

---

**Status:** Ready for implementation  
**Blocking:** Type safety (temporary measure before TypeScript)  
**Effort:** 1 day  
**Payoff:** Catch type mismatches in development, self-documenting components  
**Priority:** P3 - Can skip if migrating to TypeScript soon, otherwise do in Phase 3
