# Issue #3: Massive Monolithic Component Files

**Severity:** 🔴 Critical  
**Status:** ❌ Poor design  
**Priority:** P0 - Blocks maintainability  
**Effort:** 3-4 weeks

---

## What It Means

Your [GameScene.jsx](../../src/components/GameScene.jsx) is **1857 lines** — larger than most entire projects. It handles 15+ separate concerns at once, making it impossible to understand, test, or modify safely.

```javascript
// Current structure:
<GameScene>  // ← 1857 lines doing EVERYTHING
  ├─ Physics simulation loop
  ├─ Pot dragging & positioning
  ├─ Burner heat control
  ├─ Water filling logic
  ├─ Location/altitude UI
  ├─ Room environment state
  ├─ Effects/VFX management
  ├─ Boiling detection
  ├─ Educational popups
  ├─ Timer controls
  ├─ Speed controls
  ├─ Experiment stats tracking
  ├─ Temperature display
  └─ ... 20+ more concerns
```

This is called a **"god component"** — it knows and does too much. Industry standard: **components should be 100-300 lines**.

---

## Why It's Critical

### Problem 1: Unmaintainability

**Reading GameScene.jsx:**
```
Line 1-100:     Imports and setup
Line 100-200:   State declarations (50+ useState hooks)
Line 200-400:   Effects and side effects (4+ useEffect hooks)
Line 400-600:   Event handlers (20+ functions)
Line 600-800:   Derived state calculations
Line 800-1200:  Render logic (JSX)
Line 1200-1857: More render logic
```

**To understand ONE feature**, you must read the entire file and trace state through 50+ variables.

```javascript
// If you want to understand "what happens when pot touches sink?"
// You need to find:
const [waterInPot, setWaterInPot] = useState(0)           // Line 147
const [residueMass, setResidueMass] = useState(0)         // Line 154
const [temperature, setTemperature] = useState(...)       // Line 157
const [liquidMass, ...] = Math.max(0, waterInPot - residueMass)  // Line 898

// Then trace through:
const handlePointerMove = (e) => { ... }                  // Line 1235
  const inWaterStream = ...                               // Line 1289
  if (inWaterStream && liquidMass < 0.1) {               // Line 1294
    setWaterInPot(GAME_CONFIG.DEFAULT_WATER_MASS)        // Line 1297
    // ... 5 more state updates
  }

// Then find the effect that runs this:
useEffect(() => { ... }, [isDragging, ...])              // Line 650

// All to answer one question: "how does refilling work?"
```

**With smaller components:**
```javascript
// <WaterStream /> component handles this ONE job
export function WaterStream({ potPosition, onPotFilled }) {
  const handlePointerMove = (e) => {
    if (inWaterStream && potMass < 0.1) {
      onPotFilled()  // ← Single responsibility
    }
  }
  return <div ...>Stream animation</div>
}

// All logic in one 80-line file, crystal clear
```

### Problem 2: Testing Nightmare

You **cannot unit test** a 1857-line component. To test one feature, you'd have to:

```javascript
// To test "boiling detection":
import GameScene from './GameScene'

describe('GameScene boiling detection', () => {
  it('should set isBoiling when temp reaches boiling point', () => {
    // How do you mount GameScene?
    // It requires 20+ props:
    const props = {
      stage: 0,
      location: { altitude: 0 },
      workshopLayout: { /* 50+ properties */ },
      workshopImages: { /* 4+ images */ },
      workshopEffects: { /* complex config */ },
      burnerConfig: { /* complex config */ },
      roomConfig: { /* complex config */ },
      acUnitConfig: { /* complex config */ },
      airHandlerConfig: { /* complex config */ },
      activeLevel: 1,
      activeExperiment: 'boiling-water',
      showSelectors: false,
      onStageChange: jest.fn(),
      onWaterBoiled: jest.fn(),
      onSkipTutorial: jest.fn(),
      onLevelChange: jest.fn(),
      onExperimentChange: jest.fn(),
      hasBoiledBefore: false,
      onLocationChange: jest.fn(),
      onEquipmentChange: jest.fn(),
    }
    
    const { getByText } = render(<GameScene {...props} />)
    
    // Now you're rendering 1857 lines of code just to test boiling detection
    // You're also testing pot dragging, effects, room environment, etc.
    // Your test is slow and fragile
  })
})
```

