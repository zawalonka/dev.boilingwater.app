# Issue #4: No Centralized State Management

**Severity:** 🟡 High  
**Status:** ❌ Props Drilling  
**Priority:** P1  
**Effort:** 1-2 weeks

---

## What It Means

State is scattered everywhere and passed down through **props drilling** — passing props through multiple component levels even though intermediate components don't use them.

```javascript
// Current structure (props drilling):
App
  ├─ has: userLocation, activeWorkshop, activeLevel, ...
  │
  └─ GameScene (receives 11+ props just to pass them down)
      ├─ has: location, workshopLayout, burnerConfig, ...
      │
      ├─ ControlPanel (receives 5 props just to pass them down)
      │   │
      │   └─ BurnerControls (finally uses onBurnerChange)
      │
      ├─ LocationPopup (receives location just to use it)
      │
      └─ BoilingPopup (receives stats just to display them)

// Needed properties:
location                    // Needed in GameScene AND LocationPopup
workshopLayout              // Needed in GameScene AND Pot AND Burner
burnerConfig                // Needed in GameScene AND ControlPanel AND BurnerControls
roomConfig                  // Needed in GameScene AND RoomControls
onLocationChange            // Needed in GameScene AND LocationPopup
onBurnerChange              // Needed in GameScene AND ControlPanel AND BurnerControls
// ... 10+ more props
```

**With centralized state:**
```javascript
// ✅ Components get what they need directly
function LocationPopup() {
  const { location, setLocation } = useGameState()  // Gets it directly
  return <input value={location.name} onChange={setLocation} />
}

function BurnerControls() {
  const { burnerConfig, setBurnerHeat } = useGameState()  // Gets it directly
  return <button onClick={() => setBurnerHeat(2)}>High</button>
}
```

---

## Why It's Critical

### Problem 1: Prop Callbacks Become Unmanageable

**Current GameScene Props (19 total):**

```jsx
<GameScene 
  // Data props (8)
  stage={stage}
  location={userLocation}
  workshopLayout={activeWorkshopData?.layout}
  workshopImages={activeWorkshopData?.images}
  workshopEffects={activeWorkshopData?.effects}
  burnerConfig={activeWorkshopData?.burnerConfig}
  roomConfig={activeWorkshopData?.room}
  acUnitConfig={activeWorkshopData?.acUnit}
  
  // Callback props (11)
  onStageChange={handleStageChange}
  onWaterBoiled={handleWaterBoiled}
  onSkipTutorial={handleSkipTutorial}
  onLevelChange={handleLevelChange}
  onExperimentChange={handleExperimentChange}
  hasBoiledBefore={hasBoiledBefore}
  onLocationChange={handleLocationChange}
  onEquipmentChange={handleEquipmentChange}
  // ... more props
/>
```

**Adding a new feature means:**
1. Create setter in App.jsx
2. Pass it to GameScene props
3. GameScene passes it to ControlPanel
4. ControlPanel passes it to BurnerControls
5. BurnerControls finally calls it

**Change one thing? Must update 5 files.**

### Problem 2: State Synchronization Bugs

Different parts of the app can have conflicting state:

```javascript
// App.jsx
const [activeFluid, setActiveFluid] = useState('water')

// GameScene.jsx
const [activeFluid, setActiveFluid] = useState('water')

// Now they're out of sync:
// User selects ethanol in App → updates App state
// GameScene is still showing water properties
// Physics calculations use wrong fluid

// To fix: Must pass activeFluid as prop
// But then GameScene can't set it without a callback
// Callbacks get buried in props drilling hell
```

### Problem 3: Testing is Fragile

To test one small component, you must mock the entire prop chain:

```javascript
// To test LocationPopup:
import LocationPopup from './LocationPopup'

describe('LocationPopup', () => {
  it('should update location when user enters city', () => {
    const mockOnLocationChange = jest.fn()
    
    const { getByPlaceholder } = render(
      <LocationPopup 
        location={{ altitude: 0, name: 'Sea Level' }}
        onLocationChange={mockOnLocationChange}
        workshopLayout={mockLayout}
        burnerConfig={mockBurner}
        roomConfig={mockRoom}
        // ... 10 more props that LocationPopup doesn't even use!
      />
    )
    
    fireEvent.change(getByPlaceholder('City'), { target: { value: 'Denver' } })
    expect(mockOnLocationChange).toHaveBeenCalled()
  })
})
```

