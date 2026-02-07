// NOTE: Read the header comments before editing. Reassess splitting into subcomponents when adding new items or behaviors.
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
        const contentType = effectsRes.headers.get('content-type') || ''
        if (contentType.includes('application/json')) {
          workshopData.effects = await effectsRes.json()
        } else {
          const effectsText = await effectsRes.text()
          const trimmed = effectsText.trim()
          if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
            workshopData.effects = JSON.parse(trimmed)
          }
        }
      }
    } catch (effectsError) {
      console.info(`No effects.json for workshop '${workshopId}' (optional): ${effectsError.message}`)
    }

    // Optional: load room.json if present (non-blocking)
    try {
      const roomUrl = new URL(`${base}assets/workshops/${workshopId}/room.json`, window.location.href).toString()
      const roomRes = await fetch(roomUrl)
      if (roomRes.ok) {
        workshopData.room = await roomRes.json()
        
        // Load the default burner configuration
        const defaultBurnerId = workshopData.room.defaults?.burner
        if (defaultBurnerId) {
          try {
            const burnerUrl = new URL(`${base}assets/workshops/${workshopId}/burners/${defaultBurnerId}.json`, window.location.href).toString()
            const burnerRes = await fetch(burnerUrl)
            if (burnerRes.ok) {
              workshopData.burner = await burnerRes.json()
            }
          } catch (burnerError) {
            console.warn(`Failed to load burner '${defaultBurnerId}': ${burnerError.message}`)
          }
        }

        // Load the default AC unit configuration
        const defaultAcId = workshopData.room.defaults?.acUnit
        if (defaultAcId) {
          try {
            const acUrl = new URL(`${base}assets/workshops/${workshopId}/ac-units/${defaultAcId}.json`, window.location.href).toString()
            const acRes = await fetch(acUrl)
            if (acRes.ok) {
              workshopData.acUnit = await acRes.json()
            }
          } catch (acError) {
            console.warn(`Failed to load AC unit '${defaultAcId}': ${acError.message}`)
          }
        }

        // Load the default air handler configuration
        const defaultAirHandlerId = workshopData.room.defaults?.airHandler
        if (defaultAirHandlerId) {
          try {
            const ahUrl = new URL(`${base}assets/workshops/${workshopId}/air-handlers/${defaultAirHandlerId}.json`, window.location.href).toString()
            const ahRes = await fetch(ahUrl)
            if (ahRes.ok) {
              workshopData.airHandler = await ahRes.json()
            }
          } catch (ahError) {
            console.warn(`Failed to load air handler '${defaultAirHandlerId}': ${ahError.message}`)
          }
        }
      }
    } catch (roomError) {
      console.info(`No room.json for workshop '${workshopId}' (optional): ${roomError.message}`)
    }

    validateWorkshopData(workshopData)
    return workshopData
  } catch (error) {
    throw new Error(`Failed to load workshop '${workshopId}': ${error.message}`)
  }
}

/**
 * Load a specific piece of equipment from a workshop
 * @param {string} workshopId - The workshop to load from
 * @param {'ac-units' | 'air-handlers' | 'burners'} equipmentType - Type of equipment
 * @param {string} equipmentId - The equipment ID (filename without .json)
 * @returns {Promise<object|null>} The equipment config or null if not found
 */
export async function loadEquipment(workshopId, equipmentType, equipmentId) {
  if (!workshopId || !equipmentType || !equipmentId) return null
  
  try {
    let base = import.meta.env?.BASE_URL || '/'
    if (base.startsWith('/')) base = base.slice(1)
    
    const equipmentUrl = new URL(
      `${base}assets/workshops/${workshopId}/${equipmentType}/${equipmentId}.json`,
      window.location.href
    ).toString()
    
    const res = await fetch(equipmentUrl)
    if (res.ok) {
      const config = await res.json()
      return config
    }
    console.warn(`Equipment not found: ${equipmentType}/${equipmentId} in ${workshopId}`)
    return null
  } catch (error) {
    console.warn(`Failed to load ${equipmentType}/${equipmentId}: ${error.message}`)
    return null
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

  // Extract burner wattage steps from new burner JSON or fallback to legacy workshop.json
  const getBurnerConfig = () => {
    // New system: burner loaded from burners/{id}.json
    if (workshopData.burner) {
      return {
        wattageSteps: workshopData.burner.wattageSteps || [0, 500, 1000, 2000],
        controlType: workshopData.burner.controlType || 'knob',
        maxWatts: workshopData.burner.thermalCharacteristics?.maxWatts || 2000,
        efficiencyPercent: workshopData.burner.thermalCharacteristics?.efficiencyPercent || 85
      }
    }
    // Legacy fallback: burnerControls in workshop.json
    if (workshopData.burnerControls?.wattageSteps) {
      return {
        wattageSteps: workshopData.burnerControls.wattageSteps,
        controlType: workshopData.burnerControls.wattageSteps.length > 5 ? 'buttons' : 'knob',
        maxWatts: Math.max(...workshopData.burnerControls.wattageSteps),
        efficiencyPercent: 85
      }
    }
    // Default
    return {
      wattageSteps: [0, 500, 1000, 2000],
      controlType: 'knob',
      maxWatts: 2000,
      efficiencyPercent: 85
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
    effects: normalizeEffects(workshopData.effects),
    burnerConfig: getBurnerConfig(),
    room: workshopData.room || null,
    acUnit: workshopData.acUnit || null,
    airHandler: workshopData.airHandler || null
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
    img.onload = () => resolve()
    img.onerror = () => {
      console.warn(`✗ Failed to preload ${key}: ${url}`)
      resolve()
    }
    img.src = url
  }))

  await Promise.all(imagePromises)
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
