# Plan Unificado: Seller Onboarding + Cross-Role Notifications

> **Objetivo:** Un cliente (CUSTOMER) decide vender → onboarding progresivo → multi-rol funcional → notificaciones cross-role para que nunca se pierda actividad en su perfil de vendedor mientras navega como comprador.
>
> **Estado actual:** 1057 tests · 0 errores TS · 56 test files · 19 Cloud Functions · react 19.2.7 · Firebase 12.16
>
> **Duración estimada:** 6-8 fases secuenciales (dependencias marcadas)

---

## Arquitectura General

```
Cliente (CUSTOMER)
  │
  ├── [Quiero vender] → /seller/onboarding → wizard 5 pasos
  │                                             │
  │                                             ▼
  │                                   roles: [CUSTOMER, SELLER]
  │                                   primaryRole: SELLER
  │                                   sellerId: {ref}
  │                                             │
  │                                             ▼
  │                                   /seller (Dashboard)
  │
  └── Sigue comprando (primaryRole: CUSTOMER)
        │
        ├── Llega pedido a su tienda
        │   → CF escribe notif con targetRole: 'SELLER'
        │
        ├── NotificationContext detecta ≠ primaryRole
        │   → crossRoleCount > 0
        │
        ├── CrossRoleBanner: "🔔 2 notifs en tu tienda [Ver]"
        │
        └── Clic → switchRole('SELLER') → /seller
```

---

## FASE 0 — Multi-Rol Foundation (desbloqueante)

> **Archivos:** `types/index.ts`, `context/AuthContext.tsx`, Firestore rules, indexes

### 0.1 User type — roles array + primaryRole

```ts
// src/types/index.ts — CAMBIAR
export interface User {
  // ... (todo lo existente se mantiene)
  // ANTES:
  // role: UserRole;
  // DESPUÉS:
  roles: UserRole[];          // ['CUSTOMER'] por defecto, luego ['CUSTOMER', 'SELLER']
  primaryRole: UserRole;      // 'CUSTOMER' — cuál está activo ahora
  // sellerId?: string — ya existe
  // ...
}
```

**Archivos a modificar:**
- `src/types/index.ts` — `User.role` → `User.roles`, add `User.primaryRole`
- `src/services/authService.ts` — en `ensureUserDoc`, cambiar creación: `role` → `roles: [UserRole.CUSTOMER]`, `primaryRole: UserRole.CUSTOMER`
- `src/context/AuthContext.tsx` — fallback user constructor igual
- `src/context/AuthContext.tsx` — exponer `switchRole(newRole: UserRole): Promise<void>`

### 0.2 Migración de usuarios existentes

Los documentos existentes en Firestore tienen `role: 'CUSTOMER'` o `role: 'SELLER'`. Migrar con script one-time:

```ts
// functions/src/migrations/addRolesField.ts
// Firestore trigger onWrite o script manual:
// Para cada user:
//   if (!user.roles) {
//     const oldRole = user.role || 'CUSTOMER';
//     await ref.update({
//       roles: [oldRole],
//       primaryRole: oldRole,
//     });
//   }
```

**Archivos a crear:**
- `functions/src/migrations/addRolesField.ts`

### 0.3 AppNotification type — targetRole

```ts
// src/types/index.ts — AÑADIR
export interface AppNotification {
  id: string;
  userId: string;
  targetRole?: UserRole;    // 'SELLER' | 'CUSTOMER' | 'COURIER'
  title: string;
  body: string;
  type: 'order_update' | 'review' | 'promo' | 'system' | 'chat_message'
      | 'seller_order' | 'seller_follower' | 'seller_message';
  read: boolean;
  link?: string;
  createdAt: any;
}
```

**Archivos a modificar:**
- `src/types/index.ts` — añadir `AppNotification`
- `src/context/NotificationContext.tsx` — reemplazar `interface Notification` local por `AppNotification`

### 0.4 Firestore rules — proteger roles