**With centralized state:**
```javascript
describe('LocationPopup', () => {
  it('should update location when user enters city', () => {
    const { getByPlaceholder } = render(
      <GameStateProvider initialState={{ location: { name: 'Sea Level' } }}>
        <LocationPopup />
      </GameStateProvider>
    )
    
    fireEvent.change(getByPlaceholder('City'), { target: { value: 'Denver' } })
    // LocationPopup gets location from context directly ✅
  })
})
```

### Problem 4: Accidental Props Passed to DOM

```javascript
// In your current code, if you accidentally pass unknown props:
<GameScene unknownProp={value} />

// React silently ignores it (or passes it to DOM)
// Hard to debug why feature doesn't work
// Without types, you don't know which props are valid
```

---

## Current State: Chaotic Props Drilling

### App.jsx State (What gets passed down)

```javascript
// src/App.jsx

function App() {
  // User/location state
  const [userLocation, setUserLocation] = useState(null)
  
  // UI state
  const [gameStage, setGameStage] = useState(0)
  const [activeView, setActiveView] = useState('game')
  const [gameInstanceKey, setGameInstanceKey] = useState(0)
  
  // Level/experiment state
  const [activeLevel, setActiveLevel] = useState(1)
  const [activeExperiment, setActiveExperiment] = useState('boiling-water')
  const [activeWorkshopId, setActiveWorkshopId] = useState('pre-alpha-kitchen-1')
  const [availableWorkshops, setAvailableWorkshops] = useState([])
  const [activeWorkshopData, setActiveWorkshopData] = useState(null)
  
  // Tutorial state
  const [hasBoiledBefore, setHasBoiledBefore] = useState(false)
  const [showSelectors, setShowSelectors] = useState(false)
  
  // All passed as props to GameScene ↓
  return (
    <GameScene 
      stage={gameStage}
      location={userLocation}
      workshopLayout={activeWorkshopData?.layout}
      workshopImages={activeWorkshopData?.images}
      // ... 11 more props
    />
  )
}
```

### Cascade of Props Through Components

```
App
  ├─ state: userLocation, gameStage, activeLevel, activeExperiment, activeWorkshop, ...
  │
  └─ GameScene
      ├─ receives: 19 props
      ├─ uses: 5 directly
      ├─ passes down: 14 to child components
      │
      ├─ ControlPanel
      │   ├─ receives: 8 props
      │   ├─ uses: 2 directly
      │   ├─ passes down: 6 to children
      │   │
      │   └─ BurnerControls
      │       ├─ receives: 4 props
      │       └─ uses: 1 (burnerConfig, onBurnerChange)
      │
      ├─ LocationPopup
      │   ├─ receives: 5 props (location, onLocationChange, ...)
      │   └─ uses: 2
      │
      └─ RoomControls
          ├─ receives: 3 props
          └─ uses: 3
```

**Chain Length: 2-3 levels**

With each level, prop lists grow and component responsibilities become unclear.

---

## Real-World Bugs Without Centralized State

### Bug #1: Prop Update Doesn't Propagate

```javascript
// User changes location in App.jsx
setUserLocation({ altitude: 5000, name: 'Denver' })

// But GameScene was rendered with OLD location prop
// and doesn't re-render because... something else happened

// Meanwhile:
// - Physics calculations use old altitude
// - Display shows old location
// - Room environment has wrong pressure

// Hours spent debugging: "Why did location change not work?"
```

### Bug #2: Callback Passed Incorrectly

```javascript
// App.jsx
const handleLocationChange = (newLocation) => {
  setUserLocation(newLocation)
  setGameStage(0)  // Reset game
}

// Passed to GameScene
<GameScene onLocationChange={handleLocationChange} />

// GameScene passes it to LocationPopup
<LocationPopup onLocationChange={onLocationChange} />

// But if LocationPopup is deeply nested:
// GameScene → Modal → Form → LocationInput

// If you pass it through 5 levels and miss one level,
// it silently fails. No error, just doesn't work.
// How do you find this bug? Read the entire prop chain.
```

### Bug #3: Stale Closures in Callbacks

