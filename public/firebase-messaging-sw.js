self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(clients.claim()));

self.addEventListener('push', e => {
  const data = e.data?.json() || { title: 'Todo', body: 'Tienes una nueva notificación' };
  self.registration.showNotification(data.title, {
    body: data.body,
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    vibrate: [200, 100, 200],
    data: data.data || {},
  });
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  const urlToOpen = e.notification.data?.url || '/';
  e.waitUntil(clients.openWindow(urlToOpen));
});