```js
// firestore.rules — AÑADIR a match /users/{userId}
allow update: if isOwner()
  // no permitir que el usuario se auto-asigne SUPER_ADMIN o ADMIN
  && (!request.resource.data.diff(resource.data).affectedKeys().hasAny(['roles'])
      || request.resource.data.roles.hasOnly(['CUSTOMER', 'SELLER', 'COURIER']));
  // primaryRole debe ser uno de los roles del usuario
  && (!request.resource.data.diff(resource.data).affectedKeys().hasAny(['primaryRole'])
      || request.resource.data.primaryRole in request.resource.data.roles);
```

### 0.5 Índices Firestore

```json
// firestore.indexes.json — AÑADIR
{
  "collectionGroup": "notifications",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "userId", "order": "ASCENDING" },
    { "fieldPath": "targetRole", "order": "ASCENDING" },
    { "fieldPath": "read", "order": "ASCENDING" },
    { "fieldPath": "createdAt", "order": "DESCENDING" }
  ]
}
```

### 0.6 Tests

- `src/tests/user-types.test.ts` — verificar que `roles` array funciona, que `primaryRole` está en `roles`
- `src/tests/auth-service.test.ts` — mock de `ensureUserDoc` devuelve `roles: ['CUSTOMER']`

---

## FASE 1 — Switch de Rol en AuthContext

> **Archivos:** `context/AuthContext.tsx`, `components/ui/RoleBadge.tsx`, i18n keys

### 1.1 AuthContext — switchRole()

```ts
// src/context/AuthContext.tsx — AÑADIR
interface AuthContextType {
  // ... existente +
  switchRole: (newRole: UserRole) => Promise<void>;
}

// Implementación:
const switchRole = useCallback(async (newRole: UserRole) => {
  if (!user?.id) return;
  if (!user.roles.includes(newRole)) return; // no tiene ese rol
  await authService.updateProfile(user.id, { primaryRole: newRole });
  setUser(prev => prev ? { ...prev, primaryRole: newRole } : null);
}, [user?.id, user?.roles]);
```

### 1.2 useAuth hook — getter de rol activo

```ts
// Conveniencia:
const isSellerMode = user?.primaryRole === UserRole.SELLER;
const isCustomerMode = user?.primaryRole === UserRole.CUSTOMER;
```

### 1.3 RoleBadge component

```tsx
// src/components/ui/RoleBadge.tsx — CREAR
interface RoleBadgeProps {
  role: UserRole;
  onSwitch?: () => void;
  className?: string;
}
// Muestra: "👤 Cliente" o "🏪 Vendedor" con colores distintos
// Si onSwitch existe, es clickeable
```

### 1.4 i18n keys

```json
// es.json
"role.customer": "Cliente",
"role.seller": "Vendedor",
"role.courier": "Domiciliario",
"role.switchTo": "Ver como {role}",
"role.current": "Modo {role}",

// en.json (paralelo)
```

---

## FASE 2 — Seller Onboarding Wizard (5 pasos)

> **Archivos:** `pages/SellerOnboarding.tsx`, `services/sellerService.ts`, `components/onboarding/`, `App.tsx`, i18n

### 2.1 Servicio de seller con onboarding state

```ts
// src/services/sellerService.ts — CREAR

export interface SellerOnboardingData {
  // Onboarding progress
  onboardingStatus: 'not_started' | 'in_progress' | 'completed';
  onboardingStep: number;      // 1-5, permite reanudar
  completedSteps: number[];    // [1, 3] = pasos 1 y 3 completados

  // Step 1: Type & Categories
  type?: SellerType;
  categoryIds?: string[];

  // Step 2: Store info
  name?: string;
  description?: string;
  logo?: string;

  // Step 3: Location & Contact
  city?: string;
  address?: string;
  neighborhood?: string;
  phone?: string;
  whatsapp?: string;
  website?: string;

  // Step 4: Delivery
  deliveryEnabled?: boolean;
  baseFee?: number;
  pricePerKm?: number;
  maxDistanceKm?: number;
  freeThreshold?: number;
  estimatedTime?: string;
  pickupEnabled?: boolean;

  // Step 5: TOS
  tosAccepted?: boolean;
}

// Métodos:
export const sellerService = {
  // Crear o continuar onboarding
  async getOrCreateOnboarding(userId: string): Promise<OnboardingSession>,

  // Guardar progreso de un paso (no bloquea, guarda incremental)
  async saveStep(userId: string, step: number, data: Partial<OnboardingData>): Promise<void>,

  // Finalizar onboarding → crear seller doc + actualizar user
  async completeOnboarding(userId: string, data: OnboardingData): Promise<Seller>,

  // Obtener estado del onboarding
  async getOnboardingStatus(userId: string): Promise<OnboardingStatus>,
};
```

