import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'favicon.svg',
        'icons.svg',
        'pwa-192x192.png',
        'pwa-512x512.png',
        'apple-touch-icon.png',
        'offline.html',
      ],
      manifest: {
        name: 'Todo — Marketplace Colombia',
        short_name: 'Todo',
        description:
          'Compra productos, reserva servicios, descarga contenido digital en Colombia. Marketplace con pagos Wompi, AI Chat y analytics.',
        theme_color: '#7c3aed',
        background_color: '#faf9f7',
        display: 'standalone',
        orientation: 'portrait-primary',
        categories: ['marketplace', 'shopping', 'lifestyle'],
        lang: 'es-CO',
        dir: 'ltr',
        start_url: '/',
        scope: '/',
        icons: [
          { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
        screenshots: [],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,json}'],
        globIgnores: ['**/firebase-messaging-sw.js'],
        // SPA fallback for offline navigation
        navigateFallback: '/offline.html',
        navigateFallbackAllowlist: [/^(?!\/__).*/],
        runtimeCaching: [
          // Firebase APIs — NetworkFirst, fallback to cache
          {
            urlPattern: /firestore|identitytoolkit|securetoken\.googleapis\.com/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'firebase-api-cache',
              networkTimeoutSeconds: 5,
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 5 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /cloudfunctions\.net/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'cloud-functions-cache',
              networkTimeoutSeconds: 10,
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          // Firebase Storage — CacheFirst (images rarely change)
          {
            urlPattern: /firebasestorage\.googleapis\.com/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'firebase-storage-cache',
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          // Google Fonts
          {
            urlPattern: /fonts\.(googleapis|gstatic)\.com/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          // Navigation requests — NetworkFirst with quick timeout
          {
            urlPattern: ({ request }) => request.mode === 'navigate',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'pages-cache',
              networkTimeoutSeconds: 15,
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          // External images — StaleWhileRevalidate
          {
            urlPattern: /\.(?:png|jpg|jpeg|gif|webp|svg)(?:\?.*)?$/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'external-images-cache',
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 7 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 4000,
  },
  build: {
    sourcemap: 'hidden',
  },
});