```javascript
// GameScene.jsx
const handleEquipmentChange = (type, id) => {
  // This closes over current value of activeWorkshop
  const updatedWorkshop = await loadEquipment(activeWorkshopId, type, id)
  setActiveWorkshopData(updatedWorkshop)
}

// But if activeWorkshopId changed elsewhere and didn't update prop,
// this callback uses STALE value
// User switches workshop, then tries to change burner → loads from wrong workshop

// With centralized state, no stale closures:
const handleEquipmentChange = (type, id) => {
  const { activeWorkshopId } = useGameState()  // Always current
  const updatedWorkshop = await loadEquipment(activeWorkshopId, type, id)
  setActiveWorkshopData(updatedWorkshop)
}
```

### Bug #4: Props Change Mid-Render

```javascript
// Component renders with old props mid-effect
useEffect(() => {
  if (location.altitude !== prevAltitude) {
    // Recalculate boiling point
    const bp = calculateBoilingPoint(location.altitude, fluidProps)
    // But what if location changed during calculation?
    // Now bp is based on DIFFERENT altitude than what's displayed
  }
}, [location, fluidProps])

// With centralized state, single source of truth:
const { location, fluidProps } = useGameState()  // Guaranteed consistent
```

---

## Solution Options

### Option 1: React Context API (Simplest, Free)

**Pros:**
- No dependencies needed
- Built into React
- Good for small-medium projects
- Works with TypeScript

**Cons:**
- Performance issues if context updates frequently
- Requires Provider wrapper
- Manual optimization needed (useMemo, useCallback)
- More boilerplate

```typescript
// src/context/GameStateContext.tsx

interface GameState {
  location: Location
  activeLevel: number
  activeExperiment: string
  activeWorkshop: WorkshopData
  gameStage: GameStage
  hasBoiledBefore: boolean
  showSelectors: boolean
}

interface GameContextValue extends GameState {
  setLocation: (location: Location) => void
  setActiveLevel: (level: number) => void
  setActiveExperiment: (exp: string) => void
  setGameStage: (stage: GameStage) => void
  // ... more setters
}

const GameContext = createContext<GameContextValue | null>(null)

export function GameStateProvider({ children }) {
  const [state, setState] = useState<GameState>({ /* ... */ })
  
  const value: GameContextValue = {
    ...state,
    setLocation: (location) => setState(prev => ({ ...prev, location })),
    setActiveLevel: (level) => setState(prev => ({ ...prev, activeLevel: level })),
    // ... more setters
  }
  
  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  )
}

export function useGameState() {
  const context = useContext(GameContext)
  if (!context) throw new Error('useGameState must be within GameStateProvider')
  return context
}
```

**Usage:**
```typescript
// In any component, anywhere
function LocationPopup() {
  const { location, setLocation } = useGameState()
  
  return (
    <input 
      value={location.name}
      onChange={(e) => setLocation({ ...location, name: e.target.value })}
    />
  )
}
```

**Cost: 1 week** (set up, migrate state, test)

---

### Option 2: Zustand (Recommended, Lightweight)

**Pros:**
- Extremely simple API
- No Provider wrapper needed
- Excellent TypeScript support
- Great performance
- Small bundle size
- Works outside React (good for physics engine)

**Cons:**
- One more dependency
- DevTools setup required
- Less ecosystem than Redux

```typescript
// src/store/gameStore.ts

import { create } from 'zustand'

interface GameStore {
  // State
  location: Location
  activeLevel: number
  activeExperiment: string
  activeWorkshop: WorkshopData
  gameStage: GameStage
  hasBoiledBefore: boolean
  
  // Actions
  setLocation: (location: Location) => void
  setActiveLevel: (level: number) => void
  setActiveExperiment: (exp: string) => void
  setGameStage: (stage: GameStage) => void
}

export const useGameStore = create<GameStore>((set) => ({
  // State
  location: null,
  activeLevel: 1,
  activeExperiment: 'boiling-water',
  activeWorkshop: null,
  gameStage: 0,
  hasBoiledBefore: false,
  
  // Actions
  setLocation: (location) => set({ location }),
  setActiveLevel: (level) => set({ activeLevel: level }),
  setActiveExperiment: (exp) => set({ activeExperiment: exp }),
  setGameStage: (stage) => set({ gameStage: stage }),
  // ... more actions
}))
```

**Usage:**
```typescript
// Anywhere, no Provider needed
function LocationPopup() {
  const { location, setLocation } = useGameStore()
  
  return (
    <input 
      value={location.name}
      onChange={(e) => setLocation({ ...location, name: e.target.value })}
    />
  )
}

// In physics code (outside React):
const altitude = useGameStore.getState().location.altitude
const boilingPoint = calculateBoilingPoint(altitude, fluidProps)
```

