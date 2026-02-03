/**
 * Orphan Detection Utilities
 * 
 * Standardized pattern for detecting unused entities across the codebase.
 * Checks if something is used ANYWHERE:
 * - By other entities (direct relationships)
 * - By build system (package.json scripts)
 * - By game code (src/ imports)
 * - By documentation or configuration
 */

import fs from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

/**
 * Detect script usage across multiple sources
 * @param {string} repoRoot - Repository root path
 * @param {Map} scriptDependents - Map of script -> [dependent scripts]
 * @param {Map} scriptDependencies - Map of script -> [dependencies]
 * @param {string[]} scriptNames - All script names to analyze
 * @returns {Object} { scriptAnalysis, trulyOrphanScripts, buildSystemScripts, gameCodeUsage }
 */
export async function detectScriptUsage(repoRoot, scriptDependents, scriptDependencies, scriptNames) {
  const buildSystemScripts = new Set()
  const gameCodeScriptUsage = new Map()

  // Check build system integration (package.json)
  try {
    const pkgPath = path.join(repoRoot, 'package.json')
    const pkgContent = await fs.readFile(pkgPath, 'utf-8')
    const pkg = JSON.parse(pkgContent)
    const scriptsSection = pkg.scripts || {}
    const allScriptCalls = Object.values(scriptsSection).join(' ')
    
    for (const scriptName of scriptNames) {
      if (allScriptCalls.includes(scriptName + '.js') || allScriptCalls.includes('scripts/' + scriptName)) {
        buildSystemScripts.add(scriptName)
      }
    }
  } catch (err) {
    // Silently continue if package.json unavailable
  }

  // Check game code imports (src/ folder)
  try {
    const srcDir = path.join(repoRoot, 'src')
    if (existsSync(srcDir)) {
      const scanDir = async (dir) => {
        const files = await fs.readdir(dir, { withFileTypes: true })
        for (const file of files) {
          if (file.isDirectory()) {
            await scanDir(path.join(dir, file.name))
          } else if (file.name.endsWith('.js') || file.name.endsWith('.jsx')) {
            const filePath = path.join(dir, file.name)
            const content = await fs.readFile(filePath, 'utf-8')
            for (const scriptName of scriptNames) {
              if (content.includes(`scripts/${scriptName}`) || content.includes(scriptName + '.js')) {
                if (!gameCodeScriptUsage.has(scriptName)) gameCodeScriptUsage.set(scriptName, [])
                gameCodeScriptUsage.get(scriptName).push(path.relative(repoRoot, filePath))
              }
            }
          }
        }
      }
      await scanDir(srcDir)
    }
  } catch (err) {
    // Silently continue if src scan fails
  }

  // Identify truly orphan scripts
  const trulyOrphanScripts = scriptNames.filter((name) => {
    const hasScriptDependents = (scriptDependents.get(name) || []).length > 0
    const hasBuilSystemUsage = buildSystemScripts.has(name)
    const hasGameCodeUsage = gameCodeScriptUsage.has(name)
    
    return !hasScriptDependents && !hasBuilSystemUsage && !hasGameCodeUsage
  })

  // Analyze all scripts with usage info
  const scriptAnalysis = scriptNames.map(scriptName => {
    const scriptDeps = scriptDependencies.get(scriptName) || []
    const scriptDependents_list = scriptDependents.get(scriptName) || []
    const hasSelfRef = scriptDeps.includes(scriptName)
    const buildUsage = buildSystemScripts.has(scriptName)
    const gameUsage = gameCodeScriptUsage.get(scriptName) || []
    const usedByScripts = scriptDependents_list.length > 0
    
    const usageTypes = []
    if (usedByScripts) usageTypes.push(`${scriptDependents_list.length} script(s)`)
    if (buildUsage) usageTypes.push('Build system')
    if (gameUsage.length > 0) usageTypes.push('Game code')
    
    const usageStr = usageTypes.length > 0 ? usageTypes.join(', ') : 'UNUSED'
    
    return {
      name: scriptName,
      dependencyChain: scriptDeps.length > 0 ? scriptDeps.join(' → ') : 'None',
      hasSelfReference: hasSelfRef,
      dependencyCount: scriptDeps.length,
      usedByScripts,
      buildUsage,
      gameUsage,
      usageStr,
      isOrphan: trulyOrphanScripts.includes(scriptName)
    }
  })

  return {
    scriptAnalysis,
    trulyOrphanScripts,
    buildSystemScripts,
    gameCodeUsage: gameCodeScriptUsage
  }
}