**Colección Firestore:** `seller_onboarding/{userId}` — documento temporal que se borra al completar.

### 2.2 Wizard — 5 pasos

```tsx
// src/pages/SellerOnboarding.tsx — CREAR (~400-500 líneas)

const STEPS = [
  { id: 1, title: '¿Qué vas a vender?', icon: ShoppingBag },
  { id: 2, title: 'Tu tienda', icon: Store },
  { id: 3, title: 'Ubicación y contacto', icon: MapPin },
  { id: 4, title: 'Entrega', icon: Truck },
  { id: 5, title: '¡Listo!', icon: Sparkles },
];
```

#### Paso 1 — Tipo y Categorías

```tsx
// Componente: StepTypeCategories
// UI:
//   Grid de 4 cards seleccionables: Producto · Servicio · Digital · Individual
//   Cada card con icon + descripción corta
//   Al seleccionar tipo, mostrar categorías disponibles para ese tipo
//   Checkboxes de categorías (desde categoryService.getAll())
// Botón: "Siguiente" (guarda en seller_onboarding/{userId})
// Previene: no deja avanzar sin seleccionar tipo
```

**i18n keys:**
```
"sellerOnboarding.step1.title": "¿Qué vas a vender?",
"sellerOnboarding.step1.product": "Producto físico",
"sellerOnboarding.step1.productDesc": "Electrónica, ropa, hogar, alimentos...",
"sellerOnboarding.step1.service": "Servicio profesional",
"sellerOnboarding.step1.serviceDesc": "Clases, reparaciones, consultoría...",
"sellerOnboarding.step1.digital": "Contenido digital",
"sellerOnboarding.step1.digitalDesc": "E-books, plantillas, software...",
"sellerOnboarding.step1.individual": "Segunda mano / Individual",
"sellerOnboarding.step1.individualDesc": "Ventas entre personas, artículos usados...",
"sellerOnboarding.step1.categories": "¿En qué categorías vendes?",
```

#### Paso 2 — Información de la tienda

```tsx
// Componente: StepStoreInfo
// UI:
//   Input: Nombre de tienda (placeholder: "Tienda de {user.fullName}")
//   Textarea: Descripción (max 500 chars)
//   Emoji picker simple para logo (o upload)
// Botón: "Siguiente"
```

#### Paso 3 — Ubicación y contacto

```tsx
// Componente: StepLocation
// UI:
//   Dropdown: Ciudad (desde CIUDADES_COLOMBIA)
//   Input: Dirección / barrio
//   Input: Teléfono (pre-llenado desde user.phone)
//   Input: WhatsApp (opcional)
//   Input: Sitio web (opcional)
```

#### Paso 4 — Configuración de entrega

```tsx
// Componente: StepDelivery
// UI:
//   Toggle: "Ofrezco envío a domicilio"
//     Si activo: inputs de tarifa base, precio por km, distancia máxima, tiempo estimado
//   Toggle: "Ofrezco recogida en tienda"
//   Toggle: "Ofrezco entrega digital" (solo si type === DIGITAL)
//   Preview de costos: "Envío local desde $X"
```

#### Paso 5 — Resumen y publicación

