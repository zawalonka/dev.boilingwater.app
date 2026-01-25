# Boiling Water App - Complete Code Documentation

## Overview
This is an educational physics game where users heat water in a pot and learn about boiling points at different altitudes.

---

## File Structure & Purpose

### `src/components/GameScene.jsx` - Main Game Component
The heart of the application. Handles all gameplay logic.

#### STATE (Data that changes during gameplay)
- `waterInPot`: How much water is in the pot (kg)
- `temperature`: Current water temperature (°C)
- `heatOn`: Is the burner currently heating?
- `isBoiling`: Has water reached boiling point?
- `showHook`: Should we show the educational message?
- `potPosition`: Where the pot is on screen (x%, y%)
- `isDragging`: Is user currently moving the pot?
- `dragOffset`: Prevents pot from snapping to cursor

#### KEY FUNCTIONS

**`handlePointerDown(e)`**
- Triggered when user clicks the pot
- Stores the offset between click position and pot center
- Enables pointer capture (all mouse events go to pot)
- Sets `isDragging = true`

**`handlePointerMove(e)`**
- Runs continuously while mouse is down
- Calculates new pot position based on cursor movement
- Converts pixel coordinates to percentages (0-100%)
- Applies boundary constraints (8-92%) so pot stays on screen
- Auto-fills pot if it touches the sink (x<12%, y<15%)

**`handlePointerUp(e)`**
- Triggered when user releases mouse
- Releases pointer capture
- Sets `isDragging = false`

**`handleTurnOnHeat()`**
- User clicks "Turn Heat On" button
- Only works if there's water in the pot
- Activates the physics simulation loop

**Simulation Effect**
- Runs every 100ms when `heatOn = true`
- Calls `simulateTimeStep()` physics function
- Updates temperature, water mass, elapsed time
- Checks if water has reached boiling point
- Sets `isBoiling = true` when boiling is detected

#### POT POSITIONING
- Pot is 36% of game window size
- Uses `translate(-50%, -50%)` CSS to center it at its position coordinates
- This means position 50%, 50% puts pot center at window center
- Boundaries are 8% to 92% to account for transparent corners

#### GAME WINDOW
- Fixed 1280x800 pixels (original background dimensions)
- Centered in browser viewport
- Outer wrapper (game-scene) fills browser, inner wrapper (game-scene-inner) stays fixed size
- This prevents scaling drift issues

---

### `src/components/Header.jsx` - Top Navigation
Simple header with title and navigation.

```jsx
// Shows app title and hamburger menu
// Menu allows navigation between scenes/stages
// Fixed at top of viewport above game scene
```

---

### `src/utils/physics.js` - Physics Engine

#### `calculateBoilingPoint(altitude)`
**What it does:** Calculates what temperature water boils at for a given altitude

**How it works:**
- At sea level (0m): water boils at 100°C
- At higher altitudes: atmospheric pressure is lower, so water boils at lower temperature
- Uses real physics formula relating pressure and altitude
- Example: At 5000m elevation, water boils at ~83°C

**Input:** `altitude` (meters above sea level)
**Output:** `temperature` (Celsius)

#### `calculatePressure(altitude)`
**What it does:** Calculates atmospheric pressure at a given altitude

**How it works:**
- Uses exponential atmospheric model
- Lower altitude = higher pressure = higher boiling point
- Higher altitude = lower pressure = lower boiling point

**Formula:** `P = P₀ * e^(-altitude / scaleHeight)`

#### `calculateHeatingEnergy(mass, specificHeat, tempChange)`
**What it does:** Calculates energy needed to heat water by a certain amount

**Formula:** `Q = m * c * ΔT` (basic thermodynamics)
- m = mass of water (kg)
- c = specific heat of water (4186 J/kg°C)
- ΔT = temperature change (°C)

#### `applyHeatEnergy(state, heatInput, deltaTime)`
**What it does:** Updates water temperature when heat is applied

