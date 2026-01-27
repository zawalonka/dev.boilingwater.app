# Project TODO  Periodic-Table-Driven Substance Architecture

##  Completed (Session: 2026-01-27)
- [x] Created ALL 118 periodic table elements with exhaustive detail (H through Og)
  - [x] Elements 1-96 (H through Cm): Complete with NIST/IUPAC data, physical properties, educational notes
  - [x] Elements 97-103 (Bk through Lr): Actinides with research applications
  - [x] Elements 104-118 (Rf through Og): Superheavy transactinides with synthesis details
- [x] Created 10 household compounds with full thermodynamic phase data:
  - [x] H2O (ice, water, steam) - Water
  - [x] Saltwater-3pct (aqueous solution)
  - [x] Ethanol (liquid, gas)
  - [x] Ammonia (liquid, gas)
  - [x] Acetone (liquid, gas)
  - [x] Acetic acid (solid, liquid, gas)
  - [x] Hydrogen peroxide (liquid, gas)
  - [x] Methane (liquid, gas)
  - [x] Propane (liquid, gas)
  - [x] Isopropyl alcohol (liquid, gas)
  - [x] Glycerin (liquid)
  - [x] Sucrose (solid, liquid)
- [x] Updated substanceLoader.js getAvailableSubstances() with all 12 compounds
- [x] Fixed tutorial completion gating bug (activeExperiment === 'boiling-water')
- [x] Tagged and released v0.1.1
- [x] Created CHANGELOG.md with versioning notes

##  Completed (Previous Sessions)
- [x] Created 6 core element JSON files (H, C, N, O, Na, Cl) with dual NIST/IUPAC data
- [x] Created H2O compound: info.json + 3 phase states (ice, water, steam)
- [x] Created saltwater-3pct mixture: info.json + liquid state with electrolyte properties
- [x] Refactored substanceLoader.js to load compounds and phase states dynamically
- [x] Integrated loader with physics engine (all substance values from JSON, no hardcoded constants)
- [x] Removed legacy src/data/fluids/ folder
- [x] Renamed fluidLoader.js → substanceLoader.js (future-proof for solids/gases/mixtures)
- [x] Added compatibility aliases for backward compatibility
- [x] Updated all imports in GameScene to use new loader API
- [x] Updated documentation refs across copilot-instructions.md, REFACTORING_SUMMARY.md, etc.
- [x] Deleted duplicate TODO_NEXT_SESSION.md
- [x] Effects system fully implemented (steam, flame glow, water stream) – all opt-in per theme
- [x] Theme system locked down and extensible (workshop JSON structure with level filtering)
- [x] Level 1 workshop system working (pre-alpha-kitchen-1, pre-alpha-kitchen-2, alpha-kitchen)
- [x] Level 1 experiments structured (boiling-water, altitude-effect, different-fluids)

---

## CURRENT SPRINT: Expand Substance Library

### Priority 1: Complete Periodic Table (All 118 Elements)
**Status:** ✅ COMPLETE (118/118 elements created)

#### 1.1 Create Remaining Element JSON Files
**Location:** `src/data/substances/periodic-table/`
**Filename:** `{atomicNumber:03d}_{elementCategory}_{symbol}.json`

**Completed Elements (118/118):**
- [x] Period 1 (2): H, He
- [x] Period 2 (8): Li, Be, B, C, N, O, F, Ne
- [x] Period 3 (8): Na, Mg, Al, Si, P, S, Cl, Ar
- [x] Period 4 (18): K, Ca, Sc, Ti, V, Cr, Mn, Fe, Co, Ni, Cu, Zn, Ga, Ge, As, Se, Br, Kr
- [x] Period 5 (18): Rb, Sr, Y, Zr, Nb, Mo, Tc, Ru, Rh, Pd, Ag, Cd, In, Sn, Sb, Te, I, Xe
- [x] Period 6 (32): Cs, Ba, La, Ce, Pr, Nd, Pm, Sm, Eu, Gd, Tb, Dy, Ho, Er, Tm, Yb, Lu, Hf, Ta, W, Re, Os, Ir, Pt, Au, Hg, Tl, Pb, Bi, Po, At, Rn
- [x] Period 7 (32): Fr, Ra, Ac, Th, Pa, U, Np, Pu, Am, Cm, Bk, Cf, Es, Fm, Md, No, Lr, Rf, Db, Sg, Bh, Hs, Mt, Ds, Rg, Cn, Nh, Fl, Mc, Lv, Ts, Og

**Detail Level:** All 118 elements include:
- NIST & IUPAC atomic mass, electronegativity, ionization energy, atomic radius, electron affinity, molar entropy, specific heat
- Physical properties (melting/boiling points, density, thermal conductivity, phase, appearance)
- Real-world uses and applications
- Comprehensive educational notes covering discovery, etymology, significance
- For radioactive elements: half-lives, decay products, applications in medicine/industry

