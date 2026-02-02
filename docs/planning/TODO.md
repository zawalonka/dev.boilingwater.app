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

## 🔬 ELEMENT DATA REGENERATION (URGENT - DATA QUALITY)

### ELEMENT DATA: Smart Regenerator Script (CHECK MODE READY)
**Status:** SCRIPTING COMPLETE - Ready for check phase  
**Goal:** Validate current element data against authoritative sources, add phase data, fix precision issues

**Key Finding:** NIST/IUPAC data currently identical (commit a3fa632 homogenized them)
- **Original (be1e37d):** NIST H=1.00794, IUPAC H=1.008 (different precision)
- **Current (all 118):** Both H=1.008 (precision lost in regeneration)
- **Issue:** Game needs SINGULAR precise atomic weights, not ranges

**Script: `scripts/regenerate-elements.js`**

**Three Modes:**
1. **CHECK MODE (default)** - No changes, validation only
   - ✅ READY: Scans all 118 files, compares against PubChem sources
   - Reports: Discrepancies, missing phase data, range values in atomic mass
   - Run: `node scripts/regenerate-elements.js`

2. **UPDATE MODE** - Incremental additions
   - TODO: Fetch ONLY new fields (phase data) from PubChem
   - Run: `node scripts/regenerate-elements.js --update`

3. **RECREATE MODE** - Full rebuild (EMERGENCY ONLY, commented out)
   - TODO: Rebuild all 118 from PubChem/NIST (rarely used)
   - Run: `node scripts/regenerate-elements.js --recreate`

**Data Sources (VERIFIED AUTHORITATIVE):**
- ✅ **PubChem (PRIMARY):** https://pubchem.ncbi.nlm.nih.gov/periodic-table/#view=list  
  - Government source: NIH National Library of Medicine
  - Individual pages: `https://pubchem.ncbi.nlm.nih.gov/element/{atomicNumber}`
  - **Full per-field source attribution with DOI links** (e.g., "Empirical Atomic Radius 60 pm - J.C. Slater [DOI:10.1063/1.1725697]")
  - Explicitly labels empirical vs calculated vs measured
  - 15+ properties per element

- ✅ **NIST (VERIFICATION):** https://physics.nist.gov/PhysRefData/Elements/per_text.html  
  - U.S. National Institute of Standards and Technology (metrology authority)
  - Atomic weights with uncertainty ranges, ionization energies, spectroscopic data
  - Critically evaluated on SI scale
  - Bibliographic references embedded per value

- ✅ **Ptable.com (SUPPLEMENTARY):** https://ptable.com  
  - Educational tool (hobby project, Michael Dayah + Eric Scerri review)
  - Good for visual trends; not primary scientific reference
  - Lacks per-value citations

**CRITICAL REQUIREMENT: Atomic Weight Precision**

The game uses atomicMass for stoichiometric calculations. **Must be singular, not range.**

**Issue to Resolve:**
- NIST publishes: Atomic weight ranges (e.g., H = 1.00782–1.00811, varies by isotope source)
- IUPAC publishes: Standard atomic weight intervals (e.g., H = 1.008, single value)
- **For game:** Must pick ONE authoritative value per element, consistent across all 118

**Per-Element Strategy:**
- [ ] For each element, examine PubChem sources (may show 3-4 different values)
- [ ] Identify which is most appropriate for game physics
- [ ] Add source selection logic (NIST vs IUPAC vs other)
- [ ] Document choice reason (e.g., "IUPAC standard weight for consistency")
- [ ] Flag elements needing manual review (e.g., radioactive elements, variable composition)

**Post-Check Validation (AFTER script runs):**
- [ ] Verify NO atomicMass values contain ± or – (ranges)
- [ ] Per-element source selection documented
- [ ] Phase data successfully added for all 118 elements
- [ ] Thermal properties (specific heat, conductivity) verified for phase data

**Implementation Steps:**

