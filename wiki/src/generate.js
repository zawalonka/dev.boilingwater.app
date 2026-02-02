/**
 * Wiki Builder - Main Orchestration
 * 
 * This file orchestrates the wiki build process by:
 * 1. Loading data from the filesystem
 * 2. Building relationships between entities
 * 3. Calling page builders to generate HTML
 * 
 * All page generation logic lives in ./builders/
 */

import fs from 'fs/promises'
import path from 'path'
import crypto from 'crypto'
import { fileURLToPath } from 'url'
import { globSync } from 'glob'

// Page builders
import {
  buildElementPages,
  buildCompoundPages,
  buildSolutionPages,
  buildPhasePages,
  buildLevelPages,
  buildExperimentPages,
  buildFormulaPages,
  buildProcessPages,
  buildModulePages,
  buildSymbolPages,
  buildPublicFilesPages,
  buildAssetPages,
  buildScriptPages,
  buildReportPages,
  buildHomePage
} from './builders/index.js'

// Utilities
import { page, writePage, linkTo, escapeHtml, withBase } from './pageBuilder.js'

// ============================================================================
// Configuration
// ============================================================================

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '..', '..')
const wikiRoot = path.resolve(repoRoot, 'wiki')
const distRoot = path.join(wikiRoot, 'dist')
const cacheDir = path.join(wikiRoot, '.cache')
const cacheFile = path.join(cacheDir, 'build.json')

const basePath = process.env.WIKI_BASE_PATH || '/wiki'

// ============================================================================
// CLI Arguments
// ============================================================================

const rawArgs = process.argv.slice(2)
const force = rawArgs.includes('--force')
const changedFiles = []

for (let i = 0; i < rawArgs.length; i += 1) {
  const arg = rawArgs[i]
  if (arg === '--changed' && rawArgs[i + 1]) {
    changedFiles.push(...rawArgs[i + 1].split(',').map((v) => v.trim()).filter(Boolean))
    i += 1
  } else if (arg.startsWith('--changed=')) {
    changedFiles.push(...arg.slice('--changed='.length).split(',').map((v) => v.trim()).filter(Boolean))
  }
}

// ============================================================================
// Cache Utilities
// ============================================================================

const inputGlobs = [
  'src/data/substances/**/*.json',
  'src/constants/workshops.js',
  'src/utils/physics/**/*.js',
  'src/**/*.{js,jsx,css}',
  'docs/**/*.md',
  'scripts/**/*.js',
  'public/assets/workshops/**/*.json'
]

const getInputFiles = () => {
  const files = new Set()
  for (const pattern of inputGlobs) {
    for (const file of globSync(pattern, { cwd: repoRoot, absolute: true })) {
      files.add(file)
    }
  }
  return Array.from(files).sort()
}

const hashFiles = async (files) => {
  const hash = crypto.createHash('sha256')
  for (const file of files) {
    try {
      const content = await fs.readFile(file)
      hash.update(file)
      hash.update(content)
    } catch {
      // Skip files that can't be read
    }
  }
  return hash.digest('hex')
}

const readCache = async () => {
  try {
    const raw = await fs.readFile(cacheFile, 'utf-8')
    return JSON.parse(raw)
  } catch {
    return null
  }
}

const writeCache = async (data) => {
  await fs.mkdir(cacheDir, { recursive: true })
  await fs.writeFile(cacheFile, JSON.stringify(data, null, 2), 'utf-8')
}

// ============================================================================
// Data Loading Functions
// ============================================================================

const loadElements = async () => {
  const files = globSync('src/data/substances/periodic-table/*.json', { cwd: repoRoot, absolute: true })
  const elements = []
  for (const file of files) {
    try {
      const raw = await fs.readFile(file, 'utf-8')
      const data = JSON.parse(raw)
      const slug = path.basename(file, '.json')
      elements.push({ slug, data, file })
    } catch (err) {
      console.warn(`⚠️  Failed to load element: ${file}`)
    }
  }
  return elements.sort((a, b) => (a.data.atomicNumber || 0) - (b.data.atomicNumber || 0))
}

const loadCompounds = async (type) => {
  const folder = type === 'solutions' ? 'solutions' : 'pure'
  const files = globSync(`src/data/substances/compounds/${folder}/*/info.json`, { cwd: repoRoot, absolute: true })
  const compounds = []
  for (const file of files) {
    try {
      const raw = await fs.readFile(file, 'utf-8')
      const data = JSON.parse(raw)
      const id = data.id || path.basename(path.dirname(file))
      compounds.push({ id, data, file })
    } catch (err) {
      console.warn(`⚠️  Failed to load ${type}: ${file}`)
    }
  }
  return compounds.sort((a, b) => a.id.localeCompare(b.id))
}

