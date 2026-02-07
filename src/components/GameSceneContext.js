import { createContext, useContext } from 'react'

const GameSceneContext = createContext(null)

export const GameSceneProvider = GameSceneContext.Provider

export const useGameSceneContext = () => {
  const context = useContext(GameSceneContext)
  if (!context) {
    throw new Error('useGameSceneContext must be used within GameSceneProvider')
  }
  return context
}
