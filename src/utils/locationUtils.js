/**
 * Location & Altitude Utilities
 * Handles worldwide location search, geocoding, geolocation, and altitude lookups
 * Works anywhere in the world via OpenStreetMap Nominatim API
 */

import { APP_ENV } from '../config/env'

/**
 * Get altitude from coordinates using Open-Elevation API (free, no key required)
 * @param {number} latitude
 * @param {number} longitude
 * @returns {Promise<number>} Altitude in meters
 */
export const getAltitudeFromCoordinates = async (latitude, longitude) => {
  try {
    const { openElevationBaseUrl } = APP_ENV
    const response = await fetch(
      `${openElevationBaseUrl}/lookup?locations=${latitude},${longitude}`
    );
    if (!response.ok) throw new Error('Open-Elevation API error');
    const data = await response.json();
    return data.results[0]?.elevation || 0;
  } catch (error) {
    console.error('Error fetching altitude:', error);
    return 0; // Default to sea level on error
  }
};

/**
 * Search for a location by place name worldwide
 * Accepts city names, regions, landmarks, etc. (works anywhere globally)
 * Examples: "Denver", "Tokyo", "Mount Everest", "Sydney", "London"
 * 
 * @param {string} locationName - Place name, city, region, or landmark
 * @returns {Promise<{latitude: number, longitude: number, name: string, type: string}>}
 */
export const searchLocation = async (locationName) => {
  try {
    const { nominatimBaseUrl, nominatimUserAgent, locationResultLimit } = APP_ENV
    const response = await fetch(
      `${nominatimBaseUrl}/search?q=${encodeURIComponent(locationName)}&format=json&limit=${locationResultLimit}`,
      {
        headers: {
          'User-Agent': nominatimUserAgent
        }
      }
    );

    if (!response.ok) throw new Error('Location search failed');
    const data = await response.json();

    if (data.length === 0) {
      throw new Error(`Location not found: "${locationName}". Try a city, landmark, mountain, or geographic feature.`);
    }

    // Return best match (first result is usually most relevant)
    const result = data[0];
    return {
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
      name: result.display_name.split(',')[0], // First part is usually the city/landmark
      type: result.type || 'location',
      fullName: result.display_name
    };
  } catch (error) {
    console.error('Error searching location:', error);
    throw error;
  }
};

/**
 * Get altitude from location name (combines search→coords→altitude)
 * Works worldwide: "Denver", "Tokyo", "Sydney", "Cairo", etc.
 * 
 * @param {string} locationName - Place name, city, or landmark
 * @returns {Promise<{altitude: number, name: string, fullName: string}>}
 */
export const getAltitudeFromLocationName = async (locationName) => {
  try {
    const location = await searchLocation(locationName);
    const altitude = await getAltitudeFromCoordinates(location.latitude, location.longitude);
    return {
      altitude,
      name: location.name,
      fullName: location.fullName,
      latitude: location.latitude,
      longitude: location.longitude
    };
  } catch (error) {
    console.error('Error fetching altitude from location name:', error);
    throw error;
  }
};


/**
 * Get user's current location using browser Geolocation API
 * @returns {Promise<{latitude: number, longitude: number, altitude: number, name: string}>}
 */
export const getUserLocation = async () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported by this browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const { nominatimBaseUrl, nominatimUserAgent } = APP_ENV
          const altitude = await getAltitudeFromCoordinates(latitude, longitude);
          
          // Try to get location name from reverse geocoding
          const response = await fetch(
            `${nominatimBaseUrl}/reverse?lat=${latitude}&lon=${longitude}&format=json`,
            {
              headers: {
                'User-Agent': nominatimUserAgent
              }
            }
          );
          
          let name = 'Your Location';
          if (response.ok) {
            const data = await response.json();
            name = data.address?.city || data.address?.town || data.address?.county || 'Your Location';
          }
          
          resolve({ latitude, longitude, altitude, name });
        } catch (error) {
          // Still return coords even if altitude lookup fails
          resolve({ latitude, longitude, altitude: 0, name: 'Your Location' });
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        reject(error);
      },
      {
        enableHighAccuracy: false,
        timeout: APP_ENV.geolocationTimeoutMs,
        maximumAge: APP_ENV.geolocationMaxAgeMs // Cache location for 1 hour
      }
    );
  });
};

/**
 * Format altitude for display
 * @param {number} altitude - Altitude in meters
 * @param {string} unit - 'metric' or 'imperial'
 * @returns {string} Formatted string like "1,200 m" or "3,937 ft"
 */
export const formatAltitude = (altitude, unit = 'metric') => {
  if (unit === 'imperial') {
    const feet = altitude * 3.28084;
    return `${Math.round(feet).toLocaleString()} ft`;
  }
  return `${Math.round(altitude).toLocaleString()} m`;
};
