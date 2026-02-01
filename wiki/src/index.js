import fs from 'fs/promises'
import path from 'path'
import crypto from 'crypto'
import { fileURLToPath, pathToFileURL } from 'url'
import { globSync } from 'glob'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '..', '..')
const wikiRoot = path.resolve(repoRoot, 'wiki')
const distRoot = path.join(wikiRoot, 'dist')
const cacheDir = path.join(wikiRoot, '.cache')
const cacheFile = path.join(cacheDir, 'build.json')

const basePath = process.env.WIKI_BASE_PATH || '/wiki'

const inputGlobs = [
  'src/data/substances/periodic-table/*.json',
  'src/data/substances/compounds/pure/*/info.json',
  'src/data/substances/compounds/solutions/*/info.json',
  'src/data/substances/compounds/**/state.json',
  'src/constants/workshops.js',
  'src/utils/physics/**/*.{js,jsx}',
  'src/**/*.{js,jsx}'
]

const rawArgs = process.argv.slice(2)
const force = rawArgs.includes('--force')
const changedFiles = []

for (let i = 0; i < rawArgs.length; i += 1) {
  const arg = rawArgs[i]
  if (arg === '--changed' && rawArgs[i + 1]) {
    changedFiles.push(...rawArgs[i + 1].split(',').map((value) => value.trim()).filter(Boolean))
    i += 1
  } else if (arg.startsWith('--changed=')) {
    changedFiles.push(...arg.slice('--changed='.length).split(',').map((value) => value.trim()).filter(Boolean))
  }
}

const toAbsolute = (filePath) => path.isAbsolute(filePath)
  ? filePath
  : path.resolve(repoRoot, filePath)

const relevantRoots = [
  path.resolve(repoRoot, 'src/data/substances'),
  path.resolve(repoRoot, 'src/constants/workshops.js'),
  path.resolve(repoRoot, 'src/utils/physics')
]

const isRelevantChange = (filePath) => {
  const absolutePath = toAbsolute(filePath)
  return relevantRoots.some((root) => absolutePath.startsWith(root))
}

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
    const content = await fs.readFile(file)
    hash.update(file)
    hash.update(content)
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

const escapeHtml = (value) => value
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;')

const withBase = (href) => {
  if (!basePath) return href
  const trimmedBase = basePath.endsWith('/') ? basePath.slice(0, -1) : basePath
  const trimmedHref = href.startsWith('/') ? href.slice(1) : href
  return `${trimmedBase}/${trimmedHref}`
}

const page = ({ title, content }) => `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
  <link rel="stylesheet" href="${withBase('assets/styles.css')}" />
</head>
<body>
  <div class="wiki-layout">
    <div class="wiki-main">
      <header class="wiki-topbar">
        <details class="wiki-menu" aria-label="Menu">
          <summary>☰</summary>
          <nav class="wiki-menu-links">
            <a href="${withBase('index.html')}">Main page</a>
            <a href="${withBase('entities/elements/index.html')}">Elements</a>
            <a href="${withBase('entities/compounds/index.html')}">Compounds</a>
            <a href="${withBase('entities/solutions/index.html')}">Solutions</a>
            <a href="${withBase('entities/phases/index.html')}">Phases</a>
            <a href="${withBase('entities/levels/index.html')}">Levels</a>
            <a href="${withBase('entities/experiments/index.html')}">Experiments</a>
            <a href="${withBase('entities/formulas/index.html')}">Formulas</a>
            <a href="${withBase('entities/processes/index.html')}">Processes</a>
            <a href="${withBase('entities/modules/index.html')}">Modules</a>
            <a href="${withBase('entities/symbols/index.html')}">Symbols</a>
            <div class="wiki-menu-divider"></div>
            <a href="/">Back to Game</a>
          </nav>
        </details>
        <div class="wiki-topbar-title">${escapeHtml(title)}</div>
      </header>
      <main class="wiki-content">
        <article class="wiki-article">
          ${content}
        </article>
      </main>
    </div>
  </div>
</body>
</html>`

const writePage = async (relativePath, html) => {
  const fullPath = path.join(distRoot, relativePath)
  await fs.mkdir(path.dirname(fullPath), { recursive: true })
  await fs.writeFile(fullPath, html, 'utf-8')
}

const renderJson = (data) => `<pre class="code">${escapeHtml(JSON.stringify(data, null, 2))}</pre>`

const renderList = (items) => `<ul>${items.map((item) => `<li>${item}</li>`).join('')}</ul>`

const renderPeriodicTable = (elements) => {
  const byAtomic = new Map()
  for (const element of elements) {
    if (element.data.atomicNumber) {
      byAtomic.set(element.data.atomicNumber, element)
    }
  }

  const periods = [
    [1, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, 2],
    [3, 4, null, null, null, null, null, null, null, null, null, null, 5, 6, 7, 8, 9, 10],
    [11, 12, null, null, null, null, null, null, null, null, null, null, 13, 14, 15, 16, 17, 18],
    [19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36],
    [37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54],
    [55, 56, 57, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86],
    [87, 88, 89, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118]
  ]

  const lanthanides = [null, null, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, null]
  const actinides = [null, null, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103, null]

  const groupLabels = Array.from({ length: 18 }, (_, i) => i + 1)

  const renderCell = (atomicNumber) => {
    if (!atomicNumber) return '<td class="pt-empty"></td>'
    const element = byAtomic.get(atomicNumber)
    if (!element) return '<td class="pt-empty"></td>'

    const symbol = element.data.symbol || element.slug
    const name = element.data.name || element.slug
    const category = element.data.elementCategory || ''
    const categoryClass = category
      ? `cat-${category.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}`
      : ''

    return `
      <td class="pt-cell ${categoryClass}">
        <a class="pt-link" href="${withBase(`entities/elements/${element.slug}.html`)}">
          <div class="pt-atomic">${atomicNumber}</div>
          <div class="pt-symbol">${escapeHtml(symbol)}</div>
          <div class="pt-name">${escapeHtml(name)}</div>
        </a>
      </td>
    `
  }

  const headerRow = `
    <tr>
      <th class="pt-corner"></th>
      ${groupLabels.map((label) => `<th class="pt-group">${label}</th>`).join('')}
    </tr>
  `

  const periodRows = periods.map((row, index) => `
    <tr>
      <th class="pt-period">${index + 1}</th>
      ${row.map(renderCell).join('')}
    </tr>
  `)

  const seriesRows = [
    {
      label: 'La–Lu',
      row: lanthanides
    },
    {
      label: 'Ac–Lr',
      row: actinides
    }
  ].map(({ label, row }) => `
    <tr class="pt-series">
      <th class="pt-series-label">${label}</th>
      ${row.map(renderCell).join('')}
    </tr>
  `)

  return `
    <div class="periodic-table-wrapper">
      <table class="periodic-table">
        <thead>${headerRow}</thead>
        <tbody>
          ${periodRows.join('')}
          ${seriesRows.join('')}
        </tbody>
      </table>
    </div>
  `
}

const renderFileList = (items) => {
  if (!items.length) return '<p>None found.</p>'
  return `<ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`
}

const renderParagraphs = (value) => {
  const text = String(value || '').trim()
  if (!text) return ''
  const parts = text.split(/\n\s*\n/).map((part) => part.trim()).filter(Boolean)
  return parts.map((part) => `<p>${escapeHtml(part)}</p>`).join('')
}

const renderEducationalSection = (value, useDocParser = false) => {
  const body = useDocParser ? parseDocBlockToHtml(value) : renderParagraphs(value)
  if (!body) return ''
  return `
    <section class="section">
      <h2>Educational notes</h2>
      ${body}
    </section>
  `
}

