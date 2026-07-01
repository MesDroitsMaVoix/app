// Service worker minimal pour rendre l'app installable (PWA).
// Stratégie "network-first" : on sert toujours la version à jour si en ligne,
// et on retombe sur le cache hors-ligne.
const CACHE = 'mdmv-v1'

self.addEventListener('install', (event) => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  event.respondWith(
    fetch(request)
      .then((response) => {
        const copy = response.clone()
        caches.open(CACHE).then((cache) => cache.put(request, copy))
        return response
      })
      .catch(() => caches.match(request))
  )
})

// ---------------------------------------------------------------------------
// Notifications push (Web Push). Le serveur envoie un payload JSON
// { title, body, page?, convId?, tag? } signé via VAPID.
// ---------------------------------------------------------------------------
self.addEventListener('push', (event) => {
  let data = {}
  try {
    data = event.data ? event.data.json() : {}
  } catch {
    data = { title: 'Mes Droits Ma Voix', body: event.data ? event.data.text() : '' }
  }
  const title = data.title || 'Mes Droits Ma Voix'
  const options = {
    body: data.body || '',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    // Regroupe les notifications d'une même conversation/type (remplace au lieu d'empiler).
    tag: data.tag || undefined,
    renotify: Boolean(data.tag),
    data: { page: data.page || null, convId: data.convId ?? null },
  }
  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const target = event.notification.data || {}
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      // Fenêtre déjà ouverte : on la ramène au premier plan et on la fait naviguer.
      for (const client of clients) {
        if ('focus' in client) {
          client.postMessage({ type: 'notification-click', page: target.page, convId: target.convId })
          return client.focus()
        }
      }
      // Sinon on ouvre l'app.
      if (self.clients.openWindow) return self.clients.openWindow('/')
    })
  )
})