---

### Priority 2: Add Common Household Chemical Compounds
**Status:** ✅ COMPLETE (12/12 compounds with full phase data)

#### 2.1 Pure Household Chemicals
**Rationale:** Educational value – students recognize these from daily life

**Compounds Completed (12/12):**

1. **H₂O (Water)** - Ice, Liquid, Gas phases
   - Triple point, critical point, Antoine coefficients
   - All phase states with complete thermodynamic properties
   
2. **Saltwater (3% NaCl)** - Aqueous solution
   - Electrolyte properties, colligative effects
   - Boiling point elevation, freezing point depression
   
3. **Ethanol (C₂H₅OH)** - Liquid, Gas phases
   - Alcoholic beverages, fuel, sanitizer
   - Full phase transition data
   
4. **Ammonia (NH₃)** - Liquid, Gas phases
   - Cleaning product, fertilizer, industrial chemical
   - Vapor pressure, latent heat of vaporization
   
5. **Acetone (CH₃COCH₃)** - Liquid, Gas phases
   - Nail polish remover, solvent
   - Flammability, volatility data
   
6. **Acetic Acid (CH₃COOH)** - Solid, Liquid, Gas phases
   - Vinegar (5% solution), industrial chemical
   - All phase transitions with complete data
   
7. **Hydrogen Peroxide (H₂O₂)** - Liquid, Gas phases
   - Disinfectant, bleach, industrial oxidizer
   - Decomposition to water and oxygen
   
8. **Methane (CH₄)** - Liquid, Gas phases
   - Natural gas, biogas
   - Cryogenic properties (liquefied natural gas)
   
9. **Propane (C₃H₈)** - Liquid, Gas phases
   - Cooking gas, barbecue fuel, heating
   - High flammability, pressure data
   
10. **Isopropyl Alcohol (C₃H₈O)** - Liquid, Gas phases
    - Rubbing alcohol, sanitizer, solvent
    - Flammable, vapor pressure data
    
11. **Glycerin (C₃H₈O₃)** - Liquid phase
    - Skin moisturizer, food additive, viscous liquid
    - High boiling point (290°C)
    
12. **Sucrose (C₁₂H₂₂O₁₁)** - Solid, Liquid phases
    - Table sugar, food sweetener
    - Melting at 186°C, caramelization at higher temps

   - Phases: liquid (most common), gas
   - Boiling point: 78.37°C (lower than water)

2. **Acetic Acid (Vinegar 5%)** - CH₃COOH
   - Use: cooking, cleaning
   - Phases: liquid (aqueous solution), pure liquid, gas
   - Boiling point: 118°C (higher than water)

3. **Ammonia (Cleaning Solution)** - NH₃
   - Use: cleaning products, fertilizer
   - Phases: gas (at room temp), aqueous solution (ammonia water)
   - Boiling point: -33°C (very low!)

4. **Hydrogen Peroxide** - H₂O₂
   - Use: disinfectant, bleach alternative
   - Phases: liquid (aqueous 3% solution), pure liquid
   - Boiling point: 150°C (decomposes)

5. **Methane (Natural Gas)** - CH₄
   - Use: cooking fuel, heating
   - Phases: gas (standard), liquid (compressed)
   - Boiling point: -161°C (cryogenic)

6. **Propane (Grill Gas)** - C₃H₈
   - Use: BBQ grills, portable stoves, heating
   - Phases: gas (at room temp), liquid (compressed in tanks)
   - Boiling point: -42°C

7. **Acetone (Nail Polish Remover)** - C₃H₆O
   - Use: solvent, cleaning
   - Phases: liquid, gas
   - Boiling point: 56°C (very volatile)

8. **Isopropyl Alcohol (Rubbing Alcohol)** - C₃H₇OH
   - Use: disinfectant, cleaning electronics
   - Phases: liquid, gas
   - Boiling point: 82.5°C

9. **Glycerin/Glycerol** - C₃H₈O₃
   - Use: soaps, lotions, food sweetener
   - Phases: liquid (viscous)
   - Boiling point: 290°C (very high, thick liquid)

10. **Sucrose (Table Sugar)** - C₁₂H₂₂O₁₁
    - Use: sweetener, preservative
    - Phases: solid (crystals), aqueous solution
    - Melting point: 186°C (caramelizes), no boiling point (decomposes)

**Implementation Plan:**
- [ ] Create info.json for each compound with element references
- [ ] Create phase state files (liquid/gas as appropriate)
- [ ] Add Antoine coefficients for vapor pressure calculations
- [ ] Include safety/educational notes for each compound

---

### Priority 3: Extend substanceLoader.js (Optional Advanced Feature)
**Location:** `src/data/substances/compounds/h2o/`
**Files:** `info.json`, `solid/state.json`, `liquid/state.json`, `gas/state.json`

