# 🎯 Todo — Contexto de IA y Guía de Arquitectura

## ¿Qué es Todo?

**Todo** es un marketplace generalizado colombiano donde vendedores publican productos, servicios y contenido digital, y compradores los adquieren mediante pagos seguros con **Wompi**. Incluye asistente IA con function calling y panel administrativo.

---

## 🛠️ Stack

| Capa | Tecnología |
|------|-----------|
| Frontend | React 18 + TypeScript + Tailwind CSS |
| Build | Vite + PWA |
| Backend | Firebase (Auth, Firestore, Functions v2, Messaging, Storage) |
| Pagos | Wompi (widget checkout, montos y firma calculados server-side) |
| AI | DeepSeek v4 Flash/Pro con function calling, proxy server-side (`aiProxy`) |
| Tests | Vitest — 808 tests frontend, 17 functions, 24/25 reglas contra emulador (807 previos ya venían de antes; ver §Tests) |
| Observabilidad | Sentry (frontend, con scrubbing de PII) |
| CI | GitHub Actions — secret-scan, tsc, lint, tests, build de functions, reglas |

---

## 💳 Pagos Wompi — arquitectura server-authoritative

`functions/src/` está organizado por dominio (ver `docs/PLAN-PRODUCCION.md` para el detalle
fase por fase):

```
functions/src/
├── config.ts                    # secretos (defineSecret) + wompiConfigured()/wompiUrls()
├── domain/{types,orderState}.ts # máquina de estados única (canTransition)
├── payments/
│   ├── createTransaction.ts     # callable — monto/IVA/comisión calculados en backend
│   ├── wompiWebhook.ts          # onRequest — checksum obligatorio + idempotente + atómico
│   ├── wompiSignature.ts        # integritySignature() / verifyEventChecksum()
│   ├── applyWompiTransaction.ts # transición de estado + stock + audit (usado por webhook y verify)
│   ├── verifyTransaction.ts     # callable — reconciliación server-to-server
│   └── wompiClient.ts           # llamadas a la API de Wompi (respeta WOMPI_ENV)
├── ai/{aiProxy,security,tools,usage}.ts  # proxy DeepSeek, sin key en el cliente
├── notifications/onTransactionCreate.ts
└── lib/{audit,rateLimit}.ts
```

**Principios (no negociables):** el frontend nunca calcula `totalAmount`; el webhook exige
checksum válido y es idempotente por `wompiTransactionId` (`processed_events`); con los
secretos de Wompi en `PENDIENTE`, `createTransaction` devuelve `paymentReady:false` y el
webhook responde `503` — nunca se aprueba un pago en falso.

---

## 📊 Firestore Collections

### `users` — Usuarios
| Campo | Tipo |
|-------|------|
| `email`, `fullName` | string |
| `role` | `CUSTOMER` \| `SELLER` \| `ADMIN` \| `SUPER_ADMIN` |

### `sellers` — Vendedores
| Campo | Tipo |
|-------|------|
| `name`, `type` | string |
| `ownerId` | string (UID) |
| `description`, `logo` | string |

### `listings` — Listados
| Campo | Tipo |
|-------|------|
| `sellerId`, `categoryId` | string |
| `title`, `description` | string |
| `price`, `quantity` | number |
| `type` | `product` \| `service` \| `digital` |

### `transactions` — Transacciones
| Campo | Tipo |
|-------|------|
| `buyerId`, `sellerId` | string |
| `status` | `PENDING` → `CONFIRMED` → `COMPLETED` \| `CANCELLED` |
| `totalAmount`, `commission` | number |

### `categories` — Categorías
- Árbol jerárquico con `parentId`

---

## 🔒 Reglas Firestore

- helpers: `isAuthenticated()`, `isAdmin()`, `isOwner()`, `isSellerOwner()`
- `users`: solo owner o admin
- `sellers`: lectura pública, escritura owner/admin
- `listings`: lectura pública, escritura owner del seller
- `transactions`: solo lectura owner/admin, creación solo via CF
- `categories`: solo admin escribe

---

## 🧪 Tests

```bash
npm run test       # 354 tests · 13 archivos
npx tsc --noEmit   # 0 errores TS
npm run build      # Build producción
```

---

## 🔍 SEO

- `public/sitemap.xml` ✅
- `public/robots.txt` ✅
- `index.html` con OG + Twitter + JSON-LD ✅

---

## 📦 Despliegue

```bash
firebase deploy --only hosting    # Frontend
firebase deploy --only firestore:rules  # Reglas
```