```tsx
// Componente: StepReview
// UI:
//   Card de resumen con todo lo configurado (pasos 1-4)
//   Checkbox: "Acepto los Términos y Condiciones para vendedores"
//   Botón: "Publicar mi tienda"
//   Al hacer clic:
//     1. Crea sellers/{id} en Firestore con todos los datos
//     2. Actualiza user.roles → ['CUSTOMER', 'SELLER']
//     3. Actualiza user.primaryRole → 'SELLER'
//     4. Actualiza user.sellerId → id del seller
//     5. Elimina seller_onboarding/{userId} (limpieza)
//     6. Redirige a /seller con query ?first=true
```

### 2.3 Post-onboarding — Dashboard con first listing CTA

```tsx
// src/pages/SellerDashboard.tsx — MODIFICAR
// Si ?first=true en URL, mostrar hero banner:
// ┌──────────────────────────────────────┐
// │ 🎉 ¡Tu tienda {name} está publicada! │
// │                                      │
// │ Ahora publica tu primer listado para │
// │ que los compradores te encuentren.   │
// │                                      │
// │ [➕ Publicar primer producto]        │
// │     [⏳ Más tarde]                    │
// └──────────────────────────────────────┘
```

### 2.4 App.tsx — rutas

```tsx
// src/App.tsx — AÑADIR
const SellerOnboarding = lazy(() => import('./pages/SellerOnboarding'));

// Ruta nueva:
<Route path="/seller/onboarding" element={<SellerOnboarding />} />
<Route path="/seller" element={<SellerDashboard />} />
```

### 2.5 Firestore rules — seller_onboarding

```js
// firestore.rules — AÑADIR
match /seller_onboarding/{userId} {
  allow read,write: if isOwner(userId);
  allow delete: if isOwner(userId);  // se borra al completar
}
```

### 2.6 Tests

- `src/tests/seller-service.test.ts` — crear seller, guardar paso, completar onboarding
- `src/tests/seller-onboarding.test.tsx` — renderizar cada paso, validar formularios, navegación entre pasos
- Mínimo: 15 tests (3 por paso)

---

## FASE 3 — Cloud Functions: targetRole en Notificaciones

> **Archivos:** 7 Cloud Functions en `functions/src/`

### 3.1 onTransactionCreate — notificación al vendedor

```ts
// functions/src/notifications/onTransactionCreate.ts — MODIFICAR
await db.collection('notifications').add({
  userId: seller.ownerId,       // el dueño de la tienda
  targetRole: 'SELLER',         // ← NUEVO
  title: '📦 Nuevo pedido',
  body: `#${txId.slice(-8)} — ${formatCOP(tx.totalAmount)}`,
  type: 'seller_order',
  read: false,
  link: `/seller/orders/${txId}`,
  createdAt: serverTimestamp(),
});

// También notificar al comprador:
await db.collection('notifications').add({
  userId: tx.buyerId,
  targetRole: 'CUSTOMER',       // ← NUEVO
  title: '✅ Pedido confirmado',
  body: `Tu pedido #${txId.slice(-8)} está en proceso`,
  type: 'order_update',
  read: false,
  link: `/orders/${txId}`,
  createdAt: serverTimestamp(),
});
```

### 3.2 onNewFollower — notificación al vendedor

```ts
// functions/src/notifications/onNewEvent.ts — MODIFICAR
await db.collection('notifications').add({
  userId: sellerOwnerId,
  targetRole: 'SELLER',         // ← NUEVO
  title: '👤 Nuevo seguidor',
  body: `${followerName} empezó a seguir tu tienda`,
  type: 'seller_follower',
  read: false,
  link: `/seller`,
  createdAt: serverTimestamp(),
});
```

### 3.3 onNewMessage — notificación según destinatario

```ts
// functions/src/notifications/onNewEvent.ts — MODIFICAR
// Si el mensaje es para un chat de tienda, targetRole: 'SELLER'
// Si es chat entre compradores, targetRole: 'CUSTOMER'
const targetRole = chatDoc.sellerId ? 'SELLER' : 'CUSTOMER';
await db.collection('notifications').add({
  userId: recipientId,
  targetRole,                   // ← NUEVO: dinámico
  title: '💬 Nuevo mensaje',
  body: `${senderName}: ${msgPreview}`,
  type: 'chat_message',
  read: false,
  link: `/chat/${chatId}`,
  createdAt: serverTimestamp(),
});
```

### 3.4 onOrderConfirmed — notificación al comprador

```ts
// functions/src/email/onOrderConfirmed.ts — MODIFICAR (o su notificación)
await db.collection('notifications').add({
  userId: tx.buyerId,
  targetRole: 'CUSTOMER',       // ← NUEVO
  title: '✅ Pedido confirmado',
  body: `Tu pedido #${txId.slice(-8)} — ${formatCOP(tx.totalAmount)}`,
  type: 'order_update',
  read: false,
  link: `/orders/${txId}`,
  createdAt: serverTimestamp(),
});
```

### 3.5 Functions deploy checklist

```
firebase deploy --only functions:onTransactionCreate
firebase deploy --only functions:onNewFollower,functions:onNewMessage
firebase deploy --only functions:onOrderConfirmed
```

---

## FASE 4 — Cross-Role Banner y NotificationContext

> **Archivos:** `context/NotificationContext.tsx`, `components/ui/CrossRoleBanner.tsx`, `components/ui/RoleSwitcher.tsx`, i18n

### 4.1 NotificationContext — cross-role query

```ts
// src/context/NotificationContext.tsx — MODIFICAR