const buildElements = async () => {
  const files = globSync('src/data/substances/periodic-table/*.json', { cwd: repoRoot, absolute: true })
  const elements = []
  for (const file of files) {
    const raw = await fs.readFile(file, 'utf-8')
    const data = JSON.parse(raw)
    const slug = path.basename(file, '.json')
    elements.push({ slug, data })
  }
  return elements.sort((a, b) => a.slug.localeCompare(b.slug))
}

const buildCompounds = async (type) => {
  const files = globSync(`src/data/substances/compounds/${type}/*/info.json`, { cwd: repoRoot, absolute: true })
  const compounds = []
  for (const file of files) {
    const raw = await fs.readFile(file, 'utf-8')
    const data = JSON.parse(raw)
    const id = data.id || path.basename(path.dirname(file))
    compounds.push({ id, data, file })
  }
  return compounds.sort((a, b) => a.id.localeCompare(b.id))
}

const buildPhases = async () => {
  const files = globSync('src/data/substances/compounds/**/state.json', { cwd: repoRoot, absolute: true })
  const phases = []
  for (const file of files) {
    const raw = await fs.readFile(file, 'utf-8')
    const data = JSON.parse(raw)
    const phase = data.phase || path.basename(path.dirname(file))
    const compoundId = data.compoundId || path.basename(path.dirname(path.dirname(file)))
    const slug = `${compoundId}-${phase}`
    phases.push({ slug, compoundId, phase, data, file })
  }
  return phases.sort((a, b) => a.slug.localeCompare(b.slug))
}

const extractDocSummary = (content) => {
  const match = content.match(/\/\*\*([\s\S]*?)\*\//)
  if (!match) return ''
  const lines = match[1]
    .split('\n')
    .map((line) => line.replace(/^\s*\*\s?/, '').trim())
    .filter(Boolean)
  return lines[0] || ''
}

const extractDocBlock = (content) => {
  const match = content.match(/\/\*\*([\s\S]*?)\*\//)
  if (!match) return ''
  return match[1]
    .split('\n')
    .map((line) => line.replace(/^\s*\*\s?/, '').trim())
    .filter(Boolean)
    .join('\n')
}

const parseDocBlockToHtml = (text) => {
  if (!text) return ''
  const lines = text.split('\n')
  const result = []
  let inCodeBlock = false
  let codeLines = []
  let pendingHeading = null

  for (const line of lines) {
    // Headings (lines of === or ---)
    if (/^=+$/.test(line) && pendingHeading) {
      result.push(`<h3>${escapeHtml(pendingHeading)}</h3>`)
      pendingHeading = null
      continue
    }
    if (/^-+$/.test(line) && pendingHeading) {
      result.push(`<h4>${escapeHtml(pendingHeading)}</h4>`)
      pendingHeading = null
      continue
    }
    // Flush pending heading as paragraph if not followed by underline
    if (pendingHeading) {
      result.push(`<p>${escapeHtml(pendingHeading)}</p>`)
      pendingHeading = null
    }
    // Code-like lines (formulas, equations)
    if (/^\s*(\w+\s*=|log|T\s*=|P\s*=|Where:|@see)/.test(line)) {
      if (!inCodeBlock) {
        inCodeBlock = true
        codeLines = []
      }
      codeLines.push(line)
      continue
    }
    // End code block if we were in one
    if (inCodeBlock && line.trim()) {
      result.push(`<pre class="code">${escapeHtml(codeLines.join('\n'))}</pre>`)
      inCodeBlock = false
      codeLines = []
    }
    // Check if this could be a heading (ALL CAPS line)
    if (/^[A-Z][A-Z\s]+:?$/.test(line.trim())) {
      pendingHeading = line.trim()
      continue
    }
    // Regular paragraphs
    if (line.trim()) {
      result.push(`<p>${escapeHtml(line)}</p>`)
    }
  }
  // Flush pending heading
  if (pendingHeading) {
    result.push(`<p>${escapeHtml(pendingHeading)}</p>`)
  }
  // Flush remaining code block
  if (inCodeBlock && codeLines.length) {
    result.push(`<pre class="code">${escapeHtml(codeLines.join('\n'))}</pre>`)
  }
  return result.join('\n')
}

const parseExports = (content) => {
  const names = new Set()
  const functionRegex = /export\s+function\s+(\w+)/g
  const constRegex = /export\s+const\s+(\w+)/g
  const classRegex = /export\s+class\s+(\w+)/g
  const namedRegex = /export\s*\{([^}]+)\}/g
  const identifierRegex = /^[A-Za-z_$][\w$]*$/

  for (const regex of [functionRegex, constRegex, classRegex]) {
    let match
    while ((match = regex.exec(content)) !== null) {
      names.add(match[1])
    }
  }

  let namedMatch
  while ((namedMatch = namedRegex.exec(content)) !== null) {
    const parts = namedMatch[1].split(',')
    for (const part of parts) {
      const withoutBlockComments = part.replace(/\/\*.*?\*\//g, '')
      const withoutLineComments = withoutBlockComments.replace(/\/\/.*$/g, '')
      const cleaned = withoutLineComments.split('as')[0].trim()
      if (identifierRegex.test(cleaned)) names.add(cleaned)
    }
  }

  return Array.from(names).sort()
}

const buildFormulas = async () => {
  const files = globSync('src/utils/physics/formulas/*.js', { cwd: repoRoot, absolute: true })
  const formulas = []
  for (const file of files) {
    const content = await fs.readFile(file, 'utf-8')
    const slug = path.basename(file, '.js')
    formulas.push({
      slug,
      file,
      summary: extractDocSummary(content),
      docBlock: extractDocBlock(content),
      exports: parseExports(content),
      content
    })
  }
  return formulas.sort((a, b) => a.slug.localeCompare(b.slug))
}

const buildProcesses = async () => {
  const files = globSync('src/utils/physics/processes/**/*.js', { cwd: repoRoot, absolute: true })
  const processes = []
  for (const file of files) {
    const content = await fs.readFile(file, 'utf-8')
    const relative = path.relative(path.join(repoRoot, 'src/utils/physics/processes'), file)
    const slug = relative.replace(/\\/g, '/').replace(/\.js$/, '')
    processes.push({
      slug,
      file,
      summary: extractDocSummary(content),
      docBlock: extractDocBlock(content),
      exports: parseExports(content),
      content,
      isStub: path.basename(file).startsWith('_')
    })
  }
  return processes.sort((a, b) => a.slug.localeCompare(b.slug))
}

const parseImports = (content) => {
  const imports = []
  // Match: import { ... } from '...' AND export { ... } from '...'
  const importRegex = /(?:import|export)\s+(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)\s+from\s+['"]([^'"]+)['"]/g
  let match
  while ((match = importRegex.exec(content)) !== null) {
    imports.push(match[1])
  }
  return [...new Set(imports)] // Deduplicate
}

const buildModules = async () => {
  // Key game files to create wiki pages for
  const modulePatterns = [
    'src/App.jsx',
    'src/main.jsx',
    'src/components/*.jsx',
    'src/utils/*.js',
    'src/utils/physics/index.js',
    'src/constants/*.js',
    'src/hooks/*.js'
  ]
  
  const files = new Set()
  for (const pattern of modulePatterns) {
    for (const file of globSync(pattern, { cwd: repoRoot, absolute: true })) {
      // Exclude formulas and processes (they have their own pages)
      if (!file.includes('physics/formulas') && !file.includes('physics/processes')) {
        files.add(file)
      }
    }
  }
  
  const modules = []
  for (const file of files) {
    const content = await fs.readFile(file, 'utf-8')
    const relative = path.relative(path.join(repoRoot, 'src'), file)
    const slug = relative.replace(/\\/g, '/').replace(/\.(js|jsx)$/, '')
    modules.push({
      slug,
      file,
      filename: path.basename(file),
      summary: extractDocSummary(content),
      docBlock: extractDocBlock(content),
      exports: parseExports(content),
      imports: parseImports(content),
      content,
      isComponent: file.endsWith('.jsx')
    })
  }
  return modules.sort((a, b) => a.slug.localeCompare(b.slug))
}

/**
 * Parse which symbols a file imports from a given source
 * e.g., import { calculateBoilingPoint, simulateTimeStep } from '../utils/physics'
 */
const parseImportedSymbols = (content) => {
  const symbolImports = []
  // Match: import { sym1, sym2 as alias } from '...'
  const importRegex = /import\s*\{([^}]+)\}\s*from\s*['"]([^'"]+)['"]/g
  let match
  while ((match = importRegex.exec(content)) !== null) {
    const symbols = match[1].split(',').map((s) => {
      // Handle "name as alias" - we want the original name
      const parts = s.trim().split(/\s+as\s+/)
      return parts[0].trim()
    }).filter(Boolean)
    const source = match[2]
    for (const symbol of symbols) {
      symbolImports.push({ symbol, source })
    }
  }
  return symbolImports
}

/**
 * Find call sites for a symbol in file content
 * Returns array of { line, context } objects
 */
const findCallSites = (content, symbolName) => {
  const lines = content.split('\n')
  const callSites = []
  // Match symbol used as function call or property access
  const regex = new RegExp(`\\b${symbolName}\\s*[\\(\\.]`, 'g')
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (regex.test(line)) {
      callSites.push({
        line: i + 1,
        context: line.trim().slice(0, 100) // First 100 chars
      })
    }
    regex.lastIndex = 0 // Reset regex state
  }
  return callSites
}

