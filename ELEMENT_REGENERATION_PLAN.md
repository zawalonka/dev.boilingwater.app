# Element Data Regeneration Plan

> **Date:** February 2, 2026  
> **Status:** CHECK MODE READY - Awaiting manual validation and update approval

---

## 📋 SUMMARY

The `scripts/regenerate-elements.js` script is now ready to validate and update all 118 element files from authoritative sources (PubChem + NIST).

**Current Status:**
- ✅ Check mode complete: Scans all 118 files, detects missing phase data (ALL 118)
- ✅ Validation framework in place: Compares current data against PubChem sources
- ⚠️ HTML parsing limited: Can extract values but needs enhancement to capture ALL sources
- 🔴 **CRITICAL FINDING:** All elements missing physics properties for liquid/solid/gas phases

---

## 🔍 KEY FINDINGS

### Data Precision Issue (DISCOVERED)
Original commit `be1e37d` had DIFFERENT NIST/IUPAC values:
- **Hydrogen:** NIST=1.00794, IUPAC=1.008 (precision levels differed)
- **Oxygen:** NIST=15.9994, IUPAC=15.999 (precision levels differed)

Commit `a3fa632` ("regenerate all 118 elements") **homogenized them to identical values**:
- Now: Both NIST=1.008, Both IUPAC=1.008
- **Problem:** Lost precision/distinction between authoritative sources
- **Cause:** Script duplicated single-source data with different labels instead of fetching from BOTH sources separately

### Game-Critical Requirement: Atomic Weight Must Be Singular
**The game uses atomicMass for stoichiometric calculations.**
- ❌ Cannot use ranges (e.g., "1.00782–1.00811")
- ✅ Must use single precise value (e.g., "1.008")

**Issue:**
- NIST publishes ranges (varies by isotope source composition)
- IUPAC publishes standard intervals (single values)
- **Solution:** Select ONE authoritative source per element, consistently applied across all 118

---

## 🛠️ SCRIPT MODES

### 1. CHECK MODE (✅ READY)
```bash
node scripts/regenerate-elements.js
```

**What it does:**
- Scans existing 118 element files
- Reports: All 118 missing `physicalProperties.phases` (gas/liquid/solid)
- Validates sample elements (first 5) against PubChem
- Flags any atomic mass values containing ranges (±, –)
- **Writes nothing to disk**

**Output:**
```
📊 Found 118 existing element files
📈 Status:
   Total files: 118
   Files needing update (phase data): 118
   
🔎 CHECK MODE: Comparing current data against PubChem...
📋 H (Hydrogen):
   ✅ All values validated
   
POST-CHECK VALIDATION REQUIRED:
   TODO: Verify atomic weight values are SINGULAR and PRECISE
   - Game calculations depend on precise atomicMass (no ranges)
   - Must select authoritative source consistently...
```

### 2. UPDATE MODE (🔴 TODO)
```bash
node scripts/regenerate-elements.js --update
```

**What it will do:**
- Fetch phase data from PubChem for all 118 elements
- Add `physicalProperties.phases` structure (gas/liquid/solid)
- Fix any atomic mass precision issues
- Apply consistent source selection across all elements
- **Writes changes to JSON files**

**Not yet implemented:**
- PubChem phase data extraction
- Intelligent source selection logic
- Per-element handling for ambiguous cases

### 3. RECREATE MODE (⚠️ EMERGENCY ONLY)
```bash
node scripts/regenerate-elements.js --recreate
```

**What it would do:**
- Full rebuild of all 118 elements from scratch
- Rarely needed; commented out for safety
- Only use if files corrupted/lost

---

## 📊 DATA SOURCES (VERIFIED AUTHORITATIVE)

### Primary Source: PubChem
- **URL:** https://pubchem.ncbi.nlm.nih.gov/element/{atomicNumber}
- **Provider:** NIH National Library of Medicine (U.S. government)
- **Coverage:** All 118 elements with 15+ properties each
- **Per-field attribution:** Every value cites source with DOI (e.g., "Empirical Atomic Radius 60 pm - J.C. Slater [DOI:10.1063/1.1725697]")
- **Distinguishes:** Empirical vs calculated vs measured values
- **Sources referenced:** NIST, IUPAC CIAAW, Jefferson Lab, Los Alamos, peer-reviewed papers

