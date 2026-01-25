# Water States System - Architecture Overview

## Files Created

```
src/data/fluids/
├── h2o.json          (Chemical compound definition)
├── water.json        (Liquid state - references h2o)
├── ice.json          (Solid state - references h2o)
└── steam.json        (Gaseous state - references h2o)
```

## Structure Design

### h2o.json - Chemical Compound Base Definition
The **parent** definition for all H₂O states containing:
- Chemical formula and molecular mass (18.015 g/mol)
- Element composition (2× H, 1× O)
- Critical thermodynamic points:
  - **Triple Point**: 273.16 K (0.01°C) - all three states coexist
  - **Critical Point**: 647.096 K (374°C) - distinction between liquid/gas disappears
- All three states listed with cross-references
- Biological significance and abundance data
- Historical and educational context

### water.json - Liquid H₂O
**Liquid state** with "compound": "h2o" reference containing:
- Phase-specific properties:
  - Specific heat: 4.186 J/(g·°C)
  - Heat of vaporization: 2257 kJ/kg
  - Density: 1.0 kg/L (reference state)
  - Thermal conductivity: 0.606 W/(m·K)
  - Viscosity: 0.001002 Pa·s
  - Surface tension: 0.0728 N/m
- Phase transitions to/from ice and steam
- Biological properties (osmolarity, pH)
- Environmental data (ocean temperature, evaporation rates)

### ice.json - Solid H₂O
**Solid state** with "compound": "h2o" reference containing:
- Phase-specific properties:
  - Specific heat: 2.09 J/(g·°C) (lower than water)
  - Heat of fusion: 334 kJ/kg
  - Density: 0.917 kg/L (**less dense than water** - floats!)
  - Thermal conductivity: 2.24 W/(m·K) (much higher than water)
  - Melting point: 0°C (pressure-dependent)
- Crystal structure: Hexagonal ice (Ice Ih)
- Special properties:
  - **Anomalous expansion**: 9% volume increase when freezing
  - **Regelation**: Melts under pressure, refreezes when pressure released
  - **Sliding friction**: Ice skating phenomenon
- Environmental data:
  - Glacial ice (up to 4 km deep, 800,000+ years old)
  - Permafrost (permanently frozen ground)
  - Sea ice and snowflakes
- Geological significance

### steam.json - Gaseous H₂O
**Gaseous state** with "compound": "h2o" reference containing:
- Phase-specific properties:
  - Specific heat: 2.01 J/(g·°C)
  - Density: 0.598 kg/m³ (1667× less dense than liquid)
  - Thermal conductivity: 0.0261 W/(m·K) (poor conductor)
  - Viscosity: 0.0000122 Pa·s (very low)
  - Highly compressible
- Vapor properties:
  - Saturation (in equilibrium with liquid)
  - Superheating (above saturation temperature)
  - Invisibility distinction (vapor vs. visible droplets)
- Thermodynamic properties:
  - Latent heat of vaporization: 2257 kJ/kg
  - Clausius-Clapeyron relationship
- Industrial applications:
  - Steam turbines for power generation (35-40% efficiency)
  - Sterilization in autoclaves
  - Food processing and cooking
  - District heating systems
- Safety hazards:
  - Severe burns from condensation heat release
  - Invisible superheated steam danger
  - Pressure rupture explosions
- Atmospheric and climate significance:
  - Water vapor (0-4% atmosphere)
  - Greenhouse gas effects
  - Cloud formation and precipitation

## Cross-Reference Pattern

Each state file uses:
```json
{
  "id": "water|ice|steam",
  "name": "Water (Liquid H₂O)|Ice (Solid H₂O)|Steam (Gaseous H₂O)",
  "state": "liquid|solid|gas",
  "compound": "h2o",
  "properties": { ... state-specific properties ... }
}
```

## Extensibility for Future Elements/Compounds

This architecture supports a periodic table approach:

```
src/data/
├── compounds/           (Future)
│   ├── h2o.json        (Chemical compounds)
│   ├── ch4.json        (Methane)
│   ├── c2h6.json       (Ethane)
│   └── ...
├── elements/           (Future)
│   ├── H.json          (Hydrogen - atomic number 1)
│   ├── O.json          (Oxygen - atomic number 8)
│   ├── C.json          (Carbon - atomic number 6)
│   └── ...
└── fluids/             (Current)
    ├── h2o.json        (Base compound)
    ├── water.json      (Liquid H₂O)
    ├── ice.json        (Solid H₂O)
    ├── steam.json      (Gaseous H₂O)
    ├── ethanol.json    (Future)
    └── ...
```

## Educational Value

### States of Matter Study
Students can interactively explore:
- **Solid → Liquid**: Melting (334 kJ/kg energy required)
- **Liquid → Gas**: Vaporization (2257 kJ/kg energy required)
- **Solid → Gas**: Sublimation (2591 kJ/kg energy required)
- **Gas → Liquid**: Condensation (releases 2257 kJ/kg heat)
- **Liquid → Solid**: Freezing (releases 334 kJ/kg heat)

### Thermodynamic Concepts
- Phase diagrams (pressure-temperature relationships)
- Triple point: Where all three states coexist at precise conditions
- Critical point: Beyond which liquid/gas distinction disappears
- Latent heat vs. sensible heat
- Heat transfer coefficients and cooling rates
- Newton's Law of Cooling (exponential decay)

### Real-World Applications
- Why ice floats (anomalous expansion, critical for aquatic life)
- Why steam burns are worse than hot water (latent heat release)
- How pressure cookers work (higher pressure → higher boiling point)
- Power generation (steam turbines)
- Sterilization (autoclaves)
- Climate and water cycle (atmospheric water vapor, clouds, precipitation)

### Comparative Analysis
Easy to compare properties across states:

| Property | Ice | Water | Steam |
|----------|------|-------|-------|
| Density | 0.917 | 1.0 | 0.598 (mg/m³) |
| Specific Heat | 2.09 | 4.186 | 2.01 J/(g·°C) |
| Thermal Conductivity | 2.24 | 0.606 | 0.0261 W/(m·K) |
| Viscosity | N/A | 0.001 | 0.000012 Pa·s |

## Data Completeness

Each state file includes:
- ✅ Thermodynamic properties
- ✅ Phase transition energies
- ✅ Physical constants
- ✅ Environmental data
- ✅ Industrial applications
- ✅ Safety information
- ✅ Educational notes
- ✅ Cross-references to other states
- ✅ Biological/chemical significance

## Loading and Usage

```javascript
// Load any state of H2O
const water = await loadFluid('water')
const ice = await loadFluid('ice')
const steam = await loadFluid('steam')

// Or load the compound definition
const h2o = await loadFluid('h2o')

// Parse for game physics
const waterProps = parseFluidProperties(water)
```

The system is now fully prepared for:
1. ✅ Demonstrating all states of water
2. ✅ Adding other compounds (ethanol, methane, etc.)
3. ✅ Building a periodic table of elements
4. ✅ Comparing properties across different substances
5. ✅ Teaching thermodynamics and phase transitions

---
**Commit**: 3a4c2df  
**Date**: January 24, 2026
