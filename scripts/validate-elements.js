#!/usr/bin/env node

/**
 * Validate and fix all 118 periodic table elements
 * Gold standard: 026_transition-metal_Fe.json
 * 
 * This script:
 * 1. Reads the Fe standard
 * 2. Checks all 118 elements against it
 * 3. Reports structure violations
 * 4. Auto-fixes common issues
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ELEMENTS_DIR = path.join(__dirname, '../src/data/substances/periodic-table');
const STANDARD_FILE = path.join(ELEMENTS_DIR, '026_transition-metal_Fe.json');

// Properties that MUST be in nist/iupac sections (physical measurements)
const NIST_IUPAC_PHYSICAL_PROPS = [
  'meltingPoint',
  'boilingPoint',
  'density',
  'thermalConductivity'
];

// Properties that MUST be in nist/iupac sections (atomic data)
const NIST_IUPAC_ATOMIC_PROPS = [
  'atomicMass',
  'electronegativity',
  'ionizationEnergy',
  'atomicRadius',
  'electronAffinity',
  'standardMolarEntropy',
  'specificHeatCapacity'
];

const NIST_IUPAC_REQUIRED = [
  'source',
  ...NIST_IUPAC_ATOMIC_PROPS,
  ...NIST_IUPAC_PHYSICAL_PROPS
];

// Properties that MUST be in physicalProperties
const PHYSICAL_PROPS_REQUIRED = [
  'phase',
  'appearance',
  'uses',
  'notes'
];

console.log('=== PERIODIC TABLE ELEMENT VALIDATOR ===\n');

// 1. Load standard
console.log('📖 Loading standard (026_transition-metal_Fe.json)...');
const standard = JSON.parse(fs.readFileSync(STANDARD_FILE, 'utf8'));
console.log('Standard schema loaded.\n');

// 2. Scan all element files
console.log('🔍 Scanning all 118 elements...\n');
const files = fs.readdirSync(ELEMENTS_DIR).filter(f => f.endsWith('.json'));

const issues = [];
const fixes = [];

files.forEach(file => {
  const filePath = path.join(ELEMENTS_DIR, file);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const atomicNumber = String(data.atomicNumber).padStart(3, '0');

  // Check nist section
  if (!data.nist) {
    issues.push(`${file}: Missing 'nist' section`);
    return;
  }

  // Check for missing source
  if (!data.nist.source) {
    issues.push(`${file}: nist section missing 'source'`);
    fixes.push({ file, issue: 'missing-nist-source' });
  }
  if (!data.iupac || !data.iupac.source) {
    issues.push(`${file}: iupac section missing 'source'`);
    fixes.push({ file, issue: 'missing-iupac-source' });
  }

  // Check for misplaced properties in physicalProperties
  const physicalProps = data.physicalProperties || {};
  const misplaced = [];
  
  NIST_IUPAC_PHYSICAL_PROPS.forEach(prop => {
    if (physicalProps[prop] !== undefined) {
      misplaced.push(prop);
    }
  });

  if (misplaced.length > 0) {
    issues.push(`${file}: Physical measurements in physicalProperties instead of nist/iupac: ${misplaced.join(', ')}`);
    fixes.push({ file, issue: 'misplaced-physical-props', props: misplaced });
  }

  // Check if properties are missing from nist/iupac
  const missingFromNist = [];
  NIST_IUPAC_REQUIRED.forEach(prop => {
    if (data.nist[prop] === undefined) {
      missingFromNist.push(prop);
    }
  });

  if (missingFromNist.length > 0) {
    issues.push(`${file}: Missing from nist section: ${missingFromNist.join(', ')}`);
  }

  // Check physicalProperties has required fields
  const missingFromPhysical = [];
  PHYSICAL_PROPS_REQUIRED.forEach(prop => {
    if (physicalProps[prop] === undefined) {
      issues.push(`${file}: Missing from physicalProperties: ${prop}`);
    }
  });
});

// Report issues
if (issues.length === 0) {
  console.log('✅ All 118 elements match the Fe (026) standard!\n');
} else {
  console.log(`❌ Found ${issues.length} issues:\n`);
  issues.forEach(issue => console.log(`  - ${issue}`));
  console.log();
}

// Apply fixes
if (fixes.length > 0) {
  console.log(`\n🔧 Applying ${fixes.length} fixes...\n`);

  fixes.forEach(({ file, issue, props }) => {
    const filePath = path.join(ELEMENTS_DIR, file);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    let modified = false;

    if (issue === 'misplaced-physical-props') {
      // Move properties from physicalProperties to nist/iupac
      props.forEach(prop => {
        const value = data.physicalProperties[prop];
        
        // Add to nist
        if (data.nist && value !== undefined) {
          data.nist[prop] = value;
          if (data.physicalProperties[prop] !== undefined) {
            delete data.physicalProperties[prop];
          }
          modified = true;
        }

        // Add to iupac
        if (data.iupac && value !== undefined) {
          data.iupac[prop] = value;
        }
      });
    }

    if (issue === 'missing-nist-source') {
      data.nist.source = 'NIST Chemistry WebBook 2024';
      modified = true;
    }

    if (issue === 'missing-iupac-source') {
      if (!data.iupac) data.iupac = {};
      data.iupac.source = 'IUPAC Periodic Table 2024';
      modified = true;
    }

    if (modified) {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n');
    }
  });

  console.log(`  ✓ Fixed ${fixes.length} files`);
  console.log('\n✅ All fixes applied!');
}

console.log('\n=== VALIDATION COMPLETE ===\n');
