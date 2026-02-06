import { create } from 'zustand'

export const useWorkshopStore = create((set) => ({
  activeLevel: 1,
  activeExperiment: 'boiling-water',
  activeWorkshopId: 'pre-alpha-kitchen-1',
  availableWorkshops: [{ id: 'pre-alpha-kitchen-1', name: 'Pre Alpha Kitchen 1' }],
  activeWorkshopData: null,
  setActiveLevel: (level) => set({ activeLevel: level }),
  setActiveExperiment: (experimentId) => set({ activeExperiment: experimentId }),
  setActiveWorkshopId: (workshopId) => set({ activeWorkshopId: workshopId }),
  setAvailableWorkshops: (workshops) => set({ availableWorkshops: workshops }),
  setActiveWorkshopData: (data) => set({ activeWorkshopData: data })
}))
