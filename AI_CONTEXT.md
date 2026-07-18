# 🎯 Todo — Contexto de IA y Guía de Arquitectura

## ¿Qué es Todo?

**Todo** es un marketplace generalizado colombiano donde vendedores publican productos, servicios y contenido digital, y compradores los adquieren mediante pagos seguros con **Wompi**. Incluye asistente IA con function calling y panel administrativo.

---

## 🛠️ Stack

| Capa | Tecnología |
|------|-----------|
| Frontend | React 18 + TypeScript + Tailwind CSS |
| Build | Vite + PWA |
| Backend | Firebase (Auth, Firestore, Functions, Messaging, Storage) |
| Pagos | Wompi (widget checkout) |
| AI | DeepSeek v4 Flash/Pro con function calling |
| Tests | Vitest (354 tests) |

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
