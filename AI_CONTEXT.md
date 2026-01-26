# AI Context - Boiling Water App

> **Purpose:** Quick-start guide for AI agents working on this codebase. Read this FIRST to understand the project structure, key decisions, and where to find information.

---

## 🎯 What Is This Project?

An educational physics game teaching thermodynamics through interactive water boiling simulation. Uses **real physics equations** (Newton's Law of Cooling, specific heat capacity, etc.) — no game physics simplifications.

**Tech Stack:** React + Vite  
**Status:** Pre-Alpha (working prototype with theme system)  
**Resolution:** Fixed 1280×800px game window  
**Development OS:** Windows (PowerShell)

---

## 📚 Document Priority (Read in This Order)
System & Environment
- **OS:** Windows only (PowerShell)
- **Use PowerShell cmdlets exclusively** - NO Linux commands
  - ✅ Use: `Select-Object -First 20`, `Get-Content`, `Get-ChildItem`
  - ❌ Don't use: `head`, `tail`, `cat`, `ls`, `find`

### 
### For Any Task - Start Here
1. **`AI_CONTEXT.md`** (this file) - Overview and navigation
2. **`GOTCHAS.md`** - Known issues that cost significant debugging time
3. **`AI_CHAT_SUMMARY.md`** - Running log of prior AI sessions (read only when needed)
4. **[`docs/architecture/CODEBASE_DOCUMENTATION.md`](docs/architecture/CODEBASE_DOCUMENTATION.md)** - Complete code walkthrough with function-by-function explanations

### Task-Specific Documents

#### Theme System Work
1. **[`docs/guides/THEME_SYSTEM.md`](docs/guides/THEME_SYSTEM.md)** - Complete theme architecture (607 lines)
2. **[`docs/guides/THEME_QUICK_START.md`](docs/guides/THEME_QUICK_START.md)** - Quick guide for creating new themes
3. **`GOTCHAS.md`** → Theme validation section
4. **Files:** `src/utils/themeLoader.js`, `src/constants/themes.js`

#### Physics/Gameplay Work
1. **[`docs/architecture/WATER_STATES_ARCHITECTURE.md`](docs/architecture/WATER_STATES_ARCHITECTURE.md)** - Water state system (ice/water/steam)
2. **[`docs/architecture/CODEBASE_DOCUMENTATION.md`](docs/architecture/CODEBASE_DOCUMENTATION.md)** → Physics Engine section
3. **Files:** `src/utils/physics.js`, `src/data/fluids/*.json`

#### Architecture/Planning
1. **[`docs/planning/BoilingWater_Full_Documentation.md`](docs/planning/BoilingWater_Full_Documentation.md)** - Complete project vision
2. **[`docs/architecture/REFACTORING_SUMMARY.md`](docs/architecture/REFACTORING_SUMMARY.md)** - Major architectural decisions
3. **[`docs/planning/TODO_NEXT_SESSION.md`](docs/planning/TODO_NEXT_SESSION.md)** - Current work plan

#### Assets/Images
1. **[`docs/guides/IMAGE_OPTIMIZATION.md`](docs/guides/IMAGE_OPTIMIZATION.md)** - Asset optimization strategy
2. **`scripts/optimize-images.js`** - Image processing automation

---

## 🗂️ Codebase Structure

```
src/
├── App.jsx                      # Main app, theme management, state
├── main.jsx                     # Entry point
├── components/
│   ├── GameScene.jsx           # Core gameplay (pot dragging, heating, physics)
│   ├── KitchenScene.jsx        # Kitchen environment wrapper
│   └── Header.jsx              # Top navigation bar
├── utils/
│   ├── physics.js              # Newton's Law of Cooling, thermodynamics
│   ├── themeLoader.js          # Theme loading, validation, CSS application
│   └── fluidLoader.js          # Fluid data loading (water, ice, steam)
├── constants/
│   ├── physics.js              # Physics constants (specific heat, etc.)
│   └── themes.js               # Theme configuration metadata
├── data/
│   ├── fluids/*.json           # Fluid property data (h2o.json, water.json, etc.)
│   └── themes/README.md        # Theme directory info
└── styles/
    ├── index.css               # Global styles with CSS variables
    ├── App.css                 # App container styles
    ├── GameScene.css           # Game scene (uses --theme-* variables)
    ├── Header.css              # Header (uses --theme-* variables)
    └── KitchenScene.css        # Kitchen wrapper styles

public/assets/
├── images/                     # Game assets (optimized)
└── themes/                     # Theme JSON files and per-theme assets
    ├── alpha/                  # Alpha theme
    │   ├── theme.json
    │   ├── background.jpg      # MUST be 1280×800
    │   └── ...
    └── alpha-alt/              # Alpha-alt theme
        └── theme.json
```

---

## 🔑 Key Architectural Decisions

### 1. Fixed Game Window (1280×800px)
- Game scene is **always** 1280×800 pixels
- Prevents scaling issues and drift
- Centered in viewport, not fullscreen
- See commit `7d2bb72` - "Align game scene size to theme layout"

### 2. Theme System Architecture
- **Extensible:** Drop JSON file → new theme appears
- **Inheritance:** Themes can extend parent themes
- **CSS Variables:** Themes apply via `--theme-*` CSS custom properties
- **Per-theme assets:** Each theme can have its own images
- **Validation:** Flexible name field (can be top-level or in metadata)

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

## ⚠️ Critical Gotchas (READ BEFORE CODING)

### Theme Validation
**Issue:** Validator was too strict requiring `metadata.name`, but themes can have `name` at top level.  
**Fix:** Allow either `name` OR `metadata.name`  
**Details:** See [`GOTCHAS.md`](GOTCHAS.md) → Theme Validation section  
**Commit:** `96f1e72`

### Image Optimization
- Backgrounds: Use **JPG** (smaller file size)
- UI elements: Use **PNG** (transparency needed)
- All images preloaded to eliminate lag
- See [`docs/guides/IMAGE_OPTIMIZATION.md`](docs/guides/IMAGE_OPTIMIZATION.md)

---

## 🎨 Current Features

- ✅ Pot dragging with physics
- ✅ Water stream from faucet
- ✅ Burner controls (on/off, power adjustment)
- ✅ Real thermodynamics simulation
- ✅ Extensible theme system with dropdown switching
- ✅ Three water states (ice, water, steam) with phase changes
- ✅ Pre-Alpha badge and status display
- ✅ Image optimization and preloading

---

## 🚧 Common Tasks - Quick Reference

### Adding a New Theme
1. Create `theme.json` in `public/assets/themes/your-theme/`
2. Add background image (1280×800, JPG preferred)
3. Theme auto-discovered on app load
4. See: [`docs/guides/THEME_QUICK_START.md`](docs/guides/THEME_QUICK_START.md)

### Modifying Physics
1. Check constants in `src/constants/physics.js`
2. Edit simulation in `src/utils/physics.js` → `simulateTimeStep()`
3. Fluid properties in `src/data/fluids/*.json`

### Working with Components
- **GameScene.jsx** - Handles ALL gameplay (pot, heating, dragging)
- **App.jsx** - Theme switching, global state
- **Header.jsx** - Navigation (minimal)

### Debugging
- Console logs added in theme switching (commit `96f1e72`)
- Check browser DevTools for `--theme-*` CSS variables
- Physics simulation logs at each step

---

## 🔗 External Resources

- **Live Site:** Not deployed yet
- **Repository:** Local development only
- **Design Assets:** `assets/Discriptive pictures for AI/`

---

## 📝 Notes for AI Agents

### When Editing Code
1. **Always check GOTCHAS.md first** - Save yourself debugging time
2. **Read relevant doc file** - Don't guess at architecture
3. **Check git history** - Theme fixes are well-documented in commits
4. **Test theme switching** - Common failure point

### When You Find a New Gotcha
1. Add it to [`GOTCHAS.md`](GOTCHAS.md) immediately
2. Include commit hash, date, and WHY it was hard to spot
3. Show before/after code

### Communication Style
- **Explain before executing** - Say what you're about to do and why
- **Don't chain silently** - If using multiple git operations, explain between them
- **Show results** - Confirm what happened after execution
- **Be specific** - Name the tool/operation and what it accomplishes
- **Example:**
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

## 📌 Quick Command Reference

```bash
# Development
npm run dev              # Start dev server (Vite)
npm run build           # Production build
npm run preview         # Preview production build

# Image Optimization
node scripts/optimize-images.js

# Git
git log --oneline       # See commit history (many theme-related fixes)
```

---

## 🚨 CRITICAL DEPLOYMENT WORKFLOW

**⚠️ ALWAYS PUSH TO DEV REPO FIRST ⚠️**

### The Process (NEVER Skip Steps)

1. **Test changes locally** 
   ```bash
   npm run dev
   ```

2. **Push to dev.boilingwater.app repository** 
   - This is a **SEPARATE repository** (not a branch)
   - You must test changes in dev environment first
   - This prevents breaking production
   
3. **Test thoroughly on dev site**
   - Verify all links work
   - Test new features
   - Check for any issues
   - Dev is a full production-like environment

4. **Strategic Bug Check (BEFORE production)**
   - Review changes for edge cases
   - Check error handling
   - Verify theme switching, physics, UI
   - Look for regressions
   - Only when confident → proceed to production

5. **ONLY THEN push to main production repo**
   - Production pushes are NEVER immediate
   - Always wait for confirmation dev works
   - Production deployments are deliberate, not rushed

### Why This Matters
- Production is live to real users
- Dev is your safety testing ground
- One mistake in production can't be undone instantly
- Mistakes caught in dev never reach users

**Never bypass dev. Ever. No exceptions.**

---

## 🎯 Current Development Focus

See [`docs/planning/TODO_NEXT_SESSION.md`](docs/planning/TODO_NEXT_SESSION.md) for current work items.

Recent work: Theme system implementation and bug fixes, image optimization, game scene sizing.

---

**Last Updated:** 2026-01-25  
**Codebase Version:** Pre-Alpha  
**Primary Developer:** zawalonka
