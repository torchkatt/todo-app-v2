# Todo — Marketplace Colombia

**Compra productos, reserva servicios, descarga contenido digital.** Marketplace colombiano con pagos Wompi, AI Chat, planes de suscripción y analytics.

---

## 🚀 Stack

| Capa | Tecnología |
|------|-----------|
| Frontend | React 19 + TypeScript + Tailwind CSS |
| Build | Vite + PWA (Workbox) |
| Backend | Firebase (Auth, Firestore, Functions v2, Messaging, Storage) |
| Pagos | Wompi (widget + webhook seguro: checksum + idempotencia + monto server-side) |
| AI | DeepSeek v4 Flash con function calling, proxy server-side |
| Tests | Vitest (808 tests) + 24/25 reglas de Firestore/Storage contra emulador |

---

## 📦 Instalación

```bash
git clone https://github.com/torchkatt/todo-app-v2.git
cd todo-app-v2
cp .env.example .env   # Completar con tus claves
npm install
npm run dev            # Servidor local → http://localhost:4000
```

## 🧪 Tests

```bash
npm run test        # 808 tests · 26 archivos (frontend)
npm --prefix functions test   # 17 tests (Cloud Functions)
npm run test:rules  # reglas de Firestore/Storage contra el emulador
npx tsc -b           # 0 errores TypeScript (frontend + functions)
npm run build        # Build producción + PWA
```

---

## 🌐 Producción

| URL | Propósito |
|-----|-----------|
| https://todo-a44f9.web.app | Frontend (Firebase Hosting) |

---

## 📋 Features

- Marketplace general (productos, servicios, digital)
- AI Chat con function calling y 5 capas de seguridad
- Pagos Wompi (tarjeta, PSE, Nequi)
- Planes de suscripción dinámicos desde Firestore
- Landing page profesional con precios dinámicos
- Help center + FAQ (16 preguntas)
- PWA offline + notificaciones push
- Revenue dashboard con filtros por fecha
- i18n español/inglés
- SEO (sitemap, robots, Open Graph, JSON-LD)
- 808 tests frontend + 17 functions + reglas contra emulador · 0 errores TS · Pre-commit hook

---

## 🔒 Seguridad

- Montos financieros calculados solo en backend (nunca en el cliente)
- Webhook de Wompi: checksum HMAC obligatorio + idempotencia + validación de monto + audit trail
- Firestore/Storage rules con helpers `isAdmin()`, `isOwner()`, `isSellerOwner()` y `hasOnly()`
  para bloquear escritura de campos financieros/de moderación desde el cliente
- Proxy de IA server-side (sin API key de DeepSeek en el bundle)
- Sentry (frontend) con scrubbing de PII
- CI: bloqueo de secretos versionados + verificación de que `dist/` no contiene claves
- Pre-commit hook para detección de secrets
- CSP headers + HSTS
- .env + gitignore para secrets

---

## 📄 Licencia

© 2026 TorchKatt Group SAS — Todos los derechos reservados.