// AÑADIR al interface:
interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  crossRoleNotifications: AppNotification[];  // ← NUEVO
  crossRoleCount: number;                     // ← NUEVO
  showBanner: boolean;
  dismissBanner: () => void;
  requestPushPermission: () => Promise<void>;
}

// AÑADIR query paralela:
useEffect(() => {
  if (!user?.id || !user.roles || user.roles.length < 2) {
    setCrossRoleNotifications([]);
    return;
  }
  const q = query(
    collection(db, 'notifications'),
    where('userId', '==', user.id),
    where('targetRole', '!=', user.primaryRole),
    where('read', '==', false),
    orderBy('targetRole', 'ASC'),
    orderBy('read', 'ASC'),
    orderBy('createdAt', 'desc'),
    limit(5)
  );
  const unsub = onSnapshot(q, snap => {
    setCrossRoleNotifications(snap.docs.map(d => ({ id: d.id, ...d.data() } as AppNotification)));
  });
  return unsub;
}, [user?.id, user?.primaryRole, user?.roles?.length]);
```

### 4.2 CrossRoleBanner component

```tsx
// src/components/ui/CrossRoleBanner.tsx — CREAR

interface CrossRoleBannerProps {
  notifications: AppNotification[];
  currentRole: UserRole;
  onSwitch: () => void;
}

// Render:
// Si no hay notifs → null
// Si currentRole === CUSTOMER:
//   "🔔 Tienes {count} notificaciones en tu tienda  [Ver como vendedor →]"
// Si currentRole === SELLER:
//   "🔔 Tienes {count} notificaciones como comprador  [Ver como cliente →]"

// Estilo: bg-amber-50 border-b border-amber-200, animación slide-down
```

### 4.3 App.tsx — integrar CrossRoleBanner

```tsx
// src/App.tsx — MODIFICAR, dentro del provider tree
<OfflineBanner />
<CrossRoleBanner
  notifications={crossRoleNotifications}
  currentRole={user?.primaryRole}
  onSwitch={() => switchRole()}
/>
```

### 4.4 RoleSwitcher widget

```tsx
// src/components/ui/RoleSwitcher.tsx — CREAR

// Pequeño botón/pill flotante que muestra el rol actual
// y permite cambiar rápido:
// ┌──────────────────┐
// │ 🏪 Vendedor  ⇅  │  ← clickeable
// └──────────────────┘
// Al hacer clic, cambia primaryRole y navega al home de ese rol

