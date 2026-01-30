# Room Environment & Atmospheric System

> **Status:** Planning phase (pre-implementation)
> **Scope:** Modular room state, AC/scrubber parts, experiment scorecard
> **Target Integration:** Post-Level-3 (future experiments with planetary/chemical scenarios)

---

## 📋 OVERVIEW

Boiling Water will expand beyond fixed ambient conditions. Players will control room environments (AC, scrubbers), introduce substances, and observe how room state affects experiments. End-of-experiment scorecard shows what happened to both the experiment AND the room.

**Key Features:**
- Dynamic room temperature (PID-controlled AC)
- Air composition tracking (O₂, N₂, CO₂, H₂O vapor, toxic gases, etc.)
- Endothermic/exothermic reactions affecting room heat
- Heat/composition logging throughout experiment
- End-of-experiment data sheet (downloadable CSV/JSON)
- Finish Experiment button for non-quantitative experiment completion

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

## 🔧 MODULAR AC UNIT SYSTEM

### AC Unit Part File
**Location:** `src/data/room-parts/ac-units/{name}.json`

```javascript
{
  "id": "ac-mk1-standard",
  "name": "Standard AC Unit MK1",
  "version": "1.0.0",
  "description": "Laboratory-grade AC with basic PID temperature control",
  
  "thermalCharacteristics": {
    "coolingMaxWatts": -2500,  // Negative = removes heat
    "heatingMaxWatts": 1500,   // Positive = adds heat (resistive heater)
    "responseTimeSeconds": 5,  // Time to reach 63% of target delta (tau)
    "deadbandDegrees": 0.5     // No action if within this of setpoint
  },
  
  "pidTuning": {
    "proportionalGain": 50,    // Kp: stronger response to error
    "integralGain": 2,         // Ki: eliminate steady-state error
    "derivativeGain": 10,      // Kd: dampen oscillations
    "integralWindupLimit": 100 // Prevent runaway integral
  },
  
  "constraints": {
    "minSetpoint": 15,   // °C (won't go below)
    "maxSetpoint": 28,   // °C (won't go above)
    "maxRateOfChange": 2 // °C/sec (realistic ramp, not instant)
  },
  
  "operatingModes": {
    "cooling": true,
    "heating": true,
    "autoSwitch": true  // Automatically switch based on setpoint vs room temp
  },
  
  "powerDraw": 800,  // Watts (for future energy tracking)
  "reliability": 0.99,  // Uptime assumption
  "serviceLife": 10000  // Hours before maintenance
}
```

### AC Unit Handler (Runtime)
**Location:** `src/utils/acUnitHandler.js`

```javascript
/**
 * Apply PID-controlled AC heating/cooling to room temperature
 * @param {number} roomTemp - Current room temperature (°C)
 * @param {number} setpoint - AC target temperature (°C)
 * @param {object} acPart - AC unit configuration (from JSON)
 * @param {object} pidState - Current PID state (Kp, Ki, Kd values)
 * @param {number} deltaTime - Time step (seconds)
 * @returns {object} { newTemp: °C, heatOutput: Watts, updatedPidState: {...} }
 */
export function applyAcControl(roomTemp, setpoint, acPart, pidState, deltaTime) {
  // Calculate error
  const error = setpoint - roomTemp  // + if room too cold, - if too hot
  
  // PID terms
  const proportional = error * acPart.pidTuning.proportionalGain
  const integral = (pidState.integral + error * deltaTime) * acPart.pidTuning.integralGain
  const derivative = ((error - pidState.previousError) / deltaTime) * acPart.pidTuning.derivativeGain
  
  // Clamp integral to prevent windup
  const clampedIntegral = Math.max(
    -acPart.pidTuning.integralWindupLimit,
    Math.min(acPart.pidTuning.integralWindupLimit, pidState.integral + error * deltaTime)
  )
  
  // Total PID output (-1 to +1)
  const pidOutput = (proportional + integral + derivative) / 100
  
  // Map to actual watts
  let heatOutput = 0
  if (pidOutput > 0) {
    heatOutput = pidOutput * acPart.thermalCharacteristics.heatingMaxWatts
  } else {
    heatOutput = pidOutput * Math.abs(acPart.thermalCharacteristics.coolingMaxWatts)
  }
  
  // Apply max rate of change constraint
  const maxChange = acPart.constraints.maxRateOfChange * deltaTime
  const tempChange = (heatOutput / roomHeatCapacity) * deltaTime
  const constrainedTempChange = Math.max(-maxChange, Math.min(maxChange, tempChange))
  
  return {
    newTemp: roomTemp + constrainedTempChange,
    heatOutput: heatOutput,
    updatedPidState: {
      proportional,
      integral: clampedIntegral,
      derivative,
      previousError: error
    }
  }
}
```

