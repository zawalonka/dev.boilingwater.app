# Wiki Script Connections Documentation

> **Date:** February 1, 2026  
> **Status:** Wiki enhancement complete  
> **Purpose:** Show script dependencies, parent-child relationships, and build/runtime status

---

## What Changed

### 1. Created `scripts/metadata.json`
New file documenting all script metadata:
- **Purpose**: What each script does
- **Dependencies**: Which scripts it depends on
- **Inputs/Outputs**: File paths
- **Runtime**: When it runs (dev, build, optional)
- **Status**: Active, optional, maintenance-only, orphaned
- **APIs/Data sources**: What external data it uses

### 2. Enhanced Wiki Generator (`wiki/src/index.js`)
Updated scripts page to show:
- ✅ **Dependency pipeline diagram** (ASCII visual)
- ✅ **Individual script details** with expandable sections
- ✅ **Status badges** (🟢 Active, 🔨 Build-time, ⚠️ Optional, 🔧 Maintenance, ⭕ Unused)
- ✅ **Purpose, API usage, data sources**
- ✅ **Dependencies and inputs/outputs**
- ✅ **Links to full source code**

---

## Script Relationships Documented

### Primary Pipeline (Sequential)
```
fetch-elements-from-api.js (LIVE API)
    ↓ fallback if fails
generate-all-118.js (HARDCODED)
    ↓ both generate element JSONs
add-diffusion-volumes.js (adds physics constants)
    ↓
update-educational-notes.js (adds descriptions)
    ↓
generateSubstanceCatalog.js (BUILD TIME - final index)
```

### Parent-Child Relationships
| Parent | Child | Relationship |
|--------|-------|--------------|
| fetch-elements-from-api | generate-all-118 | Fallback - generates same output |
| fetch-elements-from-api + generate-all-118 | add-diffusion-volumes | Depends on element JSON files existing |
| All substance files | update-educational-notes | Depends on substance files existing |
| All generated files | generateSubstanceCatalog | Indexes all at build time |

### Status Classification

#### ✅ Active & Essential
- `fetch-elements-from-api` - Tries to fetch from API
- `generate-all-118` - Hardcoded fallback
- `add-diffusion-volumes` - Injects physics constants
- `update-educational-notes` - Adds descriptions
- `generateSubstanceCatalog` - Build-time indexing

#### 🟡 Optional Development Tools
- `optimize-images` - Image compression (optional dev tooling)

#### 🔧 Maintenance & QA
- `validate-elements` - Schema validation (QA only)

#### ⭕ Currently Unused
- None - all scripts in metadata are referenced or optional

---

## Build-Time vs Runtime

### 🔨 Build-Time Only
- **generateSubstanceCatalog.js** - Runs before Vite builds, creates dynamic import registry

### 📝 Development-Time (Manual)
- All others - Run manually as needed, not part of automated pipeline

### ⚠️ Orphan Analysis
Currently **no orphaned scripts** detected. All scripts serve a purpose:
- Even "optional" tools have explicit use cases
- Validation scripts are QA essentials
- Fallback scripts ensure robustness

---

## How Wiki Displays This

### Scripts Index Page (`/wiki/entities/scripts/index.html`)
Now shows:

**1. Dependency Pipeline (Visual ASCII)**
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

**2. Expandable Script Details**
Each script shows:
- 🟢 Status badge (color-coded)
- Purpose & description
- Active/Used status
- Build-time or dev-time
- API or data source
- Dependencies
- Inputs/outputs
- Link to full source

**3. Full Script List**
All scripts with links to source code

---

## Data About Each Script

### Example: fetch-elements-from-api
```
Status: 🟢 Active
Purpose: Fetch periodic table element properties from external API
Runtime: Development-time (manual)
API Used: api.api-ninjas.com/v1/elements
Data Retrieved: 26 properties per element
Fallback: generate-all-118.js (if API fails or unavailable)
Inputs: api.api-ninjas.com/v1/elements (external)
Outputs: src/data/substances/periodic-table/*.json (118 files)
Used: ✅ Yes
Build-time: ❌ No
Orphan: ❌ No
```

### Example: generate-all-118
```
Status: 🟢 Active  
Purpose: Hardcoded fallback periodic table generator
Runtime: Development-time (manual)
Relationship: Parent=fetch-elements-from-api, Fallback
Data Source: Hardcoded in script (frozen from NIST/IUPAC)
Inputs: Hardcoded PERIODIC_TABLE constant
Outputs: src/data/substances/periodic-table/*.json (118 files)
Used: ✅ Yes
Build-time: ❌ No
Orphan: ❌ No (serves as essential fallback)
```

### Example: generateSubstanceCatalog
```
Status: 🔨 Build-time
Purpose: Create lazy-load import registry from filesystem
Runtime: Build-time (runs automatically)
Relationship: Depends on all previous scripts
Inputs: File system: src/data/substances/* (all substances)
Outputs: src/generated/substanceCatalog.js (auto-generated)
Used: ✅ Yes (essential for Vite)
Build-time: ✅ Yes
Orphan: ❌ No (core build dependency)
```

---

## Key Insights from Metadata

### Confirmed Findings
✅ `generate-all-118.js` IS a child/fallback of `fetch-elements-from-api.js`  
✅ Both generate identical output structure (118 element JSON files)  
✅ Difference: One fetches from API, one uses hardcoded data  
✅ `add-diffusion-volumes.js` DEPENDS on both (reads their output)  
✅ `generateSubstanceCatalog.js` is the ONLY build-time script  
✅ No orphaned scripts (all serve explicit purposes)  
✅ No unused build-time dependencies  

### Surprising Findings
⚠️ `optimize-images.js` is marked optional and currently unused  
ℹ️ `validate-elements.js` is QA/maintenance-only, not part of main pipeline  
ℹ️ Educational notes are manually curated, not auto-fetched  
ℹ️ Diffusion volumes are hardcoded from published sources  

---

## Using the Metadata

### For Developers
- Browse `/wiki/entities/scripts/` to understand what each script does
- See clear dependency chains before modifying scripts
- Know which scripts are safe to skip vs essential

### For CI/CD  
- `generateSubstanceCatalog.js` MUST run at build time
- `fetch-elements-from-api.js` OR `generate-all-118.js` must run before `add-diffusion-volumes.js`
- `update-educational-notes.js` must run before Vite build (needs populated descriptions)

### For Documentation
- Metadata serves as canonical source of truth
- Wiki auto-generates from metadata - always current
- No manual sync needed

---

## Future Enhancements

If/when we add new scripts:
1. Add entry to `scripts/metadata.json` with full metadata
2. Wiki will automatically show it with:
   - Correct status badge
   - Dependency relationships
   - Parent-child tree
   - Input/output documentation

No code changes to wiki generator needed.

---

**Status**: Complete - Wiki now shows script dependencies and relationships  
**Last Updated**: February 1, 2026
