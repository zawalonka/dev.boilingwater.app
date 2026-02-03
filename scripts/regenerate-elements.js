#!/usr/bin/env node
/**
 * Smart Element Data Regenerator
 * 
 * Intelligently updates element JSON files from PubChem/NIST sources.
 * Only fetches and updates data when necessary.
 * 
 * Usage:
 *   node regenerate-elements.js                    # Check existing, make no changes
 *   node regenerate-elements.js --update           # Update with new data fields (e.g., phase data)
 *   node regenerate-elements.js --recreate         # EMERGENCY ONLY: Full rebuild from scratch
 * 
 * How it works:
 * 1. Scans existing element JSONs to determine current schema
 * 2. If --update: Fetches ONLY new fields from PubChem
 * 3. If --recreate: Rebuilds all 118 elements from scratch (commented out, use carefully)
 * 4. Reports changes made and files updated
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ELEMENTS_DIR = path.join(__dirname, '../src/data/substances/periodic-table');
const TEMP_OUTPUT_DIR = path.join(ELEMENTS_DIR, '_regen-temp');
const ELEMENTS_GAMEPLAY_DIR = path.join(__dirname, '../src/data/substances/elements');

// Parse command-line arguments
const args = process.argv.slice(2);
const UPDATE_MODE = args.includes('--update');
const RECREATE_MODE = args.includes('--recreate');
const EXPORT_RAW_MODE = args.includes('--export-raw');
const LIMIT_ARG = args.find(arg => arg.startsWith('--limit='));
const EXPORT_LIMIT = LIMIT_ARG ? Number.parseInt(LIMIT_ARG.split('=')[1], 10) : null;

// ============================================================================
// SCHEMA DEFINITIONS
// ============================================================================

/**
 * Current schema - what we have in existing files
 */
const CURRENT_SCHEMA = {
  atomicNumber: 'number',
  symbol: 'string',
  name: 'string',
  elementCategory: 'string',
  chemicalBlock: 'string',
  valenceElectrons: 'number',
  oxidationStates: 'array',
  standardUsed: 'string',
  nist: 'object',
  iupac: 'object',
  physicalProperties: 'object',
  lastUpdated: 'string',
  educationalNotes: 'string',
  diffusion: 'object'
};

/**
 * New fields to add when --update is used
 * This is what we want to ADD to existing files
 */
const NEW_FIELDS_UPDATE = {
  physicalProperties: {
    phases: {
      gas: { description: 'Gas phase properties' },
      liquid: { description: 'Liquid phase properties' },
      solid: { description: 'Solid phase properties' }
    }
  }
};

/**
 * Full schema if recreating from scratch (COMMENTED OUT - dangerous)
 * Only use if files are corrupted or lost
 */
