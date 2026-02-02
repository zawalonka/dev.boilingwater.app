/**
 * Wiki Data Builders
 * 
 * Functions for scanning filesystem and building entity data structures
 */

import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { globSync } from 'glob'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '..', '..')

/**
 * Build all element entities from periodic table JSON files
 */
export const buildElements = async () => {
  const elementFiles = globSync('src/data/substances/periodic-table/*.json', { cwd: repoRoot, absolute: true })
  const elements = []

  for (const file of elementFiles) {
    try {
      const content = await fs.readFile(file, 'utf-8')
      const data = JSON.parse(content)
      const slug = path.basename(file, '.json')
      elements.push({ slug, file, data })
    } catch (err) {
      console.warn(`⚠️  Failed to load element ${file}:`, err.message)
    }
  }

  return elements
}

/**
 * Build compound entities (pure or solutions)
 */
export const buildCompounds = async (type) => {
  const pattern = type === 'solution'
    ? 'src/data/substances/compounds/solutions/*/info.json'
    : 'src/data/substances/compounds/pure/*/info.json'

  const files = globSync(pattern, { cwd: repoRoot, absolute: true })
  const compounds = []

  for (const file of files) {
    try {
      const content = await fs.readFile(file, 'utf-8')
      const data = JSON.parse(content)
      const id = path.basename(path.dirname(file))
      compounds.push({ id, file, data })
    } catch (err) {
      console.warn(`⚠️  Failed to load ${type} ${file}:`, err.message)
    }
  }

  return compounds
}

/**
 * Build phase state entities
 */
export const buildPhases = async () => {
  const phaseFiles = globSync('src/data/substances/compounds/**/state.json', { cwd: repoRoot, absolute: true })
  const phases = []
  const phasesByCompound = new Map()

  for (const file of phaseFiles) {
    try {
      const content = await fs.readFile(file, 'utf-8')
      const data = JSON.parse(content)
      const compoundId = data.compoundId
      const phase = data.phase || 'unknown'
      const slug = `${compoundId}-${phase}`

      phases.push({
        slug,
        compoundId,
        phase,
        file,
        data
      })

      if (!phasesByCompound.has(compoundId)) {
        phasesByCompound.set(compoundId, [])
      }
      phasesByCompound.get(compoundId).push({
        slug,
        phase,
        data
      })
    } catch (err) {
      console.warn(`⚠️  Failed to load phase ${file}:`, err.message)
    }
  }

  return { phases, phasesByCompound }
}

/**
 * Build level and experiment data from constants
 */
export const buildLevelsAndExperiments = async () => {
  try {
    const workshopsPath = path.join(repoRoot, 'src/constants/workshops.js')
    const content = await fs.readFile(workshopsPath, 'utf-8')
    
    // Dynamic import
    const module = await import(`file://${workshopsPath}`)
    const { LEVELS, EXPERIMENTS } = module
    
    return { levels: LEVELS || [], experiments: EXPERIMENTS || {} }
  } catch (err) {
    console.warn('⚠️  Failed to load levels/experiments:', err.message)
    return { levels: [], experiments: {} }
  }
}

/**
 * Build formula entities from physics utilities
 */
export const buildFormulas = async () => {
  const formulaFiles = globSync('src/utils/physics/formulas/*.js', { cwd: repoRoot, absolute: true })
  const formulas = []

  for (const file of formulaFiles) {
    try {
      const filename = path.basename(file)
      const slug = path.basename(file, '.js')
      formulas.push({
        slug,
        filename,
        file
      })
    } catch (err) {
      console.warn(`⚠️  Failed to process formula ${file}:`, err.message)
    }
  }

  return formulas
}

/**
 * Build process entities from physics utilities
 */
export const buildProcesses = async () => {
  const processFiles = globSync('src/utils/physics/processes/*.js', { cwd: repoRoot, absolute: true })
  const processes = []

  for (const file of processFiles) {
    try {
      const filename = path.basename(file)
      const slug = path.basename(file, '.js')
      processes.push({
        slug,
        filename,
        file
      })
    } catch (err) {
      console.warn(`⚠️  Failed to process process ${file}:`, err.message)
    }
  }

  return processes
}

/**
 * Build all code module entities
 */
export const buildModules = async () => {
  const patterns = [
    'src/**/*.{js,jsx,ts,tsx}',
    'docs/**/*.{js,jsx,ts,tsx}',
    'scripts/**/*.{js,jsx,ts,tsx}',
    'wiki/**/*.{js,jsx,ts,tsx}'
  ]

  const allFiles = new Set()
  for (const pattern of patterns) {
    const files = globSync(pattern, { cwd: repoRoot, absolute: true })
    for (const file of files) {
      allFiles.add(file)
    }
  }

  const modules = []
  for (const file of Array.from(allFiles).sort()) {
    const filename = path.basename(file)
    const relPath = path.relative(repoRoot, file).replace(/\\/g, '/')
    const slug = relPath.replace(/\.[^.]+$/, '').replace(/\//g, '-')

    modules.push({
      slug,
      filename,
      file,
      relPath
    })
  }

  return modules
}

/**
 * Build public files (HTML, config, etc.)
 */
export const buildPublicFiles = async () => {
  const publicPatterns = [
    'public/**/*.{html,json,xml,txt,css,js}',
    '*.{html,json,xml,txt,css,js,md}',
    '.github/**/*.{md,yml,yaml,json}'
  ]

  const allFiles = new Set()
  for (const pattern of publicPatterns) {
    const files = globSync(pattern, { cwd: repoRoot, absolute: true })
    for (const file of files) {
      allFiles.add(file)
    }
  }

  const publicFiles = []
  for (const file of Array.from(allFiles).sort()) {
    try {
      const filename = path.basename(file)
      const relPath = path.relative(repoRoot, file).replace(/\\/g, '/')
      const slug = relPath.replace(/\.[^.]+$/, '').replace(/\//g, '-')

      publicFiles.push({
        slug,
        filename,
        file,
        relPath
      })
    } catch (err) {
      // Skip files that fail
    }
  }

  return publicFiles
}

/**
 * Build asset entities (images, videos, fonts, etc.)
 */
export const buildAssets = async (modules, publicFiles) => {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg']
  const videoExtensions = ['.mp4', '.webm', '.mov']
  const fontExtensions = ['.ttf', '.otf', '.woff', '.woff2']

  const assets = []

  // Scan public/assets
  const assetDir = path.join(repoRoot, 'public/assets')
  if (fs.existsSync(assetDir)) {
    const scanDir = async (dir, depth = 0) => {
      if (depth > 10) return // Prevent infinite recursion

      try {
        const entries = await fs.readdir(dir, { withFileTypes: true })
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name)
          const publicPath = `/public${path.relative(path.join(repoRoot, 'public'), fullPath).replace(/\\/g, '/')}`

          if (entry.isDirectory()) {
            await scanDir(fullPath, depth + 1)
          } else {
            const ext = path.extname(entry.name).toLowerCase()
            let assetType = 'other'

            if (imageExtensions.includes(ext)) assetType = 'image'
            else if (videoExtensions.includes(ext)) assetType = 'video'
            else if (fontExtensions.includes(ext)) assetType = 'font'

            assets.push({
              filename: entry.name,
              type: assetType,
              publicPath,
              file: fullPath
            })
          }
        }
      } catch (err) {
        // Silently skip directories that can't be read
      }
    }

    await scanDir(assetDir)
  }

  return assets
}
