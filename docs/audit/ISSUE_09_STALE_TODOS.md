# Issue #9: Stale TODOs and FIXME Comments

**Severity:** 🟡 Low  
**Status:** ⚠️ Code contamination  
**Priority:** P3  
**Effort:** 1 day

---

## What It Means

Your codebase has **scattered TODO/FIXME comments** left from incomplete work. These clutter the code, confuse developers, and make it hard to know what's intentional vs. incomplete.

```javascript
// Current state: Scattered TODOs
export function calculateBoilingPoint(altitude, fluidProps) {
  // TODO: Handle negative altitude?
  // FIXME: This doesn't work at high altitude
  // XXX: Make this more efficient
  const pressure = calculatePressureISA(altitude)
  
  // TODO: Add caching here
  const bp = solveAntoine(pressure, fluidProps)
  
  // FIXME: Temperature validation needed
  return bp
}

// Problems:
// ❌ Are these important or abandoned?
// ❌ Is negative altitude a real issue or forgotten?
// ❌ Is caching needed or nice-to-have?
// ❌ Creates confusion when reading code
```

**Current state:** Dozens of TODOs scattered throughout code.  
**After fix:** Either implement them, close as issues, or delete.

---

## Why It's A Problem

### 1. Creates Cognitive Load

```javascript
// Developer reads code, sees TODO
function simulateTimeStep(state, heat, deltaTime, fluidProps) {
  // TODO: Verify this calculation at extreme temperatures
  const newTemp = state.temperature + (heat / state.waterMass) * deltaTime
  
  // New developer thinks:
  // - Is this calculation wrong?
  // - Should I avoid it?
  // - Is it safe to use?
  // - Do I need to fix this first?
  
  // Wastes 5-10 minutes investigating
}
```

### 2. Obscures What's Done

```javascript
// Old code with abandoned TODO
export function applyAcControl(roomTemp, setpoint, acUnit, pidState, deltaTime) {
  // TODO: Implement integral windup guard
  const error = setpoint - roomTemp
  const integral = pidState.integral + error * deltaTime  // Missing bounds
  
  // Is this unfinished work or intentional?
  // Should we fix it?
  // Is it causing bugs?
```

### 3. Accumulates Over Time

```javascript
// After 6 months of development:
// 15 TODOs
// 8 FIXMEs
// 3 XXXs
// 2 HAXXs
// 1 HACK
// = 29 scattered incomplete thoughts

// New developer: "Which ones are important?"
// Dev team: *shrug* "Not sure, they're all old"
```

### 4. Fails Code Review

```javascript
// Pull Request Review:
// Reviewer: "There's a TODO here. Is this complete?"
// Author: "Yeah, it's fine, just a note"
// Reviewer: "Should we document what it means?"
// Author: "Not sure, it was there when I started"

// Review goes back and forth
// Time wasted on abandoned comments
```

---

## Real Bugs From Stale TODOs

### Bug #1: Abandoned Safety Check

```javascript
// src/utils/physics.js
export function calculateBoilingPoint(altitude, fluidProps) {
  // TODO: Validate altitude is between -500m and 100km
  const pressure = calculatePressureISA(altitude)
  
  // Two years later...
  // Someone passes -50,000m (underground/invalid)
  // ISA model breaks down
  // Physics calculation returns NaN
  // UI shows "Boiling point: NaN°C"
  // Bug report: "Calculator is broken"

  const bp = solveAntoine(pressure, fluidProps)
  return bp
}

// TODO was a reminder to add validation
// But it was forgotten
// Bug only discovered in production
```

### Bug #2: Performance Regression

```javascript
// src/utils/substanceLoader.js
export async function loadSubstance(id) {
  // TODO: Add caching to avoid reloading
  const response = await fetch(`/api/substances/${id}`)
  const data = await response.json()
  return data
}

// Every time substance loads, fetches from API
// Could load same substance 10 times per experiment
// 10x slower than necessary
// Users complain: "App is sluggish"

// TODO was reminder for optimization
// But it was forgotten
// Performance degradation unnoticed
```

### Bug #3: Missing Error Handling

