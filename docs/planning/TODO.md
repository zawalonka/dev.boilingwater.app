# Project TODO - Boiling Water App

> **Last Updated:** 2026-01-31  
> **Status:** Pre-Alpha (working prototype with zero-hardcoding substance system)
> **Completed items:** See [COMPLETED_TODOS.md](COMPLETED_TODOS.md)

---

## 🎯 IMMEDIATE: Current Sprint Tasks

### 🚨 ACCESSIBILITY OVERHAUL — CRITICAL (40-50 hours, 6-8 hours quick wins)
**Status:** NOT STARTED — High priority, blocks quality release  
**Issue:** App is completely inaccessible to keyboard and screen reader users (game unplayable)  
**See:** [ACCESSIBILITY_TODO.md](ACCESSIBILITY_TODO.md) for detailed breakdown

**Quick Wins (6-8 hours, biggest impact):**
- [ ] Form labels with `<label for="">` associations (location, altitude, substance)
- [ ] Status updates in `aria-live="polite"` regions
- [ ] Location modal converted to `<dialog>` with focus trap
- [ ] Icon buttons with `aria-label` attributes
- [ ] Color contrast fixes (4.5:1 on critical text)

**Full scope:** Phases 1-4 in dedicated TODO file (forms → keyboard navigation → semantic HTML → testing)

---

### Room Environment System - Phase 1 ✅ COMPLETE → MOVED TO COMPLETED_TODOS
**Infrastructure Complete ✅:**
- [x] `src/utils/roomEnvironment.js` - Room state management
- [x] `src/utils/acUnitHandler.js` - PID-controlled AC (now uses physics module)
- [x] `src/utils/airHandlerScrubber.js` - Auto-PID scrubber (now uses physics module)
- [x] `src/hooks/useRoomEnvironment.js` - React hook
- [x] `src/components/RoomControls.jsx` - UI panel
- [x] Per-workshop JSON files (room.json, burners/, ac-units/, air-handlers/)
- [x] Equipment selection dropdowns (reloads scene)
- [x] Progressive unlock (L1E4+ only)
- [x] Vapor release → Room composition (boiling adds vapor to air)
- [x] Heat/composition logging (data collected, scorecard not built)
- [x] Room simulation runs independently (before pot is filled)
- [x] Pressure feedback loop (room pressure affects boiling point at L1E4+)
- [x] Room pressure uses altitude via ISA model (not hardcoded sea level)

### Physics Module Refactor ✅ COMPLETE
- [x] Split physics.js into modular structure
- [x] `formulas/` - Individual named equations (10 files)
- [x] `processes/` - Orchestrators with visible stubs (4 folders)
- [x] `pidController.js` - Control algorithm for AC/equipment
- [x] `gasExchange.js` - Room air mixing physics
- [x] AC/Air handlers now use physics formulas (PID → power level → Q=mcΔT)
- [x] `calculateBoilingPointAtPressure()` for room pressure feedback

### Bug Fixes This Session ✅
- [x] Scorecard popup infinite loop - Added `hasShownBoilPopup` flag
- [x] In-game timer wrong values - Fixed `timePotOnFlame` accumulation
- [x] L1E4 defaulting to 100°C - Room pressure now uses ISA model with altitude
- [x] Location popup logic - Only triggers for L1E2 (altitude experiment)
- [x] Variable ordering - `altitude` now defined before `useRoomEnvironment`

### Test & Validate (Untested)  User added error,  parce this in to the todo next time you look it over, The burner being on does not effect room temp UNLESS the pot is over the burner.  it should act like a mini heater reagrdless of pot location or heating status?
- [ ] Test L1E1 → L1E2 → L1E3 → L1E4 progression flow
- [ ] Verify altitude persists across experiments
- [ ] Verify L1E4 room pressure matches altitude
- [ ] Test scorecard closes properly without re-triggering
- [ ] Test Level 2 dropdown (tutorial → Level 2 → verify dropdown works)
- [ ] Test element loading in-game (H, O, N and verify physics)
- [ ] Verify saltwater boiling at correct temperature (100.51°C at sea level, ~66.7°C at 10km)

---

## 🚀 BACKLOG: Planned Features

