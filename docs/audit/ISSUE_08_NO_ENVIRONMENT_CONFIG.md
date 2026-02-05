# Issue #8: No Environment Configuration

**Severity:** 🟠 Medium  
**Status:** ⚠️ Hardcoded values everywhere  
**Priority:** P2  
**Effort:** 2-3 days

---

## What It Means

Your app has **hardcoded values** scattered throughout the codebase instead of environment-based configuration. Different behavior is needed for:

- **Development:** Verbose logging, hot reload, local API calls
- **Staging:** Minimal logging, test data, staging API
- **Production:** No logging, real data, production API

```javascript
// Current state: Hardcoded
const API_URL = 'https://boilingwater.app/api'  // ← Always production
const DEBUG_MODE = false  // ← Always off
const LOG_LEVEL = 'warn'  // ← Always minimal logging

if (process.env.NODE_ENV === 'development') {
  // Hard to manage — logic scattered across files
  console.log('Development mode')
}

// After fix: Environment-based
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api'
const DEBUG_MODE = process.env.REACT_APP_DEBUG === 'true'
const LOG_LEVEL = process.env.REACT_APP_LOG_LEVEL || 'info'
```

**Current state:** Hardcoded values, impossible to run development/staging differently.  
**After fix:** Environment files control all behavior.

---

## Why It's Critical

### 1. Can't Develop Safely

```javascript
// src/utils/workshopLoader.js
export async function loadWorkshop(id) {
  const response = await fetch('https://boilingwater.app/api/workshops/' + id)
  return response.json()
}

// Problem: Developing locally tries to hit production API
// - Need to use http://localhost:3000/api during development
// - But code is hardcoded to production URL

// Current workaround:
// ❌ Edit code before testing: fetch('http://localhost:3000/api/...')
// ❌ Remember to change back: fetch('https://boilingwater.app/api/...')
// ❌ Accidentally commit development URL
// ❌ Break production
```

### 2. Data Leaks Between Environments

```javascript
// src/components/GameScene.jsx
const WORKSHOP_ENDPOINT = 'https://boilingwater.app/api/workshops'

// During development on your local machine
const workshop = await fetch(WORKSHOP_ENDPOINT + '/alpha')
// ↓ Uses production database
// ↓ Your local testing changes production data
// ↓ Real users see your broken experiments

// Meanwhile on staging server
// Also hitting production database
// Staging tests overwrite production data
// Chaos ensues
```

### 3. Can't Log Differently per Environment

```javascript
// src/utils/physics.js
export function simulateTimeStep(state, heat, deltaTime, fluidProps) {
  // Hardcoded: always minimal logging
  const newTemp = state.temperature + (heat / state.waterMass) * deltaTime
  // No way to get detailed logs for debugging
  
  return { ...state, temperature: newTemp }
}

// In production: Need minimal logs (performance)
// In development: Need verbose logs (debugging)
// In staging: Need moderate logs (testing)

// But code is hardcoded to one level
// Can't diagnose staging issues without redeploying with different logging
```

### 4. Secrets in Source Code

```javascript
// src/utils/auth.js
const API_KEY = 'sk-1234567890abcdef'  // ← In GitHub!
const DATABASE_URL = 'postgres://user:password@db.prod.com'  // ← Exposed!

// Anyone with GitHub access has production secrets
// Cannot rotate secrets without code change + redeploy
// Security audit fails immediately
```

---

## Real Bugs Without Environment Config

### Bug #1: Development Overwrites Production Data

```javascript
// src/utils/workshopLoader.js
const WORKSHOP_API = 'https://boilingwater.app/api/workshops'

export async function loadWorkshop(id) {
  return fetch(WORKSHOP_API + '/' + id).then(r => r.json())
}

// Your machine, local development
npm run dev
// Code still hits: https://boilingwater.app/api/workshops/alpha
// But with your changes (broken physics, incomplete styling)
// Production users see your broken experiment
```

**Timeline:**
- 10:00 AM: You start developing locally
- 10:05 AM: Make changes to physics
- 10:10 AM: Run `npm run dev` to test
- 10:11 AM: Your broken physics is fetched into production workshop
- 10:30 AM: User reports: "Boiling point calculation is wrong!"
- 11:00 AM: Investigation finds your dev changes in production

