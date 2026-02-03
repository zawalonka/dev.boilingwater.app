# Room Environment & Atmospheric System

> **Status:** ✅ Phase 1 COMPLETE (2026-02-01)  
> **Scope:** Modular room state, AC/scrubber parts, closed-system physics, experiment scorecard
> **Target Integration:** L1E4+ (Room Control experiment unlocks AC/handler dropdowns)
> **See:** [COMPLETED_TODOS.md](COMPLETED_TODOS.md) - Room Environment Phase 1 section

---

## 📋 OVERVIEW

Boiling Water will expand beyond fixed ambient conditions. Players will control room environments (AC, scrubbers), introduce substances, and observe how room state affects experiments. The room is a **closed system** where:

- **Experiment → Room**: Boiling substances release vapor into room air (changes composition + pressure)
- **Room → Experiment**: Room pressure affects boiling point (feedback loop)
- **Equipment → Room**: AC controls temperature, air handlers filter/scrub composition

**Key Features:**
- Dynamic room temperature (PID-controlled AC)
- Air composition tracking (O₂, N₂, CO₂, H₂O vapor, toxic gases, etc.)
- Pressure feedback loop (vapor release → pressure rise → boiling point shift)
- Endothermic/exothermic reactions affecting room heat
- Heat/composition logging throughout experiment
- End-of-experiment data sheet (downloadable CSV/JSON)
- Finish Experiment button for non-quantitative experiment completion

---

## 📁 FILE STRUCTURE

```
public/assets/workshops/{workshop}/
├── workshop.json           ← Theme/colors/images (no equipment)
├── effects.json            ← Optional visual effects
├── room.json               ← Room config + equipment references
├── burners/
│   ├── basic-2000w.json    ← Basic burner definition
│   └── pro-5000w.json      ← Upgraded burner
├── ac-units/
│   ├── basic-1500w.json    ← AC unit definition
│   └── pro-3000w.json      ← Upgraded AC unit
└── air-handlers/
    ├── basic-150cfm.json   ← Air handler definition
    └── pro-350cfm.json     ← Upgraded air handler
```

Each workshop has its own equipment. Initially all workshops share identical configs, but can diverge later (alpha-kitchen may have better burner, etc.).

**Note:** Burner wattageSteps currently in workshop.json will be migrated to burner JSON files.

**Current Workshop Equipment:**
| Workshop | Burner | Notes |
|----------|--------|-------|
| `alpha-kitchen` | `pro-5000w` | 9 heat settings, button controls |
| `pre-alpha-kitchen-1` | `basic-2000w` | 4 heat settings, knob control |
| `pre-alpha-kitchen-2` | `basic-2000w` | 4 heat settings, knob control |
| `level-2-placeholder` | `basic-2000w` | 4 heat settings, knob control |

---

## 🏠 ROOM.JSON (Per Workshop)

**Location:** `public/assets/workshops/{workshop}/room.json`

```json
{
  "room": {
    "volumeM3": 30,
    "initialTempC": 20,
    "leakRatePaPerSecond": 10,
    "heatCapacityJPerC": 36000
  },
  
  "atmosphere": {
    "N2": 0.78,
    "O2": 0.21,
    "Ar": 0.0093,
    "CO2": 0.0004,
    "H2O": 0.01
  },
  
  "pressureMode": "location",
  "pressureModeNote": "Code overrides to sealevel for L1E1 tutorial",
  
  "availableBurners": ["basic-2000w", "pro-5000w"],
  "availableAcUnits": ["basic-1500w", "pro-3000w"],
  "availableAirHandlers": ["basic-150cfm", "pro-350cfm"],
  
  "defaults": {
    "burner": "basic-2000w",
    "acUnit": "basic-1500w",
    "airHandler": "basic-150cfm",
    "airHandlerMode": "medium"
  }
}
```

### Pressure Mode Logic (Runtime)
The `pressureMode` in room.json is the **default** for the workshop. Code overrides based on experiment:

| Experiment | Effective Mode | Behavior |
|------------|----------------|----------|
| L1E1 (Tutorial) | `sealevel` | Always 101325 Pa (code override) |
| L1E2+ | `location` | Use player's altitude selection |
| Planetary labs | `custom` | Use room.initialPressurePa |