### Verification Source: NIST
- **URL:** https://physics.nist.gov/cgi-bin/Elements/elInfo.pl?element={atomicNumber}&context=text
- **Provider:** U.S. National Institute of Standards and Technology (metrology authority)
- **Coverage:** Atomic weights (with uncertainty ranges), ionization energies, spectroscopic data
- **Critically evaluated:** All experimental values on SI scale
- **Use:** Cross-verify PubChem values, confirm uncertainty ranges

### Supplementary: Ptable.com
- **URL:** https://ptable.com
- **Provider:** Michael Dayah (educational tool, reviewed by Eric Scerri)
- **Use:** Visual trends, secondary verification
- **Limitation:** Educational reference, not cited in scientific papers

### Standards Authority: IUPAC
- **URL:** https://iupac.org/what-we-do/periodic-table-of-elements/
- **Role:** Defines official atomic weights and chemical nomenclature
- **Access:** Through PubChem (which cites IUPAC CIAAW)
- **Note:** Blocks automated access (HTTP 403)

---

## 🎯 IMPLEMENTATION ROADMAP

### Phase 1: Validation & Analysis (THIS STEP - NOW)
- [x] Create check mode script (`regenerate-elements.js`)
- [x] Scan all 118 files, detect missing phase data
- [x] Compare sample against PubChem
- [x] Report atomic weight precision issues
- [ ] **NEXT:** Run check mode, examine sample output, identify which elements have issues

### Phase 2: Data Enhancement (NEXT SESSION)
- [ ] Improve HTML parser to extract ALL sources (not just first match)
- [ ] For each element: capture all available values + their sources + citations
- [ ] Build source attribution map per element

### Phase 3: Phase Data Addition (AFTER Phase 2)
- [ ] Define phase data structure template:
  ```json
  "physicalProperties": {
    "phase": "solid|liquid|gas",
    "phases": {
      "gas": {
        "density": 0.00008988,
        "specificHeat": 14.3,
        "thermalConductivity": 0.1815,
        "source": "NIST Chemistry WebBook"
      },
      "liquid": {...},
      "solid": {...}
    }
  }
  ```
- [ ] Scrape PubChem for phase-specific properties
- [ ] Add to all 118 elements

### Phase 4: Atomic Weight Normalization (CRITICAL)
- [ ] For each element: select single authoritative value
- [ ] Document source choice (NIST vs IUPAC vs other)
- [ ] Verify NO ranges (±, –) in final values
- [ ] Per-element handling for ambiguous cases (e.g., radioactive elements)

### Phase 5: Execution
- [ ] Run `--update` mode
- [ ] Manually spot-check 10-15 random elements
- [ ] Verify phase data quality
- [ ] Verify atomic mass precision

### Phase 6: Commit & Release
- [ ] Document all changes in git commit message
- [ ] Include source URLs and verification dates
- [ ] Tag with source authorities (PubChem, NIST, date)
- [ ] Update codebase version marker

---

## ✅ READY TO RUN

**To test check mode now:**
```bash
cd d:\gamedev\Boilingwater.app
node scripts/regenerate-elements.js
```

**Expected output:**
- List of all 118 elements missing phase data
- Sample validation of first 5 elements
- TODO list for manual inspection
- **No files will be modified**

---

## ⚠️ IMPORTANT NOTES

1. **Atomic Weight is Critical:** The game performs stoichiometric calculations. **Must be singular, precise values** - ranges will cause calculation errors.

2. **Source Selection Matters:** Different sources (NIST, IUPAC) may have slightly different values for the same property. Script must consistently choose one per element.

3. **Phase Data is Essential:** All 118 elements currently missing gas/liquid/solid phase properties needed for thermodynamic calculations.

4. **HTML Parsing is Fragile:** Current regex-based parser works for simple cases but may fail on complex PubChem structures. May need Puppeteer/Playwright for JS-rendered content.

5. **Manual Validation Required:** After automated update, spot-check results manually for quality assurance.

---

## 📚 RELATED FILES

- [COMPLETED_TODOS.md](docs/planning/COMPLETED_TODOS.md) - Historical data regeneration attempts
- [TODO.md](docs/planning/TODO.md) - Element regeneration section with detailed tasks
- [GOTCHAS.md](GOTCHAS.md) - Known issues (see "Theme Validation" for similar data loading issues)
- [scripts/regenerate-elements.js](scripts/regenerate-elements.js) - Main script
- [src/data/substances/periodic-table/](src/data/substances/periodic-table/) - Element JSON files (001_H_nonmetal.json through 118_Og_noble-gas.json)

---

**Last Updated:** 2026-02-02  
**Next Step:** Run check mode, examine output, approve phase 2 enhancement work
