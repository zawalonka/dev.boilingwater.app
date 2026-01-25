# Boiling Water - Development Guide

## 🎯 Project Overview

Boiling Water is an interactive physics and chemistry learning game built with React. This guide will help you set up the development environment and understand the project architecture.

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18.x or higher
- **npm** or **yarn** package manager
- A modern web browser (Chrome, Firefox, Edge, or Safari)

### Initial Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm run dev
   ```
   The app will open automatically at `http://localhost:3000`

3. **Build for production:**
   ```bash
   npm run build
   ```
   Output will be in the `dist/` directory

### Available Commands

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

## 📁 Project Structure

```
boilingwater-app/
├── src/
│   ├── components/        # React components
│   │   └── KitchenScene.jsx
│   ├── utils/            # Utility functions
│   │   └── physics.js    # Core physics calculations
│   ├── constants/        # Constants and configuration
│   │   └── physics.js    # Physical constants
│   ├── styles/           # CSS files
│   │   ├── index.css
│   │   ├── App.css
│   │   └── KitchenScene.css
│   ├── App.jsx           # Main app component
│   └── main.jsx          # Entry point
├── public/               # Static assets
├── index.html            # HTML entry point
├── package.json          # Dependencies and scripts
├── vite.config.js        # Vite configuration
└── README.md             # Project readme
```

## 🧪 Physics Engine Architecture

### Core Philosophy

**Real Physics Only** - All calculations use actual thermodynamic equations and empirical data.

### Key Modules

#### `src/constants/physics.js`
Physical constants based on real-world data:
- Water properties (specific heat, heat of vaporization, density)
- Atmospheric properties (pressure, temperature lapse rate)
- Universal constants (gas constant)

#### `src/utils/physics.js`
Core physics calculations:

- **`calculateBoilingPoint(altitude)`** - Determines boiling point based on elevation
- **`calculatePressure(altitude)`** - Barometric pressure at altitude
- **`calculateHeatingEnergy(mass, tempStart, tempEnd)`** - Energy needed to heat water (Q = mcΔT)
- **`applyHeatEnergy(mass, currentTemp, energyJoules, boilingPoint)`** - Applies energy and handles phase changes
- **`simulateTimeStep(state, heatInputWatts, deltaTime)`** - Main simulation loop

### Simulation Loop

The game runs a discrete-time simulation:
1. Time step: 100ms (configurable in `GAME_CONFIG.TIME_STEP`)
2. Heat input: Constant watts (default: 2000W for stove)
3. Energy distribution: Temperature increase OR phase change (never both simultaneously at boiling point)

## 🎨 Component Architecture

### Current Components

#### `App.jsx`
- Root component
- Manages game stage progression
- Handles user location (for altitude-based calculations)

#### `KitchenScene.jsx`
- Stage 0: Basic boiling water interaction
- Manages simulation state
- Renders kitchen visuals and controls
- Displays "the hook" when water boils

### Planned Components

- `LabScene.jsx` - Advanced laboratory environment (Stage 3+)
- `DetailPanel.jsx` - Expandable physics details for advanced users
- `LanguageToggle.jsx` - Adaptive vocabulary system
- `PhaseChart.jsx` - Temperature over time visualization
- `EnergyDiagram.jsx` - Energy flow visualization

## 🎮 Game Stages

### Stage 0: Just Boil Water (Simplified Mode)
**Goal:** 30-second experience that provides instant utility

**Flow:**
1. Fill pot with water
2. Turn on heat
3. Watch water heat up
4. Water boils at altitude-specific temperature
5. Hook appears → curiosity trigger

**Physics:** Simplified but based on real equations

### Stage 1: Why Altitude Matters (Planned)
- Temperature becomes prominent
- Altitude display
- Explanation of pressure effects
- F/C toggle unlocks

### Stage 2+: Progressive Complexity (Planned)
See [BoilingWater_Full_Documentation.md](BoilingWater_Full_Documentation.md) for complete roadmap

## 🔬 Adding New Physics

When adding new physics simulations:

1. **Add constants** to `src/constants/physics.js`
2. **Implement calculations** in `src/utils/` (separate files for different domains)
3. **Use real data** - cite sources in comments
4. **Document simplifications** - if you must approximate, explain why

### Example: Adding a New Substance

```javascript
// In src/constants/physics.js
export const ETHANOL_CONSTANTS = {
  SPECIFIC_HEAT_LIQUID: 2.44, // J/(g·K) at 25°C
  HEAT_OF_VAPORIZATION: 838, // kJ/kg at boiling point
  BOILING_POINT_SEA_LEVEL: 78.37, // °C
  DENSITY: 0.789 // kg/L at 20°C
}
```

## 🎨 Styling Guidelines

- **Mobile-first:** Design for small screens, enhance for desktop
- **Clear iconography:** Visual elements should be obvious and clickable
- **Warm colors:** Kitchen stage uses warm tones (#f9f3e8, #ede4d3)
- **Cool colors:** Lab stage will use cooler tones
- **Animations:** Subtle and purposeful (bubbling, steam, heat)

## 🌐 Future: Electron Wrapper

The React app will be wrapped in Electron for desktop distribution:

```
boilingwater-app/
├── electron/
│   ├── main.js           # Electron main process
│   └── preload.js        # Preload scripts
└── electron-builder.json # Build configuration
```

This enables:
- Steam distribution
- Local file saving for custom experiments
- Offline functionality

## 🧩 Modding System (Future)

Experiments will be shareable via JSON files:

```json
{
  "name": "Custom Experiment",
  "description": "Description here",
  "constants": {
    "gravity": 9.81,
    "atmospheric_pressure": 101325
  },
  "initialState": {
    "waterMass": 1.0,
    "temperature": 20
  }
}
```

## 📚 Learning Resources

### Physics References
- **Thermodynamics:** Fundamentals of Engineering Thermodynamics
- **Water properties:** NIST Chemistry WebBook
- **Atmospheric science:** NOAA data

### Code References
- **React:** [react.dev](https://react.dev)
- **Vite:** [vitejs.dev](https://vitejs.dev)

## 🐛 Common Issues

### Issue: React not found
**Solution:** Run `npm install`

### Issue: Port 3000 already in use
**Solution:** Either:
- Close other apps using port 3000
- Or modify port in `vite.config.js`

## 🤝 Contributing

This project is in early development. Key areas where contributions will be welcome:

1. **Physics accuracy** - Verify equations and constants
2. **Visual design** - Improve UI/UX
3. **Accessibility** - Ensure keyboard navigation, screen readers
4. **Chemistry expansion** - Add new substances and reactions
5. **Language system** - Build adaptive vocabulary database

## 📝 Code Style

- Use **Prettier** for formatting (run `npm run format`)
- Follow **ESLint** rules (run `npm run lint`)
- Write clear comments for complex physics calculations
- Cite sources for physical constants

## 🎯 Current Development Focus

**Phase:** MVP Development - Stage 0

**Priorities:**
1. ✅ Basic project structure
2. ✅ Core physics engine (thermodynamics)
3. ✅ Stage 0 interface (simplified boiling)
4. 🔲 Geolocation for altitude detection
5. 🔲 Refined visuals and animations
6. 🔲 Stage 1 (altitude explanation)

## 📞 Questions?

See the full project vision in [BoilingWater_Full_Documentation.md](BoilingWater_Full_Documentation.md)

---

**Status:** Early Development | **Updated:** January 2026
