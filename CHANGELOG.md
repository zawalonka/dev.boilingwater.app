# Changelog

All notable releases for Boiling Water will be documented in this file.

**Note:** Active development happens continuously between tagged versions. Tags mark significant milestones, but many commits occur between them. For full change history, refer to the commit log.

Versioning standard is evolving organically as the project matures.

---

## [0.1.2] - 2026-01-29

### Changed
- Updated copilot-instructions.md to reflect current project state (substances architecture, 118 periodic table elements, workshop system)
- Fixed outdated comments in src/constants/physics.js (fluids → substances)
- Code cleanup: verified all imports, exports, and cross-references are consistent
- Validated periodic table element references in compound definitions

### Code Quality
- All 118 periodic table elements properly structured and referenced
- All 12 compound definitions with correct phase states
- Workshop system validation and inheritance working correctly
- Physics engine imports and usage consistent across components

---

## [0.1.1] - 2026-01-27

### Fixed
- Tutorial completion now correctly unlocks level/workshop selectors and advanced controls
- Tutorial gating logic aligned with experiment system (checks `activeExperiment === 'boiling-water'` instead of non-existent Level 0)

### Changed
- Updated docs link from removed `src/data/fluids` to new `src/data/substances` path

### Documentation
- Added UI state gotcha to GOTCHAS.md documenting tutorial unlock bug and fix

---

## [0.1.0] - 2026-01-26

### Added
- Data-driven substance architecture with periodic table elements, compounds, and mixtures
- H2O compound with phase states (ice, water, steam) and thermodynamic properties
- Saltwater-3pct mixture with colligative properties
- Refactored loader to support new compound/phase structure

### Removed
- Legacy `src/data/fluids` folder (replaced by `src/data/substances`)

---

## Pre-Alpha Development

Active development with theme system, physics engine, experiment hierarchy, and location-based altitude effects. See commit history for full details.