const loadPhases = async () => {
  const files = globSync('src/data/substances/compounds/**/state.json', { cwd: repoRoot, absolute: true })
  const phases = []
  for (const file of files) {
    try {
      const raw = await fs.readFile(file, 'utf-8')
      const data = JSON.parse(raw)
      const phase = data.phase || path.basename(path.dirname(file))
      const compoundId = data.compoundId || path.basename(path.dirname(path.dirname(file)))
      const slug = `${compoundId}_${phase}`
      phases.push({ slug, compoundId, phase, data, file })
    } catch (err) {
      console.warn(`⚠️  Failed to load phase: ${file}`)
    }
  }
  return phases.sort((a, b) => a.slug.localeCompare(b.slug))
}

const loadLevelsAndExperiments = async () => {
  try {
    const workshopsPath = path.join(repoRoot, 'src/constants/workshops.js')
    const mod = await import(`file://${workshopsPath}?t=${Date.now()}`)
    const { LEVELS = [], EXPERIMENTS = {} } = mod
    
    const levels = LEVELS.map((level) => ({
      id: level.id,
      data: level
    }))
    
    const experiments = Object.entries(EXPERIMENTS).map(([id, exp]) => ({
      id,
      data: exp
    }))
    
    return { levels, experiments }
  } catch (err) {
    console.warn('⚠️  Failed to load levels/experiments:', err.message)
    return { levels: [], experiments: [] }
  }
}

const loadFormulas = async () => {
  const files = globSync('src/utils/physics/formulas/*.js', { cwd: repoRoot, absolute: true })
  const formulas = []
  for (const file of files) {
    try {
      const content = await fs.readFile(file, 'utf-8')
      const slug = path.basename(file, '.js')
      const relativePath = path.relative(repoRoot, file).replace(/\\/g, '/')
      formulas.push({
        slug,
        name: slug,
        relativePath,
        file,
        content,
        exports: parseExports(content)
      })
    } catch (err) {
      console.warn(`⚠️  Failed to load formula: ${file}`)
    }
  }
  return formulas.sort((a, b) => a.slug.localeCompare(b.slug))
}

const loadProcesses = async () => {
  const files = globSync('src/utils/physics/processes/*.js', { cwd: repoRoot, absolute: true })
  const processes = []
  for (const file of files) {
    try {
      const content = await fs.readFile(file, 'utf-8')
      const slug = path.basename(file, '.js')
      const relativePath = path.relative(repoRoot, file).replace(/\\/g, '/')
      processes.push({
        slug,
        name: slug,
        relativePath,
        file,
        content,
        exports: parseExports(content)
      })
    } catch (err) {
      console.warn(`⚠️  Failed to load process: ${file}`)
    }
  }
  return processes.sort((a, b) => a.slug.localeCompare(b.slug))
}

