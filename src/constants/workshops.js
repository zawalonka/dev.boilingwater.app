/**
 * Theme Constants & Configuration
 * 
 * NEW STRUCTURE: Levels → Themes
 * Each level can have multiple themes. Themes define the visual style for that level.
 * 
 * HIERARCHY:
 * ├── Level (e.g., "Boil Water", "Pressure Cooker")
 *     ├── Theme 1 (e.g., "Pre Alpha Kitchen 1", "Alpha Kitchen")
 *     ├── Theme 2
 *     └── ...
 * 
 * THEME STRUCTURE:
 * ├── id: Unique identifier for theme
 * ├── name: Display name
 * ├── levelId: Which level this theme belongs to
 * ├── colors: Color scheme definitions
 * ├── images: Image asset paths
 * ├── typography: Font and text styling
 * └── metadata: Additional info (created date, author, description, etc.)
 */

/**
 * EXPERIMENT SYSTEM
 * 
 * Structure:
 * Level 1: Core Experiments with boiling water
 *   - Experiment 1: Boiling Water (Tutorial)
 *   - Experiment 2: Altitude's Effect on Boiling Point
 *   - Experiment 3: Pressure Effects (future)
 *   - Experiment 4: Boiling Different Substances (future)
 * Level 2+: Advanced experiments (future)
 */

export const EXPERIMENTS = {
  // LEVEL 1: CORE EXPERIMENTS (Exp 1 is the tutorial)
  1: [
    {
      id: 'boiling-water',
      name: 'Boiling Water',
      level: 1,
      description: 'Learn the basics: what is boiling and how does temperature work?',
      requiresLocation: false,
      isTutorial: true,
      order: 1
    },
    {
      id: 'altitude-effect',
      name: 'Altitude\'s Effect on Boiling Water',
      level: 1,
      description: 'Discover how altitude changes the boiling point of water',
      requiresLocation: true,
      isTutorial: false,
      order: 2
    },
    {
      id: 'different-fluids',
      name: 'Different Fluids',
      level: 1,
      description: 'Explore how different fluids behave when heated',
      requiresLocation: false,
      isTutorial: false,
      order: 3
    },
    {
      id: 'lvl-1-4plus-tbd',
      name: '4+ TBD',
      level: 1,
      description: 'Placeholder for Level 1 (future experiments)',
      requiresLocation: false,
      isTutorial: false,
      order: 4
    }
  ],
  
  // LEVEL 2: ADVANCED
  2: [
    {
      id: 'lvl-2-tbd',
      name: 'Lvl 2 TBD',
      level: 2,
      description: 'Placeholder for Level 2 experiments',
      requiresLocation: false,
      isTutorial: false,
      order: 1
    }
  ]
}

// Available levels in the game
export const LEVELS = [
  {
    id: 1,
    name: 'Level 1',
    description: 'Core experiments with boiling water',
    order: 1
  },
  {
    id: 2,
    name: 'Lvl 2 TBD',
    description: 'Advanced experiments (coming soon)',
    order: 2
  },
  {
    id: 3,
    name: 'Level 3',
    description: 'Professional laboratory conditions (coming soon)',
    order: 3
  }
]

// Standard game resolution for all themes - DO NOT CHANGE
export const GAME_RESOLUTION = {
  width: 1280,
  height: 800
}

// Image specifications for theme assets
export const IMAGE_SPECS = {
  background: {
    width: 1280,
    height: 800,
    format: 'PNG',
    description: 'Main game scene background'
  },
  pot_empty: {
    width: null,  // Aspect ratio should match original
    height: null,
    format: 'PNG',
    description: 'Empty pot sprite (transparent background)'
  },
  pot_full: {
    width: null,
    height: null,
    format: 'PNG',
    description: 'Full pot with water sprite (transparent background)'
  },
  flame: {
    width: null,
    height: null,
    format: 'PNG',
    description: 'Flame animation sprite (transparent background)'
  }
}

// Base theme configuration
export const WORKSHOP_CONFIG = {
  // All themes must have these required properties
  requiredFields: [
    'id',
    'name',
    'scope',
    'colors',
    'images',
    'metadata'
  ],
  
  // All themes must define these color properties
  requiredColors: [
    'header_background',
    'header_text',
    'badge_background',
    'button_primary',
    'button_hover',
    'panel_background',
    'panel_text',
    'panel_border'
  ],
  
  // All themes must include these image assets
  requiredImages: [
    'background',
    'pot_empty',
    'pot_full',
    'flame'
  ],
  
  // Default theme to load if no theme specified
  defaultTheme: 'pre-alpha-kitchen-1',
  
  // Themes directory relative to src/data/
  themesDirectory: 'workshops'
}

// Color palette categories (helps organize theme colors)
export const COLOR_CATEGORIES = {
  header: [
    'header_background',
    'header_text',
    'badge_background',
    'badge_text'
  ],
  buttons: [
    'button_primary',
    'button_primary_text',
    'button_hover',
    'button_hover_text',
    'button_active',
    'button_active_text',
    'button_disabled',
    'button_disabled_text'
  ],
  panels: [
    'panel_background',
    'panel_text',
    'panel_border',
    'panel_accent'
  ],
  game: [
    'burner_background',
    'sink_background',
    'water_color',
    'flame_glow'
  ],
  feedback: [
    'warning_background',
    'warning_text',
    'success_background',
    'success_text',
    'error_background',
    'error_text'
  ]
}

/**
 * Scope types - determines where theme can be applied
 */
export const THEME_SCOPE = {
  WORKSHOP: 'workshop',      // Applies to entire workshop (1-N levels)
  LEVEL: 'level'             // Applies only to a single level
}

/**
 * Standard metadata fields for all themes
 */
export const WORKSHOP_METADATA_TEMPLATE = {
  id: '',                    // Internal identifier (e.g., 'classic', 'dark', 'workshop_1')
  name: '',                  // Display name (e.g., 'Classic Kitchen')
  description: '',           // What makes this theme unique
  author: '',                // Who created/designed the theme
  version: '1.0.0',          // Theme version
  createdDate: '',           // ISO date string (YYYY-MM-DD)
  updatedDate: '',           // ISO date string
  scope: 'workshop',         // 'workshop' or 'level'
  workshopId: null,          // Workshop ID if workshop-scoped
  levelId: null,             // Level ID if level-scoped
  parentTheme: null,         // ID of theme this extends/overrides
  tags: []                   // Categories: 'professional', 'playful', 'minimal', 'colorful', etc.
}

/**
 * Available themes list
 * This is a manifest of all themes that can be loaded.
 * Populated dynamically from theme JSON files in public/assets/workshops/
 */
export const AVAILABLE_WORKSHOPS = {
  'pre-alpha-kitchen-1': {
    name: 'Pre Alpha Kitchen 1',
    scope: 'workshop',
    description: 'Warm, inviting baseline for pre-alpha (Level 1 only)'
  },
  'pre-alpha-kitchen-2': {
    name: 'Pre Alpha Kitchen 2',
    scope: 'workshop',
    description: 'Cool blue/teal alternate for pre-alpha (Level 1 only)'
  },
  'alpha-kitchen': {
    name: 'Alpha Kitchen',
    scope: 'workshop',
    description: 'Alpha-stage kitchen environment (Level 1 only)'
  },
  'level-2-placeholder': {
    name: 'Level 2 Placeholder',
    scope: 'workshop',
    description: 'Placeholder for Level 2+ (uses Pre Alpha 1 assets)'
  }
  // Additional workshops will be registered here dynamically
}