**How it works:**
1. Calculates how much temperature rises from applied heat
2. Checks if temperature exceeds boiling point (adjusted for altitude)
3. If boiling, water starts evaporating
4. Returns updated state with new temperature and water mass

#### `simulateTimeStep(state, heatInput, deltaTime)`
**What it does:** Runs one physics calculation step (e.g., 100ms)

**Inputs:**
- `state`: { waterMass, temperature, altitude }
- `heatInput`: Heat energy being applied (Joules)
- `deltaTime`: How much time passed (seconds)

**Process:**
1. Apply heat to water using `applyHeatEnergy()`
2. Update water mass if evaporating
3. Check if at boiling point
4. Return new state

**Output:** { waterMass, temperature, isBoiling }

#### `formatTemperature(celsius)`
**What it does:** Formats temperature for display (rounds to 1 decimal place)

**Example:** `98.45678` → `"98.5"`

---

### `src/constants/physics.js` - Configuration Values

```javascript
// WATER_CONSTANTS - Properties of water
SPECIFIC_HEAT_CAPACITY: 4186         // J/(kg·°C) - energy to raise 1kg by 1°C
LATENT_HEAT_VAPORIZATION: 2.26e6    // J/kg - energy to turn water to steam

// ATMOSPHERE - Air properties
SEA_LEVEL_PRESSURE: 101325           // Pascals
SCALE_HEIGHT: 8500                   // Meters (exponential atmosphere model)

// UNIVERSAL - Physical constants
GRAVITY: 9.81                        // m/s²

// GAME_CONFIG - Gameplay settings
ROOM_TEMPERATURE: 20                 // °C - starting temperature
DEFAULT_WATER_MASS: 0.5              // kg - water added when pot touches sink
TIME_STEP: 100                       // Milliseconds between simulation updates
BOILING_DURATION: 5                  // Seconds to show boiling before evaporation
```

---

### `src/styles/GameScene.css` - Game Styling

#### `.game-scene`
**Purpose:** Outer container that fills the browser window
- `position: absolute` - covers viewport
- `display: flex; align-items: center; justify-content: center` - centers inner window
- `background: #000` - black letterbox around game window
- `overflow: hidden` - hides anything outside game window

#### `.game-scene-inner`
**Purpose:** The actual 1280x800 game window
- `position: relative` - contains absolutely positioned elements (pot, sink, flame)
- `width: 1280px; height: 800px` - fixed size matching background image
- `background-image` - the game background
- `box-shadow` - subtle shadow for depth

#### `.pot-draggable`
**Purpose:** The draggable pot container
- `position: absolute` - can be positioned anywhere in game window
- `transform: translate(-50%, -50%)` - centers pot at its position coordinates
- `width/height: 36%` - pot is 36% of game window (464x288 pixels)
- `cursor: grab` - indicates pot can be dragged
- `.dragging` class: changes cursor to `grabbing` and increases brightness when active
- `.filled` / `.empty` classes: no styling change currently, but exist for future expansion

#### `.sink`
**Purpose:** Water source at top-left
- `position: absolute`
- `left: 1%; top: 2%` - position in top-left
- `width: 10%; height: 12%` - small tap-sized area
- `background: linear-gradient(...)` - metallic silver appearance
- Shows water droplet emoji (💧)

#### `.stove-burner`
**Purpose:** Burner location on stovetop
- `position: absolute` - can be positioned exactly
- `left: 50%; top: 71%` - center-right of stove
- `transform: translate(-50%, -50%)` - center the flame on this point
- `width/height: 15%` - flame container
- Shows flame image when `heatOn = true`

#### `.controls-panel`
**Purpose:** Status display and buttons (bottom-right)
- `position: absolute`
- `bottom: 20px; right: 20px` - bottom-right corner
- `background: rgba(255,255,255,0.95)` - semi-transparent white
- `max-width: min(400px, 90vw)` - fits on small screens
- Shows temperature, buttons, and messages

---

## How Gameplay Flows

### Startup
1. User opens app
2. React mounts GameScene component
3. Game window fixed at 1280x800 is displayed
4. Pot starts at position (75%, 45%)
5. Water amount = 0 (empty)
6. Temperature = 20°C (room temperature)

