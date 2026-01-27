# Project TODO  Periodic-Table-Driven Substance Architecture

##  Completed (This Session)
- [x] Renamed luidLoader.js  substanceLoader.js (future-proof for solids/gases/mixtures)
- [x] Added compatibility aliases for backward compatibility
- [x] Updated all imports in GameScene to use new loader API
- [x] Updated documentation refs across copilot-instructions.md, REFACTORING_SUMMARY.md, etc.
- [x] Deleted duplicate TODO_NEXT_SESSION.md

##  Completed (Previous Sessions)
- [x] Effects system fully implemented (steam, flame glow, water stream)  all opt-in per theme
- [x] Theme system locked down and extensible (workshop JSON structure with level filtering)
- [x] Level 1 workshop system working (pre-alpha-kitchen-1, pre-alpha-kitchen-2, alpha-kitchen)
- [x] Level 1 experiments structured (boiling-water, altitude-effect, different-fluids)

---

## CURRENT SPRINT: Periodic-Table-Driven Substance Architecture

### Priority 1: Build Data Structure for Periodic Table + Compounds
**Status:** Planning  Implementation

#### 1.1 Create Element (Periodic Table) JSON Files
**Location:** `src/data/substances/periodic-table/`
**Filename:** `{atomicNumber:03d}_{elementCategory}_{symbol}.json`
- Examples: `001_nonmetal_H.json`, `008_nonmetal_O.json`, `017_halogen_Cl.json`

**Content Specification:**
```json
{
  "atomicNumber": 1,
  "symbol": "H",
  "name": "Hydrogen",
  "elementCategory": "nonmetal",
  "chemicalBlock": "s",
  "valenceElectrons": 1,
  "oxidationStates": [1, -1],
  "standardUsed": "iupac",
  
  "nist": {
    "atomicMass": 1.00794,
    "electronegativity": 2.20,
    "ionizationEnergy": 1312.0,
    "atomicRadius": 37,
    "electronAffinity": 72.8,
    "standardMolarEntropy": 130.57,
    "specificHeatCapacity": 14.3,
    "source": "NIST Chemistry WebBook 2024"
  },
  
  "iupac": {
    "atomicMass": 1.008,
    "electronegativity": 2.20,
    "ionizationEnergy": 1312.0,
    "atomicRadius": 37,
    "electronAffinity": 72.8,
    "standardMolarEntropy": 130.57,
    "specificHeatCapacity": 14.3,
    "source": "IUPAC Periodic Table 2024"
  },
  
  "lastUpdated": "2026-01-27"
}
```
**Units:** atomicMass (u), electronegativity (Pauling), ionizationEnergy (kJ/mol), atomicRadius (pm), electronAffinity (kJ/mol), entropy (J/(mol·K)), specificHeat (J/(g·°C))

- [ ] Create 6 core elements: `001_nonmetal_H.json`, `008_nonmetal_O.json`, `006_nonmetal_C.json`, `007_nonmetal_N.json`, `011_metal_Na.json`, `017_halogen_Cl.json`

#### 1.2 Create Compound: Water (H₂O) — Pure Liquid Reference
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

- [ ] Create all 4 files: `h2o/info.json`, `h2o/solid/state.json`, `h2o/liquid/state.json`, `h2o/gas/state.json`

#### 1.3 Create Compound: Saltwater (3% NaCl by mass) — Electrolyte Reference
**Location:** `src/data/substances/compounds/saltwater-3pct/`
**Files:** `info.json`, `liquid/state.json`

**saltwater-3pct/info.json Content:**
```json
{
  "id": "saltwater-3pct",
  "type": "mixture",
  "name": "Saltwater (3% NaCl by mass)",
  "aliases": ["Brackish Water", "Salt Solution", "Saline"],
  "description": "Homogeneous aqueous solution of sodium chloride",
  "concentration": {
    "solute": "NaCl",
    "soluteSmiles": "[Na+].[Cl-]",
    "percentByMass": 3.0,
    "molarConcentration": 0.513
  },
  
  "components": [
    {
      "id": "h2o",
      "name": "Water",
      "smiles": "O",
      "role": "solvent",
      "massFraction": 0.97,
      "reference": "compounds/h2o/info.json"
    },
    {
      "id": "nacl",
      "name": "Sodium Chloride",
      "smiles": "[Na+].[Cl-]",
      "role": "solute",
      "massFraction": 0.03,
      "reference": "compounds/nacl/info.json"
    }
  ],
  
  "effectOfDissolution": {
    "boilingPointElevation": 0.16,
    "meltingPointDepression": -0.10,
    "osmioticPressure": "increases with concentration"
  },
  
  "phaseTransitions": {
    "meltingPoint": -0.10,
    "boilingPoint": 100.16,
    "triplePoint": {
      "temperature": -0.05,
      "pressure": 0.006,
      "note": "Approximation; actual value depends on solute concentration"
    },
    "criticalPoint": {
      "temperature": 374.0,
      "pressure": 220.7,
      "note": "Nearly identical to pure water; dissolved ions have minimal effect"
    }
  },
  
  "phases": {
    "liquid": "saltwater"
  },
  "states": ["liquid"],
  "note": "At standard conditions, saltwater only exists as liquid. Freezing/boiling involves phase separation.",
  "lastUpdated": "2026-01-27"
}
```