/**
 * Detect document usage in game code
 * @param {string} repoRoot - Repository root path
 * @param {Object[]} docsModules - Documentation modules with filenames
 * @returns {Object} Map of doc name -> [files that reference it]
 */
export async function detectDocUsage(repoRoot, docsModules) {
  const docUsage = new Map()

  try {
    const srcDir = path.join(repoRoot, 'src')
    if (existsSync(srcDir)) {
      const scanDir = async (dir) => {
        const files = await fs.readdir(dir, { withFileTypes: true })
        for (const file of files) {
          if (file.isDirectory()) {
            await scanDir(path.join(dir, file.name))
          } else if (file.name.endsWith('.js') || file.name.endsWith('.jsx')) {
            const filePath = path.join(dir, file.name)
            const content = await fs.readFile(filePath, 'utf-8')
            for (const doc of docsModules) {
              const docName = doc.filename.replace(/\.md$/, '')
              if (content.includes(docName) || content.includes(doc.filename)) {
                if (!docUsage.has(doc.slug)) docUsage.set(doc.slug, [])
                docUsage.get(doc.slug).push(path.relative(repoRoot, filePath))
              }
            }
          }
        }
      }
      await scanDir(srcDir)
    }
  } catch (err) {
    // Silently continue
  }

  return docUsage
}

/**
 * Detect stylesheet usage in game code
 * @param {string} repoRoot - Repository root path
 * @param {Object[]} styleModules - Style modules with filenames
 * @returns {Object} Map of style name -> [files that import it]
 */
export async function detectStyleUsage(repoRoot, styleModules) {
  const styleUsage = new Map()

  try {
    const srcDir = path.join(repoRoot, 'src')
    if (existsSync(srcDir)) {
      const scanDir = async (dir) => {
        const files = await fs.readdir(dir, { withFileTypes: true })
        for (const file of files) {
          if (file.isDirectory()) {
            await scanDir(path.join(dir, file.name))
          } else if (file.name.endsWith('.js') || file.name.endsWith('.jsx') || file.name.endsWith('.css')) {
            const filePath = path.join(dir, file.name)
            const content = await fs.readFile(filePath, 'utf-8')
            for (const style of styleModules) {
              const styleName = style.filename.replace(/\.css$/, '')
              if (content.includes(styleName) || content.includes(style.filename) || content.includes(style.slug)) {
                if (!styleUsage.has(style.slug)) styleUsage.set(style.slug, [])
                styleUsage.get(style.slug).push(path.relative(repoRoot, filePath))
              }
            }
          }
        }
      }
      await scanDir(srcDir)
    }
  } catch (err) {
    // Silently continue
  }

  return styleUsage
}

/**
 * Detect file usage in game code
 * @param {string} repoRoot - Repository root path
 * @param {Object[]} rootModules - Root level modules
 * @returns {Object} Map of filename -> [files that reference it]
 */
export async function detectFileUsage(repoRoot, rootModules) {
  const fileUsage = new Map()

  try {
    const srcDir = path.join(repoRoot, 'src')
    const wikiDir = path.join(repoRoot, 'wiki')
    
    const scanDir = async (dir) => {
      const files = await fs.readdir(dir, { withFileTypes: true })
      for (const file of files) {
        if (file.isDirectory()) {
          await scanDir(path.join(dir, file.name))
        } else if (file.name.endsWith('.js') || file.name.endsWith('.jsx') || file.name.endsWith('.json')) {
          const filePath = path.join(dir, file.name)
          const content = await fs.readFile(filePath, 'utf-8')
          for (const rootFile of rootModules) {
            const filename = rootFile.filename
            if (content.includes(filename) || content.includes(rootFile.slug)) {
              if (!fileUsage.has(rootFile.slug)) fileUsage.set(rootFile.slug, [])
              fileUsage.get(rootFile.slug).push(path.relative(repoRoot, filePath))
            }
          }
        }
      }
    }
    
    if (existsSync(srcDir)) await scanDir(srcDir)
    if (existsSync(wikiDir)) await scanDir(wikiDir)
  } catch (err) {
    // Silently continue
  }

  return fileUsage
}