**h2o/info.json Content:**
```json
{
  "id": "h2o",
  "type": "compound",
  "name": "Water",
  "aliases": ["Oxidane", "Hydrogen Oxide"],
  "chemicalFormula": "H₂O",
  "explicitSmiles": "O",
  "molarMass": 18.015,
  "deltaHf": -285.83,
  "deltaGf": -237.13,
  
  "elements": [
    {
      "symbol": "H",
      "atomicNumber": 1,
      "count": 2,
      "reference": "periodic-table/001_nonmetal_H.json"
    },
    {
      "symbol": "O",
      "atomicNumber": 8,
      "count": 1,
      "reference": "periodic-table/008_nonmetal_O.json"
    }
  ],
  
  "phaseTransitions": {
    "meltingPoint": 0,
    "boilingPoint": 100,
    "triplePoint": {
      "temperature": 0.01,
      "pressure": 0.00603
    },
    "criticalPoint": {
      "temperature": 373.95,
      "pressure": 220.64,
      "density": 0.322
    }
  },
  
  "states": ["solid", "liquid", "gas"],
  "lastUpdated": "2026-01-27"
}
```

**h2o/solid/state.json (Ice):**
```json
{
  "compoundId": "h2o",
  "phase": "solid",
  "phaseName": "ice",
  "density": {
    "value": 0.917,
    "unit": "kg/L",
    "temperature": 0,
    "pressure": 1.0,
    "note": "Ice is less dense than liquid water (anomaly)"
  },
  "specificHeat": {
    "value": 2.05,
    "unit": "J/(g·°C)",
    "temperature": 0,
    "source": "measured"
  },
  "thermalConductivity": {
    "value": 2.24,
    "unit": "W/(m·K)",
    "temperature": 0
  },
  "latentHeatOfFusion": {
    "value": 334,
    "unit": "kJ/kg",
    "note": "Energy required to melt ice to water at 0°C"
  },
  "volumetricExpansionCoefficient": {
    "value": 0.000050,
    "unit": "1/K",
    "note": "Ice expands when frozen; 9% larger volume than liquid water"
  },
  "compressibility": {
    "value": 0.000011,
    "unit": "1/Pa"
  },
  "electricalConductivity": {
    "value": 0.00055,
    "unit": "S/m",
    "temperature": 20,
    "note": "Pure water is a poor conductor. Distilled water even lower (~0.0001 S/m).",
    "applicationUse": "Shows baseline; compare to saltwater (5.0 S/m) to understand electrolytes"
  },
  "reference": "h2o/info.json"
}
```

**h2o/liquid/state.json (Water):**
```json
{
  "compoundId": "h2o",
  "phase": "liquid",
  "phaseName": "water",
  "density": {
    "value": 1.0,
    "unit": "kg/L",
    "temperature": 20,
    "pressure": 1.0,
    "maxDensityTemperature": 3.98,
    "volumetricExpansionCoefficient": 0.000207,
    "note": "Dynamic: use expansion coefficient to calculate density at other T"
  },
  "specificHeat": {
    "value": 4.186,
    "unit": "J/(g·°C)",
    "temperature": 20,
    "source": "measured"
  },
  "thermalConductivity": {
    "value": 0.6,
    "unit": "W/(m·K)",
    "temperature": 20
  },
  "latentHeatOfVaporization": {
    "value": 2257,
    "unit": "kJ/kg",
    "note": "Energy required to boil water to steam at 100°C"
  },
  "compressibility": {
    "value": 0.000450,
    "unit": "1/Pa",
    "note": "How much density changes under pressure (use for high-altitude inverse)"
  },
  "antoineCoefficients": {
    "A": 8.07131,
    "B": 1730.63,
    "C": 233.426,
    "TminC": 1,
    "TmaxC": 100,
    "formula": "log10(Pvap) = A - B/(C + T)",
    "unit": "Pressure in mmHg, Temperature in °C",
    "note": "Predicts vapor pressure of liquid water (used for boiling at altitude)"
  },
  "electricalConductivity": {
    "value": 0.00055,
    "unit": "S/m",
    "temperature": 20,
    "note": "Pure water is a poor conductor",
    "applicationUse": "Shows baseline; any dissolved ions dramatically increase conductivity"
  },
  "reference": "h2o/info.json"
}
```