**Root cause:** Hardcoded API URL, no dev/prod separation.

---

### Bug #2: Staging Secrets Leak to GitHub

```javascript
// src/config.js (checked into GitHub)
const CONFIG = {
  api: 'https://boilingwater.app/api',
  database: 'postgres://prod_user:MyPassword123@prod-db.com',
  sessionSecret: 'super-secret-key-12345',
  apiKey: 'sk_live_1234567890abcdef'
}

export default CONFIG

// Later that day...
// Security audit: "All production secrets are in GitHub!"
// Secrets have to be rotated
// All services need updating
// Emergency incident
```

**Prevention:**
```javascript
// .env (never committed)
REACT_APP_API_URL=https://boilingwater.app/api
REACT_APP_DATABASE_URL=postgres://prod_user:***@prod-db.com
REACT_APP_SESSION_SECRET=***
REACT_APP_API_KEY=***

// src/config.js (safe)
const CONFIG = {
  api: process.env.REACT_APP_API_URL,
  database: process.env.REACT_APP_DATABASE_URL,
  sessionSecret: process.env.REACT_APP_SESSION_SECRET,
  apiKey: process.env.REACT_APP_API_KEY
}
```

---

### Bug #3: Can't Debug Production Issues

```javascript
// src/utils/physics.js
export function calculateBoilingPoint(altitude, fluidProps) {
  // Hardcoded: no logging
  const pressure = calculatePressureISA(altitude)
  const bp = solveAntoine(pressure, fluidProps)
  
  return bp
}

// Production bug report:
// "Boiling point is wrong at 5000m altitude"
// 
// Investigation:
// ❌ Can't add logging (no environment config)
// ❌ Can't increase verbosity (code hardcoded to minimal)
// ❌ Have to reproduce locally (not possible with hardcoded prod URL)
// ❌ Deploy debug version to prod (risky)
// ❌ Remove debug code later (error-prone)

// Timeline: 3+ hours debugging
```

**With environment config:**
```javascript
const LOG_LEVEL = process.env.REACT_APP_LOG_LEVEL || 'info'

export function calculateBoilingPoint(altitude, fluidProps) {
  if (LOG_LEVEL === 'debug') {
    console.log('BP calculation:', { altitude, fluidProps })
  }
  
  const pressure = calculatePressureISA(altitude)
  const bp = solveAntoine(pressure, fluidProps)
  
  if (LOG_LEVEL === 'debug') {
    console.log('Result:', { pressure, bp })
  }
  
  return bp
}

// Set in CI/CD:
// REACT_APP_LOG_LEVEL=debug npm run build

// Deploy debug version, get logs, fix issue
// Timeline: 30 min debugging
```

---

### Bug #4: Can't Test Staging Without Affecting Production

```javascript
// src/components/ControlPanel.jsx
const WORKSHOP_API = 'https://boilingwater.app/api'

// Staging server code is identical to production code
// Both hit the same API endpoint
// Both write to the same database

// QA runs tests on staging:
// 1. Create test workshop
// 2. Run boiling simulation
// 3. Verify results
// 4. Delete test workshop

// But while QA tests, production users see:
// - Test workshops appearing and disappearing
// - Inconsistent data
// - Confusion

// And production database is being modified by staging tests
```

**With environment config:**
```bash
# .env.staging
REACT_APP_API_URL=https://staging.boilingwater.app/api

# .env.production
REACT_APP_API_URL=https://boilingwater.app/api

# Now staging and production use separate databases
# QA can test freely without affecting users
```

---

### Bug #5: New Developer Can't Get Started

```javascript
// New developer clones repo
// Runs: npm install && npm run dev

// But the code has:
const API_URL = 'https://boilingwater.app/api'  // ← Production!

// npm run dev
// Browser hits production API
// Developer's test data pollutes production

// Or worse:
const API_KEY = 'sk_live_abcd1234'  // ← Hardcoded secret

// Developer can now access production
// "How do I set up development?"
// No .env.example file
// No documentation
// Months of onboarding friction

// Or someone adds their local API URL as a comment:
const API_URL = 'https://boilingwater.app/api'  // 'http://localhost:3000/api' for local
// ← Confusing, error-prone
```

