# Todo — Marketplace Colombia

**Compra productos, reserva servicios, descarga contenido digital.** Marketplace colombiano con pagos Wompi, AI Chat, planes de suscripción y analytics.

---

## 🚀 Stack

| Capa | Tecnología |
|------|-----------|
| Frontend | React 19 + TypeScript + Tailwind CSS |
| Build | Vite + PWA (Workbox) |
| Backend | Firebase (Auth, Firestore, Functions, Messaging, Storage) |
| Pagos | Wompi (widget + webhook) |
| AI | DeepSeek v4 Flash con function calling |
| Tests | Vitest (807 tests) |

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
npm run test       # 807 tests · 26 archivos
npx tsc --noEmit   # 0 errores TypeScript
npm run build      # Build producción + PWA
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
- 807 tests · 0 errores TS · Pre-commit hook

---

## 🔒 Seguridad

- Firestore rules con helpers `isAdmin()`, `isOwner()`, `isSellerOwner()`
- Pre-commit hook para detección de secrets
- CSP headers + HSTS
- .env + gitignore para secrets
- API key de Firebase limpiada del historial

---

## 📄 Licencia

© 2026 TorchKatt Group SAS — Todos los derechos reservados.
