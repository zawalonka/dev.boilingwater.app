const CACHE_VERSION = 'v2'
const APP_CACHE = `boilingwater-app-${CACHE_VERSION}`
const RUNTIME_CACHE = `boilingwater-runtime-${CACHE_VERSION}`

const CORE_ASSETS = ['./', './index.html']
const PRECACHE_MANIFEST_URL = './precache-manifest.json'

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(APP_CACHE)

    try {
      const response = await fetch(PRECACHE_MANIFEST_URL, { cache: 'no-cache' })
      const manifest = response.ok ? await response.json() : []
      const urls = [...CORE_ASSETS, ...manifest]
      const normalizedUrls = Array.from(new Set(urls))
        .filter(Boolean)
        .map((url) => new URL(url, self.registration.scope).toString())

      if (normalizedUrls.length) {
        await cache.addAll(normalizedUrls)
      }
    } catch (error) {
      await cache.addAll(CORE_ASSETS)
    }

    self.skipWaiting()
  })())
})

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const cacheNames = await caches.keys()
    await Promise.all(
      cacheNames
        .filter((name) => name !== APP_CACHE && name !== RUNTIME_CACHE)
        .map((name) => caches.delete(name))
    )

    await self.clients.claim()
  })())
})

async function cacheFirst(request) {
  const cached = await caches.match(request)
  if (cached) return cached

  const response = await fetch(request)
  if (response && response.ok) {
    const cache = await caches.open(RUNTIME_CACHE)
    cache.put(request, response.clone())
  }

  return response
}

async function networkFirst(request) {
  try {
    const response = await fetch(request)
    if (response && response.ok) {
      const cache = await caches.open(RUNTIME_CACHE)
      cache.put(request, response.clone())
    }
    return response
  } catch (error) {
    const cached = await caches.match(request)
    if (cached) return cached
    throw error
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event

  if (request.method !== 'GET') return

  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request))
    return
  }

  event.respondWith(cacheFirst(request))
})