/**
 * Build comprehensive usage analysis for any entity type
 * @param {string[]} entityNames - List of entity names to check
 * @param {Map} directRelationships - Map of entity -> [direct dependents]
 * @param {Object} externalUsage - Map of entity -> [external references]
 * @returns {Object[]} Array of analysis objects with usage info
 */
export function buildUsageAnalysis(entityNames, directRelationships = new Map(), externalUsage = {}) {
  return entityNames.map(name => {
    const directDependents = (directRelationships.get(name) || []).length
    const externalRefs = (externalUsage[name] || []).length
    const totalUsage = directDependents + externalRefs
    
    const usageTypes = []
    if (directDependents > 0) usageTypes.push(`${directDependents} relationship(s)`)
    if (externalRefs > 0) usageTypes.push(`${externalRefs} external reference(s)`)
    
    const usageStr = usageTypes.length > 0 ? usageTypes.join(', ') : 'UNUSED'
    
    return {
      name,
      isOrphan: totalUsage === 0,
      usageStr,
      totalUsage,
      directDependents,
      externalRefs
    }
  })
}

/**
 * Detect solution usage in game code
 * @param {string} repoRoot - Repository root path
 * @param {Object[]} solutions - Solution entities
 * @returns {Map} Map of solution ID -> [files referencing it]
 */
export async function detectSolutionUsage(repoRoot, solutions) {
  const solutionUsage = new Map()

  try {
    const srcDir = path.join(repoRoot, 'src')
    if (existsSync(srcDir)) {
      const scanDir = async (dir) => {
        const files = await fs.readdir(dir, { withFileTypes: true })
        for (const file of files) {
          if (file.isDirectory()) {
            await scanDir(path.join(dir, file.name))
          } else if (file.name.endsWith('.js') || file.name.endsWith('.jsx')) {
            const filePath = path.join(dir, file.name)
            const content = await fs.readFile(filePath, 'utf-8')
            for (const solution of solutions) {
              if (content.includes(solution.id) || content.includes(solution.data.name || '')) {
                if (!solutionUsage.has(solution.id)) solutionUsage.set(solution.id, [])
                solutionUsage.get(solution.id).push(path.relative(repoRoot, filePath))
              }
            }
          }
        }
      }
      await scanDir(srcDir)
    }
  } catch (err) {
    // Silently continue
  }

  return solutionUsage
}

/**
 * Detect phase usage in game code and experiments
 * @param {string} repoRoot - Repository root path
 * @param {Object[]} phases - Phase entities
 * @returns {Map} Map of phase slug -> [files referencing it]
 */
export async function detectPhaseUsage(repoRoot, phases) {
  const phaseUsage = new Map()

  try {
    const srcDir = path.join(repoRoot, 'src')
    if (existsSync(srcDir)) {
      const scanDir = async (dir) => {
        const files = await fs.readdir(dir, { withFileTypes: true })
        for (const file of files) {
          if (file.isDirectory()) {
            await scanDir(path.join(dir, file.name))
          } else if (file.name.endsWith('.js') || file.name.endsWith('.jsx')) {
            const filePath = path.join(dir, file.name)
            const content = await fs.readFile(filePath, 'utf-8')
            for (const phase of phases) {
              if (content.includes(phase.slug) || content.includes(phase.phase) || content.includes(phase.compoundId)) {
                if (!phaseUsage.has(phase.slug)) phaseUsage.set(phase.slug, [])
                phaseUsage.get(phase.slug).push(path.relative(repoRoot, filePath))
              }
            }
          }
        }
      }
      await scanDir(srcDir)
    }
  } catch (err) {
    // Silently continue
  }

  return phaseUsage
}

