# GitHub Copilot Instructions - PRIMARY REFERENCE FILE

> **MANDATORY:** This is the single source of truth. Read this file BEFORE any tool call, any git operation, or any code change.

---

## 🚨 HONESTY RULE (MANDATORY)

Do not claim you observed or verified something you did not actually check. If you are unsure, say so and ask for the missing detail.

---

## ⚠️ MANDATORY PRE-TOOL-CALL CHECKLIST

**Before EVERY tool execution:**
1. Read the relevant section of this file
2. Identify the required operation
3. Check if the available tool parameters match the requirement
4. If mismatch → STOP and flag the issue instead of working around it
5. Execute only if operation can be performed as documented

---

## 🎯 What Is This Project?

An educational physics game teaching thermodynamics through interactive water boiling simulation. Uses **real physics equations** (Newton's Law of Cooling, specific heat capacity, etc.) — no game physics simplifications.

**Tech Stack:** React + Vite  
**Status:** Pre-Alpha (working prototype with workshop system)  
**Resolution:** Fixed 1280×800px game window  
**Development OS:** Windows (PowerShell)

---

## 📋 SYSTEM & ENVIRONMENT

**Before starting work:**
1. **Check:** [GOTCHAS.md](../GOTCHAS.md) - Known issues that cost debugging time
2. **Read:** Task-specific docs below
3. **Run locally before commit/push:** `npm run dev` and check console for errors
4. **Test workshop switching** - Common failure point

---

## 🎨 PROJECT ESSENTIALS

- **Game window:** Fixed 1280×800px (never scale)
- **Physics:** Real equations only (Newton's Law of Cooling, etc.)
- **Physics limits:** Do **not** clamp or cap physics outputs based on Earth norms. Allow extreme values (negative altitudes, very high altitudes, space/mars scenarios) as long as the equations can compute them. Only guard against NaN/undefined inputs.
- **Workshop JSONs:** Small files (<10KB)

### ⚠️ PHYSICS REGRESSION GUARDRAILS (MANDATORY)
Before modifying ANY physics code, verify these rules:

1. **No artificial clamps without physics justification**
   - ❌ `Math.min(temperature, 100)` — arbitrary Earth-centric cap
   - ❌ `if (altitude > 10000) altitude = 10000` — arbitrary limit
   - ✅ `if (isNaN(value)) return fallback` — guards against invalid math
   - ✅ Clamp only when physics equation breaks down (document why)

2. **No static values for temperature-dependent properties**
   - ❌ `const Kb = 0.512` — static ebullioscopic constant
   - ❌ `const boilingElevation = 0.515` — pre-computed at 100°C only
   - ✅ `calculateDynamicKb(boilingTempK, solventProps)` — calculated at runtime
   - ✅ Properties that vary with T must be functions, not constants

3. **Dynamic calculation preferred over pre-computed constants**
   - ❌ Lookup tables with interpolation (loses precision at extremes)
   - ✅ Direct equation evaluation (Antoine, Clausius-Clapeyron, ISA)
   - ✅ Return metadata: `{ value, isExtrapolated, validRange }`

4. **TminC/TmaxC are empirical range markers, NOT hard limits**
   - These indicate where Antoine coefficients were experimentally verified
   - Outside this range: accuracy degrades gradually (not a cliff)
   - Return `isExtrapolated: true` but still compute the value

**If you find yourself adding a clamp or static value, STOP and ask:**
- Is there a physics equation that handles this case?
- Can I compute this dynamically instead?
- Am I limiting the scientific sandbox unnecessarily?

### 🔬 SCIENTIFIC SANDBOX PHILOSOPHY (CRITICAL)
This is a **scientific sandbox game** meant to experiment and explore limits across all conditions (cryogenic, extreme altitudes, exotic substances, etc.). 
- **NEVER decide to limit, omit, or skip data** because you think it's "not needed" or "not practical"
- **ALWAYS collect complete thermodynamic data** if it exists: Antoine coefficients, phase properties, extreme temperature behavior
- **Data philosophy:** More accurate data = better science = better game. Even if cryogenic compounds or elements only exist as liquids at extreme cold, their Antoine coefficients tell a complete story about vapor pressure behavior
- **Consequence of incompleteness:** Missing data = gaps in scientific accuracy = poor educational value
- **Action:** Get all available scientific data from NIST, IUPAC, and published sources unless genuinely unavailable

## 📁 FILE LOCATIONS & STRUCTURE
```
src/
├── App.jsx - Main app, workshop & level management, state
├── main.jsx - React entry point
├── components/
│   ├── GameScene.jsx - ALL gameplay (pot, heating, dragging, physics)
│   └── Header.jsx - Navigation (minimal)
├── utils/
│   ├── workshopLoader.js - Workshop loading, validation, CSS application
│   ├── substanceLoader.js - Substance/fluid loading (replaces fluidLoader)
│   ├── substanceParser.js - Pure parser for substance physics properties
│   ├── physics.js - Physics engine
│   ├── locationUtils.js - Location/altitude lookup
│   └── unitUtils.js - Unit conversion utilities
├── constants/
│   ├── physics.js - Physics constants (NOTE: fluid properties now loaded from JSON)
│   └── workshops.js - Workshop config, LEVELS array, EXPERIMENTS object
├── generated/
│   └── substanceCatalog.js - Auto-generated substance catalog (do not edit)
├── data/
│   └── substances/
│       ├── compounds/ (pure + solutions with phase states)
│       └── periodic-table/ (001_H_nonmetal.json through 118_Og_nonmetal.json)
└── styles/ (index.css, App.css, GameScene.css, Header.css)

public/assets/
└── workshops/ (workshop.json + effects.json per workshop)
   ├── alpha-kitchen/
   ├── level-2-placeholder/
   ├── pre-alpha-kitchen-1/
   └── pre-alpha-kitchen-2/
```

---

## 🔑 KEY ARCHITECTURAL DECISIONS

### 1. Fixed Game Window (1280×800px)
- Game scene is **always** 1280×800 pixels
- Prevents scaling issues and drift
- Centered in viewport, not fullscreen
- Commit: `7d2bb72`
### 2. Workshop System Architecture
- **Extensible:** Drop JSON file → new workshop appears
- **Inheritance:** Workshops can extend parent workshops
- **Validation:** Flexible name field (top-level or metadata.name)
### 3. Physics System
- Uses **real equations:** Newton's Law of Cooling, Q = mcΔT
- Real constants: specific heat (4.186 J/g°C), heat of vaporization (2,257 kJ/kg)
- Each state has phase-change properties

---
## ⚠️ CRITICAL GOTCHAS (READ BEFORE CODING)

### Theme Validation
- **Issue:** Theme validation was too strict (required `metadata.name`, but top-level `name` is also valid)
- **Status:** Fixed in commit `96f1e72`
- **See:** [GOTCHAS.md](../GOTCHAS.md) → Theme Validation section

### Effects Bleed Between Themes
- **Issue:** Steam/flame from one theme persist when switching to theme without effects
- **Status:** Under investigation
- **See:** [GOTCHAS.md](../GOTCHAS.md) → Effects Bleed Between Themes section

### Tutorial Completion Did Not Unlock Selectors
- **Issue:** Tutorial gating logic checked non-existent `activeLevel === 0`
- **Status:** Fixed to use `activeExperiment === 'boiling-water'`
- **See:** [GOTCHAS.md](../GOTCHAS.md) → Tutorial Completion section

### Image Optimization
- Backgrounds: Use **JPG** (smaller file size)
- UI elements: Use **PNG** (transparency needed)
- All images preloaded to eliminate lag

## 🚧 COMMON TASKS - QUICK REFERENCE

### Modifying Physics
1. Check universal constants in `src/constants/physics.js` only
2. Load substance-specific properties via `substanceLoader.js` from `src/data/substances/`
3. Review `src/utils/physics.js` for the engine implementation
4. **GameScene.jsx** - Handles ALL gameplay (pot, heating, dragging, substance selection)
5. **Header.jsx** - Navigation and view switching (minimal)

### Debugging
Check GOTCHAS.md and browser console for errors. Use `npm run dev` to see live compilation errors.

---
## 📌 QUICK COMMAND REFERENCE

```bash
# Development
npm run dev              # Start dev server (Vite)
npm run build           # Production build
npm run preview         # Preview production build

# Image Optimization
node scripts/optimize-images.js

# Git - View remotes
git remote -v

# Git - Push operations (CRITICAL - see deployment section)
git push dev main       # Push to dev.boilingwater.app
git push origin main    # Push to production
```

**Git Remotes:**
- **`dev`** = https://github.com/zawalonka/dev.boilingwater.app.git (testing)
- **`origin`** = https://github.com/zawalonka/Boilingwater.app.git (production)

### CRITICAL: Git Push Tool Requirements
**RULE:** Before ANY git push operation, check this:
- **Required operation:** Push to specific remote (dev or origin)
- **Tool `mcp_gitkraken_git_push`:** Has NO remote parameter, defaults to origin
**Explicit Commands REQUIRED:**
```bash
git push dev main       # Testing repo (ALWAYS FIRST)
```

**Tool Compatibility:**
- ❌ `mcp_gitkraken_git_push` - Cannot specify remote → defaults to origin (WRONG)
- ✅ `run_in_terminal` - Can specify explicit remote → correct operation (RIGHT)

### Every Push Must Follow This Process:

1. **Local Testing**
   - `npm run dev` and verify changes work
   - Command: `git push dev main` (use run_in_terminal)
   - Test on dev site (production-like environment)
   - Verify everything works correctly

3. **Strategic Bug Check** (REQUIRED BEFORE PRODUCTION)
   - Review changes for edge cases and regressions
   - Check error handling and UI responsiveness
   - Verify workshop switching, physics simulation, all key features
   - Only when confident should you proceed to production

4. **Only Then Push to Production**
   - Command: `git push origin main` (use run_in_terminal)
   - Production is live to real users
   - Changes cannot be undone instantly
   - This is intentionally deliberate and slow
   - Production pushes are RARE (not the default)

### Critical Rules
- ✅ Always dev first
- ✅ Always test thoroughly on dev
- ✅ Always do strategic bug check before production
- ✅ Production is ONLY after dev verification
- ✅ Use `run_in_terminal` for all git push operations
- ✅ Specify remote explicitly (dev or origin)
- ❌ Never push directly to production

### On-Demand Documentation (Load When Needed)

These docs are NOT in default context. Reference them only for specific tasks:

| Task | Document |
|------|----------|
| Workshop/theme work | [WORKSHOP_QUICK_START.md](../docs/guides/WORKSHOP_QUICK_START.md) |
| Adding substances | [SUBSTANCE_FILE_TEMPLATE.md](../docs/guides/SUBSTANCE_FILE_TEMPLATE.md) |
| Substance system | [SUBSTANCE_SYSTEM_GUIDE.md](../docs/guides/SUBSTANCE_SYSTEM_GUIDE.md) |
| Future room system | [ROOM_ENVIRONMENT_SYSTEM.md](../docs/planning/ROOM_ENVIRONMENT_SYSTEM.md) |
| Historical decisions | [COMPLETED_TODOS.md](../docs/planning/COMPLETED_TODOS.md) |

**Physics/Gameplay - Read code directly:**
- `src/utils/physics.js` - ISA model, Antoine equation, dynamic Kb
- `src/utils/substanceLoader.js` - Substance loading API
- `src/utils/substanceParser.js` - JSON to physics format

---

## 📝 BEST PRACTICES

### When Editing Code
1. **Check this file first** - Read relevant sections above
2. **Understand file context** - Look at related files to understand architecture
3. **Check git history** - Workshop fixes are well-documented in commits
4. **Run locally before commit/push** - `npm run dev` and watch console for errors
5. **Test workshop switching** - Common failure point

### When You Find a New Gotcha
1. Add it to [GOTCHAS.md](../GOTCHAS.md) immediately
2. Include commit hash, date, and WHY it was hard to spot
3. Show before/after code

### Communication Style
- **Don't chain silently** - If using multiple git operations, explain between them
- **Show results** - Confirm what happened after execution
- **Be specific** - Name the tool/operation and what it accomplishes

### Performance Notes
- Background images are large (optimized to ~200KB each)
- Workshop JSONs are small (<10KB)
- Don't read entire image files into context

---

## 🎯 CURRENT DEVELOPMENT FOCUS

See `docs/planning/TODO.md` for current work items.

Recent work: Level/experiment system refactor, location display, altitude integration, ESM configuration.

---

## 🎨 CURRENT FEATURES

- ✅ Pot dragging with physics
- ✅ Water stream from faucet
- ✅ Burner controls (on/off, power adjustment)
- ✅ Real thermodynamics simulation (Newton's Law of Cooling, Q = mcΔT)
- ✅ Multiple substance support (water, ethanol, acetone, ammonia, etc.)
- ✅ All 118 periodic table elements with educational data
- ✅ Extensible workshop system with dropdown switching (4 workshops available)
- ✅ Multiple phase states (ice, water, steam) with accurate phase transitions
- ✅ Level/experiment hierarchical system (Level 1 with 3+ experiments)
- ✅ Pre-Alpha badge and status display
- ✅ Image optimization and preloading
- ✅ Location/altitude system with worldwide search
- ✅ Effects system (steam, flame glow) - opt-in per workshop

---

**Last Updated:** 2026-01-29  
**Codebase Version:** Pre-Alpha  
**Primary Developer:** zawalonka
