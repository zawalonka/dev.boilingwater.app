// NOTE: Read the header comments before editing. Reassess splitting into subcomponents when adding new items or behaviors.
import { useEffect } from 'react'
import Header from './components/Header'
import GameScene from './components/GameScene'
import { useGameStore } from './hooks/stores/gameStore'
import { useWorkshopStore } from './hooks/stores/workshopStore'
import './styles/App.css'

function App() {
  const gameStage = useGameStore((state) => state.gameStage)
  const workshopLoaded = useGameStore((state) => state.workshopLoaded)
  const activeView = useGameStore((state) => state.activeView)
  const gameInstanceKey = useGameStore((state) => state.gameInstanceKey)
  const showSelectors = useGameStore((state) => state.showSelectors)
  const setGameStage = useGameStore((state) => state.setGameStage)
  const setUserLocation = useGameStore((state) => state.setUserLocation)
  const setActiveView = useGameStore((state) => state.setActiveView)
  const bumpGameInstanceKey = useGameStore((state) => state.bumpGameInstanceKey)
  const setShowSelectors = useGameStore((state) => state.setShowSelectors)

  const activeWorkshopData = useWorkshopStore((state) => state.activeWorkshopData)
  const bootWorkshops = useWorkshopStore((state) => state.bootWorkshops)
  const changeWorkshop = useWorkshopStore((state) => state.changeWorkshop)
  const changeLevel = useWorkshopStore((state) => state.changeLevel)
  const changeExperiment = useWorkshopStore((state) => state.changeExperiment)
  const changeEquipment = useWorkshopStore((state) => state.changeEquipment)

  // Load available workshops and apply default
  useEffect(() => {
    bootWorkshops()
  }, [])

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
    await changeLevel(1, 'altitude-effect')
  }

  const handleNavigate = (view) => {
    setActiveView(view)
    if (view === 'game') {
      setGameStage(0)
    }
  }

  const handleReload = () => {
    setGameStage(0)
    bumpGameInstanceKey()
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
          workshopLayout={activeWorkshopData?.layout}
          workshopImages={activeWorkshopData?.images}
          workshopEffects={activeWorkshopData?.effects}
          burnerConfig={activeWorkshopData?.burnerConfig}
          roomConfig={activeWorkshopData?.room}
          acUnitConfig={activeWorkshopData?.acUnit}
          airHandlerConfig={activeWorkshopData?.airHandler}
          onLevelChange={changeLevel}
          onExperimentChange={changeExperiment}
          onEquipmentChange={changeEquipment}
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
            onWorkshopChange={changeWorkshop}
            onLevelChange={changeLevel}
            onExperimentChange={changeExperiment}
            onSkipTutorial={handleSkipTutorial}
          />
          {renderView()}
        </>
      )}
    </div>
  )
}

export default App
