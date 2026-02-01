# Completed TODOs - Boiling Water App

> **Purpose:** Archive of completed work. Not loaded in default AI context.
> **Reference only when needed for historical context.**

---

## February 2026

### 2026-02-01: Room Environment System - Phase 1 ✅ COMPLETE
**See:** [ROOM_ENVIRONMENT_SYSTEM.md](ROOM_ENVIRONMENT_SYSTEM.md) for full design doc  
**Status:** Phase 1 (foundation) fully implemented; Phase 2 (scorecard UI) pending

**Implementation Summary:**
- ✅ Room state management (`src/utils/roomEnvironment.js`)
- ✅ AC PID controller (`src/utils/acUnitHandler.js`)
- ✅ Air handler/scrubber (`src/utils/airHandlerScrubber.js`)
- ✅ React hook (`src/hooks/useRoomEnvironment.js`)
- ✅ Room UI panel (`src/components/RoomControls.jsx`)
- ✅ Per-workshop equipment JSON (room.json, burners/, ac-units/, air-handlers/)
- ✅ Equipment selection dropdowns (reloads scene on selection)
- ✅ Progressive unlock (L1E4+ only)
- ✅ Vapor release → Room composition (boiling adds vapor to air)
- ✅ Heat/composition logging (data collected in state)
- ✅ Room simulation runs independently (before pot filled)
- ✅ Pressure feedback loop (room pressure affects boiling point)
- ✅ Room pressure uses altitude via ISA model (not hardcoded sea level)

**Physics Module Refactor (supporting Phase 1):**
- ✅ Split physics.js into modular structure (formulas/, processes/)
- ✅ 10 individual formula files in formulas/
- ✅ 4 process orchestrators with visible stubs
- ✅ PID controller for AC/equipment
- ✅ Gas exchange model for room air mixing
- ✅ AC/air handlers now use physics formulas
- ✅ Dynamic boiling point calculation accounting for room pressure

**Next Phase:** Room Environment Phase 2 (Scorecard system, data visualization, experiment completion UI)

---

## January 2026

### 2026-01-31: Dynamic Boiling Point System (Major Refactor)
**Commits:** `d819d1e`, previous session commits

**Problem Solved:**
- Hard-coded TminC/TmaxC clamps in Antoine equation (capped at 100°C)
- Static boilingPointElevation (0.515°C) instead of temperature-dependent Kb
- Inaccurate barometric formula (gave 69.9°C at 10km instead of 66.3°C)

**Implementation:**
- ✅ ISA pressure model - Replaced simple barometric formula with ISA troposphere model
  - Pressure at 10,000m: 26,437 Pa (was 30,904 Pa)
  - Water boiling point at 10km: 66.3°C (was 69.9°C)
- ✅ Dynamic Kb calculation - Ebullioscopic constant now calculated at runtime
  - Formula: `Kb = (R × Tb² × Msolvent) / ΔHvap`
  - Kb at 100°C: 0.512 °C·kg/mol
  - Kb at 66°C: 0.424 °C·kg/mol
  - Saltwater elevation at 66°C: 0.43°C (was static 0.515°C)
- ✅ Removed TminC/TmaxC clamps in `solveAntoineEquation()`
- ✅ Return metadata: `{ temperature, isExtrapolated, verifiedRange }`
- ✅ vanHoffFactor and molality parsing from solution JSON
- ✅ Extrapolation warning in UI for Antoine range
- ✅ Removed inline altitude input from ControlPanel (use popup only)

**Key Files Changed:**
- `src/utils/physics.js` - ISA model, dynamic Kb, removed clamps
- `src/utils/substanceParser.js` - Parse vanHoffFactor, molality
- `src/components/ControlPanel.jsx` - Extrapolation warning, simplified altitude UI
- `src/data/substances/**/state.json` - Added TminC_note/TmaxC_note comments

**Design Doc:** See below for original planning document.

<details>
<summary>Original Planning Document (BOILING_POINT_DYNAMIC_TODO.md)</summary>

**Goals:**
- Fully dynamic boiling-point calculation across altitude/pressure and mixture effects
- Keep Antoine coefficients (empirical) as authoritative where present
- Avoid artificial caps (e.g., 100°C ceiling) and forced Earth-only assumptions
- Show user warning when simulation leaves verified data range