// ============================================================================
// RELATIONSHIP-BASED ORPHAN DETECTION
// These functions check entity relationships (Maps) rather than file scanning
// ============================================================================

/**
 * Find orphan elements (elements not used in any compound)
 * @param {Object[]} elements - Element entities
 * @param {Map} elementChildren - Map of element slug -> [compounds using it]
 * @returns {Object[]} Orphan elements
 */
export function findOrphanElements(elements, elementChildren) {
  return elements.filter((element) => {
    const usedInCompounds = (elementChildren.get(element.slug) || []).length > 0
    return !usedInCompounds
  })
}

/**
 * Find orphan compounds (compounds with phases but not used in solutions)
 * @param {Object[]} compounds - Compound entities
 * @param {Map} compoundChildren - Map of compound id -> [solutions using it]
 * @param {Map} phasesByCompound - Map of compound id -> [phases]
 * @returns {Object[]} Orphan compounds
 */
export function findOrphanCompounds(compounds, compoundChildren, phasesByCompound) {
  return compounds.filter((compound) => {
    const usedInSolutions = (compoundChildren.get(compound.id) || []).length > 0
    const hasPhases = (phasesByCompound.get(compound.id) || []).length > 0
    return !usedInSolutions && hasPhases
  })
}

/**
 * Find orphan levels (levels with no experiments assigned)
 * @param {Object[]} levels - Level entities
 * @param {Object[]} experiments - Experiment entities
 * @returns {Object[]} Orphan levels
 */
export function findOrphanLevels(levels, experiments) {
  return levels.filter((level) =>
    !experiments.some((experiment) => Number(experiment.level) === Number(level.id))
  )
}

/**
 * Find orphan experiments (experiments whose parent level is missing)
 * @param {Object[]} experiments - Experiment entities
 * @param {Object[]} levels - Level entities
 * @returns {Object[]} Orphan experiments
 */
export function findOrphanExperiments(experiments, levels) {
  return experiments.filter((experiment) =>
    !levels.some((level) => Number(level.id) === Number(experiment.level))
  )
}

/**
 * Find orphan formulas (formulas not used by processes or in code)
 * @param {Object[]} formulas - Formula entities
 * @param {Map} formulaToProcesses - Map of formula slug -> [processes using it]
 * @param {Map} formulaUsage - Map of export name -> Set of files using it
 * @returns {Object[]} Orphan formulas
 */
export function findOrphanFormulas(formulas, formulaToProcesses, formulaUsage) {
  return formulas.filter((formula) => {
    const usedByProcesses = (formulaToProcesses.get(formula.slug) || []).length > 0
    const usedInCode = formula.exports.some((name) => (formulaUsage.get(name) || new Set()).size > 0)
    return !usedByProcesses && !usedInCode
  })
}

/**
 * Find orphan processes (processes not used in code and not stubs)
 * @param {Object[]} processes - Process entities
 * @param {Map} processUsage - Map of export name -> Set of files using it
 * @returns {Object[]} Orphan processes
 */
export function findOrphanProcesses(processes, processUsage) {
  return processes.filter((proc) => {
    const usedInCode = proc.exports.some((name) => (processUsage.get(name) || new Set()).size > 0)
    return !usedInCode && !proc.isStub
  })
}

/**
 * Find orphan modules (modules not imported by any other module)
 * @param {Object[]} modules - Module entities
 * @returns {Object[]} Orphan modules
 */
export function findOrphanModules(modules) {
  return modules.filter((mod) => {
    const isImported = modules.some((other) => 
      other.imports.some((imp) => imp.includes(mod.slug) || imp.endsWith(mod.filename.replace(/\.(js|jsx)$/, '')))
    )
    const isEntryPoint = mod.filename === 'main.jsx' || mod.filename === 'App.jsx'
    return !isImported && !isEntryPoint
  })
}

