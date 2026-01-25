import { useState, useEffect } from 'react'
import Header from './components/Header'
import GameScene from './components/GameScene'
import './styles/App.css'

function App() {
  const [gameStage, setGameStage] = useState(0)
  const [userLocation, setUserLocation] = useState(null)

  useEffect(() => {
    // Get user's approximate location for altitude-based calculations
    // In production, this would use geolocation API
    setUserLocation({
      altitude: 0,
      latitude: 0,
      longitude: 0
    })
  }, [])

  return (
    <div className="app">
      <Header />
      <div className="game-container">
        <GameScene 
          stage={gameStage} 
          location={userLocation}
          onStageChange={setGameStage}
        />
      </div>
    </div>
  )
}

export default App
