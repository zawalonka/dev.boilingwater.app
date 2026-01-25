# BOILING WATER - Full Project Documentation

**Game Title:** Boiling Water  
**Date:** January 24, 2026  
**Status:** Planning Phase  
**Tagline:** "Learn chemistry by doing it"

---

## Core Vision

A physics and chemistry simulation game that teaches through play, similar to how Kerbal Space Program teaches orbital mechanics. The game must be:
- **Accessible to complete beginners** (starting with boiling water)
- **Satisfying to experts** (using real physics equations and data)
- **Transparent about its limitations** (like KSP's N-body physics compromise)

### The SEO Strategy

**The Brilliant Twist:** Make the game immediately useful for its literal search term.

Someone googles "how to boil water" → finds BoilingWater.com → gets an instant, interactive tutorial that actually teaches them how to boil water.

**Key Requirements:**
- **Zero load barriers** - No login, no splash screen, game starts immediately
- **Instant utility** - Works as actual instructions within 30 seconds
- **The hook** - Personalized surprise (water boils at different temp than expected) creates curiosity
- **Optional depth** - Can leave satisfied OR dive deeper into learning

**First-time user flow:**
1. Page loads instantly (kitchen scene: stove + pot + sink)
2. Simple instruction: "Fill the pot with water" (click/drag)
3. "Turn heat to high" (click)
4. Timer appears (calculated from user's location - altitude + weather)
5. Water boils at their ACTUAL altitude temperature
6. **The Hook:** "💧 Your water boiled at 98.3°C (not 100°C!) ❗ Curious why? [Tap to learn]"

This serves TWO audiences:
- **Bob who just wanted to boil water** - leaves satisfied, got answer in 30 seconds
- **Curious Bob** - clicks the hook, enters the learning game

### Zero-Physics First Stage

The very first interaction may not even use real physics (or uses heavily simplified version):
- Gets people started FAST
- No computation overhead
- Clear "Simplified Mode" indicator or "Enable Real Physics" option
- Once they're engaged, THEN load the full simulation

---

## Guiding Principles

### 1. Real Numbers Only
- Use actual thermodynamic equations and empirical data
- No "game physics" - only simplify when computationally necessary
- When simplifications are needed, document them clearly
- Example: Use real specific heat capacity (4.186 J/g°C), real enthalpy of vaporization (2,257 kJ/kg)

### 2. Approachable Language
- Start with plain English explanations (inspired by "Thing Explainer")
- Gradually introduce technical terms with context
- Never assume jargon knowledge
- Provide multiple language levels for all concepts

### 3. Layered Interface
- Simple visual interface for beginners
- Detailed panels showing real calculations for advanced users
- Allow users to "dig deeper" when they're ready
- Show the actual equations running under the hood

---

## Starting Point: Boiling Water

**Why start here?**
- Everyone understands water boiling
- Teaches fundamental concepts:
  - Heat transfer (energy input)
  - Temperature vs. energy (heat capacity)
  - Phase changes (state transitions)
  - Pressure effects (altitude)
  - Energy distribution (why temp stops rising at boiling point)

**Variables to Track:**
- Water temperature (°C)
- Altitude (affects boiling point)
- Heat input (watts or J/s)
- Water mass (kg)
- Steam generation rate (kg/s)
- Atmospheric pressure (Pa)
- Energy going to temperature vs. phase change

**Real Physics:**
- Specific heat: 4.186 J/(g·K)
- Heat of vaporization: 2,257 kJ/kg
- Boiling point vs altitude: ~1°C decrease per 300m elevation

---

## Long-Term Expansion: Chemistry

**Progression Path:**
1. **Phase 1:** Thermodynamics (boiling, freezing, heating, cooling)
2. **Phase 2:** Mixing substances (solutions, concentrations)
3. **Phase 3:** Chemical reactions (stoichiometry, equilibrium)
4. **Phase 4:** Separation techniques (distillation, crystallization)
5. **Phase 5:** Complex chemistry (reaction mechanisms, kinetics)

**Goal:** Create a tool where someone with zero chemistry knowledge can experiment and learn, while a chemistry expert can model real-world processes (like petroleum refining).

---

## Progressive Unlocking System

The game reveals complexity gradually based on user engagement.

### Stage 0: Just Boil Water (Bob's 30-second experience)
**Equipment:**
- Simple kitchen stove (on/off only)
- One pot
- Water tap

**Actions:**
- Fill pot
- Turn on heat
- Wait
- Water boils

**Display:**
- Minimal UI
- Simple timer
- Basic temperature (optional)
- "Simplified Mode" indicator

**Exit point:** User got their answer, leaves happy.  
**Hook:** Altitude-based temperature surprise → "Learn why?"

### Stage 1: Why Altitude Matters
**Unlocks after clicking the hook:**
- Temperature readout becomes prominent
- Altitude display appears
- Explanation: "You're at 2,000ft - air pressure is lower - water boils sooner!"
- Fahrenheit/Celsius toggle unlocks
- First introduction to metric system

**New actions:**
- Toggle F/C
- See altitude effect visualization
- Option: "Try different altitudes?"

### Stage 2: Temperature Control
**Equipment upgrade:**
- Precision hotplate (replaces simple stove)
- Now can set EXACT temperature (±0.1°C)

**New concepts:**
- Why precise temperature matters
- Preview of what comes next (cooking, chemistry needs exact temps)
- Introduction to "equipment accuracy"

### Stage 3: Measurement Precision
**Concepts introduced:**
- Significant figures
- Measurement accuracy
- Equipment limitations (cheap thermometer vs. lab thermometer)

**Equipment upgrades:**
- Better thermometer (more decimal places)
- Introduces idea: better tools = better data

### Stage 4: Energy and Phase Changes
**The big concept unlock:**
- Detailed panel becomes available
- Shows energy going into temp vs. phase change
- Graph: temperature over time (flat line at boiling point!)
- "Why does temperature stop rising?"

**New vocabulary (adaptive level):**
- Specific heat
- Heat of vaporization (or "state change energy")
- Phase diagram introduction

### Stage 5+: Chemistry Expansion
- Mixing substances
- Solutions and concentrations
- Chemical reactions
- Separation techniques
- And beyond...

---

## Adaptive Language System

### The Problem
- Technical terms intimidate beginners
- Experts need precise language
- People learn vocabulary at different rates

### The Solution: Multi-Level Language

**Level 1 (Beginner - Thing Explainer Style):**
- "Heat energy needed to make water become air"
- "How hard the air pushes on the water"

**Level 2 (Intermediate):**
- "Energy for state change (liquid → gas)"
- "Atmospheric pressure"

**Level 3 (Standard Technical):**
- "Enthalpy of vaporization" (with subtitle: "energy for state change")
- "Standard atmospheric pressure"

**Level 4 (Expert):**
- "ΔH_vap = 2,257 kJ/kg"
- Full scientific notation

### Adaptive Learning
The game tracks:
- How many times a concept appears
- Whether player hovers over definitions
- Time spent on each concept

After repeated exposure, the game offers to "level up" the language:
*"You've used this concept a bunch! Want to start calling it by its science name?"*

### Implementation Features
- Hover tooltips with definitions
- Switchable language modes
- Progress tracking ("Words I've learned")
- Etymology explanations (why is it called that?)
- No shame - learning is celebrated

---

## "What If?" Sandbox Mode

**The Concept:**
Allow users to modify fundamental physics constants to explore "what if" scenarios.

**Examples:**
- "What if water froze at 10°C instead of 0°C?"
- "What if Earth had different atmospheric pressure?"
- "What if gravity was weaker - how would boiling change?"

**Educational Value:**
- Teaches physical relationships by breaking them
- Builds intuition about cause and effect
- Makes abstract concepts concrete
- Similar to how KSP teaches orbits through play

**Architecture:**
```
Core Simulation Engine (invariant)
    ↓
Physical Constants Layer (user-modifiable)
    ↓
Calculations
    ↓
Visualization
```

**Shareable Experiments:**
- Save/load custom physics configurations
- Share experiments as JSON files
- Community "What if?" challenges
- Steam Workshop integration

---

## Technical Platform

### Decision: Web App (React) + Electron Wrapper

**Development:**
- Build as React web app
- Run in browser during development
- Fast iteration with hot-reload

**Distribution:**
- Wrap in Electron for desktop app
- Distribute on Steam as native application
- Users download like any other game

**Why This Approach:**
1. **Simplicity** - Web tech is straightforward for this type of app
2. **Not a traditional game** - More of an interactive simulation/visualization tool
3. **JSON-based modding** - Easy to create and share custom scenarios
4. **No game engine overhead** - Don't need 3D rendering, physics engines, etc.
5. **Community sharing** - Web tech makes it easy to export/import experiments
6. **Local file saving** - Electron provides full file system access

**What We DON'T Need from Game Engines:**
- 3D rendering
- Built-in physics engines (we're writing custom thermodynamics)
- Complex asset pipelines
- Scene graphs
- Traditional game loops

**What We DO Need:**
- Data visualization
- Real-time calculation display
- State management
- User interface components
- File I/O for saving experiments

---

## User Interface Philosophy

### Surface Level (Beginner View)
- Clean iconographic display
- Simple controls (sliders for heat, buttons for actions)
- Visual feedback (water color changes, steam animation)
- Basic readouts in plain language

### Detail Panels (Advanced View)
- All physics variables visible
- Real-time equation display
- Graphs and charts
- Energy flow diagrams
- Calculation breakdowns

### Example: Boiling Water Interface

**Simple View:**
- Icon of pot with water
- Heat source (adjustable)
- Temperature gauge
- "Water is boiling" indicator
- Steam animation

**Detailed View (expandable):**
- Current temperature: 100°C
- Altitude: 0m (sea level)
- Boiling point: 100°C
- Heat input: 5,000 J/s
- Energy to temperature: 0 J/s (at boiling point)
- Energy to phase change: 5,000 J/s
- Steam generation: 0.0022 kg/s
- Total water remaining: 0.998 kg
- Graph showing temp over time
- Energy distribution pie chart

---

## Key Physics Concepts (Starting Set)

### Heat Transfer
- **What it is:** Energy flowing from hot to cold
- **Equation:** Q = mcΔT
- **Real numbers:** Specific heat of water = 4.186 J/(g·K)

### Phase Change
- **What it is:** Matter changing state (solid/liquid/gas)
- **Key insight:** Temperature doesn't change DURING phase transition
- **Equation:** Q = mL (L = latent heat)
- **Real numbers:** L_vap (water) = 2,257 kJ/kg

### Pressure-Temperature Relationship
- **What it is:** How pressure affects boiling/freezing points
- **Why it matters:** Water boils at different temps at different altitudes
- **Real numbers:** ~1°C drop per 300m elevation

### Energy Conservation
- **What it is:** Energy doesn't disappear, it changes form
- **In game:** Input energy = energy raising temp + energy making steam

---

## Design Constraints

### What We Can Do Perfectly
- All thermodynamic calculations (deterministic equations)
- Phase transitions
- Pressure/temperature relationships
- Heat transfer
- Solution chemistry
- Stoichiometry
- Equilibrium chemistry
- Reaction kinetics

### Where We Use Real Data (Not Ab Initio Simulation)
- Molecular properties (from experimental databases)
- Bond energies (empirical values)
- Reaction enthalpies (measured data)
- Rate constants (experimental)

**This is NOT a compromise** - professional chemists use the same data sources.

### What We Won't Simulate
- Quantum mechanics (electron orbitals)
- Molecular dynamics at atomic level
- (These aren't needed for chemistry education)

---

## Modding & Community

### Experiment Files
- JSON format for physics constants
- Easy to read and edit
- Shareable via Steam Workshop or direct file transfer

### Custom Scenarios
Users can create:
- Modified physics (alternative universe)
- Challenges (separate this mixture with limited tools)
- Historical recreations (how penicillin was purified)
- Real-world processes (petroleum refining)

### Example Mod File
```json
{
  "name": "Low Gravity World",
  "description": "What if Earth had half gravity?",
  "constants": {
    "gravity": 4.905,
    "atmospheric_pressure": 101325,
    "water_boiling_point": 100
  }
}
```

---

## Educational Philosophy

### Learning by Doing
- No lectures, just experimentation
- Immediate visual feedback
- Safe environment to fail
- Natural discovery of relationships

### Scaffolding
- Start with familiar (boiling water)
- Build complexity gradually
- Each concept builds on previous ones
- Always provide context

### No Gatekeeping
- Plain language first
- Technical terms introduced gradually
- Never assume prior knowledge
- Make "I don't know" okay

### Celebration of Learning
- Track concepts mastered
- Reward vocabulary growth
- Show progress visually
- No punishment for mistakes

---

## Success Metrics

**For Beginners:**
- "I understand why water boils now"
- "I can explain what happens at different altitudes"
- Confidence to experiment

**For Intermediates:**
- Can predict outcomes
- Understands energy relationships
- Comfortable with basic technical terms

**For Experts:**
- Can model real-world processes
- Verifies calculations against reference data
- Creates complex custom scenarios
- Uses as actual chemistry tool

---

## Next Steps (Planning Phase)

1. **Finalize core physics engine architecture**
   - Decide on calculation frequency (real-time? step-based?)
   - Structure for extensibility (chemistry additions)
   - Data persistence approach

2. **Create language database**
   - Compile term definitions at all levels
   - Plan vocabulary progression
   - Design tooltip/help system

3. **Design first experiment (boiling water)**
   - Define all variables
   - Create visual mockups
   - Plan UI transitions (simple ↔ detailed)

4. **Prototype interaction flow**
   - How users adjust parameters
   - How feedback is displayed
   - How language levels switch

5. **Research chemistry expansion**
   - What concepts build naturally from thermodynamics?
   - What equipment/processes to model?
   - What real-world data sources to use?

---

## Questions to Resolve

- How detailed should visual animations be? (icon-based vs. more realistic)
- Should there be tutorial "missions" or pure sandbox?
- How to handle time (real-time sim? adjustable speed? step-based?)
- Save system: auto-save experiments? manual save?
- Multiplayer/collaborative mode? (probably not v1)
- Audio feedback? (bubbling sounds, etc.)

---

## Game Name

**Title:** Boiling Water

**Why this name is perfect:**
1. **Literal and searchable** - People searching "how to boil water" will find it
2. **Simple and memorable** - No clever puns, just exactly what it is
3. **Approachable** - Sounds friendly, not intimidating
4. **Expandable** - Even when game covers all of chemistry, the name reminds you it started simple

**Domain strategy:**
- Primary goal: boilingwater.com (currently "for sale")
- Alternatives if .com unavailable (see Domain TLD section below)
- Important: Whatever domain is used, make it instantly accessible (no barriers to entry)

**Tagline options:**
- "Learn chemistry by doing it"
- "Real physics, real learning"
- "Start simple, go deep"

---

## Visual Design Philosophy

### Art Style: Semi-Realistic Iconography

**Goal:** Clear enough to understand immediately, stylized enough to be appealing and not cluttered.

**Reference style:** Mobile game UI clarity meets educational simulation. Think "Monument Valley" level of clean iconography, but for lab equipment.

### Scene Structure

**Static backgrounds:**
- Kitchen (Stage 0-2): Counter with stove and sink, warm/approachable colors
- Laboratory (Stage 3+): Lab bench with equipment mounts, cleaner/cooler colors
- Backgrounds don't move, they just upgrade as player progresses

**Interactive elements:**
- Clear, obvious clickable objects
- Pots, beakers, burners, thermometers, etc.
- Large enough to be easily clickable
- Visual feedback on hover/selection

### UI Principles

**Beginner view:**
- Minimal text
- Large, obvious controls
- Visual feedback (water color changes, steam animation)
- Simple iconography for states (💧 = water, 🌡️ = temperature)

**Advanced view (expandable panels):**
- Detailed readouts
- Graphs and charts
- Equations (when requested)
- Multiple data displays

**Animations:**
- Water filling (smooth)
- Heat rising (color change: blue → light blue → bubbles)
- Steam rising (particle effect, more/faster with higher heat)
- Temperature gauge rising
- State change indicators

### Accessibility

**Color choices:**
- Avoid relying solely on color for information
- Use icons + color together
- Colorblind-friendly palette
- High contrast option

**Text:**
- Clean, readable fonts
- Scalable text size
- No critical information in small print

---

- **Current status:** Deep planning, not yet coding
- **Creator's learning style:** Visual/conceptual thinker, vocabulary takes time
- **Target audience:** Anyone curious about science, regardless of background
- **Philosophy:** Make chemistry approachable the way KSP made orbital mechanics approachable
