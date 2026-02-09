import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

const readFile = (relativePath) => {
  return fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8')
}

const getNamedImports = (source, modulePath) => {
  const escaped = modulePath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(`import\\s*\\{([^}]*)\\}\\s*from\\s*['"]${escaped}['"]`, 'g')
  const matches = Array.from(source.matchAll(regex))
  if (matches.length === 0) return []

  const combined = matches.map((match) => match[1]).join(',')
  const cleaned = combined.replace(/\/\/.*$/gm, '')
  return cleaned
    .split(',')
    .map((name) => name.trim())
    .filter(Boolean)
}

const uniqueSorted = (items) => Array.from(new Set(items)).sort()

const assertImportSet = (label, actual, expected) => {
  const actualSorted = uniqueSorted(actual)
  const expectedSorted = uniqueSorted(expected)

  const matches =
    actualSorted.length === expectedSorted.length &&
    actualSorted.every((name, index) => name === expectedSorted[index])

  if (!matches) {
    throw new Error(
      `${label} imports changed. Update contract list.\n` +
        `Expected: ${expectedSorted.join(', ')}\n` +
        `Actual: ${actualSorted.join(', ')}`
    )
  }
}

const expectInOrder = (source, markers, label) => {
  let lastIndex = -1
  markers.forEach((marker) => {
    const index = source.indexOf(marker)
    expect(index, `${label} missing: ${marker}`).toBeGreaterThan(-1)
    expect(index, `${label} order mismatch for: ${marker}`).toBeGreaterThan(lastIndex)
    lastIndex = index
  })
}

const getBlockBetween = (source, startMarker, endMarker, label) => {
  const start = source.indexOf(startMarker)
  if (start < 0) {
    throw new Error(`${label} missing start marker: ${startMarker}`)
  }
  const end = source.indexOf(endMarker, start)
  if (end < 0) {
    throw new Error(`${label} missing end marker: ${endMarker}`)
  }
  return source.slice(start, end)
}

const GAME_SCENE = 'src/components/GameScene.jsx'
const USE_GAME_PHYSICS = 'src/hooks/useGamePhysics.js'
const USE_ROOM_ENVIRONMENT = 'src/hooks/useRoomEnvironment.js'
const USE_SIMULATION_RESULT_APPLIER = 'src/hooks/useSimulationResultApplier.js'
const PHYSICS_WORKER = 'src/workers/physicsWorker.js'

const EXPECTED_IMPORTS = {
  [GAME_SCENE]: {
    '../utils/physics': [
      'calculateBoilingPoint',
      'calculateBoilingPointAtPressure',
      'formatTemperature'
    ],
    '../utils/boilTimeUtils': ['calculateExpectedBoilTime']
  },
  [USE_GAME_PHYSICS]: {
    '../utils/physics': ['simulateTimeStep']
  },
  [USE_ROOM_ENVIRONMENT]: {
    '../utils/roomEnvironment': ['createRoomState', 'simulateRoomStep', 'getRoomSummary']
  },
  [USE_SIMULATION_RESULT_APPLIER]: {
    '../utils/physics': ['solveAntoineForPressure', 'simulateEvaporationWithMassTransfer']
  },
  [PHYSICS_WORKER]: {
    '../utils/physics': ['simulateTimeStep']
  }
}