---

## Current State: No Configuration

### Missing Files

```
.env              ← MISSING (local development)
.env.local        ← MISSING (machine-specific)
.env.staging      ← MISSING (staging environment)
.env.production   ← MISSING (production environment)
.env.example      ← MISSING (template for developers)
.env.test         ← MISSING (testing environment)
```

### Hardcoded Values Scattered Throughout

```javascript
// src/App.jsx
const WORKSHOP_API = 'https://boilingwater.app/api'  // ← Hardcoded

// src/utils/workshopLoader.js
const WORKSHOP_ENDPOINT = 'https://boilingwater.app/api/workshops'  // ← Hardcoded

// src/components/GameScene.jsx
const DEBUG_MODE = false  // ← Hardcoded

// src/utils/physics.js
const LOG_LEVEL = 'warn'  // ← Hardcoded

// src/config.js (if it exists)
export const CONFIG = {
  apiUrl: 'https://boilingwater.app/api',  // ← Hardcoded
  debugMode: false,  // ← Hardcoded
  logLevel: 'warn'  // ← Hardcoded
}
```

### No Central Configuration

- ❌ No single source of truth for settings
- ❌ Same value hardcoded in multiple files
- ❌ Changing a value means updating 5+ locations
- ❌ Easy to miss one and cause bugs
- ❌ No environment differentiation

---

## Solution: Environment Configuration

### 1. Create .env Files

```bash
# .env.example (CHECKED IN to GitHub, no secrets)
REACT_APP_API_URL=http://localhost:3000/api
REACT_APP_DEBUG=false
REACT_APP_LOG_LEVEL=info

# .env.local (LOCAL DEVELOPMENT, NOT CHECKED IN)
REACT_APP_API_URL=http://localhost:3000/api
REACT_APP_DEBUG=true
REACT_APP_LOG_LEVEL=debug

# .env.staging (STAGING ENVIRONMENT, NOT CHECKED IN)
REACT_APP_API_URL=https://staging.boilingwater.app/api
REACT_APP_DEBUG=false
REACT_APP_LOG_LEVEL=info

# .env.production (PRODUCTION, SET IN CI/CD)
# (Not usually a file, set in GitHub Actions secrets)
```

### 2. Create Central Config Module

```javascript
// src/config.js
const CONFIG = {
  api: {
    url: process.env.REACT_APP_API_URL || 'http://localhost:3000/api'
  },
  debug: {
    enabled: process.env.REACT_APP_DEBUG === 'true',
    logLevel: process.env.REACT_APP_LOG_LEVEL || 'info'
  },
  app: {
    version: process.env.REACT_APP_VERSION || '0.1.0',
    environment: process.env.NODE_ENV || 'development'
  }
}

// Validate required variables
if (!CONFIG.api.url) {
  throw new Error('REACT_APP_API_URL is required')
}

export default CONFIG
```

### 3. Use Config in Components

```javascript
// src/components/GameScene.jsx
import CONFIG from '../config'

export function GameScene() {
  const loadWorkshop = async (id) => {
    const response = await fetch(`${CONFIG.api.url}/workshops/${id}`)
    return response.json()
  }
  
  if (CONFIG.debug.enabled) {
    console.log('GameScene loaded')
  }
}
```

### 4. Update package.json Scripts

```json
{
  "scripts": {
    "dev": "vite",
    "dev:staging": "NODE_ENV=staging vite",
    "build": "vite build",
    "build:staging": "REACT_APP_ENV=staging vite build",
    "build:production": "REACT_APP_ENV=production vite build",
    "preview": "vite preview"
  }
}
```

### 5. Update .gitignore

```gitignore
# Environment files (never commit secrets!)
.env.local
.env.*.local
.env.development.local
.env.staging
.env.production

# But DO commit template
!.env.example
```

---

## Implementation Steps

### Step 1: Create .env Files (15 minutes)

