# Scripts & Data Sources Inventory

> **Created:** February 1, 2026  
> **Purpose:** Comprehensive audit of all data pipelines, APIs used, and data sources  
> **Status:** Complete audit of existing implementation

---

## Scripts Overview

### Data Generation & Processing Pipeline

```
Script Name              | Purpose                           | Data Source             | Output
------------------------|-----------------------------------|------------------------|---------------------------
fetch-elements-from-api | Fetch element properties from API | api.api-ninjas.com      | [periodic-table]/001_H_*.json
generate-all-118        | Hardcoded fallback periodic table | Hardcoded in script     | [periodic-table]/001_H_*.json
update-educational-notes| Inject educational notes into JSON| temp-data/educational..| Updates existing JSONs
add-diffusion-volumes   | Add Fuller-Schettler-Giddings Σv | Hardcoded in script     | Updates [periodic-table]/*.json
generateSubstanceCatalog| Scan filesystem → lazy catalog   | File system scan        | src/generated/substanceCatalog.js
optimize-images         | Compress workshop PNG/JPG         | public/assets/workshops | Optimized PNG/JPG
validate-elements       | Check element JSON structure      | [periodic-table]/*.json | Reports/fixes issues
```

---

## 1. FETCH-ELEMENTS-FROM-API.JS

**Purpose:** Fetch scientific element data from external API  
**API Used:** `api.api-ninjas.com/v1/elements`

### Data Retrieved (26 Properties)
```
atomicNumber, symbol, name, category, block, valenceElectrons, oxidationStates,
atomicMass, electronegativity_pauling, ionizationEnergy, atomicRadius,
electronAffinity, standardMolarEntropy, specificHeatCapacity, 
meltingPointK, boilingPointK, densityGCm3, thermalConductivity, 
phase, appearance
```

### Output Format
```json
{
  "atomicNumber": 1,
  "symbol": "H",
  "name": "Hydrogen",
  "standardUsed": "iupac",
  "nist": { "atomicMass": 1.008, "electronegativity": 2.20, ... },
  "iupac": { "atomicMass": 1.008, "electronegativity": 2.20, ... },
  "physicalProperties": {
    "phase": "gas",
    "appearance": "colorless, odorless gas",
    "uses": [],
    "notes": "Element group: nonmetal"
  },
  "educationalNotes": ""  // Empty until update-educational-notes.js runs
}
```

### Limitations
- ❌ **NO educational/historical content** (uses, discovery, history, applications)
- ✅ **Authoritative scientific properties** (mass, electronegativity, melting/boiling points)
- ⚠️ **Requires API key** (authentication not set up in this env)
- ⚠️ **Rate-limited** (no burst querying)

### Data Attribution
Claims to use NIST Chemistry WebBook 2024 + IUPAC Periodic Table 2024 as sources

---

## 2. GENERATE-ALL-118.JS

**Purpose:** Hardcoded fallback periodic table (backup if API fails)  
**Data Source:** Hardcoded constants in the script  
**Data Coverage:** All 118 elements

### Data Structure
```javascript
const PERIODIC_TABLE = [
  { n: 1, s: "H", nm: "Hydrogen", cat: "nonmetal", am: 1.008, en: 2.20, ie: 1312.0, ... },
  { n: 2, s: "He", nm: "Helium", cat: "noble-gas", am: 4.003, en: null, ie: 2372.3, ... },
  // ... 118 total
]
```

### Field Abbreviations
- `n` = atomic number
- `s` = symbol
- `nm` = name
- `cat` = category (nonmetal, noble-gas, alkali-metal, etc.)
- `b` = block (s, p, d, f)
- `v` = valence electrons
- `ox` = oxidation states
- `am` = atomic mass
- `en` = electronegativity
- `ie` = ionization energy
- `ar` = atomic radius
- `ea` = electron affinity
- `sme` = standard molar entropy
- `shc` = specific heat capacity
- `mp` = melting point (°C)
- `bp` = boiling point (°C)
- `d` = density (g/cm³)
- `tc` = thermal conductivity
- `ph` = phase
- `ap` = appearance

### Output
Generates element JSON files with same structure as fetch-elements-from-api.js output

