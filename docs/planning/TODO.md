# Project TODO - Boiling Water App

> **Last Updated:** 2026-02-01  
> **Status:** Pre-Alpha (working prototype with zero-hardcoding substance system)
> **Completed items:** See [COMPLETED_TODOS.md](COMPLETED_TODOS.md)

---

## 🚨 CRITICAL PATH (Blocks Release)

### 1. ACCESSIBILITY OVERHAUL (40-50 hours, 6-8 hours quick wins)
**Status:** NOT STARTED — Blocks quality release  
**Issue:** App completely inaccessible to keyboard and screen reader users (game unplayable)  
**See:** [ACCESSIBILITY_TODO.md](ACCESSIBILITY_TODO.md) for detailed breakdown

**Quick Wins (6-8 hours, biggest impact):**
- [ ] Form labels with `<label for="">` associations (location, altitude, substance)
- [ ] Status updates in `aria-live="polite"` regions
- [ ] Location modal converted to `<dialog>` with focus trap
- [ ] Icon buttons with `aria-label` attributes
- [ ] Color contrast fixes (4.5:1 on critical text)

**Full scope:** Phases 1-4 in dedicated TODO file (forms → keyboard navigation → semantic HTML → testing)

**Dependencies:** None - can start immediately  
**Unlocks:** Localization (needs final UI strings), quality release

---

## ⚡ HIGH PRIORITY (Post-Accessibility)

### 2. LOCALIZATION / INTERNATIONALIZATION (i18n)
**Status:** PLANNING — Depends on accessibility completion  
**Goal:** Drop-in localization files for multi-language support (Spanish first)

**Why After Accessibility:**
- Accessibility will ADD new strings (aria-labels, keyboard hints, screen reader text)
- Better to localize once with complete string set

**Key Decisions:**
- [ ] **File structure:** Single JSON per language (start) vs. split by section (if >500 keys)
- [ ] **File location:** `public/locales/{lang}.json` (recommended for drop-in extensibility)

**Implementation Tasks:**
- [ ] Create localization architecture doc (file format, key naming conventions)
- [ ] Add language picker to Header.jsx (game title bar)
- [ ] Add language picker to wiki header
- [ ] Create base English localization file (`public/locales/en.json`)
- [ ] Create Spanish localization template (`public/locales/es.json`)
- [ ] Implement `useLocalization()` hook or context provider
- [ ] Replace hardcoded strings with localization keys
- [ ] Add locale persistence (localStorage)
- [ ] Document translation workflow for contributors

**Scope:** Game UI, wiki content, substance descriptions, errors/alerts, experiment instructions

**Dependencies:** Accessibility Phase 1 (complete UI strings)  
**Unlocks:** International audience, educational reach

---

### 3. Known Physics Bugs (PRIORITY FIX)

**Burner Heating Logic Incorrect:**
- **Issue:** Burner only heats room when pot is over it; should act like mini-heater regardless
- **Expected:** 10% of burner power dissipates to room air continuously when powered
- **Files:** `src/components/GameScene.jsx`, `src/utils/physics.js`
- [ ] Add room heating calculation (independent of pot position)

**Dependencies:** None  
**Unlocks:** Realistic room temperature feedback, accurate boiling point shifts

---

### 4. Time Speed Sub-stepping (Performance Critical)

**Problem:** At extreme speeds (65536x), deltaTime = 6553s per frame → physics diverges

**Solution:**
- [ ] Create `src/utils/physics/timeSubstepper.js` — Subdivision utility
- [ ] Export `withSubstepping(formula, maxSubsteps, threshold)` — Higher-order function wrapper
- [ ] Apply to: heating, cooling, evaporation, pressure feedback
- [ ] Test at 1x (imperceptible), 256x (stable), 65536x (no divergence)

**Dependencies:** None  
**Unlocks:** Reliable speed acceleration, removes unreliability warning

---

## 🚀 HIGH PRIORITY (Content & Features)

### 5. Room Environment Phase 2: Scorecard System
- [ ] Create `ExperimentScorecard.jsx` component
- [ ] "Finish Experiment" button
- [ ] Scorecard download (CSV/JSON)
- [ ] End-of-experiment modal
- Note: `getExperimentData()` ready but unused

