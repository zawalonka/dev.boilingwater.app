import { useState, useEffect } from 'react'
import Header from './components/Header'
import GameScene from './components/GameScene'
import { initializeTheme, getAvailableThemes, preloadThemeImages } from './utils/themeLoader'
import './styles/App.css'

function App() {
  const [gameStage, setGameStage] = useState(0)
  const [userLocation, setUserLocation] = useState(null)
  const [themeLoaded, setThemeLoaded] = useState(false)
  const [activeView, setActiveView] = useState('game')  // game | about | docs | submit-issue | submit-theme
  const [gameInstanceKey, setGameInstanceKey] = useState(0)
  const [activeThemeId, setActiveThemeId] = useState('alpha')
  const [availableThemes, setAvailableThemes] = useState([{ id: 'alpha', name: 'Alpha Theme' }])
  const [activeThemeData, setActiveThemeData] = useState(null)

  // Load available themes and apply default
  useEffect(() => {
    async function bootTheme() {
      try {
        const list = await getAvailableThemes()
        setAvailableThemes(list)
        const processed = await initializeTheme(activeThemeId, { apply: true })
        // Preload all theme images to prevent lag
        await preloadThemeImages(processed)
        setActiveThemeData(processed)
        setThemeLoaded(true)
      } catch (error) {
        console.error('Failed to load theme:', error)
        setThemeLoaded(true)
      }
    }
    bootTheme()
  }, [])

  // Theme change handler
  const handleThemeChange = async (themeId) => {
    console.log('🎨 Theme change requested:', themeId)
    try {
      const processed = await initializeTheme(themeId, { apply: true })
      console.log('🎨 Theme processed:', processed)
      // Preload new theme images immediately
      await preloadThemeImages(processed)
      console.log('🎨 Setting activeThemeId to:', themeId)
      setActiveThemeId(themeId)
      setActiveThemeData(processed)
      console.log('🎨 Theme state updated')
    } catch (error) {
      console.error('Failed to change theme:', error)
    }
  }

  // Location will be requested when entering stage 2 (altitude-based lessons)
  // For now, default to sea level
  useEffect(() => {
    if (gameStage === 2) {
      // Future: Request geolocation here when we implement stage 2
      // For now, just set to sea level
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

  const issueUrl = 'https://github.com/BoilingWaterApp/Boilingwater.app/issues/new'

  const renderView = () => {
    if (activeView === 'about') {
      return (
        <div className="info-page">
          <h2>About Boiling Water</h2>
          <p>Boiling Water is an educational physics and chemistry sandbox that shows how fluids heat, cool, and boil under different conditions. It uses real thermodynamics (specific heat, latent heat, altitude-based boiling points, and Newton&apos;s Law of Cooling) with extensible JSON-based fluid and theme systems.</p>
          <p>Players can drag a pot, control burner heat, observe boiling changes with altitude, and swap themes to match different workshops or lessons. The project is pre-alpha, focused on accuracy and extensibility first, visuals second.</p>
          <p>Built with React and Vite, the app separates data (fluids, themes) from simulation code so educators and modders can add new fluids, environments, and visuals without touching core code.</p>
        </div>
      )
    }

    if (activeView === 'docs') {
      return (
        <div className="info-page">
          <h2>Project Docs (Concise)</h2>
          <p><strong>Core idea:</strong> Teach thermodynamics through interactive play. Heating uses power → temperature rise via specific heat; boiling uses latent heat; cooling uses Newton&apos;s Law of Cooling with altitude-adjusted boiling points.</p>
          <p><strong>Data-first design:</strong> Fluids live in JSON (specific heat, latent heat, boiling point, cooling coefficient). Themes live in JSON (colors, images, layout). Add a file → get a new fluid or visual style.</p>
          <p><strong>Key files:</strong> Fluid data in <a href="/src/data/fluids">src/data/fluids</a>, theme data in <a href="/src/data/themes">src/data/themes</a>, physics in <a href="/src/utils/physics.js">src/utils/physics.js</a>, theme loader in <a href="/src/utils/themeLoader.js">src/utils/themeLoader.js</a>.</p>
          <p><strong>What&apos;s next:</strong> More fluids (ethanol, oils), periodic table content, UI selectors for fluids, richer lesson stages, and additional themed environments.</p>
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

    if (activeView === 'submit-theme') {
      return (
        <div className="info-page">
          <h2>Submit a Theme or Environment</h2>
          <p>Themes are JSON files in <code>src/data/themes/</code> plus images in <code>public/assets/images/themes/&lt;themeId&gt;/</code>. Layout (pot, flame, water stream) lives in the <code>layout</code> section so placement can change per environment.</p>
          <p><strong>Minimum required fields:</strong> colors (header_background, button_primary, panel_background, etc.), images (background, pot_empty, pot_full, flame), metadata (id, name, author), and layout (pot start/size, flame position, water stream ranges).</p>
          <p><strong>How to share:</strong> Send the JSON plus your images. Keep background at 1280x800, use transparent PNGs for pot and flame, and reuse the existing placement unless your layout changes are intentional.</p>
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
          themeLayout={activeThemeData?.layout}
          themeImages={activeThemeData?.images}
        />
      </div>
    )
  }

  return (
    <div className="app">
      {themeLoaded && (
        <>
          <Header
            onNavigate={handleNavigate}
            onReload={handleReload}
            onThemeChange={handleThemeChange}
            activeThemeId={activeThemeId}
            availableThemes={availableThemes}
            activeView={activeView}
          />
          {renderView()}
        </>
      )}
    </div>
  )
}

export default App