### Data Source
- **Comment**: "NIST Chemistry WebBook, IUPAC Periodic Table standard references"
- **Actual**: Hardcoded values (likely sourced from NIST/IUPAC at development time, frozen in code)

---

## 3. UPDATE-EDUCATIONAL-NOTES.JS

**Purpose:** Inject educational notes from local library into substance JSON files  
**Data Source:** `scripts/temp-data/educational-notes.json`

### Process Flow
```
temp-data/educational-notes.json
           ↓
  [Read elements/compounds/mixtures sections]
           ↓
  [Find matching substance files]
           ↓
  [Add educationalNotes field to each]
           ↓
  Updated JSON files with educationalNotes populated
```

### Library Structure
```json
{
  "compounds": {
    "water-h2o": "Note about water...",
    "ethanol": "Note about ethanol..."
  },
  "elements": {
    "001_H": "Most abundant element in the universe...",
    "006_C": "Basis of all organic chemistry..."
  },
  "mixtures": {
    "saltwater-3pct-nacl": "Saltwater is a solution..."
  }
}
```

### Current Status
**EMPTY TEMPLATE** - File contains only metadata and instructions  
No educational notes currently populated

### What Gets Updated
- **Compounds:** `src/data/substances/compounds/pure/*/info.json`
- **Mixtures:** `src/data/substances/compounds/solutions/*/info.json`
- **Elements:** `src/data/substances/periodic-table/*.json`

Field name used: `educationalNotes` (canonical)

---

## 4. ADD-DIFFUSION-VOLUMES.JS

**Purpose:** Add atomic diffusion volume (Σv) data for mass transfer calculations  
**Data Source:** Fuller, Schettler, Giddings (1966) + Reid, Prausnitz, Poling (1987)

### Physics Background
Used in **Fuller-Schettler-Giddings equation** to calculate diffusion coefficients for vapor evaporation:
```
D_AB = (0.00143 × T^1.75) / (P × M_AB^0.5 × (Σv_A^(1/3) + Σv_B^(1/3))²)
```

### Data Categories

| Category | Examples | Source | Count |
|----------|----------|--------|-------|
| **Well-Characterized** (Fuller 1966) | H, C, N, O, S, Cl, Ar, noble gases | Published literature | ~14 |
| **Estimated** | Alkali metals, alkaline earth, transition metals | Atomic radius correlation | ~100+ |

### Data Format
```json
{
  "diffusion": {
    "atomicDiffusionVolume": 2.31,
    "unit": "dimensionless (cm³/mol conceptually)",
    "source": "Fuller 1966",
    "note": "Hydrogen - well characterized"
  }
}
```

### Full Data Table
Includes all 118 elements with documented sources (Fuller 1966, Reid 1987, or "Estimated")

---

## 5. GENERATESUBSTANCECATALOG.JS

**Purpose:** Build-time file scanner → generates lazy import catalog  
**Data Source:** File system scan of `src/data/substances/`

### Process
1. **Scan compounds:** Find all `compounds/{type}/{id}/info.json`
2. **Scan elements:** Find all `periodic-table/XXX_Element_category.json`
3. **Index by ID:** Create registry with display names, paths, categories
4. **Generate:** Write `src/generated/substanceCatalog.js` with lazy imports

### Output File
```javascript
// src/generated/substanceCatalog.js (auto-generated)
export const substances = {
  compounds: {
    water: { displayName: 'Water', path: '...', folderPath: '...' },
    ethanol: { displayName: 'Ethanol', path: '...', folderPath: '...' }
  },
  elements: {
    H: { displayName: 'Hydrogen', path: '...', atomicNumber: 1 },
    He: { displayName: 'Helium', path: '...', atomicNumber: 2 }
  }
}
```

### No External APIs
✅ File system only (no network calls)

---

## 6. OPTIMIZE-IMAGES.JS

**Purpose:** Compress workshop PNG/JPG assets  
**Data Source:** `public/assets/workshops/{workshop}/`

### Transformation Rules
- **Backgrounds** (`background.png` → `background.jpg`)
  - Convert PNG to JPG
  - Quality 75, mozjpeg, progressive
  - Reduces file size ~70%

