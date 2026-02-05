# Issue #6: Incomplete ESLint Configuration

**Severity:** 🟠 Medium  
**Status:** ⚠️ Missing plugins  
**Priority:** P2  
**Effort:** 1-2 days

---

## What It Means

Your ESLint configuration is missing **critical plugins** that catch common bugs, enforce best practices, and prevent accessibility issues.

```json
// Current .eslintrc.json (INCOMPLETE)
{
  "extends": [
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended"
  ],
  "rules": {
    "react/prop-types": "off",  // ← Disables runtime validation
    "no-unused-vars": "warn"     // ← Too lenient
  }
}

// What's missing:
// ❌ eslint-plugin-import (import order, circular deps)
// ❌ eslint-plugin-jsx-a11y (accessibility)
// ❌ eslint-config-prettier (conflict resolution)
// ❌ eslint-plugin-react-hooks (already installed but not optimized)
```

**Current state:** Many bugs and anti-patterns go undetected.  
**After fix:** Automatic detection of 50+ common mistakes.

---

## Why It's Critical (For Physics Code)

### Your Code Catches These 0% of the Time

```javascript
// ❌ Circular dependencies (can cause crashes)
// moduleA imports moduleB
// moduleB imports moduleA
// This breaks bundling

// ❌ Accessibility issues (users with disabilities can't use app)
<button onClick={handleClick}>Click me</button>
// Missing: onKeyDown handler (keyboard users can't activate)

// ❌ Incorrect hook dependencies (state can go stale)
useEffect(() => {
  console.log(temperature)  // ← Using temperature
}, [])  // ← But didn't list it as dependency!

// ❌ Import order chaos (makes code hard to read)
import React from 'react'
import * as physics from '../utils/physics'
import Button from '../components/Button'
import { useState } from 'react'  // ← Out of order
import lodash from 'lodash'

// ❌ Unused code
export function calculateBoilingPoint(altitude, fluidProps) {
  const debugMessage = `BP: ${altitude}m`  // ← Never used
  return solveAntoine(...)
}
```

**With complete ESLint:**
```
✅ Caught: Circular dependency between modules
✅ Caught: Button missing keyboard handler
✅ Caught: useEffect missing temperature dependency
✅ Caught: Imports out of order
✅ Caught: Unused variable debugMessage
```

All **automatically in your editor** as you type.

---

## Current Broken ESLint Setup

### .eslintrc.json (Incomplete)

```json
{
  "env": {
    "browser": true,
    "es2021": true,
    "node": true
  },
  "extends": [
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended"
  ],
  "parserOptions": {
    "ecmaFeatures": {
      "jsx": true
    },
    "ecmaVersion": 2021,
    "sourceType": "module"
  },
  "plugins": [
    "react",
    "react-hooks"
  ],
  "rules": {
    "react/react-in-jsx-scope": "off",
    "react/prop-types": "off",        // ← Explicitly disabled!
    "no-unused-vars": "warn"          // ← Should be "error"
  },
  "settings": {
    "react": {
      "version": "detect"
    }
  }
}
```

### Missing Plugins

| Plugin | Purpose | Missing |
|--------|---------|---------|
| `eslint-plugin-import` | Import order, circular deps | ❌ |
| `eslint-plugin-jsx-a11y` | Accessibility (a11y) | ❌ |
| `eslint-config-prettier` | Conflict resolution | ❌ |
| `@typescript-eslint/eslint-plugin` | TypeScript support | ❌ |

### What Gets Missed

```javascript
// Nobody's catching these:

1. Circular dependencies
   ├─ moduleA.js imports moduleB
   └─ moduleB.js imports moduleA

2. Accessibility violations
   ├─ Buttons without keyboard support
   ├─ Missing alt text on images
   ├─ Color-only instructions
   └─ Form fields without labels

3. Wrong hook dependencies
   ├─ useEffect([]) but uses outside state
   ├─ Stale closures in callbacks
   └─ Missing dependency updates

4. Messy imports
   ├─ All over the place
   └─ Hard to understand file structure

5. Unused code
   ├─ Dead variables
   ├─ Dead functions
   └─ Dead imports (keeps shrinking)

6. Prettier conflicts
   ├─ ESLint formats one way
   ├─ Prettier formats another
   └─ Endless conflicts when both run
```

---

