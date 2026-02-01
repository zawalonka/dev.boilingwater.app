/**
 * useRoomEnvironment Hook
 * 
 * React hook that manages room environment state, integrating with
 * the simulation loop. Keeps room logic out of GameScene.
 */

import { useState, useCallback, useEffect } from 'react'
import { createRoomState, simulateRoomStep, getRoomSummary } from '../utils/roomEnvironment'

/**
 * Hook to manage room environment state
 * @param {object} roomConfig - Room config from workshop (room.json)
 * @param {object} acUnit - AC unit config (from JSON)
 * @param {object} airHandler - Air handler config
 * @returns {object} Room state and control functions
 */
export function useRoomEnvironment(roomConfig, acUnit, airHandler) {
  const [roomState, setRoomState] = useState(() => createRoomState(roomConfig))
  
  // Reset room state when config changes
  useEffect(() => {
    if (roomConfig) {
      setRoomState(createRoomState(roomConfig))
    }
  }, [roomConfig])

  /**
   * Update room simulation for one timestep
   * Call this from the main game loop
   * @param {number} deltaTime - Time step in seconds
   * @param {string} heatSource - Source of heat (e.g., 'experiment_burner')
   * @param {number} heatWatts - Heat in watts
   */
  const updateRoom = useCallback((deltaTime, heatSource, heatWatts) => {
    if (!roomConfig) return

    const options = {}
    if (heatSource && heatWatts > 0) {
      options.externalHeat = heatWatts
    }

    setRoomState(prev => simulateRoomStep(prev, acUnit, airHandler, deltaTime, options))
  }, [roomConfig, acUnit, airHandler])

  /**
   * Add vapor from boiling to room
   * @param {string} substanceId - Substance ID (e.g., 'H2O', 'C2H5OH')
   * @param {number} massKg - Mass evaporated (kg)
   * @param {number} molarMass - Molar mass (g/mol)
   */
  const addVapor = useCallback((substanceId, massKg, molarMass) => {
    if (!roomConfig || massKg <= 0) return
    
    setRoomState(prev => simulateRoomStep(prev, acUnit, airHandler, 0, {
      vaporInput: { substanceId, massKg, molarMass: molarMass / 1000 }  // Convert g/mol to kg/mol
    }))
  }, [roomConfig, acUnit, airHandler])

  /**
   * Set AC temperature setpoint
   * @param {number} tempC - Target temperature (°C)
   */
  const setAcSetpoint = useCallback((tempC) => {
    setRoomState(prev => ({
      ...prev,
      acSetpoint: Math.max(10, Math.min(35, tempC))
    }))
  }, [])

  /**
   * Set air handler operating mode
   * @param {string} mode - 'off' | 'low' | 'medium' | 'high' | 'turbo'
   */
  const setAirHandlerMode = useCallback((mode) => {
    setRoomState(prev => ({
      ...prev,
      airHandlerMode: mode
    }))
  }, [])

  /**
   * Reset room to initial state
   */
  const resetRoom = useCallback(() => {
    setRoomState(createRoomState(roomConfig))
    lastUpdateRef.current = Date.now()
  }, [roomConfig])

  /**
   * Get experiment data for scorecard
   */
  const getExperimentData = useCallback(() => {
    return {
      heatLog: roomState.heatLog,
      compositionLog: roomState.compositionLog,
      finalState: getRoomSummary(roomState),
      duration: Date.now() - roomState.startTime
    }
  }, [roomState])

  return {
    // State
    roomState,
    summary: getRoomSummary(roomState),
    alerts: roomState.alerts,
    
    // Actions
    updateRoom,
    addVapor,
    setAcSetpoint,
    setAirHandlerMode,
    resetRoom,
    getExperimentData
  }
}

export default useRoomEnvironment