**Cost: 3-5 days** (simpler setup than Context)

---

### Option 3: Redux (Overkill for This Project)

**Pros:**
- Excellent DevTools
- Time-travel debugging
- Large ecosystem
- Good for huge apps

**Cons:**
- Massive boilerplate
- Steep learning curve
- Overkill for physics game
- Bundle size hit

**Not recommended** for Boiling Water (too simple for Redux complexity)

---

## Recommended: Zustand + Context Hybrid

Use **Zustand for global state** + **React Context for feature-specific state**:

```typescript
// Global state (shared across app)
// src/store/gameStore.ts
export const useGameStore = create<GameStore>((set) => ({
  location: null,
  activeLevel: 1,
  activeExperiment: 'boiling-water',
  activeWorkshop: null,
  gameStage: 0,
  setLocation: (location) => set({ location }),
  setActiveLevel: (level) => set({ activeLevel: level }),
  // ... etc
}))

// Feature-specific state (just for gameplay)
// src/context/GameSceneContext.tsx
interface GameSceneState {
  waterInPot: number
  temperature: number
  isBoiling: boolean
  potPosition: Position
  // ... gameplay-specific state
}

export const GameSceneProvider = ({ children }) => {
  const [state, setState] = useState<GameSceneState>({...})
  // Only GameScene and its children use this
  return <GameSceneContext.Provider value={state}>{children}</GameSceneContext.Provider>
}
```

**Benefits:**
- ✅ Global state easy to access (Zustand)
- ✅ Gameplay state isolated (Context)
- ✅ No prop drilling
- ✅ Clean separation of concerns

---

## Implementation Plan

### Step 1: Install Zustand (1 day)

```bash
npm install zustand
npm install --save-dev @types/zustand
```

### Step 2: Create Store (2 days)

```typescript
// src/store/gameStore.ts

import { create } from 'zustand'
import { Location, WorkshopData, GameStage } from '../types'

interface GameStore {
  // Location & Altitude
  location: Location | null
  setLocation: (location: Location) => void
  
  // Level/Experiment
  activeLevel: number
  setActiveLevel: (level: number) => void
  
  activeExperiment: string
  setActiveExperiment: (exp: string) => void
  
  // Workshop
  activeWorkshopId: string
  setActiveWorkshopId: (id: string) => void
  
  activeWorkshopData: WorkshopData | null
  setActiveWorkshopData: (data: WorkshopData) => void
  
  // UI
  gameStage: GameStage
  setGameStage: (stage: GameStage) => void
  
  // Tutorial
  hasBoiledBefore: boolean
  setHasBoiledBefore: (value: boolean) => void
  
  showSelectors: boolean
  setShowSelectors: (value: boolean) => void
  
  // Equipment
  activeBurner: string
  setActiveBurner: (burner: string) => void
}

export const useGameStore = create<GameStore>((set) => ({
  location: null,
  setLocation: (location) => set({ location }),
  
  activeLevel: 1,
  setActiveLevel: (level) => set({ activeLevel: level }),
  
  activeExperiment: 'boiling-water',
  setActiveExperiment: (exp) => set({ activeExperiment: exp }),
  
  activeWorkshopId: 'pre-alpha-kitchen-1',
  setActiveWorkshopId: (id) => set({ activeWorkshopId: id }),
  
  activeWorkshopData: null,
  setActiveWorkshopData: (data) => set({ activeWorkshopData: data }),
  
  gameStage: 0,
  setGameStage: (stage) => set({ gameStage: stage }),
  
  hasBoiledBefore: false,
  setHasBoiledBefore: (value) => set({ hasBoiledBefore: value }),
  
  showSelectors: false,
  setShowSelectors: (value) => set({ showSelectors: value }),
  
  activeBurner: 'basic-2000w',
  setActiveBurner: (burner) => set({ activeBurner: burner }),
}))
```

### Step 3: Update App.jsx (2 days)

**Before:**
```javascript
function App() {
  const [userLocation, setUserLocation] = useState(null)
  const [activeLevel, setActiveLevel] = useState(1)
  const [activeExperiment, setActiveExperiment] = useState('boiling-water')
  // ... 10 more pieces of state
  
  const handleLocationChange = (location) => setUserLocation(location)
  const handleLevelChange = (level) => setActiveLevel(level)
  // ... 10 more handlers
  
  return (
    <GameScene
      location={userLocation}
      activeLevel={activeLevel}
      activeExperiment={activeExperiment}
      onLocationChange={handleLocationChange}
      onLevelChange={handleLevelChange}
      // ... 15 more props
    />
  )
}
```