const findInternalUsages = (content, symbolName) => {
  const lines = content.split('\n')
  const usages = []
  const regex = new RegExp(`\\b${symbolName}\\b`)

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) {
      continue
    }
    if (!regex.test(line)) continue
    if (trimmed.startsWith('export')) continue
    usages.push({
      line: i + 1,
      context: trimmed.slice(0, 100)
    })
  }

  return usages
}

const findReExportUsages = (content, symbolName) => {
  const lines = content.split('\n')
  const usages = []
  const inlineRegex = new RegExp(`\\bexport\\b.*\\b${symbolName}\\b`)
  const symbolRegex = new RegExp(`\\b${symbolName}\\b`)
  let inExportBlock = false

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) {
      continue
    }

    if (inlineRegex.test(line)) {
      usages.push({
        line: i + 1,
        context: trimmed.slice(0, 100)
      })
      continue
    }

    if (/^export\s*\{/.test(trimmed)) {
      inExportBlock = true
    }

    if (inExportBlock && symbolRegex.test(line)) {
      usages.push({
        line: i + 1,
        context: trimmed.slice(0, 100)
      })
    }

    if (inExportBlock && /}\s*from\s*['"].+['"];?/.test(trimmed)) {
      inExportBlock = false
    }
  }

  return usages
}

/**
 * Build symbol registry from formulas, processes, and modules
 */
const buildSymbols = async (formulas, processes, modules) => {
  const symbols = new Map() // symbolName -> { definition, reExports, importedBy, callSites, internalUsages, reExportUsages }
  
  // Helper to register a symbol
  const registerSymbol = (name, file, entityType, entitySlug, isReExport = false) => {
    if (!symbols.has(name)) {
      symbols.set(name, {
        name,
        definition: null,
        reExports: [],
        importedBy: [],
        callSites: [],
        internalUsages: [],
        reExportUsages: []
      })
    }
    const sym = symbols.get(name)
    if (isReExport) {
      sym.reExports.push({ file, entityType, entitySlug })
    } else if (!sym.definition) {
      sym.definition = { file, entityType, entitySlug }
    }
  }
  
  // Register exports from formulas (these are definitions)
  for (const formula of formulas) {
    for (const exp of formula.exports) {
      registerSymbol(exp, formula.file, 'formula', formula.slug, false)
    }
  }
  
  // Register exports from processes (these are definitions)
  for (const process of processes) {
    for (const exp of process.exports) {
      registerSymbol(exp, process.file, 'process', process.slug, false)
    }
  }
  
  // Register exports from modules
  // physics/index.js re-exports, others may define new symbols
  for (const mod of modules) {
    const isBarrelFile = mod.slug === 'utils/physics/index' || mod.filename === 'index.js'
    for (const exp of mod.exports) {
      // Check if this symbol already has a definition (it's a re-export)
      const existing = symbols.get(exp)
      const isReExport = isBarrelFile || (existing && existing.definition)
      registerSymbol(exp, mod.file, 'module', mod.slug, isReExport)
    }
  }
  
  // Find who imports each symbol and call sites
  const allFiles = globSync('src/**/*.{js,jsx}', {
    cwd: repoRoot,
    absolute: true,
    ignore: ['src/generated/**']
  })

  const fileContentMap = new Map()
  
  for (const file of allFiles) {
    const content = await fs.readFile(file, 'utf-8')
    fileContentMap.set(file, content)
    const relPath = path.relative(repoRoot, file).replace(/\\/g, '/')
    const importedSymbols = parseImportedSymbols(content)
    
    for (const { symbol } of importedSymbols) {
      if (symbols.has(symbol)) {
        const sym = symbols.get(symbol)
        // Don't add if this is the definition or re-export file
        const isOwnFile = sym.definition?.file === file || 
          sym.reExports.some((r) => r.file === file)
        if (!isOwnFile) {
          sym.importedBy.push({ file: relPath })
          // Find call sites in this file
          const sites = findCallSites(content, symbol)
          for (const site of sites) {
            sym.callSites.push({ file: relPath, ...site })
          }
        }
      }
    }
  }

  // Detect internal/default usages in definition files
  for (const sym of symbols.values()) {
    if (!sym.definition?.file) continue
    const defContent = fileContentMap.get(sym.definition.file)
    if (!defContent) continue
    const internal = findInternalUsages(defContent, sym.name)
    if (internal.length) {
      sym.internalUsages.push(...internal)
    }
  }

  // Detect re-export lines in re-export files
  for (const sym of symbols.values()) {
    for (const reExport of sym.reExports) {
      const reContent = fileContentMap.get(reExport.file)
      if (!reContent) continue
      const reLines = findReExportUsages(reContent, sym.name)
      if (reLines.length) {
        sym.reExportUsages.push({
          file: reExport.file,
          entityType: reExport.entityType,
          entitySlug: reExport.entitySlug,
          lines: reLines
        })
      }
    }
  }
  
  // Convert to array and sort
  return Array.from(symbols.values())
    .filter((s) => s.definition) // Only symbols with a known definition
    .sort((a, b) => a.name.localeCompare(b.name))
}

const buildUsageMap = async (symbols) => {
  const files = globSync('src/**/*.{js,jsx}', {
    cwd: repoRoot,
    absolute: true,
    ignore: ['src/utils/physics/formulas/**', 'src/utils/physics/processes/**']
  })
  const usage = new Map()
  for (const symbol of symbols) usage.set(symbol, new Set())

  for (const file of files) {
    const content = await fs.readFile(file, 'utf-8')
    for (const symbol of symbols) {
      const regex = new RegExp(`\\b${symbol}\\b`, 'g')
      if (regex.test(content)) {
        usage.get(symbol).add(path.relative(repoRoot, file))
      }
    }
  }

  return usage
}

const linkTo = (href, label) => `<a href="${withBase(href)}">${escapeHtml(label)}</a>`

const renderEntityHeader = (title, subtitle) => `
  <div class="entity-header">
    <h1>${escapeHtml(title)}</h1>
    ${subtitle ? `<p class="subtitle">${escapeHtml(subtitle)}</p>` : ''}
  </div>
`

