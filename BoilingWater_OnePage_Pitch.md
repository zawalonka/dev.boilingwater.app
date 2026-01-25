# BOILING WATER - One-Page Pitch

## The Concept
An interactive physics and chemistry learning game that starts with the simplest possible task: boiling water. Like Kerbal Space Program taught orbital mechanics through play, Boiling Water teaches thermodynamics and chemistry through experimentation.

## The Hook
**SEO Play:** Someone googles "how to boil water" → finds BoilingWater.com → gets instant interactive tutorial  
**The Twist:** Water boils at 98°C (not 100°C!) because they're at altitude → curiosity triggered → learning begins

## Core Principles
1. **Real Physics Only** - Use actual thermodynamic equations and empirical data, no game physics
2. **Approachable Language** - Start with plain English, gradually introduce technical terms with adaptive vocabulary system
3. **Layered Complexity** - Simple interface for beginners, detailed physics panels for experts
4. **Zero Gatekeeping** - No login required, instant load, no jargon assumptions

## First Experience (30 seconds)
1. Page loads instantly - kitchen scene with stove and pot
2. "Fill the pot with water" (click)
3. "Turn heat to high" (click)
4. Timer shows (uses their location for altitude/weather)
5. Water boils at their actual altitude temp
6. **Hook:** "Your water boiled at 98.3°C - curious why? [Learn more]"

## Educational Progression
- **Stage 0:** Just boil water (simplified, almost no physics)
- **Stage 1:** Why altitude matters (unlock temperature explanations)
- **Stage 2:** Metric system introduction (F↔C conversion, why scientists use Celsius)
- **Stage 3:** Precision equipment (hotplates with exact temp control)
- **Stage 4+:** Pressure effects, energy calculations, phase diagrams, then chemistry...

## Long-Term Vision
Start with boiling water → expand to full thermodynamics → add chemistry (mixing, reactions, separation techniques) → become the educational chemistry sandbox. Eventually: model real-world processes like distillation, crystallization, industrial chemistry.

## "What If?" Sandbox Mode
Let users modify physics constants: "What if water froze at 10°C?" or "What if gravity was half?" Learn by breaking the rules. Share custom experiments with the community (Steam Workshop integration).

## Technical Approach
- **Platform:** React web app wrapped in Electron for Steam distribution
- **Why not a game engine:** This is a data visualization/simulation tool, not a traditional game. Don't need 3D rendering or built-in physics - we're writing custom thermodynamics
- **Modding:** JSON-based experiment files, easy community sharing

## Visual Style
Semi-realistic iconography. Static backgrounds (kitchen → lab), clear clickable elements (pots, beakers, heat sources). Think mobile game clarity meets educational simulation.

## Adaptive Language System
Track user progress and gradually level up vocabulary:
- **Level 1:** "Heat energy needed for state change"
- **Level 2:** "Energy for phase change (liquid → gas)"
- **Level 3:** "Enthalpy of vaporization"
- **Level 4:** "ΔH_vap = 2,257 kJ/kg"

User controls their level, game offers to "level up" terminology after repeated exposure. Hover tooltips always available. Inspired by "Thing Explainer" by Randall Munroe.

## Why This Will Work

**Educational Gap:** Chemistry education is intimidating and abstract. KSP proved complex physics can be learned through play when made accessible and fun.

**SEO Advantage:** Actual utility (how to boil water) brings organic traffic, converts curious users into learners.

**Scalability:** Start simple (boiling water), expand infinitely (full chemistry sandbox). Each concept builds naturally on the previous.

**No Competition:** Nothing exists that combines real physics, adaptive language learning, and gaming accessibility for chemistry education.

## Success Metrics
- **Beginner:** "I understand why water boils at different temperatures now"
- **Intermediate:** Can predict outcomes and explain energy relationships
- **Expert:** Uses it as actual chemistry modeling tool, creates custom experiments

## Next Steps
1. Secure domain (boilingwater.io or .game if .com unavailable)
2. Build MVP: just the first boiling water interaction
3. Test the hook conversion rate (how many click "learn more")
4. Iterate and expand based on user engagement

---

**Working Title:** Boiling Water  
**Tagline:** "Learn chemistry by doing it"  
**Target Platform:** Web (Steam distribution via Electron)  
**Inspiration:** Kerbal Space Program meets Thing Explainer
