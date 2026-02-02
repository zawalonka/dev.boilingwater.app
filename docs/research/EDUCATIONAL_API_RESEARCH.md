# Educational API Research - Chemistry Data Sources

> **Purpose:** Document API investigation for educational content on elements, compounds, and solutions.  
> **Date:** February 1, 2026  
> **Status:** Research Summary - No implementation decision yet

---

## Current Implementation

### What We Use Now
- **Element Scientific Data**: `api.api-ninjas.com/v1/elements`
  - 26 numeric properties: atomic mass, electronegativity, ionization energy, atomic radius, electron affinity, molar entropy, specific heat, melting point, boiling point, density, thermal conductivity, phase
  - **LIMITATION**: No descriptive/educational content (history, discovery, uses, applications)
  - **AUTH**: Requires API key (currently blocked in dev environment)

- **Educational Content**: Manual JSON library at `scripts/temp-data/educational-notes.json`
  - **Currently**: Empty template with instruction comments
  - **Approach**: Manual curation by development team
  - **Status**: Needs population

---

## Investigated APIs

### Authoritative Scientific Sources (Mentioned in Codebase)

| Source | Purpose | Open? | Educational Content? | Status |
|--------|---------|-------|----------------------|--------|
| **NIST Chemistry WebBook** | https://webbook.nist.gov/chemistry/ | Partial (limited free API) | Scientific data + citations | ✅ Authoritative |
| **IUPAC** | https://iupac.org/what-we-do/periodic-table-of-elements/ | No direct API | Reference data | ✅ Authoritative |

**Why These Matter:**
- Referenced in [SUBSTANCE_FILE_TEMPLATE.md](../guides/SUBSTANCE_FILE_TEMPLATE.md) as primary sources
- NIST Chemistry WebBook: Thermodynamic properties, spectroscopy, reaction kinetics
- IUPAC Periodic Table: Authoritative element properties, names, symbols

---

## API Candidates for Educational Content

### 1. **PubChem API** (NCBI/NIH)
- **URL**: https://pubchem.ncbi.nlm.nih.gov/api
- **Educational Content**: Compound names, synonyms, safety data, uses, chemical properties
- **Pros**: 
  - Free and open
  - Extremely comprehensive (20M+ compounds)
  - Returns SMILES, molecular formulas, experimental properties
  - Safety and toxicity data
- **Cons**: Slow, rate-limited, no standalone educational summaries
- **Data Example**: 
  ```
  {
    "IUPACName": "...",
    "Synonyms": [...],
    "PharmacologyAndBiochemistry": {...},
    "SafetyAndHazards": {...},
    "Safety": { "GHS": [...], "NFPA": [...] },
    "ExperimentalProperties": [...]
  }
  ```

### 2. **Chemspider API** (Merck KGaA)
- **URL**: https://api.rsc.org/compounds
- **Educational Content**: Structure, synonyms, predicted/experimental properties
- **Pros**: 
  - Free API available
  - Large database
  - Returns molecular structures
- **Cons**: Requires API key registration, rate limits
- **Status**: Not currently investigated in codebase

### 3. **PubChem Elements (Periodic Table)**
- **URL**: https://pubchem.ncbi.nlm.nih.gov/rest/pug
- **Educational Content**: Element properties, history, discovery, uses
- **Pros**: 
  - Free and comprehensive
  - Direct periodic table endpoint
  - Returns properties + descriptive data
- **Cons**: Slow response times, rate-limited
- **Status**: Not currently in codebase

---

## Recommended Path Forward

### **Option A: Hybrid Approach** (RECOMMENDED)
1. **NIST + IUPAC** for authoritative scientific data
   - Already referenced in templates
   - Thermodynamic properties, standard states, phase transitions
   - Most reliable for educational accuracy
2. **PubChem** for compounds/solutions descriptions
   - Safety data, common uses, synonyms
   - Experimental properties to supplement NIST gaps
3. **Manual curation** for storytelling/history
   - "Why this element matters" 
   - Discovery context, applications, fun facts
   - Keeps unique voice for game

### **Option B: Manual Only** (CURRENT)
- Maintain `scripts/temp-data/educational-notes.json` 
- Full control over content quality
- No API dependencies/latency
- Requires ongoing team curation

### **Option C: AI Generation** 
- Generate educational summaries from scientific data
- Use GPT/Claude to create summaries from PubChem/NIST data
- Trade-off: Less curated, but scalable

---

## Decision: Which to Pursue?

**Questions for team:**
1. How important is auto-fetching educational content vs. manual curation?
2. Is NIST/IUPAC accuracy more important than comprehensive descriptions?
3. Should educational data be in-game generated or pre-computed at build time?

**Current state**: All three options are viable. No breaking dependencies yet.

---

## Implementation Considerations

### If Using External APIs
- Move from `api.api-ninjas.com` to NIST/PubChem
- Add caching (build-time fetch, store in git) to avoid runtime API calls
- Handle missing data gracefully (not all compounds in PubChem)
- Rate limiting and error handling

### If Staying Manual
- Populate `scripts/temp-data/educational-notes.json` systematically
- Create process for keeping it up-to-date as substances are added
- Consider wiki as documentation of source/reasoning for each note

---

## Files Affected by This Decision

- `scripts/fetch-elements-from-api.js` - Element data source
- `scripts/update-educational-notes.js` - Note injection mechanism
- `scripts/temp-data/educational-notes.json` - Note library
- `src/utils/substanceParser.js` - How notes are read in-game
- `wiki/src/index.js` - How notes are displayed in wiki

---

**Research Status**: Complete for now. Decision pending team input.
