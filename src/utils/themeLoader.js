/**
 * Theme Loader Utility
 * 
 * Dynamically loads and manages theme configurations at runtime.
 * Similar to fluidLoader, but for theme system.
 * 
 * Usage:
 *   const themeData = await loadTheme('classic')
 *   const appliedTheme = applyTheme(themeData)
 *   const available = getAvailableThemes()
 */

import { AVAILABLE_THEMES, THEME_CONFIG, THEME_METADATA_TEMPLATE } from '../constants/themes'

/**
 * Dynamically loads a theme JSON file from public/assets/themes/
 * 
 * @param {string} themeId - The theme identifier (e.g., 'alpha', 'alpha-alt')
 * @returns {Promise<Object>} The loaded theme configuration object
 * @throws {Error} If theme file not found or invalid
 * 
 * @example
 *   const theme = await loadTheme('alpha')
 *   // Returns: { id: 'alpha', name: 'Alpha Theme', colors: {...}, images: {...} }
 */
export async function loadTheme(themeId) {
  try {
    // Fetch theme JSON from public assets (works in dev, prod, and file://)
    let base = import.meta.env?.BASE_URL || '/'
    if (base.startsWith('/')) {
      base = base.slice(1)
    }
    const themeUrl = new URL(`${base}assets/themes/${themeId}/theme.json`, window.location.href).toString()
    const res = await fetch(themeUrl)
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} loading ${themeUrl}`)
    }
    const themeData = await res.json()

    // Optional: load theme effects from effects.json if present (non-blocking)
    try {
      const effectsUrl = new URL(`${base}assets/themes/${themeId}/effects.json`, window.location.href).toString()
      const effectsRes = await fetch(effectsUrl)
      if (effectsRes.ok) {
        themeData.effects = await effectsRes.json()
        console.log(`✓ Loaded theme effects for '${themeId}' from effects.json`)
      }
    } catch (effectsError) {
      console.info(`No effects.json for theme '${themeId}' (optional): ${effectsError.message}`)
    }

    // Validate the theme has all required fields
    validateThemeData(themeData)

    console.log(`✓ Loaded theme: "${themeData.name}" (${themeId})`)
    return themeData
  } catch (error) {
    throw new Error(`Failed to load theme '${themeId}': ${error.message}`)
  }
}

/**
 * Validates theme data structure
 * Ensures all required fields and sub-fields are present
 * 
 * @param {Object} themeData - The theme object to validate
 * @throws {Error} If validation fails
 */
export function validateThemeData(themeData) {
  // Check all required top-level fields
  for (const field of THEME_CONFIG.requiredFields) {
    if (!(field in themeData)) {
      throw new Error(`Missing required field: '${field}'`)
    }
  }

  // Validate that theme has a name (either top-level or in metadata)
  if (!themeData.name && (!themeData.metadata || !themeData.metadata.name)) {
    throw new Error(`Theme must have a 'name' field`)
  }

  // Validate that all required colors are defined
  if (themeData.colors && typeof themeData.colors === 'object') {
    for (const color of THEME_CONFIG.requiredColors) {
      if (!(color in themeData.colors)) {
        console.warn(`Theme warning: Missing color '${color}'. This may cause styling issues.`)
      }
    }
  } else {
    throw new Error(`'colors' field must be an object`)
  }

  // Validate that all required images are defined
  if (themeData.images && typeof themeData.images === 'object') {
    for (const image of THEME_CONFIG.requiredImages) {
      if (!(image in themeData.images)) {
        console.warn(`Theme warning: Missing image '${image}'. This may cause rendering issues.`)
      }
    }
    // Normalize relative image paths to absolute /assets/themes/... if provided as relative
    Object.entries(themeData.images).forEach(([key, value]) => {
      if (typeof value === 'string' && value.startsWith('./')) {
        // Resolve relative to theme folder
        themeData.images[key] = value.replace('./', `/assets/themes/${themeData.id}/`)
      }
    })
  } else {
    throw new Error(`'images' field must be an object`)
  }

  // Effects are optional; if provided, ensure they are objects
  if (themeData.effects && typeof themeData.effects !== 'object') {
    throw new Error(`'effects' field, when provided, must be an object`)
  }

  // Validate metadata if present (optional but if present must be object)
  if (themeData.metadata && typeof themeData.metadata !== 'object') {
    throw new Error(`'metadata' field must be an object`)
  }
}

/**
 * Processes theme data for application-level use
 * Converts color strings, resolves image paths, applies parent theme inheritance
 * 
 * @param {Object} themeData - Raw theme configuration from JSON
 * @param {Object} parentTheme - (optional) Parent theme to inherit from
 * @returns {Object} Processed theme ready for use
 * 
 * @example
 *   const rawTheme = await loadTheme('workshop_1')
 *   const processedTheme = processTheme(rawTheme)
 *   // Now CSS variables can be set from processedTheme.colors
 */
export function processTheme(themeData, parentTheme = null) {
  // Start with parent theme if specified
  let processed = parentTheme ? JSON.parse(JSON.stringify(parentTheme)) : {}

  // Merge and override with current theme data
  return {
    id: themeData.id,
    name: themeData.name,
    metadata: {
      ...THEME_METADATA_TEMPLATE,
      ...themeData.metadata
    },
    colors: {
      ...processed.colors,
      ...themeData.colors
    },
    images: {
      ...processed.images,
      ...themeData.images
    },
    typography: {
      ...processed.typography,
      ...themeData.typography
    },
    layout: {
      ...processed.layout,
      ...themeData.layout
    },
    effects: themeData.effects || {}  // Do NOT inherit effects; only use if theme defines them
  }
}

/**
 * Applies theme to the document by setting CSS custom properties (variables)
 * This makes colors and other properties immediately available to all CSS files
 * 
 * @param {Object} processedTheme - Theme object from processTheme()
 * 
 * @example
 *   const theme = await loadTheme('classic')
 *   const processed = processTheme(theme)
 *   applyTheme(processed)
 *   // Now all CSS can use --theme-header-background, --theme-button-primary, etc.
 */
export function applyTheme(processedTheme) {
  const root = document.documentElement

  // Apply color variables
  if (processedTheme.colors) {
    for (const [colorKey, colorValue] of Object.entries(processedTheme.colors)) {
      // Convert camelCase to kebab-case and add --theme- prefix
      // Example: header_background → --theme-header-background
      const cssVarName = `--theme-${colorKey.replace(/_/g, '-')}`
      root.style.setProperty(cssVarName, colorValue)
    }
  }

  // Apply typography variables if defined
  if (processedTheme.typography) {
    for (const [typographyKey, value] of Object.entries(processedTheme.typography)) {
      const cssVarName = `--font-${typographyKey.replace(/_/g, '-')}`
      if (typeof value === 'string') {
        root.style.setProperty(cssVarName, value)
      } else if (value && typeof value === 'object') {
        // For complex typography objects, apply individual properties
        for (const [propKey, propValue] of Object.entries(value)) {
          const varName = `--font-${typographyKey}-${propKey}`.replace(/_/g, '-')
          root.style.setProperty(varName, propValue)
        }
      }
    }
  }

  console.log(`✓ Applied theme: "${processedTheme.name}"`)
}

/**
 * Preloads theme images to prevent lag when they first appear
 * Creates image elements and loads them in the background
 * 
 * @param {Object} themeData - Theme object with images field
 * @returns {Promise<void>} Resolves when all images are preloaded
 * 
 * @example
 *   const theme = await loadTheme('alpha')
 *   await preloadThemeImages(theme)
 */
export async function preloadThemeImages(themeData) {
  const effectAssets = []
  if (themeData.effects?.steam?.asset && typeof themeData.effects.steam.asset === 'string') {
    effectAssets.push(['steam', themeData.effects.steam.asset])
  }

  const assets = [
    ...(themeData.images ? Object.entries(themeData.images) : []),
    ...effectAssets
  ]

  if (assets.length === 0) return

  const imagePromises = assets.map(([key, url]) => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        console.log(`✓ Preloaded ${key}: ${url}`)
        resolve()
      }
      img.onerror = () => {
        console.warn(`✗ Failed to preload ${key}: ${url}`)
        resolve() // Don't reject, just log the failure
      }
      img.src = url
    })
  })

  await Promise.all(imagePromises)
  console.log(`✓ All images preloaded for theme "${themeData.name}"`)
}

/**
 * Gets list of available theme IDs
 * Scans the themes directory or reads from a manifest
 * 
 * @returns {Promise<Array<string>>} Array of theme IDs
 * 
 * @example
 *   const themes = await getAvailableThemes()
 *   // Returns: ['classic', 'dark', 'workshop_1', 'workshop_1_level_2', ...]
 */
export async function getAvailableThemes() {
  try {
    return Object.entries(AVAILABLE_THEMES).map(([id, meta]) => ({ id, name: meta.name }))
  } catch (error) {
    console.error('Failed to get available themes:', error)
    return [{ id: THEME_CONFIG.defaultTheme, name: 'Alpha Theme' }]  // Fallback
  }
}

/**
 * Gets all themes that apply to a specific workshop
 * Filters available themes by workshop scope and workshopId
 * 
 * @param {string} workshopId - The workshop ID to filter by
 * @returns {Promise<Array<Object>>} Array of workshop-level themes
 * 
 * @example
 *   const workshopThemes = await getWorkshopThemes('workshop_1')
 */
export async function getWorkshopThemes(workshopId) {
  const available = await getAvailableThemes()
  const themesData = []

  for (const themeId of available) {
    try {
      const theme = await loadTheme(themeId)
      if (theme.metadata.workshopId === workshopId) {
        themesData.push(theme)
      }
    } catch (error) {
      console.warn(`Could not load theme ${themeId}:`, error.message)
    }
  }

  return themesData
}

/**
 * Gets theme for a specific level
 * Looks for level-scoped theme first, then falls back to workshop theme
 * 
 * @param {string} workshopId - Workshop ID
 * @param {string} levelId - Level ID within workshop
 * @returns {Promise<Object>} The appropriate theme for this level
 * 
 * @example
 *   const theme = await getLevelTheme('workshop_1', 'level_2')
 */
export async function getLevelTheme(workshopId, levelId) {
  const available = await getAvailableThemes()

  // First, look for a level-specific theme
  for (const themeId of available) {
    try {
      const theme = await loadTheme(themeId)
      if (
        theme.metadata.scope === 'level' &&
        theme.metadata.workshopId === workshopId &&
        theme.metadata.levelId === levelId
      ) {
        return theme
      }
    } catch (error) {
      // Continue searching
    }
  }

  // If no level-specific theme found, use workshop theme
  for (const themeId of available) {
    try {
      const theme = await loadTheme(themeId)
      if (
        theme.metadata.scope === 'workshop' &&
        theme.metadata.workshopId === workshopId
      ) {
        return theme
      }
    } catch (error) {
      // Continue searching
    }
  }

  // Fallback to default theme
  console.warn(
    `No theme found for workshop '${workshopId}', level '${levelId}'. Using default.`
  )
  return await loadTheme(THEME_CONFIG.defaultTheme)
}

/**
 * Full theme loading pipeline
 * Load → Validate → Process → Apply
 * 
 * @param {string} themeId - Theme ID to load
 * @param {Object} options - Optional configuration
 * @param {string} options.parentThemeId - Parent theme to inherit from
 * @param {boolean} options.apply - Whether to immediately apply theme (default: true)
 * @returns {Promise<Object>} The processed and applied theme
 * 
 * @example
 *   const theme = await initializeTheme('workshop_1', {
 *     parentThemeId: 'classic',
 *     apply: true
 *   })
 */
export async function initializeTheme(themeId, options = {}) {
  const { parentThemeId = null, apply = true } = options

  try {
    // Load the theme JSON
    const rawTheme = await loadTheme(themeId)

    // Load parent theme if specified via option OR declared in theme JSON
    let parentTheme = null
    const parentId = parentThemeId || rawTheme.parentTheme
    if (parentId) {
      const parentData = await loadTheme(parentId)
      parentTheme = processTheme(parentData)
    }

    // Process the theme (merge with parent, prepare for application)
    const processedTheme = processTheme(rawTheme, parentTheme)

    // Apply to DOM if requested
    if (apply) {
      applyTheme(processedTheme)
    }

    return processedTheme
  } catch (error) {
    console.error(`Failed to initialize theme '${themeId}':`, error.message)
    // Fallback: return minimal theme
    return {
      id: 'fallback',
      name: 'Fallback',
      colors: {},
      images: {},
      typography: {}
    }
  }
}

export const DEFAULT_THEME = THEME_CONFIG.defaultTheme