/**
 * Find orphan public files (JSON files not referenced anywhere)
 * Note: Equipment files (ac-units, air-handlers, burners), room.json, and effects.json
 * are loaded dynamically via fetch and should NOT be considered orphans if they're
 * part of a workshop structure.
 * @param {Object[]} publicFiles - Public file entities
 * @param {Object[]} assets - Asset entities with references
 * @returns {Object[]} Orphan public files
 */
export function findOrphanPublicFiles(publicFiles, assets) {
  // Categories that are loaded dynamically by workshopLoader.js (not static imports)
  // Note: category is derived from path, so room.json → 'room', effects.json → 'effects'
  const dynamicallyLoadedCategories = new Set([
    'ac-units',
    'air-handlers', 
    'burners',
    'room',      // room.json files
    'effects',   // effects.json files
    'workshop'   // workshop.json files are the entry point
  ])
  
  return publicFiles.filter((file) => {
    // Skip files that are dynamically loaded by the game
    if (dynamicallyLoadedCategories.has(file.category)) {
      return false
    }
    
    // For other files, check if they're referenced by any asset
    const referencedAssets = assets.filter((asset) => 
      Array.from(asset.references || []).some((ref) => ref.slug === file.slug && ref.filename === file.filename)
    )
    return referencedAssets.length === 0
  })
}

/**
 * Find orphan symbols (symbols with no usage anywhere)
 * @param {Object[]} symbols - Symbol entities
 * @returns {Object[]} Orphan symbols
 */
export function findOrphanSymbols(symbols) {
  return symbols.filter((sym) =>
    sym.reExports.length === 0 &&
    sym.importedBy.length === 0 &&
    sym.callSites.length === 0 &&
    sym.internalUsages.length === 0 &&
    sym.reExportUsages.length === 0
  )
}

/**
 * Filter orphans from detection result Map (for file-scanning detectors)
 * @param {Object[]} entities - Entity array
 * @param {Map} usageMap - Map of entity key -> [usage locations]
 * @param {Function} getKey - Function to get key from entity (default: e => e.id)
 * @returns {Object[]} Orphan entities
 */
export function filterOrphansFromUsageMap(entities, usageMap, getKey = (e) => e.id) {
  return entities.filter(entity => (usageMap.get(getKey(entity)) || []).length === 0)
}

/**
 * Find orphan equipment (AC units, air handlers, burners) not referenced by any room.json
 * @param {Object[]} publicFiles - All public JSON files with category info
 * @returns {Object} { orphanAcUnits, orphanAirHandlers, orphanBurners, roomConfigs }
 */
export function findOrphanEquipment(publicFiles) {
  // Get all room.json files and parse their available equipment lists
  const roomConfigs = publicFiles.filter(f => f.category === 'room.json')
  
  // Collect all referenced equipment IDs across all workshops
  const referencedAcUnits = new Set()
  const referencedAirHandlers = new Set()
  const referencedBurners = new Set()
  
  for (const room of roomConfigs) {
    try {
      const data = JSON.parse(room.content)
      // availableAcUnits, availableAirHandlers, availableBurners are arrays of IDs
      if (Array.isArray(data.availableAcUnits)) {
        data.availableAcUnits.forEach(id => referencedAcUnits.add(`${room.workshopId}/${id}`))
      }
      if (Array.isArray(data.availableAirHandlers)) {
        data.availableAirHandlers.forEach(id => referencedAirHandlers.add(`${room.workshopId}/${id}`))
      }
      if (Array.isArray(data.availableBurners)) {
        data.availableBurners.forEach(id => referencedBurners.add(`${room.workshopId}/${id}`))
      }
    } catch (err) {
      // Skip malformed room.json
    }
  }
  
  // Get all equipment files
  const acUnits = publicFiles.filter(f => f.category === 'ac-units')
  const airHandlers = publicFiles.filter(f => f.category === 'air-handlers')
  const burners = publicFiles.filter(f => f.category === 'burners')
  
  // Find orphans (equipment not in any room.json's available list)
  const orphanAcUnits = acUnits.filter(f => {
    const id = f.filename.replace(/\.json$/, '')
    return !referencedAcUnits.has(`${f.workshopId}/${id}`)
  })
  
  const orphanAirHandlers = airHandlers.filter(f => {
    const id = f.filename.replace(/\.json$/, '')
    return !referencedAirHandlers.has(`${f.workshopId}/${id}`)
  })
  
  const orphanBurners = burners.filter(f => {
    const id = f.filename.replace(/\.json$/, '')
    return !referencedBurners.has(`${f.workshopId}/${id}`)
  })
  
  return {
    orphanAcUnits,
    orphanAirHandlers,
    orphanBurners,
    roomConfigs,
    totals: {
      acUnits: acUnits.length,
      airHandlers: airHandlers.length,
      burners: burners.length
    }
  }
}

