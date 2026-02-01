# Wiki TODO - Static Knowledge Site

> **Last Updated:** 2026-01-31
> **Scope:** Separate from gameplay. Build-generated static site for GitHub Pages.

---

## ✅ Phase 0: Bootstrap (Required First)
1. **Create wiki Copilot instructions + folder structure**
   - [x] Add wiki-specific Copilot instructions file (separate from game rules)
   - [x] Define wiki folder layout (source, generator, output)
   - [x] Ensure wiki tools/scripts never touch gameplay code

## Phase 1: Core Generator
2. **Static site generator (build-time)**
   - [x] Build script (Node) to generate HTML from repo data
   - [x] Incremental rebuilds via hash cache (global inputs)
   - [x] Force-rebuild flag
   - [ ] Changed-files-only optimization (skip when unrelated files changed)

3. **Entity model + relationships**
   - [x] Elements, compounds, solutions
   - [x] Levels and experiments (from current constants)
   - [x] Parent/child graphs with cross-links (elements ↔ compounds, compounds ↔ solutions)
   - [x] Phases (solid/liquid/gas state files)
   - [x] Formulas and processes (extraction + usage mapping)

4. **Page types**
   - [x] Index (overview + counts)
   - [x] Entity detail pages (parsed JSON + readable layout)
   - [x] Relationship sections (parents/children on entity pages)
   - [x] Usage pages (formulas → processes → game callsites)

## Phase 2: UX & Validation
5. **Readable layout & learning focus**
   - [ ] Render formulas with readable math + code blocks
   - [ ] Consistent sectioning for properties, sources, notes

6. **Quality checks**
   - [ ] Broken-link validation
   - [ ] Missing data warnings
   - [ ] Output integrity checks

## Phase 3: Integration
7. **Build & deploy**
   - [ ] Hook into build pipeline for GitHub Pages
   - [ ] Add hamburger menu link to wiki
   - [ ] Add docs for running generator locally