---

## 💨 MODULAR AIR HANDLER/SCRUBBER SYSTEM

### Air Handler Part File
**Location:** `src/data/room-parts/air-handlers/{name}.json`

```javascript
{
  "id": "air-handler-mk1-standard",
  "name": "Standard Air Handler MK1",
  "version": "1.0.0",
  "description": "Laboratory air scrubber with filtration and exchange",
  
  "exchangeCharacteristics": {
    "maxAirExchangeRatePerHour": 6,  // Room volumes/hour
    "filterCapacity": 1000,  // Hours before replacement needed
    "filterState": 1000  // Current hours remaining
  },
  
  "filtrationEfficiency": {
    "CO2": 0.95,  // Remove 95% of CO2 over time
    "H2O": 0.80,  // Remove 80% of moisture
    "NH3": 0.98,  // Remove 98% of ammonia
    "CH4": 0.85,
    "toxic_generic": 0.90,  // Fallback for unknown contaminants
    "particulates": 0.99
  },
  
  "targetComposition": {
    "N2": 0.78,
    "O2": 0.21,
    "Ar": 0.01,
    "CO2": 0.0004,
    "H2O_vapor": 0.005,
    "other": 0
  },
  
  "operatingModes": {
    "standby": { exchangePercent: 0 },
    "low": { exchangePercent: 25 },
    "medium": { exchangePercent: 50 },
    "high": { exchangePercent: 100 }
  },
  
  "powerDraw": 120,  // Watts at full
  "noiseLevel": 65,  // dB (for future immersion)
  "costPerReplacement": 500  // Currency units (for future progression)
}
```

### Air Handler (Runtime)
**Location:** `src/utils/airHandlerScrubber.js`

```javascript
/**
 * Apply scrubber/air handler to room composition
 * @param {object} composition - Current air composition (fractions)
 * @param {object} airHandlerPart - Air handler config (from JSON)
 * @param {number} roomVolume - Room volume (m³)
 * @param {number} deltaTime - Time step (seconds)
 * @param {string} operatingMode - 'standby' | 'low' | 'medium' | 'high'
 * @returns {object} { newComposition: {...}, contaminantsRemoved: {...} }
 */
export function applyScrubber(composition, airHandlerPart, roomVolume, deltaTime, operatingMode) {
  const modeConfig = airHandlerPart.operatingModes[operatingMode]
  const effectiveExchangeRate = 
    (airHandlerPart.exchangeCharacteristics.maxAirExchangeRatePerHour / 3600) *
    (modeConfig.exchangePercent / 100)
  
  const volumeExchanged = effectiveExchangeRate * roomVolume * deltaTime
  const exchangeFraction = Math.min(1, volumeExchanged / roomVolume)
  
  // For each species, apply filtration
  const newComposition = {}
  const contaminantsRemoved = {}
  
  for (const [species, fraction] of Object.entries(composition)) {
    const targetFraction = airHandlerPart.targetComposition[species] || 0
    const efficiency = airHandlerPart.filtrationEfficiency[species] || 0.5
    
    // Mixed air = current + (target - current) * exchange * efficiency
    const adjustmentTowardTarget = (targetFraction - fraction) * exchangeFraction * efficiency
    newComposition[species] = fraction + adjustmentTowardTarget
    contaminantsRemoved[species] = fraction - newComposition[species]
  }
  
  return {
    newComposition,
    contaminantsRemoved
  }
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

### Phase 1: Foundation (Hidden from UI)
- [ ] Create `src/utils/roomEnvironment.js` (state + integrator)
- [ ] Create `src/utils/acUnitHandler.js` (PID controller)
- [ ] Create `src/utils/airHandlerScrubber.js` (composition updater)
- [ ] Add `src/data/room-parts/ac-units/standard-mk1.json`
- [ ] Add `src/data/room-parts/air-handlers/standard-mk1.json`
- [ ] Hook room temperature into physics simulation
- [ ] Track heat/composition logs in GameScene state

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

**Last Updated:** 2026-01-29  
**Author:** Planning Phase  
**Status:** Ready for implementation discussion