// ============================================================================
// ORPHAN REPORT GENERATION
// These functions generate complete orphan report pages
// ============================================================================

/**
 * Generate all file-scanning based orphan reports (docs, styles, root files, solutions, phases, equipment)
 * @param {Object} params - All required data for report generation
 * @param {string} params.repoRoot - Repository root path
 * @param {Object[]} params.docsModules - Documentation modules
 * @param {Object[]} params.styleModules - Style modules
 * @param {Object[]} params.rootModules - Root level modules
 * @param {Object[]} params.solutions - Solution entities
 * @param {Object[]} params.phases - Phase entities
 * @param {Object[]} params.publicFiles - Public JSON files (for equipment detection)
 * @param {Function} params.writePage - Function to write page
 * @param {Function} params.page - Page template function
 * @param {Function} params.linkTo - Link generation function
 * @param {Function} params.renderEntityHeader - Header renderer
 * @param {Function} params.renderList - List renderer
 * @returns {Object} Orphan counts for each entity type
 */
export async function generateOrphanReports({
  repoRoot,
  docsModules,
  styleModules,
  rootModules,
  solutions,
  phases,
  publicFiles,
  writePage,
  page,
  linkTo,
  renderEntityHeader,
  renderList
}) {
  const results = {}

  // Docs orphan detection & report
  const docUsage = await detectDocUsage(repoRoot, docsModules)
  const orphanDocs = filterOrphansFromUsageMap(docsModules, docUsage, doc => doc.slug)
  const orphanDocLinks = orphanDocs.map(doc => linkTo(`entities/modules/${doc.slug}.html`, doc.filename))
  results.docs = orphanDocs.length

  await writePage('entities/reports/orphan-docs.html', page({
    title: 'Orphan Docs',
    content: `
      <section class="section">
        ${renderEntityHeader('Orphan Docs', 'Documentation files not referenced in game code')}
        <p>These documentation files exist but are not imported or referenced anywhere in the codebase.</p>
        ${orphanDocs.length > 0 ? `<p><strong>Total: ${orphanDocs.length}</strong></p>` : ''}
        ${orphanDocLinks.length ? renderList(orphanDocLinks) : '<p><strong>None found!</strong> All docs are referenced.</p>'}
      </section>
    `
  }))

  // Styles orphan detection & report
  const styleUsage = await detectStyleUsage(repoRoot, styleModules)
  const orphanStyles = filterOrphansFromUsageMap(styleModules, styleUsage, style => style.slug)
  const orphanStyleLinks = orphanStyles.map(style => linkTo(`entities/modules/${style.slug}.html`, style.filename))
  results.styles = orphanStyles.length

  await writePage('entities/reports/orphan-styles.html', page({
    title: 'Orphan Styles',
    content: `
      <section class="section">
        ${renderEntityHeader('Orphan Styles', 'CSS stylesheets not imported anywhere')}
        <p>These stylesheets exist but are not imported in any JavaScript/JSX files or the main index.</p>
        ${orphanStyles.length > 0 ? `<p><strong>Total: ${orphanStyles.length}</strong></p>` : ''}
        ${orphanStyleLinks.length ? renderList(orphanStyleLinks) : '<p><strong>None found!</strong> All stylesheets are in use.</p>'}
      </section>
    `
  }))

  // Root files orphan detection & report
  const rootFileUsage = await detectFileUsage(repoRoot, rootModules)
  const orphanRootFiles = filterOrphansFromUsageMap(rootModules, rootFileUsage, file => file.slug)
  const orphanRootFileLinks = orphanRootFiles.map(file => linkTo(`entities/modules/${file.slug}.html`, file.filename))
  results.rootFiles = orphanRootFiles.length

  await writePage('entities/reports/orphan-root-files.html', page({
    title: 'Orphan Root Files',
    content: `
      <section class="section">
        ${renderEntityHeader('Orphan Root Files', 'Top-level files not referenced in codebase')}
        <p>These root-level files exist but are not imported or referenced in game code or wiki.</p>
        ${orphanRootFiles.length > 0 ? `<p><strong>Total: ${orphanRootFiles.length}</strong></p>` : ''}
        ${orphanRootFileLinks.length ? renderList(orphanRootFileLinks) : '<p><strong>None found!</strong> All root files are referenced.</p>'}
      </section>
    `
  }))

  // Solutions orphan detection & report
  const solutionUsage = await detectSolutionUsage(repoRoot, solutions)
  const orphanSolutions = filterOrphansFromUsageMap(solutions, solutionUsage, sol => sol.id)
  const orphanSolutionLinks = orphanSolutions.map(sol => linkTo(`entities/solutions/${sol.id}.html`, sol.data.name || sol.id))
  results.solutions = orphanSolutions.length

  await writePage('entities/reports/orphan-solutions.html', page({
    title: 'Orphan Solutions',
    content: `
      <section class="section">
        ${renderEntityHeader('Orphan Solutions', 'Solutions not used in game code or experiments')}
        <p>These solutions exist but are not referenced in the game code or experiment definitions.</p>
        ${orphanSolutions.length > 0 ? `<p><strong>Total: ${orphanSolutions.length}</strong></p>` : ''}
        ${orphanSolutionLinks.length ? renderList(orphanSolutionLinks) : '<p><strong>None found!</strong> All solutions are used.</p>'}
      </section>
    `
  }))

  // Phases orphan detection & report
  const phaseUsage = await detectPhaseUsage(repoRoot, phases)
  const orphanPhases = filterOrphansFromUsageMap(phases, phaseUsage, phase => phase.slug)
  const orphanPhaseLinks = orphanPhases.map(phase => linkTo(`entities/phases/${phase.slug}.html`, phase.slug))
  results.phases = orphanPhases.length

  await writePage('entities/reports/orphan-phases.html', page({
    title: 'Orphan Phases',
    content: `
      <section class="section">
        ${renderEntityHeader('Orphan Phases', 'Phase states not used in game code')}
        <p>These phase definitions exist but are not referenced in experiments or game logic.</p>
        ${orphanPhases.length > 0 ? `<p><strong>Total: ${orphanPhases.length}</strong></p>` : ''}
        ${orphanPhaseLinks.length ? renderList(orphanPhaseLinks) : '<p><strong>None found!</strong> All phases are used.</p>'}
      </section>
    `
  }))

  // Equipment orphan detection & reports (AC units, air handlers, burners not in any room.json)
  if (publicFiles && publicFiles.length > 0) {
    const { orphanAcUnits, orphanAirHandlers, orphanBurners, totals } = findOrphanEquipment(publicFiles)
    
    results.acUnits = orphanAcUnits.length
    results.airHandlers = orphanAirHandlers.length
    results.burners = orphanBurners.length

    // AC Units orphan report
    const orphanAcLinks = orphanAcUnits.map(f => 
      linkTo(`entities/public/${f.slug}.html`, `${f.workshopId}/${f.filename}`)
    )
    
    await writePage('entities/reports/orphan-ac-units.html', page({
      title: 'Orphan AC Units',
      content: `
        <section class="section">
          ${renderEntityHeader('Orphan AC Units', 'AC units not listed in any room.json')}
          <p>These AC unit JSON files exist but are not listed in any workshop's <code>room.json → availableAcUnits</code>.</p>
          <p><strong>Total AC Units:</strong> ${totals.acUnits} | <strong>Orphans:</strong> ${orphanAcUnits.length}</p>
          ${orphanAcLinks.length ? renderList(orphanAcLinks) : '<p><strong>None found!</strong> All AC units are referenced.</p>'}
        </section>
      `
    }))

    // Air Handlers orphan report
    const orphanAhLinks = orphanAirHandlers.map(f => 
      linkTo(`entities/public/${f.slug}.html`, `${f.workshopId}/${f.filename}`)
    )
    
    await writePage('entities/reports/orphan-air-handlers.html', page({
      title: 'Orphan Air Handlers',
      content: `
        <section class="section">
          ${renderEntityHeader('Orphan Air Handlers', 'Air handlers not listed in any room.json')}
          <p>These air handler JSON files exist but are not listed in any workshop's <code>room.json → availableAirHandlers</code>.</p>
          <p><strong>Total Air Handlers:</strong> ${totals.airHandlers} | <strong>Orphans:</strong> ${orphanAirHandlers.length}</p>
          ${orphanAhLinks.length ? renderList(orphanAhLinks) : '<p><strong>None found!</strong> All air handlers are referenced.</p>'}
        </section>
      `
    }))

    // Burners orphan report
    const orphanBurnerLinks = orphanBurners.map(f => 
      linkTo(`entities/public/${f.slug}.html`, `${f.workshopId}/${f.filename}`)
    )
    
    await writePage('entities/reports/orphan-burners.html', page({
      title: 'Orphan Burners',
      content: `
        <section class="section">
          ${renderEntityHeader('Orphan Burners', 'Burners not listed in any room.json')}
          <p>These burner JSON files exist but are not listed in any workshop's <code>room.json → availableBurners</code>.</p>
          <p><strong>Total Burners:</strong> ${totals.burners} | <strong>Orphans:</strong> ${orphanBurners.length}</p>
          ${orphanBurnerLinks.length ? renderList(orphanBurnerLinks) : '<p><strong>None found!</strong> All burners are referenced.</p>'}
        </section>
      `
    }))
  }

  return results
}

