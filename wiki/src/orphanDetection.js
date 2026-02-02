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
    if (fs.existsSync(srcDir)) {
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
    if (fs.existsSync(srcDir)) {
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
    if (fs.existsSync(srcDir)) {
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
    
    if (fs.existsSync(srcDir)) await scanDir(srcDir)
    if (fs.existsSync(wikiDir)) await scanDir(wikiDir)
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
