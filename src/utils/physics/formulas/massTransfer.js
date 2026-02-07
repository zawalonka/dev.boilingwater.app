// NOTE: Read the header comments before editing. Reassess splitting into subcomponents when adding new items or behaviors.
/**
 * MASS TRANSFER COEFFICIENT CALCULATION
 * 
 * Calculates the mass transfer coefficient for evaporation from a liquid surface
 * using boundary layer theory and natural convection correlations.
 * 
 * PHYSICS:
 * Evaporation from a liquid surface is limited by:
 * 1. Molecular kinetics at the surface (Hertz-Knudsen - very fast)
 * 2. Diffusion through the stagnant boundary layer (this - rate limiting!)
 * 
 * The mass transfer coefficient k_m relates flux to concentration difference:
 *   j = k_m × (c_sat - c_bulk)
 * 
 * For natural convection over a horizontal surface (pot of liquid):
 *   Sh = 0.54 × (Gr × Sc)^0.25  (laminar, Ra < 10^7)
 *   Sh = 0.15 × (Gr × Sc)^0.33  (turbulent, Ra > 10^7)
 *   k_m = Sh × D_AB / L
 * 
 * DIMENSIONLESS NUMBERS:
 *   Sh = Sherwood number (mass transfer analog of Nusselt)
 *   Gr = Grashof number (buoyancy vs viscosity)
 *   Sc = Schmidt number (momentum vs mass diffusivity)
 *   Ra = Rayleigh number = Gr × Sc
 * 
 * REFERENCES:
 * Incropera & DeWitt, Fundamentals of Heat and Mass Transfer
 * Bird, Stewart, Lightfoot, Transport Phenomena
 * 
 * @module physics/formulas/massTransfer
 */

/**
 * Air kinematic viscosity as function of temperature
 * Sutherland's formula approximation
 * 
 * @param {number} temperatureK - Temperature in Kelvin
 * @returns {number} Kinematic viscosity in m²/s
 */
export function airKinematicViscosity(temperatureK) {
  // Sutherland's constants for air
  const T_ref = 273.15  // K
  const nu_ref = 1.327e-5  // m²/s at T_ref
  const S = 110.4  // Sutherland constant for air
  
  // Sutherland's law: ν(T) = ν_ref × (T/T_ref)^1.5 × (T_ref + S)/(T + S)
  return nu_ref * Math.pow(temperatureK / T_ref, 1.5) * (T_ref + S) / (temperatureK + S)
}

/**
 * Calculate Schmidt number (Sc = ν / D_AB)
 * Ratio of momentum diffusivity to mass diffusivity
 * 
 * @param {number} kinematicViscosity - ν in m²/s
 * @param {number} diffusionCoefficient - D_AB in m²/s
 * @returns {number} Schmidt number (dimensionless)
 */
export function calculateSchmidtNumber(kinematicViscosity, diffusionCoefficient) {
  if (diffusionCoefficient <= 0) return 1.0  // fallback
  return kinematicViscosity / diffusionCoefficient
}

/**
 * Calculate Grashof number for mass transfer
 * Ratio of buoyancy to viscous forces
 * 
 * For evaporation, the density difference comes from vapor concentration.
 * We approximate using: Δρ/ρ ≈ (M_vapor/M_air - 1) × y_vapor
 * 
 * @param {number} g - Gravitational acceleration (9.81 m/s²)
 * @param {number} L - Characteristic length (m) - typically pot diameter
 * @param {number} kinematicViscosity - ν in m²/s
 * @param {number} densityRatioTerm - Δρ/ρ (dimensionless)
 * @returns {number} Grashof number (dimensionless)
 */
export function calculateGrashofNumber(g, L, kinematicViscosity, densityRatioTerm) {
  // Gr = g × L³ × (Δρ/ρ) / ν²
  return (g * Math.pow(L, 3) * Math.abs(densityRatioTerm)) / Math.pow(kinematicViscosity, 2)
}

/**
 * Calculate density ratio term for vapor-air system
 * 
 * @param {number} molarMassVapor - Molar mass of vapor (g/mol)
 * @param {number} molarMassAir - Molar mass of air (g/mol), default 28.97
 * @param {number} vaporMoleFraction - Mole fraction of vapor at surface
 * @returns {number} Δρ/ρ term for Grashof number
 */
export function calculateDensityRatioTerm(molarMassVapor, molarMassAir = 28.97, vaporMoleFraction) {
  // For lighter vapor (M_vapor < M_air): buoyancy drives vapor upward
  // For heavier vapor (M_vapor > M_air): vapor sinks, different flow pattern
  // Δρ/ρ ≈ (1 - M_vapor/M_air) × y_vapor
  return (1 - molarMassVapor / molarMassAir) * vaporMoleFraction
}

/**
 * Calculate Sherwood number for natural convection over horizontal plate
 * 
 * @param {number} Ra - Rayleigh number (Gr × Sc)
 * @returns {number} Sherwood number (dimensionless)
 */