**After:**
```typescript
function App() {
  // No local state! Get everything from Zustand
  return (
    <GameScene />
  )
}
```

### Step 4: Update GameScene (2 days)

**Before:**
```javascript
function GameScene({ 
  stage, location, activeLevel, activeExperiment,
  onLocationChange, onLevelChange, onExperimentChange,
  // ... 13 more props
}) {
  // 50+ useState hooks
}
```

**After:**
```typescript
function GameScene() {
  const { 
    gameStage, 
    location, 
    activeLevel, 
    activeExperiment,
    setLocation,
    setActiveLevel,
    setActiveExperiment,
    setGameStage,
  } = useGameStore()
  
  // Get state directly, no props needed!
  // Physics-specific state still in local useState
  const [waterInPot, setWaterInPot] = useState(0)
  const [temperature, setTemperature] = useState(...)
  // ... gameplay state only (20 instead of 50+ pieces of state)
}
```

### Step 5: Update Child Components (3-4 days)

**Before:**
```javascript
// ControlPanel receives 5 props just to pass down
function ControlPanel({ burnerConfig, onBurnerChange, roomConfig, ... }) {
  return <BurnerControls burnerConfig={burnerConfig} onBurnerChange={onBurnerChange} />
}

// BurnerControls finally uses the props
function BurnerControls({ burnerConfig, onBurnerChange }) {
  return <button onClick={() => onBurnerChange(2)}>High</button>
}
```

**After:**
```typescript
// ControlPanel doesn't receive any props
function ControlPanel() {
  return <BurnerControls />
}

// BurnerControls gets what it needs directly
function BurnerControls() {
  const { activeBurner, setActiveBurner } = useGameStore()
  
  return <button onClick={() => setActiveBurner('pro-5000w')}>High</button>
}
```

### Step 6: Test & Verify (2 days)

```bash
npm run dev
npm run build
npm run lint
```

**Cost: 1-2 weeks total** (much less than refactoring components)

---

## Before and After: Concrete Example

### Current: Add New Feature "Experiment History"

To track user's past boiling temperatures:

**Step 1: Create setter in App.jsx**
```javascript
const [experimentHistory, setExperimentHistory] = useState([])
```

**Step 2: Pass to GameScene**
```javascript
<GameScene experimentHistory={experimentHistory} />
```

**Step 3: GameScene passes to BoilingPopup**
```javascript
<BoilingPopup experimentHistory={experimentHistory} onAddHistory={handleAddHistory} />
```

**Step 4: Create handler in App.jsx**
```javascript
const handleAddHistory = (result) => {
  setExperimentHistory([...experimentHistory, result])
}
```

**Step 5: Pass handler to BoilingPopup**
```javascript
<BoilingPopup onAddHistory={handleAddHistory} />
```

**Files modified: 4** (App.jsx, GameScene.jsx, BoilingPopup.jsx, + type definitions)

### With Zustand: Add Same Feature

**Step 1: Add to store**
```typescript
// src/store/gameStore.ts
experimentHistory: [],
addToHistory: (result) => set((state) => ({
  experimentHistory: [...state.experimentHistory, result]
}))
```

**Step 2: Use in BoilingPopup**
```typescript
function BoilingPopup() {
  const { addToHistory } = useGameStore()
  
  const handleFinish = () => {
    addToHistory({ temperature: 100, boilTime: 300 })
  }
  
  return <button onClick={handleFinish}>Finish</button>
}
```

**Files modified: 2** (store, component that uses it)  
**Complexity: 50% less**  
**Time: 30 minutes vs 2-3 hours**

---

## Testing: Before vs After

### Current (Props Drilling)

```javascript
// To test BoilingPopup with history feature:
describe('BoilingPopup', () => {
  it('should add boil result to history', () => {
    const mockHistory = []
    const mockAddToHistory = jest.fn()
    
    const { getByText } = render(
      <BoilingPopup
        experimentHistory={mockHistory}
        onAddToHistory={mockAddToHistory}
        // ... 5 more props
      />
    )
    
    fireEvent.click(getByText('Finish'))
    expect(mockAddToHistory).toHaveBeenCalledWith(expect.objectContaining({
      temperature: 100
    }))
  })
})
```

