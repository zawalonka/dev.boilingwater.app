import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');
const periodicTableDir = path.join(projectRoot, 'src', 'data', 'substances', 'periodic-table');
const outputDir = path.join(periodicTableDir, 'temp-test');

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

/**
 * Parse element filename to extract atomic number, symbol, and category
 * Format: {atomicNumber:03d}_{elementCategory}_{symbol}.json
 * Example: 026_transition-metal_Fe.json
 */
function parseElementFilename(filename) {
  const match = filename.match(/^(\d{3})_(.+)_([A-Z][a-z]?)\.json$/);
  if (!match) {
    return null;
  }
  return {
    atomicNumber: parseInt(match[1], 10),
    elementCategory: match[2],
    symbol: match[3],
  };
}

/**
 * Format output filename
 * Format: {atomicNumber:03d}_{symbol}_{elementCategory}.json
 * Example: 026_Fe_transition-metal.json
 */
function formatOutputFilename(atomicNumber, symbol, elementCategory) {
  return `${String(atomicNumber).padStart(3, '0')}_${symbol}_${elementCategory}.json`;
}

/**
 * Extract required fields from source element file
 */
function extractElementData(sourceData) {
  return {
    atomicNumber: sourceData.atomicNumber,
    symbol: sourceData.symbol,
    name: sourceData.name,
    elementCategory: sourceData.elementCategory,
    chemicalBlock: sourceData.chemicalBlock,
    valenceElectrons: sourceData.valenceElectrons,
    oxidationStates: sourceData.oxidationStates,
    nist: sourceData.nist,
    iupac: sourceData.iupac,
    physicalProperties: sourceData.physicalProperties,
  };
}

/**
 * Format element data to match template structure
 */
function formatElementData(extractedData) {
  return {
    atomicNumber: extractedData.atomicNumber,
    symbol: extractedData.symbol,
    name: extractedData.name,
    elementCategory: extractedData.elementCategory,
    chemicalBlock: extractedData.chemicalBlock,
    valenceElectrons: extractedData.valenceElectrons,
    oxidationStates: extractedData.oxidationStates,
    standardUsed: "iupac",
    nist: extractedData.nist || {},
    iupac: extractedData.iupac || {},
    physicalProperties: extractedData.physicalProperties || {},
    lastUpdated: new Date().toISOString().split('T')[0],
  };
}

/**
 * Main processing function
 */
async function processAllElements() {
  try {
    console.log(`Reading from: ${periodicTableDir}`);
    console.log(`Output to: ${outputDir}\n`);

    // Read all files in the periodic table directory
    const files = fs.readdirSync(periodicTableDir)
      .filter(f => f.endsWith('.json') && !f.startsWith('.'));

    console.log(`Found ${files.length} element files\n`);

    let processed = 0;
    let errors = 0;
    const errorLog = [];

    // Process each file
    for (const filename of files) {
      try {
        const parseResult = parseElementFilename(filename);
        if (!parseResult) {
          errorLog.push(`⚠️  Could not parse: ${filename}`);
          errors++;
          continue;
        }

        const filePath = path.join(periodicTableDir, filename);
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const sourceData = JSON.parse(fileContent);

        // Extract and format data
        const extractedData = extractElementData(sourceData);
        const formattedData = formatElementData(extractedData);

        // Generate output filename
        const outputFilename = formatOutputFilename(
          formattedData.atomicNumber,
          formattedData.symbol,
          formattedData.elementCategory
        );

        // Write formatted data
        const outputPath = path.join(outputDir, outputFilename);
        fs.writeFileSync(
          outputPath,
          JSON.stringify(formattedData, null, 2)
        );

        console.log(`✅ ${String(formattedData.atomicNumber).padStart(3, '0')}_${formattedData.symbol.padEnd(2)}_${formattedData.elementCategory.padEnd(20)} → ${outputFilename}`);
        processed++;
      } catch (error) {
        errorLog.push(`❌ Error processing ${filename}: ${error.message}`);
        errors++;
      }
    }

    console.log(`\n${'='.repeat(80)}`);
    console.log(`Summary: ${processed} processed, ${errors} errors`);
    console.log(`${'='.repeat(80)}\n`);

    if (errorLog.length > 0) {
      console.log('Error Details:');
      errorLog.forEach(log => console.log(log));
    }

  } catch (error) {
    console.error('Fatal error:', error.message);
    process.exit(1);
  }
}

