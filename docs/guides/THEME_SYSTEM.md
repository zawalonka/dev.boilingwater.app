# Theme System Documentation

**Version:** 1.0.0  
**Last Updated:** January 24, 2026  
**Status:** Pre-Alpha

## Overview

The Boiling Water game features a fully extensible theme system that allows creators to:
- Create custom visual themes for workshops or individual levels
- Customize colors, typography, and imagery
- Extend existing themes with parent theme inheritance
- Support workshop-level themes (apply to all levels) or level-specific themes
- Add new themes by simply dropping a JSON file into the themes directory

## Core Architecture

```
src/
├── constants/
│   └── themes.js           # Theme configuration constants and metadata
├── utils/
│   └── themeLoader.js      # Runtime theme loading, validation, application
├── data/
│   └── themes/
│       └── classic.json    # Default classic kitchen theme
└── styles/
    ├── index.css           # Global styles (uses theme CSS variables)
    ├── App.css
    ├── Header.css          # Uses --theme-* variables
    ├── GameScene.css       # Uses --theme-* variables
    └── ...
```

## Game Resolution Standard

**All themes use a fixed resolution:**
- **Width:** 1280 pixels
- **Height:** 800 pixels
- **Aspect Ratio:** 16:10
- **Format:** PNG images (no stretching or distortion)

This resolution is non-negotiable and ensures consistent gameplay across all themes.

## Theme File Structure

Each theme is a JSON file defining colors, images, typography, and metadata.

### Example Theme: `classic.json`

```json
{
  "id": "classic",
  "name": "Classic Kitchen",
  "scope": "workshop",
  "description": "The default kitchen theme...",
  
  "colors": {
    "header_background": "rgba(0, 0, 0, 0.85)",
    "button_primary": "#4CAF50",
    ...
  },
  
  "images": {
    "background": "/assets/workshops/classic/background.png",
    "pot_empty": "/assets/workshops/classic/pot-empty.png",
    "pot_full": "/assets/workshops/classic/pot-full.png",
    "flame": "/assets/workshops/classic/flame.png"
  },
  
  "typography": {
    "font_family_primary": "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    "heading_size": "2.5rem",
    ...
  },
  
  "metadata": {
    "author": "BoilingWater Team",
    "version": "1.0.0",
    "createdDate": "2026-01-24",
    "tags": ["default", "kitchen", "warm"],
    "suitableFor": ["elementary", "middle-school", "high-school"]
  }
}
```

## Theme Properties Reference

### Required Top-Level Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique identifier (lowercase, no spaces). Examples: `classic`, `dark`, `workshop_1` |
| `name` | string | Display name. Examples: "Classic Kitchen", "Dark Mode", "Chemistry Lab" |
| `scope` | string | Either `workshop` (applies to all levels) or `level` (single level only) |
| `colors` | object | Color definitions (see Colors section below) |
| `images` | object | Image asset paths (see Images section below) |
| `metadata` | object | Theme information and authorship |

### Optional Top-Level Fields

| Field | Type | Description |
|-------|------|-------------|
| `workshopId` | string | Workshop ID if scope is `workshop` |
| `levelId` | string | Level ID if scope is `level` |
| `parentTheme` | string | ID of parent theme to inherit from |
| `description` | string | Detailed description of theme |
| `typography` | object | Font and text styling definitions |
| `effects` | object | Optional VFX tuning (steam, flame glow). Prefer storing in `effects.json` next to `theme.json`; safe to omit for simple themes |

### Optional Effects File (`effects.json`)

- **Location:** `public/assets/themes/<themeId>/effects.json`
- **Purpose:** Theme-specific VFX tuning without bloating `theme.json` (e.g., steam symbol/glow, flame glow blur/intensity). If the file is absent, the game falls back to built-in defaults.
- **Example:**
```json
{
  "steam": {
    "enabled": true,
    "symbol": "💨",
    "color": "rgba(255, 255, 255, 0.95)",
    "glow": "rgba(255, 255, 255, 0.50)",
    "sizeRem": 1.6,
    "risePx": -46,
    "durationMs": 1400,
    "offset": { "xPercent": 0, "yPx": -34 }
  },
  "flameGlow": {
    "enabled": true,
    "color": "rgba(255, 136, 64, 0.85)",
    "blurPx": 18,
    "flickerMs": 360,
    "intensityByHeat": [0, 1, 1.1, 1.22]
  }
}
```
- **Opt-in only:** Do not create placeholder effects for minimal themes; omit the file entirely if you do not want VFX overrides.

