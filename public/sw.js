/* Cuatro Huellas — service worker del panel.
   Solo hace dos cosas: recibir notificaciones push y abrir la agenda al tocarlas.
   No cachea nada: el panel siempre debe mostrar datos frescos. */

const AGENDA_URL = '/admin/dashboard/agenda'

// Al instalar/activar tomamos el control de inmediato, sin esperar a que el
// usuario cierre todas las pestañas. Así una versión nueva del SW aplica al toque.
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()))

// Handler mínimo de fetch: no intercepta nada, pero Chrome lo exige para
// considerar la app instalable.
self.addEventListener('fetch', () => {})

self.addEventListener('push', (event) => {
  let payload = {}
  try {
    payload = event.data ? event.data.json() : {}
  } catch {
    payload = { title: 'Cuatro Huellas', body: event.data ? event.data.text() : '' }
  }

  const title = payload.title || 'Cuatro Huellas'
  const options = {
    body: payload.body || '',
    icon: '/icon-192.png',
    badge: '/badge-96.png',
    vibrate: [120, 60, 120],
    // tag único por cita: dos reservas distintas se muestran por separado,
    // pero un reenvío de la misma no duplica el aviso.
    tag: payload.tag || `ch-${Date.now()}`,
    requireInteraction: true,
    data: { url: payload.url || AGENDA_URL },
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const target = (event.notification.data && event.notification.data.url) || AGENDA_URL

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windows) => {
      // Si el panel ya está abierto, lo traemos al frente y lo llevamos a la agenda.
      for (const client of windows) {
        if (client.url.includes('/admin/') && 'focus' in client) {
          client.navigate(target)
          return client.focus()
        }
      }
      return self.clients.openWindow(target)
    })
  )
})