1. ✅ **Check Mode Complete** - Ready to run
   - Scans existing 118 files
   - Detects missing phase data (all 118 need it)
   - Validates against PubChem (limited by HTML parsing, needs enhancement)
   - Reports ERROR for any atomic mass with ranges

2. **Enhance HTML Parser** - Extract ALL sources
   - Improve PubChem page scraping to find all property values/sources
   - Parse table rows properly: [Value] [Source] [License/Citation]
   - NOT limited to NIST/IUPAC - capture ALL available sources

3. **Add Phase Data Structure** - Template for all 118
   - gas: { density, specificHeat, thermalConductivity, ... }
   - liquid: { density, specificHeat, latentHeatOfVaporization, ... }
   - solid: { density, specificHeat, latentHeatOfFusion, ... }
   - Source all from PubChem (e.g., liquid water from NIST WebBook)

4. **Atomic Weight Selection Logic**
   - Define per-element source priority: IUPAC > NIST > Other
   - For elements with variable composition (e.g., Cl: 35/37 isotopes), select standard value
   - For radioactive elements, note in source field
   - Validate no ranges present

5. **Run Update Mode** - Apply all changes
   - Fetch phase data from PubChem
   - Update 118 files with phase properties
   - Apply atomic weight fixes if needed
   - Add comprehensive source attribution

6. **Manual Spot-Check** - Per-element validation
   - Inspect 10-15 random elements for quality
   - Verify phase data makes sense (e.g., chlorine liquid exists at -101°C)
   - Confirm atomic mass matches expectations

7. **Commit & Document**
   - Track which elements have which sources (git commit message)
   - Update NIST/IUPAC objects with verified data
   - Remove homogenization (restore precision where justified)
   - Document date & source URLs

**Data Sources (VERIFIED):**
- [ ] **Backup existing files:** Copy `src/data/substances/periodic-table/` to `scripts/temp-data/periodic-table-backup/`
- [ ] **Regenerate all 118 files** using new scraper
- [ ] **Validate against existing:** Compare old vs new, flag major discrepancies (>5% difference in numeric values)
- [ ] **Update educational notes:** Keep existing educational notes, verify/expand with new data
- [ ] **Remove broken API script:** Delete `scripts/fetch-elements-from-api.js` (API returns 404)
- [ ] **Update generation script:** Replace hardcoded PERIODIC_TABLE array with scraper-generated data

**PubChem Data Fields (15+ per element):**
- Atomic Mass (u)
- Standard State (Gas/Solid/Liquid)
- Electron Configuration
- Oxidation States
- Electronegativity (Pauling Scale)
- Atomic Radius (van der Waals) pm
- Ionization Energy (eV)
- Electron Affinity (eV)
- Melting Point (K)
- Boiling Point (K)
- Density (g/cm³)
- Year Discovered

**NIST Data Fields:**
- Atomic Weight (with uncertainty ranges: [min, max])
- Ground-state Level
- Ground-state Configuration
- Links to spectroscopic databases

**Implementation Priority:** HIGH - Educational accuracy depends on verified sources

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

### 16. Search Engine Optimization (SEO)
**Status:** PLANNING — After accessibility + stable core features  
**Goal:** Improve discoverability, organic traffic, educational reach

**When to Tackle:** Good milestone after accessibility complete + v1.0 feature-stable

**Potential Improvements:**
- [ ] Structured data (Schema.org markup for educational content)
- [ ] Meta descriptions per page (game, wiki, experiments)
- [ ] Open Graph tags for social sharing
- [ ] Wiki page titles and H1 optimization
- [ ] Image alt text across game and wiki
- [ ] Sitemap generation (wiki + core pages)
- [ ] Robot.txt and crawl optimization
- [ ] Performance metrics (Core Web Vitals)
- [ ] Keyword research (thermodynamics education, physics simulation)
- [ ] Link-building strategy (educational content partnerships)

---

### 17. Experiment Data Collection & AI Analysis System
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