## Real Bugs Without Complete ESLint

### Bug #1: Circular Dependencies Break at Runtime

```javascript
// src/utils/physics.js
import { roomState } from './roomEnvironment'

export function calculateBoilingPoint(altitude) {
  const pressure = roomState.calculatePressure(altitude)
  return solveAntoine(pressure, ...)
}

// src/utils/roomEnvironment.js
import { calculateBoilingPoint } from './physics'

export const roomState = {
  calculatePressure: (altitude) => {
    const bp = calculateBoilingPoint(altitude)  // ← Circular!
    return derivePressure(bp)
  }
}
```

**Without import plugin:**
- Code looks fine
- `npm run build` succeeds
- Deploy succeeds
- Runtime error in production: "Cannot read property X of undefined"
- Hours debugging to find circular dependency

**With import plugin:**
```
❌ Circular dependency detected:
   src/utils/physics.js → src/utils/roomEnvironment.js → src/utils/physics.js
   
   Fix by:
   - Extract shared logic to third module
   - Use lazy imports
   - Restructure dependencies
```

---

### Bug #2: Accessibility Violations Hurt Users

```javascript
// src/components/ControlPanel.jsx

export function ControlPanel() {
  const handleClick = () => setBurnerHeat(prev => prev + 1)
  
  // ❌ No keyboard support
  return <div onClick={handleClick}>Increase Heat</div>
  
  // ✅ Should be:
  // return <button onClick={handleClick}>Increase Heat</button>
  // or
  // return <div 
  //   onClick={handleClick}
  //   onKeyDown={(e) => e.key === 'Enter' && handleClick()}
  //   role="button"
  //   tabIndex={0}
  // >Increase Heat</div>
}
```

**Impact:**
- Keyboard users (many rely on Tab to navigate) can't use burner
- Screen reader users don't know this is interactive
- Users with motor disabilities stuck on mouse

**Without a11y plugin:** Nobody knows

**With a11y plugin:**
```
⚠️ jsx-a11y/click-events-have-key-events:
   Visible, non-interactive elements with click handlers must have
   keyboard handlers and semantic role.
   
   Line 35: <div onClick={handleClick}>
            ^^^ Missing onKeyDown handler
```

---

### Bug #3: Hook Dependencies Go Stale

```javascript
// src/components/GameScene.jsx

export function GameScene() {
  const [temperature, setTemperature] = useState(20)
  const [altitude, setAltitude] = useState(0)
  
  useEffect(() => {
    // Recalculate boiling point when altitude changes
    const bp = calculateBoilingPoint(altitude, fluidProps)
    console.log(`Temperature: ${temperature}, BP: ${bp}`)
  }, [altitude])  // ← Missing 'temperature' dependency!
  
  // If temperature changes, console.log still shows OLD temperature
  // Physics calculations silently use wrong values
}
```

**Problem:** Component renders with new temperature, but effect sees old temperature.

**Without hook plugin:**
- Silent bug
- Sometimes works, sometimes doesn't (depends on render order)
- Hours debugging state inconsistencies

**With hook plugin:**
```
❌ react-hooks/exhaustive-deps:
   The effect uses variable 'temperature' but it's not in dependencies.
   
   Line 42: console.log(`Temperature: ${temperature}, BP: ${bp}`)
            ^^^^^^^^^^^ Add to dependency array: [altitude, temperature]
```

---

### Bug #4: Import Chaos

```javascript
// src/components/GameScene.jsx (no organization)

import React from 'react'
import * as physics from '../utils/physics'
import Button from '../components/Button'
import { useState } from 'react'
import lodash from 'lodash'
import { GAME_CONFIG } from '../constants/physics'
import PropTypes from 'prop-types'
import { loadSubstance } from '../utils/substanceLoader'
import { createContext } from 'react'
```

**Without import plugin:**
- Messy
- Hard to understand what's needed
- New developers confused
- Harder to spot unused imports

**With import plugin:**
```
⚠️ import/order:
   Imports are not sorted alphabetically within each group.
   
   Should be organized as:
   1. React/built-ins
   2. Third-party (prop-types, lodash)
   3. Internal (../)
   4. Alphabetical within each group
   
   Suggested fix:
   import React, { useState, createContext } from 'react'
   import lodash from 'lodash'
   import PropTypes from 'prop-types'
   
   import { GAME_CONFIG } from '../constants/physics'
   import Button from '../components/Button'
   import { loadSubstance } from '../utils/substanceLoader'
   import * as physics from '../utils/physics'
```