**Implementation:** In physics calculation, check `activeExperiment`:
```javascript
const effectivePressureMode = activeExperiment === 'boiling-water' ? 'sealevel' : room.pressureMode
```

### Pressure Mode Values
| Mode | Behavior | Use Case |
|------|----------|----------|
| `"sealevel"` | Always 101325 Pa | Tutorial (forced via code) |
| `"location"` | Use player's altitude selection | L1E2+ |
| `"custom"` | Use `room.initialPressurePa` | Planetary labs |

---

## 🏗️ DATA MODEL

### Room Environment State
```javascript
{
  // Physical space
  roomVolume: 30,  // m³ (typical small lab)
  
  // Temperature control
  roomTemperature: 20,  // °C (current)
  acTargetTemperature: 20,  // °C (setpoint)
  acPidState: {
    proportional: 0,
    integral: 0,
    derivative: 0,
    previousError: 0
  },
  
  // Pressure (for future planetary labs)
  roomPressure: 101325,  // Pa (standard atmosphere)
  
  // Air composition (by volume fraction or partial pressure)
  composition: {
    N2: 0.78,
    O2: 0.21,
    Ar: 0.01,
    CO2: 0.0004,
    H2O_vapor: 0.01,  // humidity
    // Later: CH4, NH3, toxic gases, etc.
  },
  
  // Scrubber/air handler target
  scrubberTargetComposition: {
    N2: 0.78,
    O2: 0.21,
    Ar: 0.01,
    CO2: 0.0004,
    H2O_vapor: 0.005  // target humidity
  },
  
  // Historical tracking
  heatLog: [
    { timestamp: 0, source: 'experiment_burner', watts: 2000 },
    { timestamp: 1, source: 'experiment_burner', watts: 2000 },
    { timestamp: 2, source: 'ac_cooling', watts: -150 },
    // Endothermic: { source: 'reaction_dissolution', watts: -300 }
  ],
  compositionLog: [
    { timestamp: 0, composition: {...} },
    { timestamp: 10, composition: {...} }
  ],
  
  // Safety/alert tracking
  alerts: [
    { timestamp: 5, severity: 'warning', message: 'CO2 rising above 1%' },
    { timestamp: 12, severity: 'critical', message: 'Oxygen depleted below 18%' }
  ]
}
```

---

## � BURNER FILES (Per Workshop)

### Burner Part File
**Location:** `public/assets/workshops/{workshop}/burners/{name}.json`

### Basic Burner: `basic-2000w.json`
```json
{
  "id": "basic-2000w",
  "name": "Basic 2kW Burner",
  "description": "Standard kitchen burner with 4 heat settings",
  
  "thermalCharacteristics": {
    "maxWatts": 2000,
    "minWatts": 0,
    "efficiencyPercent": 85
  },
  
  "wattageSteps": [0, 500, 1000, 2000],
  
  "constraints": {
    "warmupTimeSeconds": 2,
    "cooldownTimeSeconds": 5
  }
}
```

### Upgraded Burner: `pro-5000w.json`
```json
{
  "id": "pro-5000w",
  "name": "Pro 5kW Burner",
  "description": "Professional burner with 9 precise heat settings",
  
  "thermalCharacteristics": {
    "maxWatts": 5000,
    "minWatts": 0,
    "efficiencyPercent": 92
  },
  
  "wattageSteps": [0, 500, 1000, 1500, 2000, 2500, 3000, 4000, 5000],
  
  "constraints": {
    "warmupTimeSeconds": 1,
    "cooldownTimeSeconds": 3
  }
}
```

---

## �🔧 AC UNIT FILES (Per Workshop)

### AC Unit Part File
**Location:** `public/assets/workshops/{workshop}/ac-units/{name}.json`

### Basic AC Unit: `basic-1500w.json`
```json
{
  "id": "basic-1500w",
  "name": "AC 1.5kW",
  "description": "Basic kitchen/lab AC with simple PID temperature control",
  
  "thermalCharacteristics": {
    "coolingMaxWatts": 1500,
    "heatingMaxWatts": 800,
    "responseTimeSeconds": 8,
    "deadbandDegrees": 1.0
  },
  
  "pidTuning": {
    "Kp": 50,
    "Ki": 2,
    "Kd": 10,
    "integralWindupLimit": 100
  },
  
  "constraints": {
    "minSetpointC": 15,
    "maxSetpointC": 28,
    "maxRateOfChangePerSec": 1
  }
}
```