**h2o/gas/state.json (Steam):**
```json
{
  "compoundId": "h2o",
  "phase": "gas",
  "phaseName": "steam",
  "density": {
    "value": 0.000597,
    "unit": "kg/L",
    "temperature": 100,
    "pressure": 1.0,
    "note": "Dynamic: use Ideal Gas Law (PV=nRT) to calculate density at other T/P"
  },
  "idealGasLaw": {
    "molarMass": 18.015,
    "unit": "g/mol",
    "formula": "ρ = (P × M) / (R × T)",
    "gasConstant": 8.314,
    "note": "For any T/P, calculate density dynamically instead of storing table"
  },
  "specificHeat": {
    "value": 2.0,
    "unit": "J/(g·°C)",
    "temperature": 100,
    "note": "Cp at constant pressure"
  },
  "thermalConductivity": {
    "value": 0.024,
    "unit": "W/(m·K)",
    "temperature": 100
  },
  "antoineCoefficients": null,
  "electricalConductivity": {
    "value": 0.00001,
    "unit": "S/m",
    "temperature": 100,
    "note": "Steam as a gas has negligible conductivity; no dissolved ions"
  },
  "note": "Antoine equation is for liquid vapor pressure. Steam is a gas and follows gas laws.",
  "reference": "h2o/info.json"
}
```

---

### Priority 3: Extend substanceLoader.js (Optional Advanced Feature)
**Status:** Deferred (using hybrid shortcut approach)
**Note:** Elements are referenced in compounds but not dynamically loaded. Phase state files contain all needed values directly (precomputed shortcut). This is sufficient for current gameplay.

#### 3.1 Add Element Loading (Future Enhancement)
- [ ] loadElement(elementId)  loads from periodic-table/{elementId}.json
- [ ] Add caching to avoid re-reading

#### 2.2 Add Compound Assembly Logic
- [ ] loadCompound(compoundId)  loads info.json + resolves composition
- [ ] Calls loadElement() for each element; validates SMILES string
- [ ] Add composition validation

#### 2.3 Add Phase-Specific Property Assembly
- [ ] loadSubstancePhase(compoundId, phase)  loads phase state file
- [ ] Calls loadCompound() + merges phase-specific props
- [ ] Returns combined object for physics engine

#### 2.4 Add Fallback/Shortcut Logic (Hybrid Approach)
- [ ] If phase state file has precomputed specificHeat, use it (no math)
- [ ] If missing, optionally compute from elemental Cp values (future)
- [ ] Flag: source: "measured" vs. "derived"

#### 2.5 Update Validation Schema
- [ ] Extend alidateSubstanceData() for new thermodynamic fields
- [ ] Make electronegativity, entropy, Antoine coeff optional

---

### Priority 3: Integrate substanceLoader with Physics Engine
**Status:** Not started

#### 3.1 Update Physics.js to Use Loader Output
- [ ] Ensure compatibility with existing luidProps object
- [ ] Add Antoine vapor-pressure calculation (phase 2)

#### 3.2 Update GameScene to Use New Loader
- [ ] Replace loadFluid('water') with loadSubstancePhase('h2o', 'liquid')
- [ ] Keep backward-compatible API

#### 3.3 Test Phase Transitions with Proper Data
- [ ] Verify ice  water  steam use correct latent heats from JSON
- [ ] Test boiling point at different altitudes

---

### Priority 4: Hybrid Data Approach (Precomputed + Optional Derivation)
**Status:** Design phase

#### 4.1 Precomputed Properties in Compound/Phase Files
- [ ] Add optional fields for "fast path": specificHeat, thermalConductivity, Antoine
- [ ] Allow missing  trigger "advanced mode" fallback (compute from elements)
- [ ] Metadata flag: source: "measured" vs. "derived"

#### 4.2 Document When to Use Shortcut vs. Compute
- [ ] For simple game: use precomputed values
- [ ] For chemistry student: offer "show derivation"

---

### Priority 5: Fix Level 2 Workshop Dropdown (Blocking)
**Status:** Not started

- [ ] Debug blank dropdown on Level 2 selection
- [ ] Verify getWorkshopsByLevel(2) returns level-2-placeholder
- [ ] Test filtering logic and cache behavior

---

### Priority 6: Documentation & Extensibility
**Status:** Not started

- [ ] Create SUBSTANCE_STRUCTURE.md guide (add element, compound, mixture)
- [ ] Create example: Ethanol (CHOH)
- [ ] Update substanceLoader.js JSDoc with examples
- [ ] Document precomputed vs. derived fields

---

## Next Session Context
- **Renamed:** fluidLoader.js  substanceLoader.js (backward compatible)
- **Dev server:** Ready at http://localhost:3000/
- **Architecture:** Hybrid  precomputed shortcuts + optional element-driven derivation
- **Upcoming:** Periodic-table integration, extended thermodynamic properties, Antoine vapor pressure
- **Note:** TODO_NEXT_SESSION.md was duplicate; deleted

## Session Notes
- SMILES stored for reference/validation; composition explicit (no SMILES parsing required)
- Universal constants in src/constants/physics.js
- Physics engine agnostic to data source; consumes fluidProps from loader
- First implementation: HO only; extend to other fluids after validation