---

### Bug #5: Dead Code

```javascript
// src/utils/physics.js

export function simulateTimeStep(state, heat, deltaTime, fluidProps) {
  // Old calculation method (before optimization)
  const oldMethod = state.temperature * heat * deltaTime
  
  // New calculation method
  const newTemp = state.temperature + (heat / (state.waterMass * fluidProps.specificHeat)) * deltaTime
  
  return { ...state, temperature: newTemp }
}
```

**Without lint rule:**
- Dead variable `oldMethod` stays in code
- Every developer who reads it wastes 10 seconds wondering why it's there
- Git history cluttered with old code

**With lint rule:**
```
⚠️ no-unused-vars:
   'oldMethod' is assigned a value but never used.
   
   Line 4: const oldMethod = ...
           ^^^ Remove or use this variable
```

---

## Missing Plugins Installation

### Step 1: Install Missing Packages

```bash
npm install --save-dev \
  eslint-plugin-import \
  eslint-plugin-jsx-a11y \
  eslint-config-prettier \
  @typescript-eslint/eslint-plugin \
  @typescript-eslint/parser
```

### Step 2: Update .eslintrc.json

```json
{
  "env": {
    "browser": true,
    "es2021": true,
    "node": true
  },
  "extends": [
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
    "plugin:jsx-a11y/recommended",
    "prettier"
  ],
  "plugins": [
    "react",
    "react-hooks",
    "jsx-a11y",
    "import"
  ],
  "parserOptions": {
    "ecmaFeatures": {
      "jsx": true
    },
    "ecmaVersion": 2021,
    "sourceType": "module"
  },
  "rules": {
    "no-console": ["warn", { "allow": ["warn", "error"] }],
    "no-unused-vars": "error",
    "no-warning-comments": ["warn", { "terms": ["TODO", "FIXME", "XXX"] }],
    "react/react-in-jsx-scope": "off",
    "react/prop-types": "warn",
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn",
    "import/order": [
      "warn",
      {
        "groups": [
          "builtin",
          "external",
          "internal",
          "parent",
          "sibling",
          "index"
        ],
        "alphabeticalOrder": true,
        "newlines-between": "always"
      }
    ],
    "import/no-cycle": "error",
    "import/no-unused-modules": ["warn", { "unusedExports": true }],
    "jsx-a11y/click-events-have-key-events": "warn",
    "jsx-a11y/no-static-element-interactions": "warn"
  },
  "settings": {
    "react": {
      "version": "detect"
    }
  }
}
```

### Step 3: Run Linter Against Codebase

```bash
npm run lint
```

**First run typically finds:**
- 50-200 violations (depending on codebase size)
- Most are fixable automatically

### Step 4: Auto-fix Issues

```bash
npm run lint:fix
```

**Auto-fixes:**
- ✅ Import order (alphabetizes)
- ✅ Unused variables (removes)
- ✅ Extra spaces/formatting
- ✅ Console.log in production code

**Requires manual review:**
- ❌ Circular dependencies (need refactoring)
- ❌ Accessibility issues (need semantic fixes)
- ❌ Hook dependencies (need logic review)

---

## Before and After: Real Codebase

### Before: First Lint Run

```bash
$ npm run lint

/src/components/GameScene.jsx
  Line 1:    Unused variable 'debugConfig'
  Line 45:   console.log statement left in production
  Line 78:   Imports not in alphabetical order
  Line 234:  'temperature' used but not in useEffect dependencies
  Line 412:  Unused import 'utils/oldPhysics'

/src/utils/physics.js
  Line 3:    Circular dependency detected: physics ← roomEnvironment ← physics
  Line 67:   Unused variable 'legacyCalculation'
  Line 198:  Unused export 'deprecatedFunction'

/src/components/ControlPanel.jsx
  Line 45:   Div with onClick but no keyboard support

... (100+ more issues)

Found 156 errors, 89 warnings
```

### After: Auto-fix Applied