**With split components:**
```javascript
// Test just the boiling detection
import { BoilingDetector } from './BoilingDetector'

describe('BoilingDetector', () => {
  it('should detect boiling at target temperature', () => {
    const { getByText } = render(
      <BoilingDetector 
        temperature={85}
        boilingPoint={84.5}
        onBoiling={jest.fn()}
      />
    )
    expect(getByText('Water is boiling!')).toBeInTheDocument()
  })
})

// 3-line test, runs in < 100ms, tests ONLY boiling detection
```

### Problem 3: Props Drilling Hell

All state must flow down through props:

```jsx
// App.jsx
<GameScene
  stage={stage}
  location={userLocation}
  workshopLayout={activeWorkshopData?.layout}
  workshopImages={activeWorkshopData?.images}
  workshopEffects={activeWorkshopData?.effects}
  burnerConfig={activeWorkshopData?.burnerConfig}
  roomConfig={activeWorkshopData?.room}
  acUnitConfig={activeWorkshopData?.acUnit}
  airHandlerConfig={activeWorkshopData?.airHandler}
  activeLevel={activeLevel}
  activeExperiment={activeExperiment}
  showSelectors={showSelectors}
  onStageChange={handleStageChange}
  onWaterBoiled={handleWaterBoiled}
  onSkipTutorial={handleSkipTutorial}
  onLevelChange={handleLevelChange}
  onExperimentChange={handleExperimentChange}
  hasBoiledBefore={hasBoiledBefore}
  onLocationChange={handleLocationChange}
  onEquipmentChange={handleEquipmentChange}
/>

// GameScene receives all 19 props, then internally:

// <BoilingDetector> buried inside needs onWaterBoiled
function BoilingDetector() {
  return <PopupContent onWaterBoiled={onWaterBoiled} />
}

// <LocationPopup> buried inside needs location, onLocationChange
function LocationPopup() {
  return <Modal onLocationChange={onLocationChange} />
}

// Props drilling: 1-2-3-4+ levels deep
```

---

## Current Catastrophic Structure

### GameScene.jsx State Variables (50+)

```javascript
// Physical state
const [waterInPot, setWaterInPot] = useState(0)
const [residueMass, setResidueMass] = useState(0)
const [temperature, setTemperature] = useState(GAME_CONFIG.ROOM_TEMPERATURE)

// Fluid properties
const [fluidProps, setFluidProps] = useState(null)
const [fluidLoadError, setFluidLoadError] = useState(null)
const [activeFluid, setActiveFluid] = useState(DEFAULT_SUBSTANCE)
const [availableFluids, setAvailableFluids] = useState([])

// Burner control
const [burnerHeat, setBurnerHeat] = useState(0)

// Time control
const [timeSpeed, setTimeSpeed] = useState(1)
const [isTimerRunning, setIsTimerRunning] = useState(false)
const [timeElapsed, setTimeElapsed] = useState(0)

// Boiling state
const [isBoiling, setIsBoiling] = useState(false)
const [hasShownBoilPopup, setHasShownBoilPopup] = useState(false)
const [showHook, setShowHook] = useState(false)
const [boilTime, setBoilTime] = useState(0)
const [timePotOnFlame, setTimePotOnFlame] = useState(null)
const [burnerHeatWhenBoiled, setBurnerHeatWhenBoiled] = useState(0)
const [boilStats, setBoilStats] = useState(null)

// Pause/replay
const [pauseTime, setPauseTime] = useState(false)
const [showNextLevelButton, setShowNextLevelButton] = useState(false)

// Pot positioning
const [potPosition, setPotPosition] = useState({ x: 75, y: 45 })
const [isDragging, setIsDragging] = useState(false)
const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
const [sceneDimensions, setSceneDimensions] = useState({ width: 0, height: 0 })

// Location/altitude
const [userZipCode, setUserZipCode] = useState('')
const [userCountry, setUserCountry] = useState('USA')
const [manualAltitude, setManualAltitude] = useState('')
const [editableAltitude, setEditableAltitude] = useState(null)
const [hasSetLocation, setHasSetLocation] = useState(...)
const [isLoadingLocation, setIsLoadingLocation] = useState(false)
const [locationError, setLocationError] = useState(null)
const [locationName, setLocationName] = useState(...)
const [showLocationPopup, setShowLocationPopup] = useState(false)

// Room environment (L1E4+)
// ... plus room state from hook (another 10+ pieces of state)
```