// Run the processor
processAllElements();
      electronAffinity: 59.6,
      standardMolarEntropy: 29.1,
      specificHeatCapacity: 3.582,
      meltingPoint: 180.5,
      boilingPoint: 1342,
      density: 0.534,
      thermalConductivity: 85
    },
    iupac: {
      atomicMass: 6.94,
      electronegativity: 0.98,
      ionizationEnergy: 520.2,
      atomicRadius: 152,
      electronAffinity: 59.6,
      standardMolarEntropy: 29.1,
      specificHeatCapacity: 3.582,
      meltingPoint: 180.5,
      boilingPoint: 1342,
      density: 0.534,
      thermalConductivity: 85
    },
    physicalProperties: {
      phase: "solid",
      appearance: "soft, silvery-white metal",
      uses: ["batteries", "medications", "alloys", "nuclear weapons", "ceramics"],
      notes: "Lightest metal; highly reactive with water; essential for certain medications; used in advanced batteries"
    }
  },
  4: {
    symbol: "Be",
    name: "Beryllium",
    elementCategory: "alkaline-earth-metal",
    chemicalBlock: "s",
    valenceElectrons: 2,
    oxidationStates: [2],
    nist: {
      atomicMass: 9.0121831,
      electronegativity: 1.57,
      ionizationEnergy: 899.5,
      atomicRadius: 112,
      electronAffinity: -48,
      standardMolarEntropy: 9.50,
      specificHeatCapacity: 1.825,
      meltingPoint: 1287,
      boilingPoint: 2471,
      density: 1.85,
      thermalConductivity: 200
    },
    iupac: {
      atomicMass: 9.0122,
      electronegativity: 1.57,
      ionizationEnergy: 899.5,
      atomicRadius: 112,
      electronAffinity: -48,
      standardMolarEntropy: 9.50,
      specificHeatCapacity: 1.825,
      meltingPoint: 1287,
      boilingPoint: 2471,
      density: 1.85,
      thermalConductivity: 200
    },
    physicalProperties: {
      phase: "solid",
      appearance: "hard, grayish-white metal",
      uses: ["aerospace", "X-ray windows", "nuclear reactors", "electronics", "dental prosthetics"],
      notes: "Extremely rigid and light; high thermal conductivity; toxic dust (berylliosis); rare and expensive"
    }
  },
  5: {
    symbol: "B",
    name: "Boron",
    elementCategory: "metalloid",
    chemicalBlock: "p",
    valenceElectrons: 3,
    oxidationStates: [3],
    nist: {
      atomicMass: 10.81,
      electronegativity: 2.04,
      ionizationEnergy: 800.6,
      atomicRadius: 82,
      electronAffinity: 26.9,
      standardMolarEntropy: 5.86,
      specificHeatCapacity: 1.026,
      meltingPoint: 2077,
      boilingPoint: 4185,
      density: 2.34,
      thermalConductivity: 27
    },
    iupac: {
      atomicMass: 10.81,
      electronegativity: 2.04,
      ionizationEnergy: 800.6,
      atomicRadius: 82,
      electronAffinity: 26.9,
      standardMolarEntropy: 5.86,
      specificHeatCapacity: 1.026,
      meltingPoint: 2077,
      boilingPoint: 4185,
      density: 2.34,
      thermalConductivity: 27
    },
    physicalProperties: {
      phase: "solid",
      appearance: "dark brown to black amorphous powder or metallic crystal",
      uses: ["borosilicate glass", "detergents", "pesticides", "ceramics", "semiconductors"],
      notes: "Non-metallic element; hard and brittle; used extensively in glass (Pyrex); essential micronutrient for plants"
    }
  },
  6: {
    symbol: "C",
    name: "Carbon",
    elementCategory: "nonmetal",
    chemicalBlock: "p",
    valenceElectrons: 4,
    oxidationStates: [4, 2, -4],
    nist: {
      atomicMass: 12.011,
      electronegativity: 2.55,
      ionizationEnergy: 1086.5,
      atomicRadius: 70,
      electronAffinity: 121.7,
      standardMolarEntropy: 5.74,
      specificHeatCapacity: 0.709,
      meltingPoint: 3823,
      boilingPoint: 4098,
      density: 2.267,
      thermalConductivity: 119
    },
    iupac: {
      atomicMass: 12.011,
      electronegativity: 2.55,
      ionizationEnergy: 1086.5,
      atomicRadius: 70,
      electronAffinity: 121.7,
      standardMolarEntropy: 5.74,
      specificHeatCapacity: 0.709,
      meltingPoint: 3823,
      boilingPoint: 4098,
      density: 2.267,
      thermalConductivity: 119
    },
    physicalProperties: {
      phase: "solid",
      appearance: "gray to black amorphous solid, graphite, diamond, or other allotropes",
      uses: ["fuels", "diamonds", "electronics", "water filtration", "graphene", "biological molecules"],
      notes: "Basis of all organic chemistry; forms more compounds than any other element; multiple allotropes (diamond, graphite, graphene)"
    }
  },
  7: {
    symbol: "N",
    name: "Nitrogen",
    elementCategory: "nonmetal",
    chemicalBlock: "p",
    valenceElectrons: 5,
    oxidationStates: [5, 4, 3, 2, 1, -1, -3],
    nist: {
      atomicMass: 14.007,
      electronegativity: 3.04,
      ionizationEnergy: 1402.3,
      atomicRadius: 65,
      electronAffinity: 0,
      standardMolarEntropy: 191.61,
      specificHeatCapacity: 1.040,
      meltingPoint: -210.01,
      boilingPoint: -195.79,
      density: 0.001251,
      thermalConductivity: 0.0259
    },
    iupac: {
      atomicMass: 14.007,
      electronegativity: 3.04,
      ionizationEnergy: 1402.3,
      atomicRadius: 65,
      electronAffinity: 0,
      standardMolarEntropy: 191.61,
      specificHeatCapacity: 1.040,
      meltingPoint: -210.01,
      boilingPoint: -195.79,
      density: 0.001251,
      thermalConductivity: 0.0259
    },
    physicalProperties: {
      phase: "gas",
      appearance: "colorless, odorless gas",
      uses: ["fertilizers", "explosives", "refrigeration", "inerting", "semiconductor manufacture"],
      notes: "Makes up 78% of Earth's atmosphere; essential nutrient for all living organisms; relatively inert at room temperature"
    }
  }
};

