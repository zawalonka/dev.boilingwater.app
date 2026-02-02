# Quick Reference: Script Relationships & Wiki Display

> **Wiki Location:** `/wiki/entities/scripts/index.html`  
> **Metadata Source:** `scripts/metadata.json`  
> **Generator:** `wiki/src/index.js`

---

## Visual: How Scripts Connect (Now Shown in Wiki)

```
┌─────────────────────────────────────────────────────────────────┐
│  ELEMENT GENERATION LAYER                                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  fetch-elements-from-api.js (🟢 Active)                        │
│         ↓ (fetches from API)                                   │
│         ↓ (fallback if fails)                                  │
│  generate-all-118.js (🟢 Active, Fallback)                     │
│                                                                 │
│  Outputs: src/data/substances/periodic-table/*.json (118 files)│
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  DATA ENRICHMENT LAYER                                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  add-diffusion-volumes.js (🟢 Active)                          │
│         ↓ (depends on element files existing)                  │
│                                                                 │
│  update-educational-notes.js (🟢 Active)                       │
│         ↓ (depends on all substance files)                     │
│                                                                 │
│  Outputs: Enriched JSON files with metadata                    │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  BUILD-TIME INDEXING LAYER                                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  generateSubstanceCatalog.js (🔨 Build-time)                   │
│         ↓ (scans all substance files)                          │
│                                                                 │
│  Outputs: src/generated/substanceCatalog.js (auto-generated)   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                    VITE BUILD PROCESS
```

---

## Status Badges Explained

| Badge | Meaning | Scripts |
|-------|---------|---------|
| 🟢 | Active, part of main pipeline | fetch-elements-from-api, generate-all-118, add-diffusion-volumes, update-educational-notes, generateSubstanceCatalog |
| 🔨 | Build-time only (runs automatically) | generateSubstanceCatalog |
| ⚠️ | Optional, not usually run | (none yet) |
| 🔧 | Maintenance/QA only | validate-elements |
| ⭕ | Unused, optional dev tooling | optimize-images |

---

## What Appears in Wiki

### Section 1: Description
> Scripts handle data generation, validation, and build-time catalog creation. They have explicit parent-child relationships and dependency chains.

### Section 2: Dependency Pipeline (ASCII Visual)
```
fetch-elements-from-api.js (LIVE API)
    ↓ (fallback if fails)
generate-all-118.js (HARDCODED)
    ↓ (both generate element JSONs)
add-diffusion-volumes.js (Adds Σv constants)
    ↓
update-educational-notes.js (Adds descriptions)
    ↓
generateSubstanceCatalog.js (BUILD TIME - indexes all)
```

### Section 3: Script Details (Expandable)
Click to expand any script:
```
🟢 fetch-elements-from-api.js
  ├─ Purpose: Fetch periodic table element properties from external API
  ├─ Status: ✅ Used · 📝 Dev-time
  ├─ API: api.api-ninjas.com/v1/elements
  ├─ Inputs: api.api-ninjas.com/v1/elements (external API)
  ├─ Outputs: src/data/substances/periodic-table/*.json (118 element files)
  └─ View full source →
```

### Section 4: Full Script List
Links to source code for all scripts

---

## Key Answers

| Question | Answer | How Wiki Shows It |
|----------|--------|-------------------|
| Is `generate-all-118` a child of `fetch-elements-from-api`? | **YES** - Fallback relationship | Status badge + dependency graph + expandable details |
| What's the relationship between them? | Generates same output, serves as backup | Shown in dependency diagram and description |
| Is `generate-all-118` made from fetch output? | **NO** - Hardcoded, independent but parallel | Metadata clearly shows "Hardcoded constant" |
| Which scripts are only for build-time? | `generateSubstanceCatalog.js` | 🔨 Badge + "BUILD TIME" label |
| Which scripts are orphaned/unused? | `optimize-images.js` (optional) | ⭕ Badge + "Unused" status |
| Which scripts are required? | First 5 in pipeline | 🟢 Badges + sequential dependency diagram |

---

## How to Update Wiki When Scripts Change

### Adding a New Script
1. Create the script file (`scripts/my-new-script.js`)
2. Add entry to `scripts/metadata.json`:
   ```json
   {
     "my-new-script": {
       "name": "My New Script",
       "purpose": "What it does",
       "runTime": "dev",
       "inputs": [...],
       "outputs": [...],
       "status": "active",
       "used": true,
       "buildTime": false,
       "description": "Full description"
     }
   }
   ```
3. Run wiki builder: `npm run wiki:build --force`
4. Wiki automatically shows new script with correct status badges

### Removing a Script
1. Remove from `scripts/metadata.json`
2. Script disappears from wiki automatically
3. Can track in orphan reports if needed

### Updating a Script's Purpose
1. Update description in `scripts/metadata.json`
2. Run wiki builder
3. Wiki reflects changes immediately

---

## Files Reference

| File | Purpose |
|------|---------|
| `scripts/metadata.json` | ✅ Central source of truth for script metadata |
| `wiki/src/index.js` | ✅ Loads metadata and renders wiki pages |
| `wiki/dist/entities/scripts/index.html` | ✅ Generated wiki page (shows dependencies) |
| `docs/research/SCRIPTS_AND_DATA_SOURCES.md` | 📖 Detailed API audit |
| `docs/research/WIKI_SCRIPT_CONNECTIONS.md` | 📖 Wiki connection documentation |
| `docs/research/WIKI_IMPLEMENTATION_COMPLETE.md` | 📖 This implementation summary |

---

**Status**: ✅ Complete - Wiki now shows all script dependencies and relationships  
**Updated**: February 1, 2026