const loadModules = async () => {
  const patterns = [
    'src/**/*.{js,jsx}',
    'scripts/**/*.js'
  ]
  
  const files = new Set()
  for (const pattern of patterns) {
    for (const file of globSync(pattern, { 
      cwd: repoRoot, 
      absolute: true,
      ignore: ['**/node_modules/**', '**/dist/**', 'src/generated/**', 'src/utils/physics/formulas/**', 'src/utils/physics/processes/**']
    })) {
      files.add(file)
    }
  }
  
  const modules = []
  for (const file of files) {
    try {
      const content = await fs.readFile(file, 'utf-8')
      const relativePath = path.relative(repoRoot, file).replace(/\\/g, '/')
      const slug = relativePath.replace(/\//g, '_').replace(/\.(js|jsx)$/, '')
      modules.push({
        slug,
        relativePath,
        file,
        content,
        exports: parseExports(content),
        imports: parseImports(content)
      })
    } catch (err) {
      console.warn(`⚠️  Failed to load module: ${file}`)
    }
  }
  return modules.sort((a, b) => a.relativePath.localeCompare(b.relativePath))
}

const loadPublicFiles = async () => {
  const files = globSync('public/assets/workshops/**/*.{json,png,jpg,jpeg,gif,svg,webp}', {
    cwd: repoRoot,
    absolute: true,
    ignore: ['public/wiki/**']
  })
  
  const publicFiles = []
  for (const file of files) {
    const relativePath = path.relative(path.join(repoRoot, 'public'), file).replace(/\\/g, '/')
    const slug = relativePath.replace(/\//g, '_').replace(/\.[^.]+$/, '')
    publicFiles.push({
      slug,
      relativePath,
      file
    })
  }
  return publicFiles.sort((a, b) => a.relativePath.localeCompare(b.relativePath))
}

const loadWorkshops = async () => {
  const files = globSync('public/assets/workshops/*/workshop.json', { cwd: repoRoot, absolute: true })
  const workshops = []
  for (const file of files) {
    try {
      const raw = await fs.readFile(file, 'utf-8')
      const data = JSON.parse(raw)
      const id = path.basename(path.dirname(file))
      workshops.push({ id, data, file })
    } catch (err) {
      console.warn(`⚠️  Failed to load workshop: ${file}`)
    }
  }
  return workshops
}

const loadRooms = async () => {
  const files = globSync('public/assets/workshops/*/room.json', { cwd: repoRoot, absolute: true })
  const rooms = []
  for (const file of files) {
    try {
      const raw = await fs.readFile(file, 'utf-8')
      const data = JSON.parse(raw)
      const workshopId = path.basename(path.dirname(file))
      rooms.push({ workshopId, data, file })
    } catch (err) {
      // room.json is optional
    }
  }
  return rooms
}

const loadScripts = async () => {
  const files = globSync('scripts/*.js', { cwd: repoRoot, absolute: true })
  const scripts = []
  for (const file of files) {
    const name = path.basename(file)
    const relativePath = path.relative(repoRoot, file).replace(/\\/g, '/')
    const slug = name.replace(/\.js$/, '')
    scripts.push({ slug, name, relativePath, file })
  }
  return scripts.sort((a, b) => a.name.localeCompare(b.name))
}

const loadDocs = async () => {
  const files = globSync('docs/**/*.md', { cwd: repoRoot, absolute: true })
  const docs = []
  for (const file of files) {
    try {
      const content = await fs.readFile(file, 'utf-8')
      const relativePath = path.relative(repoRoot, file).replace(/\\/g, '/')
      const filename = path.basename(file)
      const slug = relativePath.replace(/\//g, '_').replace(/\.md$/, '')
      docs.push({ slug, filename, relativePath, file, content })
    } catch (err) {
      console.warn(`⚠️  Failed to load doc: ${file}`)
    }
  }
  return docs.sort((a, b) => a.relativePath.localeCompare(b.relativePath))
}

const loadStyles = async () => {
  const files = globSync('src/styles/**/*.css', { cwd: repoRoot, absolute: true })
  const styles = []
  for (const file of files) {
    try {
      const content = await fs.readFile(file, 'utf-8')
      const relativePath = path.relative(repoRoot, file).replace(/\\/g, '/')
      const filename = path.basename(file)
      const slug = relativePath.replace(/\//g, '_').replace(/\.css$/, '')
      styles.push({ slug, filename, relativePath, file, content })
    } catch (err) {
      console.warn(`⚠️  Failed to load style: ${file}`)
    }
  }
  return styles.sort((a, b) => a.relativePath.localeCompare(b.relativePath))
}

const loadRootFiles = async () => {
  const files = globSync('*.{js,json,md,mjs,cjs}', { cwd: repoRoot, absolute: true })
  const rootFiles = []
  for (const file of files) {
    try {
      const content = await fs.readFile(file, 'utf-8')
      const filename = path.basename(file)
      const slug = filename.replace(/\.[^.]+$/, '')
      rootFiles.push({ slug, filename, relativePath: filename, file, content })
    } catch (err) {
      // Skip files that can't be read
    }
  }
  return rootFiles.sort((a, b) => a.filename.localeCompare(b.filename))
}

// ============================================================================
// Parse Utilities
// ============================================================================

const parseExports = (content) => {
  const names = new Set()
  const patterns = [
    /export\s+function\s+(\w+)/g,
    /export\s+const\s+(\w+)/g,
    /export\s+class\s+(\w+)/g,
    /export\s+\{([^}]+)\}/g
  ]
  
  for (const regex of patterns.slice(0, 3)) {
    let match
    while ((match = regex.exec(content)) !== null) {
      names.add(match[1])
    }
  }
  
  // Handle export { a, b, c }
  let match
  while ((match = patterns[3].exec(content)) !== null) {
    const parts = match[1].split(',')
    for (const part of parts) {
      const cleaned = part.split('as')[0].trim()
      if (/^[A-Za-z_$][\w$]*$/.test(cleaned)) {
        names.add(cleaned)
      }
    }
  }
  
  return Array.from(names).sort()
}

const parseImports = (content) => {
  const imports = []
  const regex = /import\s+(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)\s+from\s+['"]([^'"]+)['"]/g
  let match
  while ((match = regex.exec(content)) !== null) {
    imports.push(match[1])
  }
  return [...new Set(imports)]
}

// ============================================================================
// Relationship Building
// ============================================================================

const buildRelationships = (data) => {
  const { elements, compounds, solutions, phases, levels, experiments, formulas, processes } = data
  
  // Element → Compounds using it
  const elementChildren = new Map()
  for (const compound of compounds) {
    const refs = compound.data.elements || []
    for (const ref of refs) {
      const slug = path.basename(ref.reference || '', '.json')
      if (!elementChildren.has(slug)) elementChildren.set(slug, [])
      elementChildren.get(slug).push(compound)
    }
  }
  
  // Compound → Solutions using it
  const compoundChildren = new Map()
  for (const solution of solutions) {
    const components = solution.data.components || []
    for (const comp of components) {
      const id = comp.id || path.basename(path.dirname(comp.reference || ''))
      if (!compoundChildren.has(id)) compoundChildren.set(id, [])
      compoundChildren.get(id).push(solution)
    }
  }
  
  // Compound → Phases
  const phasesByCompound = new Map()
  for (const phase of phases) {
    if (!phasesByCompound.has(phase.compoundId)) phasesByCompound.set(phase.compoundId, [])
    phasesByCompound.get(phase.compoundId).push(phase)
  }
  
  // Level → Experiments
  const levelToExperiments = new Map()
  const experimentToLevel = new Map()
  for (const level of levels) {
    levelToExperiments.set(level.id, [])
  }
  for (const exp of experiments) {
    const levelId = exp.data.levelId
    if (levelId && levelToExperiments.has(levelId)) {
      levelToExperiments.get(levelId).push(exp)
      const level = levels.find((l) => l.id === levelId)
      if (level) experimentToLevel.set(exp.id, level)
    }
  }
  
  // Formula ↔ Process relationships
  const formulaToProcesses = new Map()
  const processToFormulas = new Map()
  for (const proc of processes) {
    const matches = Array.from(proc.content.matchAll(/from\s+['"][^'"]*formulas\/([^'"]+)['"]/g))
    const formulaNames = matches.map((m) => path.basename(m[1], '.js'))
    processToFormulas.set(proc.slug, formulaNames)
    for (const fname of formulaNames) {
      if (!formulaToProcesses.has(fname)) formulaToProcesses.set(fname, [])
      formulaToProcesses.get(fname).push(proc)
    }
  }
  
  return {
    elementChildren,
    compoundChildren,
    phasesByCompound,
    levelToExperiments,
    experimentToLevel,
    formulaToProcesses,
    processToFormulas
  }
}

// ============================================================================
// Asset Copying
// ============================================================================

const copyAssets = async () => {
  // Copy styles.css
  const stylesContent = generateStyles()
  await fs.mkdir(path.join(distRoot, 'assets'), { recursive: true })
  await fs.writeFile(path.join(distRoot, 'assets', 'styles.css'), stylesContent, 'utf-8')
  
  // Copy Kekule assets from node_modules (installed via npm)
  const kekuleDest = path.join(distRoot, 'assets/kekule')
  try {
    await fs.mkdir(kekuleDest, { recursive: true })
    // Copy minified JS
    await fs.copyFile(
      path.join(repoRoot, 'node_modules/kekule/dist/kekule.min.js'),
      path.join(kekuleDest, 'kekule.min.js')
    )
    // Copy IO module (required for SMILES parsing)
    await fs.copyFile(
      path.join(repoRoot, 'node_modules/kekule/dist/mins/io.min.js'),
      path.join(kekuleDest, 'io.min.js')
    )
    // Copy CSS theme
    await fs.copyFile(
      path.join(repoRoot, 'node_modules/kekule/dist/themes/default/kekule.css'),
      path.join(kekuleDest, 'kekule.css')
    )
  } catch {
    console.warn('⚠️  Kekule not found in node_modules - run npm install')
  }
}

const generateStyles = () => `
:root {
  color-scheme: light;
  font-family: system-ui, -apple-system, Segoe UI, sans-serif;
  background: #f8f9fa;
  color: #202122;
}
body { margin: 0; }
.wiki-layout { min-height: 100vh; background: #f8f9fa; }
.wiki-topbar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  background: #fff;
  border-bottom: 1px solid #a2a9b1;
  position: sticky;
  top: 0;
  z-index: 10;
}
.wiki-topbar-title { font-size: 18px; font-weight: 600; }
.wiki-menu summary {
  list-style: none;
  cursor: pointer;
  padding: 6px 10px;
  border: 1px solid #a2a9b1;
  border-radius: 4px;
  background: #f8f9fa;
}
.wiki-menu summary::-webkit-details-marker { display: none; }
.wiki-menu-links {
  position: absolute;
  top: 100%;
  left: 0;
  z-index: 100;
  background: #fff;
  padding: 12px;
  border-radius: 6px;
  border: 1px solid #a2a9b1;
  min-width: 200px;
  box-shadow: 0 8px 20px rgba(0,0,0,0.12);
}
.wiki-menu-links a { display: block; color: #0645ad; text-decoration: none; padding: 4px 0; }
.wiki-menu-links a:hover { text-decoration: underline; }
.menu-heading { font-weight: 600; margin: 8px 0 4px; color: #54595d; font-size: 12px; text-transform: uppercase; }
.wiki-menu-divider { height: 1px; background: #c8ccd1; margin: 8px 0; }
.wiki-content { padding: 24px 32px 48px; }
.wiki-article { max-width: 980px; }
.section { margin-bottom: 20px; padding-bottom: 12px; border-bottom: 1px solid #c8ccd1; }
.infobox {
  float: right;
  width: 280px;
  margin: 0 0 16px 16px;
  border: 1px solid #a2a9b1;
  background: #f8f9fa;
  font-size: 13px;
  border-radius: 6px;
}
.infobox-title { background: #eaecf0; padding: 8px 10px; font-weight: 600; text-align: center; border-bottom: 1px solid #a2a9b1; }
.infobox-row { display: grid; grid-template-columns: 100px 1fr; gap: 6px; padding: 6px 10px; border-bottom: 1px solid #c8ccd1; }
.infobox-row:last-child { border-bottom: none; }
.infobox-label { font-weight: 600; color: #54595d; }
.periodic-table-wrapper { overflow-x: auto; margin: 20px 0; }
.periodic-table { border-collapse: collapse; font-size: 11px; }
.periodic-table th, .periodic-table td { padding: 2px; text-align: center; }
.pt-cell { width: 50px; height: 60px; border: 1px solid #ccc; }
.pt-link { display: block; text-decoration: none; color: inherit; height: 100%; }
.pt-atomic { font-size: 9px; color: #666; }
.pt-symbol { font-size: 16px; font-weight: bold; }
.pt-name { font-size: 8px; overflow: hidden; text-overflow: ellipsis; }
.pt-empty { background: transparent; border: none; }
.cat-nonmetal { background: #a0ffa0; }
.cat-noble-gas { background: #c0ffff; }
.cat-alkali-metal { background: #ff6666; }
.cat-alkaline-earth-metal { background: #ffdead; }
.cat-metalloid { background: #cccc99; }
.cat-halogen { background: #ffff99; }
.cat-post-transition-metal { background: #cccccc; }
.cat-transition-metal { background: #ffc0c0; }
.cat-lanthanide { background: #ffbfff; }
.cat-actinide { background: #ff99cc; }
pre { background: #f6f8fa; border: 1px solid #d0d7de; padding: 12px; border-radius: 6px; overflow-x: auto; }
code { font-family: ui-monospace, monospace; font-size: 13px; }
ul { padding-left: 20px; }
a { color: #0645ad; }
`

// ============================================================================
// Build Asset Tree
// ============================================================================

const buildAssetTree = (publicFiles) => {
  const root = { type: 'directory', name: 'assets', children: [] }
  
  for (const file of publicFiles) {
    const parts = file.relativePath.split('/')
    let current = root
    
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i]
      const isFile = i === parts.length - 1
      
      if (isFile) {
        current.children.push({
          type: 'file',
          name: part,
          slug: file.slug
        })
      } else {
        let child = current.children.find((c) => c.type === 'directory' && c.name === part)
        if (!child) {
          child = { type: 'directory', name: part, children: [] }
          current.children.push(child)
        }
        current = child
      }
    }
  }
  
  return root
}

// ============================================================================
// Main Build Function
// ============================================================================

const build = async () => {
  console.log('📚 Wiki build starting...')
  
  // Check cache
  const inputFiles = getInputFiles()
  const newHash = await hashFiles(inputFiles)
  const cached = await readCache()
  
  if (!force && cached?.hash === newHash) {
    console.log('✅ Wiki: no changes detected, skipping build')
    return
  }
  
  // Clean dist
  await fs.rm(distRoot, { recursive: true, force: true })
  await fs.mkdir(distRoot, { recursive: true })
  
  // Copy assets
  await copyAssets()
  
  // Load all data
  console.log('📖 Loading data...')
  const elements = await loadElements()
  const compounds = await loadCompounds('pure')
  const solutions = await loadCompounds('solutions')
  const phases = await loadPhases()
  const { levels, experiments } = await loadLevelsAndExperiments()
  const formulas = await loadFormulas()
  const processes = await loadProcesses()
  const modules = await loadModules()
  const publicFiles = await loadPublicFiles()
  const workshops = await loadWorkshops()
  const rooms = await loadRooms()
  const scripts = await loadScripts()
  
  // Build relationships
  console.log('🔗 Building relationships...')
  const relationships = buildRelationships({
    elements, compounds, solutions, phases, levels, experiments, formulas, processes
  })
  
  // Build module maps
  const moduleImportMap = new Map()
  const moduleExportMap = new Map()
  for (const mod of modules) {
    moduleImportMap.set(mod.slug, mod.imports)
    moduleExportMap.set(mod.slug, mod.exports)
  }
  
  // Build symbol tracking (simplified)
  const symbols = []
  const symbolCallSites = new Map()
  for (const formula of formulas) {
    for (const exp of formula.exports) {
      symbols.push({ slug: `formula_${exp}`, name: exp, type: 'function', moduleSlug: formula.slug })
    }
  }
  for (const proc of processes) {
    for (const exp of proc.exports) {
      symbols.push({ slug: `process_${exp}`, name: exp, type: 'function', moduleSlug: proc.slug })
    }
  }
  
  // Build context for page builders
  const writePageFn = async (relativePath, html) => {
    const fullPath = path.join(distRoot, relativePath)
    await fs.mkdir(path.dirname(fullPath), { recursive: true })
    await fs.writeFile(fullPath, html, 'utf-8')
  }
  
  const context = { writePage: writePageFn, page, linkTo }
  
  // Generate pages
  console.log('📝 Generating pages...')
  
  await buildElementPages(elements, relationships.elementChildren, context)
  await buildCompoundPages(compounds, relationships.compoundChildren, relationships.phasesByCompound, context)
  await buildSolutionPages(solutions, relationships.compoundChildren, context)
  await buildPhasePages(phases, compounds, solutions, context)
  await buildLevelPages(levels, relationships.levelToExperiments, context)
  await buildExperimentPages(experiments, relationships.experimentToLevel, context)
  await buildFormulaPages(formulas, relationships.formulaToProcesses, relationships.processToFormulas, context)
  await buildProcessPages(processes, relationships.processToFormulas, relationships.formulaToProcesses, context)
  await buildModulePages(modules, moduleImportMap, moduleExportMap, context)
  await buildSymbolPages(symbols, symbolCallSites, modules, context)
  await buildPublicFilesPages(publicFiles, workshops, rooms, context)
  await buildAssetPages(buildAssetTree(publicFiles), context)
  await buildScriptPages(scripts, context)
  
  // Build reports
  await buildReportPages(context, {
    docs: [],
    styles: [],
    rootFiles: [],
    solutions,
    phases,
    compounds,
    modules,
    moduleImportMap,
    phasesByCompound: relationships.phasesByCompound
  })
  
  // Build home page
  await buildHomePage({
    elementCount: elements.length,
    compoundCount: compounds.length,
    solutionCount: solutions.length,
    phaseCount: phases.length,
    levelCount: levels.length,
    experimentCount: experiments.length,
    formulaCount: formulas.length,
    processCount: processes.length,
    moduleCount: modules.length,
    symbolCount: symbols.length,
    publicFileCount: publicFiles.length,
    scriptCount: scripts.length
  }, context)
  
  // Write cache
  await writeCache({ hash: newHash, timestamp: new Date().toISOString() })
  
  console.log(`✅ Wiki built successfully! (${elements.length} elements, ${compounds.length} compounds, ${modules.length} modules)`)
}

// Run build
build().catch((err) => {
  console.error('❌ Wiki build failed:', err)
  process.exit(1)
})