### Upgraded AC Unit: `pro-3000w.json`
```json
{
  "id": "pro-3000w",
  "name": "AC 3kW Pro",
  "description": "Professional-grade AC with tighter PID control and wider range",
  
  "thermalCharacteristics": {
    "coolingMaxWatts": 3000,
    "heatingMaxWatts": 1500,
    "responseTimeSeconds": 4,
    "deadbandDegrees": 0.5
  },
  
  "pidTuning": {
    "Kp": 80,
    "Ki": 4,
    "Kd": 15,
    "integralWindupLimit": 150
  },
  
  "constraints": {
    "minSetpointC": 10,
    "maxSetpointC": 35,
    "maxRateOfChangePerSec": 2
  }
}
```

---

## 💨 AIR HANDLER FILES (Per Workshop)

### Air Handler Part File
**Location:** `public/assets/workshops/{workshop}/air-handlers/{name}.json`

### Basic Air Handler: `basic-150cfm.json`
```json
{
  "id": "basic-150cfm",
  "name": "AHU 150 CFM",
  "description": "Basic air handler for small kitchens/labs",
  
  "flowCharacteristics": {
    "maxFlowRateCFM": 150,
    "maxFlowRateM3PerHour": 255
  },
  
  "filtrationEfficiency": {
    "CO2": 0.80,
    "H2O": 0.70,
    "NH3": 0.85,
    "CH4": 0.75,
    "C2H5OH": 0.80,
    "toxic_generic": 0.75
  },
  
  "targetComposition": {
    "N2": 0.78,
    "O2": 0.21,
    "Ar": 0.0093,
    "CO2": 0.0004,
    "H2O": 0.01
  },
  
  "operatingModes": {
    "off": { "flowPercent": 0 },
    "low": { "flowPercent": 25 },
    "medium": { "flowPercent": 50 },
    "high": { "flowPercent": 100 }
  }
}
```

### Upgraded Air Handler: `pro-350cfm.json`
```json
{
  "id": "pro-350cfm",
  "name": "AHU 350 CFM",
  "description": "Professional air handler with HEPA filtration",
  
  "flowCharacteristics": {
    "maxFlowRateCFM": 350,
    "maxFlowRateM3PerHour": 595
  },
  
  "filtrationEfficiency": {
    "CO2": 0.95,
    "H2O": 0.90,
    "NH3": 0.98,
    "CH4": 0.90,
    "C2H5OH": 0.95,
    "toxic_generic": 0.92
  },
  
  "targetComposition": {
    "N2": 0.78,
    "O2": 0.21,
    "Ar": 0.0093,
    "CO2": 0.0004,
    "H2O": 0.005
  },
  
  "operatingModes": {
    "off": { "flowPercent": 0 },
    "low": { "flowPercent": 25 },
    "medium": { "flowPercent": 50 },
    "high": { "flowPercent": 100 },
    "turbo": { "flowPercent": 120 }
  }
}
```

---

## 🔥 VAPOR RELEASE & PRESSURE FEEDBACK

### Closed System Physics
When a substance boils, vapor is released into the room:

```javascript
// Mass evaporated (kg) → moles added to room
molesAdded = massEvaporatedKg / molarMassKgPerMol

// Update room composition
composition[substanceId] += molesAdded / totalMolesInRoom

// Update pressure (ideal gas law: P = nRT/V)
newPressurePa = (totalMoles * R * tempK) / volumeM3
```

### Pressure Feedback Loop
```
Higher room pressure → Higher boiling point → Slower boil
Lower room pressure → Lower boiling point → Faster boil
```

### Safety Alerts
| Condition | Alert Level | Message |
|-----------|-------------|---------|
| O₂ < 19.5% | Warning | "Low oxygen" |
| O₂ < 16% | Critical | "Oxygen depletion - dangerous!" |
| CO₂ > 1% | Warning | "High CO₂" |
| NH₃ > 25ppm | Critical | "Toxic: Ammonia detected!" |
| Pressure > 110kPa | Warning | "Room overpressure" |
| Pressure > 120kPa | Critical | "Dangerous overpressure!" |