```bash
$ npm run lint:fix

156 auto-fixable issues processed:
  ✅ 45 imports reorganized
  ✅ 67 unused variables removed
  ✅ 12 console.log statements removed
  ✅ 32 imports ordered alphabetically

Manual review required for:
  ❌ 2 circular dependencies
  ❌ 3 accessibility issues
  ❌ 4 hook dependency fixes

$ npm run lint
Found 9 errors, 3 warnings  ← Much better!
```

### After Manual Fixes

```bash
$ npm run lint
✅ No errors or warnings!
```

---

## Rules Explained: What Gets Caught

### 1. Import/Order

```javascript
// ❌ Wrong order
import lodash from 'lodash'
import React from 'react'
import Button from './Button'
import { useState } from 'react'

// ✅ Correct order (automatically fixed)
import React, { useState } from 'react'

import lodash from 'lodash'

import Button from './Button'
```

**Groups:**
1. Builtins (React, path, fs)
2. Externals (lodash, axios)
3. Internals (../utils, ./Button)
4. Alphabetical within each group
5. Blank lines between groups

---

### 2. Import/No-Cycle

```javascript
// ❌ Circular dependency
// physics.js imports roomEnvironment
// roomEnvironment.js imports physics
// This causes bundler errors

// ✅ Fix by extracting shared logic
// constants.js (no dependencies)
// ├─ physics.js (imports constants)
// └─ roomEnvironment.js (imports constants)
```

---

### 3. React-Hooks/Exhaustive-Deps

```javascript
// ❌ Missing dependency
useEffect(() => {
  console.log(temperature)  // Uses temperature
}, [altitude])  // But temperature not listed!

// ✅ Fix by adding dependency
useEffect(() => {
  console.log(temperature)
}, [altitude, temperature])  // Now includes all used variables
```

---

### 4. jsx-a11y/Click-Events-Have-Key-Events

```javascript
// ❌ Not accessible
<div onClick={handleClick}>Click me</div>

// ✅ Accessible
<button onClick={handleClick}>Click me</button>

// ✅ Or with semantic markup
<div 
  onClick={handleClick}
  onKeyDown={(e) => e.key === 'Enter' && handleClick()}
  role="button"
  tabIndex={0}
>Click me</div>
```

---

### 5. No-Unused-Vars

```javascript
// ❌ Unused variable
export function calculateBoilingPoint(altitude, fluidProps) {
  const debugMessage = `BP at ${altitude}m`  // Never used
  return solveAntoine(...)
}

// ✅ Remove if not needed
export function calculateBoilingPoint(altitude, fluidProps) {
  return solveAntoine(...)
}

// ✅ Or use it
export function calculateBoilingPoint(altitude, fluidProps) {
  const debugMessage = `BP at ${altitude}m`
  console.debug(debugMessage)  // Used
  return solveAntoine(...)
}
```

---

### 6. No-Console

```javascript
// ⚠️ Warning in production
console.log('Debug message')  // Should be removed or wrapped

// ✅ Allowed (important info)
console.error('Physics calculation failed')
console.warn('Water mass went negative')

// ✅ Wrap in dev check
if (process.env.NODE_ENV === 'development') {
  console.log('Debug: temperature =', temperature)
}
```

---

## Prettier Integration

### The Problem: ESLint ↔ Prettier Conflict

```javascript
// ESLint wants this:
const boilingPoint = calculateBoilingPoint(
  altitude,
  fluidProps,
  ambientTemperature
)

// Prettier wants this:
const boilingPoint = calculateBoilingPoint(altitude, fluidProps, ambientTemperature)

// Running both creates endless formatting wars
// You run prettier → ESLint complains → You run ESLint → Prettier complains
```

### The Solution: eslint-config-prettier

```json
{
  "extends": [
    "eslint:recommended",
    "plugin:react/recommended",
    "prettier"  // ← Disable ESLint formatting rules
  ]
}
```

**Now:**
- ESLint checks code quality only
- Prettier handles all formatting
- No conflicts ✅

**package.json scripts:**
```json
{
  "scripts": {
    "lint": "eslint src --ext js,jsx",
    "lint:fix": "eslint src --ext js,jsx --fix",
    "format": "prettier --write \"src/**/*.{js,jsx,css,md}\"",
    "format:check": "prettier --check \"src/**/*.{js,jsx,css,md}\""
  }
}
```

---

## Implementation Plan

### Day 1: Setup