export function calculateSherwoodNumber(Ra) {
  if (Ra <= 0) return 0.1  // Minimum for stagnant conditions
  
  // Correlation for horizontal plate with buoyancy-driven flow
  if (Ra < 1e4) {
    // Very low Ra - nearly stagnant, pure diffusion dominates
    return 0.54 * Math.pow(Ra, 0.25)
  } else if (Ra < 1e7) {
    // Laminar natural convection
    return 0.54 * Math.pow(Ra, 0.25)
  } else {
    // Turbulent natural convection
    return 0.15 * Math.pow(Ra, 0.333)
  }
}

/**
 * Calculate mass transfer coefficient for evaporation from pot
 * 
 * This brings together all the pieces:
 * 1. Calculate air properties at temperature
 * 2. Calculate dimensionless numbers (Sc, Gr, Ra)
 * 3. Get Sherwood number from correlation
 * 4. Convert to mass transfer coefficient
 * 
 * @param {object} params - Calculation parameters
 * @param {number} params.temperatureC - Temperature in Celsius
 * @param {number} params.pressurePa - Pressure in Pascals
 * @param {number} params.characteristicLengthM - Pot diameter in meters
 * @param {number} params.diffusionCoefficientM2s - D_AB in m²/s
 * @param {number} params.molarMassVapor - Vapor molar mass (g/mol)
 * @param {number} params.saturationMoleFraction - Vapor mole fraction at surface
 * @returns {object} { massTransferCoeff, sherwoodNumber, rayleighNumber }
 */
export function calculateMassTransferCoefficient({
  temperatureC,
  pressurePa,
  characteristicLengthM,
  diffusionCoefficientM2s,
  molarMassVapor,
  saturationMoleFraction
}) {
  const temperatureK = temperatureC + 273.15
  const g = 9.81  // m/s²
  
  // Air kinematic viscosity at temperature
  const nu = airKinematicViscosity(temperatureK)
  
  // Schmidt number
  const Sc = calculateSchmidtNumber(nu, diffusionCoefficientM2s)
  
  // Density ratio term (driving force for natural convection)
  const densityRatio = calculateDensityRatioTerm(molarMassVapor, 28.97, saturationMoleFraction)
  
  // Grashof number
  const Gr = calculateGrashofNumber(g, characteristicLengthM, nu, densityRatio)
  
  // Rayleigh number
  const Ra = Gr * Sc
  
  // Sherwood number from correlation
  const Sh = calculateSherwoodNumber(Ra)
  
  // Mass transfer coefficient: k_m = Sh × D_AB / L
  const k_m = (Sh * diffusionCoefficientM2s) / characteristicLengthM
  
  return {
    massTransferCoeff: k_m,  // m/s
    sherwoodNumber: Sh,
    rayleighNumber: Ra,
    schmidtNumber: Sc,
    grashofNumber: Gr
  }
}

/**
 * Calculate evaporation rate using mass transfer model
 * 
 * This replaces the raw Hertz-Knudsen approach with a physically accurate
 * boundary layer diffusion model.
 * 
 * Evaporation flux: j = k_m × (c_sat - c_bulk)
 * Where c = P / (R × T) for ideal gas
 * 
 * @param {object} params - Parameters
 * @param {number} params.massTransferCoeff - k_m in m/s
 * @param {number} params.saturationPressurePa - Vapor pressure at liquid temp
 * @param {number} params.partialPressurePa - Vapor partial pressure in bulk air
 * @param {number} params.temperatureK - Temperature in Kelvin
 * @param {number} params.surfaceAreaM2 - Liquid surface area
 * @param {number} params.molarMassKg - Vapor molar mass in kg/mol
 * @param {number} params.deltaTimeS - Time step in seconds
 * @returns {number} Mass evaporated in kg
 */
export function calculateEvaporationMass({
  massTransferCoeff,
  saturationPressurePa,
  partialPressurePa,
  temperatureK,
  surfaceAreaM2,
  molarMassKg,
  deltaTimeS
}) {
  const R = 8.314  // J/(mol·K)
  
  // Concentration at saturation (mol/m³): c_sat = P_sat / (R × T)
  const c_sat = saturationPressurePa / (R * temperatureK)
  
  // Concentration in bulk air (mol/m³): c_bulk = P_partial / (R × T)
  const c_bulk = partialPressurePa / (R * temperatureK)
  
  // Driving force (concentration difference)
  const delta_c = Math.max(0, c_sat - c_bulk)  // Only evaporation, not condensation
  
  // Molar flux: j = k_m × Δc (mol/m²/s)
  const molarFlux = massTransferCoeff * delta_c
  
  // Mass flux: j_mass = j × M (kg/m²/s)
  const massFlux = molarFlux * molarMassKg
  
  // Total mass evaporated: m = j_mass × A × Δt
  return massFlux * surfaceAreaM2 * deltaTimeS
}