### Getting Water
1. User drags pot to top-left (sink area)
2. When pot position is x < 12% AND y < 15%, `waterInPot` is set to 0.5kg
3. Pot image changes from `pot-empty.png` to `pot-full.png`
4. "Drag pot to tap" hint disappears
5. "Turn Heat On" button appears

### Heating Water
1. User clicks "Turn Heat On" button
2. `heatOn = true`
3. Flame image appears on burner
4. Physics simulation starts running every 100ms

**Each simulation step:**
- Temperature increases based on heat input (2000J)
- Every 0.1 seconds: `ΔT = heatInput / (mass * specificHeat)`
- Example: 2000J into 0.5kg water = 0.96°C increase per step
- At sea level: boils when temperature reaches 100°C
- At 5000m: boils when temperature reaches ~83°C

### Boiling Detection
1. When `temperature >= boilingPoint`:
   - `isBoiling = true`
   - Steam effect appears (💨)
   - Status text changes to "Boiling! 🫖"
   - `showHook = true` - enables educational message

### Educational Hook
**If at sea level (altitude = 0):**
- Message: "Your water boiled at exactly 100°C!"
- Button: "📚 Learn more"

**If at altitude (altitude > 0):**
- Message: "Your water boiled at [boiling point]°C (not 100°C!) ❗"
- Button: "🤔 Curious why?"

Clicking "Learn more" calls `onStageChange(1)` to progress to Stage 1 (more educational content)

---

## Key Design Decisions

### Why Fixed 1280x800 Window?
- Original background image is 1280x800
- Using percentages for everything (pot, sink, flame) keeps them relative to this size
- Prevents scaling drift when browser is resized
- All coordinates are tied to a consistent grid

### Why Pointer Events Instead of Mouse Events?
- Works on desktop (mouse) and mobile (touch) equally well
- Pointer capture prevents interference from other elements
- More reliable cross-browser support

### Why ResizeObserver Then Changed?
- Initially tried to make scene responsive
- This caused pot to drift when window resized
- Switched to fixed 1280x800 window instead
- Much simpler and more predictable

### Why Percentages for Positioning?
- If we used pixels (e.g., `left: 960px`), pot position would break when game window scales
- Percentages (e.g., `left: 75%`) scale automatically with window
- Pot stays in same proportion of game window regardless of screen size

---

## Common Questions

### Why doesn't the pot fill instantly?
The code checks: `if (nearSink && waterInPot === 0)`
- Only fills if pot is at sink AND pot is currently empty
- Prevents accidental refilling while already holding water

### Why is there a dragOffset?
Without it, when you click the left edge of the pot, it would snap so the pot's center is at your cursor. With dragOffset, it stays where you grabbed it.

Example:
- Pot center at pixel 500
- You click pixel 400 (left edge)
- dragOffset = 400 - 500 = -100
- When you move cursor to pixel 450, pot center stays at 450 + (-100) = 350... wait that's wrong
- Actually: newX = cursorX - dragOffset = 450 - (-100) = 550, which is correct!

### Why does water evaporate?
When boiling, water turns to steam (evaporation). The code decreases `waterMass` each simulation step if boiling. This represents real physics.

### What if I drag pot off screen?
The boundary constraints (minXPercent=8, maxXPercent=92) prevent this. The pot can't go further than those percentages. With a 36% pot size, this means the visible pot can almost reach the edges.

---

## Testing Checklist

- [ ] Dragging pot works smoothly
- [ ] Pot snaps to sink (top-left) when dragged there
- [ ] Heat button only appears when pot has water
- [ ] Temperature increases from 20°C when heating
- [ ] Water boils at correct temperature for your altitude
- [ ] Altitude-based messages appear correctly
- [ ] Game window stays centered when browser is resized
- [ ] All fonts and buttons are readable
- [ ] Flame appears when heat is on, disappears when off
- [ ] Steam animation shows when boiling

