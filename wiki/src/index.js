import fs from 'fs/promises'
import path from 'path'
import crypto from 'crypto'
import { fileURLToPath, pathToFileURL } from 'url'
import { globSync } from 'glob'
import { 
  detectScriptUsage,
  findOrphanElements,
  findOrphanCompounds,
  findOrphanLevels,
  findOrphanExperiments,
  findOrphanFormulas,
  findOrphanProcesses,
  findOrphanModules,
  findOrphanPublicFiles,
  findOrphanSymbols,
  generateOrphanReports
} from './orphanDetection.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '..', '..')
const wikiRoot = path.resolve(repoRoot, 'wiki')
const distRoot = path.join(wikiRoot, 'dist')
const cacheDir = path.join(wikiRoot, '.cache')
const cacheFile = path.join(cacheDir, 'build.json')

const basePath = process.env.WIKI_BASE_PATH || '/wiki'

const inputGlobs = [
  'wiki/src/**/*.js',
  'src/data/substances/periodic-table/*.json',
  'src/data/substances/compounds/pure/*/info.json',
  'src/data/substances/compounds/solutions/*/info.json',
  'src/data/substances/compounds/**/state.json',
  'src/constants/workshops.js',
  'src/utils/physics/**/*.{js,jsx}',
  'src/**/*.{js,jsx,ts,tsx,css,md,json,mjs,cjs}',
  'docs/**/*.{js,jsx,ts,tsx,css,md,json,mjs,cjs}',
  'scripts/**/*.{js,jsx,ts,tsx,css,md,json,mjs,cjs}',
  'public/**/*.{js,css,md,json,mjs,cjs}',
  '*.{js,jsx,ts,tsx,css,md,json,mjs,cjs}'
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
  path.resolve(repoRoot, 'src'),
  path.resolve(repoRoot, 'docs'),
  path.resolve(repoRoot, 'scripts'),
  path.resolve(repoRoot, 'public')
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

const page = ({ title, content, breadcrumbs = [], toc = [] }) => `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)} - Boiling Water Wiki</title>
  <link rel="stylesheet" href="${withBase('assets/styles.css')}" />
  <!-- Kekule CSS loaded lazily when molecule viewer is needed -->
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/prismjs@1.29.0/themes/prism.min.css" />
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/prismjs@1.29.0/plugins/line-numbers/prism-line-numbers.min.css" />
</head>
<body>
  <div class="wiki-layout">
    <div class="wiki-main">
      <header class="wiki-topbar">
        <details class="wiki-menu" aria-label="Menu">
          <summary>☰ Menu</summary>
          <nav class="wiki-menu-links">
            <div class="menu-section">
              <div class="menu-heading">Main</div>
              <a href="${withBase('index.html')}">📚 Main page</a>
            </div>
            <div class="menu-section">
              <div class="menu-heading">Science</div>
              <a href="${withBase('entities/elements/index.html')}">⚛️ Elements</a>
              <a href="${withBase('entities/compounds/index.html')}">🧪 Compounds</a>
              <a href="${withBase('entities/solutions/index.html')}">💧 Solutions</a>
              <a href="${withBase('entities/phases/index.html')}">❄️ Phases</a>
            </div>
            <div class="menu-section">
              <div class="menu-heading">Game Structure</div>
              <a href="${withBase('entities/levels/index.html')}">📊 Levels</a>
              <a href="${withBase('entities/experiments/index.html')}">🔬 Experiments</a>
            </div>
            <div class="menu-section">
              <div class="menu-heading">Code Reference</div>
              <a href="${withBase('entities/formulas/index.html')}">📐 Formulas</a>
              <a href="${withBase('entities/processes/index.html')}">⚙️ Processes</a>
              <a href="${withBase('entities/modules/index.html')}">📦 Modules</a>
              <a href="${withBase('entities/symbols/index.html')}">🔣 Symbols</a>
              <a href="${withBase('entities/public/index.html')}">📁 Public Files</a>
              <a href="${withBase('entities/assets/index.html')}">🖼️ Assets</a>
            </div>
            <div class="menu-section">
              <div class="menu-heading">Repository</div>
              <a href="${withBase('entities/docs/index.html')}">📖 Docs</a>
              <a href="${withBase('entities/scripts/index.html')}">🧰 Scripts</a>
              <a href="${withBase('entities/styles/index.html')}">🎨 Styles</a>
              <a href="${withBase('entities/root-files/index.html')}">🗂️ Root Files</a>
            </div>
            <div class="wiki-menu-divider"></div>
            <a href="/">⬅️ Back to Game</a>
          </nav>
        </details>
        ${breadcrumbs.length > 0 ? `
        <nav class="breadcrumbs" aria-label="Breadcrumb">
          ${breadcrumbs.map((crumb, i) => 
            i < breadcrumbs.length - 1 
              ? `<a href="${withBase(crumb.href)}">${escapeHtml(crumb.label)}</a>` 
              : `<span>${escapeHtml(crumb.label)}</span>`
          ).join(' <span class="breadcrumb-sep">›</span> ')}
        </nav>` : ''}
        <div class="wiki-topbar-title">${escapeHtml(title)}</div>
      </header>
      <main class="wiki-content">
        ${toc.length > 0 ? `
        <aside class="toc">
          <div class="toc-title">Contents</div>
          <nav class="toc-list">
            ${toc.map((item) => `<a href="#${item.id}" class="toc-item toc-level-${item.level}">${escapeHtml(item.title)}</a>`).join('')}
          </nav>
        </aside>` : ''}
        <article class="wiki-article">
          ${content}
        </article>
      </main>
    </div>
  </div>
  <script src="https://cdn.jsdelivr.net/npm/prismjs@1.29.0/prism.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/prismjs@1.29.0/plugins/line-numbers/prism-line-numbers.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/prismjs@1.29.0/components/prism-javascript.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/prismjs@1.29.0/components/prism-jsx.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/prismjs@1.29.0/components/prism-tsx.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/prismjs@1.29.0/components/prism-css.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/prismjs@1.29.0/components/prism-json.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/prismjs@1.29.0/components/prism-markdown.min.js"></script>
  <script>
    // Lazy-load Kekule only when molecule viewer is expanded (saves bandwidth on low-end devices)
    (() => {
      let smilesDrawerLoaded = false
      let smilesDrawerLoading = false
      
      // Convert explicit SMILES like [CH3][CH](OH)[CH3] to standard like CC(O)C
      const explicitToStandard = (smiles) => {
        return smiles
          // Common organic groups - order matters (longer patterns first)
          .replace(/\\[CH3\\]/g, 'C')
          .replace(/\\[CH2\\]/g, 'C')
          .replace(/\\[CH\\]/g, 'C')
          .replace(/\\[OH\\]/g, 'O')
          .replace(/\\[NH2\\]/g, 'N')
          .replace(/\\[NH\\]/g, 'N')
          .replace(/\\[SH\\]/g, 'S')
          // Single atoms in brackets (keep aromatic lowercase)
          .replace(/\\[C\\]/g, 'C')
          .replace(/\\[N\\]/g, 'N')
          .replace(/\\[O\\]/g, 'O')
          .replace(/\\[S\\]/g, 'S')
          .replace(/\\[P\\]/g, 'P')
          .replace(/\\[F\\]/g, 'F')
          .replace(/\\[Cl\\]/g, 'Cl')
          .replace(/\\[Br\\]/g, 'Br')
          .replace(/\\[I\\]/g, 'I')
          // Bare atoms in branches - H is implicit in standard SMILES
          .replace(/\\(OH\\)/g, '(O)')
          .replace(/\\(NH2\\)/g, '(N)')
          .replace(/\\(NH\\)/g, '(N)')
          .replace(/\\(SH\\)/g, '(S)')
      }
      
      const loadSmilesDrawer = async () => {
        if (smilesDrawerLoaded) return
        if (smilesDrawerLoading) {
          return new Promise(resolve => {
            const check = setInterval(() => {
              if (smilesDrawerLoaded) { clearInterval(check); resolve() }
            }, 50)
          })
        }
        smilesDrawerLoading = true
        
        // Load SmilesDrawer from CDN (much simpler than Kekule)
        await new Promise((resolve, reject) => {
          const script = document.createElement('script')
          script.src = 'https://unpkg.com/smiles-drawer@2.1.7/dist/smiles-drawer.min.js'
          script.onload = resolve
          script.onerror = reject
          document.body.appendChild(script)
        })
        
        smilesDrawerLoaded = true
        smilesDrawerLoading = false
      }
      
      const initMolecule = async (node) => {
        if (node.dataset.initialized) return
        node.dataset.initialized = 'true'
        
        const rawSmiles = node.getAttribute('data-smiles')
        if (!rawSmiles) return
        
        // Convert explicit format to standard if needed
        const smiles = explicitToStandard(rawSmiles)
        
        try {
          await loadSmilesDrawer()
          
          const drawer = new SmilesDrawer.SvgDrawer({ 
            width: 300, 
            height: 200,
            explicitHydrogens: true,
            terminalCarbons: true,
            compactDrawing: false
          })
          
          console.log('Parsing SMILES:', rawSmiles, '->', smiles)
          SmilesDrawer.parse(smiles, (tree) => {
            console.log('Parse success, tree:', tree)
            const svgElement = drawer.draw(tree, null, 'light')
            console.log('SVG element:', svgElement)
            node.innerHTML = ''
            node.appendChild(svgElement)
          }, (err) => {
            console.error('SMILES parse error for "' + smiles + '":', err)
            node.innerHTML = '<code>' + rawSmiles + '</code>'
          })
        } catch (err) {
          console.error('SmilesDrawer load error:', err)
          node.innerHTML = '<code>' + smiles + '</code>'
        }
      }
      
      // Use IntersectionObserver for lazy loading when scrolled into view
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            initMolecule(entry.target)
            observer.unobserve(entry.target)
          }
        })
      }, { rootMargin: '100px' })
      
      // Also handle <details> expansion for molecules inside collapsed sections
      document.addEventListener('toggle', (e) => {
        if (e.target.tagName === 'DETAILS' && e.target.open) {
          const molecules = e.target.querySelectorAll('[data-smiles]:not([data-initialized])')
          molecules.forEach(node => initMolecule(node))
        }
      }, true)
      
      // Observe all molecule nodes
      const init = () => {
        const nodes = document.querySelectorAll('[data-smiles]')
        nodes.forEach(node => observer.observe(node))
      }
      
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init)
      } else {
        init()
      }
    })()
  </script>
</body>
</html>`

const writePage = async (relativePath, html) => {
  const fullPath = path.join(distRoot, relativePath)
  await fs.mkdir(path.dirname(fullPath), { recursive: true })
  await fs.writeFile(fullPath, html, 'utf-8')
}

const renderJson = (data) => {
  const jsonStr = JSON.stringify(data, null, 2)
  return `<pre class="line-numbers"><code class="language-json">${escapeHtml(jsonStr)}</code></pre>`
}

const renderCodeBlock = (code, language = 'javascript') => {
  return `<pre class="line-numbers"><code class="language-${language}">${escapeHtml(code)}</code></pre>`
}

const generateToc = (sections) => {
  return sections.filter((s) => s.title).map((section) => ({
    id: section.id || section.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    title: section.title,
    level: section.level || 2
  }))
}

const renderCodeSnippet = (code, description, title = 'Code Example') => {
  return `<details class="code-snippet" open>
    <summary class="code-snippet-title">${escapeHtml(title)}</summary>
    ${description ? `<p class="code-description">${escapeHtml(description)}</p>` : ''}
    ${renderCodeBlock(code)}
  </details>`
}

const renderList = (items) => `<ul>${items.map((item) => `<li>${item}</li>`).join('')}</ul>`

const renderAssetTree = (assets) => {
  if (!assets.length) return '<p>No assets referenced.</p>'

  const groups = new Map()
  for (const asset of assets) {
    const parts = asset.assetPath.split('/').filter(Boolean)
    const group = parts[0] || 'root'
    const subgroup = parts[1] || null
    if (!groups.has(group)) groups.set(group, new Map())
    const subMap = groups.get(group)
    const key = subgroup || '__root__'
    if (!subMap.has(key)) subMap.set(key, [])
    subMap.get(key).push(asset)
  }

  const sections = []
  for (const [group, subMap] of groups) {
    const rows = []
    for (const [sub, items] of subMap) {
      const links = items.map((asset) => linkTo(`entities/assets/${asset.assetPath}.html`, asset.publicPath))
      if (sub === '__root__') {
        rows.push(renderList(links))
      } else {
        rows.push(`<h4>${escapeHtml(sub)}</h4>${renderList(links)}`)
      }
    }
    sections.push(`<section class="section"><h3>${escapeHtml(group)}</h3>${rows.join('')}</section>`)
  }

  return sections.join('')
}

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

const getEducationalNotes = (data) => {
  if (!data) return ''
  return (
    data.educationalNotes ||
    data.educationNotes ||
    data.educationalNote ||
    data.notes ||
    data.physicalProperties?.notes ||
    ''
  )
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
  const files = new Set()
  const patterns = [
    'src/**/*.{js,jsx,ts,tsx,css,md,json,mjs,cjs}',
    'docs/**/*.{js,jsx,ts,tsx,css,md,json,mjs,cjs}',
    'scripts/**/*.{js,jsx,ts,tsx,css,md,json,mjs,cjs}',
    'public/**/*.{js,css,md,json,mjs,cjs}',
    '*.{js,jsx,ts,tsx,css,md,json,mjs,cjs}'
  ]

  for (const pattern of patterns) {
    for (const file of globSync(pattern, {
      cwd: repoRoot,
      absolute: true,
      ignore: [
        'src/generated/**',
        'src/utils/physics/formulas/**',
        'src/utils/physics/processes/**',
        'wiki/**',
        'public/wiki/**',
        'node_modules/**',
        'dist/**',
        'build/**',
        '.git/**'
      ]
    })) {
      files.add(file)
    }
  }

  const modules = []
  for (const file of files) {
    const content = await fs.readFile(file, 'utf-8')
    const relative = path.relative(repoRoot, file)
    const slug = relative.replace(/\\/g, '/').replace(/\.(js|jsx|ts|tsx|css|md|json|mjs|cjs)$/, '')
    const isCode = /\.(js|jsx|ts|tsx)$/.test(file)
    modules.push({
      slug,
      file,
      filename: path.basename(file),
      summary: isCode ? extractDocSummary(content) : '',
      docBlock: isCode ? extractDocBlock(content) : '',
      exports: isCode ? parseExports(content) : [],
      imports: isCode ? parseImports(content) : [],
      content,
      isComponent: /\.(jsx|tsx)$/.test(file),
      fileType: path.extname(file).replace('.', '').toLowerCase()
    })
  }
  return modules.sort((a, b) => a.slug.localeCompare(b.slug))
}

const buildPublicFiles = async () => {
  const files = globSync('public/assets/workshops/**/*.json', {
    cwd: repoRoot,
    absolute: true,
    ignore: ['public/wiki/**']
  })

  const publicFiles = []
  for (const file of files) {
    const content = await fs.readFile(file, 'utf-8')
    const relative = path.relative(path.join(repoRoot, 'public'), file)
    const slug = relative.replace(/\\/g, '/').replace(/\.json$/, '')
    const parts = slug.split('/')
    const workshopIndex = parts.indexOf('workshops')
    const workshopId = workshopIndex >= 0 ? parts[workshopIndex + 1] : null
    const category = workshopIndex >= 0 ? parts[workshopIndex + 2] || 'workshop' : 'public'
    publicFiles.push({
      slug,
      file,
      filename: path.basename(file),
      content,
      workshopId,
      category
    })
  }

  return publicFiles.sort((a, b) => a.slug.localeCompare(b.slug))
}

const buildAssets = async (modules, publicFiles) => {
  const assetsMap = new Map()
  const assetRegex = /(?:url\(|['"`])\s*(\/assets\/[^'"`)\s]+)(?:['"`]\s*\)?)/g
  const publicFileMap = new Map(publicFiles.map((file) => [file.file, file]))

  const addAsset = async (publicPath, source) => {
    if (!publicPath || publicPath.includes('${')) return
    const normalized = publicPath.split(/[?#]/)[0]
    const assetPath = normalized.replace(/^\/?assets\//, '')
    if (!assetPath) return
    const filePath = path.join(repoRoot, 'public', 'assets', assetPath)
    if (!assetsMap.has(normalized)) {
      let stats = null
      try {
        stats = await fs.stat(filePath)
      } catch {
        stats = null
      }
      assetsMap.set(normalized, {
        publicPath: normalized,
        assetPath,
        filePath,
        exists: Boolean(stats),
        size: stats?.size || 0,
        references: new Set()
      })
    }
    if (source) {
      assetsMap.get(normalized).references.add(source)
    }
  }

  const collectFromJson = async (value, sourceLabel, key) => {
    if (typeof value === 'string') {
      const trimmed = value.trim()
      if (trimmed.includes('${')) return
      if (trimmed.startsWith('/assets/')) {
        await addAsset(trimmed, sourceLabel)
      }
      return
    }
    if (Array.isArray(value)) {
      for (const item of value) {
        await collectFromJson(item, sourceLabel)
      }
      return
    }
    if (value && typeof value === 'object') {
      for (const [childKey, item] of Object.entries(value)) {
        if (childKey.startsWith('_')) continue
        await collectFromJson(item, sourceLabel, childKey)
      }
    }
  }

  // Scan src module content
  for (const mod of modules) {
    if (!mod.content) continue
    let match
    while ((match = assetRegex.exec(mod.content)) !== null) {
      const rawPublicPath = match[1]
      await addAsset(rawPublicPath, mod)
    }
  }

  // Scan public workshop JSON files (static asset paths)
  for (const file of publicFiles) {
    try {
      const data = JSON.parse(file.content)
      const sourceLabel = publicFileMap.get(file.file) || {
        slug: path.relative(repoRoot, file.file).replace(/\\/g, '/'),
        filename: file.filename,
        type: 'public'
      }
      await collectFromJson(data, sourceLabel)
    } catch {
      // ignore JSON parse errors
    }
  }

  return Array.from(assetsMap.values()).sort((a, b) => a.publicPath.localeCompare(b.publicPath))
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
  for (const mod of modules.filter((item) => item.file.startsWith(path.join(repoRoot, 'src')))) {
    const isBarrelFile = mod.slug === 'src/utils/physics/index' || mod.filename === 'index.js'
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

const titleCase = (value) => value
  ? value.charAt(0).toUpperCase() + value.slice(1).toLowerCase()
  : ''

const getSmilesString = (data) => {
  if (!data) return ''
  return data.smiles || data.explicitSmiles || data.SMILES || ''
}

const renderMoleculeViewer = (smiles, label = 'Structure') => {
  if (!smiles) {
    return `
      <section class="section">
        <h2>${escapeHtml(label)}</h2>
        <p>No SMILES data available.</p>
      </section>
    `
  }
  return `
    <section class="section">
      <h2>${escapeHtml(label)}</h2>
      <div class="molecule-viewer" data-smiles="${escapeHtml(smiles)}"></div>
    </section>
  `
}

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

const readOptionalJson = async (relativePath, fallback = null) => {
  try {
    const fullPath = path.join(repoRoot, relativePath)
    const raw = await fs.readFile(fullPath, 'utf-8')
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

const copyIfExists = async (source, destination) => {
  try {
    await fs.access(source)
    await fs.mkdir(path.dirname(destination), { recursive: true })
    await fs.copyFile(source, destination)
    return true
  } catch {
    return false
  }
}

const copyFirstExisting = async (sources, destination) => {
  for (const source of sources) {
    if (await copyIfExists(source, destination)) {
      return source
    }
  }
  return null
}

const copyKekuleAssets = async () => {
  const targetDir = path.join(distRoot, 'assets', 'kekule')
  const jsCandidates = [
    path.join(repoRoot, 'node_modules', 'kekule', 'dist', 'kekule.min.js'),
    path.join(repoRoot, 'node_modules', 'kekule', 'dist', 'kekule.js')
  ]
  const cssCandidates = [
    path.join(repoRoot, 'node_modules', 'kekule', 'dist', 'themes', 'default', 'kekule.css'),
    path.join(repoRoot, 'node_modules', 'kekule', 'dist', 'themes', 'default', 'kekule.min.css'),
    path.join(repoRoot, 'node_modules', 'kekule', 'dist', 'kekule.css'),
    path.join(repoRoot, 'node_modules', 'kekule', 'dist', 'kekule.min.css')
  ]

  const jsCopied = await copyFirstExisting(jsCandidates, path.join(targetDir, 'kekule.min.js'))
  const cssCopied = await copyFirstExisting(cssCandidates, path.join(targetDir, 'kekule.min.css'))
  return { jsCopied, cssCopied }
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

  await fs.rm(distRoot, { recursive: true, force: true })

  await copyKekuleAssets()

  const elements = await buildElements()
  const compounds = await buildCompounds('pure')
  const solutions = await buildCompounds('solutions')
  const phases = await buildPhases()
  const phasesOverview = await readOptionalJson('src/data/substances/phases.json', null)
  const { levels, experiments } = await buildLevelsAndExperiments()
  const formulas = await buildFormulas()
  const processes = await buildProcesses()
  const modules = await buildModules()
  const publicFiles = await buildPublicFiles()
  const assets = await buildAssets(modules, publicFiles)
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
  for (const pubFile of publicFiles) {
    const relPath = path.relative(repoRoot, pubFile.file).replace(/\\/g, '/')
    fileToWikiEntity.set(relPath, {
      type: 'public',
      slug: pubFile.slug,
      href: `entities/public/${pubFile.slug}.html`,
      label: pubFile.filename
    })
  }
  for (const asset of assets) {
    const assetKey = `public${asset.publicPath}`
    fileToWikiEntity.set(assetKey, {
      type: 'asset',
      slug: asset.assetPath,
      href: `entities/assets/${asset.assetPath}.html`,
      label: asset.publicPath
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
    .data-table {
      width: 100%;
      border-collapse: collapse;
      margin: 16px 0;
      font-size: 14px;
    }
    .data-table th,
    .data-table td {
      padding: 10px 12px;
      text-align: left;
      border-bottom: 1px solid #c8ccd1;
    }
    .data-table th {
      background: #f8f9fa;
      font-weight: 600;
      color: #202122;
    }
    .data-table tr:hover {
      background: #f8f9fa;
    }
    .data-table a {
      color: #3366cc;
      text-decoration: none;
    }
    .data-table a:hover {
      text-decoration: underline;
    }
    .subtitle { color: #54595d; margin-top: -8px; }
    .entity-header { margin-bottom: 16px; }
    .molecule-representations {
      display: flex;
      gap: 20px;
      flex-wrap: wrap;
    }
    .molecule-flat, .molecule-2d {
      flex: 1;
      min-width: 250px;
    }
    .molecule-flat h3, .molecule-2d h3 {
      font-size: 14px;
      color: #54595d;
      margin-bottom: 8px;
    }
    .molecule-formula {
      display: block;
      font-size: 18px;
      padding: 20px;
      background: #f8f9fa;
      border: 1px solid #c8ccd1;
      border-radius: 6px;
      text-align: center;
      min-height: 180px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .molecule-viewer {
      width: 100%;
      min-height: 220px;
      border: 1px solid #c8ccd1;
      border-radius: 6px;
      background: #f8f9fa;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 8px;
    }
    .molecule-meta { color: #54595d; font-size: 13px; }
    .molecule-fallback {
      font-family: monospace;
      font-size: 12px;
      color: #54595d;
    }
    @media (max-width: 900px) {
      .wiki-sidebar { display: none; }
      .wiki-content { padding: 20px; }
      .infobox { float: none; width: auto; margin: 0 0 16px 0; }
    }
  `

  await fs.mkdir(path.join(distRoot, 'assets'), { recursive: true })
  await fs.writeFile(path.join(distRoot, 'assets/styles.css'), styles.trim(), 'utf-8')

  const publicWorkshopIds = new Set(publicFiles.filter((file) => file.workshopId).map((file) => file.workshopId))
  const publicCounts = {
    workshops: publicWorkshopIds.size,
    burners: publicFiles.filter((file) => file.category === 'burners').length,
    acUnits: publicFiles.filter((file) => file.category === 'ac-units').length,
    airHandlers: publicFiles.filter((file) => file.category === 'air-handlers').length
  }

  const docsModules = modules.filter((mod) => mod.slug.startsWith('docs/'))
  const scriptModules = modules.filter((mod) => mod.slug.startsWith('scripts/'))
  const styleModules = modules.filter((mod) => mod.slug.startsWith('src/styles/'))
  const rootModules = modules.filter((mod) => !mod.slug.includes('/'))

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
          <h3>Utils</h3>
          ${renderList([
            linkTo('entities/formulas/index.html', `Formulas (${formulas.length})`),
            linkTo('entities/processes/index.html', `Processes (${processes.length})`),
            linkTo('entities/modules/index.html', `Modules (${modules.length})`),
            linkTo('entities/symbols/index.html', `Symbols (${symbols.length})`)
          ])}
        </div>
        <div class="portal-box">
          <h3>Public Files</h3>
          ${renderList([
            linkTo('entities/public/index.html', `Workshops (${publicCounts.workshops})`),
            linkTo('entities/public/burners/index.html', `Burners (${publicCounts.burners})`),
            linkTo('entities/public/ac-units/index.html', `AC Units (${publicCounts.acUnits})`),
            linkTo('entities/public/air-handlers/index.html', `Air Handlers (${publicCounts.airHandlers})`)
          ])}
        </div>
        <div class="portal-box">
          <h3>Repository</h3>
          ${renderList([
            linkTo('entities/docs/index.html', `Docs (${docsModules.length})`),
            linkTo('entities/scripts/index.html', `Scripts (${scriptModules.length})`),
            linkTo('entities/styles/index.html', `Styles (${styleModules.length})`),
            linkTo('entities/root-files/index.html', `Root Files (${rootModules.length})`)
          ])}
        </div>
      </div>
    </section>
  `

  await writePage('index.html', page({ title: 'Boilingwater Wiki', content: indexContent }))
  await writePage('404.html', page({
    title: 'Wiki: Not Found',
    content: `
      <section class="section">
        ${renderEntityHeader('Page not found', 'The wiki page you requested does not exist.')}
        <p>Try the <a href="${withBase('index.html')}">wiki home page</a> or use the menu to navigate.</p>
      </section>
    `
  }))

  const moduleLinkList = (items, labelOverride) => items
    .sort((a, b) => a.slug.localeCompare(b.slug))
    .map((mod) => linkTo(`entities/modules/${mod.slug}.html`, labelOverride ? labelOverride(mod) : mod.slug))

  await writePage('entities/docs/index.html', page({
    title: 'Docs',
    content: `
      <section class="section">
        ${renderEntityHeader('Docs', 'Repository documentation and guides')}
        <p>${linkTo('entities/reports/orphan-docs.html', 'View orphan docs report')}</p>
        ${docsModules.length ? renderList(moduleLinkList(docsModules, (mod) => mod.slug.replace(/^docs\//, ''))) : '<p>No docs found.</p>'}
      </section>
    `
  }))

  // Load script metadata for dependency visualization
  let scriptMetadata = {}
  try {
    const metadataPath = path.join(repoRoot, 'scripts', 'metadata.json')
    const metadataContent = await fs.readFile(metadataPath, 'utf-8')
    scriptMetadata = JSON.parse(metadataContent).scripts || {}
  } catch (err) {
    console.warn('⚠️  Could not load scripts/metadata.json:', err.message)
  }

  // Script relationship tracking (for orphan/pass-through detection)
  const scriptDependents = new Map() // script -> [scripts that depend on it]
  const scriptDependencies = new Map() // script -> [scripts it depends on]

  // Build script dependency relationships (using scriptMetadata just loaded)
  for (const [scriptName, scriptMeta] of Object.entries(scriptMetadata)) {
    if (!scriptDependents.has(scriptName)) scriptDependents.set(scriptName, [])
    if (!scriptDependencies.has(scriptName)) scriptDependencies.set(scriptName, [])

    const deps = scriptMeta.dependencies || []
    for (const dep of deps) {
      const depName = dep.replace(/\.js$/, '')
      if (!scriptDependents.has(depName)) scriptDependents.set(depName, [])
      scriptDependents.get(depName).push(scriptName)
      scriptDependencies.get(scriptName).push(depName)
    }
  }

  const scriptDependencyGraph = `
    <div style="background: #f5f5f5; padding: 16px; border-radius: 6px; margin-bottom: 16px; font-family: monospace; font-size: 12px; line-height: 1.6; white-space: pre-wrap; overflow-x: auto;">
fetch-elements-from-api.js (LIVE API)
    ↓ (fallback if fails)
generate-all-118.js (HARDCODED)
    ↓ (both generate element JSONs)
add-diffusion-volumes.js (Adds Σv constants)
    ↓
update-educational-notes.js (Adds descriptions)
    ↓
generateSubstanceCatalog.js (BUILD TIME - indexes all)
    </div>
  `

  await writePage('entities/scripts/index.html', page({
    title: 'Scripts',
    content: `
      <section class="section">
        ${renderEntityHeader('Scripts', 'Build automation, data generation, and tooling')}
        <p>${linkTo('entities/reports/orphan-scripts.html', 'View orphan scripts report')}</p>
        
        <h3>Dependency Pipeline</h3>
        ${scriptDependencyGraph}
        
        ${scriptModules.length ? renderList(moduleLinkList(scriptModules, (mod) => mod.slug.replace(/^scripts\//, ''))) : '<p>No scripts found.</p>'}
      </section>
    `
  }))

  await writePage('entities/styles/index.html', page({
    title: 'Styles',
    content: `
      <section class="section">
        ${renderEntityHeader('Styles', 'CSS and styling resources')}
        <p>${linkTo('entities/reports/orphan-styles.html', 'View orphan styles report')}</p>
        ${styleModules.length ? renderList(moduleLinkList(styleModules, (mod) => mod.slug.replace(/^src\//, ''))) : '<p>No styles found.</p>'}
      </section>
    `
  }))

  await writePage('entities/root-files/index.html', page({
    title: 'Root Files',
    content: `
      <section class="section">
        ${renderEntityHeader('Root Files', 'Top-level repository files')}
        <p>${linkTo('entities/reports/orphan-root-files.html', 'View orphan root files report')}</p>
        ${rootModules.length ? renderList(moduleLinkList(rootModules)) : '<p>No root files found.</p>'}
      </section>
    `
  }))

  const elementsTable = renderPeriodicTable(elements)
  
  // Orphan elements report (elements not used in any compound)
  const orphanElements = findOrphanElements(elements, elementChildren)
  const orphanElementLinks = orphanElements.map((e) => linkTo(`entities/elements/${e.slug}.html`, e.data.name || e.slug))
  
  await writePage('entities/elements/index.html', page({
    title: 'Elements',
    content: `
      <section class="section">
        ${renderEntityHeader('Elements', 'Periodic Table')}
        <p>Click any element to view detailed properties and data.</p>
        <p>${linkTo('entities/reports/orphan-elements.html', '⚠️ View unused elements report')} (${orphanElements.length} unused)</p>
        ${elementsTable}
      </section>
    `
  }))
  
  await writePage('entities/reports/orphan-elements.html', page({
    title: 'Unused Elements',
    content: `
      <section class="section">
        ${renderEntityHeader('Unused Elements', 'Elements not referenced in any compound')}
        <p>Total: ${orphanElements.length}</p>
        ${orphanElementLinks.length ? renderList(orphanElementLinks) : '<p>✅ All elements are used in compounds!</p>'}
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
      ${renderEducationalSection(getEducationalNotes(element.data))}
      <section class="section">
        <h2>Raw data</h2>
        ${renderJson(element.data)}
      </section>
    `
    await writePage(`entities/elements/${element.slug}.html`, page({ title: displayName, content }))
  }

  const compoundLinks = compounds.map((compound) => linkTo(`entities/compounds/${compound.id}.html`, compound.id))
  
  // Orphan compounds report (compounds not used anywhere - no solutions, no substance loader references)
  const orphanCompounds = findOrphanCompounds(compounds, compoundChildren, phasesByCompound)
  const orphanCompoundLinks = orphanCompounds.map((c) => linkTo(`entities/compounds/${c.id}.html`, c.data.name || c.id))
  
  await writePage('entities/compounds/index.html', page({
    title: 'Compounds',
    content: `
      <section class="section">
        ${renderEntityHeader('Compounds')} 
        <p>${linkTo('entities/reports/orphan-compounds.html', '⚠️ View standalone compounds report')} (${orphanCompounds.length} not in solutions)</p>
        ${renderList(compoundLinks)}
      </section>
    `
  }))
  
  await writePage('entities/reports/orphan-compounds.html', page({
    title: 'Standalone Compounds',
    content: `
      <section class="section">
        ${renderEntityHeader('Standalone Compounds', 'Compounds not used in any solution')}
        <p>Total: ${orphanCompounds.length}</p>
        <p><em>These are pure compounds available for experiments (not necessarily unused)</em></p>
        ${orphanCompoundLinks.length ? renderList(orphanCompoundLinks) : '<p>All compounds are used in solutions</p>'}
      </section>
    `
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
    const smiles = getSmilesString(compound.data)

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
      ${renderMoleculeViewer(smiles, 'Molecular structure')}
      ${renderEducationalSection(getEducationalNotes(compound.data))}
      <section class="section">
        <h2>Raw data</h2>
        ${renderJson(compound.data)}
      </section>
    `
    await writePage(`entities/compounds/${compound.id}.html`, page({ title: displayName, content }))
  }

  const solutionLinks = solutions.map((solution) => linkTo(`entities/solutions/${solution.id}.html`, solution.id))
  
  // Note: All solutions are typically used, so orphan report might not be meaningful
  // But we can still create it for completeness
  await writePage('entities/solutions/index.html', page({
    title: 'Solutions',
    content: `
      <section class="section">
        ${renderEntityHeader('Solutions', 'Mixtures and solutions')}
        <p>${linkTo('entities/reports/orphan-solutions.html', 'View orphan solutions report')}</p>
        ${renderList(solutionLinks)}
      </section>
    `
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
      ${renderEducationalSection(getEducationalNotes(solution.data))}
      <section class="section">
        <h2>Raw data</h2>
        ${renderJson(solution.data)}
      </section>
    `
    await writePage(`entities/solutions/${solution.id}.html`, page({ title: displayName, content }))
  }

  const phaseStateOrder = ['solid', 'liquid', 'gas', 'plasma']
  const defaultPhaseIntro = `Phases of matter describe how particles are arranged and how they move. In the game we model phase-dependent properties (density, heat capacity, latent heat, vapor pressure) so the same substance behaves differently as a solid, liquid, or gas.`
  const phaseOverview = phasesOverview || {}
  const phaseIntro = phaseOverview.summary || defaultPhaseIntro
  const phaseEducational = getEducationalNotes(phaseOverview)
  const phaseSections = Array.isArray(phaseOverview.sections) ? phaseOverview.sections : []
  const phaseStateInfo = phaseOverview.states || {}
  const phaseGroups = new Map()
  for (const phase of phases) {
    const rawState = String(phase.phase || '').toLowerCase()
    const stateKey = phaseStateOrder.includes(rawState) ? rawState : 'other'
    if (!phaseGroups.has(stateKey)) phaseGroups.set(stateKey, [])
    phaseGroups.get(stateKey).push(phase)
  }

  const phaseStateLinks = phaseStateOrder.map((state) => {
    const label = titleCase(state)
    return linkTo(`entities/phases/states/${state}.html`, label)
  })
  const phaseStateCounts = phaseStateOrder.map((state) => {
    const count = (phaseGroups.get(state) || []).length
    return `<li>${escapeHtml(titleCase(state))}: ${count}</li>`
  }).join('')

  const phasesInfobox = renderInfobox('Phases of Matter', [
    { label: 'States', value: renderList(phaseStateLinks) },
    { label: 'Counts', value: `<ul>${phaseStateCounts}</ul>` }
  ])

  await writePage('entities/phases/index.html', page({
    title: 'Phases',
    content: `
      ${phasesInfobox}
      <section class="section">
        ${renderEntityHeader('Phases', 'What phases are and how they behave in the simulation')}
        <p>${linkTo('entities/reports/orphan-phases.html', 'View orphan phases report')}</p>
        ${renderParagraphs(phaseIntro)}
      </section>
      ${renderEducationalSection(phaseEducational)}
      ${phaseSections.map((section) => `
        <section class="section">
          <h2>${escapeHtml(section.title || 'Overview')}</h2>
          ${renderParagraphs(section.body || section.content || '')}
        </section>
      `).join('')}
      <section class="section">
        <h2>Primary states</h2>
        <p>Choose a state to view its definition and the related phase files.</p>
        ${renderList(phaseStateLinks)}
      </section>
    `
  }))

  for (const state of [...phaseStateOrder, ...(phaseGroups.has('other') ? ['other'] : [])]) {
    const items = (phaseGroups.get(state) || []).sort((a, b) => a.slug.localeCompare(b.slug))
    const label = titleCase(state)
    const list = items.map((phase) => linkTo(`entities/phases/${phase.slug}.html`, phase.slug))
    const info = phaseStateInfo[state] || {}
    const summary = info.summary || `General overview of the ${label.toLowerCase()} phase of matter.`
    const educational = getEducationalNotes(info)
    const keyProps = Array.isArray(info.keyProperties) ? info.keyProperties : []
    const examples = Array.isArray(info.examples) ? info.examples : []
    const notes = info.notes || ''
    await writePage(`entities/phases/states/${state}.html`, page({
      title: `${label} Phases`,
      content: `
        <section class="section">
          ${renderEntityHeader(`${label} Phases`, `State: ${label}`)}
          ${renderParagraphs(summary)}
          ${renderEducationalSection(educational)}
          ${keyProps.length ? `<h3>Key properties</h3>${renderList(keyProps.map((item) => escapeHtml(item)))}` : ''}
          ${examples.length ? `<h3>Examples</h3>${renderList(examples.map((item) => escapeHtml(item)))}` : ''}
          ${notes ? `<h3>Notes</h3>${renderParagraphs(notes)}` : ''}
          ${items.length ? renderList(list) : '<p>No phases recorded for this state yet.</p>'}
        </section>
      `
    }))
  }

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
      ${renderEducationalSection(getEducationalNotes(phase.data))}
      <section class="section">
        <h2>Raw data</h2>
        ${renderJson(phase.data)}
      </section>
    `
    await writePage(`entities/phases/${phase.slug}.html`, page({ title: displayName, content }))
  }

  const levelLinks = levels.map((level) => linkTo(`entities/levels/${level.id}.html`, `${level.name || level.id}`))
  const orphanLevels = findOrphanLevels(levels, experiments)
  const orphanLevelLinks = orphanLevels.map((level) => linkTo(`entities/levels/${level.id}.html`, level.name || level.id))

  await writePage('entities/levels/index.html', page({
    title: 'Levels',
    content: `
      <section class="section">
        ${renderEntityHeader('Levels')}
        <p>${linkTo('entities/reports/orphan-levels.html', '⚠️ View unused levels report')} (${orphanLevels.length} unused)</p>
        ${renderList(levelLinks)}
      </section>
    `
  }))

  await writePage('entities/reports/orphan-levels.html', page({
    title: 'Unused Levels',
    content: `
      <section class="section">
        ${renderEntityHeader('Unused Levels', 'Levels with no experiments assigned')}
        <p>Total: ${orphanLevels.length}</p>
        ${orphanLevelLinks.length ? renderList(orphanLevelLinks) : '<p>✅ All levels have experiments.</p>'}
      </section>
    `
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
  const orphanExperiments = findOrphanExperiments(experiments, levels)
  const orphanExperimentLinks = orphanExperiments.map((experiment) => linkTo(`entities/experiments/${experiment.id}.html`, experiment.name || experiment.id))

  await writePage('entities/experiments/index.html', page({
    title: 'Experiments',
    content: `
      <section class="section">
        ${renderEntityHeader('Experiments')}
        <p>${linkTo('entities/reports/orphan-experiments.html', '⚠️ View unassigned experiments report')} (${orphanExperiments.length} unassigned)</p>
        ${renderList(experimentLinks)}
      </section>
    `
  }))

  await writePage('entities/reports/orphan-experiments.html', page({
    title: 'Unassigned Experiments',
    content: `
      <section class="section">
        ${renderEntityHeader('Unassigned Experiments', 'Experiments whose parent level is missing')}
        <p>Total: ${orphanExperiments.length}</p>
        ${orphanExperimentLinks.length ? renderList(orphanExperimentLinks) : '<p>✅ All experiments are assigned to valid levels.</p>'}
      </section>
    `
  }))

  for (const experiment of experiments) {
    const siblings = experiments.filter((item) => Number(item.level) === Number(experiment.level))
    const predecessor = getOrderedSibling(siblings, experiment, -1)
    const successor = getOrderedSibling(siblings, experiment, 1)

    const infobox = renderInfobox(experiment.name || experiment.id, [
      { label: 'Type', value: 'Experiment' },
      { label: 'Parent', value: linkTo(`entities/levels/${experiment.level}.html`, `Level ${experiment.level}`) },
      { label: 'Predecessor', value: predecessor ? linkTo(`entities/experiments/${predecessor.id}.html`, predecessor.name || predecessor.id) : '' },
      { label: 'Successor', value: successor ? linkTo(`entities/experiments/${successor.id}.html`, successor.name || successor.id) : '' },
      { label: 'Tutorial', value: experiment.isTutorial ? 'Yes' : 'No' },
      { label: 'Requires Location', value: experiment.requiresLocation ? 'Yes' : 'No' },
      { label: 'Unlocks Room Controls', value: experiment.unlocksRoomControls ? 'Yes (AC + Air Handler)' : 'No' }
    ])

    // Build breadcrumbs
    const breadcrumbs = [
      { label: 'Main', href: '../../index.html' },
      { label: 'Experiments', href: 'index.html' },
      { label: experiment.name || experiment.id, href: null }
    ]

    // Determine which formulas are used based on experiment features
    const formulasUsed = []
    const processesUsed = []
    
    // All experiments use these core formulas
    formulasUsed.push(
      { name: 'antoineEquation', desc: 'Calculates vapor pressure and boiling points' },
      { name: 'heatCapacity', desc: 'Determines how fast liquid heats up' },
      { name: 'newtonCooling', desc: 'Models heat loss to environment' }
    )
    
    if (experiment.requiresLocation) {
      formulasUsed.push(
        { name: 'isaAtmosphere', desc: 'Converts altitude to atmospheric pressure' }
      )
    }
    
    if (experiment.unlocksRoomControls) {
      formulasUsed.push(
        { name: 'pidController', desc: 'AC temperature control algorithm' },
        { name: 'gasExchange', desc: 'Air handler composition mixing' },
        { name: 'evaporation', desc: 'Pre-boiling evaporation into room air' },
        { name: 'massTransfer', desc: 'Boundary layer mass transfer model' }
      )
      processesUsed.push(
        { name: 'roomEnvironment', desc: 'Room state management and simulation' },
        { name: 'acControl', desc: 'PID-based temperature control' },
        { name: 'airHandling', desc: 'Composition scrubbing and filtration' }
      )
    }
    
    if (experiment.id === 'different-fluids' || experiment.id === 'dangerous-liquids') {
      formulasUsed.push(
        { name: 'ebullioscopy', desc: 'Boiling point elevation for solutions' },
        { name: 'dynamicKb', desc: 'Temperature-dependent ebullioscopic constant' }
      )
    }

    // Educational content specific to each experiment
    let educationalContent = ''
    
    if (experiment.id === 'boiling-water') {
      educationalContent = `
        <section class="section">
          <h2>📚 What You Learn</h2>
          <p>This is the <strong>tutorial experiment</strong> that introduces the core physics simulation:</p>
          <ul>
            <li><strong>Boiling Point:</strong> Pure water boils at exactly 100°C at sea level (101,325 Pa)</li>
            <li><strong>Heat Transfer:</strong> Power from the burner transfers to water via Q = mcΔT</li>
            <li><strong>Phase Change:</strong> At boiling point, water converts to steam (requires latent heat of vaporization: 2,257 kJ/kg)</li>
            <li><strong>Newton's Law of Cooling:</strong> Hot water loses heat to surroundings exponentially</li>
          </ul>
        </section>
        <section class="section">
          <h2>🎮 Game Mechanics</h2>
          <p><strong>Objective:</strong> Boil water for the first time to unlock advanced controls</p>
          <ul>
            <li>Drag pot under faucet to fill with water</li>
            <li>Drag pot over burner flame</li>
            <li>Turn on burner and wait for water to reach 100°C</li>
            <li>Watch steam animation when boiling begins</li>
          </ul>
          <p>Upon completion, unlocks: Level/Workshop selectors, substance dropdown, altitude selector</p>
        </section>
      `
    } else if (experiment.id === 'altitude-effect') {
      educationalContent = `
        <section class="section">
          <h2>📚 What You Learn</h2>
          <p>Atmospheric pressure decreases with altitude, which <strong>lowers the boiling point</strong> of water:</p>
          <ul>
            <li><strong>Sea Level (0m):</strong> 101,325 Pa → Water boils at 100.0°C</li>
            <li><strong>Denver (1,609m):</strong> 83,437 Pa → Water boils at 95.0°C</li>
            <li><strong>Mt. Everest (8,848m):</strong> 31,400 Pa → Water boils at 71.0°C</li>
            <li><strong>ISA Model:</strong> Uses standard atmosphere equation to calculate pressure from altitude</li>
          </ul>
        </section>
        <section class="section">
          <h2>🔬 Complete Calculation Pipeline</h2>
          <p>Here's the full calculation flow when you select "Denver, Colorado" in the game:</p>
          
          <h3>Step 1: Player Selects Location</h3>
          ${renderCodeSnippet(String.raw`// User clicks "Denver, Colorado" from location dropdown
const selectedLocation = {
  name: "Denver, Colorado",
  altitude: 1609,  // meters above sea level
  lat: 39.7392,
  lon: -104.9903
}

console.log("Altitude set to:", selectedLocation.altitude, "meters")`, 
            'Player selection triggers altitude change, which recalculates pressure and boiling point.',
            'Step 1: Location Selection'
          )}

          <h3>Step 2: Calculate Atmospheric Pressure (ISA Model)</h3>
          ${renderCodeSnippet(String.raw`// Example: Denver at 1,609 meters
const altitude = 1609  // meters
const seaLevelPressure = 101325  // Pa
const tempLapseRate = 0.0065  // K/m (standard atmosphere)
const seaLevelTemp = 288.15  // K (15°C)
const g = 9.80665  // m/s² (gravity)
const M = 0.0289644  // kg/mol (molar mass of air)
const R = 8.31447  // J/(mol·K) (gas constant)

// ISA troposphere model (0-11km)
const tempAtAltitude = seaLevelTemp - (tempLapseRate * altitude)
// Result: 288.15 - (0.0065 × 1609) = 277.7 K

const exponent = (g * M) / (R * tempLapseRate)
// Result: 5.255877

const pressureRatio = Math.pow(tempAtAltitude / seaLevelTemp, exponent)
const pressure = seaLevelPressure * pressureRatio
// Result: 83,437 Pa (Denver's atmospheric pressure)

console.log("Pressure at Denver:", pressure, "Pa")`, 
            'ISA (International Standard Atmosphere) model calculates realistic pressure at any altitude.',
            'Step 2: Pressure from Altitude'
          )}

          <h3>Step 3: Solve Antoine Equation for Boiling Point</h3>
          ${renderCodeSnippet(String.raw`// Example: Water at Denver's pressure (83,437 Pa)
const pressure = 83437  // Pa from ISA model
const antoineCoeffs = {
  A: 8.07131,
  B: 1730.63,
  C: 233.426
}

// Convert pressure to mmHg (Antoine uses mmHg)
const pressureMmHg = pressure * 0.00750062
// Result: 625.8 mmHg

// Solve Antoine equation backward for temperature
// log₁₀(P) = A - B/(C + T)
// Rearrange: T = B/(A - log₁₀(P)) - C
const T = antoineCoeffs.B / (antoineCoeffs.A - Math.log10(pressureMmHg)) - antoineCoeffs.C
// Result: 95.0°C (water's boiling point in Denver)

console.log("Water boils at:", T.toFixed(1), "°C in Denver")`, 
            'Antoine equation solves backward: given pressure, find boiling temperature.',
            'Step 3: Boiling Point Calculation'
          )}

          <h3>Step 4: Simulation Runs with New Boiling Point</h3>
          ${renderCodeSnippet(String.raw`// Game's physics loop (every 100ms)
function simulateTimeStep(state, heatInput, deltaTime, substance) {
  // Boiling point is now 95°C instead of 100°C
  const boilingPoint = 95.0  // calculated from altitude
  
  // Heat water from 20°C → 95°C
  if (state.temp < boilingPoint && heatInput > 0) {
    const energyAdded = heatInput * deltaTime  // 2000W × 0.1s = 200J
    const tempIncrease = energyAdded / (state.mass * substance.specificHeat)
    state.temp += tempIncrease
    
    console.log("Heating:", state.temp.toFixed(1), "°C")
  }
  
  // Start boiling at 95°C (not 100°C!)
  if (state.temp >= boilingPoint && heatInput > 0) {
    console.log("BOILING at 95°C - Lower pressure = lower boiling point!")
    const massVaporized = (heatInput * deltaTime) / substance.heatOfVaporization
    state.mass -= massVaporized
    state.temp = boilingPoint  // Temperature plateaus at 95°C
  }
  
  return state
}`, 
            'Physics simulation uses the altitude-adjusted boiling point throughout the experiment.',
            'Step 4: Physics Loop with Adjusted Boiling Point'
          )}

          <h3>Step 5: Display Educational Message</h3>
          ${renderCodeSnippet(String.raw`// When water reaches boiling point
if (hasReachedBoilingPoint) {
  const message = buildEducationalMessage(altitude, boilingPoint)
  displayMessage(message)
}

// Example output for Denver:
"Water is boiling at 95.0°C!
At 1,609 meters altitude, lower atmospheric pressure (83,437 Pa)
allows water molecules to escape as vapor at a lower temperature.
At sea level, water would boil at 100.0°C."`, 
            'Game displays educational explanation when water boils at unexpected temperature.',
            'Step 5: Educational Feedback'
          )}
        </section>
        <section class="section">
          <h2>🎮 Try This</h2>
          <ul>
            <li><strong>Denver (1,609m):</strong> Water boils at ~95°C - notice how much faster it boils!</li>
            <li><strong>La Paz, Bolivia (3,640m):</strong> Water boils at ~87°C - extremely fast boiling</li>
            <li><strong>Mt. Everest base camp (5,380m):</strong> Water boils at ~82°C - impossible to cook pasta!</li>
            <li><strong>Mt. Everest summit (8,848m):</strong> Water boils at ~71°C - barely warm enough for tea</li>
            <li><strong>Dead Sea (-430m):</strong> Water boils at ~101.4°C - slightly higher pressure</li>
          </ul>
        </section>
      `
    } else if (experiment.id === 'different-fluids') {
      educationalContent = `
        <section class="section">
          <h2>📚 What You Learn</h2>
          <p>Different substances have <strong>unique boiling points</strong> due to molecular structure and intermolecular forces:</p>
          <table class="wiki-table">
            <tr><th>Substance</th><th>Boiling Point (sea level)</th><th>Why?</th></tr>
            <tr><td>Acetone</td><td>56.0°C</td><td>Weak dipole-dipole forces</td></tr>
            <tr><td>Ethanol</td><td>78.4°C</td><td>Hydrogen bonding (moderate)</td></tr>
            <tr><td>Water</td><td>100.0°C</td><td>Strong hydrogen bonding</td></tr>
            <tr><td>Acetic Acid</td><td>118.1°C</td><td>Carboxylic acid dimers</td></tr>
          </table>
        </section>
        <section class="section">
          <h2>🔬 Full Simulation Pipeline</h2>
          <p>The game runs a complete thermodynamics simulation every 100ms. Here's what happens when heating ethanol:</p>
          
          <h3>Step 1: Load Substance Properties</h3>
          ${renderCodeSnippet(String.raw`// Example: Loading ethanol from JSON
const ethanol = await loadSubstancePhase('ethanol', 'liquid')

// Parsed properties:
{
  name: "Ethanol",
  molarMass: 46.07,
  density: 0.789,              // kg/L at 20°C
  specificHeat: 2.44,          // J/(g·°C)
  thermalConductivity: 0.169,  // W/(m·K)
  heatOfVaporization: 838,     // kJ/kg
  antoineCoefficients: {
    A: 8.04494,
    B: 1554.3,
    C: 222.65,
    TminC: -31,
    TmaxC: 100
  }
}`, 
            'Each substance has unique thermodynamic properties loaded from JSON files.',
            'Step 1: Load Substance Data'
          )}

          <h3>Step 2: Calculate Boiling Point (Antoine Equation)</h3>
          ${renderCodeSnippet(String.raw`// Example: Ethanol at sea level (101,325 Pa)
const pressure = 101325  // Pa
const coeffs = ethanol.antoineCoefficients

// Antoine equation: log₁₀(P) = A - B/(C + T)
// Solve for T: T = B/(A - log₁₀(P)) - C
const pressureMmHg = pressure * 0.00750062  // 759.99 mmHg
const boilingTemp = coeffs.B / (coeffs.A - Math.log10(pressureMmHg)) - coeffs.C

// Result: 78.4°C (ethanol's boiling point)`, 
            'Antoine equation converts pressure to boiling temperature using substance-specific coefficients.',
            'Step 2: Boiling Point Calculation'
          )}

          <h3>Step 3: Heat Transfer (Q = mcΔT)</h3>
          ${renderCodeSnippet(String.raw`// Example: Heating 0.5 kg ethanol with 2000W burner
const mass = 0.5           // kg
const specificHeat = 2.44  // J/(g·°C) = 2440 J/(kg·°C)
const heatInput = 2000     // Watts
const deltaTime = 0.1      // 100ms time step

// Energy added this timestep
const energyAdded = heatInput * deltaTime  // 200 Joules

// Temperature increase: ΔT = Q / (m × c)
const tempIncrease = energyAdded / (mass * specificHeat)
// Result: 0.164°C per timestep

// New temperature
currentTemp += tempIncrease  // 25.0 → 25.164°C`, 
            'Heat from burner raises temperature based on specific heat capacity (unique per substance).',
            'Step 3: Heating Calculation'
          )}

          <h3>Step 4: Cooling (Newton's Law of Cooling)</h3>
          ${renderCodeSnippet(String.raw`// Example: Hot ethanol cooling to room temperature
const currentTemp = 60      // °C
const ambientTemp = 20      // °C
const k = 0.05              // heat transfer coefficient
const deltaTime = 0.1       // seconds

// Newton's Law: dT/dt = -k(T - T_ambient)
const coolingRate = -k * (currentTemp - ambientTemp)
// Result: -2.0°C per second

const tempChange = coolingRate * deltaTime
// Result: -0.2°C this timestep

currentTemp += tempChange  // 60.0 → 59.8°C`, 
            'When burner is off, liquid cools exponentially toward room temperature.',
            'Step 4: Cooling Model'
          )}

          <h3>Step 5: Evaporation (Pre-Boiling)</h3>
          ${renderCodeSnippet(String.raw`// Example: Ethanol evaporating at 50°C (below boiling)
const currentTemp = 50      // °C
const surfaceArea = 0.0314  // m² (10cm radius pot)

// Get vapor pressure at current temperature
const vaporPressure = solveAntoineForPressure(currentTemp, antoineCoeffs)
// Result: 29,300 Pa (ethanol has high vapor pressure)

// Mass transfer coefficient (depends on air flow, temperature)
const kMass = 0.002  // m/s

// Evaporation rate (mass transfer model)
const evapRate = kMass * surfaceArea * (vaporPressure / (R * T))
// Result: 0.00015 kg/s

const massLost = evapRate * deltaTime  // 0.000015 kg per timestep`, 
            'Liquids evaporate even below boiling point - substances with higher vapor pressure evaporate faster.',
            'Step 5: Pre-Boiling Evaporation'
          )}

          <h3>Step 6: Phase Change (Boiling)</h3>
          ${renderCodeSnippet(String.raw`// Example: Ethanol reaches 78.4°C and starts boiling
if (currentTemp >= boilingPoint && heatInput > 0) {
  // All energy goes into phase change (no temp increase)
  const energyAvailable = heatInput * deltaTime  // 200 J
  const heatOfVaporization = 838000  // J/kg for ethanol
  
  // Mass converted to vapor
  const massVaporized = energyAvailable / heatOfVaporization
  // Result: 0.000239 kg (0.239 grams) per timestep
  
  liquidMass -= massVaporized
  
  // Temperature stays at 78.4°C until all liquid is gone
  currentTemp = boilingPoint
}`, 
            'At boiling point, energy creates vapor instead of raising temperature. Lower heat of vaporization = faster boiling.',
            'Step 6: Phase Change'
          )}

          <h3>Complete Timestep Function</h3>
          ${renderCodeSnippet(String.raw`// This runs every 100ms during the game
function simulateTimeStep(state, heatInput, deltaTime, substance) {
  // 1. Calculate boiling point
  const boilingPoint = calculateBoilingPoint(altitude, substance)
  
  // 2. Add heat from burner
  if (heatInput > 0 && state.temp < boilingPoint) {
    const energyAdded = heatInput * deltaTime
    const tempIncrease = energyAdded / (state.mass * substance.specificHeat)
    state.temp += tempIncrease
  }
  
  // 3. Apply cooling
  const coolingRate = -substance.heatTransferCoeff * (state.temp - ambientTemp)
  state.temp += coolingRate * deltaTime
  
  // 4. Evaporation (pre-boiling)
  if (state.temp < boilingPoint) {
    const evapRate = calculateEvaporationRate(state.temp, substance)
    state.mass -= evapRate * deltaTime
  }
  
  // 5. Boiling (at boiling point)
  if (state.temp >= boilingPoint && heatInput > 0) {
    const massVaporized = (heatInput * deltaTime) / substance.heatOfVaporization
    state.mass -= massVaporized
    state.temp = boilingPoint  // Temperature plateaus
  }
  
  return state
}`, 
            'The complete simulation pipeline runs every 100ms, updating temperature and mass based on all physics models.',
            'Complete Simulation Loop'
          )}
        </section>
        <section class="section">
          <h2>🎮 Try This</h2>
          <ul>
            <li><strong>Compare heating rates:</strong> Acetone heats faster (lower specific heat: 2.15 J/g°C) vs water (4.18 J/g°C)</li>
            <li><strong>Compare boiling times:</strong> Acetone boils at 56°C, ethanol at 78°C, water at 100°C</li>
            <li><strong>Watch evaporation:</strong> Acetone loses mass faster even before boiling (higher vapor pressure)</li>
            <li><strong>Observe cooling:</strong> Different substances cool at different rates based on thermal conductivity</li>
          </ul>
        </section>
      `
    } else if (experiment.id === 'dangerous-liquids') {
      educationalContent = `
        <section class="section">
          <h2>📚 What You Learn</h2>
          <p>This experiment introduces <strong>room environment simulation</strong> and hazardous substance handling:</p>
          <ul>
            <li><strong>Vapor Release:</strong> Boiling substances release vapor into room air (changes composition)</li>
            <li><strong>Room Pressure Feedback:</strong> Vapor accumulation increases pressure → raises boiling point</li>
            <li><strong>AC Temperature Control:</strong> PID controller maintains room temperature despite burner heat</li>
            <li><strong>Air Handler Filtration:</strong> Scrubs toxic vapors and maintains breathable atmosphere</li>
          </ul>
        </section>
        <section class="section">
          <h2>⚠️ Dangerous Substances</h2>
          <p>Some liquids produce <strong>toxic or flammable vapors</strong> that require active room ventilation:</p>
          <table class="wiki-table">
            <tr><th>Substance</th><th>Hazard</th><th>Safe Exposure</th></tr>
            <tr><td>Ammonia (NH₃)</td><td>Toxic vapor</td><td>&lt; 25 ppm</td></tr>
            <tr><td>Methanol</td><td>Toxic + Flammable</td><td>&lt; 200 ppm</td></tr>
            <tr><td>Acetone</td><td>Flammable</td><td>&lt; 500 ppm</td></tr>
            <tr><td>Chloroform</td><td>Carcinogen</td><td>&lt; 2 ppm</td></tr>
          </table>
        </section>
        <section class="section">
          <h2>🔬 Room Environment Physics</h2>
          ${renderCodeSnippet(String.raw`// When liquid boils, vapor is released into room
const vaporMolesAdded = massEvaporated / molarMass
composition[substanceId] += vaporMolesAdded / totalRoomMoles

// Pressure increases (ideal gas law: P = nRT/V)
const newPressure = (totalMoles * R * roomTempK) / roomVolumeM3

// Higher pressure → higher boiling point (feedback!)
const newBoilingPoint = solveAntoineForTemperature(newPressure, substance)`, 
            'Boiling creates a feedback loop: vapor raises room pressure, which raises boiling point, which slows boiling.',
            'Code: Vapor Release → Pressure Feedback'
          )}
          ${renderCodeSnippet(String.raw`// PID controller keeps room cool despite burner heat
const error = setpoint - currentTemp
const pidOutput = (Kp * error) + (Ki * integral) + (Kd * derivative)
const acPower = pidOutput * maxCoolingWatts

// Air handler scrubs toxic vapors
const removalRate = flowRate * efficiency[substance]
composition[toxicVapor] -= removalRate * deltaTime`, 
            'AC uses PID control to maintain temperature, while air handler filters contaminants.',
            'Code: AC + Air Handler Control'
          )}
        </section>
        <section class="section">
          <h2>🎮 New Controls Unlocked</h2>
          <p>This experiment unlocks the <strong>Room Controls panel</strong>:</p>
          <ul>
            <li><strong>AC Temperature Setpoint:</strong> Control room temperature (15-28°C)</li>
            <li><strong>Air Handler Mode:</strong> Off / Low / Medium / High filtration</li>
            <li><strong>Room Status Display:</strong> Shows temperature, pressure, O₂ level, contaminant warnings</li>
          </ul>
        </section>
        <section class="section">
          <h2>🎮 Try This</h2>
          <ul>
            <li><strong>No ventilation:</strong> Boil ammonia with air handler OFF - watch room composition degrade</li>
            <li><strong>AC test:</strong> Set AC to 15°C and boil water - observe room staying cool despite burner</li>
            <li><strong>Pressure experiment:</strong> Boil in sealed room (no ventilation) - boiling point rises as pressure increases</li>
          </ul>
        </section>
      `
    }

    const formulasList = formulasUsed.map((f) => 
      `<li>${linkTo(`entities/formulas/${f.name}.html`, f.name)} - ${escapeHtml(f.desc)}</li>`
    ).join('')

    const processesList = processesUsed.length > 0 
      ? processesUsed.map((p) => 
          `<li>${linkTo(`entities/processes/${p.name}.html`, p.name)} - ${escapeHtml(p.desc)}</li>`
        ).join('')
      : ''

    const content = `
      ${infobox}
      <section class="section">
        ${renderEntityHeader(experiment.name || experiment.id, 'Experiment')}
        <p>${escapeHtml(experiment.description || 'No description available.')}</p>
      </section>
      ${educationalContent}
      <section class="section">
        <h2>🔧 Formulas Used</h2>
        <p>This experiment relies on the following physics formulas:</p>
        <ul>${formulasList}</ul>
      </section>
      ${processesUsed.length > 0 ? `
      <section class="section">
        <h2>⚙️ Processes Used</h2>
        <p>High-level orchestration processes:</p>
        <ul>${processesList}</ul>
      </section>
      ` : ''}
      <section class="section">
        <h2>📊 Experiment Configuration</h2>
        ${renderJson(experiment)}
      </section>
    `
    
    await writePage(`entities/experiments/${experiment.id}.html`, page({ 
      title: experiment.name || experiment.id, 
      content,
      breadcrumbs 
    }))
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
  
  // Orphan formulas report (formulas with no usage anywhere)
  const orphanFormulas = findOrphanFormulas(formulas, formulaToProcesses, formulaUsage)
  const orphanFormulaLinks = orphanFormulas.map((f) => linkTo(`entities/formulas/${f.slug}.html`, f.slug))
  
  await writePage('entities/formulas/index.html', page({
    title: 'Formulas',
    content: `
      <section class="section">
        ${renderEntityHeader('Formulas')} 
        <p>${linkTo('entities/reports/orphan-formulas.html', '⚠️ View unused formulas report')} (${orphanFormulas.length} unused)</p>
        ${renderList(formulaLinks)}
      </section>
    `
  }))
  
  await writePage('entities/reports/orphan-formulas.html', page({
    title: 'Unused Formulas',
    content: `
      <section class="section">
        ${renderEntityHeader('Unused Formulas', 'Formulas not used by any process or module')}
        <p>Total: ${orphanFormulas.length}</p>
        ${orphanFormulaLinks.length ? renderList(orphanFormulaLinks) : '<p>✅ All formulas are used!</p>'}
      </section>
    `
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

    // Build breadcrumbs
    const breadcrumbs = [
      { label: 'Main', href: '../../index.html' },
      { label: 'Formulas', href: 'index.html' },
      { label: formula.slug, href: null }
    ]

    // Build TOC
    const tocSections = []
    if (formula.docBlock?.educationalValue) tocSections.push({ label: 'Educational Value', href: '#educational-value' })
    tocSections.push({ label: 'Source File', href: '#source-file' })
    if (usedByProcesses.length > 0) tocSections.push({ label: 'Used By Processes', href: '#processes' })

    const content = `
      ${infobox}
      <section class="section">
        ${renderEntityHeader(formula.slug, 'Formula')}
      </section>
      ${renderEducationalSection(formula.docBlock, true)}
      <section class="section" id="source-file">
        <h2>Source file</h2>
        <p><code>${escapeHtml(path.relative(repoRoot, formula.file))}</code></p>
        <details>
          <summary>View source code</summary>
          ${renderCodeBlock(formula.content, 'javascript')}
        </details>
      </section>
    `
    
    const toc = tocSections.length > 0 ? generateToc(tocSections) : null
    await writePage(`entities/formulas/${formula.slug}.html`, page({ 
      title: formula.slug, 
      content,
      breadcrumbs,
      toc 
    }))
  }

  const processLinks = processes.map((process) => linkTo(`entities/processes/${process.slug}.html`, process.slug))
  
  // Orphan processes report (processes with no usage anywhere)
  const orphanProcesses = findOrphanProcesses(processes, processUsage)
  const orphanProcessLinks = orphanProcesses.map((p) => linkTo(`entities/processes/${p.slug}.html`, p.slug))
  
  await writePage('entities/processes/index.html', page({
    title: 'Processes',
    content: `
      <section class="section">
        ${renderEntityHeader('Processes')} 
        <p>${linkTo('entities/reports/orphan-processes.html', '⚠️ View unused processes report')} (${orphanProcesses.length} unused)</p>
        ${renderList(processLinks)}
      </section>
    `
  }))
  
  await writePage('entities/reports/orphan-processes.html', page({
    title: 'Unused Processes',
    content: `
      <section class="section">
        ${renderEntityHeader('Unused Processes', 'Processes not called by any module')}
        <p>Total: ${orphanProcesses.length}</p>
        ${orphanProcessLinks.length ? renderList(orphanProcessLinks) : '<p>✅ All processes are used!</p>'}
      </section>
    `
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

    // Build breadcrumbs
    const breadcrumbs = [
      { label: 'Main', href: '../../index.html' },
      { label: 'Processes', href: 'index.html' },
      { label: process.slug, href: null }
    ]

    // Build TOC
    const tocSections = []
    if (process.docBlock?.educationalValue) tocSections.push({ label: 'Educational Value', href: '#educational-value' })
    tocSections.push({ label: 'Source File', href: '#source-file' })
    if (usesFormulas.length > 0) tocSections.push({ label: 'Uses Formulas', href: '#formulas' })

    const content = `
      ${infobox}
      <section class="section">
        ${renderEntityHeader(process.slug, process.isStub ? 'Process (Stub)' : 'Process')}
      </section>
      ${renderEducationalSection(process.docBlock, true)}
      <section class="section" id="source-file">
        <h2>Source file</h2>
        <p><code>${escapeHtml(path.relative(repoRoot, process.file))}</code></p>
        <details>
          <summary>View source code</summary>
          ${renderCodeBlock(process.content, 'javascript')}
        </details>
      </section>
    `
    
    const toc = tocSections.length > 0 ? generateToc(tocSections) : null
    await writePage(`entities/processes/${process.slug}.html`, page({ 
      title: process.slug, 
      content,
      breadcrumbs,
      toc 
    }))
  }

  // Build module usage maps
  const moduleUsage = await buildUsageMap(modules.flatMap((m) => m.exports))
  const moduleImportsMap = new Map()
  for (const mod of modules) {
    moduleImportsMap.set(mod.slug, mod.imports)
  }

  const moduleLinks = modules.map((mod) => linkTo(`entities/modules/${mod.slug}.html`, mod.filename))
  
  // Orphan modules report (modules not imported by any other module)
  const orphanModules = findOrphanModules(modules)
  const orphanModuleLinks = orphanModules.map((m) => linkTo(`entities/modules/${m.slug}.html`, m.filename))
  
  await writePage('entities/modules/index.html', page({
    title: 'Modules',
    content: `
      <section class="section">
        ${renderEntityHeader('Modules', 'Game source files')} 
        <p>${linkTo('entities/reports/orphan-modules.html', '⚠️ View unused modules report')} (${orphanModules.length} unused)</p>
        ${renderList(moduleLinks)}
      </section>
    `
  }))
  
  await writePage('entities/reports/orphan-modules.html', page({
    title: 'Unused Modules',
    content: `
      <section class="section">
        ${renderEntityHeader('Unused Modules', 'Modules not imported anywhere')}
        <p>Total: ${orphanModules.length}</p>
        ${orphanModuleLinks.length ? renderList(orphanModuleLinks) : '<p>✅ All modules are imported!</p>'}
      </section>
    `
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
      { label: 'File type', value: mod.fileType ? escapeHtml(mod.fileType) : '' },
      { label: 'Exports', value: renderExportLinks(mod.exports) },
      { label: 'Imports', value: importsHtml || '' },
      { label: 'Imported by', value: importedBy.length ? renderLinkList(importedBy) : '' },
      { label: 'Used in', value: usedInHtml }
    ])

    // Build breadcrumbs for module navigation
    const pathParts = mod.slug.split('/')
    const breadcrumbs = [
      { label: 'Main', href: '../../../index.html' },
      { label: 'Modules', href: '../index.html' }
    ]
    
    // Add folder breadcrumbs if in subfolder
    for (let i = 0; i < pathParts.length - 1; i++) {
      breadcrumbs.push({
        label: pathParts[i],
        href: `../${pathParts.slice(0, i + 1).join('/')}/index.html`
      })
    }
    
    breadcrumbs.push({ label: mod.filename, href: null })

    // Build table of contents
    const tocSections = []
    if (mod.docBlock?.educationalValue) tocSections.push({ label: 'Educational Value', href: '#educational-value' })
    tocSections.push({ label: 'Source File', href: '#source-file' })
    if (mod.exports.length > 0) tocSections.push({ label: 'Exported Functions', href: '#exports' })
    if (importedBy.length > 0) tocSections.push({ label: 'Dependencies', href: '#dependencies' })

    // Detect language for syntax highlighting
    const language = (() => {
      if (mod.filename.endsWith('.jsx')) return 'jsx'
      if (mod.filename.endsWith('.tsx')) return 'tsx'
      if (mod.fileType === 'css') return 'css'
      if (mod.fileType === 'json') return 'json'
      if (mod.fileType === 'md') return 'markdown'
      return 'javascript'
    })()

    const content = `
      ${infobox}
      <section class="section">
        ${renderEntityHeader(mod.filename, mod.isComponent ? 'React Component' : 'Module')}
      </section>
      ${renderEducationalSection(mod.docBlock, true)}
      <section class="section" id="source-file">
        <h2>Source file</h2>
        <p><code>${escapeHtml(path.relative(repoRoot, mod.file))}</code></p>
        <details>
          <summary>View source code</summary>
          ${renderCodeBlock(mod.content, language)}
        </details>
      </section>
    `
    
    const toc = tocSections.length > 0 ? generateToc(tocSections) : null
    await writePage(`entities/modules/${mod.slug}.html`, page({ 
      title: mod.filename, 
      content,
      breadcrumbs,
      toc 
    }))
  }

  const assetTree = renderAssetTree(assets)
  await writePage('entities/assets/index.html', page({
    title: 'Assets',
    content: `
      <section class="section">
        ${renderEntityHeader('Assets', 'Public assets referenced by src')}
      </section>
      ${assetTree}
    `
  }))

  for (const asset of assets) {
    const referencedBy = Array.from(asset.references || []).map((ref) => {
      if (ref.slug && ref.filename) {
        const publicLink = ref.file
          ? fileToWikiEntity.get(path.relative(repoRoot, ref.file).replace(/\\/g, '/'))
          : null
        if (publicLink) return linkTo(publicLink.href, publicLink.label)
        return linkTo(`entities/modules/${ref.slug}.html`, ref.filename)
      }
      if (ref.slug) {
        return escapeHtml(ref.slug)
      }
      return escapeHtml(String(ref))
    })

    const infobox = renderInfobox(asset.publicPath, [
      { label: 'Type', value: 'Asset' },
      { label: 'Public path', value: escapeHtml(asset.publicPath) },
      { label: 'Exists', value: asset.exists ? 'Yes' : 'Missing' },
      { label: 'Size', value: asset.exists ? `${asset.size} bytes` : '' },
      { label: 'Referenced by', value: referencedBy.length ? renderLinkList(referencedBy) : '' }
    ])

    const content = `
      ${infobox}
      <section class="section">
        ${renderEntityHeader(asset.publicPath, 'Asset')}
      </section>
      <section class="section">
        <h2>Public link</h2>
        <p><a href="${asset.publicPath}">${escapeHtml(asset.publicPath)}</a></p>
      </section>
    `
    await writePage(`entities/assets/${asset.assetPath}.html`, page({ title: asset.publicPath, content }))
  }

  // ============================================================================
  // PUBLIC FILES - Organized by Workshop hierarchy
  // Structure: workshops/ → {workshopId}/ → equipment categories
  // ============================================================================

  // Group files by workshop
  const filesByWorkshop = new Map()
  for (const file of publicFiles) {
    const workshopId = file.workshopId || '_root'
    if (!filesByWorkshop.has(workshopId)) {
      filesByWorkshop.set(workshopId, {
        workshop: null,
        room: null,
        effects: null,
        burners: [],
        acUnits: [],
        airHandlers: [],
        other: []
      })
    }
    const bucket = filesByWorkshop.get(workshopId)
    
    if (file.category === 'workshop') {
      bucket.workshop = file
    } else if (file.category === 'room') {
      bucket.room = file
    } else if (file.category === 'effects') {
      bucket.effects = file
    } else if (file.category === 'burners') {
      bucket.burners.push(file)
    } else if (file.category === 'ac-units') {
      bucket.acUnits.push(file)
    } else if (file.category === 'air-handlers') {
      bucket.airHandlers.push(file)
    } else {
      bucket.other.push(file)
    }
  }

  // Workshop count
  const workshopIds = Array.from(filesByWorkshop.keys()).filter(id => id !== '_root')
  const workshopCount = workshopIds.length

  // Assets grouped by workshop (for image references)
  const assetsByWorkshop = new Map()
  for (const asset of assets) {
    const parts = asset.assetPath.split('/').filter(Boolean)
    if (parts[0] !== 'workshops') continue
    const workshopId = parts[1] || 'unknown'
    if (!assetsByWorkshop.has(workshopId)) assetsByWorkshop.set(workshopId, [])
    assetsByWorkshop.get(workshopId).push(asset)
  }

  // Orphan public files report
  const orphanPublicFiles = findOrphanPublicFiles(publicFiles, assets)
  const orphanPublicLinks = orphanPublicFiles.map((f) => linkTo(`entities/public/${f.slug}.html`, f.filename))

  // Main public files index - list workshops
  const workshopLinks = workshopIds.sort().map(workshopId => {
    const data = filesByWorkshop.get(workshopId)
    const equipmentCount = data.burners.length + data.acUnits.length + data.airHandlers.length
    return linkTo(`entities/public/workshops/${workshopId}/index.html`, 
      `${workshopId} (${equipmentCount} equipment)`)
  })

  await writePage('entities/public/index.html', page({
    title: 'Public Files',
    content: `
      <section class="section">
        ${renderEntityHeader('Public Files', 'Workshop configurations and equipment')}
        <p>${linkTo('entities/reports/orphan-public-files.html', '⚠️ View unreferenced files report')} (${orphanPublicFiles.length} unreferenced)</p>
      </section>
      <section class="section">
        <h2>Workshops (${workshopCount})</h2>
        <p>Each workshop contains its configuration, room settings, and available equipment.</p>
        ${workshopLinks.length ? renderList(workshopLinks) : '<p>No workshops found.</p>'}
      </section>
    `
  }))
  
  await writePage('entities/reports/orphan-public-files.html', page({
    title: 'Unreferenced Public Files',
    content: `
      <section class="section">
        ${renderEntityHeader('Unreferenced Public Files', 'JSON files not referenced by any module')}
        <p>Total: ${orphanPublicFiles.length}</p>
        ${orphanPublicLinks.length ? renderList(orphanPublicLinks) : '<p>✅ All public files are referenced!</p>'}
      </section>
    `
  }))

  // ============================================================================
  // EQUIPMENT CATEGORY INDEX PAGES
  // Deduplicate by file content - show unique equipment with workshop usage
  // ============================================================================

  // Collect all equipment across workshops
  const allBurners = publicFiles.filter(f => f.category === 'burners')
  const allAcUnits = publicFiles.filter(f => f.category === 'ac-units')
  const allAirHandlers = publicFiles.filter(f => f.category === 'air-handlers')

  // Deduplicate equipment by file content hash
  // Returns Map<contentHash, { file, workshops: string[], specs }>
  const deduplicateEquipment = (equipment) => {
    const byContent = new Map()
    
    for (const f of equipment) {
      // Normalize content for comparison (remove whitespace differences)
      const normalizedContent = f.content.replace(/\s+/g, ' ').trim()
      const contentKey = normalizedContent
      
      if (!byContent.has(contentKey)) {
        // Parse specs from first occurrence
        let specs = ''
        let name = f.filename.replace('.json', '')
        try {
          const data = JSON.parse(f.content)
          name = data.name || data.id || name
          if (data.thermalCharacteristics?.maxWatts) {
            specs = `${data.thermalCharacteristics.maxWatts}W`
          }
          if (data.thermalCharacteristics?.coolingMaxWatts) {
            specs = `${data.thermalCharacteristics.coolingMaxWatts}W cooling`
          }
          if (data.flowCharacteristics?.maxFlowRateCFM) {
            specs = `${data.flowCharacteristics.maxFlowRateCFM} CFM`
          }
        } catch (e) { /* ignore */ }
        
        byContent.set(contentKey, {
          file: f,
          name,
          specs,
          workshops: [f.workshopId]
        })
      } else {
        // Same content, different workshop - add to workshops list
        byContent.get(contentKey).workshops.push(f.workshopId)
      }
    }
    
    return Array.from(byContent.values())
  }

  // Helper to build deduplicated equipment table rows
  const buildDeduplicatedRows = (uniqueEquipment) => {
    return uniqueEquipment.map(item => {
      const workshopLinks = item.workshops.map(w => 
        linkTo(`entities/public/workshops/${w}/index.html`, w)
      ).join(', ')
      
      return `<tr>
        <td>${linkTo(`entities/public/${item.file.slug}.html`, item.name)}</td>
        <td>${workshopLinks}</td>
        <td>${item.specs}</td>
      </tr>`
    }).join('')
  }

  const uniqueBurners = deduplicateEquipment(allBurners)
  const uniqueAcUnits = deduplicateEquipment(allAcUnits)
  const uniqueAirHandlers = deduplicateEquipment(allAirHandlers)

  // Burners index page
  await writePage('entities/public/burners/index.html', page({
    title: 'Burners',
    content: `
      <section class="section">
        ${renderEntityHeader('Burners', 'Heat sources for experiments')}
        <p>${linkTo('entities/reports/orphan-burners.html', '⚠️ View orphan burners report')}</p>
        <p><strong>${uniqueBurners.length} unique burners</strong> (${allBurners.length} instances across ${workshopCount} workshops)</p>
      </section>
      <section class="section">
        <h2>Burner Configurations</h2>
        <table class="data-table">
          <thead>
            <tr><th>Burner</th><th>Used In Workshops</th><th>Max Power</th></tr>
          </thead>
          <tbody>
            ${buildDeduplicatedRows(uniqueBurners)}
          </tbody>
        </table>
      </section>
    `
  }))

  // AC Units index page
  await writePage('entities/public/ac-units/index.html', page({
    title: 'AC Units',
    content: `
      <section class="section">
        ${renderEntityHeader('AC Units', 'Temperature control equipment')}
        <p>${linkTo('entities/reports/orphan-ac-units.html', '⚠️ View orphan AC units report')}</p>
        <p><strong>${uniqueAcUnits.length} unique AC units</strong> (${allAcUnits.length} instances across ${workshopCount} workshops)</p>
      </section>
      <section class="section">
        <h2>AC Unit Configurations</h2>
        <table class="data-table">
          <thead>
            <tr><th>AC Unit</th><th>Used In Workshops</th><th>Cooling Power</th></tr>
          </thead>
          <tbody>
            ${buildDeduplicatedRows(uniqueAcUnits)}
          </tbody>
        </table>
      </section>
    `
  }))

  // Air Handlers index page
  await writePage('entities/public/air-handlers/index.html', page({
    title: 'Air Handlers',
    content: `
      <section class="section">
        ${renderEntityHeader('Air Handlers', 'Ventilation and air quality control')}
        <p>${linkTo('entities/reports/orphan-air-handlers.html', '⚠️ View orphan air handlers report')}</p>
        <p><strong>${uniqueAirHandlers.length} unique air handlers</strong> (${allAirHandlers.length} instances across ${workshopCount} workshops)</p>
      </section>
      <section class="section">
        <h2>Air Handler Configurations</h2>
        <table class="data-table">
          <thead>
            <tr><th>Air Handler</th><th>Used In Workshops</th><th>Flow Rate</th></tr>
          </thead>
          <tbody>
            ${buildDeduplicatedRows(uniqueAirHandlers)}
          </tbody>
        </table>
      </section>
    `
  }))

  // Generate workshop index pages
  for (const [workshopId, data] of filesByWorkshop) {
    if (workshopId === '_root') continue
    
    const workshopAssets = assetsByWorkshop.get(workshopId) || []
    
    // Parse workshop.json for display name
    let workshopName = workshopId
    if (data.workshop) {
      try {
        const parsed = JSON.parse(data.workshop.content)
        workshopName = parsed.name || parsed.metadata?.name || workshopId
      } catch (e) { /* use workshopId */ }
    }

    // Build equipment links
    const burnerLinks = data.burners.map(f => 
      linkTo(`entities/public/${f.slug}.html`, f.filename.replace('.json', '')))
    const acLinks = data.acUnits.map(f => 
      linkTo(`entities/public/${f.slug}.html`, f.filename.replace('.json', '')))
    const ahLinks = data.airHandlers.map(f => 
      linkTo(`entities/public/${f.slug}.html`, f.filename.replace('.json', '')))
    const assetLinks = workshopAssets.map(a => 
      linkTo(`entities/assets/${a.assetPath}.html`, path.basename(a.publicPath)))

    const infobox = renderInfobox(workshopName, [
      { label: 'Workshop ID', value: escapeHtml(workshopId) },
      { label: 'Workshop Config', value: data.workshop ? linkTo(`entities/public/${data.workshop.slug}.html`, 'workshop.json') : '' },
      { label: 'Room Config', value: data.room ? linkTo(`entities/public/${data.room.slug}.html`, 'room.json') : '' },
      { label: 'Effects', value: data.effects ? linkTo(`entities/public/${data.effects.slug}.html`, 'effects.json') : '' },
      { label: 'Burners', value: burnerLinks.length ? `${burnerLinks.length}` : '0' },
      { label: 'AC Units', value: acLinks.length ? `${acLinks.length}` : '0' },
      { label: 'Air Handlers', value: ahLinks.length ? `${ahLinks.length}` : '0' },
      { label: 'Assets', value: assetLinks.length ? `${assetLinks.length} images` : '' }
    ])

    const breadcrumbs = [
      { label: 'Main', href: '../../../../index.html' },
      { label: 'Public Files', href: '../../index.html' },
      { label: workshopName, href: null }
    ]

    const content = `
      ${infobox}
      <section class="section">
        ${renderEntityHeader(workshopName, 'Workshop')}
      </section>
      
      ${data.burners.length ? `
      <section class="section">
        <h2>🔥 Burners (${data.burners.length})</h2>
        ${renderList(burnerLinks)}
      </section>
      ` : ''}
      
      ${data.acUnits.length ? `
      <section class="section">
        <h2>❄️ AC Units (${data.acUnits.length})</h2>
        ${renderList(acLinks)}
      </section>
      ` : ''}
      
      ${data.airHandlers.length ? `
      <section class="section">
        <h2>💨 Air Handlers (${data.airHandlers.length})</h2>
        ${renderList(ahLinks)}
      </section>
      ` : ''}
      
      ${workshopAssets.length ? `
      <section class="section">
        <h2>🖼️ Assets (${workshopAssets.length})</h2>
        ${renderList(assetLinks)}
      </section>
      ` : ''}
    `
    
    await writePage(`entities/public/workshops/${workshopId}/index.html`, page({ 
      title: workshopName, 
      content,
      breadcrumbs 
    }))
  }

  // Generate individual public file pages with proper parent links
  for (const file of publicFiles) {
    const referencedAssets = assets
      .filter((asset) => Array.from(asset.references || []).some((ref) => ref.slug === file.slug && ref.filename === file.filename))
      .map((asset) => linkTo(`entities/assets/${asset.assetPath}.html`, asset.publicPath))

    // Determine parent workshop
    const workshopLink = file.workshopId
      ? linkTo(`entities/public/workshops/${file.workshopId}/index.html`, file.workshopId)
      : ''

    // Determine siblings (other files in same category/workshop)
    const siblings = publicFiles.filter(f => 
      f.workshopId === file.workshopId && 
      f.category === file.category && 
      f.slug !== file.slug
    ).map(f => linkTo(`entities/public/${f.slug}.html`, f.filename.replace('.json', '')))

    // Build breadcrumbs
    const breadcrumbs = [
      { label: 'Main', href: '../../index.html' },
      { label: 'Public Files', href: 'index.html' }
    ]
    if (file.workshopId) {
      breadcrumbs.push({ label: file.workshopId, href: `workshops/${file.workshopId}/index.html` })
    }
    breadcrumbs.push({ label: file.filename, href: null })

    // Category label
    const categoryLabels = {
      'workshop': 'Workshop Config',
      'room': 'Room Config',
      'effects': 'Effects Config',
      'burners': 'Burner',
      'ac-units': 'AC Unit',
      'air-handlers': 'Air Handler'
    }

    const content = `
      ${renderInfobox(file.filename, [
        { label: 'Type', value: categoryLabels[file.category] || 'Public JSON' },
        { label: 'Path', value: escapeHtml(file.slug + '.json') },
        { label: 'Workshop', value: workshopLink },
        { label: 'Category', value: file.category ? escapeHtml(file.category) : '' },
        { label: 'Siblings', value: siblings.length ? renderLinkList(siblings) : '' },
        { label: 'Referenced assets', value: referencedAssets.length ? renderLinkList(referencedAssets) : '' }
      ])}
      <section class="section">
        ${renderEntityHeader(file.filename, categoryLabels[file.category] || 'Public JSON')}
      </section>
      <section class="section">
        <h2>Raw data</h2>
        ${renderCodeBlock(file.content, 'json')}
      </section>
    `
    await writePage(`entities/public/${file.slug}.html`, page({ 
      title: file.filename, 
      content,
      breadcrumbs 
    }))
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
  const orphanSymbols = findOrphanSymbols(symbols)
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

  // Orphan scripts report - use standardized detection utility
  const scriptNames = Object.keys(scriptMetadata).map(name => name.replace(/\.js$/, ''))
  const { scriptAnalysis, trulyOrphanScripts } = await detectScriptUsage(
    repoRoot,
    scriptDependents,
    scriptDependencies,
    scriptNames
  )

  const orphanScriptLinks = scriptAnalysis.filter(s => s.isOrphan).map(analysis => {
    const selfRefBadge = analysis.hasSelfReference ? ' ⚠️' : ''
    const chainInfo = analysis.dependencyCount > 0 ? ` (depends: ${analysis.dependencyChain})` : ''
    return `<li>${escapeHtml(analysis.name)}${selfRefBadge}${chainInfo}</li>`
  }).join('')

  await writePage('entities/reports/orphan-scripts.html', page({
    title: 'Orphan Scripts',
    content: `
      <section class="section">
        ${renderEntityHeader('Orphan Scripts', 'Scripts with no usage: no dependents, build system, or game code')}
        <p>These scripts are not used by: other scripts, build system (package.json), or game code (src/).</p>
        ${trulyOrphanScripts.length > 0 ? `<p><strong>Total: ${trulyOrphanScripts.length}</strong></p>` : ''}
        ${orphanScriptLinks ? `<ul>${orphanScriptLinks}</ul>` : '<p><strong>None found!</strong> All scripts are in use.</p>'}
        
        <h3 style="margin-top: 24px;">Script Usage Summary</h3>
        <ul>
        ${scriptAnalysis.map(s => {
          const icon = s.isOrphan ? '⭕' : '✅'
          return `<li><strong>${icon} ${escapeHtml(s.name)}</strong>: Used by ${escapeHtml(s.usageStr)}</li>`
        }).join('')}
        </ul>
        
        <p style="font-size: 0.9em; color: #666; margin-top: 16px;">
          <strong>⚠️ = Self-referencing script</strong> (calls itself - check for recursion/circular logic)
        </p>
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

  // Generate file-scanning based orphan reports (docs, styles, root files, solutions, phases, equipment)
  await generateOrphanReports({
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
  })

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
