# Project TODO - Boiling Water App

> **Last Updated:** 2026-02-02  
> **Status:** Pre-Alpha (working prototype with zero-hardcoding substance system)
> **Completed items:** See [COMPLETED_TODOS.md](COMPLETED_TODOS.md)

---

## 🔴 CRITICAL PATH (Blocks Release)

### 1. Known Physics Bugs (PRIORITY FIX)
**Status:** IN PROGRESS | **25% Complete**  
**Last Step:** Identified burner heating issue in GameScene.jsx  
**Next:** Implement room heating calculation

**Burner Heating Logic Incorrect:**
- Burner only heats room when pot is over it; should act like mini-heater regardless
- Expected: 10% of burner power dissipates to room air continuously
- [ ] Add room heating calculation (independent of pot position)

**Dependencies:** None | **Unlocks:** Realistic room temperature feedback, accurate boiling point shifts

---

### 2. Time Speed Sub-stepping (Performance Critical)
**Status:** RESEARCHING | **5% Complete**  
**Impact:** At extreme speeds (65536x), physics diverges  
**Problem:** deltaTime = 6553.6s per step at 65536x → equations break down  

**⚠️ KEY FINDING (2026-02-03): Web Worker Approach May Be Better**
- Browser `setInterval` is throttled to ~4ms minimum (250 callbacks/sec max)
- Current TIME_STEP=100ms can't be reduced for finer accuracy at 1x speed
- **Web Worker solution:** Run physics on separate CPU thread = **10,000-50,000 steps/sec** (no browser throttling)
- Physics code is already pure functions → ZERO changes needed to move to worker
- Vite has built-in worker support → minimal refactor (~1-2 hours)