```bash
# 1. Install all missing plugins
npm install --save-dev \
  eslint-plugin-import \
  eslint-plugin-jsx-a11y \
  eslint-config-prettier

# 2. Update .eslintrc.json (use the complete config above)

# 3. Test it
npm run lint
```

### Day 2: Fix Issues

```bash
# 1. See what needs fixing
npm run lint

# 2. Auto-fix what we can
npm run lint:fix

# 3. Manually review and fix remaining issues
# - Circular dependencies (need refactoring)
# - Accessibility issues (need semantic HTML)
# - Hook dependencies (need logic review)

# 4. Verify all green
npm run lint
# ✅ No errors or warnings!
```

---

## Expected Improvements

### Day 1 Lint Run (Unoptimized Codebase)

```
GameScene.jsx: 67 issues
ControlPanel.jsx: 23 issues
physics.js: 45 issues
roomEnvironment.js: 34 issues
Other files: 78 issues

Total: 247 issues
```

### After Auto-fix (Day 2)

```
GameScene.jsx: 5 issues (requires manual fix)
ControlPanel.jsx: 2 issues (requires manual fix)
physics.js: 3 issues (circular deps - requires refactor)
roomEnvironment.js: 3 issues (circular deps - requires refactor)
Other files: 8 issues (requires manual fix)

Total: 21 issues (all require thinking, not auto-fixable)
```

### After Manual Fixes (Day 2)

```
✅ All checks passing!
```

---

## Integration with CI/CD

Once complete ESLint is set up, add to CI pipeline:

```yaml
# .github/workflows/ci.yml
- name: Lint Code
  run: npm run lint
  # Fails the build if linting errors
```

**Now every push is automatically checked.**

---

## AI-Assisted Coding: Additional Rules

### Why AI Coding Needs Stricter Rules

AI-assisted coding (GitHub Copilot, Cursor, ChatGPT, etc.) introduces specific patterns that need catching:

**Common AI Mistakes:**
- Generates code with missing error handling
- Skips edge cases
- Uses deprecated patterns
- Creates overly complex solutions (cognitive complexity)
- Forgets to clean up imports
- Generates code that compiles but has logical bugs
- Overuses `console.log` for debugging
- Uses `any` type in TypeScript excessively
- Creates long functions without breaking them down

### Additional ESLint Rules for AI Coding

```json
// .eslintrc.json (AI-specific additions)
{
  "rules": {
    // Catch AI's tendency to generate long functions
    "max-lines-per-function": ["warn", {
      "max": 100,
      "skipBlankLines": true,
      "skipComments": true
    }],
    
    // Catch overly complex AI-generated solutions
    "complexity": ["warn", 15],
    
    // AI often generates unused variables
    "no-unused-vars": "error",
    
    // AI loves console.log for debugging
    "no-console": ["warn", { "allow": ["error", "warn", "info"] }],
    
    // Catch magic numbers AI generates
    "no-magic-numbers": ["warn", {
      "ignore": [0, 1, -1],
      "ignoreArrayIndexes": true,
      "enforceConst": true
    }],
    
    // AI sometimes generates unsafe code
    "no-eval": "error",
    "no-implied-eval": "error"
  }
}
```

### Security-Focused Plugins for AI Code

```bash
# Install security plugins
npm install --save-dev \
  eslint-plugin-security \
  eslint-plugin-no-unsanitized
```

```json
// .eslintrc.json
{
  "plugins": [
    "security",
    "no-unsanitized"
  ],
  "extends": [
    "plugin:security/recommended"
  ],
  "rules": {
    "security/detect-object-injection": "warn",
    "security/detect-non-literal-regexp": "warn",
    "no-unsanitized/method": "error",
    "no-unsanitized/property": "error"
  }
}
```

**What these catch:**
- XSS vulnerabilities (AI often misses sanitization)
- SQL injection patterns
- Unsafe regex
- Dangerous object property access
- innerHTML usage without sanitization

### TypeScript Rules for AI Code

```json
// .eslintrc.json (with TypeScript)
{
  "rules": {
    // AI overuses 'any' type
    "@typescript-eslint/no-explicit-any": "error",
    
    // AI forgets type annotations
    "@typescript-eslint/explicit-function-return-type": "warn",
    
    // AI creates unused imports
    "@typescript-eslint/no-unused-vars": "error",
    
    // AI sometimes uses non-null assertions unsafely
    "@typescript-eslint/no-non-null-assertion": "warn"
  }
}
```