const renderInfobox = (title, rows) => {
  const renderedRows = rows
    .filter((row) => row && row.value)
    .map((row) => `
      <div class="infobox-row">
        <div class="infobox-label">${escapeHtml(row.label)}</div>
        <div class="infobox-value">${row.value}</div>
      </div>
    `)
    .join('')

  if (!renderedRows) return ''

  return `
    <aside class="infobox">
      <div class="infobox-title">${escapeHtml(title)}</div>
      ${renderedRows}
    </aside>
  `
}

const renderLinkList = (items) => items.length ? renderList(items) : '<p>None found.</p>'

const renderUsedInList = (filePaths, fileToWikiEntity) => {
  if (!filePaths.length) return ''
  const items = filePaths.map((filePath) => {
    const normalized = filePath.replace(/\\/g, '/')
    const entity = fileToWikiEntity.get(normalized)
    if (entity) {
      return linkTo(entity.href, entity.label)
    }
    // Non-wiki file - show as plain text
    return escapeHtml(filePath)
  })
  return renderList(items)
}

const getOrderedSibling = (items, current, direction = 1) => {
  const sorted = [...items].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
  const index = sorted.findIndex((item) => item.id === current.id || item.id === current)
  if (index === -1) return null
  return sorted[index + direction] || null
}

const buildLevelsAndExperiments = async () => {
  const moduleUrl = pathToFileURL(path.join(repoRoot, 'src/constants/workshops.js')).href
  const { LEVELS, EXPERIMENTS } = await import(moduleUrl)
  const levels = Array.isArray(LEVELS) ? LEVELS : []
  const experiments = []

  Object.entries(EXPERIMENTS || {}).forEach(([levelId, items]) => {
    for (const item of items) {
      experiments.push({ ...item, levelId: Number(levelId) })
    }
  })

  return { levels, experiments }
}