**saltwater-3pct/liquid/state.json (Enhanced with Electrolyte Properties):**
```json
{
  "compoundId": "saltwater-3pct",
  "phase": "liquid",
  "phaseName": "saltwater",
  "density": {
    "value": 1.0212,
    "unit": "kg/L",
    "temperature": 20,
    "pressure": 1.0,
    "volumetricExpansionCoefficient": 0.000207,
    "note": "3% salt increases density by ~2.1% compared to pure water"
  },
  "specificHeat": {
    "value": 3.93,
    "unit": "J/(g·°C)",
    "temperature": 20,
    "source": "measured",
    "note": "Lower than pure water (~4.186 J/g°C); dissolved ions reduce specific heat"
  },
  "thermalConductivity": {
    "value": 0.61,
    "unit": "W/(m·K)",
    "temperature": 20,
    "note": "Slightly higher than pure water; salt ions conduct heat"
  },
  "latentHeatOfVaporization": {
    "value": 2412,
    "unit": "kJ/kg",
    "note": "Higher than pure water (~2257 kJ/kg); dissolved salt requires more energy to vaporize"
  },
  "compressibility": {
    "value": 0.000440,
    "unit": "1/Pa",
    "note": "Slightly less compressible than pure water due to dissolved ions"
  },
  "antoineCoefficients": {
    "A": 8.08386,
    "B": 1750.286,
    "C": 235.0,
    "TminC": 0,
    "TmaxC": 110,
    "formula": "log10(Pvap) = A - B/(C + T)",
    "unit": "Pressure in mmHg, Temperature in °C",
    "note": "Modified Antoine curve; salt **lowers** vapor pressure (Raoult's Law). Boiling point elevated by ~0.16°C at 3% concentration."
  },
  "ionicStrength": {
    "value": 0.513,
    "unit": "mol/L",
    "formula": "I = 0.5 × Σ(ci × zi²)",
    "note": "Na⁺ and Cl⁻ each contribute; used in advanced activity coefficient models"
  },
  "electricalConductivity": {
    "value": 5.0,
    "unit": "S/m",
    "temperature": 20,
    "range": [4.8, 5.2],
    "note": "3% NaCl makes water an electrolyte. Pure water: ~0.0005 S/m. Salt dissociates into conducting ions (Na⁺ and Cl⁻).",
    "applicationUse": "Sensors, electrolysis simulations, conductivity probes, safety (risk of electrical hazards). 10,000x more conductive than pure water!"
  },
  "vanThoffFactor": {
    "value": 1.9,
    "formula": "i = number of particles per solute molecule",
    "theoretical": 2.0,
    "actual": 1.9,
    "note": "NaCl ideally dissociates into 2 ions (Na⁺ + Cl⁻), but real solutions show i=1.9 due to ion-pairing and electrostatic effects.",
    "applicationUse": "Calculate colligative properties: ΔTb = i × Kb × m (boiling point elevation), ΔTf = i × Kf × m (freezing point depression), osmotic pressure = i × M × R × T"
  },
  "saturationPoint": {
    "value": 357,
    "unit": "g/L",
    "temperature": 25,
    "solute": "NaCl",
    "molarConcentration": 6.1,
    "note": "Maximum concentration of NaCl that can dissolve in water at 25°C. Beyond this, crystals precipitate.",
    "currentConcentration": 30,
    "currentConcentrationUnit": "g/L",
    "percentOfSaturation": 8.4,
    "applicationUse": "If player evaporates water or adds more salt, track when crystallization begins. Spawn NaCl(s) at bottom of container when saturation is exceeded."
  },
  "reference": "saltwater-3pct/info.json"
}
```

- [ ] Create files: `saltwater-3pct/info.json`, `saltwater-3pct/liquid/state.json`

#### 1.4 Create Additional Mixture Templates (Optional for Phase 2)
- [ ] Tap-water (mixed minerals)
- [ ] Saltwater-35pct (seawater equivalent)
- [ ] Alcohol-water mixtures

---

### Priority 2: Extend substanceLoader.js to Assemble from Periodic Table
**Status:** Not started

#### 2.1 Add Element Loading
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