### GameScene.jsx Effects (4 major)

```javascript
useEffect(() => { /* Load substance properties */ }, [activeFluid, workshopLayout])
useEffect(() => { /* Initialize game window dimensions */ }, [])
useEffect(() => { /* Physics simulation loop (500 lines!) */ }, [...20 dependencies])
useEffect(() => { /* Room environment simulation */ }, [roomControlsEnabled, ...])
```

**The physics simulation effect alone is 500 lines!**

### GameScene.jsx Event Handlers (20+)

```javascript
handleFluidChange()          // Switch substance
handlePointerDown()          // Start dragging pot
handlePointerMove()          // Drag pot around (100+ lines)
handlePointerUp()            // Stop dragging
handleBurnerKnob()           // Cycle burner heat
handleHeatDown()             // Decrease heat
handleHeatUp()               // Increase heat
handleSpeedUp()              // Speed up time
handleSpeedDouble()          // Double speed
handleSpeedHalve()           // Half speed
handleQuickPause()           // Pause
handleTimerToggle()          // Start/stop timer
handleTimerReset()           // Reset timer
handleLearnMore()            // Go to results screen
handleNextProgression()      // Go to next experiment
handleSearchLocation()        // Search for location (60+ lines)
handleSetManualAltitude()    // Enter manual altitude
handleFindMyLocation()       // Use browser geolocation
handleResetLocation()        // Clear location
// ... plus 5 room environment handlers (AC, air handler, etc.)
```

---

## The Right Structure (After Refactor)

```
GameScene/
├── GameScene.jsx             (300 lines) - Orchestrator component
│   Responsibilities:
│   - Layout & composition of sub-components
│   - Shared state management
│   - Experiment lifecycle
│
├── GameWindow/
│   ├── GameWindow.jsx        (400 lines) - Canvas & rendering
│   ├── Pot/
│   │   ├── Pot.jsx           (120 lines)
│   │   ├── PotDrag.js        (100 lines) - Dragging logic
│   │   └── WaterFill.js      (80 lines) - Sink interaction
│   ├── Burner/
│   │   ├── Burner.jsx        (100 lines)
│   │   ├── BurnerKnob.jsx    (80 lines)
│   │   └── Flame.jsx         (100 lines)
│   ├── WaterStream/
│   │   └── WaterStream.jsx   (150 lines) - Pouring animation
│   └── Effects/
│       ├── SteamParticles.jsx (120 lines)
│       ├── FlameGlow.jsx      (80 lines)
│       └── effectsConfig.js   (40 lines)
│
├── ControlPanel/             (200 lines)
│   ├── ControlPanel.jsx
│   ├── BurnerControls/
│   │   └── BurnerControls.jsx (100 lines)
│   ├── SpeedControls/
│   │   └── SpeedControls.jsx (80 lines)
│   └── TimerControls/
│       └── TimerControls.jsx (80 lines)
│
├── LocationPopup/            (300 lines)
│   ├── LocationPopup.jsx
│   ├── LocationSearch.jsx    (150 lines)
│   ├── ManualAltitude.jsx    (80 lines)
│   └── GeolocationButton.jsx (50 lines)
│
├── BoilingPopup/             (250 lines)
│   ├── BoilingPopup.jsx
│   ├── BoilStats.jsx         (120 lines)
│   └── ProgressionButtons.jsx (80 lines)
│
├── RoomControls/             (150 lines)
│   ├── RoomControls.jsx
│   ├── AcControl.jsx         (80 lines)
│   └── AirHandlerControl.jsx (70 lines)
│
└── hooks/
    ├── useGamePhysics.js     (400 lines) - Physics simulation
    ├── useRoomEnvironment.js (existing)
    ├── usePotDragging.js     (100 lines) - Pot interaction
    ├── useLocationPopup.js   (80 lines) - Location logic
    └── useBoilingDetection.js (80 lines) - Boiling detection
```