const build = async () => {
  const inputFiles = getInputFiles()

  if (!force && changedFiles.length > 0) {
    const hasRelevantChanges = changedFiles.some(isRelevantChange)
    if (!hasRelevantChanges) {
      console.log('Wiki: no relevant changes detected; skipping build.')
      return
    }
  }

  const newHash = await hashFiles(inputFiles)
  const previous = await readCache()
  if (!force && previous?.hash === newHash) {
    console.log('Wiki: no changes detected; skipping build.')
    return
  }

  const elements = await buildElements()
  const compounds = await buildCompounds('pure')
  const solutions = await buildCompounds('solutions')
  const phases = await buildPhases()
  const { levels, experiments } = await buildLevelsAndExperiments()
  const formulas = await buildFormulas()
  const processes = await buildProcesses()
  const modules = await buildModules()
  const symbols = await buildSymbols(formulas, processes, modules)

  const elementChildren = new Map()
  const compoundChildren = new Map()
  const phasesByCompound = new Map()

  for (const phase of phases) {
    if (!phasesByCompound.has(phase.compoundId)) phasesByCompound.set(phase.compoundId, [])
    phasesByCompound.get(phase.compoundId).push(phase)
  }

  for (const compound of compounds) {
    const list = compound.data.elements || []
    for (const item of list) {
      const ref = item.reference || ''
      const slug = path.basename(ref, '.json')
      if (!elementChildren.has(slug)) elementChildren.set(slug, [])
      elementChildren.get(slug).push(compound)
    }
  }

  for (const solution of solutions) {
    const components = solution.data.components || []
    for (const component of components) {
      const ref = component.reference || ''
      const id = path.basename(path.dirname(ref))
      if (!compoundChildren.has(id)) compoundChildren.set(id, [])
      compoundChildren.get(id).push(solution)
    }
  }

  const formulaToProcesses = new Map()
  const processToFormulas = new Map()

  // Build file path → wiki entity map for cross-referencing
  const fileToWikiEntity = new Map()
  for (const formula of formulas) {
    const relPath = path.relative(repoRoot, formula.file).replace(/\\/g, '/')
    fileToWikiEntity.set(relPath, {
      type: 'formula',
      slug: formula.slug,
      href: `entities/formulas/${formula.slug}.html`,
      label: formula.slug
    })
  }
  for (const process of processes) {
    const relPath = path.relative(repoRoot, process.file).replace(/\\/g, '/')
    fileToWikiEntity.set(relPath, {
      type: 'process',
      slug: process.slug,
      href: `entities/processes/${process.slug}.html`,
      label: process.slug
    })
  }
  for (const mod of modules) {
    const relPath = path.relative(repoRoot, mod.file).replace(/\\/g, '/')
    fileToWikiEntity.set(relPath, {
      type: 'module',
      slug: mod.slug,
      href: `entities/modules/${mod.slug}.html`,
      label: mod.filename
    })
  }

  for (const process of processes) {
    const matches = Array.from(process.content.matchAll(/from\s+['"][^'"]*formulas\/([^'"]+)['"]/g))
    const formulaNames = matches.map((match) => path.basename(match[1], '.js'))
    const unique = Array.from(new Set(formulaNames))
    processToFormulas.set(process.slug, unique)
    for (const name of unique) {
      if (!formulaToProcesses.has(name)) formulaToProcesses.set(name, [])
      formulaToProcesses.get(name).push(process)
    }
  }

  const formulaSymbols = formulas.flatMap((formula) => formula.exports)
  const processSymbols = processes.flatMap((process) => process.exports)

  const formulaUsage = await buildUsageMap(formulaSymbols)
  const processUsage = await buildUsageMap(processSymbols)

  const styles = `
    :root {
      color-scheme: light;
      font-family: system-ui, -apple-system, Segoe UI, sans-serif;
      background: #f8f9fa;
      color: #202122;
    }
    body { margin: 0; }
    .wiki-layout {
      display: block;
      min-height: 100vh;
      background: #f8f9fa;
    }
    .wiki-main {
      display: flex;
      flex-direction: column;
    }
    .wiki-topbar {
      display: flex;
      align-items: center;
      justify-content: flex-start;
      gap: 12px;
      padding: 12px 20px;
      background: #ffffff;
      border-bottom: 1px solid #a2a9b1;
      position: sticky;
      top: 0;
      z-index: 10;
    }
    .wiki-topbar-title {
      font-size: 18px;
      font-weight: 600;
      color: #202122;
      line-height: 1.2;
      margin: 0;
    }
    .wiki-menu {
      position: relative;
    }
    .wiki-menu summary {
      list-style: none;
      cursor: pointer;
      font-size: 18px;
      padding: 6px 10px;
      border-radius: 4px;
      border: 1px solid #a2a9b1;
      background: #f8f9fa;
    }
    .wiki-menu summary::-webkit-details-marker { display: none; }
    .wiki-menu-links {
      position: absolute;
      top: 100%;
      left: 0;
      z-index: 100;
      display: flex;
      flex-direction: column;
      gap: 6px;
      margin-top: 4px;
      background: #ffffff;
      padding: 12px;
      border-radius: 6px;
      border: 1px solid #a2a9b1;
      min-width: 200px;
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
    }
    .wiki-menu-links a { color: #0645ad; text-decoration: none; }
    .wiki-menu-links a:hover { text-decoration: underline; }
    .wiki-menu-divider { height: 1px; background: #c8ccd1; margin: 4px 0; }
    .wiki-content { padding: 24px 32px 48px; }
    .wiki-article { max-width: 980px; }
    .wiki-article h1, .wiki-article h2, .wiki-article h3 {
      font-family: "Linux Libertine", "Georgia", serif;
      font-weight: 600;
      color: #202122;
    }
    .section {
      margin-bottom: 20px;
      padding-bottom: 12px;
      border-bottom: 1px solid #c8ccd1;
    }
    .portal-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 16px;
    }
    .portal-box {
      background: #ffffff;
      border: 1px solid #a2a9b1;
      border-radius: 6px;
      padding: 12px;
    }
    .infobox {
      float: right;
      width: 280px;
      margin: 0 0 16px 16px;
      border: 1px solid #a2a9b1;
      background: #f8f9fa;
      font-size: 13px;
      border-radius: 6px;
      overflow: hidden;
    }
    .infobox-title {
      background: #eaecf0;
      padding: 8px 10px;
      font-weight: 600;
      text-align: center;
      border-bottom: 1px solid #a2a9b1;
    }
    .infobox-row {
      display: grid;
      grid-template-columns: 100px 1fr;
      gap: 6px;
      padding: 6px 10px;
      border-bottom: 1px solid #c8ccd1;
      align-items: start;
    }
    .infobox-row:last-child { border-bottom: none; }
    .infobox-label { font-weight: 600; color: #54595d; }
    .infobox-value {
      color: #202122;
      min-width: 0;
      word-break: break-word;
      overflow-wrap: anywhere;
    }
    .code {
      background: #f8f9fa;
      border: 1px solid #a2a9b1;
      padding: 12px;
      border-radius: 6px;
      overflow-x: auto;
      font-size: 12px;
    }
    .call-sites { list-style: none; padding: 0; }
    .call-sites li {
      padding: 8px 0;
      border-bottom: 1px solid #eee;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .call-sites li:last-child { border-bottom: none; }
    .call-site-file { font-weight: 500; color: #3366cc; }
    .call-site-context {
      font-family: monospace;
      font-size: 12px;
      background: #f8f9fa;
      padding: 4px 8px;
      border-radius: 3px;
      overflow-x: auto;
      white-space: nowrap;
    }
    .external-import { color: #72777d; font-style: italic; }
    .periodic-table-wrapper { overflow-x: hidden; }
    .periodic-table {
      border-collapse: collapse;
      width: 100%;
      table-layout: fixed;
      background: #fff;
      border: 1px solid #c8ccd1;
    }
    .periodic-table th,
    .periodic-table td {
      border: 1px solid #c8ccd1;
      text-align: center;
      vertical-align: middle;
      padding: 2px;
    }
    .pt-group {
      font-size: 11px;
      font-weight: 600;
      color: #54595d;
      background: #f8f9fa;
      position: sticky;
      top: 0;
      z-index: 1;
    }
    .pt-period,
    .pt-series-label,
    .pt-corner {
      font-size: 11px;
      font-weight: 600;
      color: #54595d;
      background: #f8f9fa;
      width: 44px;
    }
    .pt-cell { background: #ffffff; }
    .pt-link { display: block; text-decoration: none; color: inherit; }
    .pt-atomic { font-size: 9px; color: #54595d; }
    .pt-symbol { font-size: 14px; font-weight: 700; }
    .pt-name { font-size: 8px; color: #54595d; }
    .pt-empty { background: #fafafa; }
    .pt-series { background: #fcfcfc; }
    .cat-alkali-metal { background: #ffe6e6; }
    .cat-alkaline-earth-metal { background: #fff2cc; }
    .cat-transition-metal { background: #e6f0ff; }
    .cat-post-transition-metal { background: #e6f7ff; }
    .cat-metalloid { background: #e6ffe6; }
    .cat-nonmetal { background: #f0f0ff; }
    .cat-halogen { background: #ffe6f2; }
    .cat-noble-gas { background: #f2e6ff; }
    .cat-lanthanide { background: #e6fff7; }
    .cat-actinide { background: #fff0e6; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; }
    .subtitle { color: #54595d; margin-top: -8px; }
    .entity-header { margin-bottom: 16px; }
    @media (max-width: 900px) {
      .wiki-sidebar { display: none; }
      .wiki-content { padding: 20px; }
      .infobox { float: none; width: auto; margin: 0 0 16px 0; }
    }
  `

  await fs.mkdir(path.join(distRoot, 'assets'), { recursive: true })
  await fs.writeFile(path.join(distRoot, 'assets/styles.css'), styles.trim(), 'utf-8')

  const indexContent = `
    <section class="section">
      <h1>Boilingwater Wiki</h1>
      <p>Static knowledge base generated from in-repo data.</p>
    </section>
    <section class="section">
      <div class="portal-grid">
        <div class="portal-box">
          <h3>Substances</h3>
          ${renderList([
            linkTo('entities/elements/index.html', `Elements (${elements.length})`),
            linkTo('entities/compounds/index.html', `Compounds (${compounds.length})`),
            linkTo('entities/solutions/index.html', `Solutions (${solutions.length})`),
            linkTo('entities/phases/index.html', `Phases (${phases.length})`)
          ])}
        </div>
        <div class="portal-box">
          <h3>Experiments</h3>
          ${renderList([
            linkTo('entities/levels/index.html', `Levels (${levels.length})`),
            linkTo('entities/experiments/index.html', `Experiments (${experiments.length})`)
          ])}
        </div>
        <div class="portal-box">
          <h3>Physics</h3>
          ${renderList([
            linkTo('entities/formulas/index.html', `Formulas (${formulas.length})`),
            linkTo('entities/processes/index.html', `Processes (${processes.length})`),
            linkTo('entities/modules/index.html', `Modules (${modules.length})`),
            linkTo('entities/symbols/index.html', `Symbols (${symbols.length})`)
          ])}
        </div>
      </div>
    </section>
  `

  await writePage('index.html', page({ title: 'Boilingwater Wiki', content: indexContent }))

  const elementsTable = renderPeriodicTable(elements)
  await writePage('entities/elements/index.html', page({
    title: 'Elements',
    content: `
      <section class="section">
        ${renderEntityHeader('Elements', 'Periodic Table')}
        <p>Click any element to view detailed properties and data.</p>
        ${elementsTable}
      </section>
    `
  }))

  for (const element of elements) {
    const children = (elementChildren.get(element.slug) || [])
      .map((compound) => linkTo(`entities/compounds/${compound.id}.html`, compound.data.name || compound.id))

    const elementIndex = elements.indexOf(element)
    const prevElement = elements[elementIndex - 1]
    const nextElement = elements[elementIndex + 1]

    const displayName = element.data.name || element.slug
    const displaySymbol = element.data.symbol || element.slug

    const infobox = renderInfobox(displayName, [
      { label: 'Symbol', value: escapeHtml(displaySymbol) },
      { label: 'Atomic #', value: element.data.atomicNumber ? String(element.data.atomicNumber) : '' },
      { label: 'Category', value: element.data.elementCategory ? escapeHtml(element.data.elementCategory) : '' },
      { label: 'Predecessor', value: prevElement ? linkTo(`entities/elements/${prevElement.slug}.html`, prevElement.data.name || prevElement.slug) : '' },
      { label: 'Successor', value: nextElement ? linkTo(`entities/elements/${nextElement.slug}.html`, nextElement.data.name || nextElement.slug) : '' },
      { label: 'Compounds', value: children.length ? renderLinkList(children) : '' }
    ])

    const content = `
      ${infobox}
      <section class="section">
        ${renderEntityHeader(displayName, `Element · ${displaySymbol}`)}
      </section>
      ${renderEducationalSection(element.data.educationalNotes)}
      <section class="section">
        <h2>Raw data</h2>
        ${renderJson(element.data)}
      </section>
    `
    await writePage(`entities/elements/${element.slug}.html`, page({ title: displayName, content }))
  }

  const compoundLinks = compounds.map((compound) => linkTo(`entities/compounds/${compound.id}.html`, compound.id))
  await writePage('entities/compounds/index.html', page({
    title: 'Compounds',
    content: `<section class="section">${renderEntityHeader('Compounds')} ${renderList(compoundLinks)}</section>`
  }))

  for (const compound of compounds) {
    const elementsLinks = (compound.data.elements || []).map((item) => {
      const slug = path.basename(item.reference || '', '.json')
      return linkTo(`entities/elements/${slug}.html`, item.symbol || slug)
    })
    const solutionsUsing = (compoundChildren.get(compound.id) || [])
      .map((solution) => linkTo(`entities/solutions/${solution.id}.html`, solution.data.name || solution.id))
    const compoundPhases = (phasesByCompound.get(compound.id) || [])
      .map((phase) => linkTo(`entities/phases/${phase.slug}.html`, phase.phase))

    const displayName = compound.data.name || compound.id

    const infobox = renderInfobox(displayName, [
      { label: 'Type', value: 'Compound' },
      { label: 'Formula', value: compound.data.chemicalFormula ? escapeHtml(compound.data.chemicalFormula) : '' },
      { label: 'Elements', value: elementsLinks.length ? renderLinkList(elementsLinks) : '' },
      { label: 'Solutions', value: solutionsUsing.length ? renderLinkList(solutionsUsing) : '' },
      { label: 'Phases', value: compoundPhases.length ? renderLinkList(compoundPhases) : '' }
    ])

    const content = `
      ${infobox}
      <section class="section">
        ${renderEntityHeader(displayName, 'Compound')}
      </section>
      ${renderEducationalSection(compound.data.educationalNotes)}
      <section class="section">
        <h2>Raw data</h2>
        ${renderJson(compound.data)}
      </section>
    `
    await writePage(`entities/compounds/${compound.id}.html`, page({ title: displayName, content }))
  }

  const solutionLinks = solutions.map((solution) => linkTo(`entities/solutions/${solution.id}.html`, solution.id))
  await writePage('entities/solutions/index.html', page({
    title: 'Solutions',
    content: `<section class="section">${renderEntityHeader('Solutions')} ${renderList(solutionLinks)}</section>`
  }))

  for (const solution of solutions) {
    const componentLinks = (solution.data.components || []).map((component) => {
      // Try to find compound by component.id first, then by folder name from reference
      const folderId = path.basename(path.dirname(component.reference || ''))
      const compoundByComponentId = compounds.find((c) => c.id === component.id)
      const compoundByFolderId = compounds.find((c) => c.id === folderId)
      const compound = compoundByComponentId || compoundByFolderId
      
      if (compound) {
        return linkTo(`entities/compounds/${compound.id}.html`, component.name || compound.data.name || compound.id)
      }
      // No link for non-existent compounds
      return escapeHtml(component.name || component.id || folderId)
    })
    const solutionPhases = (phasesByCompound.get(solution.id) || [])
      .map((phase) => linkTo(`entities/phases/${phase.slug}.html`, phase.phase))

    const displayName = solution.data.name || solution.id

    const infobox = renderInfobox(displayName, [
      { label: 'Type', value: 'Solution' },
      { label: 'Components', value: componentLinks.length ? renderLinkList(componentLinks) : '' },
      { label: 'Phases', value: solutionPhases.length ? renderLinkList(solutionPhases) : '' }
    ])

    const content = `
      ${infobox}
      <section class="section">
        ${renderEntityHeader(displayName, 'Solution')}
      </section>
      ${renderEducationalSection(solution.data.educationalNotes)}
      <section class="section">
        <h2>Raw data</h2>
        ${renderJson(solution.data)}
      </section>
    `
    await writePage(`entities/solutions/${solution.id}.html`, page({ title: displayName, content }))
  }

  const phaseLinks = phases.map((phase) => linkTo(`entities/phases/${phase.slug}.html`, phase.slug))
  await writePage('entities/phases/index.html', page({
    title: 'Phases',
    content: `<section class="section">${renderEntityHeader('Phases')} ${renderList(phaseLinks)}</section>`
  }))

  for (const phase of phases) {
    const compoundEntry = compounds.find((c) => c.id === phase.compoundId)
    const solutionEntry = solutions.find((c) => c.id === phase.compoundId)
    const compoundData = compoundEntry || solutionEntry
    const compoundName = compoundData?.data?.name || phase.compoundId
    const compoundHref = compoundEntry
      ? `entities/compounds/${phase.compoundId}.html`
      : `entities/solutions/${phase.compoundId}.html`
    const phaseName = phase.data.phaseName || phase.phase
    // Use phaseName only if it's different from phase AND compound name, otherwise use phase
    const hasUniquePhaseName = phaseName !== phase.phase && phaseName.toLowerCase() !== compoundName.toLowerCase()
    const stateLabel = hasUniquePhaseName ? phaseName : phase.phase
    const displayName = `${compoundName} (${stateLabel})`

    const relatedPhases = (phasesByCompound.get(phase.compoundId) || [])
      .filter((item) => item.slug !== phase.slug)
      .map((item) => linkTo(`entities/phases/${item.slug}.html`, item.phase))

    const infobox = renderInfobox(displayName, [
      { label: compoundEntry ? 'Compound' : 'Solution', value: linkTo(compoundHref, compoundName) },
      { label: 'State', value: escapeHtml(phase.phase) },
      { label: 'Name', value: hasUniquePhaseName ? escapeHtml(phaseName) : '' },
      { label: 'Other phases', value: relatedPhases.length ? renderLinkList(relatedPhases) : '' }
    ])
    const content = `
      ${infobox}
      <section class="section">
        ${renderEntityHeader(displayName, 'Phase')}
      </section>
      ${renderEducationalSection(phase.data.educationalNotes)}
      <section class="section">
        <h2>Raw data</h2>
        ${renderJson(phase.data)}
      </section>
    `
    await writePage(`entities/phases/${phase.slug}.html`, page({ title: displayName, content }))
  }

  const levelLinks = levels.map((level) => linkTo(`entities/levels/${level.id}.html`, `${level.name || level.id}`))
  await writePage('entities/levels/index.html', page({
    title: 'Levels',
    content: `<section class="section">${renderEntityHeader('Levels')} ${renderList(levelLinks)}</section>`
  }))

  for (const level of levels) {
    const predecessor = getOrderedSibling(levels, level, -1)
    const successor = getOrderedSibling(levels, level, 1)
    const levelExperiments = experiments
      .filter((experiment) => Number(experiment.level) === Number(level.id))
      .map((experiment) => linkTo(`entities/experiments/${experiment.id}.html`, experiment.name || experiment.id))

    const infobox = renderInfobox(level.name || `Level ${level.id}`, [
      { label: 'Type', value: 'Level' },
      { label: 'Predecessor', value: predecessor ? linkTo(`entities/levels/${predecessor.id}.html`, predecessor.name || predecessor.id) : '' },
      { label: 'Successor', value: successor ? linkTo(`entities/levels/${successor.id}.html`, successor.name || successor.id) : '' },
      { label: 'Children', value: renderLinkList(levelExperiments) }
    ])

    const content = `
      ${infobox}
      <section class="section">
        ${renderEntityHeader(level.name || `Level ${level.id}`, 'Level')}
        <h3>Children (experiments)</h3>
        ${levelExperiments.length ? renderList(levelExperiments) : '<p>No experiments listed.</p>'}
      </section>
      <section class="section">
        <h2>Raw data</h2>
        ${renderJson(level)}
      </section>
    `
    await writePage(`entities/levels/${level.id}.html`, page({ title: level.name || `Level ${level.id}`, content }))
  }

  const experimentLinks = experiments.map((experiment) => linkTo(`entities/experiments/${experiment.id}.html`, experiment.name || experiment.id))
  await writePage('entities/experiments/index.html', page({
    title: 'Experiments',
    content: `<section class="section">${renderEntityHeader('Experiments')} ${renderList(experimentLinks)}</section>`
  }))

  for (const experiment of experiments) {
    const siblings = experiments.filter((item) => Number(item.level) === Number(experiment.level))
    const predecessor = getOrderedSibling(siblings, experiment, -1)
    const successor = getOrderedSibling(siblings, experiment, 1)

    const infobox = renderInfobox(experiment.name || experiment.id, [
      { label: 'Type', value: 'Experiment' },
      { label: 'Parent', value: linkTo(`entities/levels/${experiment.level}.html`, `Level ${experiment.level}`) },
      { label: 'Predecessor', value: predecessor ? linkTo(`entities/experiments/${predecessor.id}.html`, predecessor.name || predecessor.id) : '' },
      { label: 'Successor', value: successor ? linkTo(`entities/experiments/${successor.id}.html`, successor.name || successor.id) : '' }
    ])

    const content = `
      ${infobox}
      <section class="section">
        ${renderEntityHeader(experiment.name || experiment.id, 'Experiment')}
        <h3>Parent (level)</h3>
        <p>${linkTo(`entities/levels/${experiment.level}.html`, `Level ${experiment.level}`)}</p>
      </section>
      <section class="section">
        <h2>Raw data</h2>
        ${renderJson(experiment)}
      </section>
    `
    await writePage(`entities/experiments/${experiment.id}.html`, page({ title: experiment.name || experiment.id, content }))
  }

  // Build symbol name to page map for linking exports
  const symbolPageMap = new Map()
  for (const sym of symbols) {
    symbolPageMap.set(sym.name, `entities/symbols/${sym.name}.html`)
  }

  // Helper to render exports as links to symbol pages
  const renderExportLinks = (exports) => {
    if (!exports.length) return ''
    const items = exports.map((exp) => {
      if (symbolPageMap.has(exp)) {
        return linkTo(symbolPageMap.get(exp), exp)
      }
      return escapeHtml(exp)
    })
    return renderList(items)
  }

  const formulaLinks = formulas.map((formula) => linkTo(`entities/formulas/${formula.slug}.html`, formula.slug))
  await writePage('entities/formulas/index.html', page({
    title: 'Formulas',
    content: `<section class="section">${renderEntityHeader('Formulas')} ${renderList(formulaLinks)}</section>`
  }))

  for (const formula of formulas) {
    const usedByProcesses = (formulaToProcesses.get(formula.slug) || [])
      .map((process) => linkTo(`entities/processes/${process.slug}.html`, process.slug))
    const referencedIn = formula.exports
      .flatMap((name) => Array.from(formulaUsage.get(name) || []))
    const uniqueReferences = Array.from(new Set(referencedIn)).sort()
    const usedInHtml = renderUsedInList(uniqueReferences, fileToWikiEntity)

    const infobox = renderInfobox(formula.slug, [
      { label: 'Type', value: 'Formula' },
      { label: 'Exports', value: renderExportLinks(formula.exports) },
      { label: 'Processes', value: usedByProcesses.length ? renderLinkList(usedByProcesses) : '' },
      { label: 'Used in', value: usedInHtml }
    ])

    const content = `
      ${infobox}
      <section class="section">
        ${renderEntityHeader(formula.slug, 'Formula')}
      </section>
      ${renderEducationalSection(formula.docBlock, true)}
      <section class="section">
        <h2>Source file</h2>
        <p><code>${escapeHtml(path.relative(repoRoot, formula.file))}</code></p>
        <details>
          <summary>View source code</summary>
          <pre class="code">${escapeHtml(formula.content)}</pre>
        </details>
      </section>
    `
    await writePage(`entities/formulas/${formula.slug}.html`, page({ title: formula.slug, content }))
  }

  const processLinks = processes.map((process) => linkTo(`entities/processes/${process.slug}.html`, process.slug))
  await writePage('entities/processes/index.html', page({
    title: 'Processes',
    content: `<section class="section">${renderEntityHeader('Processes')} ${renderList(processLinks)}</section>`
  }))

  for (const process of processes) {
    const usesFormulas = (processToFormulas.get(process.slug) || [])
      .map((formula) => linkTo(`entities/formulas/${formula}.html`, formula))
    const referencedIn = process.exports
      .flatMap((name) => Array.from(processUsage.get(name) || []))
    const uniqueReferences = Array.from(new Set(referencedIn)).sort()
    const usedInHtml = renderUsedInList(uniqueReferences, fileToWikiEntity)

    const infobox = renderInfobox(process.slug, [
      { label: 'Type', value: process.isStub ? 'Process (Stub)' : 'Process' },
      { label: 'Formulas', value: usesFormulas.length ? renderLinkList(usesFormulas) : '' },
      { label: 'Exports', value: renderExportLinks(process.exports) },
      { label: 'Used in', value: usedInHtml }
    ])

    const content = `
      ${infobox}
      <section class="section">
        ${renderEntityHeader(process.slug, process.isStub ? 'Process (Stub)' : 'Process')}
      </section>
      ${renderEducationalSection(process.docBlock, true)}
      <section class="section">
        <h2>Source file</h2>
        <p><code>${escapeHtml(path.relative(repoRoot, process.file))}</code></p>
        <details>
          <summary>View source code</summary>
          <pre class="code">${escapeHtml(process.content)}</pre>
        </details>
      </section>
    `
    await writePage(`entities/processes/${process.slug}.html`, page({ title: process.slug, content }))
  }

  // Build module usage maps
  const moduleUsage = await buildUsageMap(modules.flatMap((m) => m.exports))
  const moduleImportsMap = new Map()
  for (const mod of modules) {
    moduleImportsMap.set(mod.slug, mod.imports)
  }

  const moduleLinks = modules.map((mod) => linkTo(`entities/modules/${mod.slug}.html`, mod.filename))
  await writePage('entities/modules/index.html', page({
    title: 'Modules',
    content: `<section class="section">${renderEntityHeader('Modules', 'Game source files')} ${renderList(moduleLinks)}</section>`
  }))

  for (const mod of modules) {
    // Find which other modules import this one
    const importedBy = modules
      .filter((other) => other.imports.some((imp) => imp.includes(mod.slug) || imp.endsWith(mod.filename.replace(/\.(js|jsx)$/, ''))))
      .map((other) => linkTo(`entities/modules/${other.slug}.html`, other.filename))

    // Resolve relative imports to module slugs
    const resolveImportToSlug = (importPath, fromModuleSlug) => {
      if (!importPath.startsWith('.')) return null
      // Get directory of the importing module
      const fromDir = path.dirname(fromModuleSlug)
      // Resolve the import relative to that directory
      let resolved = path.join(fromDir, importPath).replace(/\\/g, '/')
      // Remove leading slashes and normalize
      resolved = resolved.replace(/^\/+/, '').replace(/\/index$/, '')
      return resolved
    }

    // Find what this module imports (as wiki links where possible)
    const importsHtml = mod.imports
      .map((imp) => {
        // Check if it's a local import
        if (imp.startsWith('.') || imp.startsWith('@/')) {
          const resolved = resolveImportToSlug(imp, mod.slug)
          if (resolved) {
            // Try exact match first
            let matchedMod = modules.find((m) => m.slug === resolved)
            // Try with /index suffix
            if (!matchedMod) matchedMod = modules.find((m) => m.slug === resolved + '/index')
            // Try matching the basename
            if (!matchedMod) {
              const baseName = path.basename(resolved)
              matchedMod = modules.find((m) => m.slug.endsWith('/' + baseName) || m.slug === baseName)
            }
            if (matchedMod) {
              return linkTo(`entities/modules/${matchedMod.slug}.html`, matchedMod.filename)
            }
          }
          // Check formulas - match against formula slugs
          if (imp.includes('formulas/')) {
            const formulaSlug = path.basename(imp, '.js')
            const formula = formulas.find((f) => f.slug === formulaSlug)
            if (formula) return linkTo(`entities/formulas/${formula.slug}.html`, formula.slug)
          }
          // Check processes - match full path after 'processes/'
          if (imp.includes('processes/')) {
            const afterProcesses = imp.split('processes/')[1]
            if (afterProcesses) {
              const processPath = afterProcesses.replace(/\.js$/, '')
              const proc = processes.find((p) => p.slug === processPath || p.slug.endsWith(processPath))
              if (proc) return linkTo(`entities/processes/${proc.slug}.html`, path.basename(proc.slug))
            }
          }
        }
        return `<span class="external-import">${escapeHtml(imp)}</span>`
      })
      .join(', ')

    const referencedIn = mod.exports
      .flatMap((name) => Array.from(moduleUsage.get(name) || []))
    const uniqueReferences = Array.from(new Set(referencedIn)).sort()
    const usedInHtml = renderUsedInList(uniqueReferences, fileToWikiEntity)

    const infobox = renderInfobox(mod.filename, [
      { label: 'Type', value: mod.isComponent ? 'React Component' : 'Module' },
      { label: 'Exports', value: renderExportLinks(mod.exports) },
      { label: 'Imports', value: importsHtml || '' },
      { label: 'Imported by', value: importedBy.length ? renderLinkList(importedBy) : '' },
      { label: 'Used in', value: usedInHtml }
    ])

    const content = `
      ${infobox}
      <section class="section">
        ${renderEntityHeader(mod.filename, mod.isComponent ? 'React Component' : 'Module')}
      </section>
      ${renderEducationalSection(mod.docBlock, true)}
      <section class="section">
        <h2>Source file</h2>
        <p><code>${escapeHtml(path.relative(repoRoot, mod.file))}</code></p>
        <details>
          <summary>View source code</summary>
          <pre class="code">${escapeHtml(mod.content)}</pre>
        </details>
      </section>
    `
    await writePage(`entities/modules/${mod.slug}.html`, page({ title: mod.filename, content }))
  }

  // Symbol index page
  const symbolLinks = symbols.map((sym) => linkTo(`entities/symbols/${sym.name}.html`, sym.name))
  await writePage('entities/symbols/index.html', page({
    title: 'Symbols',
    content: `
      <section class="section">
        ${renderEntityHeader('Symbols', 'Exported functions and constants')}
        <p>${linkTo('entities/reports/orphan-symbols.html', 'View orphan symbols report')}</p>
        ${renderList(symbolLinks)}
      </section>
    `
  }))

  // Orphan symbols report (no re-exports, no imports, no call sites, no internal usage)
  const orphanSymbols = symbols.filter((sym) =>
    sym.reExports.length === 0 &&
    sym.importedBy.length === 0 &&
    sym.callSites.length === 0 &&
    sym.internalUsages.length === 0 &&
    sym.reExportUsages.length === 0
  )

  const orphanLinks = orphanSymbols.map((sym) => linkTo(`entities/symbols/${sym.name}.html`, sym.name))
  await writePage('entities/reports/orphan-symbols.html', page({
    title: 'Orphan Symbols',
    content: `
      <section class="section">
        ${renderEntityHeader('Orphan Symbols', 'Symbols with no exports, re-exports, or usage')}
        <p>Total: ${orphanSymbols.length}</p>
        ${orphanLinks.length ? renderList(orphanLinks) : '<p>None found.</p>'}
      </section>
    `
  }))

  // Helper to pluralize entity type for URLs
  const pluralizeEntityType = (type) => {
    if (type === 'process') return 'processes'
    return type + 's'
  }

  // Individual symbol pages
  for (const sym of symbols) {
    const defLink = sym.definition
      ? linkTo(`entities/${pluralizeEntityType(sym.definition.entityType)}/${sym.definition.entitySlug}.html`, 
          path.basename(sym.definition.file))
      : 'Unknown'

    const reExportLinks = sym.reExports.length
      ? renderList(sym.reExports.map((r) => 
          linkTo(`entities/${pluralizeEntityType(r.entityType)}/${r.entitySlug}.html`, path.basename(r.file))))
      : ''

    const importedByLinks = sym.importedBy.length
      ? renderList(sym.importedBy.map((i) => {
          const entity = fileToWikiEntity.get(i.file)
          if (entity) {
            return linkTo(entity.href, entity.label)
          }
          return escapeHtml(i.file)
        }))
      : ''

    const callSitesList = sym.callSites.length
      ? `<ul class="call-sites">${sym.callSites.slice(0, 20).map((site) => {
          const entity = fileToWikiEntity.get(site.file)
          const fileLabel = entity ? entity.label : path.basename(site.file)
          const fileLink = entity
            ? linkTo(entity.href, fileLabel)
            : escapeHtml(fileLabel)
          return `<li>
            <span class="call-site-file">${fileLink}#L${site.line}</span>
            <code class="call-site-context">${escapeHtml(site.context)}</code>
          </li>`
        }).join('')}${sym.callSites.length > 20 ? `<li>...and ${sym.callSites.length - 20} more</li>` : ''}</ul>`
      : ''

    const internalItems = []

    if (sym.internalUsages.length) {
      const defLabel = sym.definition ? path.basename(sym.definition.file) : 'Definition'
      const defLink = sym.definition
        ? linkTo(`entities/${pluralizeEntityType(sym.definition.entityType)}/${sym.definition.entitySlug}.html`, defLabel)
        : escapeHtml(defLabel)

      for (const site of sym.internalUsages.slice(0, 10)) {
        internalItems.push(`
          <li>
            <span class=\"call-site-file\">${defLink}#L${site.line}</span>
            <code class=\"call-site-context\">${escapeHtml(site.context)}</code>
          </li>
        `)
      }
      if (sym.internalUsages.length > 10) {
        internalItems.push(`<li>...and ${sym.internalUsages.length - 10} more</li>`)
      }
    }

    if (sym.reExportUsages.length) {
      for (const re of sym.reExportUsages) {
        const reLabel = path.basename(re.file)
        const reLink = linkTo(`entities/${pluralizeEntityType(re.entityType)}/${re.entitySlug}.html`, reLabel)
        for (const site of re.lines.slice(0, 5)) {
          internalItems.push(`
            <li>
              <span class=\"call-site-file\">${reLink}#L${site.line}</span>
              <code class=\"call-site-context\">${escapeHtml(site.context)} (re-export)</code>
            </li>
          `)
        }
      }
    }

    const internalUsageList = internalItems.length
      ? `<ul class=\"call-sites\">${internalItems.join('')}</ul>`
      : ''

    const infobox = renderInfobox(sym.name, [
      { label: 'Type', value: 'Symbol' },
      { label: 'Defined in', value: defLink },
      { label: 'Re-exported by', value: reExportLinks },
      { label: 'Imported by', value: importedByLinks },
      { label: 'Internal usage', value: internalUsageList || '' }
    ])

    const content = `
      ${infobox}
      <section class="section">
        ${renderEntityHeader(sym.name, 'Exported Symbol')}
      </section>
      <section class="section">
        <h2>${sym.callSites.length ? `Call Sites (${sym.callSites.length})` : `Internal Usage (${sym.internalUsages.length})`}</h2>
        ${sym.callSites.length ? callSitesList : (internalUsageList || '<p>No usage found.</p>')}
      </section>
    `
    await writePage(`entities/symbols/${sym.name}.html`, page({ title: sym.name, content }))
  }

  await writeCache({
    hash: newHash,
    builtAt: new Date().toISOString(),
    inputs: inputFiles
  })

  console.log('Wiki: build complete.')
}

build().catch((error) => {
  console.error('Wiki: build failed', error)
  process.exitCode = 1
})
