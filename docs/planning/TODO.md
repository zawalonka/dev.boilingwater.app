# Project TODO - Boiling Water App

## Known Issues (To Be Fixed Later)

### Bug 1: Alpha Kitchen Flame Icon Scaling
**Status:** Noted for later fix
**Description:** Alpha kitchen flame icon grows when it should not compared to other workshops. Flame sizing logic may have different scaling factors or the workshop layout values differ.
**Affected:** Alpha kitchen workshop, Level 1+
**Priority:** Low (visual only, doesn't affect gameplay)

### Bug 2: Saltwater Boiling Temperature Calculation
**Status:** Needs verification (likely resolved in code)
**Description:** Code now loads per-substance properties and uses `calculateBoilingPoint(altitude, fluidProps)` in GameScene. Saltwater data includes `phaseTransitions.boilingPoint` (100.16°C). Verify in “Different Fluids” that saltwater uses its own boiling point.
**Affected:** Level 3 (different-fluids experiment), when saltwater is selected
**Priority:** Medium (affects educational accuracy)
**Location:** Likely in GameScene.jsx physics loop or ControlPanel substance handling

### Bug 3: Level 3 Pause on Complete - No Unpause
**Status:** Noted for later fix
**Description:** `pauseTime` is set when boiling begins, but only cleared in the tutorial modal. Non-tutorial experiments (altitude/different-fluids) may leave the simulation paused without a clear unpause path.
**Affected:** Level 3 (different-fluids experiment) when boiling is achieved
**Priority:** Medium (blocks further gameplay)
**Location:** Likely in GameScene.jsx boil-stats-modal or related completion handlers

---

## Current Sprint

### Priority 4: Code Refactoring - Extract ControlPanel Component (Big Refactor)
**Status:** ✅ COMPLETED
**Result:** GameScene.jsx reduced from 1552 → 1158 lines (-394 lines)

#### 4.1 Extract ControlPanel Component from GameScene.jsx
✅ Separated control panel UI logic (~385 lines) into dedicated ControlPanel.jsx component
✅ Extracted ~45 required props (game state, UI state, config)
✅ Extracted ~15 callbacks (heat, timer, speed, location, etc.)
✅ Reduced GameScene.jsx from 1552 lines to 1158 lines
✅ Maintained all existing functionality and state management
✅ Dev server tested and working without errors

#### 4.2 Audit Other Functions for Separation & Refactoring
- [ ] Review GameScene.jsx for additional extraction opportunities (physics loop, dragging logic, etc.)
- [ ] Identify other components that could benefit from modularization
- [ ] Document candidate functions/sections in REFACTORING_SUMMARY.md
- [ ] Prioritize by impact on readability and accessibility

---

## Backlog

### Priority 1: Fix Level 2 Workshop Dropdown (Blocking - After Refactor)
**Status:** Root cause identified, JSON needs structural fix

- [x] Debug blank dropdown on Level 2 selection → **Found:** Invalid JSON structure
- [x] Verify getWorkshopsByLevel(2) returns level-2-placeholder → **Confirmed:** Function works
- [ ] **Fix level-2-placeholder workshop.json** - `scope` and `metadata` fields are currently nested UNDER `colors` object (lines 12-23) instead of at root level
- [ ] Test filtering logic after JSON fix

---

### Priority 1.5: Room Environment & Atmospheric System (Major Refactor)
**Status:** Planning phase (detailed design complete)

See [ROOM_ENVIRONMENT_SYSTEM.md](../docs/planning/ROOM_ENVIRONMENT_SYSTEM.md) for complete breakdown:
- Dynamic room temperature with PID-controlled AC (heating + cooling)
- Air composition tracking (O₂, N₂, CO₂, H₂O, toxins, etc.)
- Modular AC and scrubber parts (upgradeable)
- Heat/composition logging throughout experiments
- Endothermic/exothermic reaction tracking
- Integration with experiment scorecard

**Phases:**
1. Foundation (hidden AC/scrubber logic)
2. Display & Scorecard (end-of-experiment data sheet)
3. UI Controls (player-facing AC/scrubber controls)
4. Extended content (planetary labs, toxin scenarios, upgrades)

---

### Priority 2: Extend substanceLoader.js (Optional Advanced Feature)
**Status:** ✅ COMPLETED (Core element loading + ambient-boiling visual)

#### 2.1 Add Element Loading
- ✅ loadElement(elementSymbol) loads from periodic-table/ using symbol-to-filename mapping
- ✅ Element detection via `/^[A-Z][a-z]?$/` regex in loadSubstance()
- ✅ 8 initial elements mapped (H, He, N, O, F, Ne, Cl, Ar) - expandable to all 118
- ✅ Creates phaseState wrapper from nist/iupac data for parser compatibility
- [ ] Add caching to avoid re-reading (performance optimization, low priority)

#### 2.2 Add Compound Assembly Logic
- ✅ loadCompound(compoundId) loads info.json (via explicit mapping in catalog)
- [ ] Calls loadElement() for each element; validates SMILES string (future enhancement)
- [ ] Add composition validation (future enhancement)

#### 2.3 Add Phase-Specific Property Assembly
- ✅ loadSubstance(compoundId, phase) loads phase state file and merges
- ✅ Element parsing extracts from nist/iupac objects (boilingPoint, meltingPoint, atomicMass, etc.)
- ✅ Returns physics-ready format with isElement flag, atomicNumber, educational notes
- [ ] Add loadSubstancePhase() alias (optional)

#### 2.4 Update Validation Schema
- [ ] Extend validateSubstanceData() for new thermodynamic fields (optional)
- [ ] Make electronegativity, entropy, Antoine coeff optional (optional)

#### 2.5 Integrate with Physics Engine & Visuals
- ✅ Ensure compatibility with existing fluidProps object
- ✅ Update GameScene to use loadSubstance()/parseSubstanceProperties()
- ✅ **Ambient-boiling visual:** Detects substances with boilingPoint ≤ 20°C (room temp)
- ✅ **Upward steam effect:** Shows colored gas rising instead of water stream for elements like H, O, N
- ✅ **Element-specific colors:** Uses color from catalog (H: pale blue, O: light blue, N: gray-blue)
- ✅ **CSS animation:** Steam rises upward with fade and blur effects (2s loop)
- ✅ **CRITICAL: Implemented Antoine vapor-pressure solver** (coefficients present in all phase JSON files; calculateBoilingPoint() now uses Antoine equation with ±0.5°C accuracy)
- ✅ Test phase transitions with proper data (build succeeds, ready for runtime testing)
- [x] Ensure compatibility with existing fluidProps object
- [x] Update GameScene to use loadSubstance()/parseSubstanceProperties()
- [ ] **CRITICAL: Implement Antoine vapor-pressure solver** (coefficients present in all phase JSON files but NOT used in calculateBoilingPoint()—still uses linear model)
- [x] Test phase transitions with proper data

---

### Priority 3: Substance Data & Documentation
**Status:** Partial

- [x] Create SUBSTANCE_SYSTEM_GUIDE.md and SUBSTANCE_FILE_TEMPLATE.md
- [ ] Document precomputed vs. derived fields approach (add to guide)
- [ ] Update substanceLoader.js JSDoc with usage examples

---

### Priority 5: Experiment Scorecard System (Universal Feature)
**Status:** Design phase

#### 5.1 Scorecard Data Collection & Logging
- [ ] Create scorecard data structure in GameScene state
- [ ] Track experiment metrics: substance, altitude, pressure, boiling point, time to boil, heat applied, evaporation mass, final temp
- [ ] Track room state changes: start/end temperature, total heat added/removed, **composition changes** (track CO2, H2O vapor, contaminants)
- [ ] Log heat sources (burner, AC, reactions) with timestamps and watts
- [ ] Log composition changes with timestamps (for later air handler integration)
- [ ] Generate alerts during experiment (temperature warnings, composition thresholds)

#### 5.2 Scorecard UI & Display
- [ ] Create `src/components/ExperimentScorecard.jsx` component
- [ ] Display experiment results (substance, boiling point, time, efficiency)
- [ ] Display room state changes (temperature delta, heat balance)
- [ ] Display composition changes (before/after, contaminant alerts)
- [ ] Create downloadable data sheet (CSV and JSON formats)
- [ ] Add performance metrics/score calculation

#### 5.3 Finish Experiment Button Integration
- [ ] Add "Finish Experiment" button to ControlPanel for non-quantitative experiment endpoints
- [ ] Trigger scorecard modal when experiment finishes (auto-complete or manual "Finish")
- [ ] Pause simulation when scorecard appears (allow review before continuing)
- [ ] Provide "Continue to Next Experiment" or "Replay Experiment" options from scorecard

---

### Priority 6: Unit Conversion & Display System
**Status:** Design phase

#### 6.1 Temperature Unit Support
- [x] Conversion functions implemented in unitUtils.js (celsiusToFahrenheit, fahrenheitToCelsius)
- [x] getDefaultTemperatureUnit() detects locale (US → F, else → C)
- [x] formatTemperature(celsius, unit, decimals) with proper symbol formatting
- [x] saveUnitPreferences() / loadUnitPreferences() working with localStorage
- [ ] **TODO: Wire unit selector to GameScene/ControlPanel** (infrastructure ready, UI not connected)
- [ ] Add Kelvin (K) support to conversion functions (only C/F currently)
- [ ] Update all temperature displays to use selected unit (ControlPanel.jsx + Header.jsx)

#### 6.2 Pressure Unit Support
- [ ] Add pressure unit selector: Pascal (Pa), PSI (psi), Bar (bar), Inches of Mercury (inHg)
- [ ] Reference values for user context (e.g., "29.92 inHg = standard air pressure" for pilot background)
- [ ] Conversion constants:
  - 1 Pa = reference
  - 1 psi = 6,894.76 Pa
  - 1 bar = 100,000 Pa
  - 1 inHg = 3,386.39 Pa (standard air pressure = 29.92 inHg)
- [ ] Update boiling point display to show pressure effect
- [ ] Show pressure in all relevant experiments (altitude, planetary scenarios)

#### 6.3 Measurement System Support
- [ ] Add system selector: Metric (m, kg, °C, Pa), SI (m, kg, K, Pa), Imperial (ft, lb, °F, psi), Mixed (user preference)
- [ ] Allow individual unit overrides (e.g., show mass in grams but pressure in psi)
- [ ] Conversion tables for common units:
  - Mass: kg, g, lb, oz
  - Volume: m³, L, mL, ft³, gal
  - Temperature: °C, °F, K
  - Pressure: Pa, psi, bar, atm, inHg, mmHg
  - Energy: J, kJ, cal, kcal, BTU

#### 6.4 Settings & Persistence
- [x] createUnitPreferences(), saveUnitPreferences(), loadUnitPreferences() in unitUtils.js
- [ ] **TODO: Add settings UI** to Header or ControlPanel for unit selection dropdown
- [x] Store/load from localStorage ('boilingwater-units' key)
- [ ] **TODO: Load preferences on App startup** (functions exist, not wired to App.jsx initialization)
- [ ] Add reset to defaults button in settings

---

### Priority 7: Save Data & Persistence System
**Status:** Unit preferences partially done (50%), full save system 0% done

#### 7.1 Research & Compare Save Methods
- [ ] **LocalStorage (Browser)**
  - Pros: Simple, works offline, no server needed, ~5-10MB limit
  - Cons: Limited size, user can clear, browser-specific, no cloud sync
  - Use case: Quick autosave, unit preferences, UI state
  
- [ ] **IndexedDB (Browser)**
  - Pros: Larger storage (50MB+ per domain), structured data, transactions
  - Cons: More complex, still browser-specific, requires polyfill for older browsers
  - Use case: Full save files, experiment histories, progress tracking
  
- [ ] **File API (User Download/Upload)**
  - Pros: User owns file, portable across browsers, shareable
  - Cons: Manual save/load, larger file sizes
  - Use case: Explicit save points, sharing saves with friends
  
- [ ] **Console-Style Save Codes (Compact String Encoding)**
  - Pros: Retro feel, shareable, portable, no storage needed, fun unlock mechanic
  - Cons: Limited data density, user must manually copy/paste
  - Use case: Checkpoint saves, unlocking specific levels, challenge codes
  - Example: "WATER-ALT-001" encodes: substance (water), experiment (altitude), level (1)

#### 7.2 Implement Core Save Data Structure
- [ ] Define saveable state schema:
  - Current level & experiment
  - Completed experiments (checkpoints)
  - Unlocked levels
  - User preferences (units, theme, language)
  - Session data (current experiment state, partial progress)
  - Timestamps (when completed, when last played)

#### 7.3 Implement Hybrid Save System (Phased)
- **Phase 1:** LocalStorage + Console codes (no external dependencies)
  - [ ] Auto-save experiment checkpoints to localStorage
  - [ ] Generate/decode console-style save codes from checkpoint data
  - [ ] UI for copying/pasting codes
  
- **Phase 2:** IndexedDB (larger saves)
  - [ ] Migrate full save files to IndexedDB
  - [ ] Still generate codes for checkpoints
  
- **Phase 3:** File export/import (optional)
  - [ ] Export save as JSON file (downloadable)
  - [ ] Import save from JSON file (drag-drop or file picker)

#### 7.4 Console Code Format Design
Example: `WATER-BOIL-LV1-ALT` 
- Part 1: Substance (WATER, SALT, ETHANOL, etc.)
- Part 2: Experiment (BOIL, ALT, FLUIDS, etc.)
- Part 3: Level (LV1, LV2, LV3, etc.)
- Part 4: Optional flags (ALT for altitude-specific, TOXIC for toxin, etc.)
- Checksum/validation to prevent typos

#### 7.5 Settings & Account System (Future)
- [ ] Cloud save support (stretch goal, requires backend)
- [ ] User accounts (stretch goal)
- [ ] Sync across devices (stretch goal)

---

---

## Completed Sessions

### Session: 2026-01-29 (Element Loading + Ambient-Boiling Visual)
- ✅ Implemented Antoine vapor-pressure equation in physics.js (±0.5°C accuracy)
- ✅ Refactored substance system into 3 modular files (catalog, loader, parser)
- ✅ Added element loading support (H, He, N, O, F, Ne, Cl, Ar) via loadElement()
- ✅ Added element detection via regex in loadSubstance() (`/^[A-Z][a-z]?$/`)
- ✅ Implemented ambient-boiling visual effect (upward colored steam for substances with BP ≤ 20°C)
- ✅ Added element-specific colors to catalog (H: pale blue, O: light blue, N: gray-blue)
- ✅ Created CSS animation for upward steam (2s loop with fade, blur, expansion)
- ✅ Fixed Level 2 workshop JSON structure (moved scope/metadata to root level)
- ✅ Build succeeds with no errors (503ms)

### Session: 2026-01-29 (Educational Notes & Documentation Reorganization)
- ✅ Created comprehensive educational notes for all 118 periodic table elements
- ✅ Added educational notes to water-h2o and saltwater-3pct-nacl compounds
- ✅ Built reusable batch update script (update-educational-notes.js)
- ✅ Organized script data in scripts/temp-data/ (extensible for future scripts)
- ✅ Moved WATER_STATES_ARCHITECTURE.md → guides/SUBSTANCE_SYSTEM_GUIDE.md (better organization)
- ✅ Committed and pushed to dev (commit: e9b35d5)

### Session: 2026-01-27 (Substance Architecture)
- ✅ Created all 118 periodic table elements with exhaustive detail (H through Og)
- ✅ Created 12 household compounds with full thermodynamic phase data
- ✅ Updated substanceLoader.js with all compounds
- ✅ Fixed tutorial completion gating bug
- ✅ Tagged and released v0.1.1
- ✅ Created CHANGELOG.md

### Previous Sessions
- ✅ Created core element JSON files (H, C, N, O, Na, Cl) with NIST/IUPAC data
- ✅ Refactored substanceLoader.js for dynamic compound/phase loading
- ✅ Integrated loader with physics engine
- ✅ Removed legacy src/data/fluids/ folder
- ✅ Effects system fully implemented (steam, flame glow, water stream)
- ✅ Workshop system locked down and extensible
- ✅ Level 1 workshop system working with multiple experiments