```bash
# .env.example (template, safe to commit)
REACT_APP_API_URL=http://localhost:3000/api
REACT_APP_DEBUG=false
REACT_APP_LOG_LEVEL=info
REACT_APP_VERSION=0.1.0

# .env.local (development, DO NOT COMMIT)
REACT_APP_API_URL=http://localhost:3000/api
REACT_APP_DEBUG=true
REACT_APP_LOG_LEVEL=debug
REACT_APP_VERSION=0.1.0

# .env.staging (for staging deploys)
REACT_APP_API_URL=https://staging.boilingwater.app/api
REACT_APP_DEBUG=false
REACT_APP_LOG_LEVEL=info
REACT_APP_VERSION=0.1.0
```

### Step 2: Create config.js (20 minutes)

```javascript
// src/config.js
const CONFIG = {
  api: {
    url: process.env.REACT_APP_API_URL || 'http://localhost:3000/api'
  },
  debug: {
    enabled: process.env.REACT_APP_DEBUG === 'true',
    logLevel: process.env.REACT_APP_LOG_LEVEL || 'info'
  },
  app: {
    version: process.env.REACT_APP_VERSION || '0.1.0',
    environment: process.env.NODE_ENV || 'development'
  }
}

if (CONFIG.debug.enabled) {
  console.log('Configuration:', CONFIG)
}

export default CONFIG
```

### Step 3: Create Logger Utility (20 minutes)

```javascript
// src/utils/logger.js
import CONFIG from '../config'

const logger = {
  debug: (msg, data) => {
    if (CONFIG.debug.logLevel === 'debug') {
      console.log(`[DEBUG] ${msg}`, data)
    }
  },
  info: (msg, data) => {
    if (['debug', 'info'].includes(CONFIG.debug.logLevel)) {
      console.log(`[INFO] ${msg}`, data)
    }
  },
  warn: (msg, data) => {
    if (['debug', 'info', 'warn'].includes(CONFIG.debug.logLevel)) {
      console.warn(`[WARN] ${msg}`, data)
    }
  },
  error: (msg, data) => {
    console.error(`[ERROR] ${msg}`, data)
  }
}

export default logger
```

### Step 4: Replace Hardcoded Values (2-3 hours)

```javascript
// Before: src/utils/workshopLoader.js
const WORKSHOP_API = 'https://boilingwater.app/api'

// After:
import CONFIG from '../config'
const WORKSHOP_API = CONFIG.api.url
```

**Find and replace all hardcoded:**
- API URLs → `CONFIG.api.url`
- Debug checks → `CONFIG.debug.enabled`
- Log levels → `CONFIG.debug.logLevel`

### Step 5: Update CI/CD (30 minutes)

```yaml
# .github/workflows/ci.yml
- name: Build (Development)
  if: github.ref == 'refs/heads/main' && github.event_name == 'push'
  env:
    REACT_APP_API_URL: http://localhost:3000/api
    REACT_APP_DEBUG: true
  run: npm run build

- name: Build (Staging)
  if: github.ref == 'refs/heads/staging'
  env:
    REACT_APP_API_URL: https://staging.boilingwater.app/api
    REACT_APP_DEBUG: false
  run: npm run build:staging

- name: Build (Production)
  if: github.ref == 'refs/heads/main' && github.event_name == 'release'
  env:
    REACT_APP_API_URL: https://boilingwater.app/api
    REACT_APP_DEBUG: false
  run: npm run build:production
```

### Step 6: Testing (1-2 hours)

```bash
# Test different environments
npm run dev
# Should use .env.local (debug=true)

npm run build
# Should use .env or defaults

REACT_APP_API_URL=https://staging.boilingwater.app/api npm run build
# Should use staging URL
```

---

## Configuration Reference

### Standard Variables

```bash
# API Configuration
REACT_APP_API_URL=http://localhost:3000/api

# Debug/Logging
REACT_APP_DEBUG=true|false
REACT_APP_LOG_LEVEL=debug|info|warn|error

# Application
REACT_APP_VERSION=0.1.0
REACT_APP_ENV=development|staging|production

# Feature Flags (optional)
REACT_APP_FEATURE_ROOM_CONTROLS=true
REACT_APP_FEATURE_ANALYTICS=false

# Analytics (optional)
REACT_APP_ANALYTICS_ID=UA-xxxxx
REACT_APP_ANALYTICS_ENABLED=true|false
```