**Dependencies:** None (infrastructure complete)  
**Unlocks:** Experiment data collection, player feedback loop

---

### 6. Wiki: Static Knowledge Site (Build-Generated)
- [ ] See detailed checklist in [wiki/TODO.md](../../wiki/TODO.md)

**Dependencies:** None  
**Unlocks:** Educational content discovery, SEO

---

### 7. Decomposition Behavior (NOT IMPLEMENTED)
- **Current:** Substances with `boilingPoint: null` heat indefinitely
- **Should:** When `temp ≥ decompositionPoint`:
  - [ ] Trigger fire/smoke visual effects
  - [ ] Release decomposition products into room (acrolein, CO2)
  - [ ] Track exposure to toxic products
  - [ ] Show experiment failure modal with safety lesson
- Affected: glycerin, sucrose, hydrogen-peroxide
- [ ] Add `decompositionProducts[]` to substance JSON
- [ ] Add `checkDecomposition()` in physics loop
- [ ] Add decomposition visual effects to workshop effects.json

**Dependencies:** None  
**Unlocks:** Realistic hazard simulation, educational safety lessons

---

## 📋 MEDIUM PRIORITY (Quality & Polish)

### 8. Test & Validate (Untested Features)
- [ ] Test L1E1 → L1E2 → L1E3 → L1E4 progression flow
- [ ] Verify altitude persists across experiments
- [ ] Verify L1E4 room pressure matches altitude
- [ ] Test scorecard closes properly without re-triggering
- [ ] Test Level 2 dropdown (tutorial → Level 2 → verify dropdown works)
- [ ] Test element loading in-game (H, O, N and verify physics)
- [ ] Verify saltwater boiling at correct temperature (100.51°C at sea level, ~66.7°C at 10km)

---

### 9. Room Environment Phase 3: UI Enhancements
- [x] Room Controls panel (done)
- [ ] Live heat/composition graphs
- [x] Room alerts/warnings (done)

---

### 10. Unit Conversion System
- Wire UI, add more units, update all displays

---

### 11. Save Data & Persistence
- LocalStorage autosave
- Console codes (portable)
- File export/import

---

### 12. Substance Documentation
- More JSDoc examples
- Field documentation
- Developer guides

---

### 13. Educational Annotations Coverage
- [ ] Add educational notes across JSON/JS/JSX/MD files for wiki display
- [ ] Prioritize physics formulas/processes and experiments/levels

---

### 14. Levels/Experiments Data-Driven Migration
- [ ] Move levels/experiments to JSON in public assets (workshop-like)
- [ ] Generate level/experiment dropdowns from data
- [ ] Define ordering/metadata for custom community experiments

---

## 🎨 LOW PRIORITY (Visual Polish)

### 15. Alpha Kitchen Flame Icon Scaling
- Flame icon grows differently in alpha vs other workshops
- Visual polish only

---

## 🔮 VERY LOW PRIORITY (Future/Nice-to-Have)

### 16. Experiment Data Collection & AI Analysis System
- See [COMPLETED_TODOS.md](COMPLETED_TODOS.md) for full design notes
- Local storage → Cloud aggregation → AI insights pipeline
- Post-1.0 release feature

---

## 🚨 ONGOING: License Compliance

- [ ] Review all ComfyUI-related extensions, nodes, and workflows before use/distribution
- [ ] Update LICENSE_DEPENDENCY_LOG.md whenever new workflow/extension/dependency added
- Already checked: "Make background transparent" workflow (see master log)

---

## ✅ RECENTLY COMPLETED (This Session)

**Room Environment System - Phase 1:**
- [x] Room state management, PID controller, air handler
- [x] Per-workshop equipment JSON
- [x] Progressive unlock (L1E4+)
- [x] Vapor release → room composition
- [x] Pressure feedback loop
- See [COMPLETED_TODOS.md](COMPLETED_TODOS.md) for full details

**Physics Module Refactor:**
- [x] Split physics.js into modular structure (formulas/, processes/)
- [x] PID controller, gas exchange model
- [x] Dynamic boiling point with room pressure feedback

**Bug Fixes:**
- [x] Scorecard popup infinite loop
- [x] In-game timer wrong values
- [x] L1E4 defaulting to 100°C
- [x] Location popup logic
- [x] Variable ordering issues

