/**
 * Environment Configuration (Vite)
 * Centralized, safe access to environment variables with defaults.
 */

const normalizeBaseUrl = (value, fallback) => {
  const raw = value || fallback
  return raw.endsWith('/') ? raw.slice(0, -1) : raw
}

const toNumber = (value, fallback) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

export const APP_ENV = {
  openElevationBaseUrl: normalizeBaseUrl(
    import.meta.env?.VITE_OPEN_ELEVATION_BASE_URL,
    'https://api.open-elevation.com/api/v1'
  ),
  nominatimBaseUrl: normalizeBaseUrl(
    import.meta.env?.VITE_NOMINATIM_BASE_URL,
    'https://nominatim.openstreetmap.org'
  ),
  nominatimUserAgent:
    import.meta.env?.VITE_NOMINATIM_USER_AGENT ||
    'BoilingWater-EducationalApp/1.0',
  locationResultLimit: toNumber(
    import.meta.env?.VITE_LOCATION_RESULT_LIMIT,
    5
  ),
  geolocationTimeoutMs: toNumber(
    import.meta.env?.VITE_GEOLOCATION_TIMEOUT_MS,
    5000
  ),
  geolocationMaxAgeMs: toNumber(
    import.meta.env?.VITE_GEOLOCATION_MAX_AGE_MS,
    3600000
  )
}
