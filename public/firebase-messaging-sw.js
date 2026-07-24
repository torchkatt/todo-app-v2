/* ─── Firebase Cloud Messaging Service Worker ───
 * Pin v10.14.0 (compat) — major version only URL returns 404.
 * Config values are hardcoded because public/ files bypass Vite env injection.
 */
importScripts('https://www.gstatic.com/firebasejs/10.14.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyBtvJzA9Q0A1HBdCqTgCnU',
  authDomain: 'todo-a44f9.firebaseapp.com',
  projectId: 'todo-a44f9',
  storageBucket: 'todo-a44f9.firebasestorage.app',
  messagingSenderId: '741867785122',
  appId: '1:741867785122:web:18cf567bfb8efa689f40fb',
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const { title, body } = payload.notification ?? {};
  const icon = '/pwa-192x192.png';

  self.registration.showNotification(title ?? 'Todo', {
    body: body ?? '',
    icon,
    badge: icon,
    vibrate: [200, 100, 200],
    data: payload.data ?? {},
  });
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.link ?? '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(url) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(clients.claim()));
