/**
 * Wiki Rendering Helpers
 * 
 * Standardized HTML rendering functions for consistent wiki output
 */

export const renderJson = (data) => {
  const json = JSON.stringify(data, null, 2)
  return `<pre style="background: #f5f5f5; padding: 12px; border-radius: 4px; overflow-x: auto;"><code>${escapeHtml(json)}</code></pre>`
}

export const renderCodeBlock = (code, language = 'javascript') => {
  const escaped = escapeHtml(code)
  const highlighted = escaped
  return `<pre class="language-${language} line-numbers"><code class="language-${language}">${highlighted}</code></pre>`
}

export const renderCodeSnippet = (code, description, title = 'Code Example') => {
  return `
    <details style="margin: 16px 0; padding: 12px; background: #f9f9f9; border-left: 3px solid #0969da;">
      <summary style="cursor: pointer; font-weight: 600;">${escapeHtml(title)}</summary>
      <p style="margin-top: 12px; color: #666;">${escapeHtml(description)}</p>
      ${renderCodeBlock(code)}
    </details>
  `
}

export const renderList = (items) => `<ul>${items.map((item) => `<li>${item}</li>`).join('')}</ul>`

export const renderLinkList = (items) => renderList(items)

export const renderAssetTree = (assets) => {
  let html = '<ul style="list-style: none; padding-left: 0;">'

  const renderNode = (node, depth = 0) => {
    const indent = '  '.repeat(depth)
    if (node.type === 'folder') {
      html += `<li style="margin: 4px 0;"><strong>📁 ${escapeHtml(node.name)}/</strong></li>`
      html += '<ul style="list-style: none; padding-left: 20px;">'
      if (node.children) {
        for (const child of node.children) {
          renderNode(child, depth + 1)
        }
      }
      html += '</ul>'
    } else {
      const icon = node.type === 'image' ? '🖼️' : node.type === 'video' ? '🎥' : '📄'
      html += `<li style="margin: 4px 0;">${icon} ${escapeHtml(node.name)}</li>`
    }
  }

  for (const asset of assets) {
    renderNode(asset)
  }

  html += '</ul>'
  return html
}

export const renderPeriodicTable = (elements) => {
  const categories = {}
  for (const element of elements) {
    const cat = element.category || 'other'
    if (!categories[cat]) categories[cat] = []
    categories[cat].push(element)
  }

  const categoryOrder = [
    'nonmetal',
    'halogen',
    'noble-gas',
    'alkali-metal',
    'alkaline-earth-metal',
    'transition-metal',
    'post-transition-metal',
    'metalloid',
    'lanthanide',
    'actinide'
  ]

  let html = '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; margin: 16px 0;">'

  for (const category of categoryOrder) {
    if (!categories[category] || categories[category].length === 0) continue

    html += `<fieldset style="border: 1px solid #ddd; padding: 12px; border-radius: 6px;">
      <legend style="font-weight: 600; padding: 0 8px;">${escapeHtml(category.replace(/-/g, ' '))}</legend>
      <ul style="list-style: none; padding: 0; margin: 0;">`

    for (const element of categories[category]) {
      const href = `entities/elements/${element.slug}.html`
      html += `<li style="margin: 4px 0;"><a href="/wiki/${href}" style="color: #0969da; text-decoration: none;">${escapeHtml(element.symbol)} - ${escapeHtml(element.name)}</a></li>`
    }

    html += `</ul></fieldset>`
  }

  html += '</div>'
  return html
}

export const renderFileList = (items) => {
  return renderList(items.map((item) => `<code style="background: #f0f0f0; padding: 2px 6px; border-radius: 3px;">${escapeHtml(item)}</code>`))
}

export const renderParagraphs = (value) => {
  if (!value) return ''
  const text = String(value).trim()
  const paragraphs = text.split(/\n\n+/).filter(Boolean)
  return paragraphs.map((p) => `<p style="line-height: 1.6; margin: 12px 0;">${escapeHtml(p)}</p>`).join('')
}

export const renderEducationalSection = (value, useDocParser = false) => {
  if (!value) return ''

  const text = String(value).trim()
  if (!text) return ''

  return `
    <section class="educational" style="background: #f0f8ff; padding: 16px; border-left: 4px solid #0969da; border-radius: 4px; margin: 16px 0;">
      <h3 style="margin-top: 0; color: #0969da;">Educational Notes</h3>
      ${renderParagraphs(text)}
    </section>
  `
}

export const renderEntityHeader = (title, subtitle) => `
  <div class="entity-header">
    <h1>${escapeHtml(title)}</h1>
    ${subtitle ? `<p class="subtitle">${escapeHtml(subtitle)}</p>` : ''}
  </div>
`

export const renderInfobox = (title, rows) => {
  const rowsHtml = rows
    .filter((row) => row.value)
    .map((row) => `<tr><td style="font-weight: 600; padding: 8px; border-bottom: 1px solid #e0e0e0;">${escapeHtml(row.label)}</td><td style="padding: 8px; border-bottom: 1px solid #e0e0e0;">${row.value}</td></tr>`)
    .join('')

  return `
    <aside class="infobox" style="float: right; width: 300px; margin: 0 0 16px 16px; border: 1px solid #ddd; border-radius: 6px; padding: 16px; background: #f9f9f9;">
      <h2 style="margin-top: 0;">${escapeHtml(title)}</h2>
      <table style="width: 100%; border-collapse: collapse;">
        ${rowsHtml}
      </table>
    </aside>
  `
}

/**
 * Get educational notes from an entity
 */
export const getEducationalNotes = (data) => {
  if (!data) return ''
  return data.educationalNotes || data.educational || data.educationalValue || ''
}

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
 * Title case utility
 */
export const titleCase = (str) => {
  return str
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

/**
 * Convert to URL-safe slug
 */
export const toSlug = (text) => {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
}
