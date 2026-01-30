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

### 2. Saltwater Boiling Point - Van't Hoff Factor (CRITICAL ACCURACY)
**Problem:** Declared boiling point elevation (0.16°C) is WRONG - doesn't account for van't Hoff factor  
**Root Cause:** Treated NaCl like sugar (i=1) instead of electrolyte (i=1.9)  
**Correct Value:** Should be ~0.515°C (100.515°C total), using precise NaCl molar mass 58.443 g/mol  
**Calculation:** ΔTb = i·Kb·m = 1.9 × 0.512 × 0.5291 = 0.5147°C  
**Molality:** (30g / 58.443 g/mol) / 0.970 kg = 0.5291 m  
**Impact:** Incorrect physics education - students learn wrong effect of dissolved salt  
**Location:** `src/data/substances/compounds/solutions/saltwater-3pct-nacl/info.json`  
**Fix Required:** Update boilingPointElevation from 0.16 to 0.515 ✅ FIXED

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
1. **Unit Conversion System**
   - Wire UI, add more units, update all displays

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

