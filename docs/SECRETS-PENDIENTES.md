# Secretos pendientes de configurar

> Estos secrets ya están definidos en `functions/src/config.ts` y listos para usarse.
> Solo falta setear los valores reales y redeployar las funciones.

## 🔴 Sentry DSN (Functions)

Código listo en `functions/src/lib/sentry.ts` y `functions/src/config.ts`.
Las Functions `aiChat`, `wompiWebhook` y `createTransaction` ya tienen `SENTRY_DSN` como secret.

```bash
printf 'https://xxx@xxx.ingest.us.sentry.io/xxxxx' | firebase functions:secrets:set SENTRY_DSN --force
firebase deploy --only functions:aiChat,functions:wompiWebhook,functions:createTransaction
```

## 🔴 VAPID Key (FCM Push)

Necesaria para `requestPermission()` en `src/services/firebase.ts`.
Se obtiene desde Firebase Console → Project Settings → Cloud Messaging → Web Push certificates.

```bash
# En .env (frontend):
VITE_FIREBASE_VAPID_KEY=BAxxxxx...
```

También está referenciada en el Service Worker (`firebase-messaging-sw.js`).

## 🔴 SMTP (Email transaccional)

Código listo en `functions/src/email/` y `functions/src/config.ts`.
La CF `onOrderConfirmed` envía emails cuando está configurado.

```bash
printf 'smtp.gmail.com' | firebase functions:secrets:set EMAIL_SMTP_HOST --force
printf '587' | firebase functions:secrets:set EMAIL_SMTP_PORT --force
printf 'user@gmail.com' | firebase functions:secrets:set EMAIL_SMTP_USER --force
printf 'app-password' | firebase functions:secrets:set EMAIL_SMTP_PASS --force
printf 'Todo <noreply@todoapp.co>' | firebase functions:secrets:set EMAIL_SMTP_FROM --force
firebase deploy --only functions:onOrderConfirmed
```

## 🔴 Migración multi-rol

La función `migrateRoles` está desplegada. Ejecutar desde Firebase Console:

1. Ir a [Firebase Console](https://console.firebase.google.com/project/todo-a44f9/functions)
2. Buscar `migrateRoles`
3. Click "Call function" (sin parámetros)
4. Verificar resultado: `{ migrated: N, skipped: M }`
