# Changelog

All notable releases for Boiling Water will be documented in this file.

**Note:** Active development happens continuously between tagged versions. Tags mark significant milestones, but many commits occur between them. For full change history, refer to the commit log.

Versioning standard is evolving organically as the project matures.

---

## [0.1.4] - 2026-02-01

### Performance & Infrastructure
- **Image Optimization** (88% reduction on alpha kitchen)
  - Compressed alpha-kitchen PNGs: 3.06 MB → 0.38 MB
  - Total public assets: 6.5 MB → 3.56 MB (45% reduction)
  - Enables faster GitHub Pages delivery

- **Service Worker Precaching** (manifest-based, v2)
  - Build-time precache manifest generation via Vite plugin
  - Manifest-based precaching of all public assets (~3.56 MB)
  - Fallback to core assets if manifest unavailable
  - Enables offline-first experience and instant loads on repeat visits

### Documentation & Governance
- **Accessibility Audit** (comprehensive 40-50 hour roadmap, flagged CRITICAL)
  - Created ACCESSIBILITY_TODO.md with 4-phase remediation plan
  - Phase 1 (6-8 hrs): Form labels, aria-live, dialogs, colors
  - Phase 2 (8-10 hrs): Keyboard navigation, game controls
  - Phase 3 (10-12 hrs): Semantic HTML, WCAG 2.1 Level AA
  - Phase 4 (6-8 hrs): NVDA/Lighthouse testing

- **Repository Governance**
  - CONTRIBUTING.md (dev-first workflow, physics accuracy, substance templates)
  - SECURITY.md (dual-environment reporting, 7-day acknowledgment SLA)
  - GitHub issue templates (bug, feature request)
  - GitHub PR template (dev-first checklist)

- **License Tracking**
  - LICENSE_DEPENDENCY_LOG.md for third-party dependencies
  - Workflow "Make background transparent" documented
  - Status indicators: ✅ (compatible), ⚠️ (verify), ❗ (issue)

- **Project Documentation Refactor**
  - Moved Room Environment Phase 1 to COMPLETED_TODOS.md
  - Integrated user notes into formal TODO structure
  - Burner physics bug (issue: heating logic incorrect)
  - Time sub-stepping design (solution: HOF wrapper, adaptive substeps)

### User Interface
- **Speed Acceleration Warning**
  - "⚠️ Speed acceleration is unreliable — results unverified"
  - Readable white text on control panel background
  - Appears above advanced speed controls (L1E2+)

### Known Issues (Noted for Future Fixes)
- **Burner physics:** Only heats room when pot is over it (should be independent mini-heater)
- **Time sub-stepping:** Physics diverges at all acceleration (even 2x); needs subdivider
- **Speed threshold:** Safe limit unknown; needs empirical testing

### Technical Debt
- Physics sub-stepping not implemented (timeSubstepper.js)
- Accessibility: 40-50 hours to WCAG 2.1 Level AA (marked CRITICAL)
- Dialog polyfill: Safari may need support

---

## [0.1.3] - 2026-01-29

### Major Refactoring
- **Extracted ControlPanel component** from GameScene.jsx for better separation of concerns
  - GameScene.jsx reduced from 1552 → 1158 lines (25% reduction)
  - ControlPanel.jsx created as dedicated presentational component (385 lines)
  - All UI controls now modular and reusable

### Added
- Educational notes for all 118 periodic table elements (discovery, etymology, real-world uses, interesting facts)
- Educational notes for water (H2O) and saltwater (3% NaCl) compounds
- Batch update script (update-educational-notes.js) for future substance content updates
- scripts/temp-data/ folder for script-specific data (extensible for future tools)
- GAMESCENE_REFACTOR_PLAN.md documentation of refactoring strategy

### Documentation
- Reorganized docs structure: WATER_STATES_ARCHITECTURE.md → guides/SUBSTANCE_SYSTEM_GUIDE.md
- Cleaned up TODO.md (487 → ~100 lines, removed completed items)
- Deleted EDUCATIONAL_NOTES_TODO.md (project complete)
- Documented 3 known bugs for future fixing (flame scaling, saltwater calc, level 3 pause)

### Code Quality
- Better separation of concerns: GameScene focuses on physics/state, ControlPanel handles UI
- Improved readability and maintainability
- All 120 substances now have comprehensive educational content
- Dev server tested and working without errors

### Known Issues (Noted for Future Fixes)
- Alpha kitchen flame icon scaling differs from other workshops
- Saltwater boiling point calculation uses plain water values (Level 3)
- Level 3 pause on completion with no unpause option

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
