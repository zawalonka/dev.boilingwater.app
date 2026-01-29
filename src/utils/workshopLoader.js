import { AVAILABLE_WORKSHOPS, WORKSHOP_CONFIG, WORKSHOP_METADATA_TEMPLATE } from '../constants/workshops'

/**
 * Workshop Loader Utility
 *
 * Dynamically loads and manages workshop configurations (visual skins).
 *
 * Usage:
 *   const workshop = await loadWorkshop('pre-alpha-kitchen-1')
 *   const processed = processWorkshop(workshop)
 *   applyWorkshopStyles(processed)
 */
export async function loadWorkshop(workshopId) {
  try {
    let base = import.meta.env?.BASE_URL || '/'
    if (base.startsWith('/')) base = base.slice(1)

    const workshopUrl = new URL(`${base}assets/workshops/${workshopId}/workshop.json`, window.location.href).toString()
    const res = await fetch(workshopUrl)
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} loading ${workshopUrl}`)
    }

    const workshopData = await res.json()

    // Optional: load effects.json if present (non-blocking)
    try {
      const effectsUrl = new URL(`${base}assets/workshops/${workshopId}/effects.json`, window.location.href).toString()
      const effectsRes = await fetch(effectsUrl)
      if (effectsRes.ok) {
        workshopData.effects = await effectsRes.json()
        console.log(`✓ Loaded workshop effects for '${workshopId}' from effects.json`)
      }
    } catch (effectsError) {
      console.info(`No effects.json for workshop '${workshopId}' (optional): ${effectsError.message}`)
    }

    validateWorkshopData(workshopData)
    console.log(`✓ Loaded workshop: "${workshopData.name}" (${workshopId})`)
    return workshopData
  } catch (error) {
    throw new Error(`Failed to load workshop '${workshopId}': ${error.message}`)
  }
}

export function validateWorkshopData(workshopData) {
  for (const field of WORKSHOP_CONFIG.requiredFields) {
    if (!(field in workshopData)) {
      throw new Error(`Missing required field: '${field}'`)
    }
  }

  if (!workshopData.name && (!workshopData.metadata || !workshopData.metadata.name)) {
    throw new Error(`Workshop must have a 'name' field`)
  }

  if (workshopData.colors && typeof workshopData.colors === 'object') {
    for (const color of WORKSHOP_CONFIG.requiredColors) {
      if (!(color in workshopData.colors)) {
        console.warn(`Workshop warning: Missing color '${color}'. This may cause styling issues.`)
      }
    }
  } else {
    throw new Error(`'colors' field must be an object`)
  }

  if (workshopData.images && typeof workshopData.images === 'object') {
    for (const image of WORKSHOP_CONFIG.requiredImages) {
      if (!(image in workshopData.images)) {
        throw new Error(`Missing required image '${image}' in workshop '${workshopData.id}'`)
      }
    }
    Object.entries(workshopData.images).forEach(([key, value]) => {
      if (typeof value === 'string' && value.startsWith('./')) {
        workshopData.images[key] = value.replace('./', `/assets/workshops/${workshopData.id}/`)
      }
    })
  } else {
    throw new Error(`'images' field must be an object`)
  }

  if (workshopData.effects && typeof workshopData.effects !== 'object') {
    throw new Error(`'effects' field, when provided, must be an object`)
  }

  if (workshopData.metadata && typeof workshopData.metadata !== 'object') {
    throw new Error(`'metadata' field must be an object`)
  }
}

export function processWorkshop(workshopData, parentWorkshop = null) {
  const normalizeEffects = (effects) => {
    const defaults = {
      steam: { enabled: false },
      flameGlow: { enabled: false },
      waterStream: { enabled: false }
    }
    return {
      steam: { ...defaults.steam, ...(effects?.steam || {}) },
      flameGlow: { ...defaults.flameGlow, ...(effects?.flameGlow || {}) },
      waterStream: { ...defaults.waterStream, ...(effects?.waterStream || {}) }
    }
  }

  const inherited = parentWorkshop ? JSON.parse(JSON.stringify(parentWorkshop)) : {}

  return {
    id: workshopData.id,
    name: workshopData.name,
    metadata: {
      ...WORKSHOP_METADATA_TEMPLATE,
      ...workshopData.metadata
    },
    colors: {
      ...inherited.colors,
      ...workshopData.colors
    },
    images: {
      ...inherited.images,
      ...workshopData.images
    },
    typography: {
      ...inherited.typography,
      ...workshopData.typography
    },
    layout: {
      ...inherited.layout,
      ...workshopData.layout
    },
    effects: normalizeEffects(workshopData.effects)
  }
}

export function applyWorkshopStyles(processedWorkshop) {
  const root = document.documentElement

  if (processedWorkshop.colors) {
    for (const [colorKey, colorValue] of Object.entries(processedWorkshop.colors)) {
      const cssVarName = `--workshop-${colorKey.replace(/_/g, '-')}`
      root.style.setProperty(cssVarName, colorValue)
    }
  }

  if (processedWorkshop.typography) {
    for (const [typographyKey, value] of Object.entries(processedWorkshop.typography)) {
      const cssVarName = `--font-${typographyKey.replace(/_/g, '-')}`
      if (typeof value === 'string') {
        root.style.setProperty(cssVarName, value)
      } else if (value && typeof value === 'object') {
        for (const [propKey, propValue] of Object.entries(value)) {
          const varName = `--font-${typographyKey}-${propKey}`.replace(/_/g, '-')
          root.style.setProperty(varName, propValue)
        }
      }
    }
  }

  console.log(`✓ Applied workshop: "${processedWorkshop.name}"`)
}

export async function preloadWorkshopImages(workshopData) {
  const effectAssets = []
  if (workshopData.effects?.steam?.asset && typeof workshopData.effects.steam.asset === 'string') {
    effectAssets.push(['steam', workshopData.effects.steam.asset])
  }

  const assets = [
    ...(workshopData.images ? Object.entries(workshopData.images) : []),
    ...effectAssets
  ]

  if (assets.length === 0) return

  const imagePromises = assets.map(([key, url]) => new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      console.log(`✓ Preloaded ${key}: ${url}`)
      resolve()
    }
    img.onerror = () => {
      console.warn(`✗ Failed to preload ${key}: ${url}`)
      resolve()
    }
    img.src = url
  }))

  await Promise.all(imagePromises)
  console.log(`✓ All images preloaded for workshop "${workshopData.name}"`)
}

export async function getAvailableWorkshops() {
  try {
    return Object.entries(AVAILABLE_WORKSHOPS).map(([id, meta]) => ({ id, name: meta.name }))
  } catch (error) {
    console.error('Failed to get available workshops:', error)
    return [{ id: WORKSHOP_CONFIG.defaultWorkshop, name: 'Default Workshop' }]
  }
}

export async function getWorkshopsByLevel(levelId) {
  const available = await getAvailableWorkshops()
  const workshops = []

  for (const workshop of available) {
    try {
      const workshopData = await loadWorkshop(workshop.id)
      const minLevel = workshopData.minLevel || 1
      const maxLevel = workshopData.maxLevel || 999
      if (levelId >= minLevel && levelId <= maxLevel) {
        workshops.push({ id: workshop.id, name: workshop.name, minLevel, maxLevel })
      }
    } catch (error) {
      console.warn(`Could not load workshop ${workshop.id}:`, error.message)
    }
  }

  return workshops
}

export async function getWorkshopForLevel(workshopId, levelId) {
  const available = await getAvailableWorkshops()

  for (const { id } of available) {
    try {
      const workshop = await loadWorkshop(id)
      if (
        workshop.metadata.scope === 'level' &&
        workshop.metadata.workshopId === workshopId &&
        workshop.metadata.levelId === levelId
      ) {
        return workshop
      }
    } catch (_) {
      /* continue */
    }
  }

  for (const { id } of available) {
    try {
      const workshop = await loadWorkshop(id)
      if (workshop.metadata.scope === 'workshop' && workshop.metadata.workshopId === workshopId) {
        return workshop
      }
    } catch (_) {
      /* continue */
    }
  }

  console.warn(`No workshop skin found for workshop '${workshopId}', level '${levelId}'. Using default.`)
  return await loadWorkshop(WORKSHOP_CONFIG.defaultWorkshop)
}

export async function initializeWorkshop(workshopId, options = {}) {
  const { parentWorkshopId = null, apply = true } = options

  try {
    const rawWorkshop = await loadWorkshop(workshopId)

    let parentWorkshop = null
    const parentId = parentWorkshopId || rawWorkshop.parentWorkshop
    if (parentId) {
      const parentData = await loadWorkshop(parentId)
      parentWorkshop = processWorkshop(parentData)
    }

    const processedWorkshop = processWorkshop(rawWorkshop, parentWorkshop)

    if (apply) {
      applyWorkshopStyles(processedWorkshop)
    }

    return processedWorkshop
  } catch (error) {
    console.error(`Failed to initialize workshop '${workshopId}':`, error.message)
    return {
      id: 'fallback',
      name: 'Fallback',
      colors: {},
      images: {},
      typography: {}
    }
  }
}

export const DEFAULT_WORKSHOP = WORKSHOP_CONFIG.defaultWorkshop