### High Priority
1. **Room Environment Phase 2: Scorecard System**
   - [ ] Create `ExperimentScorecard.jsx` component
   - [ ] "Finish Experiment" button
   - [ ] Scorecard download (CSV/JSON)
   - [ ] End-of-experiment modal
   - Note: `getExperimentData()` in hook is ready but unused

2. **Wiki: Static Knowledge Site (Build-Generated)**
   - [ ] See detailed checklist in [wiki/TODO.md](wiki/TODO.md)

3. **Pre-Boiling Evaporation ✅ COMPLETE**
   - [x] Hertz-Knudsen equation implemented (fallback only)
   - [x] **Mass transfer model (preferred)** - Fuller-Schettler-Giddings + boundary layer
   - [x] Evaporative cooling (can cool below ambient!)
   - [x] Diffusion volumes added to all 118 elements via script
   - [x] Diffusion volume sum calculated at load time (no pre-calculation)
   - [x] Accounts for room saturation (reduces net evaporation)
   - [x] Vapor added to room composition every timestep
   - [x] Room humidity now affects water evaporation rate
   - **Evaporation rates now match real-world** (~5 g/hr for water, ~28 g/hr for ethanol)
   - **Future:** Gather real weather data from location for humidity/temp
     - API source TBD (OpenWeatherMap, NOAA, etc.)
     - Would give realistic starting humidity for selected location
     - Currently uses 50% RH standard day (like ISA for atmosphere)

4. **Time Speed Sub-stepping (TODO)** AI next time you read this and we are working on the game it self,  expand this are to be more detailed.  ehh maybe we should have the entire sub stepping as a called file that is a modifier for all formulas if that can even work?
   - [ ] At high time speeds (65536x), deltaTime = 6553s/frame - need sub-stepping
   - [ ] Create separate physics utility for time-step subdivision
   - [ ] Apply to evaporation, heating, and cooling calculations

5. **Decomposition Behavior (NOT IMPLEMENTED)**
   - **Current:** Substances with `boilingPoint: null` just heat indefinitely
   - **Should:** When `temp ≥ decompositionPoint`:
     - [ ] Trigger fire/smoke visual effects
     - [ ] Release decomposition products into room (acrolein from glycerin, CO2 from sucrose)
     - [ ] Track exposure to toxic decomposition products
     - [ ] Show experiment failure modal with safety lesson
   - Affected substances: glycerin, sucrose, hydrogen-peroxide
   - Implementation:
     - [ ] Add `decompositionProducts[]` to substance JSON
     - [ ] Add `checkDecomposition()` in physics loop
     - [ ] Add decomposition visual effects to workshop effects.json

6. **Room Environment Phase 3: UI Enhancements**
   - [x] Room Controls panel (done)
   - [ ] Live heat/composition graphs
   - [x] Room alerts/warnings (done)

7. **Unit Conversion System**
   - Wire UI, add more units, update all displays

### Medium Priority
8. **Save Data & Persistence**
   - LocalStorage autosave
   - Console codes (portable)
   - File export/import

9. **Substance Documentation**
11. **Educational Annotations Coverage**
   - [ ] Add educational notes across JSON/JS/JSX/MD files so wiki can display consistent learning snippets
   - [ ] Prioritize physics formulas/processes and experiments/levels
10. **Levels/Experiments Data-Driven Migration**
   - [ ] Move levels/experiments to JSON in public assets (workshop-like)
   - [ ] Generate level/experiment dropdowns from data
   - [ ] Define ordering/metadata for custom community experiments
   - More JSDoc examples
   - Field documentation
   - Developer guides

### Low Priority (Visual)
6. **Alpha Kitchen Flame Icon Scaling**
   - Flame icon grows differently in alpha vs other workshops
   - Visual polish only

### Very Low Priority (Future/Nice-to-Have)
7. **Experiment Data Collection & AI Analysis System**
   - See [COMPLETED_TODOS.md](COMPLETED_TODOS.md) for full design notes
   - Local storage → Cloud aggregation → AI insights pipeline
   - Post-1.0 release feature

---

## 🚨 REVIEW: License Compliance

- [ ] Review all ComfyUI-related extensions, nodes, and workflows for license compatibility before use or distribution. 
    - Already checked: "Make background transparent" workflow (see master license dependency log for details and limitations).
- [ ] Update LICENSE_DEPENDENCY_LOG.md whenever a new workflow, extension, or third-party dependency is added or checked for license compatibility.

