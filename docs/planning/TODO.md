# Project TODO - Boiling Water App

> **Last Updated:** 2026-01-31  
> **Status:** Pre-Alpha (working prototype with zero-hardcoding substance system)
> **Completed items:** See [COMPLETED_TODOS.md](COMPLETED_TODOS.md)

---

## 🎯 IMMEDIATE: Current Sprint Tasks

### Room Environment System - Phase 1 (In Progress)
**Infrastructure Complete ✅:**
- [x] `src/utils/roomEnvironment.js` - Room state management
- [x] `src/utils/acUnitHandler.js` - PID-controlled AC
- [x] `src/utils/airHandlerScrubber.js` - Auto-PID scrubber
- [x] `src/hooks/useRoomEnvironment.js` - React hook
- [x] `src/components/RoomControls.jsx` - UI panel
- [x] Per-workshop JSON files (room.json, burners/, ac-units/, air-handlers/)
- [x] Equipment selection dropdowns (reloads scene)
- [x] Progressive unlock (L1E4+ only)

**Remaining Phase 1:**
- [ ] Vapor release → Room composition (boiling adds vapor to air)
- [ ] Pressure feedback loop (room pressure affects boiling point)
- [ ] Heat/composition logging for scorecard

### Test & Validate Recent Changes
- [ ] Test Level 2 dropdown (tutorial → Level 2 → verify dropdown works)
- [ ] Test element loading in-game (H, O, N and verify physics)
- [ ] Verify saltwater boiling at correct temperature (100.51°C at sea level, ~66.7°C at 10km)
- [ ] Test experiment-specific popups (L1E1-Tutorial, L1E2-Altitude, L1E3-Different Fluids)

### ~~Add Antoine TminC/TmaxC Notes to Remaining JSON Files~~ ✅ DONE

### ~~Add Regression Guardrails~~ ✅ DONE

---

## 🚀 BACKLOG: Planned Features

### High Priority
1. **Room Environment Phase 2: Scorecard System**
   - [ ] Create `ExperimentScorecard.jsx` component
   - [ ] "Finish Experiment" button
   - [ ] Scorecard download (CSV/JSON)
   - [ ] End-of-experiment modal

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