```javascript
// src/components/GameScene.jsx
useEffect(() => {
  // TODO: Handle loading state and errors
  const loadWorkshop = async () => {
    const workshop = await fetch('/api/workshops/' + activeWorkshop)
    return workshop.json()
  }
  
  loadWorkshop()
}, [activeWorkshop])

// Network error happens
// No error handling (TODO was never done)
// Promise rejected silently
// UI stuck in inconsistent state
// Users see broken UI
```

---

## Current TODO Accumulation

### Types of Scattered TODOs

```javascript
// Type 1: Abandoned feature
// TODO: Implement room pressure calculation

// Type 2: Forgotten optimization
// TODO: Memoize this function

// Type 3: Safety reminder (forgotten)
// TODO: Validate input parameters

// Type 4: Unclear note
// FIXME: This seems wrong?

// Type 5: Old code comment
// XXX: Need to rewrite this

// Type 6: Hackish fix
// HACK: Temporary workaround for bug #123

// Type 7: Non-standard marker
// FIX
// TEMP
// KLUDGE
// NOLINT
```

**Problem:** No structure, no priority, no ownership, no deadline.

---

## Solution: Handle Every TODO

### Option 1: Implement It

```javascript
// Before:
export function calculateBoilingPoint(altitude, fluidProps) {
  // TODO: Handle negative altitude
  const pressure = calculatePressureISA(altitude)
  const bp = solveAntoine(pressure, fluidProps)
  return bp
}

// After:
export function calculateBoilingPoint(altitude, fluidProps) {
  if (altitude < -500) {
    throw new Error('Altitude cannot be below -500m (deepest ocean)')
  }
  const pressure = calculatePressureISA(altitude)
  const bp = solveAntoine(pressure, fluidProps)
  return bp
}

// Remove TODO, add validation
```

### Option 2: Create a GitHub Issue

```javascript
// Before:
export async function loadSubstance(id) {
  // TODO: Implement caching to reduce API calls
  const response = await fetch(`/api/substances/${id}`)
  return response.json()
}

// After:
export async function loadSubstance(id) {
  const response = await fetch(`/api/substances/${id}`)
  return response.json()
}

// Remove TODO, create GitHub Issue:
// Title: "Performance: Implement substance loading cache"
// Priority: Medium
// Effort: 2-4 hours
// Owned by: @developer

// Comment in code if critical:
// Note: See issue #247 for caching implementation
```

### Option 3: Delete It

```javascript
// Before:
export function simulateTimeStep(state, heat, deltaTime, fluidProps) {
  // TODO: Maybe optimize this loop?
  const newTemp = state.temperature + (heat / state.waterMass) * deltaTime
  return { ...state, temperature: newTemp }
}

// After:
export function simulateTimeStep(state, heat, deltaTime, fluidProps) {
  const newTemp = state.temperature + (heat / state.waterMass) * deltaTime
  return { ...state, temperature: newTemp }
}

// If optimization isn't planned, remove speculative TODO
```

---

## Finding All TODOs

### Command to Find Them

```bash
# Find all TODO-like comments
grep -r "TODO\|FIXME\|XXX\|HACK\|BUG\|KLUDGE" src/ --include="*.js" --include="*.jsx"

# Output:
# src/components/GameScene.jsx:234:    // TODO: Memoize this component
# src/utils/physics.js:45:    // FIXME: Handle negative values
# src/utils/workshopLoader.js:12:    // XXX: This seems inefficient
```

### ESLint Plugin to Flag Them

```bash
# Install ESLint rule for TODOs
npm install --save-dev eslint-plugin-no-warning-comments
```

```json
// .eslintrc.json
{
  "plugins": ["no-warning-comments"],
  "rules": {
    "no-warning-comments": [
      "warn",
      {
        "terms": ["TODO", "FIXME", "XXX", "HACK"],
        "location": "anywhere"
      }
    ]
  }
}
```

**Now ESLint warns about TODOs during development:**
```bash
npm run lint

src/components/GameScene.jsx
  234:12  warning  Unexpected 'TODO' comment  no-warning-comments
  567:8   warning  Unexpected 'FIXME' comment  no-warning-comments
```

---

## Standardized TODO Format

### Good TODO (Actionable)