// Posición: fixed top-4 right-4, z-50
// Solo visible cuando user.roles.length > 1
```

### 4.5 i18n keys

```json
"crossRole.seller.title": "Tienes {count} notificaciones en tu tienda",
"crossRole.customer.title": "Tienes {count} notificaciones como comprador",
"crossRole.seller.empty": "No hay actividad pendiente en tu tienda",
"crossRole.customer.empty": "No hay actividad pendiente como comprador",
"crossRole.cta": "Ver como {role}",
```

---

## FASE 5 — Role-Aware UI

> **Archivos:** `components/layout/BottomTabs.tsx`, `components/chat/AIChat.tsx`, `App.tsx`

### 5.1 BottomTabs — indicador de rol

```tsx
// src/components/layout/BottomTabs.tsx — MODIFICAR
// AÑADIR antes del map de tabs:
{user?.roles && user.roles.length > 1 && (
  <button onClick={() => switchRole(...)} className="...">
    {user.primaryRole === SELLER ? '👤' : '🏪'}
    <span className="text-[10px]">{primaryRole === SELLER ? 'Cliente' : 'Vendedor'}</span>
  </button>
)}
```

### 5.2 AIChat — scope de tools según primaryRole

En `aiChatService.ts`, pasar `userRole = user.primaryRole` al llamar al proxy de IA.
Ya está implementado, solo asegurar que use `primaryRole`.

---

## FASE 6 — Tests y Verificación

### 6.1 Nuevos archivos de test

| Archivo | Tests mínimos |
|---------|--------------|
| `src/tests/user-types.test.ts` | 8 |
| `src/tests/auth-service.test.ts` (ampliar) | 5 |
| `src/tests/seller-service.test.ts` | 12 |
| `src/tests/seller-onboarding.test.tsx` | 15 |
| `src/tests/cross-role-banner.test.tsx` | 6 |
| `src/tests/role-switcher.test.tsx` | 4 |
| `src/tests/role-badge.test.tsx` | 3 |
| `functions/src/tests/notifications.test.ts` | 8 |

**Total nuevos tests:** ~61

### 6.2 Tests existentes que pueden romperse

| Test | Riesgo | Acción |
|------|--------|--------|
| `routing.test.tsx` | Provider hierarchy | Verificar que `switchRole` esté en mock |
| `ai-chat.test.ts` | `user.role` → `user.roles` | Actualizar mock |
| `expanded-services.test.ts` | `user.role` en usage | Actualizar mock |
| `auth.test.ts` | `role` field | Actualizar mock |
| `landing.test.tsx` | N/A | Sin cambios |
| `admin.test.ts` | `user.role === SUPER_ADMIN` | Usar `roles.includes` |

### 6.3 Comandos de verificación (obligatorios antes de cada commit)

```bash
# Fase 0
npx tsc --noEmit
npx vitest run src/tests/user-types.test.ts

# Fase 2-6 (completo)
npx tsc --noEmit
npx vitest run --reporter=verbose
npm run build

# Functions
cd functions && npx tsc --noEmit
npm test
cd ..

