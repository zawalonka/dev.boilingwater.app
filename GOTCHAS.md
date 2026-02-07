# Codebase Gotchas

> **Purpose:** Document non-obvious issues, edge cases, and "gotchas" that cost significant time/tokens to debug. This file helps AI agents and developers understand the codebase's quirks quickly.

---

## Theme System

### Theme Validation: Name Field Location
**Date Fixed:** 2026-01-25  
**Commit:** `96f1e72`  
**Tokens to Debug:** High  

**Issue:**  
Theme switching was failing because the validator required themes to have `metadata.name`, but themes can legitimately have the `name` field at the **top level** instead.

**What happened:**
- Themes were failing validation with "metadata.name is required"
- The validator was too strict, assuming a specific structure
- This wasn't obvious from reading the theme JSON files since some had top-level `name`

**The Fix:**
Changed validation in `src/utils/workshopLoader.js` from:
```javascript
// ❌ Too strict
if (!themeData.metadata.name) {
  throw new Error(`metadata.name is required`)
}
```

To:
```javascript
// ✅ Flexible
if (!themeData.name && (!themeData.metadata || !themeData.metadata.name)) {
  throw new Error(`Theme must have a 'name' field`)
}
```

**Key Lesson:**  
When validating JSON structures, allow flexible field locations unless there's a strong architectural reason not to. Themes can have `name` at root OR in `metadata.name`.

**Files to check:**
- [`src/utils/workshopLoader.js`](src/utils/workshopLoader.js) - Validation logic
- Theme JSON files in `public/assets/workshops/`

### Effects Bleed Between Themes (steam/flame persists)
**Date Observed:** 2026-01-25  
**Commit Attempt:** `cf208f9` (normalized effects to default-disabled)  
**Status:** Still reproduces (steam/flame from alpha show on alpha-alt)

**Issue:**
- Switching from a theme with effects (alpha) to one without effects.json (alpha-alt) still shows steam/flame glow.
- Effects should be opt-in per theme; themes without effects.json should have effects disabled.

**What we tried:**
- Added `normalizeEffects` in `processTheme` to default steam/flameGlow to `enabled: false` when a theme lacks `effects.json`.
- Effects do **not** inherit from parent themes; child themes should start with effects disabled.

**Hypotheses / Next Checks:**
- Verify GameScene receives `themeEffects` as default-disabled after theme switch.
- Ensure component re-renders/clears steam state on theme change (consider force-unmount/re-mount on theme switch).
- Confirm no cached effects assets are being used when `enabled: false`.
- Validate `effects.json` is absent in the target theme (alpha-alt) on the built/dev server.

**Files to check:**
- [src/utils/workshopLoader.js](src/utils/workshopLoader.js) - effects loading/normalization
- [src/components/GameScene.jsx](src/components/GameScene.jsx) - steam/flame glow gating
- [public/assets/workshops/*/effects.json](public/assets/workshops) - per-theme VFX opt-in

---

## UI State & Flow

### Tutorial Completion Did Not Unlock Selectors
**Date Fixed:** 2026-01-27  
**Commit:** (pending)  
**Tokens to Debug:** Medium  

**Issue:**  
After completing the tutorial boil, level/workshop selectors and advanced controls were not unlocked. The logic in `App.jsx` checked `activeLevel === 0` to detect tutorial completion, but Level 0 does not exist in the current architecture. Tutorial is represented by `activeExperiment === 'boiling-water'` within Level 1.

**What happened:**
- `handleWaterBoiled` used `activeLevel === 0 && !hasBoiledBefore` → condition never true.
- `showSelectors` stayed false; advanced mode gating in `GameScene.jsx` remained disabled.

**The Fix:**
Changed `handleWaterBoiled` in [src/App.jsx](src/App.jsx) from:
```
if (activeLevel === 0 && !hasBoiledBefore) {
  setHasBoiledBefore(true)
  setShowSelectors(true)
}
```
to:
```
if (activeExperiment === 'boiling-water' && !hasBoiledBefore) {
  setHasBoiledBefore(true)
  setShowSelectors(true)
}
```

**Key Lesson:**  
Align tutorial gating with the experiment system, not a non-existent Level 0. Use `activeExperiment === 'boiling-water'` for tutorial-completion logic.

**Files to check:**
- [src/App.jsx](src/App.jsx#L1-L300) - `handleWaterBoiled` tutorial gating
- [src/components/GameScene.jsx](src/components/GameScene.jsx#L1-L200) - `isAdvancedModeAvailable` depends on `showSelectors`
- [src/constants/workshops.js](src/constants/workshops.js#L1-L120) - experiment definitions (tutorial flag)

---

## Docs & Generated Outputs

### public/wiki changes are expected
**Date Observed:** 2026-02-06  
**Status:** Normal behavior  

**Issue:**
`public/wiki/` content frequently changes during local runs or docs generation and appears as modified files.

**What happens:**
- Numerous HTML files under `public/wiki/` show up as modified.
- These are generated artifacts and are expected to change together.

**Key Lesson:**
Treat `public/wiki/` diffs as normal generated output; include them when asked to commit all changes.

**Files to check:**
- [public/wiki/](public/wiki/)

## How to Use This File

**When adding a gotcha:**
1. Include the date and commit hash
2. Explain WHY it was hard to spot
3. Show the before/after code if relevant
4. Link to related files
5. Note the "key lesson" for future reference

**Categories to track:**
- Validation logic that's too strict/loose
- Race conditions or timing issues
- Non-obvious dependencies between components
- Edge cases in physics calculations
- Theme/styling quirks
- State management gotchas
