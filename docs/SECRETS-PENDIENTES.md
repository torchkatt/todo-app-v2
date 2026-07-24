# Secretos — Estado de configuración

> Actualizado: 23 Jul 2026

## ✅ Configurados (con placeholders)

| Secret | Estado | Próximo paso |
|--------|--------|-------------|
| `SENTRY_DSN` | ✅ Placeholder `PENDIENTE-reemplazar-con-DSN-real` | Reemplazar con DSN real de Sentry |
| `EMAIL_SMTP_HOST` | ✅ Placeholder `PENDIENTE` | Reemplazar con SMTP host |
| `EMAIL_SMTP_PORT` | ✅ `587` | Listo |
| `EMAIL_SMTP_USER` | ✅ Placeholder `PENDIENTE` | Reemplazar con usuario SMTP |
| `EMAIL_SMTP_PASS` | ✅ Placeholder `PENDIENTE` | Reemplazar con contraseña SMTP |
| `EMAIL_SMTP_FROM` | ✅ `Todo <noreply@todoapp.co>` | Listo |

## 🔴 Pendientes (tuyos)

| Acción | Comando |
|--------|---------|
| **Sentry DSN** | `printf 'https://xxx@xxx.ingest.us.sentry.io/xxxxx' \| firebase functions:secrets:set SENTRY_DSN --force && firebase deploy --only functions:aiChat,functions:wompiWebhook,functions:createTransaction` |
| **SMTP real** | `printf 'smtp.gmail.com' \| firebase functions:secrets:set EMAIL_SMTP_HOST --force && printf 'tu-email' \| firebase functions:secrets:set EMAIL_SMTP_USER --force && printf 'tu-app-password' \| firebase functions:secrets:set EMAIL_SMTP_PASS --force && firebase deploy --only functions:onOrderConfirmed` |

## ✅ VAPID Key

La key `VITE_FIREBASE_VAPID_KEY` ya está en `.env` y referenciada en:
- `src/services/firebase.ts` → `getToken(messaging, { vapidKey: ... })`
- `public/firebase-messaging-sw.js`

No requiere acción a menos que quieras regenerarla desde Firebase Console.

## ✅ Migración multi-rol

Ejecutada exitosamente (vía Admin SDK). Todos los usuarios existentes tienen `roles[]` y `primaryRole`.

## Functions desplegadas con secrets

| Function | Secrets |
|----------|---------|
| `aiChat` | `DEEPSEEK_API_KEY`, `SENTRY_DSN` |
| `wompiWebhook` | `WOMPI_*`, `SENTRY_DSN` |
| `createTransaction` | `WOMPI_*`, `SENTRY_DSN` |
| `onOrderConfirmed` | `EMAIL_SMTP_*` |
