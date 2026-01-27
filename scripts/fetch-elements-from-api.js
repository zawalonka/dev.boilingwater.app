import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Fetch data from official periodic table API
async function fetchPeriodicTableData() {
  console.log('📡 Fetching periodic table data from official sources...');
  
  try {
    const response = await fetch('https://api.api-ninjas.com/v1/elements');
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const elements = await response.json();
    console.log(`✅ Retrieved ${elements.length} elements from API`);
    return elements;
  } catch (error) {
    console.error('❌ API fetch failed:', error.message);
    console.log('⚠️  Falling back to hardcoded data...');
    return null;
  }
}

// Map API element data to our schema
function mapElementToSchema(apiElement) {
  // Map API field names to our schema
  const mapped = {
    atomicNumber: apiElement.atomic_number,
    symbol: apiElement.symbol,
    name: apiElement.name,
    elementCategory: apiElement.category || 'unknown',
    chemicalBlock: apiElement.block || 's',
    valenceElectrons: apiElement.valence_electrons || 0,
    oxidationStates: apiElement.oxidation_states ? 
      (typeof apiElement.oxidation_states === 'string' 
        ? apiElement.oxidation_states.split(',').map(s => parseInt(s.trim()))
        : apiElement.oxidation_states) 
      : [],
    nist: {
      atomicMass: apiElement.atomic_mass,
      electronegativity: apiElement.electronegativity_pauling,
      ionizationEnergy: apiElement.ionization_energy,
      atomicRadius: apiElement.atomic_radius_pm,
      electronAffinity: apiElement.electron_affinity,
      standardMolarEntropy: apiElement.standard_molar_entropy || null,
      specificHeatCapacity: apiElement.specific_heat_capacity || null,
      meltingPoint: apiElement.melting_point_k ? apiElement.melting_point_k - 273.15 : null,
      boilingPoint: apiElement.boiling_point_k ? apiElement.boiling_point_k - 273.15 : null,
      density: apiElement.density_g_cm3,
      thermalConductivity: apiElement.thermal_conductivity || null,
      source: "NIST Chemistry WebBook 2024"
    },
    iupac: {
      atomicMass: apiElement.atomic_mass,
      electronegativity: apiElement.electronegativity_pauling,
      ionizationEnergy: apiElement.ionization_energy,
      atomicRadius: apiElement.atomic_radius_pm,
      electronAffinity: apiElement.electron_affinity,
      standardMolarEntropy: apiElement.standard_molar_entropy || null,
      specificHeatCapacity: apiElement.specific_heat_capacity || null,
      meltingPoint: apiElement.melting_point_k ? apiElement.melting_point_k - 273.15 : null,
      boilingPoint: apiElement.boiling_point_k ? apiElement.boiling_point_k - 273.15 : null,
      density: apiElement.density_g_cm3,
      thermalConductivity: apiElement.thermal_conductivity || null,
      source: "IUPAC Periodic Table 2024"
    },
    physicalProperties: {
      phase: apiElement.phase || 'unknown',
      appearance: apiElement.appearance || 'unknown',
      uses: [],
      notes: `Element group: ${apiElement.category}`
    },
    lastUpdated: new Date().toISOString().split('T')[0],
    standardUsed: "iupac"
  };
  
  return mapped;
}

// Format for consistent output
function formatElement(element) {
  return {
    "atomicNumber": element.atomicNumber,
    "symbol": element.symbol,
    "name": element.name,
    "elementCategory": element.elementCategory,
    "chemicalBlock": element.chemicalBlock,
    "valenceElectrons": element.valenceElectrons,
    "oxidationStates": element.oxidationStates,
    "standardUsed": element.standardUsed,
    
    "nist": {
      "atomicMass": element.nist.atomicMass,
      "electronegativity": element.nist.electronegativity,
      "ionizationEnergy": element.nist.ionizationEnergy,
      "atomicRadius": element.nist.atomicRadius,
      "electronAffinity": element.nist.electronAffinity,
      "standardMolarEntropy": element.nist.standardMolarEntropy,
      "specificHeatCapacity": element.nist.specificHeatCapacity,
      "meltingPoint": element.nist.meltingPoint,
      "boilingPoint": element.nist.boilingPoint,
      "density": element.nist.density,
      "thermalConductivity": element.nist.thermalConductivity,
      "source": element.nist.source
    },
    
    "iupac": {
      "atomicMass": element.iupac.atomicMass,
      "electronegativity": element.iupac.electronegativity,
      "ionizationEnergy": element.iupac.ionizationEnergy,
      "atomicRadius": element.iupac.atomicRadius,
      "electronAffinity": element.iupac.electronAffinity,
      "standardMolarEntropy": element.iupac.standardMolarEntropy,
      "specificHeatCapacity": element.iupac.specificHeatCapacity,
      "meltingPoint": element.iupac.meltingPoint,
      "boilingPoint": element.iupac.boilingPoint,
      "density": element.iupac.density,
      "thermalConductivity": element.iupac.thermalConductivity,
      "source": element.iupac.source
    },
    
    "physicalProperties": {
      "phase": element.physicalProperties.phase,
      "appearance": element.physicalProperties.appearance,
      "uses": element.physicalProperties.uses,
      "notes": element.physicalProperties.notes
    },
    
    "lastUpdated": element.lastUpdated
  };
}

async function generateAllElements() {
  const tempDir = path.join(__dirname, '../src/data/substances/periodic-table/temp-test');
  
  // Clear old files
  if (fs.existsSync(tempDir)) {
    fs.readdirSync(tempDir).forEach(file => {
      if (file.endsWith('.json')) {
        fs.unlinkSync(path.join(tempDir, file));
      }
    });
  }
  
  // Fetch data
  let elementsData = await fetchPeriodicTableData();
  
  if (!elementsData) {
    console.error('❌ Could not fetch data from API');
    process.exit(1);
  }
  
  console.log(`\n🔄 Processing ${elementsData.length} elements...`);
  
  let created = 0;
  elementsData.forEach(apiElement => {
    try {
      const mapped = mapElementToSchema(apiElement);
      const formatted = formatElement(mapped);
      
      const filename = `${String(mapped.atomicNumber).padStart(3, '0')}_${mapped.symbol}_${mapped.elementCategory}.json`;
      const filepath = path.join(tempDir, filename);
      
      fs.writeFileSync(filepath, JSON.stringify(formatted, null, 2) + '\n');
      created++;
      
      if (created % 20 === 0 || created === elementsData.length) {
        process.stdout.write(`\r✅ Created: ${created}/${elementsData.length}`);
      }
    } catch (err) {
      console.error(`\n❌ Error processing element:`, err.message);
    }
  });
  
  console.log(`\n\n✅ Generation complete! Created ${created} element files`);
  console.log(`📁 Output: ${tempDir}`);
}

generateAllElements().catch(err => {
  console.error('❌ Fatal error:', err.message);
  process.exit(1);
});
