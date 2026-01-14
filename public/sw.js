// Service Worker per notifiche in background di TaskFlow

self.addEventListener('push', function(event) {
  const data = event.data ? event.data.json() : {};
  
  const options = {
    body: data.body || 'Hai un nuovo aggiornamento',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [200, 100, 200],
    tag: data.tag || 'taskflow-notification',
    requireInteraction: data.requireInteraction || false,
    data: data.data || {},
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'TaskFlow', options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  
  // Apri l'app quando si clicca sulla notifica
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      // Se c'è già una finestra aperta, portala in primo piano
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      // Altrimenti apri una nuova finestra
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});

// Gestisci l'installazione del service worker
self.addEventListener('install', function(event) {
  console.log('Service Worker installing.');
  self.skipWaiting();
});

// Gestisci l'attivazione del service worker
self.addEventListener('activate', function(event) {
  console.log('Service Worker activating.');
  event.waitUntil(clients.claim());
});