---

## Colors

### Required Color Properties

Every theme MUST define these 8 core color properties:

```javascript
colors: {
  "header_background": "#000000",    // Header bar background
  "header_text": "#ffffff",          // Header text color
  "badge_background": "#ff0000",     // Pre-Alpha badge background
  "button_primary": "#4CAF50",       // Primary button color
  "button_hover": "#45a049",         // Primary button hover state
  "panel_background": "#ffffff",     // Panel/popup background
  "panel_text": "#333333",           // Panel text color
  "panel_border": "#cccccc"          // Panel border color
}
```

### Recommended Additional Colors

For a complete theme, also define:

```javascript
colors: {
  // Header (3)
  "header_text": "white",
  "header_accent": "#ff6600",
  
  // Buttons (8)
  "button_primary_text": "white",
  "button_secondary": "#2196F3",
  "button_secondary_text": "white",
  "button_secondary_hover": "#1976D2",
  "button_active": "#3d8b40",
  "button_active_text": "white",
  "button_disabled": "#cccccc",
  "button_disabled_text": "#666666",
  
  // Panels (2)
  "panel_accent": "#ff6600",
  
  // Game Elements (5)
  "burner_background": "#444444",
  "sink_background": "linear-gradient(135deg, #c0c0c0 0%, #808080 100%)",
  "water_color": "#87CEEB",
  "flame_glow": "#ff3300",
  
  // Feedback (6)
  "warning_background": "rgba(255, 193, 7, 0.2)",
  "warning_text": "#856404",
  "success_background": "rgba(76, 175, 80, 0.2)",
  "success_text": "#155724",
  "error_background": "rgba(244, 67, 54, 0.2)",
  "error_text": "#721c24"
}
```

### CSS Variable Naming

Colors are applied as CSS custom properties with the `--theme-` prefix:
- `header_background` → `--theme-header-background`
- `button_primary` → `--theme-button-primary`
- `water_color` → `--theme-water-color`

Use in CSS:

```css
.header {
  background: var(--theme-header-background);
  color: var(--theme-header-text);
}

.button {
  background: var(--theme-button-primary);
  color: var(--theme-button-primary-text);
}
```

---

## Images

### Required Image Assets

Every theme MUST provide these 4 images:

| Key | Purpose | Resolution | Format | Notes |
|-----|---------|------------|--------|-------|
| `background` | Main game scene | **1280×800** | PNG | No stretching, exact size |
| `pot_empty` | Empty pot sprite | Any size | PNG | Transparent background, maintain aspect ratio |
| `pot_full` | Full pot with water | Same as `pot_empty` | PNG | Transparent background, same proportions |
| `flame` | Flame animation | ~60×100 | PNG | Transparent background, optimized |

### Image Path Format

```json
"images": {
  "background": "/assets/themes/dark-mode/background.png",
  "pot_empty": "/assets/themes/dark-mode/pot-empty.png",
  "pot_full": "/assets/themes/dark-mode/pot-full.png",
  "flame": "/assets/themes/dark-mode/flame.png"
}
```

Paths can reference:
- **Relative to public folder:** `/assets/images/...`
- **Absolute URLs:** `https://example.com/images/...` (for cloud-hosted themes)

### Background Image Specifications

**Critical:** Background images MUST be exactly **1280×800 pixels** with NO scaling or stretching.