describe('contract: math wiring invariants', () => {
  it('keeps expected math imports stable', () => {
    Object.entries(EXPECTED_IMPORTS).forEach(([filePath, modules]) => {
      const source = readFile(filePath)
      Object.entries(modules).forEach(([modulePath, expected]) => {
        const actual = getNamedImports(source, modulePath)
        assertImportSet(`${filePath} -> ${modulePath}`, actual, expected)
      })
    })
  })

  it('GameScene uses room pressure before altitude for boiling point', () => {
    const source = readFile(GAME_SCENE)
    const block = getBlockBetween(
      source,
      'const boilingPointResult = useMemo(() => {',
      '}, [fluidProps',
      'GameScene boiling point block'
    )

    expect(block).toMatch(
      /return\s+calculateBoilingPointAtPressure\(\s*roomSummary\.pressure\s*,\s*fluidProps\s*\)/
    )
    expect(block).toMatch(
      /return\s+calculateBoilingPoint\(\s*altitude\s*,\s*fluidProps\s*\)/
    )

    expectInOrder(
      block,
      [
        'if (roomControlsEnabled && roomSummary?.pressure)',
        'calculateBoilingPointAtPressure',
        'return calculateBoilingPoint(altitude, fluidProps)'
      ],
      'GameScene boiling point wiring'
    )
  })

  it('GameScene expected boil time uses dynamic inputs', () => {
    const source = readFile(GAME_SCENE)
    const start = source.indexOf('calculateExpectedBoilTime({')
    expect(start).toBeGreaterThan(-1)

    const end = source.indexOf('})', start)
    expect(end).toBeGreaterThan(start)

    const block = source.slice(start, end)
    ;[
      'fluidProps',
      'canBoil',
      'liquidMass',
      'temperature',
      'boilingPoint',
      'burnerHeat',
      'wattageSteps'
    ].forEach((key) => {
      expect(block).toContain(key)
    })
  })

  it('GameScene hook order stays consistent', () => {
    const source = readFile(GAME_SCENE)
    expectInOrder(
      source,
      [
        'useBoilingDetection({',
        'useSimulationResultApplier({',
        'useGamePhysics({',
        'useRoomSimulation({'
      ],
      'GameScene hook order'
    )
  })

  it('GameScene derives experiment flags from workshop data', () => {
    const source = readFile(GAME_SCENE)
    expect(source).toMatch(/const\s+currentExperimentObj\s*=\s*useMemo/)
    expect(source).toMatch(/EXPERIMENTS\[activeLevel\]/)
    expect(source).toMatch(/exp\.id\s*===\s*activeExperiment/)
    expect(source).toMatch(/const\s+roomControlsEnabled\s*=\s*Boolean\(currentExperimentObj\?\.unlocksRoomControls\)/)
  })

  it('useGamePhysics passes dynamic inputs to simulateTimeStep', () => {
    const source = readFile(USE_GAME_PHYSICS)
    const block = getBlockBetween(
      source,
      'const newState = simulateTimeStep',
      'onApplySimulationResult(newState',
      'useGamePhysics simulateTimeStep block'
    )
    expectInOrder(
      block,
      [
        'const newState = simulateTimeStep',
        'waterMass: waterInPot',
        'temperature: temperature',
        'altitude: altitude',
        'residueMass: residueMass',
        'heatInputWatts',
        'deltaTime',
        'fluidProps',
        'ambientTemperature'
      ],
      'useGamePhysics simulateTimeStep wiring'
    )
  })

  it('physicsWorker forwards cached fluid props to simulateTimeStep', () => {
    const source = readFile(PHYSICS_WORKER)
    const block = getBlockBetween(
      source,
      'const newState = simulateTimeStep',
      'self.postMessage',
      'physicsWorker simulateTimeStep block'
    )
    expectInOrder(
      block,
      [
        'const newState = simulateTimeStep',
        'state',
        'heatInputWatts',
        'deltaTime',
        'cachedFluidProps',
        'ambientTemperature'
      ],
      'physicsWorker simulateTimeStep wiring'
    )
  })

  it('useRoomEnvironment wires room simulation to dynamic inputs', () => {
    const source = readFile(USE_ROOM_ENVIRONMENT)
    expect(source).toMatch(/createRoomState\(roomConfig,\s*altitude\)/)
    expect(source).toMatch(/simulateRoomStep\(prev,\s*acUnit,\s*airHandler,\s*deltaTime,\s*options\)/)
  })

  it('useSimulationResultApplier wires evaporation math to dynamic inputs', () => {
    const source = readFile(USE_SIMULATION_RESULT_APPLIER)

    expect(source).toMatch(
      /solveAntoineForPressure\(\s*newState\.temperature\s*,\s*fluidProps\.antoineCoefficients\s*\)/
    )

    const start = source.indexOf('simulateEvaporationWithMassTransfer({')
    expect(start).toBeGreaterThan(-1)

    const end = source.indexOf('})', start)
    expect(end).toBeGreaterThan(start)

    const block = source.slice(start, end)
    ;[
      'liquidTempC: newState.temperature',
      'liquidMassKg: newState.waterMass',
      'vaporPressurePa: vaporPressure',
      'pressurePa: totalPressure',
      'partialPressurePa: partialPressure',
      'diffusionVolumeSum: fluidProps.diffusionVolumeSum',
      'deltaTimeS: context.deltaTime'
    ].forEach((entry) => {
      expect(block).toContain(entry)
    })

    expect(block).toMatch(/molarMassGmol:\s*fluidProps\.molarMass/)
    expect(block).toMatch(/latentHeatKJ:\s*fluidProps\.heatOfVaporization/)
    expect(block).toMatch(/specificHeatJgC:\s*fluidProps\.specificHeat/)
  })
})
