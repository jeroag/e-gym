// ── E-GYM Service Worker ────────────────────────────────────
// Estrategia: Cache-first para assets estáticos, Network-first para API.
// Offline fallback para navegación.

const CACHE_NAME   = 'egym-v1'
const OFFLINE_URL  = '/offline.html'

// Assets del app shell que se cachean al instalar
const PRECACHE = [
  '/',
  '/offline.html'
]

// ── Install ──────────────────────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  )
})

// ── Activate ─────────────────────────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  )
})

// ── Fetch ─────────────────────────────────────────────────────
self.addEventListener('fetch', event => {
  const { request } = event
  const url = new URL(request.url)

  // Ignorar: peticiones no GET, API, extensiones de chrome, etc.
  if (request.method !== 'GET') return
  if (url.pathname.startsWith('/api/')) return
  if (!url.protocol.startsWith('http')) return

  // Navegación (HTML): Network-first con offline fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .catch(() => caches.match(OFFLINE_URL))
    )
    return
  }

  // Assets JS/CSS/imágenes: Cache-first, actualiza en background (stale-while-revalidate)
  event.respondWith(
    caches.open(CACHE_NAME).then(async cache => {
      const cached = await cache.match(request)
      const networkFetch = fetch(request).then(response => {
        if (response.ok) cache.put(request, response.clone())
        return response
      }).catch(() => null)

      return cached ?? networkFetch
    })
  )
})
