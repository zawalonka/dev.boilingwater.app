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
Changed validation in `src/utils/themeLoader.js` from:
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
- [`src/utils/themeLoader.js`](src/utils/themeLoader.js) - Validation logic
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
- [src/utils/themeLoader.js](src/utils/themeLoader.js) - effects loading/normalization
- [src/components/GameScene.jsx](src/components/GameScene.jsx) - steam/flame glow gating
- [public/assets/workshops/*/effects.json](public/assets/workshops) - per-theme VFX opt-in

---

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