/**
 * Find dead code identifiers (exported but unused or self-referenced only)
 * Scans ENTIRE codebase for comprehensive dead code detection
 * @param {Object[]} symbols - All symbols from buildSymbols
 * @param {string} repoRoot - Repository root path
 * @returns {Promise<Object>} { deadIdentifiers, selfReferencedOnly, trulyOrphaned }
 */
export async function findDeadCodeIdentifiers(symbols, repoRoot) {
  const deadIdentifiers = []
  const selfReferencedOnly = []
  const trulyOrphaned = []
  
  for (const sym of symbols) {
    // Skip if no definition (shouldn't happen but safety check)
    if (!sym.definition) continue
    
    const hasExternalImports = sym.importedBy.length > 0
    const hasCallSites = sym.callSites.length > 0
    const hasReExports = sym.reExports.length > 0
    const hasInternalUsage = sym.internalUsages.length > 0
    
    // Self-referenced only: exported, used internally, but never imported externally
    if (hasInternalUsage && !hasExternalImports && !hasCallSites && !hasReExports) {
      selfReferencedOnly.push({
        name: sym.name,
        file: sym.definition.file,
        entityType: sym.definition.entityType,
        entitySlug: sym.definition.entitySlug,
        internalUsageCount: sym.internalUsages.length
      })
      deadIdentifiers.push(sym)
    }
    
    // Truly orphaned: exported but zero usage anywhere
    if (!hasExternalImports && !hasCallSites && !hasReExports && !hasInternalUsage) {
      trulyOrphaned.push({
        name: sym.name,
        file: sym.definition.file,
        entityType: sym.definition.entityType,
        entitySlug: sym.definition.entitySlug
      })
      deadIdentifiers.push(sym)
    }
  }
  
  return {
    deadIdentifiers,
    selfReferencedOnly: selfReferencedOnly.sort((a, b) => a.name.localeCompare(b.name)),
    trulyOrphaned: trulyOrphaned.sort((a, b) => a.name.localeCompare(b.name))
  }
}