### How Vite Loads Environment Variables

```javascript
// Only variables prefixed with REACT_APP_ are available
REACT_APP_API_URL=...   // ✅ Available in code
VITE_API_KEY=...         // ✅ Available in code (Vite style)
SECRET_KEY=...           // ❌ NOT available (no prefix)

// Access in code:
process.env.REACT_APP_API_URL  // ✅ Works
process.env.VITE_API_KEY       // ✅ Works (in Vite)
process.env.SECRET_KEY         // ❌ undefined
```

---

## Before and After

### Before: Hardcoded Chaos

```javascript
// 5 different files with same value
// src/App.jsx
const API = 'https://boilingwater.app/api'

// src/utils/workshopLoader.js
const ENDPOINT = 'https://boilingwater.app/api'

// src/components/ControlPanel.jsx
const BASE_URL = 'https://boilingwater.app/api'

// src/utils/physics.js
const DEBUG = false

// src/config.js
export const DEBUG_MODE = false

// To change a value: Update 5 files ❌
// To run staging: Edit all 5 files ❌
// Risk of error: Very high ❌
```

### After: Single Source of Truth

```javascript
// src/config.js
const CONFIG = {
  api: {
    url: process.env.REACT_APP_API_URL || 'http://localhost:3000/api'
  },
  debug: {
    enabled: process.env.REACT_APP_DEBUG === 'true'
  }
}

// Every file imports from config
// src/App.jsx
import CONFIG from '../config'
const API = CONFIG.api.url

// src/utils/workshopLoader.js
import CONFIG from '../config'
const ENDPOINT = CONFIG.api.url

// To change a value: Edit .env ✅
// To run staging: Change .env.staging ✅
// Risk of error: Very low ✅
```

---

## Integration with CI/CD

### Development

```bash
# .env.local (on your machine)
REACT_APP_API_URL=http://localhost:3000/api
REACT_APP_DEBUG=true

npm run dev
# Runs with local API, debug enabled
```

### Staging Deployment

```bash
# GitHub Actions reads from .env.staging
# Or secrets set in GitHub UI

env:
  REACT_APP_API_URL: https://staging.boilingwater.app/api
  REACT_APP_DEBUG: false

npm run build:staging
# Builds with staging API, debug off
# Deployed to staging.boilingwater.app
```

### Production Deployment

```bash
# GitHub Secrets (set in repo settings)
# Never in .env files!

env:
  REACT_APP_API_URL: ${{ secrets.PROD_API_URL }}
  REACT_APP_DEBUG: false

npm run build:production
# Builds with production API
# Deployed to boilingwater.app
```

---

## Security Best Practices

### ✅ DO: Environment Variables for Secrets

```javascript
// .env.local (NOT committed)
REACT_APP_API_KEY=sk_live_abc123

// src/config.js
export const API_KEY = process.env.REACT_APP_API_KEY
```

### ❌ DON'T: Hardcode Secrets

```javascript
// DON'T DO THIS
const API_KEY = 'sk_live_abc123'  // ← In GitHub!
```

### ✅ DO: Use .env.example Template

```bash
# .env.example (safe, committed)
REACT_APP_API_KEY=your-key-here
REACT_APP_DATABASE_URL=your-database-url

# .env.local (secret, NOT committed)
REACT_APP_API_KEY=sk_live_abc123
REACT_APP_DATABASE_URL=postgres://...
```

### ✅ DO: Validate Required Variables

```javascript
// src/config.js
const required = ['REACT_APP_API_URL']
const missing = required.filter(v => !process.env[v])

if (missing.length > 0) {
  throw new Error(`Missing required env vars: ${missing.join(', ')}`)
}
```

---

## Testing Configuration

### Testing Environments