---

## 🎮 EXPERIMENT UNLOCK PROGRESSION

| Experiment | Unlocks | pressureMode | Flag |
|------------|---------|--------------|------|
| L1E1 (Tutorial) | Basic controls | `"sealevel"` | `isTutorial: true` |
| L1E2 (Altitude) | Location selector | `"location"` | `requiresLocation: true` |
| L1E3 (Fluids) | Fluid dropdown | `"location"` | - |
| **L1E4 (Dangerous Liquids)** | **AC + Air Handler dropdowns** | `"location"` | `unlocksRoomControls: true` |

**Implementation:** Check experiment flags in `EXPERIMENTS` constant (src/constants/workshops.js).

---

## 🏗️ RUNTIME STATE MODEL

### Room Environment State (In-Memory)
```javascript
{
  // Physical space
  roomVolume: 30,  // m³ (from room.json)
  
  // Temperature control
  roomTemperature: 20,  // °C (current)
  acTargetTemperature: 20,  // °C (setpoint)
  acPidState: {
    proportional: 0,
    integral: 0,
    derivative: 0,
    previousError: 0
  },
  
  // Pressure (from room.json pressureMode)
  roomPressure: 101325,  // Pa
  
  // Air composition (by volume fraction)
  composition: {
    N2: 0.78,
    O2: 0.21,
    Ar: 0.0093,
    CO2: 0.0004,
    H2O: 0.01,
  },
  
  // Historical tracking
  heatLog: [
    { timestamp: 0, source: 'experiment_burner', watts: 2000 },
    { timestamp: 2, source: 'ac_cooling', watts: -150 },
  ],
  compositionLog: [
    { timestamp: 0, composition: {...} },
    { timestamp: 10, composition: {...} }
  ],
  
  // Safety/alert tracking
  alerts: [
    { timestamp: 5, severity: 'warning', message: 'CO2 rising above 1%' },
  ]
}
```

---

## 🔧 RUNTIME UTILITY FUNCTIONS

### AC Controller
**Location:** `src/utils/acUnitHandler.js`

```javascript
/**
 * Apply PID-controlled AC heating/cooling to room temperature
 * @param {number} roomTemp - Current room temperature (°C)
 * @param {number} setpoint - AC target temperature (°C)
 * @param {object} acUnit - AC unit configuration (from JSON)
 * @param {object} pidState - Current PID state
 * @param {number} deltaTime - Time step (seconds)
 * @returns {object} { newTemp, heatOutput, updatedPidState }
 */
export function applyAcControl(roomTemp, setpoint, acUnit, pidState, deltaTime) {
  const error = setpoint - roomTemp
  
  const { Kp, Ki, Kd, integralWindupLimit } = acUnit.pidTuning
  const proportional = error * Kp
  const integral = Math.max(-integralWindupLimit, 
    Math.min(integralWindupLimit, pidState.integral + error * deltaTime)) * Ki
  const derivative = ((error - pidState.previousError) / deltaTime) * Kd
  
  const pidOutput = (proportional + integral + derivative) / 100
  
  let heatOutput = pidOutput > 0
    ? pidOutput * acUnit.thermalCharacteristics.heatingMaxWatts
    : pidOutput * acUnit.thermalCharacteristics.coolingMaxWatts
  
  const maxChange = acUnit.constraints.maxRateOfChangePerSec * deltaTime
  const tempChange = Math.max(-maxChange, Math.min(maxChange, 
    (heatOutput / 36000) * deltaTime))  // 36000 J/°C for 30m³ room
  
  return {
    newTemp: roomTemp + tempChange,
    heatOutput,
    updatedPidState: { proportional, integral, derivative, previousError: error }
  }
}
```

### Air Handler / Scrubber
**Location:** `src/utils/airHandlerScrubber.js`

