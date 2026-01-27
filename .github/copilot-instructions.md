# GitHub Copilot Instructions - PRIMARY REFERENCE FILE

> **MANDATORY:** This is the single source of truth. Read this file BEFORE any tool call, any git operation, or any code change.

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
**Status:** Pre-Alpha (working prototype with theme system)  
**Resolution:** Fixed 1280×800px game window  
**Development OS:** Windows (PowerShell)

---

## 📋 SYSTEM & ENVIRONMENT

- **OS:** Windows (PowerShell only)
- **Use PowerShell cmdlets exclusively** - NO Linux commands
  - ✅ Use: `Select-Object -First 20`, `Get-Content`, `Get-ChildItem`
  - ❌ Don't use: `head`, `tail`, `cat`, `ls`, `find`

---

## 🚀 BEFORE ANY WORK

1. **Check:** [`GOTCHAS.md`](../GOTCHAS.md) - Known issues that cost debugging time
2. **Read:** Task-specific docs below
3. **Run locally before commit/push:** `npm run dev` and check console for errors
4. **Test theme switching** - Common failure point

---

## 🎨 PROJECT ESSENTIALS

- **Game window:** Fixed 1280×800px (never scale)
- **Physics:** Real equations only (Newton's Law of Cooling, etc.)
- **Game scene:** ALWAYS 1280×800px
- **Theme backgrounds:** MUST be 1280×800
- **Physics constants:** No game physics, real-world values only
- **Theme name:** Can be top-level OR in metadata.name (both valid)

---

## 📁 FILE LOCATIONS & STRUCTURE

**Core Components:**
- `src/components/GameScene.jsx` - Main gameplay (pot dragging, heating, physics)
- `src/components/Header.jsx` - Top navigation bar
- `src/components/KitchenScene.jsx` - Kitchen environment wrapper
- `src/App.jsx` - Main app, theme management, state

**Physics & Simulation:**
- `src/utils/physics.js` - Newton's Law of Cooling, thermodynamics
- `src/constants/physics.js` - Physics constants (specific heat, etc.)
- `src/data/fluids/*.json` - Fluid property data (h2o.json, water.json, ice.json, steam.json)

**Theme System:**
- `src/utils/themeLoader.js` - Theme loading, validation, CSS application
- `src/constants/themes.js` - Theme configuration metadata
- `public/assets/workshops/*/` - Theme JSON files and per-theme assets
  - Each theme must have `theme.json`
  - Each theme must have `background.jpg` (1280×800 pixels, JPG preferred)

**Styling:**
- `src/styles/index.css` - Global styles with CSS variables
- `src/styles/GameScene.css` - Game scene (uses --theme-* variables)

**Full structure:**
```
src/
├── App.jsx, main.jsx
├── components/ (GameScene, Header, KitchenScene)
├── utils/ (physics.js, themeLoader.js, substanceLoader.js)
├── constants/ (physics.js, themes.js)
├── data/fluids/ (h2o.json, water.json, ice.json, steam.json)
└── styles/ (index.css, App.css, GameScene.css, Header.css, KitchenScene.css)

public/assets/
├── images/
└── themes/ (theme.json + background.jpg per theme)
```

---

## 🔑 KEY ARCHITECTURAL DECISIONS

### 1. Fixed Game Window (1280×800px)
- Game scene is **always** 1280×800 pixels
- Prevents scaling issues and drift
- Centered in viewport, not fullscreen
- Commit: `7d2bb72`

### 2. Theme System Architecture
- **Extensible:** Drop JSON file → new theme appears
- **Inheritance:** Themes can extend parent themes
- **CSS Variables:** Themes apply via `--theme-*` CSS custom properties
- **Per-theme assets:** Each theme can have its own images
- **Validation:** Flexible name field (top-level or metadata.name)

### 3. Physics System
- Uses **real equations:** Newton's Law of Cooling, Q = mcΔT
- Real constants: specific heat (4.186 J/g°C), heat of vaporization (2,257 kJ/kg)
- Fluid properties loaded from JSON data files
- Simulation runs at 100ms intervals when heating is active

### 4. Fluid System
- Cross-referenced JSON structure (h2o.json → water.json, ice.json, steam.json)
- Each state has phase-change properties
- Extensible to other fluids in the future

---

## ⚠️ CRITICAL GOTCHAS (READ BEFORE CODING)

See [`GOTCHAS.md`](../GOTCHAS.md) for complete list. Key issues:

### Theme Validation
- **Issue:** Validator was too strict requiring `metadata.name`
- **Fix:** Allow either `name` OR `metadata.name`
- **Commit:** `96f1e72`

### Theme Effects Bleed
- **Issue:** Steam/flame from one theme persist when switching to theme without effects
- **Status:** Under investigation
- **See:** GOTCHAS.md → Effects Bleed Between Themes section

### Image Optimization
- Backgrounds: Use **JPG** (smaller file size)
- UI elements: Use **PNG** (transparency needed)
- All images preloaded to eliminate lag

---

## 🚧 COMMON TASKS - QUICK REFERENCE

### Adding a New Theme
1. Create `theme.json` in `public/assets/workshops/your-theme/`
2. Add background image (1280×800, JPG preferred)
3. Theme auto-discovered on app load
4. See: `docs/guides/THEME_QUICK_START.md`

### Modifying Physics
1. Check constants in `src/constants/physics.js`
2. Edit simulation in `src/utils/physics.js` → `simulateTimeStep()`
3. Fluid properties in `src/data/fluids/*.json`

### Working with Components
- **GameScene.jsx** - Handles ALL gameplay (pot, heating, dragging)
- **App.jsx** - Theme switching, global state
- **Header.jsx** - Navigation (minimal)

### Debugging
- Console logs for theme switching (commit `96f1e72`)
- Check browser DevTools for `--theme-*` CSS variables
- Physics simulation logs at each step

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
git push origin main    # Push to production (ONLY after dev verification)
```

---

## 🚨 CRITICAL DEPLOYMENT WORKFLOW

**⚠️ ALWAYS PUSH TO DEV FIRST - NEVER SKIP THIS ⚠️**

### Git Remotes (Already Configured)
- **`dev`** = https://github.com/zawalonka/dev.boilingwater.app.git (testing)
- **`origin`** = https://github.com/zawalonka/Boilingwater.app.git (production)

### CRITICAL: Git Push Tool Requirements
**RULE:** Before ANY git push operation, check this:
- **Required operation:** Push to specific remote (dev or origin)
- **Tool `mcp_gitkraken_git_push`:** Has NO remote parameter, defaults to origin
- **Action:** Use `run_in_terminal` ONLY for git push operations

**Explicit Commands REQUIRED:**
```bash
git push dev main       # Testing repo (ALWAYS FIRST)
git push origin main    # Production (ONLY after dev verification)
```

**Tool Compatibility:**
- ❌ `mcp_gitkraken_git_push` - Cannot specify remote → defaults to origin (WRONG)
- ✅ `run_in_terminal` - Can specify explicit remote → correct operation (RIGHT)

### Every Push Must Follow This Process:

1. **Local Testing**
   - `npm run dev` and verify changes work

2. **Push to dev.boilingwater.app** (SEPARATE REPO)
   - Command: `git push dev main` (use run_in_terminal)
   - Test on dev site (production-like environment)
   - Verify everything works correctly

3. **Strategic Bug Check** (REQUIRED BEFORE PRODUCTION)
   - Review changes for edge cases and regressions
   - Check error handling and UI responsiveness
   - Verify theme switching, physics simulation, all key features
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
- ❌ Never skip dev testing
- ❌ Never use mcp_gitkraken_git_push for push operations
- ❌ Never rush to production

**This applies to EVERYTHING: code, docs, assets, config. No exceptions.**

---

## 📚 DOCUMENT REFERENCE

### Task-Specific Documents

**Theme System Work:**
- `docs/guides/THEME_SYSTEM.md` - Complete theme architecture
- `docs/guides/THEME_QUICK_START.md` - Quick guide for creating new themes
- `GOTCHAS.md` → Theme validation section

**Physics/Gameplay Work:**
- `docs/architecture/WATER_STATES_ARCHITECTURE.md` - Water state system (ice/water/steam)
- `docs/architecture/CODEBASE_DOCUMENTATION.md` → Physics Engine section
- `src/utils/physics.js`, `src/data/fluids/*.json`

**Architecture/Planning:**
- `docs/planning/BoilingWater_Full_Documentation.md` - Complete project vision
- `docs/architecture/REFACTORING_SUMMARY.md` - Major architectural decisions
- `docs/planning/TODO.md` - Current work plan

**Assets/Images:**
- `docs/guides/IMAGE_OPTIMIZATION.md` - Asset optimization strategy
- `scripts/optimize-images.js` - Image processing automation

**Debugging:**
- `GOTCHAS.md` - Known issues and solutions (READ FIRST when debugging)
- `AI_CHAT_SUMMARY.md` - Running log of prior AI sessions (reference only)

---

## 📝 NOTES FOR AI AGENTS

### When Editing Code
1. **Always check GOTCHAS.md first** - Save yourself debugging time
2. **Read relevant doc file** - Don't guess at architecture
3. **Check git history** - Theme fixes are well-documented in commits
4. **Test theme switching** - Common failure point
5. **Run locally before commit/push** - `npm run dev` and watch console for errors

### When You Find a New Gotcha
1. Add it to `GOTCHAS.md` immediately
2. Include commit hash, date, and WHY it was hard to spot
3. Show before/after code

### Communication Style
- **Explain before executing** - Say what you're about to do and why
- **Don't chain silently** - If using multiple git operations, explain between them
- **Show results** - Confirm what happened after execution
- **Be specific** - Name the tool/operation and what it accomplishes

**Example:**
```
First, I'll stage the updated files...
[git add operation]

Now I'll commit with a message explaining the changes...
[git commit operation]

✅ Committed: [summary of what went in]
```

### File Size Awareness
- Background images are large (optimized to ~200KB each)
- Theme JSONs are small (<10KB)
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
- ✅ Real thermodynamics simulation
- ✅ Extensible theme system with dropdown switching
- ✅ Three water states (ice, water, steam) with phase changes
- ✅ Pre-Alpha badge and status display
- ✅ Image optimization and preloading
- ✅ Location/altitude system with worldwide search
- ✅ Level/experiment hierarchical system

---

**Last Updated:** 2026-01-26  
**Codebase Version:** Pre-Alpha  
**Primary Developer:** zawalonka