If resizing your original image:
- **Original:** Any size (e.g., 1024×1024, 2560×1600)
- **Target:** 1280×800 pixels
- **Tool:** Use Photoshop, GIMP, or online tools like [Bigjpg](https://bigjpg.com) or [ImageMagick](https://imagemagick.org)

**ImageMagick command:**
```bash
convert input.png -resize 1280x800! output.png
```

**Preserve aspect ratio (pillarbox/letterbox):**
```bash
convert input.png -resize 1280x800 -background white -gravity center -extent 1280x800 output.png
```

---

## Typography

Optional typography definitions for fonts and text styling.

```json
"typography": {
  "font_family_primary": "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
  "font_family_mono": "'Courier New', Courier, monospace",
  "heading_size": "2.5rem",
  "heading_weight": "700",
  "body_size": "1rem",
  "body_weight": "400",
  "button_size": "0.875rem",
  "button_weight": "500",
  "label_size": "0.75rem",
  "label_weight": "600"
}
```

These are applied as CSS custom properties:
- `--font-font-family-primary`
- `--font-heading-size`
- etc.

---

## Metadata

Essential information about the theme.

```json
"metadata": {
  "author": "Your Name or Organization",
  "version": "1.0.0",
  "createdDate": "2026-01-24",      // ISO format YYYY-MM-DD
  "updatedDate": "2026-01-24",
  "tags": ["educational", "kitchen", "warm"],
  "targetAudience": "educational",
  "suitableFor": ["elementary", "middle-school", "high-school"]
}
```

---

## How to Create a New Theme

### Step 1: Create Theme JSON File

Create folder: `public/assets/themes/[themeName]/`
Create file: `public/assets/themes/[themeName]/theme.json`

Copy and modify the alpha theme:

```json
{
  "id": "dark-mode",
  "name": "Dark Mode Chemistry",
  "scope": "workshop",
  "description": "A dark, modern theme for chemistry education",
  "colors": {
    "header_background": "#1a1a1a",
    "header_text": "#ffffff",
    ...
  },
  "images": {
    "background": "/assets/themes/dark-mode/background.png",
    "pot_empty": "/assets/themes/dark-mode/pot-empty.png",
    "pot_full": "/assets/themes/dark-mode/pot-full.png",
    "flame": "/assets/themes/dark-mode/flame.png"
  },
  "metadata": {
    "author": "Your Name",
    "version": "1.0.0",
    "createdDate": "2026-01-24"
  }
}
```

### Step 2: Create Asset Folder

Create directory: `public/assets/themes/[themeName]/`

Place your images there:
```
public/assets/themes/dark-mode/
├── background.png      # 1280×800, no stretching
├── pot-empty.png
├── pot-full.png
└── flame.png
```

### Step 3: Test Your Theme

The game will automatically discover and load your theme. To verify:

1. Build the project: `npm run build`
2. Check browser console for theme loading messages
3. Verify colors and images display correctly

### Step 4: Register Theme (Optional)

Update `src/constants/themes.js` `AVAILABLE_THEMES` object for discovery:

```javascript
export const AVAILABLE_THEMES = {
  'alpha': { ... },
  'dark-mode': {
    name: 'Dark Mode Chemistry',
    scope: 'workshop',
    description: 'A dark, modern theme...'
  }
}
```

---

## Workshop-Level Themes

A workshop-level theme applies to all levels in a workshop.

```json
{
  "id": "workshop_1",
  "name": "Advanced Chemistry Laboratory",
  "scope": "workshop",
  "workshopId": "workshop_1",
  "description": "Professional lab setting for advanced chemistry",
  ...
}
```

### Directory Structure

```
src/data/themes/
├── classic.json
├── workshop_1.json          # Applies to all levels in Workshop 1
├── workshop_2.json          # Applies to all levels in Workshop 2
└── ...
```

---

## Level-Specific Themes

A level-specific theme overrides the workshop theme for a single level.

```json
{
  "id": "workshop_1_level_3",
  "name": "Pressure Cooker Lab",
  "scope": "level",
  "workshopId": "workshop_1",
  "levelId": "level_3",
  "description": "Advanced pressure cooker simulation",
  "parentTheme": "workshop_1"
}
```

### Resolution Order

When loading a level's theme:
1. Look for a level-specific theme matching `workshopId` + `levelId`
2. If not found, use the workshop-level theme
3. If not found, use the default (`classic`) theme

---

## Theme Inheritance (Parent Themes)

A theme can extend another theme instead of redefining everything.

```json
{
  "id": "workshop_1_dark",
  "name": "Workshop 1 - Dark Mode",
  "parentTheme": "workshop_1",
  "colors": {
    "header_background": "#1a1a1a",
    "header_text": "#ffffff"
  }
}
```

When loaded, the child theme merges with the parent:
- Parent theme properties are loaded first
- Child theme properties override/extend parent properties
- Only modified properties need to be specified

---

## API Reference

### Loading Themes Programmatically

```javascript
import { loadTheme, initializeTheme, applyTheme } from '../utils/themeLoader'

// Simple: Load and apply immediately
await initializeTheme('dark-mode')

// Advanced: Load without applying
const theme = await loadTheme('workshop_1')
const processed = processTheme(theme)
// ... do something with processed theme
applyTheme(processed)

// Get available themes
const themes = await getAvailableThemes()

// Get themes for specific workshop
const workshopThemes = await getWorkshopThemes('workshop_1')

// Get theme for specific level
const levelTheme = await getLevelTheme('workshop_1', 'level_3')
```

### ThemeLoader Functions

| Function | Purpose | Returns |
|----------|---------|---------|
| `loadTheme(id)` | Load theme JSON from file | Promise<Object> |
| `validateThemeData(data)` | Validate theme structure | void (throws on error) |
| `processTheme(data, parent?)` | Prepare theme for application | Object |
| `applyTheme(processed)` | Apply theme to DOM | void |
| `getAvailableThemes()` | List all available themes | Promise<string[]> |
| `getWorkshopThemes(id)` | Get all themes for workshop | Promise<Object[]> |
| `getLevelTheme(workshop, level)` | Get theme for specific level | Promise<Object> |
| `initializeTheme(id, options)` | Full pipeline: load → process → apply | Promise<Object> |

---

## CSS Variables

### Color Variables

Applied with `--theme-` prefix:

```css
.header { background: var(--theme-header-background); }
.button { background: var(--theme-button-primary); }
.warning { background: var(--theme-warning-background); }
```

### Typography Variables

Applied with `--font-` prefix:

```css
body { font-family: var(--font-font-family-primary); }
h1 { font-size: var(--font-heading-size); }
button { font-weight: var(--font-button-weight); }
```

---

## Color Best Practices

### Accessibility

- Maintain at least 4.5:1 contrast ratio between text and background
- Don't rely only on color to convey information
- Test with contrast checkers like [WebAIM](https://webaim.org/resources/contrastchecker/)

### Pedagogical

- Use colors that reinforce learning goals
- Chemistry themes: Use periodic table colors (metals, nonmetals, gases)
- Kitchen themes: Use warm, familiar colors
- Lab themes: Use professional, neutral colors

### Color Formats Supported

```json
{
  "colors": {
    "hex": "#ff6600",
    "rgba": "rgba(255, 102, 0, 0.8)",
    "rgb": "rgb(255, 102, 0)",
    "named": "orange",
    "hsl": "hsl(20, 100%, 50%)"
  }
}
```

---

## Troubleshooting

### Images not loading

- Check file paths are relative to `public/` folder
- Ensure image files exist: `public/[path-from-json]`
- Use browser DevTools (F12) → Network tab to see 404 errors

### Colors not applying

- Check CSS variable names (should have `--theme-` prefix)
- Verify JSON color values are valid CSS colors
- Check for typos in color property names

### Theme not found

- Confirm JSON file exists in `src/data/themes/`
- Check JSON syntax is valid (use [JSON Linter](https://jsonlint.com/))
- Check browser console for error messages

### Aspect ratio distortion

- Background MUST be exactly 1280×800 pixels
- Use exact-size resize (no aspect ratio preservation for background)
- Other images (pot, flame) can be any size as long as proportions look good

---

## Future Enhancements

- [ ] UI theme selector dropdown in game menu
- [ ] Theme preview before applying
- [ ] Support for custom CSS in themes
- [ ] Animated color transitions when switching themes
- [ ] Cloud-based theme sharing/distribution
- [ ] Theme preview images in theme manifest
- [ ] Color accessibility validator
- [ ] Automatic dark mode detection and theme switching

---

## Support & Questions

For issues or questions about the theme system:
1. Check this documentation first
2. Review the classic theme as a reference
3. Check browser console for error messages
4. Examine `src/utils/themeLoader.js` for implementation details