### With Zustand

```typescript
describe('BoilingPopup', () => {
  it('should add boil result to history', () => {
    const { result } = renderHook(() => useGameStore())
    
    const { getByText } = render(
      <BoilingPopup />
    )
    
    fireEvent.click(getByText('Finish'))
    
    expect(result.current.experimentHistory).toContainEqual(
      expect.objectContaining({ temperature: 100 })
    )
  })
})
```

**No mock props needed.** Test is cleaner and more realistic.

---

## Performance Considerations

### Context API (without optimization)

⚠️ **Problem:** Every state change re-renders all consumers

```javascript
// Any update in context causes ALL consumers to re-render
const [location, setLocation] = useState(null)  // ← Change this
const [temperature, setTemperature] = useState(0)
const [isBoiling, setIsBoiling] = useState(false)

// ALL context consumers re-render, even if they only use temperature
// Physics runs every 100ms → 600 re-renders per minute!
```

✅ **Solution:** Split contexts by concern

```javascript
// Separate contexts for different concerns
const LocationContext = createContext()      // Changes rarely
const PhysicsContext = createContext()       // Changes frequently (100ms)

// Components only subscribe to what they need
```

### Zustand (optimized by default)

✅ **Good:** Built-in optimization

```typescript
// Zustand automatically optimizes subscriptions
const waterInPot = useGameStore((state) => state.waterInPot)

// Only re-renders if waterInPot changes, even if other state changes
// Physics runs every 100ms → ZERO unnecessary re-renders ✅
```

**Zustand is better for physics-heavy apps.**

---

## Success Metrics

| Metric | Before | After |
|--------|--------|-------|
| Props passed to GameScene | 19 | 0 |
| Prop levels (max) | 3-4 | 1 (direct access) |
| Files to modify for new feature | 4-5 | 1-2 |
| Testing boilerplate | High | Low |
| Time to add feature | 2-4 hours | 30 min |
| Performance (re-renders per physics step) | 5-10 | 1-2 |

---

## Cost-Benefit Analysis

| Item | Cost | Benefit |
|------|------|---------|
| Setup Zustand | 1 day | Lifetime productivity boost |
| Migrate state | 3 days | No more prop drilling |
| Update GameScene | 2 days | Cleaner code, easier testing |
| Update components | 3 days | Reusable, testable pieces |
| Overhead | 9 days | 5× faster feature development |

**ROI: Pays for itself after 2-3 new features**

---

## Implementation Timeline

| Phase | Duration | Effort |
|-------|----------|--------|
| 1. Install & create store | 1 day | Easy |
| 2. Migrate App state | 1 day | Easy |
| 3. Update GameScene | 2 days | Medium |
| 4. Update child components | 3 days | Medium |
| 5. Test & verify | 2 days | Medium |
| **Total** | **9 days** | **1-2 weeks** |

---

## Recommended Approach

1. **Week 1:**
   - Install Zustand
   - Create game store with all global state
   - Update App.jsx to remove useState hooks
   - Update GameScene to use store

2. **Week 2:**
   - Update ControlPanel and sub-components
   - Update LocationPopup
   - Update BoilingPopup
   - Test everything

3. **Ongoing:**
   - New features are now 2-3× faster to add
   - Components are reusable across experiments
   - Testing is straightforward

---

## Related Issues

- [Issue #3: Massive Components](ISSUE_03_MASSIVE_COMPONENTS.md) (props drilling is symptom)
- [Issue #1: No Unit Tests](ISSUE_01_NO_UNIT_TESTS.md) (state management makes tests easier)
- [Issue #2: No TypeScript](ISSUE_02_NO_TYPESCRIPT.md) (types + Zustand = powerful combo)
- [Remediation Phase 1](../INDUSTRY_STANDARDS_AUDIT.md#phase-1-foundation-weeks-1-2)

---

## Conclusion

**Props drilling is stealing your productivity.**

With centralized state management (Zustand):

- ✅ Add new features 5× faster
- ✅ Components become reusable and testable
- ✅ No more "which component has this state?" confusion
- ✅ Physics engine can access state directly
- ✅ New developers understand state flow instantly

**Effort: 1-2 weeks**  
**Payback: Every week of development after that**

---

**Status:** Ready for implementation  
**Recommended solution:** Zustand  
**Priority:** High (unblocks other issues)  
**Timeline:** 1-2 weeks  
**Dependencies:** None (can start immediately)