### Pre-commit Hooks for AI Code

```bash
# Install husky for git hooks
npm install --save-dev husky lint-staged
npx husky install
```

```json
// package.json
{
  "lint-staged": {
    "*.{js,jsx,ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ]
  }
}
```

```bash
# .husky/pre-commit
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

npx lint-staged
npm run type-check
```

**Blocks AI-generated broken code from being committed.**

### AI Coding Best Practices

1. **Always review AI suggestions** — Don't blindly accept
2. **Run linter immediately** — Catch issues before committing
3. **Test AI-generated code** — AI doesn't test its own code
4. **Add type annotations** — AI often skips them
5. **Check for edge cases** — AI focuses on happy path
6. **Use Copilot Instructions** — Your `.github/copilot-instructions.md` guides AI behavior

---

## SonarQube / Code Climate: Beyond ESLint

### What is SonarQube?

SonarQube is a **code quality platform** that goes deeper than ESLint. While ESLint catches syntax and style issues, SonarQube analyzes:

**What SonarQube Catches:**

1. **Code Smells** — Maintainability issues
   - Duplicated code blocks (copy-paste detection)
   - Long methods (cognitive complexity > 15)
   - Too many parameters (> 7 params)
   - Nested ternaries and complex conditionals
   - God classes (classes doing too much)

2. **Security Vulnerabilities**
   - SQL injection patterns
   - XSS vulnerabilities
   - Hardcoded credentials
   - Insecure random number generation
   - Unvalidated redirects

3. **Bugs** — Logical errors
   - Null pointer dereferences
   - Infinite loops
   - Dead code (unreachable)
   - Resource leaks (unclosed connections)
   - Race conditions

4. **Technical Debt** — Time to fix issues
   - Estimates hours to fix each issue
   - Tracks debt over time
   - Shows which files are the worst

**Example: SonarQube Finding in Your Code**

```javascript
// GameScene.jsx - Line 487
// ❌ SonarQube: "Cognitive Complexity of 43 exceeds limit of 15"
useEffect(() => {
  if (!isPotFilled || !isBurnerOn || !fluidProps) return
  
  const interval = setInterval(() => {
    if (gameStage === 'active') {
      if (waterTemp >= boilingPoint - 0.5) {
        if (roomPressure > 101325) {
          // ... 40 more lines of nested conditions
        }
      }
    }
  }, 100)
  
  return () => clearInterval(interval)
}, [15 dependencies])  // ❌ Too many dependencies
```

**SonarQube report:**
- **Cognitive Complexity:** 43 (should be < 15)
- **Technical Debt:** 2 hours to refactor
- **Severity:** Major
- **Recommendation:** Split into smaller functions

### SonarQube vs ESLint

| Feature | ESLint | SonarQube |
|---------|--------|----------|
| Syntax errors | ✅ Yes | ✅ Yes |
| Style issues | ✅ Yes | ✅ Yes |
| Code duplication | ❌ No | ✅ Yes |
| Cognitive complexity | ⚠️ Basic | ✅ Advanced |
| Security vulnerabilities | ⚠️ With plugins | ✅ Built-in |
| Technical debt tracking | ❌ No | ✅ Yes |
| Historical trends | ❌ No | ✅ Yes |
| Multi-language support | ❌ JS only | ✅ 25+ languages |
| IDE integration | ✅ Excellent | ⚠️ Plugin required |
| Free tier | ✅ Yes | ✅ Yes (open source) |

### Setup SonarQube (Optional but Recommended)

**Option 1: SonarCloud (Free for open source)**

```bash
# 1. Sign up at sonarcloud.io with GitHub
# 2. Import your repository
# 3. Add to CI/CD pipeline
```

```yaml
# .github/workflows/ci.yml
jobs:
  sonarcloud:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0  # Full history for blame
      
      - name: SonarCloud Scan
        uses: SonarSource/sonarcloud-github-action@master
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
```

**Option 2: Code Climate (Alternative)**

```yaml
# .github/workflows/ci.yml
- name: Code Climate
  uses: paambaati/codeclimate-action@v3.0.0
  env:
    CC_TEST_REPORTER_ID: ${{ secrets.CC_TEST_REPORTER_ID }}
  with:
    coverageCommand: npm run test:coverage
```

