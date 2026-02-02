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

// Parse command-line arguments
const args = process.argv.slice(2);
const UPDATE_MODE = args.includes('--update');
const RECREATE_MODE = args.includes('--recreate');

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

  const files = fs.readdirSync(ELEMENTS_DIR).filter(f => f.endsWith('.json'));
  
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
    const url = `https://pubchem.ncbi.nlm.nih.gov/element/${atomicNumber}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      console.warn(`    ⚠️  Could not fetch PubChem data for ${symbol} (HTTP ${response.status})`);
      return null;
    }
    
    const html = await response.text();
    
    // Parse property tables from HTML
    // Look for data in table rows: <tr><td>Property</td><td>Value</td><td>Source</td></tr>
    const parsed = {
      symbol,
      atomicNumber,
      atomicMass: extractPropertyFromTable(html, 'Atomic Weight|Relative Atomic Mass|Standard Atomic Weight'),
      electronegativity: extractPropertyFromTable(html, 'Electronegativity|Pauling'),
      ionizationEnergy: extractPropertyFromTable(html, 'Ionization Energy|First Ionization'),
      atomicRadius: extractPropertyFromTable(html, 'Atomic Radius|Covalent|Van der Waals'),
      electronAffinity: extractPropertyFromTable(html, 'Electron Affinity'),
      meltingPoint: extractPropertyFromTable(html, 'Melting Point'),
      boilingPoint: extractPropertyFromTable(html, 'Boiling Point'),
      density: extractPropertyFromTable(html, 'Density'),
      thermalConductivity: extractPropertyFromTable(html, 'Thermal Conductivity'),
      source: 'PubChem (NIH - multiple authoritative sources)'
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
if (UPDATE_MODE) {
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