```javascript
/**
 * Apply scrubber/air handler to room composition
 * @param {object} composition - Current air composition (fractions)
 * @param {object} airHandler - Air handler config (from JSON)
 * @param {number} roomVolume - Room volume (m³)
 * @param {number} deltaTime - Time step (seconds)
 * @param {string} operatingMode - 'off' | 'low' | 'medium' | 'high'
 * @returns {object} { newComposition, contaminantsRemoved }
 */
export function applyScrubber(composition, airHandler, roomVolume, deltaTime, operatingMode) {
  const flowPercent = airHandler.operatingModes[operatingMode]?.flowPercent || 0
  const effectiveFlow = (airHandler.flowCharacteristics.maxFlowRateM3PerHour / 3600) 
    * (flowPercent / 100)
  
  const exchangeFraction = Math.min(1, (effectiveFlow * deltaTime) / roomVolume)
  
  const newComposition = {}
  const contaminantsRemoved = {}
  
  for (const [species, fraction] of Object.entries(composition)) {
    const target = airHandler.targetComposition[species] || 0
    const efficiency = airHandler.filtrationEfficiency[species] || 0.5
    const adjustment = (target - fraction) * exchangeFraction * efficiency
    newComposition[species] = fraction + adjustment
    contaminantsRemoved[species] = -adjustment
  }
  
  return { newComposition, contaminantsRemoved }
}
```

---

## 🔥 ENDOTHERMIC/EXOTHERMIC REACTION TRACKING

### Reaction Heat Model (In Substance JSON)
**Location:** `src/data/substances/compounds/{id}/info.json`

```javascript
{
  // ... existing substance data ...
  
  "reactions": {
    "dissolution": {
      "enthalpy": -6.0,  // kJ/mol (negative = exothermic, releases heat)
      "description": "Dissolving NaCl in water is endothermic"
    },
    "vaporization": {
      "enthalpy": 40.7,  // kJ/mol (positive = endothermic, absorbs heat)
      "description": "Water evaporation absorbs heat from surroundings"
    },
    "neutralization": {
      "enthalpy": -55.8,  // kJ/mol (exothermic)
      "description": "Acid-base reaction releases significant heat"
    }
  }
}
```

### Heat Tracking in Simulation
**Location:** `src/utils/physics.js` (expanded)

```javascript
/**
 * Apply endothermic/exothermic effects to room temperature
 * @param {number} reactionEnthalpyKJ - Heat released (positive) or absorbed (negative)
 * @param {number} roomVolume - Room volume (m³)
 * @param {number} roomHeatCapacity - Room air heat capacity (J/°C)
 * @returns {number} Temperature change (°C)
 */
export function applyReactionHeatToRoom(reactionEnthalpyKJ, roomVolume, roomHeatCapacity) {
  const reactionHeatJ = reactionEnthalpyKJ * 1000
  const tempChange = reactionHeatJ / roomHeatCapacity
  return tempChange
}
```

---

## 📊 EXPERIMENT SCORECARD

### Scorecard Data Structure
**Generated at experiment completion**

```javascript
{
  "experimentId": "altitude-effect",
  "experimentName": "Altitude's Effect on Boiling Water",
  "timestamp": "2026-01-29T14:32:00Z",
  
  // Experiment results
  "experiment": {
    "substance": "water",
    "altitude": 5000,
    "pressure": 54000,  // Pa
    "boilingPoint": 83.5,  // °C
    "timeToBoil": 245,  // seconds
    "heatApplied": 2000,  // Watts
    "waterEvaporated": 0.15,  // kg
    "finalTemperature": 83.5  // °C
  },
  
  // Room state changes
  "room": {
    "startTemperature": 20,  // °C
    "endTemperature": 22.3,  // °C (heated by burner)
    "totalHeatAdded": 490000,  // Joules (from all sources)
    "totalHeatRemoved": 85000,  // Joules (from AC)
    "netHeatChange": 405000,  // Joules
    
    "composition": {
      "start": { N2: 0.78, O2: 0.21, Ar: 0.01, CO2: 0.0004, H2O: 0.01 },
      "end": { N2: 0.78, O2: 0.21, Ar: 0.01, CO2: 0.0008, H2O: 0.05 }  // More moisture from boiling
    },
    
    "alerts": [
      { timestamp: 120, severity: 'info', message: 'Room humidity rising (steam)' },
      { timestamp: 245, severity: 'info', message: 'Boiling detected' }
    ]
  },
  
  // Performance metrics
  "metrics": {
    "efficiency": 0.78,  // How well the experiment ran
    "sustainability": 0.65,  // How well the room handled it
    "score": 72  // 0-100 overall
  },
  
  // Player notes (optional)
  "notes": "Tried altitude of 5000m to see boiling point change"
}
```