# Rules (si hay cambios)
npm run test:rules
```

---

## Resumen de Archivos

### Crear (10 archivos)

| Archivo | Propósito |
|---------|-----------|
| `src/pages/SellerOnboarding.tsx` | Wizard 5 pasos |
| `src/services/sellerService.ts` | CRUD seller + onboarding |
| `src/components/ui/CrossRoleBanner.tsx` | Banner de notificaciones cross-role |
| `src/components/ui/RoleSwitcher.tsx` | Widget flotante de cambio de rol |
| `src/components/ui/RoleBadge.tsx` | Badge de rol actual |
| `src/components/onboarding/StepTypeCategories.tsx` | Paso 1 del wizard |
| `src/components/onboarding/StepStoreInfo.tsx` | Paso 2 del wizard |
| `src/components/onboarding/StepLocation.tsx` | Paso 3 del wizard |
| `src/components/onboarding/StepDelivery.tsx` | Paso 4 del wizard |
| `src/components/onboarding/StepReview.tsx` | Paso 5 del wizard |
| `functions/src/migrations/addRolesField.ts` | Migración one-time |

### Modificar (12 archivos)

| Archivo | Cambio |
|---------|--------|
| `src/types/index.ts` | `User.role` → `User.roles[]`, `User.primaryRole`, `AppNotification` |
| `src/context/AuthContext.tsx` | `switchRole()`, `roles` array en fallback |
| `src/context/NotificationContext.tsx` | `crossRoleNotifications`, `crossRoleCount` |
| `src/services/authService.ts` | `role` → `roles` + `primaryRole` |
| `src/App.tsx` | Ruta `/seller/onboarding`, CrossRoleBanner |
| `src/components/layout/BottomTabs.tsx` | Indicador de rol activo |
| `src/components/chat/AIChat.tsx` | Usar `primaryRole` |
| `src/pages/SellerDashboard.tsx` | Banner post-onboarding |
| `firestore.rules` | Proteger `roles`/`primaryRole`, colección `seller_onboarding` |
| `firestore.indexes.json` | Índice compuesto `notifications` |
| `src/locales/es.json` | ~40 keys nuevas |
| `src/locales/en.json` | ~40 keys paralelas |

### Cloud Functions (4 archivos)

| Archivo | Cambio |
|---------|--------|
| `functions/src/notifications/onTransactionCreate.ts` | +`targetRole` |
| `functions/src/notifications/onNewEvent.ts` | +`targetRole` en onNewFollower y onNewMessage |
| `functions/src/email/onOrderConfirmed.ts` | +`targetRole` |
| `(nuevo)` `functions/src/migrations/addRolesField.ts` | Script one-time |

---

## Orden de Ejecución

```
Fase 0: Multi-rol foundation
  ├── 0.1 types (User.roles, AppNotification)
  ├── 0.2 authService + AuthContext
  ├── 0.3 Firestore rules
  ├── 0.4 Firestore indexes
  └── 0.5 Tests + tsc

Fase 1: Switch de rol
  ├── 1.1 switchRole() en AuthContext
  ├── 1.2 RoleBadge component
  └── 1.3 i18n keys

Fase 2: Seller onboarding wizard
  ├── 2.1 sellerService.ts
  ├── 2.2 Step components (5)
  ├── 2.3 SellerOnboarding page
  ├── 2.4 App.tsx route
  ├── 2.5 SellerDashboard post-onboarding
  ├── 2.6 Firestore rules
  └── 2.7 Tests

Fase 3: Cloud Functions — targetRole
  ├── 3.1 onTransactionCreate
  ├── 3.2 onNewFollower / onNewMessage
  ├── 3.3 onOrderConfirmed
  └── 3.4 Deploy

Fase 4: Cross-role banner
  ├── 4.1 NotificationContext
  ├── 4.2 CrossRoleBanner
  ├── 4.3 App.tsx integration
  ├── 4.4 RoleSwitcher widget
  └── 4.5 i18n + tests

Fase 5: Role-aware UI
  ├── 5.1 BottomTabs indicator
  └── 5.2 AIChat scope

Fase 6: Tests + deploy final
  ├── 6.1 Correr suite completa
  ├── 6.2 Push a GitHub
  ├── 6.3 Deploy hosting + functions + rules
  └── 6.4 Verificar en vivo
```

---

## Definition of Done (global)

- [ ] `npx tsc --noEmit` → 0 errores
- [ ] `npx vitest run` → todos verdes (∼1118 tests)
- [ ] `npm run build` → PWA 107+ entries
- [ ] `cd functions && npx tsc --noEmit` → 0 errores
- [ ] `npm --prefix functions test` → todos verdes
- [ ] `firebase deploy --only hosting,firestore:rules,firestore:indexes` → exitoso
- [ ] Funciones targetRole desplegadas y operativas
- [ ] Usuario CUSTOMER puede iniciar onboarding desde /seller
- [ ] Onboarding 5 pasos guarda progreso incremental
- [ ] Al completar: user.roles = ['CUSTOMER', 'SELLER'], redirige a /seller
- [ ] Notificaciones de tienda (pedido, seguidor, mensaje) tienen targetRole='SELLER'
- [ ] CrossRoleBanner se muestra cuando hay actividad en el otro rol
- [ ] RoleSwitcher permite cambiar de rol en 1 clic
- [ ] Al cambiar primaryRole, BottomTabs refleja el contexto
- [ ] Chat IA usa primaryRole para scoping de tools
