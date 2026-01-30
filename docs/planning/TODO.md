# Project TODO - Boiling Water App

> **Last Updated:** 2026-01-29  
> **Status:** Pre-Alpha (working prototype with zero-hardcoding substance system)

---

## 🔴 CRITICAL: Must Fix Before Next Release

### 1. Level 3 Pause Bug (BLOCKS GAMEPLAY)
**Problem:** `pauseTime` set when boiling begins, never cleared for non-tutorial experiments  
**Impact:** Simulation freezes after boiling in Level 2+ experiments  
**Location:** [GameScene.jsx](../../src/components/GameScene.jsx) boil-stats-modal  
**Fix Required:** Add unpause logic for all experiment completion handlers

### 2. Saltwater Boiling Point (EDUCATIONAL ACCURACY)
**Problem:** Need to verify saltwater uses 100.16°C not 100°C in simulation  
**Impact:** Incorrect physics demonstration  
**Location:** GameScene.jsx physics loop, ControlPanel substance handling  
**Fix Required:** Test and verify correct boiling point calculation

---

## 🎯 IMMEDIATE: Current Sprint Tasks

### Test & Validate Recent Changes
- [ ] Test Level 2 dropdown (tutorial → Level 2 → verify dropdown works)
- [ ] Test element loading in-game (H, O, N and verify physics)
- [ ] Verify saltwater boiling at correct temperature
- [ ] Fix Level 3 pause bug

---

## 🚀 BACKLOG: Planned Features

### High Priority
1. **Unit Conversion System** (50% complete)
   - ✅ Conversion functions, localStorage, locale detection
   - ❌ Wire UI, add more units, update all displays

2. **Room Environment & Atmospheric System** (Design complete)
   - Dynamic room temperature with PID-controlled AC
   - Air composition tracking (O₂, N₂, CO₂, toxic gases)
   - See [ROOM_ENVIRONMENT_SYSTEM.md](ROOM_ENVIRONMENT_SYSTEM.md)

3. **Experiment Scorecard System** (Design phase)
   - Downloadable CSV/JSON reports
   - Metrics: efficiency, sustainability, score

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
   - **Goal:** Collect anonymized experiment data for insights and educational improvements
   - **Status:** Design/ideation phase
   - **Size:** Medium (data layer + optional AI analysis)
   - **Timeline:** Post-1.0 release feature
   
   **Phase 1: Local Storage (Simple)**
   - Store all experiment results to `localStorage` or IndexedDB
   - Schema example:
     ```json
     {
       "experimentId": "uuid-here",
       "timestamp": "2026-01-29T16:45:00Z",
       "substance": "ethanol",
       "altitude": 2500,
       "initialTemp": 20,
       "boilingPointObserved": 75.2,
       "timeToBoil": 187,
       "heatInputWatts": 1700,
       "temperatureCurve": [20, 21.5, 23.1, ...],
       "userActions": ["filled_pot", "turned_heat_on", "adjusted_burner_to_high"]
     }
     ```
   - Export button: Download personal experiment history as JSON/CSV
   
   **Phase 2: Cloud Aggregation (Opt-in)**
   - User consent to anonymized data sharing
   - POST experiment results to cloud endpoint (Firebase/Supabase/custom)
   - Aggregate database for pattern analysis
   
   **Phase 3: AI-Powered Insights (Automated)**
   - GitHub Actions: Analyze experiment corpus weekly
   - AI generates insights document (`docs/EXPERIMENT_INSIGHTS.md`)
   - Example insights:
     - "70% of users attempt ethanol first (curiosity about alcohol)"
     - "Common error: Expecting water to boil instantly at 100°C"
     - "Altitude experiments have 3x replay rate (high educational value)"
   
   **Privacy Considerations:**
   - All data collection opt-in only
   - No personal identifiers stored
   - GDPR-compliant data handling
   - Clear data retention policies
   
   **Potential Use Cases:**
   - Improve tutorial based on where users struggle
   - Identify confusing experiments
   - Generate personalized learning paths
   - A/B test educational content effectiveness
   - Community leaderboards (optional)
   
   **Cost Estimate (if cloud-enabled):**
   - Storage: ~$5/month (100k experiments)
   - AI Analysis: ~$10-20/month (weekly batch processing)
   - Total: <$30/month for full analytics pipeline

---

## ✅ COMPLETED: Recent Milestones

### Session 5 (2026-01-29) - Zero Hardcoding Achievement
**Commit:** `23133ee`

**Major Achievement:** Filesystem-based substance discovery
- Created `scripts/generateSubstanceCatalog.js` - scans 12 compounds + 118 elements
- Generates `src/generated/substanceCatalog.js` with lazy imports (198KB + 130 chunks)
- Deleted hardcoded `src/utils/substanceCatalog.js`
- Rewrote `substanceLoader.js` - completely generic, zero hardcoding
- Fixed element loading (isElement flag, natural phase)
- Fixed compound loading (info.json + phase state.json)
- **Result:** Drop JSON file → automatically discovered

**Other Completions:**
- Element loading infrastructure (H through Og)
- Compound phase state loading
- Ambient-boiling visual (upward steam for BP ≤ 20°C)
- Antoine equation (±0.5°C accuracy)
- Level 2 workshop dropdown fix
- Unified dropdown styling (2-color system)

**Commits:** 23133ee, 09221fd, 5ee85e3, eb03ed7

### Previous Sessions
- ✅ Control panel extraction (GameScene: 1552 → 1158 lines)
- ✅ 3-file substance architecture (catalog, loader, parser)
- ✅ Newton's Law of Cooling implementation
- ✅ Workshop system (4 workshops with dynamic switching)

---

## 📊 PROJECT STATUS DASHBOARD

| System | Status | Details |
|--------|--------|---------|
| **Core Gameplay** | ✅ **Stable** | Pot dragging, heating, accurate physics |
| **Substance System** | ✅ **Zero Hardcoding** | Auto-discovery (12 compounds + 118 elements) |
| **Physics Engine** | ✅ **Accurate** | Antoine equation, Newton's cooling |
| **Workshop System** | ✅ **Working** | 4 workshops, dynamic switching |
| **UI/UX** | ✅ **Polished** | Unified dropdowns, proper contrast |
| **Critical Bugs** | 🔴 **2 Found** | Pause bug (CRITICAL), saltwater BP (HIGH) |
| **Visual Polish** | 🟡 **Minor Issues** | Flame scaling (LOW priority) |
| **Advanced Features** | 🔲 **Planned** | Room environment, scorecards, saves |

### Build Health
- **Main Bundle:** 198KB (gzipped: 63.59KB)
- **Lazy Chunks:** 130+ separate files (code splitting working)
- **Build Time:** ~650ms
- **Zero Hardcoding:** ✅ Achieved

---

## 📦 DELIVERABLES TRACKING

### Delivered
- [x] Core thermodynamics simulation
- [x] Workshop theming system
- [x] Substance loading (zero hardcoding)
- [x] Element support (all 118)
- [x] Compound support (12+)
- [x] Antoine vapor pressure
- [x] Altitude effects
- [x] Level/experiment system

### In Progress
- [ ] Bug fixes (Level 3 pause, saltwater BP)
- [ ] Runtime testing

### Planned
- [ ] Unit conversion UI
- [ ] Room environment system
- [ ] Experiment scorecards
- [ ] Save system
- [ ] Documentation