**Total: 1857 → 2000+ lines, but distributed across 30+ files**

Each file has ONE job and is testable independently.

---

## Before and After: Concrete Example

### Current: Handling Pot Refill (Buried in 1857 lines)

```javascript
// src/components/GameScene.jsx - Lines 1289-1310

const handlePointerMove = (e) => {
  if (!isDragging || !sceneRef.current) return

  const sceneRect = sceneRef.current.getBoundingClientRect()
  let newX = e.clientX - sceneRect.left - dragOffset.x
  let newY = e.clientY - sceneRect.top - dragOffset.y

  let newXPercent = (newX / sceneDimensions.width) * 100
  let newYPercent = (newY / sceneDimensions.height) * 100

  newXPercent = Math.max(8, Math.min(newXPercent, 92))
  newYPercent = Math.max(8, Math.min(newYPercent, 92))

  setPotPosition({ x: newXPercent, y: newYPercent })

  // AUTO-FILL logic buried here
  const inWaterStream =
    newXPercent >= layout.waterStream.xRange[0] &&
    newXPercent <= layout.waterStream.xRange[1] &&
    newYPercent >= layout.waterStream.yRange[0] &&
    newYPercent <= layout.waterStream.yRange[1]
  
  if (inWaterStream && liquidMass < 0.1) {
    const fillMass = GAME_CONFIG.DEFAULT_WATER_MASS
    const nonVolatileFraction = fluidProps?.nonVolatileMassFraction ?? 0
    setWaterInPot(fillMass)
    setResidueMass(fillMass * nonVolatileFraction)
    setTemperature(ambientTemperature)
    setIsBoiling(false)
    setHasShownBoilPopup(false)
    setBurnerHeatWhenBoiled(0)
  }
}
```

**Problems:**
- Buried in massive function
- 7 state updates scattered
- Hard to test
- Hard to modify

### After: Pot Refill as Separate Component

```javascript
// src/components/GameWindow/WaterStream/WaterStream.jsx (80 lines)

export function WaterStream({ 
  potPosition, 
  liquidMass, 
  layout, 
  fluidProps, 
  ambientTemperature,
  onPotFilled 
}) {
  const inWaterStream =
    potPosition.x >= layout.waterStream.xRange[0] &&
    potPosition.x <= layout.waterStream.xRange[1] &&
    potPosition.y >= layout.waterStream.yRange[0] &&
    potPosition.y <= layout.waterStream.yRange[1]

  // Effect that handles pot refill
  useEffect(() => {
    if (inWaterStream && liquidMass < 0.1) {
      onPotFilled({
        waterMass: GAME_CONFIG.DEFAULT_WATER_MASS,
        residueMass: (fluidProps?.nonVolatileMassFraction ?? 0) * GAME_CONFIG.DEFAULT_WATER_MASS,
        temperature: ambientTemperature,
      })
    }
  }, [inWaterStream, liquidMass, onPotFilled, ...])

  if (!inWaterStream) return null

  return (
    <div className="water-stream" style={{...}}>
      💧 Pouring water
    </div>
  )
}
```

```javascript
// src/components/GameScene.jsx - Much simpler now (300 lines)

function GameScene(props) {
  const [waterInPot, setWaterInPot] = useState(0)
  const [temperature, setTemperature] = useState(...)
  // ... other state

  const handlePotFilled = (filledState) => {
    setWaterInPot(filledState.waterMass)
    setResidueMass(filledState.residueMass)
    setTemperature(filledState.temperature)
    setIsBoiling(false)
    setHasShownBoilPopup(false)
  }

  return (
    <GameWindow>
      <Pot position={potPosition} />
      <WaterStream 
        potPosition={potPosition}
        liquidMass={liquidMass}
        onPotFilled={handlePotFilled}
      />
    </GameWindow>
  )
}
```

**Benefits:**
- ✅ WaterStream logic in one 80-line file
- ✅ Easy to test independently
- ✅ Easy to modify or debug
- ✅ Reusable
- ✅ GameScene reduced by 100+ lines

