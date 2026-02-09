// NOTE: Read the header comments before editing. Reassess splitting into subcomponents when adding new items or behaviors.
/**
 * useLocationControls Hook
 *
 * Manages location/altitude UI state and actions for GameScene.
 */

import { useCallback, useState } from 'react'

export function useLocationControls({ location, setUserLocation }) {
  const [userZipCode, setUserZipCode] = useState('')
  const [manualAltitude, setManualAltitude] = useState('')
  const [editableAltitude, setEditableAltitude] = useState(null)
  const [hasSetLocation, setHasSetLocation] = useState(
    () => Boolean(location?.altitude !== 0 || location?.name)
  )
  const [isLoadingLocation, setIsLoadingLocation] = useState(false)
  const [locationError, setLocationError] = useState(null)
  const [locationName, setLocationName] = useState(() => location?.name || null)
  const [showLocationPopup, setShowLocationPopup] = useState(false)

  const handleSearchLocation = useCallback(async () => {
    if (!userZipCode.trim()) {
      setLocationError('Please enter a location (city, landmark, region, etc.)')
      return
    }

    setIsLoadingLocation(true)
    setLocationError(null)

    try {
      const { getAltitudeFromLocationName } = await import('../utils/locationUtils')
      const result = await getAltitudeFromLocationName(userZipCode)

      setUserLocation({
        altitude: result.altitude,
        name: result.name,
        fullName: result.fullName,
        latitude: result.latitude,
        longitude: result.longitude
      })

      setLocationName(result.name)
      setLocationError(null)
      setUserZipCode('')
      setManualAltitude('')
      setHasSetLocation(true)
      setShowLocationPopup(false)
    } catch (error) {
      setLocationError(error.message || 'Location not found. Try a city, landmark, or geographic feature.')
      console.error('Location search error:', error)
    } finally {
      setIsLoadingLocation(false)
    }
  }, [setUserLocation, userZipCode])

  const handleSetManualAltitude = useCallback(() => {
    const altitudeNum = parseFloat(manualAltitude)

    // Allow any number (negative for below sea level: Death Valley -86m, Dead Sea -430m)
    if (isNaN(altitudeNum)) {
      setLocationError('Please enter a valid altitude in meters (negative for below sea level)')
      return
    }

    setUserLocation({
      altitude: altitudeNum,
      latitude: null,
      longitude: null
    })

    setLocationName('')
    setUserZipCode('')
    setManualAltitude('')
    setLocationError(null)
    setHasSetLocation(true)
    setShowLocationPopup(false)
  }, [manualAltitude, setUserLocation])

  const handleFindMyLocation = useCallback(async () => {
    setIsLoadingLocation(true)
    setLocationError(null)

    try {
      const { getUserLocation } = await import('../utils/locationUtils')
      const result = await getUserLocation()

      setUserLocation({
        altitude: result.altitude,
        name: result.name,
        latitude: result.latitude,
        longitude: result.longitude
      })

      setLocationName(result.name)
      setUserZipCode('')
      setManualAltitude('')
      setLocationError(null)
      setHasSetLocation(true)
      setShowLocationPopup(false)
    } catch (error) {
      setLocationError(error.message || 'Could not access your location')
      console.error('Geolocation error:', error)
    } finally {
      setIsLoadingLocation(false)
    }
  }, [setUserLocation])

  return {
    userZipCode,
    manualAltitude,
    editableAltitude,
    hasSetLocation,
    isLoadingLocation,
    locationError,
    locationName,
    showLocationPopup,
    setUserZipCode,
    setManualAltitude,
    setLocationError,
    setShowLocationPopup,
    handleSearchLocation,
    handleSetManualAltitude,
    handleFindMyLocation
  }
}

export default useLocationControls
