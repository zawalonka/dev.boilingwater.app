# Project TODO - Boiling Water App

> **Last Updated:** 2026-01-31  
> **Status:** Pre-Alpha (working prototype with zero-hardcoding substance system)
> **Completed items:** See [COMPLETED_TODOS.md](COMPLETED_TODOS.md)

---

## 🎯 IMMEDIATE: Current Sprint Tasks

### Room Environment System - Phase 1 ✅ COMPLETE
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

### Test & Validate (Untested)
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

2. **Room Environment Phase 3: UI Enhancements**
   - [x] Room Controls panel (done)
   - [ ] Live heat/composition graphs
   - [x] Room alerts/warnings (done)

3. **Unit Conversion System**
   - Wire UI, add more units, update all displays

### Medium Priority
4. **Save Data & Persistence**
   - LocalStorage autosave
   - Console codes (portable)
   - File export/import

5. **Substance Documentation**
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