**See:** [TIME_STEPPING_TODO.md](TIME_STEPPING_TODO.md) for:
- Complete physics analysis and divergence explanation
- Web Worker research findings and implementation plan
- Browser setInterval limitations and why workers solve it
- Pipeline parallelism analysis (why it doesn't work for sequential physics)

**Implementation Options:**
1. **Web Worker** (NEW - most promising): Physics on separate thread. No browser throttling. Best accuracy + performance.
2. **Speed Cap** (simplest): Limit UI to 256x. Fast, proven, avoids divergence.
3. **Sub-stepping** (robust): Divide steps. Expensive CPU but mathematically correct.
4. **Adaptive Stepping** (sophisticated): Auto-adjust step sizes. Complex.

**Implementation Tasks:**
- [ ] Research more on Web Workers (SharedArrayBuffer, message overhead, WASM option)
- [ ] Profile current physics loop execution time
- [ ] Choose approach (Worker vs Sub-stepping vs Speed Cap)
- [ ] Create `src/workers/physicsWorker.js` if choosing worker approach
- [ ] Create `src/utils/physics/timeSubstepper.js` if choosing sub-stepping
- [ ] Test at 1x, 256x, 65536x (verify no divergence)
- [ ] Profile performance impact

**Dependencies:** None | **Unlocks:** Reliable speed acceleration, finer accuracy at 1x, removes unreliability warning

---

## 🚀 HIGH PRIORITY (Content & Features)

### 3A. Component Refactoring (Week 5-7)
**Status:** IN PROGRESS | **45% Complete**
**Reference:** [docs/audit/ISSUE_03_MASSIVE_COMPONENTS.md](docs/audit/ISSUE_03_MASSIVE_COMPONENTS.md)
**Notes:** Start after state management + CI/CD + ESLint are stable. Last confirmed step before pause: hooks extracted and Pot component split.

**Definition of Done (size targets):**
- GameScene container ≤ 500 lines (orchestrator only)
- `GameSceneView` presenter ≤ 500 lines (render-only)
- New hooks ≤ 200 lines each
- New UI components ≤ 200 lines each
- No new files exceed 300 lines without written justification in this section

**Week 5: Extract hooks**
- [x] Create `useGamePhysics` hook (move physics loop + derived state)
- [x] Create `useRoomEnvironment` hook (room heat/pressure/humidity logic)
- [x] Create `usePotDragging` hook (drag/position/stream detection)
- [x] Create `useBoilingDetection` hook (boil thresholds + stats)
- [x] Create `useTimeControls` hook (timer/speed/pause)

**Week 6: Split rendering**
- [x] Create Pot component
- [x] Create Burner components (burner base, knob, flame)
- [x] Create WaterStream component
- [x] Create Effects components (steam, glow)
- [ ] Create ControlPanel components (temperature, speed, buttons)
- [x] Create LocationPopup component

**Week 7: Integrate and stabilize**
- [ ] Create `GameSceneView` presenter (render-only)
- [ ] Wire container to presenter and remove dead props
- [ ] Update imports and fix circular dependencies
- [ ] Run regression tests and validate workshop switching

---
#### CONTRACT/STATIC TEST PLAN: MATH WIRING INVARIANTS
**Goal:** Prevent silent math regressions and hardcoded values in game files. Ensure all math functions are called dynamically, with correct order and config-driven inputs. Detect new math needing coverage.

**Tasks:**
- [ ] Implement contract/static tests for GameScene.jsx, hooks, workers
- [ ] Assert all math calls use dynamic, config-driven inputs (no hardcoded values)
- [ ] Verify correct math function call order and presence for each experiment/level
- [ ] Fail if any math function is missing, replaced, or called with static values
- [ ] Detect and report new math functions needing validity tests
- [ ] Validate tests against old and new levels/experiments

**Pickup:** Resume here to extend tests as new math/physics files are added, and ensure scientific sandbox integrity.



### 3. Room Environment Phase 2: Scorecard System
**Status:** IN PROGRESS | **30% Complete**  
**Last Step:** Created RoomControls.jsx, room environment infrastructure done  
**Next:** Build ExperimentScorecard.jsx component

- [ ] Create `ExperimentScorecard.jsx` component
- [ ] "Finish Experiment" button
- [ ] Scorecard download (CSV/JSON)
- [ ] End-of-experiment modal
- [ ] **Room pressure uses location altitude** (currently hardcoded to 101325 Pa sea level)
  - File: `src/utils/roomEnvironment.js` line 456
  - Import player's selected altitude
  - Use ISA model to calculate ambient pressure
  - Effort: ~30 minutes

**Dependencies:** None | **Unlocks:** Experiment data collection, player feedback loop

---

### 4. Element Data Regeneration
**Status:** TESTING | **80% Complete**  
**Last Step:** Script tested with first 3 elements (H, He, Li) to `_regen-temp/`  
**Next:** Safety checks before production deployment  
**⚠️ Note:** Currently writing to `_regen-temp/` folder only — not yet deployed to production `periodic-table/` folder

**See:** [ELEMENT_REGENERATION_PLAN.md](ELEMENT_REGENERATION_PLAN.md) for detailed steps, validation, and phase 2 planning

---

### 5. Wiki: Static Knowledge Site
**Status:** IN PROGRESS | **50% Complete**  
**Last Step:** Wiki framework and entity generation implemented  
**Next:** See [wiki/TODO.md](../../wiki/TODO.md) for detailed checklist

**Dependencies:** None | **Unlocks:** Educational content discovery, SEO

---

### 6. Decomposition Behavior
**Status:** NOT STARTED | **0% Complete**  
**Scope:** Substances with `boilingPoint: null` (glycerin, sucrose, hydrogen-peroxide)

- [ ] When `temp ≥ decompositionPoint`: Trigger fire/smoke effects
- [ ] Release decomposition products into room (acrolein, CO2)
- [ ] Track exposure to toxic products
- [ ] Show experiment failure modal with safety lesson
- [ ] Add `decompositionProducts[]` to substance JSON

**Dependencies:** None | **Unlocks:** Realistic hazard simulation, educational safety lessons

---

### 7. Multi-Solvent Solution Support
**Status:** NOT STARTED | **0% Complete**  
**Scope:** Support non-water solvents for boiling point elevation (ethanol-based, ammonia-based solutions)

- [ ] Add solvent properties to solution JSON (`solventMolarMass`, `solventHeatOfVap`)
- [ ] Pass solvent properties to `calculateDynamicKb()` in boiling point calculation
- [ ] File: `src/utils/physics/processes/boilingPoint/calculateBoilingPoint.js` line 122
- [ ] Test with ethanol-based solution (e.g., tincture)
- [ ] Effort: ~1 hour

**Dependencies:** None | **Unlocks:** Broader solution chemistry support
**Note:** Currently all solutions are water-based (saltwater, etc.) and work correctly

---

## 📋 MEDIUM PRIORITY (Quality & Polish)

### 7. Test & Validate (Untested Features)
**Status:** NOT STARTED | **0% Complete**

- [ ] Test L1E1 → L1E2 → L1E3 → L1E4 progression flow
- [ ] Verify altitude persists across experiments
- [ ] Verify L1E4 room pressure matches altitude
- [ ] Test scorecard closes properly without re-triggering
- [ ] Test Level 2 dropdown (tutorial → Level 2)
- [ ] Test element loading in-game (H, O, N physics)
- [ ] Verify saltwater boiling at correct temperature (100.51°C sea level, ~66.7°C at 10km)

---

### 8. Room Environment Phase 3: UI Enhancements
**Status:** IN PROGRESS | **70% Complete**  
**Last Step:** Room Controls panel and alerts/warnings done  
**Next:** Live heat/composition graphs

- [x] Room Controls panel (done)
- [ ] Live heat/composition graphs
- [x] Room alerts/warnings (done)

---

### 9. Unit Conversion System
**Status:** NOT STARTED | **0% Complete**
- Wire UI, add more units, update all displays

---

### 10. Substance Documentation
**Status:** NOT STARTED | **0% Complete**
- More JSDoc examples, field documentation, developer guides

---

### 11. Save Data & Persistence
**Status:** NOT STARTED | **0% Complete**
- LocalStorage autosave, console codes (portable), file export/import

---

### 12. Educational Annotations Coverage
**Status:** PLANNING | **15% Complete**
- [ ] Add educational notes across JSON/JS/JSX/MD files for wiki display
- [ ] Prioritize physics formulas/processes and experiments/levels

---

### 13. Levels/Experiments Data-Driven Migration
**Status:** PLANNING | **0% Complete**
- [ ] Move levels/experiments to JSON in public assets (workshop-like)
- [ ] Generate level/experiment dropdowns from data
- [ ] Define ordering/metadata for custom community experiments

---

### 14. Alpha Kitchen Flame Icon Scaling
**Status:** NOT STARTED | **0% Complete**
- Flame icon grows differently in alpha vs other workshops (visual polish only)

---

## 🟡 DEFERRED (Lower Priority - Blocked by Gameplay Design)

### 15. ACCESSIBILITY OVERHAUL (Remaining Items)
**Status:** PARTIALLY COMPLETE | **35% Done**  
**Last Step:** Labels, descriptions, aria-attributes added (2026-02-01)  
**Next:** Blocked waiting for gameplay mechanics finalization

**✅ Completed:**
- Form labels with `<label htmlFor="">` associations
- `aria-describedby` on inputs, `aria-label` on buttons
- `aria-pressed` on toggles, `.sr-only` help text

**⏳ Deferred (Blocked by: Can't design keyboard shortcuts until gameplay finalized):**
- Status updates in `aria-live` regions
- Keyboard navigation (arrow keys, Enter, Escape)
- Modal `<dialog>` semantics with focus trap
- Color contrast fixes (4.5:1 standard)

**See:** [ACCESSIBILITY_TODO.md](ACCESSIBILITY_TODO.md) for full breakdown

**Resume When:** Keyboard command design finalized (e.g., W=fill pot, A=move pot left, space=toggle burner, etc.)
**Once decided:** We can implement keyboard navigation, modal focus traps, aria-live announcements

---

### 16. LOCALIZATION / INTERNATIONALIZATION (i18n)
**Status:** PLANNING | **0% Complete**  
**Target Language:** Spanish (es)  
**Dependencies:** Accessibility Phase 1 completion

**See:** [LOCALIZATION_TODO.md](LOCALIZATION_TODO.md) for architecture, implementation phases, translation workflow

**Why After Accessibility:** Better to localize once with complete, final UI string set

**Unlocks:** International audience, educational reach

---

## 🔮 VERY LOW PRIORITY (Future/Nice-to-Have)

### 17. Search Engine Optimization (SEO)
**Status:** PLANNING | **0% Complete**  
**When:** After accessibility + core features stable

- Structured data (Schema.org), meta descriptions, Open Graph tags
- Wiki optimization, image alt text, sitemap generation
- Robot.txt, Core Web Vitals, keyword research, link-building

---

### 18. Experiment Data Collection & AI Analysis System
**Status:** DESIGN COMPLETE | **5% Implementation**  
**See:** [COMPLETED_TODOS.md](COMPLETED_TODOS.md) for design notes
- Local storage → Cloud aggregation → AI insights pipeline
- Post-1.0 release feature

---

## 🚨 ONGOING: License Compliance

- [ ] Review all ComfyUI-related extensions, nodes, and workflows before use/distribution
- [ ] Update LICENSE_DEPENDENCY_LOG.md whenever new workflow/extension/dependency added
- [x] Already checked: "Make background transparent" workflow (see master log)

---

> **Completed Work:** See [COMPLETED_TODOS.md](COMPLETED_TODOS.md) for finished features and architecture decisions