**Key Decisions:**
- TminC/TmaxC are **empirically verified range**, not hard limits
- Antoine equation produces a **smooth, continuous curve**
- Accuracy degrades gradually outside range (not a cliff)
- Remove clamps, return computed value + metadata

**Audit Results (Hard-Coded Shortcuts Found):**
1. TminC/TmaxC clamp in `solveAntoineEquation()` — FIXED
2. Linear lapse-rate fallback — Kept as last-resort, documented
3. Mixture elevation not applied at runtime — FIXED with dynamic Kb

**Dynamic Boiling-Point Pipeline:**
1. Get atmospheric pressure (ISA model)
2. Solve Antoine equation → base boiling point
3. Calculate dynamic Kb at actual boiling temperature
4. Apply mixture elevation: `ΔTb = i × Kb × m`
5. Return result + metadata

</details>

### 2026-01-27: Saltwater Van't Hoff Factor Fix
**Commit:** `7c108af`

- ✅ Corrected boilingPointElevation from 0.16°C to 0.515°C
- ✅ Added van't Hoff factor (i=1.9) for NaCl electrolyte

### 2026-01-25: Theme/Workshop System Fixes
**Commits:** `96f1e72`, `cf208f9`

- ✅ Theme validation: Allow top-level `name` field (not just `metadata.name`)
- ✅ Effects normalization: Default steam/flame to disabled for themes without effects.json

### Earlier Work (Pre-January 2026)
- ✅ Zero-hardcoding substance system with build-time catalog generation
- ✅ All 118 periodic table elements with educational notes
- ✅ Newton's Law of Cooling implementation
- ✅ Workshop/theme system with dropdown switching
- ✅ Level/experiment progression system
- ✅ Fixed game window at 1280×800px
- ✅ Image optimization and preloading
- ✅ Location/altitude system with worldwide search

---

## Archived Architecture Documents

The following documents have been consolidated here as historical reference.
They are **outdated** and should not be used for current implementation.

<details>
<summary>ANTOINE_AND_REFACTOR.md (Superseded by ISA + Dynamic Kb)</summary>

**Original Date:** January 2026  
**Status:** SUPERSEDED - ISA model and dynamic Kb now used instead

### Antoine Vapor-Pressure Equation
Added accurate boiling point calculations using the Antoine equation:
- Formula: `log₁₀(Pvap) = A - B/(C + T)`
- Solved for T: `T = B/(A - log₁₀(Pvap)) - C`
- Accuracy: ±0.5°C (empirical, substance-specific)

### Zero-Hardcoding Substance Catalog
- `scripts/generateSubstanceCatalog.js` - Filesystem scan → generated catalog
- `src/generated/substanceCatalog.js` - Auto-generated lazy import registry
- `src/utils/substanceLoader.js` - File loading API
- `src/utils/substanceParser.js` - Pure data transformation

**What Changed Since:**
- TminC/TmaxC clamps removed (was capping at 100°C)
- ISA troposphere model replaces simple barometric formula
- Dynamic Kb calculation for temperature-dependent mixture elevation

</details>

<details>
<summary>REFACTORING_SUMMARY.md (Historical - Substance System Origins)</summary>

**Original Date:** January 2026  
**Status:** Historical reference only

### Extensible Substance Architecture
File structure for substances:
```
src/data/substances/
├── compounds/pure/{compound}/info.json + {phase}/state.json
├── compounds/solutions/{solution}/info.json + liquid/state.json
└── periodic-table/001_H_nonmetal.json through 118_Og_nonmetal.json
```

### Newton's Law of Cooling
Replaced constant -200W cooling with exponential model:
- Formula: `dT/dt = -k(T - T_ambient)`
- k = heat transfer coefficient (from substance JSON)
- Real-world behavior: hot water cools faster than warm water

### Physics Functions Accept Substance Props
All physics functions take `fluidProps` object:
- `calculateBoilingPoint(altitude, fluidProps)`
- `simulateTimeStep(state, heatInputWatts, deltaTime, fluidProps)`

**What Changed Since:**
- `boilingPointElevation` now calculated dynamically (not static)
- `vanHoffFactor` and `molality` parsed from JSON for solutions
- ISA pressure model for accurate altitude calculations

</details>

---

## How to Use This File

This file is intentionally **excluded from default AI context** to reduce token usage.

**Reference this file when:**
- Debugging regressions (check if feature was previously working)
- Understanding why a decision was made
- Verifying a fix was applied

**Do not add to copilot-instructions.md attachments.**