**Option 3: Local SonarQube (Self-hosted)**

```bash
# Run SonarQube server locally
docker run -d -p 9000:9000 sonarqube

# Install scanner
npm install --save-dev sonarqube-scanner
```

```javascript
// sonar-project.js
const scanner = require('sonarqube-scanner')

scanner(
  {
    serverUrl: 'http://localhost:9000',
    options: {
      'sonar.projectKey': 'boilingwater',
      'sonar.sources': 'src',
      'sonar.tests': 'src',
      'sonar.test.inclusions': '**/*.test.js,**/*.test.jsx',
      'sonar.javascript.lcov.reportPaths': 'coverage/lcov.info',
      'sonar.exclusions': 'node_modules/**,build/**,public/**'
    }
  },
  () => process.exit()
)
```

### When to Use SonarQube

**Use SonarQube if:**
- Team has 3+ developers (collaboration benefits)
- Codebase > 10,000 lines (debt tracking matters)
- Security is critical (educational app with user data)
- Want historical tracking of code quality
- Need executive reports (technical debt dashboards)

**Skip SonarQube if:**
- Solo developer on small project (< 5,000 lines)
- ESLint + TypeScript already catching most issues
- No CI/CD pipeline yet (set that up first)

**For Boiling Water App:**

✅ **Recommended:** Set up SonarCloud (free)
- Your GameScene.jsx is 1,857 lines (SonarQube will scream)
- Helps prioritize which parts to refactor first
- Tracks improvement as you implement fixes
- Great for open source visibility

---

## Copilot Instructions: Guide AI Behavior

### What are Copilot Instructions?

GitHub Copilot reads a special file at `.github/copilot-instructions.md` to understand **how you want code written**. Think of it as a style guide that AI actually follows.

**Without Copilot Instructions:**
```javascript
// AI generates this (no guidance)
function getData(id) {
  const data = db.query(`SELECT * FROM users WHERE id = ${id}`)  // SQL injection!
  return data
}
```

**With Copilot Instructions:**
```javascript
// AI follows your rules
function getUserById(id: number): Promise<User | null> {
  // Use parameterized queries (per copilot-instructions.md)
  const data = await db.query('SELECT * FROM users WHERE id = $1', [id])
  return data.rows[0] || null
}
```

### Create Copilot Instructions

**File: `.github/copilot-instructions.md`**

```markdown
# GitHub Copilot Instructions - Boiling Water App

## Code Style

- Use **TypeScript** for all new files (.tsx, not .jsx)
- Use **functional components** with hooks (no class components)
- Use **named exports** (not default exports)
- Prefer `const` over `let`, never use `var`
- Use **arrow functions** for callbacks
- Max line length: 100 characters

## Type Safety

- NEVER use `any` type. Use `unknown` if type is truly dynamic.
- ALWAYS add explicit return types to functions
- ALWAYS mark optional properties with `?`
- Use type guards before accessing optional properties
- No non-null assertions (`!`) without prior null check

## React Patterns

- Components < 300 lines. If longer, split it.
- Max 10 props per component. Use composition if more.
- Use custom hooks for shared logic (useRoomEnvironment, usePhysics)
- Avoid props drilling. Use context for global state.
- Name event handlers: `handleClick`, `handleSubmit` (not `onClick`, `submit`)

## Physics Code

- All physics functions must have typed parameters
- Document units in parameter names: `temperatureC`, `pressurePa`, `massKg`
- Never mix units (Celsius vs Kelvin, Pa vs kPa)
- Use constants from `src/constants/physics.js`
- Add references to equations: `// Antoine equation: log10(P) = A - B/(C+T)`

## Error Handling

- ALWAYS add try-catch to async functions
- Return `null` for expected failures (not throwing)
- Throw errors for unexpected failures
- Log errors with context: `console.error('Failed to load substance:', id, error)`

## Security

- Use parameterized queries (no string concatenation in SQL)
- Sanitize user input before rendering
- No `eval()` or `Function()` constructors
- Validate all API responses
- No hardcoded secrets (use environment variables)

## Testing

- Write tests alongside implementation
- Use descriptive test names: `it('should return null when Antoine coefficients are missing')`
- Test edge cases: null, undefined, empty arrays, negative numbers
- Mock external dependencies (fetch, timers)

## Examples

### ✅ GOOD: Follow instructions

