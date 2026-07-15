self.addEventListener('push', (event) => {
  let payload = {}
  try {
    payload = event.data ? event.data.json() : {}
  } catch {
    payload = { body: event.data ? event.data.text() : '' }
  }

  event.waitUntil(self.registration.showNotification(payload.title || 'Dukwise', {
    body: payload.body || 'You have a new business update.',
    icon: '/icons/dukwise-192.png',
    badge: '/icons/favicon-32.png',
    tag: payload.tag || 'dukwise-alert',
    data: { route: payload.route || '/notification-center' },
  }))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const route = event.notification.data?.route || '/notification-center'
  event.waitUntil((async () => {
    const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
    for (const client of clients) {
      if ('focus' in client) {
        await client.focus()
        if ('navigate' in client) await client.navigate(route)
        return
      }
    }
    if (self.clients.openWindow) await self.clients.openWindow(route)
  })())
})
