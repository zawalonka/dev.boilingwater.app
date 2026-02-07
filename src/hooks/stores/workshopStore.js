import { create } from 'zustand'
import { EXPERIMENTS } from '../../constants/workshops'
import { initializeWorkshop, getWorkshopsByLevel, preloadWorkshopImages, loadEquipment } from '../../utils/workshopLoader'
import { useGameStore } from './gameStore'

export const useWorkshopStore = create((set, get) => ({
  activeLevel: 1,
  activeExperiment: 'boiling-water',
  activeWorkshopId: 'pre-alpha-kitchen-1',
  availableWorkshops: [{ id: 'pre-alpha-kitchen-1', name: 'Pre Alpha Kitchen 1' }],
  activeWorkshopData: null,
  setActiveLevel: (level) => set({ activeLevel: level }),
  setActiveExperiment: (experimentId) => set({ activeExperiment: experimentId }),
  setActiveWorkshopId: (workshopId) => set({ activeWorkshopId: workshopId }),
  setAvailableWorkshops: (workshops) => set({ availableWorkshops: workshops }),
  setActiveWorkshopData: (data) => set({ activeWorkshopData: data }),
  bootWorkshops: async () => {
    const { activeLevel, activeWorkshopId } = get()
    try {
      const levelWorkshops = await getWorkshopsByLevel(activeLevel)
      set({ availableWorkshops: levelWorkshops })
      const processed = await initializeWorkshop(activeWorkshopId, { apply: true })
      await preloadWorkshopImages(processed)
      set({ activeWorkshopData: processed })
      useGameStore.getState().setWorkshopLoaded(true)
    } catch (error) {
      console.error('Failed to load workshop:', error)
      useGameStore.getState().setWorkshopLoaded(true)
    }
  },
  changeWorkshop: async (workshopId) => {
    try {
      const processed = await initializeWorkshop(workshopId, { apply: true })
      await preloadWorkshopImages(processed)
      set({ activeWorkshopId: workshopId, activeWorkshopData: processed })
      const gameStore = useGameStore.getState()
      gameStore.setGameStage(0)
      gameStore.bumpGameInstanceKey()
    } catch (error) {
      console.error('Failed to change workshop:', error)
    }
  },
  changeLevel: async (levelId, optionalNextExperimentId = null) => {
    try {
      const levelWorkshops = await getWorkshopsByLevel(levelId)
      set({ availableWorkshops: levelWorkshops, activeLevel: levelId })

      const firstWorkshop = levelWorkshops && levelWorkshops.length > 0
        ? levelWorkshops[0]
        : { id: 'pre-alpha-kitchen-1' }
      const processed = await initializeWorkshop(firstWorkshop.id, { apply: true })
      await preloadWorkshopImages(processed)
      set({ activeWorkshopId: firstWorkshop.id, activeWorkshopData: processed })

      const sortedExperiments = (EXPERIMENTS[levelId] || [])
        .slice()
        .sort((a, b) => (a.order || 0) - (b.order || 0))
      const defaultExperiment = optionalNextExperimentId || sortedExperiments?.[0]?.id || 'boiling-water'
      set({ activeExperiment: defaultExperiment })

      const gameStore = useGameStore.getState()
      gameStore.setGameStage(0)
      gameStore.bumpGameInstanceKey()
    } catch (error) {
      console.error('Failed to change level:', error)
    }
  },
  changeExperiment: (experimentId) => {
    set({ activeExperiment: experimentId })
    const gameStore = useGameStore.getState()
    gameStore.setGameStage(0)
    gameStore.bumpGameInstanceKey()
  },
  changeEquipment: async (equipmentType, equipmentId) => {
    const { activeWorkshopData, activeWorkshopId } = get()
    if (!activeWorkshopData || !activeWorkshopId) return

    try {
      const newEquipment = await loadEquipment(activeWorkshopId, equipmentType, equipmentId)
      if (!newEquipment) {
        console.warn(`Could not load ${equipmentType}/${equipmentId}`)
        return
      }

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

      set({ activeWorkshopData: updatedWorkshopData })
      const gameStore = useGameStore.getState()
      gameStore.setGameStage(0)
      gameStore.bumpGameInstanceKey()
    } catch (error) {
      console.error(`Failed to change ${equipmentType}:`, error)
    }
  }
}))