const FULL_SCHEMA_FROM_SCRATCH = {
  // Include all fields for fresh generation
  // ... would include everything ...
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Detect what fields are missing from an existing element JSON
 */
function detectMissingFields(existingJson) {
  const missing = [];
  
  // Check for phase data in physicalProperties
  if (existingJson.physicalProperties && !existingJson.physicalProperties.phases) {
    missing.push('physicalProperties.phases');
  }
  
  // Add more detection logic here as needed
  
  return missing;
}

/**
 * Load all existing element files and analyze schema
 */
function analyzeExistingElements() {
  if (!fs.existsSync(ELEMENTS_DIR)) {
    console.log('❌ Elements directory not found. Run with --recreate to build from scratch.');
    return null;
  }

  let files = fs.readdirSync(ELEMENTS_DIR).filter(f => f.endsWith('.json'));
  if (Number.isFinite(EXPORT_LIMIT)) {
    files = files.slice(0, EXPORT_LIMIT);
  }
  
  if (files.length === 0) {
    console.log('❌ No element files found. Run with --recreate to build from scratch.');
    return null;
  }

  console.log(`📊 Found ${files.length} existing element files`);
  
  // Analyze first file to detect schema
  const samplePath = path.join(ELEMENTS_DIR, files[0]);
  const sample = JSON.parse(fs.readFileSync(samplePath, 'utf8'));
  
  console.log(`📋 Sample element schema: ${Object.keys(sample).join(', ')}`);
  
  // Check all files for missing fields
  const filesNeedingUpdate = [];
  
  for (const file of files) {
    const filePath = path.join(ELEMENTS_DIR, file);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const missing = detectMissingFields(data);
    
    if (missing.length > 0) {
      filesNeedingUpdate.push({ file, missing });
    }
  }
  
  return {
    totalFiles: files.length,
    filesNeedingUpdate,
    sampleSchema: Object.keys(sample)
  };
}

function ensureTempOutputDir() {
  if (!fs.existsSync(TEMP_OUTPUT_DIR)) {
    fs.mkdirSync(TEMP_OUTPUT_DIR, { recursive: true });
  }
}

/**
 * NOTE: PubChem HTML structure requires proper parsing to extract ALL sources
 * 
 * Expected sources for each property:
 * - Atomic Weight: NIST (with uncertainty range), IUPAC, CAS
 * - Electronegativity: Pauling scale, Allred-Rochow, Sanderson
 * - Atomic Radius: Covalent, Van der Waals, Metallic
 * - Ionization Energy: First IE, subsequent IEs per shell
 * 
 * Current implementation does basic pattern matching.
 * For production, consider:
 * 1. Puppeteer/Playwright for JavaScript-rendered content
 * 2. PubChem's non-public XML API if available
 * 3. Manual JSON catalog of authoritative values with full citations
 */

/**
 * Fetch element data from PubChem
 * Extracts ALL sources and values for each property
 */
async function fetchPubChemElementData(atomicNumber, symbol) {
  try {
    const url = `https://pubchem.ncbi.nlm.nih.gov/rest/pug_view/data/element/${atomicNumber}/JSON`;
    const response = await fetch(url);
    
    if (!response.ok) {
      console.warn(`    ⚠️  Could not fetch PubChem data for ${symbol} (HTTP ${response.status})`);
      return null;
    }

    const data = await response.json();
    const { allProperties, sourcesByName, referenceIndex } = extractAllPropertiesFromPubChemJson(data);
    const education = extractEducationalNotesFromPubChemJson(data);
    const propertyNotes = extractPropertyNotesFromPubChemProperties(allProperties);

    // Keep a small set of convenience fields for quick comparisons
    const parsed = {
      symbol,
      atomicNumber,
      atomicMass: pickPropertyList(allProperties, ['Atomic Weight', 'Relative Atomic Mass', 'Standard Atomic Weight']),
      electronegativity: pickPropertyList(allProperties, ['Electronegativity', 'Electronegativity (Pauling)']),
      ionizationEnergy: pickPropertyList(allProperties, ['Ionization Energy', 'First Ionization Energy']),
      atomicRadius: pickPropertyList(allProperties, ['Atomic Radius', 'Atomic Radius (Covalent)', 'Atomic Radius (Van der Waals)']),
      electronAffinity: pickPropertyList(allProperties, ['Electron Affinity']),
      meltingPoint: pickPropertyList(allProperties, ['Melting Point']),
      boilingPoint: pickPropertyList(allProperties, ['Boiling Point']),
      density: pickPropertyList(allProperties, ['Density']),
      thermalConductivity: pickPropertyList(allProperties, ['Thermal Conductivity']),
      properties: allProperties,
      sourcesByName,
      references: referenceIndex,
      source: 'PubChem PUG-View (NIH - multiple authoritative sources)',
      education: {
        ...education,
        propertyNotes
      }
    };
    
    return parsed;
  } catch (error) {
    console.warn(`    ⚠️  Error fetching ${symbol}: ${error.message}`);
    return null;
  }
}

/**
 * Extract property values and sources from PubChem HTML tables
 * Returns array of { value, source, note } objects
 */
function extractPropertyFromTable(html, propertyPattern) {
  const results = [];
  
  // Match table rows containing the property
  // Format: <tr>...<td>Property Name</td>...<td>123.45</td>...<td>Source Info</td>...</tr>
  const rowPattern = new RegExp(`<tr[^>]*>.*?${propertyPattern}.*?</tr>`, 'gi');
  const tablePattern = /<table[^>]*>[\s\S]*?<\/table>/gi;
  
  let tableMatch;
  while ((tableMatch = tablePattern.exec(html)) !== null) {
    const table = tableMatch[0];
    
    let rowMatch;
    const localRowPattern = new RegExp(`<tr[^>]*>.*?${propertyPattern}.*?</tr>`, 'gi');
    while ((rowMatch = localRowPattern.exec(table)) !== null) {
      const row = rowMatch[0];
      
      // Extract all <td> contents
      const tdPattern = /<td[^>]*>(.*?)<\/td>/gi;
      const tds = [];
      let tdMatch;
      while ((tdMatch = tdPattern.exec(row)) !== null) {
        // Clean up HTML tags
        const text = tdMatch[1]
          .replace(/<[^>]*>/g, '')
          .replace(/&nbsp;/g, ' ')
          .replace(/&amp;/g, '&')
          .trim();
        if (text) tds.push(text);
      }
      
      // Extract value and source from cells
      if (tds.length >= 2) {
        // Usually: [Property, Value, Source/Notes]
        const value = tds[1]?.match(/[\d.±+\-]/g)?.join('') || tds[1];
        const source = tds[2] || tds.slice(2).join(' ') || 'Unknown';
        
        if (value && !isNaN(parseFloat(value))) {
          results.push({
            value: parseFloat(value),
            rawValue: value,
            source: source.substring(0, 100), // Truncate long source strings
            note: tds.slice(3).join(' ')
          });
        }
      }
    }
  }
  
  // Deduplicate
  const unique = [];
  const seen = new Set();
  for (const result of results) {
    const key = result.value.toString();
    if (!seen.has(key)) {
      unique.push(result);
      seen.add(key);
    }
  }
  
  return unique.length > 0 ? unique : null;
}

/**
 * Load phase state data for an element's pure form
 * Elements are stored as compounds with phase folders
 * For now, returns empty object (elements don't have compound entries yet)
 * This is a placeholder for future water/element state data
 */
function loadElementPhaseStates(elementSymbol) {
  const states = {
    solid: null,
    liquid: null,
    gas: null
  };
  
  // Elements don't have state.json files like compounds do
  // Phase properties are derived from PubChem properties (meltingPoint, boilingPoint, density, etc.)
  // This function serves as a placeholder for future structured state data
  
  return states;
}

/**
 * Build phase state summaries from element properties
 * Derives phase info from meltingPoint, boilingPoint, and phase-specific properties
 */
function buildPhaseDataFromProperties(props) {
  const phases = {};
  
  // Check if element has solid phase (has meltingPoint or melting point data)
  if (props.meltingPoint) {
    phases.solid = {
      phaseName: props.physicalDescription?.includes('Gas') ? null : 'solid',
      meltingPoint: props.meltingPoint,
      density: props.density && !props.physicalDescription?.includes('Gas') ? props.density : null,
      specificHeat: null,
      thermalConductivity: props.thermalConductivity
    };
  }
  
  // Check if element has liquid phase (has boilingPoint and not pure gas)
  if (props.boilingPoint) {
    phases.liquid = {
      phaseName: 'liquid',
      boilingPoint: props.boilingPoint,
      meltingPoint: props.meltingPoint,
      density: props.density,
      specificHeat: null,
      thermalConductivity: props.thermalConductivity
    };
  }
  
  // All elements have gas phase at sufficient temperature
  phases.gas = {
    phaseName: 'gas',
    density: props.density && props.physicalDescription?.includes('Gas') ? props.density : null,
    boilingPoint: props.boilingPoint,
    thermalConductivity: props.thermalConductivity
  };
  
  return phases;
}


function extractAllPropertiesFromPubChemJson(data) {
  const properties = [];
  const record = data?.Record;
  const referenceIndex = buildReferenceIndex(record?.Reference || []);

  const propertiesSection = (record?.Section || []).find(section => section.TOCHeading === 'Properties');
  const propertySections = propertiesSection?.Section || [];

  for (const section of propertySections) {
    const propertyName = section.TOCHeading;
    const infoList = section.Information || [];

    for (const info of infoList) {
      const rawValue = extractInfoValue(info);
      if (!rawValue) continue;

      const numeric = parseNumericValue(rawValue);
      const referenceNumber = info.ReferenceNumber;
      const reference = referenceIndex[referenceNumber] || null;
      const sourceName = reference?.SourceName || 'Unknown';
      const sourceUrl = reference?.URL || '';

      properties.push({
        property: propertyName,
        value: Number.isFinite(numeric) ? numeric : rawValue,
        rawValue,
        source: sourceName,
        sourceUrl,
        licenseUrl: reference?.LicenseURL || '',
        licenseNote: reference?.LicenseNote || '',
        note: info.Name || info.Description || '',
        referenceNumber
      });
    }
  }

  return { allProperties: properties, sourcesByName: groupPropertiesBySource(properties), referenceIndex };
}

function extractEducationalNotesFromPubChemJson(data) {
  const record = data?.Record;
  const sections = record?.Section || [];
  const collected = {
    history: [],
    uses: [],
    production: [],
    safety: [],
    toxicity: [],
    environmental: [],
    biological: [],
    discovery: [],
    propertiesSummary: []
  };

  const targets = [
    { key: 'history', headings: ['History', 'History and Discovery'] },
    { key: 'discovery', headings: ['Discovery'] },
    { key: 'uses', headings: ['Uses', 'Use', 'Applications'] },
    { key: 'production', headings: ['Production', 'Preparation'] },
    { key: 'safety', headings: ['Safety', 'Safety and Hazards', 'Hazards', 'Health Hazards'] },
    { key: 'toxicity', headings: ['Toxicity'] },
    { key: 'environmental', headings: ['Environmental Effects', 'Environmental Hazard'] },
    { key: 'biological', headings: ['Biological Role'] },
    { key: 'propertiesSummary', headings: ['Description', 'Summary', 'Overview'] }
  ];

  const flatSections = flattenSections(sections);
  for (const section of flatSections) {
    const heading = section.TOCHeading || '';
    const target = targets.find(item => item.headings.some(h => heading.toLowerCase() === h.toLowerCase()));
    if (!target) continue;
    const notes = extractSectionText(section);
    if (notes.length > 0) {
      collected[target.key].push(...notes);
    }
  }

  return collected;
}

function extractPropertyNotesFromPubChemProperties(allProperties) {
  const notesByProperty = {};
  for (const item of allProperties) {
    if (!item.note || typeof item.note !== 'string') continue;
    const note = item.note.trim();
    if (!note) continue;
    const propertyKey = item.property || 'Unknown';
    if (!notesByProperty[propertyKey]) {
      notesByProperty[propertyKey] = new Set();
    }
    notesByProperty[propertyKey].add(note);
  }

  const cleaned = {};
  for (const [property, noteSet] of Object.entries(notesByProperty)) {
    const uniqueNotes = Array.from(noteSet)
      .map(note => note.replace(/\s+/g, ' ').trim())
      .filter(note => note && note.toLowerCase() !== property.toLowerCase());

    if (uniqueNotes.length <= 1) {
      continue;
    }

    cleaned[property] = uniqueNotes;
  }

  return cleaned;
}

function flattenSections(sectionList) {
  const flattened = [];
  for (const section of sectionList) {
    flattened.push(section);
    const childSections = section?.Section || [];
    if (childSections.length > 0) {
      flattened.push(...flattenSections(childSections));
    }
  }
  return flattened;
}

function extractSectionText(section) {
  const notes = [];
  const infoList = section?.Information || [];
  for (const info of infoList) {
    const value = extractInfoValue(info);
    if (value && value.trim()) {
      notes.push(value.trim());
    }
  }
  return notes;
}

function buildReferenceIndex(references) {
  const index = {};
  for (const ref of references) {
    if (ref.ReferenceNumber != null) {
      index[ref.ReferenceNumber] = ref;
    }
  }
  return index;
}

function extractInfoValue(info) {
  const markup = info?.Value?.StringWithMarkup;
  if (Array.isArray(markup) && markup.length > 0) {
    return markup.map(item => item.String).join('');
  }

  if (typeof info?.Value?.String === 'string') {
    return info.Value.String;
  }

  if (typeof info?.Value?.Number === 'number') {
    return info.Value.Number.toString();
  }

  return null;
}

function parseNumericValue(rawValue) {
  const valueMatch = rawValue.match(/[\d.±+\-]/g);
  const numeric = valueMatch ? parseFloat(valueMatch.join('')) : null;
  return Number.isFinite(numeric) ? numeric : null;
}

function pickPropertyList(allProperties, names) {
  for (const name of names) {
    const matches = allProperties.filter(item => item.property === name);
    if (matches.length > 0) return matches;
  }
  return null;
}

function groupPropertiesBySource(allProperties) {
  const sources = {};
  for (const item of allProperties) {
    const sourceList = splitSources(item.source);
    for (const sourceName of sourceList) {
      const key = normalizeSourceKey(sourceName);
      if (!sources[key]) {
        sources[key] = {
          source: sourceName,
          sourceUrl: item.sourceUrl || '',
          licenseUrl: item.licenseUrl || '',
          licenseNote: item.licenseNote || '',
          referenceNumber: item.referenceNumber ?? null,
          fields: {}
        };
      }

      if (!sources[key].fields[item.property]) {
        sources[key].fields[item.property] = [];
      }

      sources[key].fields[item.property].push({
        value: item.value,
        rawValue: item.rawValue,
        note: item.note || ''
      });
    }
  }

  return sources;
}

function splitSources(sourceText) {
  if (!sourceText) return ['Unknown'];
  return sourceText
    .split(/\s*[;|]\s*|\s*\/\s*|\s*,\s*/)
    .map(s => s.trim())
    .filter(Boolean);
}

function normalizeSourceKey(sourceName) {
  return sourceName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function flattenSourceBlock(sourceData) {
  const flattened = {
    source: sourceData.source,
    sourceUrl: sourceData.sourceUrl || '',
    licenseUrl: sourceData.licenseUrl || '',
    licenseNote: sourceData.licenseNote || '',
    referenceNumber: sourceData.referenceNumber ?? null
  };

  const fieldMap = {
    'Atomic Weight': 'atomicMass',
    'Electronegativity': 'electronegativity',
    'Ionization Energy': 'ionizationEnergy',
    'Atomic Radius': 'atomicRadius',
    'Electron Affinity': 'electronAffinity',
    'Melting Point': 'meltingPoint',
    'Boiling Point': 'boilingPoint',
    'Density': 'density',
    'Thermal Conductivity': 'thermalConductivity',
    'Electron Configuration': 'electronConfiguration',
    'Oxidation States': 'oxidationStates',
    'Ground Level': 'groundLevel',
    'Physical Description': 'physicalDescription',
    'Element Classification': 'elementClassification',
    'Standard Molar Entropy': 'standardMolarEntropy',
    'Specific Heat Capacity': 'specificHeatCapacity'
  };

  for (const [pubchemField, canonicalField] of Object.entries(fieldMap)) {
    if (sourceData.fields[pubchemField] && sourceData.fields[pubchemField].length > 0) {
      const firstValue = sourceData.fields[pubchemField][0];
      flattened[canonicalField] = firstValue.value;
      if (firstValue.rawValue !== firstValue.value.toString()) {
        flattened[`${canonicalField}_raw`] = firstValue.rawValue;
      }
      if (firstValue.note) {
        flattened[`${canonicalField}_note`] = firstValue.note;
      }
    }
  }

  return flattened;
}

/**
 * NEW: Consolidate all sources into single properties object.
 * Priority: DoE/Jefferson Lab > NIST > LANL > IUPAC > PubChem
 * Returns both properties AND source attribution for non-default values
 */
function consolidatePropertiesWithPriority(sources) {
  const properties = {};
  const DEFAULT_SOURCE = 'jefferson-lab'; // DoE and Jefferson share same URL; use Jefferson as label
  
  const fieldPriority = [
    'jefferson-lab',                  // Primary (DoE shares this URL)
    'u-s-department-of-energy',       // Same as Jefferson Lab
    'nist-physical-measurement-laboratory',
    'los-alamos-national-laboratory',
    'iupac-commission-on-isotopic-abundances-and-atomic-weights-ciaaw',
    'pubchem-elements'
  ];

  const propertyFields = [
    'atomicMass', 'electronegativity', 'ionizationEnergy', 'atomicRadius',
    'electronAffinity', 'meltingPoint', 'boilingPoint', 'density',
    'thermalConductivity', 'electronConfiguration', 'oxidationStates',
    'groundLevel', 'physicalDescription', 'elementClassification',
    'standardMolarEntropy', 'specificHeatCapacity'
  ];

  // For each property, find the highest-priority source that has it
  for (const field of propertyFields) {
    let foundValue = null;
    let foundSource = null;

    for (const sourceKey of fieldPriority) {
      const source = sources[sourceKey];
      if (source && source[field] !== undefined) {
        foundValue = source[field];
        foundSource = sourceKey;
        break;
      }
    }

    // Only include if found
    if (foundValue !== null) {
      // If from default source, just store the value
      if (foundSource === DEFAULT_SOURCE) {
        properties[field] = foundValue;
      } else {
        // If from alternate source, store value + source attribution
        properties[field] = foundValue;
        properties[`${field}_source`] = foundSource;
      }
    }
  }

  return properties;
}

function buildPropertySourceReferences(sources) {
  const sourceMap = {};
  const fieldPriority = [
    'jefferson-lab',
    'u-s-department-of-energy',
    'nist-physical-measurement-laboratory',
    'los-alamos-national-laboratory',
    'iupac-commission-on-isotopic-abundances-and-atomic-weights-ciaaw',
    'pubchem-elements'
  ];

  const propertyFields = [
    'atomicMass', 'electronegativity', 'ionizationEnergy', 'atomicRadius',
    'electronAffinity', 'meltingPoint', 'boilingPoint', 'density',
    'thermalConductivity', 'electronConfiguration', 'oxidationStates',
    'groundLevel', 'physicalDescription', 'elementClassification',
    'standardMolarEntropy', 'specificHeatCapacity'
  ];

  for (const field of propertyFields) {
    for (const sourceKey of fieldPriority) {
      const source = sources[sourceKey];
      if (source && source[field] !== undefined) {
        sourceMap[field] = sourceKey;
        break;
      }
    }
  }

  return sourceMap;
}

/**
 * Compare current element data against PubChem authoritative values
 * Shows ALL sources and their values from PubChem for comparison
 * 
 * CRITICAL FOR GAME: Atomic weight MUST be a singular precise value, not a range
 * Game uses atomicMass for stoichiometric calculations - ranges cause errors
 */
function compareWithPubChem(elementData, pubchemData) {
  if (!pubchemData) return [];
  
  const discrepancies = [];
  const fieldsToCheck = ['atomicMass', 'electronegativity', 'ionizationEnergy', 'atomicRadius', 'electronAffinity', 'meltingPoint', 'boilingPoint', 'density', 'thermalConductivity'];
  
  fieldsToCheck.forEach(field => {
    if (pubchemData[field] && Array.isArray(pubchemData[field])) {
      const nistValue = elementData.nist?.[field];
      const iupacValue = elementData.iupac?.[field];
      const nistSource = elementData.nist?.source;
      
      // ATOMIC WEIGHT SPECIAL CHECK: Must be singular, not range
      if (field === 'atomicMass') {
        if (nistValue && (nistValue.toString().includes('–') || nistValue.toString().includes('±'))) {
          discrepancies.push({
            field,
            severity: 'ERROR',
            issue: 'Atomic weight contains range/uncertainty - game needs singular precise value',
            current: { nist: nistValue, iupac: iupacValue, source: nistSource },
            pubchemSources: pubchemData[field],
            action: 'Must select single authoritative value from available sources'
          });
        }
      }
      
      // Check if our values appear in ANY of the PubChem sources
      const foundMatch = pubchemData[field].some(source => 
        Math.abs(parseFloat(source.value) - parseFloat(nistValue || 0)) < 0.001 ||
        Math.abs(parseFloat(source.value) - parseFloat(iupacValue || 0)) < 0.001
      );
      
      if (!foundMatch && nistValue) {
        discrepancies.push({
          field,
          severity: 'WARNING',
          issue: 'Value not found in PubChem sources - may be outdated',
          current: { nist: nistValue, iupac: iupacValue, source: nistSource },
          pubchemSources: pubchemData[field],
          mismatch: true
        });
      }
    }
  });
  
  return discrepancies;
}

// ============================================================================
// MAIN LOGIC
// ============================================================================

console.log('🔍 Element Data Regenerator\n');

// Analyze current state
const analysis = analyzeExistingElements();

if (!analysis) {
  process.exit(1);
}

console.log(`\n📈 Status:`);
console.log(`   Total files: ${analysis.totalFiles}`);
console.log(`   Files needing update (phase data): ${analysis.filesNeedingUpdate.length}`);

if (analysis.filesNeedingUpdate.length > 0) {
  console.log(`\n   Missing fields:`);
  analysis.filesNeedingUpdate.forEach(({ file, missing }) => {
    console.log(`     - ${file}: ${missing.join(', ')}`);
  });
}

// Determine action
if (EXPORT_RAW_MODE) {
  console.log('\n🧪 EXPORT RAW MODE: Fetching PubChem data and writing to temp folder...\n');
  ensureTempOutputDir();

  let files = fs.readdirSync(ELEMENTS_DIR).filter(f => f.endsWith('.json'));
  if (Number.isFinite(EXPORT_LIMIT)) {
    files = files.slice(0, EXPORT_LIMIT);
  }

  (async () => {
    let successCount = 0;
    let failCount = 0;

    for (const file of files) {
      const filePath = path.join(ELEMENTS_DIR, file);
      const elementData = JSON.parse(fs.readFileSync(filePath, 'utf8'));

      console.log(`📦 Exporting ${elementData.symbol} (${elementData.name})...`);

      const pubchemData = await fetchPubChemElementData(elementData.atomicNumber, elementData.symbol);

      if (!pubchemData) {
        console.log(`   ⚠️  PubChem fetch failed; skipping`);
        failCount += 1;
        continue;
      }

      // Flatten sourcesByName into per-source blocks
      const flattenedSources = {};

      if (pubchemData && pubchemData.sourcesByName) {
        for (const [key, sourceData] of Object.entries(pubchemData.sourcesByName)) {
          flattenedSources[key] = flattenSourceBlock(sourceData);
        }
      }

      // NEW: Consolidate sources into single properties object
      // DoE/Jefferson as primary, other sources only for gaps
      const consolidatedProperties = consolidatePropertiesWithPriority(flattenedSources);

      // Build source references map with URLs and licenses
      const sourceReferences = {};
      if (pubchemData && pubchemData.sourcesByName) {
        for (const [key, sourceData] of Object.entries(pubchemData.sourcesByName)) {
          sourceReferences[key] = {
            name: sourceData.source || key,
            url: sourceData.sourceUrl || '',
            licenseUrl: sourceData.licenseUrl || '',
            licenseNote: sourceData.licenseNote || ''
          };
        }
      }

      const exportPayload = {
        atomicNumber: elementData.atomicNumber,
        symbol: elementData.symbol,
        name: elementData.name,
        elementCategory: elementData.elementCategory,
        chemicalBlock: elementData.chemicalBlock,
        defaultSource: 'jefferson-lab (U.S. Dept of Energy)',
        _comment_properties: 'Property values from primary source (Jefferson Lab/DoE). Fields with _source suffix indicate fallback from alternate source.',
        properties: consolidatedProperties,
        states: buildPhaseDataFromProperties(consolidatedProperties),
        education: {
          _comment: 'Educational notes grouped by type for wiki generation.',
          history: pubchemData?.education?.history || [],
          discovery: pubchemData?.education?.discovery || [],
          uses: pubchemData?.education?.uses || [],
          production: pubchemData?.education?.production || [],
          safety: pubchemData?.education?.safety || [],
          toxicity: pubchemData?.education?.toxicity || [],
          environmental: pubchemData?.education?.environmental || [],
          biological: pubchemData?.education?.biological || [],
          propertiesSummary: pubchemData?.education?.propertiesSummary || [],
          propertyNotes: pubchemData?.education?.propertyNotes || {}
        },
        meta: {
          generatedAt: new Date().toISOString(),
          pubchemUrl: `https://pubchem.ncbi.nlm.nih.gov/element/${elementData.atomicNumber}`,
          pubchemSource: 'PubChem PUG-View (NIH - multiple authoritative sources)',
          dataSources: sourceReferences
        }
      };

      const outputPath = path.join(TEMP_OUTPUT_DIR, file);
      fs.writeFileSync(outputPath, JSON.stringify(exportPayload, null, 2));
      successCount += 1;
    }

    console.log(`\n✅ Export complete. Wrote ${successCount} files to:`);
    console.log(`   ${TEMP_OUTPUT_DIR}`);
    if (failCount > 0) {
      console.log(`⚠️  ${failCount} files skipped due to PubChem fetch failures.`);
    }
    console.log('\nDone.');
  })();
} else if (UPDATE_MODE) {
  console.log('\n⚙️  UPDATE MODE: Validating against PubChem and adding new fields...\n');
  console.log('Will update the following files:');
  analysis.filesNeedingUpdate.forEach(({ file, missing }) => {
    console.log(`  ✏️  ${file} (adding: ${missing.join(', ')})`);
  });
  console.log('\nTODO: Implement phase data fetching from PubChem');
} else if (RECREATE_MODE) {
  console.log('\n⚠️  RECREATE MODE: This will rebuild all 118 elements from scratch!');
  console.log('This should ALMOST NEVER be used. Use --update for incremental changes.\n');
  console.log('TODO: Implement full rebuild from PubChem/NIST');
} else {
  // Default mode: Check against PubChem authoritative data
  console.log('\n🔎 CHECK MODE: Comparing current data against PubChem...\n');
  console.log('Fetching PubChem data for verification (this may take a moment)...\n');
  
  const files = fs.readdirSync(ELEMENTS_DIR).filter(f => f.endsWith('.json')).slice(0, 5); // Sample first 5 for quick test
  
  (async () => {
    let discrepanciesFound = 0;
    
    for (const file of files) {
      const filePath = path.join(ELEMENTS_DIR, file);
      const elementData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      
      console.log(`\n📋 ${elementData.symbol} (${elementData.name}):`);
      
      const pubchemData = await fetchPubChemElementData(elementData.atomicNumber, elementData.symbol);
      
      if (!pubchemData) {
        console.log(`   ⚠️  Could not validate against PubChem`);
        continue;
      }
      
      const discrepancies = compareWithPubChem(elementData, pubchemData);
      
      if (discrepancies.length === 0) {
        console.log(`   ✅ All values validated`);
      } else {
        discrepanciesFound += discrepancies.length;
        discrepancies.forEach(({ field, severity, issue, current, pubchemSources, action }) => {
          const icon = severity === 'ERROR' ? '❌' : '⚠️';
          console.log(`   ${icon} ${severity}: ${field}`);
          console.log(`       Issue: ${issue}`);
          console.log(`       Current: NIST=${current.nist}, IUPAC=${current.iupac}`);
          console.log(`       Source: ${current.source}`);
          if (pubchemSources && Array.isArray(pubchemSources)) {
            console.log(`       PubChem sources available (${pubchemSources.length}):`);
            pubchemSources.forEach((source, idx) => {
              console.log(`         [${idx + 1}] ${source.rawValue} - ${source.source}`);
              if (source.note) console.log(`             Note: ${source.note}`);
            });
          }
          if (action) console.log(`       Action: ${action}`);
        });
      }
    }
    
    console.log(`\n${'='.repeat(60)}`);
    if (discrepanciesFound === 0) {
      console.log(`✅ Check complete. All sampled elements match PubChem data.\n`);
    } else {
      console.log(`⚠️  Check complete. Found ${discrepanciesFound} discrepancies.\n`);
      console.log(`   Run with --update to fetch corrected data from PubChem.\n`);
    }
    
    console.log(`\n📋 POST-CHECK VALIDATION REQUIRED:`);
    console.log(`   TODO: Verify atomic weight values are SINGULAR and PRECISE`);
    console.log(`   - Game calculations depend on precise atomicMass (no ranges)`);
    console.log(`   - Must select authoritative source consistently across all elements`);
    console.log(`   - Per-element handling may be needed for elements with multiple valid sources`);
    console.log(`   - Recommend: NIST for consistency (but verify no ranges present)`);
    console.log(`\n   TODO: After --update run, manually inspect:`)
    console.log(`   - Any atomicMass values containing ± or – (ranges)`);
    console.log(`   - Per-element source selection for game use`);
    console.log(`   - Ensure phase data was successfully added`);
    
    console.log('\nDone.');
  })();
}