### Scorecard Rendering
**Location:** `src/components/ExperimentScorecard.jsx` (new)

- Display all experiment results
- Show room state before/after
- Display heat/composition logs as graphs
- Download as CSV or JSON
- Show alerts and warnings

---

## 🎮 CONTROL PANEL ADDITIONS

### Finish Experiment Button
**Location:** `src/components/ControlPanel.jsx` (new section)

```jsx
{/* Finish Experiment Button - appears when experiment achievable but not auto-complete */}
{liquidMass > 0 && activeExperiment !== 'boiling-water' && (
  <button 
    className="action-button finish-button"
    onClick={handleFinishExperiment}
  >
    ✓ Finish Experiment
  </button>
)}
```

### AC Controls (Hidden for now, UI template ready)
**Location:** `src/components/RoomControls.jsx` (future)

```jsx
<div className="room-controls">
  <label>AC Setpoint:</label>
  <input type="range" min="15" max="28" value={acSetpoint} />
  
  <label>Air Handler:</label>
  <select value={airHandlerMode}>
    <option value="standby">Off</option>
    <option value="low">Low</option>
    <option value="medium">Medium</option>
    <option value="high">High</option>
  </select>
</div>
```

---

## 🗺️ IMPLEMENTATION ROADMAP

### ✅ Phase 1: Foundation (COMPLETE)
**Completed:** 2026-02-01

- [x] Create `src/utils/roomEnvironment.js` (state + integrator)
- [x] Create `src/utils/acUnitHandler.js` (PID controller)
- [x] Create `src/utils/airHandlerScrubber.js` (composition updater)
- [x] Create `src/hooks/useRoomEnvironment.js` (React hook)
- [x] Add room.json to each workshop (`public/assets/workshops/{workshop}/room.json`)
- [x] Add burner files (`public/assets/workshops/{workshop}/burners/*.json`)
- [x] Add AC unit files (`public/assets/workshops/{workshop}/ac-units/*.json`)
- [x] Add air handler files (`public/assets/workshops/{workshop}/air-handlers/*.json`)
- [x] Migrate burner wattageSteps from workshop.json to burner JSONs
- [x] Update workshopLoader.js to load room.json + equipment files
- [x] Create `src/components/RoomControls.jsx` (UI panel)
- [x] Hook room temperature into physics simulation
- [x] Track heat/composition logs in GameScene state
- [x] Progressive unlock (L1E4+ only)
- [x] Vapor release → room composition
- [x] Pressure feedback loop (room pressure affects boiling point)

### Phase 2: Display & Control
- [ ] Create `src/components/ExperimentScorecard.jsx`
- [ ] Add "Finish Experiment" button to ControlPanel
- [ ] Implement scorecard download (CSV/JSON)
- [ ] Add end-of-experiment modal (triggered after boiling or manual finish)

### Phase 3: UI Enhancements
- [ ] Add Room Controls panel (AC setpoint, air handler mode)
- [ ] Display live heat/composition graphs during experiment
- [ ] Show room alerts and warnings
- [ ] Add room state sidebar

### Phase 4: Extended Content
- [ ] Planetary lab templates (Mars, Venus, alien methane atmosphere)
- [ ] Substance-specific reactions (endothermic/exothermic)
- [ ] AC/scrubber upgrades and progression
- [ ] Failure scenarios (AC breaks, filter clogs, toxin buildup)

---

## 📝 NOTES FOR IMPLEMENTATION

**PID Tuning:** Start conservative (Kp=50, Ki=2, Kd=10). Adjust if oscillations appear.

**Heat Capacity:** Room air ~1200 J/m³·°C. For 30m³: ~36,000 J/°C.

**Composition Units:** Use volume fractions (0.0–1.0 per species). Later switch to partial pressures if needed for precision.

**Logging Strategy:** Store heat/composition at configurable interval (every timestep or every 10 steps) to avoid log bloat.

**Scorecard Timing:** Generate when user clicks "Finish Experiment" or when auto-complete triggers (boiling point reached).

---

**Last Updated:** 2026-01-31  
**Author:** Planning Phase  
**Status:** Ready for implementation