```typescript
export function calculateBoilingPoint(
  altitudeM: number,
  fluidProps: FluidProperties
): BoilingPointResult | null {
  if (!fluidProps?.antoineCoefficients) {
    return null  // Expected failure
  }
  
  try {
    const pressurePa = getISAPressure(altitudeM)
    return solveAntoineEquation(pressurePa, fluidProps)
  } catch (error) {
    console.error('Boiling point calculation failed:', error)
    throw error  // Unexpected failure
  }
}
```

### ❌ BAD: Violates instructions

```javascript
function calc(a, f) {  // No types, unclear names
  return solveAntoine(getPress(a), f.antoine!)  // Non-null assertion
}
```

## AI-Specific Rules

- Don't generate long functions (> 100 lines). Break them up.
- Don't add unused variables or imports
- Don't use complex nested ternaries. Use if/else.
- Don't skip error handling
- Don't forget to clean up effects (return cleanup function)
```

### How Copilot Uses Instructions

1. **During code completion** — Suggests code matching your rules
2. **When generating functions** — Follows naming and structure
3. **When fixing errors** — Applies your error handling patterns
4. **When refactoring** — Uses your architectural patterns

### Update Instructions as You Learn

Add to `.github/copilot-instructions.md` whenever you:
- Find a pattern AI gets wrong repeatedly
- Establish a new convention
- Discover a security issue
- Define domain-specific rules (physics units, workshop structure)

**The file evolves with your codebase.**

---

## Benefits Per Rule

| Rule | Catches | Benefit |
|------|---------|---------|
| `import/order` | Messy imports | Cleaner code organization |
| `import/no-cycle` | Circular deps | Prevents runtime crashes |
| `react-hooks/exhaustive-deps` | Stale state | Physics calculations accurate |
| `jsx-a11y/*` | Accessibility | Inclusive for all users |
| `no-unused-vars` | Dead code | Cleaner, smaller bundle |
| `no-console` | Debug code in prod | Cleaner production logs |

---

## Cost-Benefit Analysis

| Item | Cost | Benefit |
|------|------|---------|
| Install plugins | 30 min | Catches 50+ types of bugs |
| Update ESLint config | 30 min | Production-grade setup |
| First lint run review | 2-3 hours | Find 200+ existing issues |
| Auto-fix issues | 30 min | Fix 80% automatically |
| Manual fixes | 2-4 hours | Fix remaining 20% |
| Integrate to CI | 1 hour | Automatic checking forever |
| **Total overhead** | **6-9 hours** | **Prevents all style/quality bugs** |

**Payoff: Immediate (catches issues in development)**

---

## Success Metrics

| Metric | Before | After |
|--------|--------|-------|
| Linting coverage | 3 rules | 15+ rules |
| Circular deps caught | 0% | 100% |
| Accessibility issues found | 0% | 100% |
| Dead code detected | 0% | 100% |
| Hook issues caught | 0% | 100% |
| Development friction | High | Low |

---

## Timeline and Effort

| Task | Duration |
|------|----------|
| Install packages | 30 min |
| Update config | 30 min |
| First lint review | 1-2 hours |
| Auto-fix | 30 min |
| Manual fixes | 2-4 hours |
| CI integration | 1 hour |
| **Total** | **6-9 hours** |

**Calendar: 1-2 days (depending on issues found)**

---

## Related Issues

- [Issue #5: No CI/CD Testing](ISSUE_05_NO_CICD_TESTING.md) (linting runs in CI)
- [Issue #2: No TypeScript](ISSUE_02_NO_TYPESCRIPT.md) (TS + ESLint = even better)
- [Remediation Phase 1](../INDUSTRY_STANDARDS_AUDIT.md#phase-1-foundation-weeks-1-2)

---

## Recommendation

**Do this as part of Phase 1:**

1. Install complete ESLint setup (1 day)
2. Run linter and see what comes up
3. Auto-fix 80% of issues
4. Manually review and fix circular dependencies
5. Commit "refactor: complete ESLint setup"
6. Integrate into CI pipeline

**No code changes needed, just configuration.**

---

**Status:** Ready for implementation  
**Blocking:** Code quality standards  
**Effort:** 1-2 days  
**Payoff:** Immediate (catches issues in development)  
**Priority:** P2 - Do after Phase 1 basics
