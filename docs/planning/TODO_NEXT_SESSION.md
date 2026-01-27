# Next Session TODO - Image & Asset Overhaul

## ✅ Completed
- [x] Effects system fully implemented (steam, flame glow, water stream)
  - All effects disabled by default unless theme enables via `effects.json`
  - Flame image always shows; glow/animation are optional effects
  - Water stream is opt-in per theme
  - Theme switching properly resets game (stage 0, force remount)
  - Documentation updated in GOTCHAS.md
- [x] Theme system locked down and extensible

## Priority 1: Fix Level 2 Workshop Dropdown
- [ ] Debug why Level 2 shows blank workshop dropdown on selection
- [ ] Verify `getWorkshopsByLevel(2)` returns Level 2 Placeholder correctly
- [ ] Test workshop filtering logic and cache behavior
- [ ] Confirm all required fields present in level-2-placeholder/workshop.json

## Priority 2: Extensibility Audit
- [ ] Review data structure for custom materials:
  - `src/utils/substanceLoader.js` – Can users add custom fluids? (JSON structure)
  - `src/data/fluids/` – Where should custom fluids live?
  - Add validation to accept arbitrary fluid properties
- [ ] Review data structure for custom themes:
  - `public/assets/workshops/<id>/theme.json` – Document required vs. optional fields
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

## Priority 3: Documentation
- [ ] Update THEME_SYSTEM.md with:
- [ ] Create FLUID_CUSTOM_GUIDE.md for custom fluid creation
- [ ] Create EXTENSIBILITY_GUIDE.md for modders/theme creators
- [ ] Document all extensible data formats (fluids, themes, physics params)

## Next Session Context
- **Last work:** Effects system implementation (all effects opt-in per theme), theme switching reset, game extensibility
- **Dev server:** Running at http://localhost:3001/
- **Branches:** Changes ready to commit and push to dev/main (staging), then origin/main (prod)
- **Image status:** JPG backgrounds (62KB), compressed PNGs (6-12KB) loaded successfully
- **Theme system:** ✅ Complete - validator fixed, effects opt-in, extensible, resets properly
- **Effects system:** ✅ Complete - steam, flame glow, water stream all gated, default disabled
