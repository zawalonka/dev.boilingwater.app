/**
 * Wiki Page Builder
 * 
 * Utilities for generating and writing HTML pages
 */

import fs from 'fs/promises'
import path from 'path'

const wikiBase = '/wiki'

/**
 * Base page template with header/footer/nav
 */
export const page = ({ title = 'Boiling Water Wiki', content = '', breadcrumbs = null }) => {
  const breadcrumbsHtml = breadcrumbs
    ? `
      <nav class="breadcrumbs">
        ${breadcrumbs.map((item, idx) => {
          if (idx === breadcrumbs.length - 1) {
            return `<span class="current">${item}</span>`
          }
          return `<a href="#">${item}</a> / `
        }).join(' ')}
      </nav>
    `
    : ''

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)} - Boiling Water Wiki</title>
  <link rel="stylesheet" href="${wikiBase}/assets/styles.css" />
  <link rel="stylesheet" href="${wikiBase}/assets/kekule/kekule.min.css" />
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
              <a href="${wikiBase}/index.html">📚 Main page</a>
            </div>
            <div class="menu-section">
              <div class="menu-heading">Science</div>
              <a href="${wikiBase}/entities/elements/index.html">⚛️ Elements</a>
              <a href="${wikiBase}/entities/compounds/index.html">🧪 Compounds</a>
              <a href="${wikiBase}/entities/solutions/index.html">💧 Solutions</a>
              <a href="${wikiBase}/entities/phases/index.html">❄️ Phases</a>
            </div>
            <div class="menu-section">
              <div class="menu-heading">Game Structure</div>
              <a href="${wikiBase}/entities/levels/index.html">📊 Levels</a>
              <a href="${wikiBase}/entities/experiments/index.html">🔬 Experiments</a>
            </div>
            <div class="menu-section">
              <div class="menu-heading">Code Reference</div>
              <a href="${wikiBase}/entities/formulas/index.html">📐 Formulas</a>
              <a href="${wikiBase}/entities/processes/index.html">⚙️ Processes</a>
              <a href="${wikiBase}/entities/modules/index.html">📦 Modules</a>
              <a href="${wikiBase}/entities/symbols/index.html">🔣 Symbols</a>
              <a href="${wikiBase}/entities/public/index.html">📁 Public Files</a>
              <a href="${wikiBase}/entities/assets/index.html">🖼️ Assets</a>
            </div>
            <div class="menu-section">
              <div class="menu-heading">Repository</div>
              <a href="${wikiBase}/entities/docs/index.html">📖 Docs</a>
              <a href="${wikiBase}/entities/scripts/index.html">🧰 Scripts</a>
              <a href="${wikiBase}/entities/styles/index.html">🎨 Styles</a>
              <a href="${wikiBase}/entities/root-files/index.html">🗂️ Root Files</a>
              <a href="${wikiBase}/entities/reports/changes-since-last-commit.html">🧭 Changes</a>
            </div>
            <div class="wiki-menu-divider"></div>
            <a href="/">⬅️ Back to Game</a>
          </nav>
        </details>
        
        <div class="wiki-topbar-title">${escapeHtml(title)}</div>
      </header>
      <main class="wiki-content">
        ${breadcrumbsHtml}
        <article class="wiki-article">
          ${content}
        </article>
      </main>
    </div>
  </div>
  <script src="https://cdn.jsdelivr.net/npm/prismjs@1.29.0/prism.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/prismjs@1.29.0/plugins/line-numbers/prism-line-numbers.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/prismjs@1.29.0/components/prism-javascript.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/prismjs@1.29.0/plugins/line-numbers/prism-line-numbers.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/prismjs@1.29.0/components/prism-jsx.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/prismjs@1.29.0/components/prism-tsx.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/prismjs@1.29.0/components/prism-css.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/prismjs@1.29.0/components/prism-json.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/prismjs@1.29.0/components/prism-markdown.min.js"></script>
  <script src="${wikiBase}/assets/kekule/kekule.min.js"></script>
  <script>
    (() => {
      const nodes = Array.from(document.querySelectorAll('[data-smiles]'))
      if (!nodes.length) return
      const init = () => {
        if (!window.Kekule || !window.Kekule.ChemWidget || !window.Kekule.IO) {
          nodes.forEach((node) => node.classList.add('molecule-fallback'))
          return
        }
        nodes.forEach((node) => {
          const smiles = node.getAttribute('data-smiles')
          const widget = new window.Kekule.ChemWidget.Viewer(node)
          widget.setChemObj(window.Kekule.IO.loadMimeData(smiles, 'chemical/x-mdl-smiles'))
          widget.setDimension(300, 200)
        })
      }
      const checkKekule = setInterval(() => {
        if (window.Kekule && window.Kekule.ChemWidget && window.Kekule.IO) {
          clearInterval(checkKekule)
          init()
        }
      }, 100)
      setTimeout(() => clearInterval(checkKekule), 5000)
    })()
  </script>
</body>
</html>`
}

/**
 * Write page to disk with proper directory creation
 */
export const writePage = async (filePath, content, { distRoot = null } = {}) => {
  const dir = distRoot || process.env.WIKI_DIST_ROOT
  const fullPath = path.join(dir, filePath)
  const dir_path = path.dirname(fullPath)

  await fs.mkdir(dir_path, { recursive: true })
  await fs.writeFile(fullPath, content, 'utf-8')
}

/**
 * Create link to another wiki page
 */
export const linkTo = (href, text, attrs = {}) => {
  const attrStr = Object.entries(attrs)
    .map(([key, value]) => `${key}="${escapeHtml(String(value))}"`)
    .join(' ')
  
  const baseHref = href.startsWith('/') ? href : `${wikiBase}/${href}`
  const space = attrStr ? ' ' : ''
  return `<a href="${baseHref}"${space}${attrStr} style="color: #0969da;">${escapeHtml(text)}</a>`
}

/**
 * Create module/file link with consistent formatting
 */
export const moduleLinkList = (items, labelOverride) => items
  .sort((a, b) => a.slug.localeCompare(b.slug))
  .map((mod) => linkTo(`entities/modules/${mod.slug}.html`, labelOverride ? labelOverride(mod) : mod.slug))

/**
 * Escape HTML special characters
 */
export const escapeHtml = (value) => value
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;')

/**
 * Get base path with trailing slash
 */
export const withBase = (path) => `${wikiBase}/${path}`