---

## Testing: Before vs After

### Can't Test Current GameScene

```javascript
// ❌ Impossible to test boiling detection in isolation
describe('GameScene boiling detection', () => {
  it('should show boiling popup when temp reaches BP', () => {
    const { getByText } = render(<GameScene {...huge_props} />)
    
    // You're now rendering the entire game with all 1857 lines
    // The test is slow, fragile, and tests many unrelated features
    // If the test fails, you don't know why (could be any of 20 systems)
  })
})
```

### Can Test Refactored Components

```javascript
// ✅ Test boiling detection in isolation
import { BoilingDetector } from './BoilingDetector'

describe('BoilingDetector', () => {
  it('should show boiling popup when temp reaches BP', () => {
    const { getByText } = render(
      <BoilingDetector
        temperature={85}
        boilingPoint={84.5}
        fluidName="Water"
        onBoiling={jest.fn()}
      />
    )
    expect(getByText('Water is boiling!')).toBeInTheDocument()
  })

  it('should not show popup if already shown', () => {
    const { queryByText } = render(
      <BoilingDetector
        temperature={85}
        boilingPoint={84.5}
        alreadyShown={true}
        onBoiling={jest.fn()}
      />
    )
    expect(queryByText('Water is boiling!')).not.toBeInTheDocument()
  })

  it('should handle edge case: boiling point exactly matches temp', () => {
    const { getByText } = render(
      <BoilingDetector
        temperature={84.5}
        boilingPoint={84.5}
        onBoiling={jest.fn()}
      />
    )
    expect(getByText('Water is boiling!')).toBeInTheDocument()
  })
})
```

---

## Implementation Plan

### Phase 1: Extract Hooks (Week 1)

Move complex logic out of GameScene into custom hooks:

```bash
# Create hooks that contain logic (not UI)
src/components/GameScene/hooks/
├── useGamePhysics.js       # 400 lines of physics sim from the effect
├── usePotDragging.js       # 100 lines of pot interaction
├── useLocationPopup.js     # 80 lines of location logic
└── useBoilingDetection.js  # 80 lines of boiling state
```

**Benefits:**
- Reduces GameScene from 1857 to 1200 lines
- Logic becomes testable
- Easy to reuse in other components

### Phase 2: Extract Sub-Components (Week 2)

Create small, focused components:

```bash
src/components/GameScene/
├── components/
│   ├── Pot/
│   │   ├── Pot.jsx
│   │   └── usePotDragging.js
│   ├── WaterStream/
│   │   └── WaterStream.jsx
│   ├── Burner/
│   │   ├── Burner.jsx
│   │   ├── BurnerKnob.jsx
│   │   └── Flame.jsx
│   ├── Effects/
│   │   ├── SteamParticles.jsx
│   │   └── FlameGlow.jsx
│   ├── LocationPopup/
│   │   ├── LocationPopup.jsx
│   │   ├── LocationSearch.jsx
│   │   └── ManualAltitude.jsx
│   └── BoilingPopup/
│       ├── BoilingPopup.jsx
│       └── BoilStats.jsx
```

**Benefits:**
- GameScene reduced to 400-500 lines (orchestrator only)
- Each component is testable
- Easy to modify without breaking others

### Phase 3: Create Container/Presenter Pattern (Week 3)

```javascript
// src/components/GameScene/GameScene.jsx (300 lines)
// Container: manages state and logic

export function GameScene(props) {
  const [waterInPot, setWaterInPot] = useState(0)
  const [temperature, setTemperature] = useState(...)
  const gamePhysics = useGamePhysics(...)
  const potDrag = usePotDragging(...)
  const boilingState = useBoilingDetection(...)

  return (
    <GameSceneView
      waterInPot={waterInPot}
      temperature={temperature}
      potDrag={potDrag}
      boilingState={boilingState}
      onPotFilled={handlePotFilled}
      onBoiling={handleBoiling}
    />
  )
}

// src/components/GameScene/GameSceneView.jsx (400 lines)
// Presenter: renders UI only

export function GameSceneView(props) {
  return (
    <div className="game-scene">
      <GameWindow>
        <Pot position={props.potDrag.position} />
        <WaterStream onPotFilled={props.onPotFilled} />
        <Burner />
        <Effects />
      </GameWindow>
      <ControlPanel />
      <BoilingPopup
        isVisible={props.boilingState.showPopup}
        onBoiling={props.onBoiling}
      />
    </div>
  )
}
```

