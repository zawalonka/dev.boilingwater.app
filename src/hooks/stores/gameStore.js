// NOTE: Read the header comments before editing. Reassess splitting into subcomponents when adding new items or behaviors.
import { create } from 'zustand'

export const useGameStore = create((set) => ({
  gameStage: 0,
  activeView: 'game',
  gameInstanceKey: 0,
  userLocation: null,
  showSelectors: false,
  hasBoiledBefore: false,
  workshopLoaded: false,
  setGameStage: (stage) => set({ gameStage: stage }),
  setActiveView: (view) => set({ activeView: view }),
  bumpGameInstanceKey: () =>
    set((state) => ({ gameInstanceKey: state.gameInstanceKey + 1 })),
  setUserLocation: (location) => set({ userLocation: location }),
  setShowSelectors: (value) => set({ showSelectors: value }),
  setHasBoiledBefore: (value) => set({ hasBoiledBefore: value }),
  setWorkshopLoaded: (value) => set({ workshopLoaded: value })
}))
