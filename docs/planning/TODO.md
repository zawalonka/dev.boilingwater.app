# Project TODO - Boiling Water App

## Current Sprint

### Priority 4: Code Refactoring - Extract ControlPanel Component (Big Refactor)
**Status:** Pre-work checkpoint committed
**Why now:** GameScene.jsx is 1552 lines (unwieldy). Better to refactor while stable before adding Level 2 features.

#### 4.1 Extract ControlPanel Component from GameScene.jsx
- [ ] Separate control panel UI logic (~400 lines) into dedicated ControlPanel.jsx component
- [ ] Identify and extract ~20 required props (temperature, status, controls, callbacks)
- [ ] Reduce GameScene.jsx from 1552 lines to ~1150 lines
- [ ] Maintain all existing functionality and state management

#### 4.2 Audit Other Functions for Separation & Refactoring
- [ ] Review GameScene.jsx for additional extraction opportunities (physics loop, dragging logic, etc.)
- [ ] Identify other components that could benefit from modularization
- [ ] Document candidate functions/sections in REFACTORING_SUMMARY.md
- [ ] Prioritize by impact on readability and accessibility

---

## Backlog

### Priority 1: Fix Level 2 Workshop Dropdown (Blocking - After Refactor)
**Status:** Not started

- [ ] Debug blank dropdown on Level 2 selection
- [ ] Verify getWorkshopsByLevel(2) returns level-2-placeholder
- [ ] Test filtering logic and cache behavior

---

### Priority 2: Extend substanceLoader.js (Optional Advanced Feature)
**Status:** Design phase

#### 2.1 Add Element Loading (Future Enhancement)
- [ ] loadElement(elementId) loads from periodic-table/{elementId}.json
- [ ] Add caching to avoid re-reading

#### 2.2 Add Compound Assembly Logic
- [ ] loadCompound(compoundId) loads info.json + resolves composition
- [ ] Calls loadElement() for each element; validates SMILES string
- [ ] Add composition validation

#### 2.3 Add Phase-Specific Property Assembly
- [ ] loadSubstancePhase(compoundId, phase) loads phase state file
- [ ] Calls loadCompound() + merges phase-specific props
- [ ] Returns combined object for physics engine

#### 2.4 Update Validation Schema
- [ ] Extend validateSubstanceData() for new thermodynamic fields
- [ ] Make electronegativity, entropy, Antoine coeff optional

#### 2.5 Integrate with Physics Engine
- [ ] Ensure compatibility with existing fluidProps object
- [ ] Add Antoine vapor-pressure calculation (phase 2)
- [ ] Update GameScene to use loadSubstancePhase() API
- [ ] Test phase transitions with proper data

---

### Priority 3: Substance Data & Documentation
**Status:** Design phase

- [ ] Create SUBSTANCE_STRUCTURE.md guide (how to add elements, compounds, mixtures)
- [ ] Document precomputed vs. derived fields approach
- [ ] Update substanceLoader.js JSDoc with usage examples

---

### Priority 4: Code Refactoring & Readability (Future Sprint)
**Status:** Not started

#### 4.1 Extract ControlPanel Component from GameScene.jsx
- [ ] Separate control panel UI logic (~400 lines) into dedicated ControlPanel.jsx component
- [ ] Identify and extract ~20 required props (temperature, status, controls, callbacks)
- [ ] Reduce GameScene.jsx from 1552 lines to ~1150 lines
- [ ] Maintain all existing functionality and state management
- [ ] **Priority:** Lower (nice-to-have, not blocking gameplay)

#### 4.2 Audit Other Functions for Separation & Refactoring
- [ ] Review GameScene.jsx for additional extraction opportunities (physics loop, dragging logic, etc.)
- [ ] Identify other components that could benefit from modularization
- [ ] Document candidate functions/sections in REFACTORING_SUMMARY.md
- [ ] Prioritize by impact on readability and accessibility
- [ ] **Priority:** Lower (ongoing improvement)

---

## Completed Sessions

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