```javascript
// TODO(2026-02-04): Implement altitude validation for calculateBoilingPoint
// Reason: Users can pass invalid altitudes (< -500m or > 100km)
// Issue: #247
// Owner: @developer-name
if (altitude < -500 || altitude > 100000) {
  throw new Error('Altitude out of bounds')
}
```

**Format:** `TODO(DATE): Description of what, reason why, issue number, owner`

### Bad TODO (Vague)

```javascript
// TODO: Fix this?
// FIXME: Make better
// XXX: Don't touch this
```

---

## Implementation Plan

### Phase 1: Audit (2 hours)

```bash
# 1. Find all TODOs
grep -r "TODO\|FIXME\|XXX\|HACK" src/ --include="*.js" --include="*.jsx" > todos.txt

# 2. Read each one
# 3. Categorize: Implement / Create Issue / Delete

# Example output:
# src/utils/physics.js:45 - TODO: Validate altitude
#   → Implement (10 min)
#
# src/components/GameScene.jsx:234 - FIXME: Memoize component
#   → Create Issue #248, Priority: Medium
#
# src/utils/workshopLoader.js:12 - XXX: Rewrite this someday
#   → Delete (speculation, not actionable)
```

### Phase 2: Categorize (1 hour)

**Implement (15 TODOs):** High-impact, quick fixes
- Validation checks
- Error handling
- Safety guards

**Create Issues (8 TODOs):** Enhancements, optimizations
- Performance improvements
- Feature completeness
- Refactoring

**Delete (7 TODOs):** Abandoned, speculative, vague
- "Fix this?"
- "Make better"
- "Someday maybe"

### Phase 3: Implement & Fix (4-6 hours)

```bash
# For each "Implement" TODO:
1. Understand what it was asking
2. Implement the fix
3. Remove the TODO
4. Test the change

# For each "Create Issue" TODO:
1. Remove the TODO from code
2. Create GitHub Issue with:
   - Title
   - Description
   - Why it matters
   - Effort estimate
   - Priority
```

### Phase 4: Add ESLint Rule (30 minutes)

```bash
# Prevent new TODOs from accumulating
npm install --save-dev eslint-plugin-no-warning-comments

# Update .eslintrc.json to flag any new TODOs
```

---

## Benefits Summary

| Aspect | Before | After |
|--------|--------|-------|
| **Code clarity** | Cluttered with TODOs | Clean, no ambiguity |
| **Developer confusion** | "Is this intentional?" | Clear intent |
| **Bug prevention** | Forgotten safety checks | Implemented or tracked |
| **Onboarding** | New devs waste time on old TODOs | Clear what's done |
| **Future work** | Scattered in code | Tracked in GitHub Issues |

---

## Timeline and Effort

| Task | Duration |
|------|----------|
| Find all TODOs | 30 min |
| Audit and categorize | 1-2 hours |
| Implement quick fixes | 2-4 hours |
| Create GitHub Issues | 1 hour |
| Add ESLint rule | 30 min |
| **Total** | **5-8 hours** |

**Calendar: 1 day**

---

## Integration with Other Issues

- [Issue #6: Incomplete ESLint](ISSUE_06_INCOMPLETE_ESLINT.md) (ESLint can flag TODOs)
- [Remediation Phase 3](../INDUSTRY_STANDARDS_AUDIT.md#phase-3-polish-week-6)

---

## Recommendation

**Do this in Phase 3 (Polish):**

1. Find all TODOs: `grep -r "TODO\|FIXME\|XXX" src/`
2. Audit each one (quick mental categorization)
3. Implement important safety checks (2-4 hours)
4. Create GitHub Issues for enhancements (1 hour)
5. Delete vague/speculative TODOs (30 min)
6. Add ESLint rule to prevent future accumulation (30 min)
7. Commit "refactor: resolve stale TODOs and FIXME comments"

**Payoff:** Cleaner code, less developer confusion, no forgotten bugs.

---

**Status:** Ready for implementation  
**Blocking:** Code cleanliness  
**Effort:** 1 day  
**Payoff:** Cleaner codebase, no forgotten safety checks  
**Priority:** P3 - Low priority, do in Phase 3
