/* ─── Firebase Cloud Messaging Service Worker ───
 * Replace the placeholder values below with your actual VITE_FIREBASE_* env vars
 * at build time (e.g. via a replace script or service-worker injection plugin).
 *
 * Standard Firebase compat imports from CDN. Uses firebase@10 compat (messaging compat).
 * v10 compat is pinned because newer major versions may break the importScripts API.
 */

importScripts('https://www.gstatic.com/firebasejs/10/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10/firebase-messaging-compat.js');

// ═══ REPLACE WITH VITE_FIREBASE_* VALUES AT BUILD TIME ═══
firebase.initializeApp({
  apiKey: 'VITE_FIREBASE_API_KEY_PLACEHOLDER',
  authDomain: 'VITE_FIREBASE_AUTH_DOMAIN_PLACEHOLDER',
  projectId: 'VITE_FIREBASE_PROJECT_ID_PLACEHOLDER',
  storageBucket: 'VITE_FIREBASE_STORAGE_BUCKET_PLACEHOLDER',
  messagingSenderId: 'VITE_FIREBASE_MESSAGING_SENDER_ID_PLACEHOLDER',
  appId: 'VITE_FIREBASE_APP_ID_PLACEHOLDER',
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

// Notification click → open the linked URL (or root)
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.link ?? '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Focus an already-open window if available
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

// Ensure the SW takes control immediately
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(clients.claim()));
