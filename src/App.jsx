import { useState, useEffect } from 'react'
import Header from './components/Header'
import GameScene from './components/GameScene'
import { initializeWorkshop, getWorkshopsByLevel, preloadWorkshopImages, loadEquipment } from './utils/workshopLoader'
import { LEVELS, EXPERIMENTS } from './constants/workshops'
import './styles/App.css'

function App() {
  const [gameStage, setGameStage] = useState(0)
  const [userLocation, setUserLocation] = useState(null)
  const [workshopLoaded, setWorkshopLoaded] = useState(false)
  const [activeView, setActiveView] = useState('game')  // game | about | docs | submit-issue | submit-workshop
  const [gameInstanceKey, setGameInstanceKey] = useState(0)
  const [activeLevel, setActiveLevel] = useState(1)  // Numeric level (1, 2, 3...)
  const [activeExperiment, setActiveExperiment] = useState('boiling-water')  // Experiment ID within level
  const [activeWorkshopId, setActiveWorkshopId] = useState('pre-alpha-kitchen-1')
  const [availableWorkshops, setAvailableWorkshops] = useState([{ id: 'pre-alpha-kitchen-1', name: 'Pre Alpha Kitchen 1' }])
  const [activeWorkshopData, setActiveWorkshopData] = useState(null)
  const [hasBoiledBefore, setHasBoiledBefore] = useState(false)  // Track if user has boiled water once
  const [showSelectors, setShowSelectors] = useState(false)  // Show level/workshop selectors

  // Load available workshops and apply default
  useEffect(() => {
    async function bootWorkshop() {
      try {
        const levelWorkshops = await getWorkshopsByLevel(activeLevel)
        setAvailableWorkshops(levelWorkshops)
        const processed = await initializeWorkshop(activeWorkshopId, { apply: true })
        // Preload all workshop images to prevent lag
        await preloadWorkshopImages(processed)
        setActiveWorkshopData(processed)
        setWorkshopLoaded(true)
      } catch (error) {
        console.error('Failed to load workshop:', error)
        setWorkshopLoaded(true)
      }
    }
    bootWorkshop()
  }, [])

  // Workshop change handler
  const handleWorkshopChange = async (workshopId) => {
    try {
      const processed = await initializeWorkshop(workshopId, { apply: true })
      // Preload new workshop images immediately
      await preloadWorkshopImages(processed)
      setActiveWorkshopId(workshopId)
      setActiveWorkshopData(processed)
      // Reset game completely: stage back to 0, force GameScene re-mount
      setGameStage(0)
      setGameInstanceKey((k) => k + 1)
    } catch (error) {
      console.error('Failed to change workshop:', error)
    }
  }

  // Level change handler
  // optionalNextExperimentId lets callers override the default first experiment for that level
  const handleLevelChange = async (levelId, optionalNextExperimentId = null) => {
    try {
      const levelWorkshops = await getWorkshopsByLevel(levelId)
      setAvailableWorkshops(levelWorkshops)
      setActiveLevel(levelId)
      
      // Switch to the first workshop of the new level
      const firstWorkshop = levelWorkshops && levelWorkshops.length > 0 ? levelWorkshops[0] : { id: 'pre-alpha-kitchen-1' }
      const processed = await initializeWorkshop(firstWorkshop.id, { apply: true })
      await preloadWorkshopImages(processed)
      setActiveWorkshopId(firstWorkshop.id)
      setActiveWorkshopData(processed)
      
      // Reset game and set default experiment for this level
      const sortedExperiments = (EXPERIMENTS[levelId] || []).slice().sort((a, b) => (a.order || 0) - (b.order || 0))
      const defaultExperiment = optionalNextExperimentId || sortedExperiments?.[0]?.id || 'boiling-water'
      setActiveExperiment(defaultExperiment)
      setGameStage(0)
      setGameInstanceKey((k) => k + 1)
    } catch (error) {
      console.error('Failed to change level:', error)
    }
  }

  // Experiment change handler
  const handleExperimentChange = (experimentId) => {
    setActiveExperiment(experimentId)
    setGameStage(0)
    setGameInstanceKey((k) => k + 1)
    // Location popup will be triggered in GameScene if this is Exp 2+
  }

  // Equipment change handler - reloads scene with new equipment
  const handleEquipmentChange = async (equipmentType, equipmentId) => {
    if (!activeWorkshopData || !activeWorkshopId) return
    
    try {
      const newEquipment = await loadEquipment(activeWorkshopId, equipmentType, equipmentId)
      if (!newEquipment) {
        console.warn(`Could not load ${equipmentType}/${equipmentId}`)
        return
      }
      
      // Update workshop data with new equipment
      const updatedWorkshopData = { ...activeWorkshopData }
      if (equipmentType === 'ac-units') {
        updatedWorkshopData.acUnit = newEquipment
      } else if (equipmentType === 'air-handlers') {
        updatedWorkshopData.airHandler = newEquipment
      } else if (equipmentType === 'burners') {
        updatedWorkshopData.burnerConfig = {
          wattageSteps: newEquipment.wattageSteps || [0, 500, 1000, 2000],
          controlType: newEquipment.controlType || 'knob',
          maxWatts: newEquipment.thermalCharacteristics?.maxWatts || 2000,
          efficiencyPercent: newEquipment.thermalCharacteristics?.efficiencyPercent || 85
        }
      }
      
      setActiveWorkshopData(updatedWorkshopData)
      // Reset game to apply new equipment
      setGameStage(0)
      setGameInstanceKey((k) => k + 1)
    } catch (error) {
      console.error(`Failed to change ${equipmentType}:`, error)
    }
  }

  // Location will be requested when entering stage 2 (altitude-based lessons)
  // For now, default to sea level
  useEffect(() => {
    if (gameStage === 2) {
      // Future: Request geolocation here when we implement stage 2
      // For now, just set to sea level
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setUserLocation({
        altitude: 0,
        latitude: 0,
        longitude: 0
      })
    } else {
      // Stage 0-1: Use default sea level
      setUserLocation({
        altitude: 0,
        latitude: 0,
        longitude: 0
      })
    }
  }, [gameStage])

  // Handle skip tutorial button (fast-forward to altitude experiment)
  const handleSkipTutorial = async () => {
    setShowSelectors(true)
    // Move directly to Level 1, Experiment 2 (Altitude's Effect)
    await handleLevelChange(1, 'altitude-effect')
  }

  // Handle when user completes the tutorial boil (Experiment: boiling-water)
  const handleWaterBoiled = () => {
    if (activeExperiment === 'boiling-water' && !hasBoiledBefore) {
      setHasBoiledBefore(true)
      setShowSelectors(true)
      // Modal stays visible until user clicks button
    }
  }

  // Handle location changes (from GameScene location input)
  const handleLocationChange = (locationData) => {
    setUserLocation({
      altitude: locationData.altitude,
      zipCode: locationData.zipCode,
      country: locationData.country,
      name: locationData.name,
      latitude: locationData.latitude,
      longitude: locationData.longitude
    })
  }

  const handleNavigate = (view) => {
    setActiveView(view)
    if (view === 'game') {
      setGameStage(0)
    }
  }

  const handleReload = () => {
    setGameStage(0)
    setGameInstanceKey((k) => k + 1)
    setActiveView('game')
  }

  // Submit issues to the repo (updated link)
  const issueUrl = 'https://github.com/zawalonka/Boilingwater.app/issues/new'

  const renderView = () => {
    if (activeView === 'about') {
      return (
        <div className="info-page">
          <h2>About Boiling Water</h2>
          <p>Boiling Water is an educational physics and chemistry sandbox that shows how fluids heat, cool, and boil under different conditions. It uses real thermodynamics (specific heat, latent heat, altitude-based boiling points, and Newton&apos;s Law of Cooling) with extensible JSON-based fluid and workshop systems.</p>
          <p>Players can drag a pot, control burner heat, observe boiling changes with altitude, and swap workshop skins to match different lessons. The project is pre-alpha, focused on accuracy and extensibility first, visuals second.</p>
          <p>Built with React and Vite, the app separates data (fluids, workshops) from simulation code so educators and modders can add new fluids, environments, and visuals without touching core code.</p>
        </div>
      )
    }

    if (activeView === 'docs') {
      return (
        <div className="info-page">
          <h2>Project Docs (Concise)</h2>
          <p><strong>Core idea:</strong> Teach thermodynamics through interactive play. Heating uses power → temperature rise via specific heat; boiling uses latent heat; cooling uses Newton&apos;s Law of Cooling with altitude-adjusted boiling points.</p>
          <p><strong>Data-first design:</strong> Fluids live in JSON (specific heat, latent heat, boiling point, cooling coefficient). Workshops live in JSON (colors, images, layout). Add a file → get a new fluid or visual style.</p>
          <p><strong>Key files:</strong> Substance data in <a href="/src/data/substances">src/data/substances</a>, workshop files in <a href="/public/assets/workshops">public/assets/workshops</a>, physics in <a href="/src/utils/physics.js">src/utils/physics.js</a>, workshop loader in <a href="/src/utils/workshopLoader.js">src/utils/workshopLoader.js</a>.</p>
          <p><strong>What&apos;s next:</strong> More fluids (ethanol, oils), periodic table content, UI selectors for fluids, richer lesson stages, and additional workshop environments.</p>
        </div>
      )
    }

    if (activeView === 'submit-issue') {
      return (
        <div className="info-page">
          <h2>Submit an Issue</h2>
          <p>Found a bug or have feedback? Open a GitHub issue and include steps to reproduce, expected vs. actual behavior, and screenshots if possible.</p>
          <a className="action-button" href={issueUrl} target="_blank" rel="noreferrer">Open GitHub Issue</a>
        </div>
      )
    }

    if (activeView === 'submit-workshop') {
      return (
        <div className="info-page">
          <h2>Submit a Workshop or Environment</h2>
          <p>Workshops are JSON files stored with images in <code>public/assets/workshops/&lt;workshopId&gt;/</code>. Layout (pot, flame, water stream) lives in the <code>layout</code> section so placement can change per environment.</p>
          <p><strong>Minimum required fields:</strong> colors (header_background, button_primary, panel_background, etc.), images (background, pot_empty, pot_full, flame), metadata (id, name, author), and layout (pot start/size, flame position, water stream ranges).</p>
          <p><strong>How to share:</strong> Send the JSON plus your images. Keep background at 1280×800 pixels, use transparent PNGs for pot and flame, and reuse the existing placement unless your layout truly changes.</p>
        </div>
      )
    }

    // Default: Game view
    return (
      <div className="game-container">
        <GameScene
          key={gameInstanceKey}
          stage={gameStage}
          location={userLocation}
          onStageChange={setGameStage}
          workshopLayout={activeWorkshopData?.layout}
          workshopImages={activeWorkshopData?.images}
          workshopEffects={activeWorkshopData?.effects}
          burnerConfig={activeWorkshopData?.burnerConfig}
          roomConfig={activeWorkshopData?.room}
          acUnitConfig={activeWorkshopData?.acUnit}
          airHandlerConfig={activeWorkshopData?.airHandler}
          activeLevel={activeLevel}
          activeExperiment={activeExperiment}
          showSelectors={showSelectors}
          onWaterBoiled={handleWaterBoiled}
          onSkipTutorial={handleSkipTutorial}
          onLevelChange={handleLevelChange}
          onExperimentChange={handleExperimentChange}
          onLocationChange={handleLocationChange}
          onEquipmentChange={handleEquipmentChange}
          hasBoiledBefore={hasBoiledBefore}
        />
      </div>
    )
  }

  return (
    <div className="app">
      {workshopLoaded && (
        <>
          <Header
            onNavigate={handleNavigate}
            onReload={handleReload}
            onWorkshopChange={handleWorkshopChange}
            onLevelChange={handleLevelChange}
            onExperimentChange={handleExperimentChange}
            activeWorkshopId={activeWorkshopId}
            activeLevel={activeLevel}
            activeExperiment={activeExperiment}
            availableWorkshops={availableWorkshops}
            availableLevels={LEVELS}
            availableExperiments={(EXPERIMENTS[activeLevel] || []).slice().sort((a, b) => (a.order || 0) - (b.order || 0))}
            activeView={activeView}
            showSelectors={showSelectors}
            onSkipTutorial={handleSkipTutorial}
          />
          {renderView()}
        </>
      )}
    </div>
  )
}

export default App