```javascript
// src/config.test.js
import CONFIG from './config'

describe('Configuration', () => {
  beforeEach(() => {
    delete process.env.REACT_APP_API_URL
    delete process.env.REACT_APP_DEBUG
  })
  
  it('uses default API URL', () => {
    expect(CONFIG.api.url).toBe('http://localhost:3000/api')
  })
  
  it('reads debug from env', () => {
    process.env.REACT_APP_DEBUG = 'true'
    // Re-import config to pick up new env
    expect(CONFIG.debug.enabled).toBe(true)
  })
})
```

---

## Onboarding New Developers

### Without Environment Config

```
New developer clones repo
Runs: npm install && npm run dev
Gets: Production API calls from code
Result: Development overwrites production data
Or: Hardcoded secrets leaked in code
Debugging: "Why isn't it working?"
```

### With Environment Config

```bash
# New developer clones repo
git clone https://github.com/yourrepo/boiling-water.git
cd boiling-water

# Copy template
cp .env.example .env.local

# Install and run
npm install
npm run dev

# Automatically uses local API
# No secrets exposed
# Clean onboarding
```

---

## Migration Checklist

```bash
# Phase 1: Setup
✅ Create .env.example
✅ Create .env.local
✅ Create .env.staging
✅ Update .gitignore

# Phase 2: Configuration Module
✅ Create src/config.js
✅ Create src/utils/logger.js
✅ Validate required variables

# Phase 3: Replace Hardcoded Values
✅ Find all hardcoded API URLs
✅ Replace with CONFIG.api.url
✅ Find all hardcoded debug checks
✅ Replace with CONFIG.debug.enabled
✅ Find all hardcoded log levels
✅ Replace with CONFIG.debug.logLevel

# Phase 4: CI/CD Integration
✅ Update GitHub Actions workflows
✅ Set environment variables in CI
✅ Test build with different env vars

# Phase 5: Documentation
✅ Add setup instructions to README
✅ Document environment variables
✅ Add .env.example comments

# Phase 6: Testing
✅ Test local development
✅ Test staging deployment
✅ Test production deployment
```

---

## Benefits Summary

| Aspect | Before | After |
|--------|--------|-------|
| **Development isolation** | Hits production | Hits localhost |
| **Data safety** | Staging overwrites prod | Separate databases |
| **Secret management** | Hardcoded in code | Environment variables |
| **Debugging** | No logging | Configurable logging |
| **Onboarding** | Confusing | One-step setup |
| **CI/CD integration** | Manual env changes | Automatic |
| **Flexibility** | Hardcoded | Configurable |

---

## Timeline and Effort

| Task | Duration |
|------|----------|
| Create .env files | 20 min |
| Create config.js | 20 min |
| Create logger utility | 20 min |
| Replace hardcoded values | 2-3 hours |
| Update CI/CD | 30 min |
| Testing and validation | 1-2 hours |
| Documentation | 30 min |
| **Total** | **5-7 hours** |

**Calendar: 1-2 days**

---

## Integration with Other Issues

- [Issue #5: No CI/CD Testing](ISSUE_05_NO_CICD_TESTING.md) (CI/CD uses environment variables)
- [Issue #6: Incomplete ESLint](ISSUE_06_INCOMPLETE_ESLINT.md) (Linting can check .env files)
- [Remediation Phase 2](../INDUSTRY_STANDARDS_AUDIT.md#phase-2-architecture-weeks-3-5)

---

## Recommendation

**Do this in Phase 2 (alongside architecture refactoring):**

1. Create .env files and .gitignore update (20 min)
2. Create config.js module (20 min)
3. Replace hardcoded values systematically (2-3 hours)
4. Update CI/CD configuration (30 min)
5. Test all environments (1-2 hours)
6. Commit "feat: environment-based configuration"

**Immediate benefits:**
- Development no longer pollutes production
- Staging can be tested safely
- New developers can get started in minutes
- Secrets are no longer in code

---

**Status:** Ready for implementation  
**Blocking:** Deployment safety and secret management  
**Effort:** 1-2 days  
**Payoff:** Safe development/staging/production separation, no more hardcoded values  
**Priority:** P2 - Do in Phase 2 (after core refactoring)