function formatElement(atomicNumber, elementData) {
  // Get category from filename for reference
  const baseDir = path.join(__dirname, '../src/data/substances/periodic-table');
  const files = fs.readdirSync(baseDir).filter(f => 
    f.startsWith(`${String(atomicNumber).padStart(3, '0')}_`)
  );
  
  if (files.length === 0) {
    console.warn(`⚠️  Could not find source file for element ${atomicNumber}`);
    return null;
  }
  
  const sourceFile = files[0];
  const parts = sourceFile.replace('.json', '').split('_');
  const category = parts.slice(1, -1).join('-');
  
  const formatted = {
    "atomicNumber": atomicNumber,
    "symbol": elementData.symbol,
    "name": elementData.name,
    "elementCategory": elementData.elementCategory,
    "chemicalBlock": elementData.chemicalBlock,
    "valenceElectrons": elementData.valenceElectrons,
    "oxidationStates": elementData.oxidationStates,
    "standardUsed": "iupac",
    
    "nist": {
      "atomicMass": elementData.nist.atomicMass,
      "electronegativity": elementData.nist.electronegativity,
      "ionizationEnergy": elementData.nist.ionizationEnergy,
      "atomicRadius": elementData.nist.atomicRadius,
      "electronAffinity": elementData.nist.electronAffinity,
      "standardMolarEntropy": elementData.nist.standardMolarEntropy,
      "specificHeatCapacity": elementData.nist.specificHeatCapacity,
      "meltingPoint": elementData.nist.meltingPoint,
      "boilingPoint": elementData.nist.boilingPoint,
      "density": elementData.nist.density,
      "thermalConductivity": elementData.nist.thermalConductivity,
      "source": "NIST Chemistry WebBook 2024"
    },
    
    "iupac": {
      "atomicMass": elementData.iupac.atomicMass,
      "electronegativity": elementData.iupac.electronegativity,
      "ionizationEnergy": elementData.iupac.ionizationEnergy,
      "atomicRadius": elementData.iupac.atomicRadius,
      "electronAffinity": elementData.iupac.electronAffinity,
      "standardMolarEntropy": elementData.iupac.standardMolarEntropy,
      "specificHeatCapacity": elementData.iupac.specificHeatCapacity,
      "meltingPoint": elementData.iupac.meltingPoint,
      "boilingPoint": elementData.iupac.boilingPoint,
      "density": elementData.iupac.density,
      "thermalConductivity": elementData.iupac.thermalConductivity,
      "source": "IUPAC Periodic Table 2024"
    },
    
    "physicalProperties": {
      "phase": elementData.physicalProperties.phase,
      "appearance": elementData.physicalProperties.appearance,
      "uses": elementData.physicalProperties.uses,
      "notes": elementData.physicalProperties.notes
    },
    
    "lastUpdated": "2026-01-27"
  };
  
  return formatted;
}

async function generateTestElements() {
  const tempDir = path.join(__dirname, '../src/data/substances/periodic-table/temp-test');
  
  // Create first 7 elements
  for (let i = 1; i <= 7; i++) {
    if (!ELEMENTS_DATA[i]) {
      console.log(`⏭️  Skipping element ${i} - no data`);
      continue;
    }
    
    const elementData = ELEMENTS_DATA[i];
    const formatted = formatElement(i, elementData);
    
    if (!formatted) continue;
    
    const filename = `${String(i).padStart(3, '0')}_${elementData.symbol}_${elementData.elementCategory}.json`;
    const filepath = path.join(tempDir, filename);
    
    fs.writeFileSync(filepath, JSON.stringify(formatted, null, 2) + '\n');
    console.log(`✅ Created: ${filename}`);
  }
  
  console.log(`\n✅ Test generation complete! Check: ${tempDir}`);
}

generateTestElements().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