- **UI elements** (pot, flame, etc. stay PNG)
  - Heavy compression (quality 60, level 9)
  - Keep transparency
  - Reduces file size ~40%

### External Dependencies
Uses `sharp` library for image processing (no APIs)

---

## 7. VALIDATE-ELEMENTS.JS

**Purpose:** Quality assurance - check all 118 element JSON files match schema  
**Data Source:** `src/data/substances/periodic-table/*.json`  
**Reference Standard:** `026_transition-metal_Fe.json` (Iron)

### Checks Performed
✅ NIST/IUPAC sections have required properties  
✅ Physical properties in correct location  
✅ educationalNotes field exists (empty or populated)  
✅ No misplaced properties  
✅ Auto-fix common issues  

### No External APIs
File system validation only

---

## Current Data Flow Summary

```
                    API fetch attempt
                           ↓
        ┌────────────────────────────────────────┐
        │  api.api-ninjas.com/v1/elements        │
        │  (26 numeric scientific properties)    │
        │  ⚠️ Requires API key, rate-limited     │
        └────────────────────────────────────────┘
                           ↓ (Success or Fallback)
                    ┌──────────────┐
                    │ generate-118 │ (Hardcoded)
                    └──────────────┘
                           ↓
                  Element JSON created
                           ↓
        ┌────────────────────────────────────────┐
        │ add-diffusion-volumes.js               │
        │ Injects Fuller-Schettler-Giddings Σv   │
        │ (Source: Published 1966 + estimated)   │
        └────────────────────────────────────────┘
                           ↓
        ┌────────────────────────────────────────┐
        │ update-educational-notes.js            │
        │ ❌ Injects from: temp-data/edu...json  │
        │ ✅ Template exists, currently EMPTY    │
        └────────────────────────────────────────┘
                           ↓
              Final Element JSON with:
        ✅ Scientific properties (API or hardcoded)
        ✅ Diffusion volumes (published data)
        ❌ Educational notes (EMPTY currently)
```

---

## What APIs Are Actually Used?

| API | Current Use | Status | Limitations |
|-----|-------------|--------|-------------|
| `api.api-ninjas.com` | Element properties (26 fields) | ⚠️ Requires API key | No educational content |
| **NIST Chemistry WebBook** | Referenced in docs | ⚠️ Not actively called | Would need scraping/API |
| **IUPAC** | Referenced in docs | ⚠️ Not actively called | No direct API |
| **Fuller-Schettler-Giddings** | Diffusion volumes hardcoded | ✅ Embedded in script | Physical constants only |
| **PubChem** | Not used | ❌ Not integrated | Candidate for future |

---

## Missing Data Sources

### What We Don't Have
❌ Educational/historical content  
❌ Real-world applications  
❌ Discovery context  
❌ Safety data (beyond NIST physical properties)  
❌ Toxicity information  
❌ Common uses in industry  

### Why
- NIST/IUPAC: Scientific properties only (no narrative)
- api.api-ninjas.com: 26 numeric fields, no descriptive content
- PubChem: Available but not integrated; would need parsing/API
- Wikipedia/DBpedia: Could provide educational content but not used

---

## To Populate Educational Notes

### Option A: Manual Curation (Current Approach)
1. Add entries to `scripts/temp-data/educational-notes.json`
2. Run `node scripts/update-educational-notes.js`
3. Educational notes injected into all substance JSONs

**Status:** Template ready, library empty

### Option B: Integrate PubChem API
1. Fetch compound metadata from https://pubchem.ncbi.nlm.nih.gov/api
2. Extract safety/uses/synonyms
3. Supplement with manual curation for historical content

**Status:** Not implemented

### Option C: Auto-Generate from AI
1. Use scientific properties from NIST/PubChem
2. Generate educational summaries via GPT/Claude
3. Manual review/curation layer

**Status:** Not implemented

---

## Recommendations

1. **Immediate:** Populate `scripts/temp-data/educational-notes.json` manually (fastest, most curated)
2. **Short-term:** Integrate PubChem for compound safety/uses data
3. **Long-term:** Consider NIST API (if available) for authoritative thermodynamic data
4. **Not recommended:** Replace manual curation entirely with AI (loses accuracy/context)

---

**Last Updated:** February 1, 2026  
**Data Audit:** Complete