---

## Time and Effort Breakdown

| Phase | Task | Duration | Complexity |
|-------|------|----------|-----------|
| 1 | Extract useGamePhysics hook | 3-4 days | Medium |
| 1 | Extract usePotDragging hook | 2 days | Low |
| 1 | Extract useLocationPopup hook | 1 day | Low |
| 2 | Create Pot component | 1 day | Low |
| 2 | Create WaterStream component | 1 day | Low |
| 2 | Create Burner/BurnerKnob/Flame | 2 days | Medium |
| 2 | Create Effects components | 2 days | Low |
| 2 | Create ControlPanel sub-components | 2 days | Low |
| 3 | Create LocationPopup component | 2 days | Medium |
| 3 | Create BoilingPopup component | 2 days | Medium |
| 3 | Integration & testing | 3-4 days | High |
| **Total** | | **21-25 days** | |

**Calendar: 3-4 weeks** (assuming 5-6 days per week)

---

## Benefits After Refactor

| Metric | Before | After |
|--------|--------|-------|
| Largest component | 1857 lines | 400 lines |
| Components > 500 lines | 1 | 0 |
| Testable components | 0 | 20+ |
| Props per component | 19 | 2-5 avg |
| Lines per file | 1857 avg | 150 avg |
| Time to understand one feature | 30+ min | < 5 min |
| Time to fix a bug | 2-4 hours | 15-30 min |
| Time to add a new feature | 4-6 hours | 1-2 hours |

---

## Why This Matters for Physics Education

Massive components hurt your educational mission:

1. **Code is documentation**
   - Students should learn from your code
   - 1857-line GameScene teaches bad practices
   - Refactored components teach good patterns

2. **Contributions become hard**
   - New developers can't contribute safely
   - Physics PhD working on boiling → drowns in pot dragging code
   - Chemistry expert → intimidated by codebase size

3. **Feedback loops break**
   - Physics + room environment + UI all tangled
   - Changes to one system risk breaking others
   - Hard to verify complex interactions

---

## Related Issues

- [Issue #1: No Unit Tests](ISSUE_01_NO_UNIT_TESTS.md) (refactoring enables testing)
- [Issue #2: No TypeScript](ISSUE_02_NO_TYPESCRIPT.md) (types help during refactoring)
- [Issue #4: Props Drilling](../INDUSTRY_STANDARDS_AUDIT.md#4-no-centralized-state-management) (fixes props drilling)
- [Remediation Phase 2](../INDUSTRY_STANDARDS_AUDIT.md#phase-2-architecture-weeks-3-5)

---

## Success Metrics

After refactoring:

| Metric | Target | Current |
|--------|--------|---------|
| Largest component | < 400 lines | 1857 lines |
| Components > 500 lines | 0 | 1 |
| Average component size | 150-250 lines | 1857 lines |
| Props per component | < 5 | 19 |
| Testable paths | > 90% | ~0% |
| Time to fix average bug | 30 min | 2-4 hours |

---

## Recommendation

**Start Phase 1 immediately:**

1. Extract `useGamePhysics` hook (400 lines from effect to reusable hook)
   - Effort: 3-4 days
   - Benefit: Physics logic testable, GameScene 1857 → 1450 lines
   - Risk: Low (logic doesn't change)

2. Extract `usePotDragging` hook (100 lines)
   - Effort: 2 days
   - Benefit: Dragging logic testable, GameScene 1450 → 1350 lines
   - Risk: Low

3. Follow with Phase 2 once Phase 1 is stable

This is **not a complete rewrite** — you're gradually extracting logic without changing functionality. Each step is testable and reviewable independently.

---

**Status:** Ready for implementation  
**Blocking:** Tests (Issue #1), TypeScript (Issue #2)  
**Recommended start:** Extract hooks first (low risk, high value)  
**Timeline:** 3-4 weeks for full refactor
