# Next Session TODO - Image & Asset Overhaul

- [ ] Confirm whether effects (steam, glowing fire, etc.) are defined within the theme folder structure; if not, add an optional `effects.json` schema/file to themes (document optionality, no placeholder effects required for simple themes)

## Priority 1: ComfyUI Workflows & SVG Conversion
- [ ] Create ComfyUI workflows for all transparent images (pot-empty, pot-full, flame)
- [ ] Generate SVG versions of theme images from ComfyUI workflows
- [ ] Store ComfyUI workflow .json files in GitHub (for reproducibility/sharing)
- [ ] Replace PNG pot/flame images with SVG equivalents in:
  - `public/assets/themes/alpha/`
  - `public/assets/themes/alpha-alt/`
- [ ] Update theme.json image paths to reference `.svg` instead of `.png`
- [ ] Test SVG rendering in GameScene (check if CSS transforms/filters work better)

## Priority 2: Background Images (SVG)
- [ ] Create ComfyUI workflow for kitchen/workshop background
- [ ] Generate SVG backgrounds for both alpha themes (1280x800)
- [ ] Test if SVG backgrounds can replace JPG (may need raster fallback)
- [ ] Document ComfyUI workflow in GitHub (link in THEME_SYSTEM.md)

## Priority 3: CSS Clip-Path Exploration
- [ ] Investigate CSS clip-path for pot animation (instead of image swaps)
- [ ] Test clip-path performance vs. image switching
- [ ] Evaluate SVG mask vs. CSS clip-path for flame effect
- [ ] Document findings in THEME_SYSTEM.md

## Priority 4: Extensibility Audit
- [ ] Review data structure for custom materials:
  - `src/utils/fluidLoader.js` – Can users add custom fluids? (JSON structure)
  - `src/data/fluids/` – Where should custom fluids live?
  - Add validation to accept arbitrary fluid properties
- [ ] Review data structure for custom themes:
  - `public/assets/themes/<id>/theme.json` – Document required vs. optional fields
  - Ensure new themes can override only specific colors (inheritance working?)
  - Test theme inheritance chain (alpha → alpha-alt → custom)
- [ ] Review physics equations:
  - `src/utils/physics.js` – Ensure all formulas are documented & parameterized
  - Can users plug in custom boiling point/specific heat equations?
- [ ] Create extensibility guide (separate doc for mod creators)
- [ ] Add file upload/validation for:
  - Custom fluid JSON
  - Custom theme JSON
  - Custom images (with size/format requirements)

## Priority 5: Documentation
- [ ] Update THEME_SYSTEM.md with:
  - SVG image format guidelines
  - ComfyUI workflow link/instructions
  - CSS clip-path examples (if implemented)
- [ ] Create FLUID_CUSTOM_GUIDE.md for custom fluid creation
- [ ] Create EXTENSIBILITY_GUIDE.md for modders/theme creators
- [ ] Document all extensible data formats (fluids, themes, physics params)

## Next Session Context
- **Last work:** Image optimization (PNG → JPG backgrounds, compressed UI PNGs), CI workflow fix (skip rebuilds for docs-only changes)
- **Dev server:** Running at http://localhost:3001/
- **Branches:** All changes pushed to origin/main (prod) and dev/main (staging)
- **Image status:** JPG backgrounds (62KB), compressed PNGs (6-12KB) loaded successfully
- **Theme system:** Fully functional; validator fixed, preloading working, CSS vars applied correctly
