# Wiki Generator Refactoring - Utility Extraction

## Overview

The wiki generator (`index.js`) has been refactored to extract large logical components into separate, reusable utility files. This improves:

- **Maintainability**: Each file has a single responsibility
- **Reusability**: Functions can be imported in other tools
- **Testability**: Utilities can be tested independently
- **Readability**: Shorter, focused files are easier to understand

---

## Utility Files

### 1. **orphanDetection.js**
Standardized entity usage detection across multiple sources.

**Exports:**
- `detectScriptUsage()` - Scripts used by build system, game code, or other scripts
- `detectDocUsage()` - Documentation referenced in game code
- `detectStyleUsage()` - Stylesheets imported in game code
- `detectFileUsage()` - Files referenced in source code
- `buildUsageAnalysis()` - Generic usage analyzer for any entity type

**Why extracted:**
- Same pattern needed for all entity orphan reports
- Should be standardized, not reimplemented multiple times
- Will grow with new detection types (config references, etc.)

---

### 2. **renderHelpers.js**
HTML rendering functions for consistent wiki output.

**Exports:**
- `renderJson()` - Format JSON data as code block
- `renderCodeBlock()` - Render code with syntax highlighting
- `renderCodeSnippet()` - Interactive expandable code example
- `renderList()` - Unordered list HTML
- `renderLinkList()` - List of links
- `renderAssetTree()` - Hierarchical asset folder display
- `renderPeriodicTable()` - Element grid organized by category
- `renderFileList()` - File list with code-style formatting
- `renderParagraphs()` - Convert text to HTML paragraphs
- `renderEducationalSection()` - Educational content box
- `renderEntityHeader()` - Standard entity page header
- `renderInfobox()` - Side panel with metadata
- Helper utilities: `escapeHtml()`, `titleCase()`, `toSlug()`, `getEducationalNotes()`

**Why extracted:**
- Used repeatedly throughout page generation
- Standardizes wiki appearance
- Easy to adjust styling across all pages
- Duplicated code can now be DRY principle compliant

---

### 3. **dataBuilders.js**
Functions for scanning filesystem and building entity data structures.

**Exports:**
- `buildElements()` - Load all 118 periodic table elements
- `buildCompounds()` - Load pure compounds or solutions
- `buildPhases()` - Load phase states with compound mapping
- `buildLevelsAndExperiments()` - Load game structure from constants
- `buildFormulas()` - Scan physics formulas directory
- `buildProcesses()` - Scan physics processes directory
- `buildModules()` - Build all code module entities
- `buildPublicFiles()` - Build public/config file entities
- `buildAssets()` - Scan and categorize image/video/font assets

**Why extracted:**
- All data loading logic in one place
- Easy to modify scanning patterns
- Can be reused in other tools
- Clear what data is available

---

### 4. **pageBuilder.js**
HTML page generation and file I/O utilities.

**Exports:**
- `page()` - Base HTML template with navigation/header/footer
- `writePage()` - Write HTML to disk with directory creation
- `linkTo()` - Create internal wiki links
- `moduleLinkList()` - Generate sorted list of module links
- Helper utilities: `escapeHtml()`, `withBase()`

**Why extracted:**
- Page template is reused for every entity page
- File writing logic shouldn't be in main generator
- Link generation is consistent across wiki

---

## File Organization Map

```
wiki/src/
├── index.js                 # Main orchestrator (dramatically shorter now)
├── orphanDetection.js       # Orphan/usage detection logic
├── renderHelpers.js         # HTML rendering functions
├── dataBuilders.js          # Filesystem scanning & data loading
├── pageBuilder.js           # Page templates & file writing
├── sync.js                  # Wiki sync to public/wiki
└── README.md
```

---

## Dependency Graph

```
index.js
├── orphanDetection.js      ← Comprehensive usage detection
├── renderHelpers.js        ← All HTML rendering
├── dataBuilders.js         ← All data loading
└── pageBuilder.js          ← All page generation
```

- **No circular dependencies**
- **One-way dependency flow** (index imports utilities, utilities don't import index)
- **Each utility is independent** (can be used standalone)

---

## Next Steps

### Immediate
- ✅ Extract orphan detection (done)
- ✅ Extract render helpers (done)
- ✅ Extract data builders (done)
- ✅ Extract page builders (done)

### Soon
1. Update `index.js` to import and use these utilities
2. Verify wiki still builds correctly
3. All orphan reports should use `detectScriptUsage()` pattern

### Future Enhancements
- Extract page-generation logic for specific entity types
- Create reusable orphan report generator function
- Add entity type detection/registration system
- Consider symbol analysis extraction

---

## Maintenance Notes

- **When adding a new rendering style**: Add to `renderHelpers.js`
- **When adding a new data source**: Add builder to `dataBuilders.js`
- **When improving orphan detection**: Update `orphanDetection.js`
- **When modifying page structure**: Update `pageBuilder.js`

---

**Status**: Utilities created, ready to integrate into index.js
