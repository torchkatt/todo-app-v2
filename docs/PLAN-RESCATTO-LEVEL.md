# Plan: Llevar Todo al nivel Rescatto — Plan Unificado

> **Objetivo:** Cerrar TODAS las brechas entre Todo y el estándar de calidad de Rescatto.
> Un solo plan con tareas atómicas, verificables y ejecutables secuencialmente.
>
> **Estado actual:** 808 tests ✅ · tsc -b 0 errores ✅ · Build PWA ✅ · CI/CD ✅ · 492 líneas de Landing ✅
>
> **Stack:** React 19 + TypeScript + Tailwind CSS v4 + Firebase + Wompi + DeepSeek + Vitest
>
> **Nota:** Este plan unifica dos ejes de análisis — (1) costo Firestore/caché (el corazón del "arduo trabajo" de Rescatto, verificado contra código real) y (2) frontend/marketing + deuda técnica. Priorizado por impacto real.

---

## Resumen de Brechas — Priorizado

| # | Área | Brecha | Prioridad | Verificado |
|---|------|--------|-----------|------------|
| 1 | **Firestore — Caché** | `getFirestore(app)` sin `persistentLocalCache` — cada recarga relee todo del servidor | 🔴 **P1** | `firebase.ts:20` |
| 2 | **Firestore — Caché** | React Query instalado pero 0% usado. Todos los hooks usan `useEffect+getDocs` sin caché. No existe `cacheService` TTL. Todo tiene **menos caché que Rescatto** (que al menos cacheaba venues) | 🔴 **P1** | `package.json` vs `useFirestore.ts` |
| 3 | **Firestore — N+1** | `useSellersByIds` hace un `getDocs` por cada id en loop, usando `where('__name__','==',id)` en vez de `getDoc` directo o `in/documentId()` batcheado | 🟠 **P1** | `useFirestore.ts:53-63` |
| 4 | **Firestore — Race** | `incrementViews` es read-then-write: `getDoc + updateDoc(views+1)` en vez de `increment()` atómico. Cuesta 1 lectura extra por vista y pierde escrituras concurrentes | 🟠 **P1** | `listingService.ts:159-165` |
| 5 | **Observabilidad** | Sentry ausente en Cloud Functions — webhook Wompi y proxy IA sin captura de errores | 🔴 **P2** | grep en `functions/src` = 0 matches |
| 6 | **Landing — Pricing** | Precios hardcodeados en i18n vs. dinámicos desde Firestore (inconsistencia garantizada si cambian los planes) | 🔴 **P2** | `Landing.tsx:239-284` |
| 7 | **Landing — Analytics** | Cero eventos en CTAs — sin datos de conversión marketing | 🟡 **P3** | `Landing.tsx` |
| 8 | **Landing — AI Chat** | Asistente IA ausente en la landing (solo en app) | 🟡 **P3** | `Landing.tsx` |
| 9 | **Landing — Social Proof** | Sin contadores ni estadísticas en vivo | 🟡 **P3** | `Landing.tsx` |
| 10 | **Landing — Animaciones** | Todo estático, sin scroll reveal ni micro-interacciones | 🟢 **P4** | `Landing.tsx` |
| 11 | **Landing — Imágenes** | Solo iconos, sin screenshots ni mockups reales | 🟢 **P4** | `Landing.tsx` |
| 12 | **Oxlint warnings** | ~116 warnings (unused imports, código muerto) | 🟡 **P3** | `npx oxlint` |
| 13 | **Admin dead links** | Botones `/admin/users` y `/admin/sellers` sin rutas | 🟡 **P3** | `AdminPanel.tsx:162-163` |
| 14 | **Log-based alerts GCP** | Fraude potencial sin notificación automática | 🟢 **P4** | `PLAN-PRODUCCION.md` |
| 15 | **Landing — Footer** | Sin redes sociales (Instagram, Twitter, WhatsApp) | 🟢 **P5** | `Landing.tsx:478-484` |
| 16 | **Higiene** | Rotar `todo-sa-key.json` + DeepSeek key (opcional — NO es fuga activa, está en `.gitignore`) | 🟢 **P5** | `git ls-files` ok |
| 17 | **Infra** | Registrar Todo en `REGISTRY.md` de ai_core + actualizar graphify | 🟢 **P5** | — |

---

## File Structure

| Archivo | Responsabilidad | Acción |
|---------|----------------|--------|
| `src/services/firebase.ts` | Inicialización Firebase — caché Firestore | Modificar (Task 1) |
| `src/hooks/useFirestore.ts` | Hooks de datos con `useEffect+getDocs` | Reescribir (Tasks 2, 3) |
| `src/services/listingService.ts` | CRUD de listings — `incrementViews` | Modificar (Task 4) |
| `src/services/cacheService.ts` | Nueva: caché TLRU para datos semi-estáticos | Crear (Task 2) |
| `src/pages/Explore.tsx` | Página de exploración — `useEffect+getDocs` | Modificar (Task 2) |
| `src/App.tsx` | Providers — añadir QueryClientProvider | Modificar (Task 2) |
| `src/main.tsx` | Entry point — envolver con QueryClientProvider | Modificar (Task 2) |
| `functions/src/lib/sentry.ts` | Inicialización Sentry en backend | Crear (Task 5) |
| `functions/package.json` | Dependencias — añadir `@sentry/node` | Modificar (Task 5) |
| `functions/src/index.ts` | Entry point Cloud Functions | Modificar (Task 5) |
| `functions/src/payments/wompiWebhook.ts` | Webhook Wompi | Modificar (Task 5) |
| `functions/src/ai/aiProxy.ts` | Proxy DeepSeek | Modificar (Task 5) |
| `functions/src/payments/createTransaction.ts` | Crear transacción | Modificar (Task 5) |
| `src/pages/Landing.tsx` | Página principal de marketing | Modificar (Tasks 6-11, 15) |
| `src/services/analyticsService.ts` | Analytics events | Modificar (Task 7) |
| `src/components/chat/AIChat.tsx` | Componente de chat IA | Modificar (Task 8) |
| `src/components/landing/SocialProof.tsx` | Contadores de prueba social | Crear (Task 9) |
| `src/components/landing/ScrollReveal.tsx` | Wrapper de animación scroll | Crear (Task 10) |
| `public/screenshots/` | Imágenes de la app | Crear directorio (Task 11) |
| `src/pages/AdminPanel.tsx` | Panel de administración | Modificar (Task 13) |
| `src/pages/AdminUsers.tsx` | Página admin de usuarios | Crear (Task 13) |
| `src/pages/AdminSellers.tsx` | Página admin de vendedores | Crear (Task 13) |
| `docs/SETUP-ALERTAS-GCP.md` | Guía de alertas en GCP | Crear (Task 14) |
| `src/locales/es.json` | Traducciones español | Modificar (Tasks 6, 9, 15) |
| `src/locales/en.json` | Traducciones inglés | Modificar (Tasks 6, 9, 15) |

---

## Tasks

### PRiORIDAD 1 — Costo Firestore / Integridad (el eje Rescatto)

> **Razón:** Estas 4 tareas replican exactamente el trabajo que se hizo en Rescatto para ahorrar dinero en lecturas de Firestore. Sin cambios de UX, sin riesgo — solo configuración y optimizaciones atómicas respaldadas por `tsc + tests`.

---

#### Task 1: persistentLocalCache en firebase.ts

**Consume:** `firebase.ts` — `getFirestore(app)` sin configuración de caché
**Produce:** Firestore con caché persistente local — las recargas no queman lecturas del servidor

**Archivos:**
- Modificar: `src/services/firebase.ts:20`

**Qué hacer:**
```ts
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';

// ANTES:
export const db = getFirestore(app);

// DESPUÉS:
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
});
```

Esto es **idéntico al fix #1 de Rescatto**. `persistentMultipleTabManager` permite múltiples pestañas sin corrupción de caché. Cero riesgo UX — los reads locales son instantáneos y transparentes.

**Verificar:**
```bash
cd "/c/Users/ALEXANDER SANDOVAL/Documents/PERSONAL/DESARROLLO/Todo"
npx tsc -b 2>&1 | head -5
# ESPERADO: 0 errors
npx vitest run --reporter=verbose 2>&1 | tail -5
# ESPERADO: all tests pass
npm run build 2>&1 | tail -5
# ESPERADO: build exitoso
```

**Commit:**
```bash
git add src/services/firebase.ts
git commit -m "perf(firestore): persistentLocalCache + persistentMultipleTabManager (identical to Rescatto fix #1)"
```

---

#### Task 2: React Query real en hooks de datos (o desinstalar)

**Consume:** `package.json` (React Query instalado pero muerto), `useFirestore.ts` (todos useEffect+getDocs)
**Produce:** Caché real entre montajes de componentes con `staleTime` configurable

**Archivos:**
- Modificar: `src/main.tsx` (envolver con `QueryClientProvider`)
- Modificar: `src/App.tsx` (importar provider)
- Crear: `src/lib/queryClient.ts` (configuración centralizada de React Query)
- Modificar: `src/hooks/useFirestore.ts` (reescribir hooks con `useQuery`)
- Modificar: `src/pages/Explore.tsx` (usar `useQuery` en vez de `useEffect+getDocs`)
- Test: `src/tests/use-firestore-query.test.ts` (verificar caché funciona)
- Si se desinstala: `src/services/cacheService.ts` (caché TTL manual)

**Qué hacer:**

**Opción recomendada — Adoptar React Query de verdad:**

1. Crear `src/lib/queryClient.ts`:
```ts
import { QueryClient } from '@tanstack/react-query';
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,  // 5 min — datos semi-estáticos
      gcTime: 1000 * 60 * 30,    // 30 min en caché (antes cacheTime)
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
```

2. En `src/main.tsx`, envolver la app:
```tsx
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';

root.render(
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>
);
```

3. Reescribir `useFirestore.ts` hooks con `useQuery`:
```ts
import { useQuery } from '@tanstack/react-query';

export function useFeaturedListings() {
  return useQuery({
    queryKey: ['featured-listings'],
    queryFn: async () => {
      const q = query(
        collection(db, 'listings'),
        where('isActive', '==', true),
        where('isFeatured', '==', true),
        where('isApproved', '==', true),
        orderBy('createdAt', 'desc'),
        limit(6)
      );
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ ...d.data(), id: d.id } as Listing));
    },
    staleTime: 1000 * 60 * 5,
  });
}
// Repetir para useCategories, useSubcategories
```

4. En `Explore.tsx`, reemplazar `useEffect+getDocs` con `useQuery`

**Verificar:**
```bash
npx tsc -b 2>&1 | head -5
npx vitest run --reporter=verbose 2>&1 | tail -10
npm run build 2>&1 | tail -5
```

**Commit:**
```bash
git add src/lib/queryClient.ts src/main.tsx src/hooks/useFirestore.ts src/pages/Explore.tsx src/tests/
git commit -m "perf(queries): adopt @tanstack/react-query in all data hooks (was dead dependency)"
```

---

#### Task 3: Fix N+1 en useSellersByIds

**Consume:** `useFirestore.ts:53-63` — loop de `getDocs` por cada sellerId
**Produce:** Una sola consulta batcheada o `getDoc` directo

**Archivos:**
- Modificar: `src/hooks/useFirestore.ts` (función `useSellersByIds`)

**Qué hacer:**

Reemplazar el loop N+1 por un solo `getDoc` directo por id (más eficiente que re-indexar con `where('__name__','==',id)`):

```ts
export function useSellersByIds(ids: string[]) {
  return useQuery({
    queryKey: ['sellers', ids],
    queryFn: async () => {
      const result: Record<string, Seller> = {};
      // Para pocos IDs (< 10), getDoc directo es más barato que re-indexar
      await Promise.all(ids.map(async (id) => {
        const snap = await getDoc(doc(db, 'sellers', id));
        if (snap.exists()) result[id] = snap.data() as Seller;
      }));
      return result;
    },
    enabled: ids.length > 0,
    staleTime: 1000 * 60 * 10,
  });
}
```

Beneficio: elimina la creación de índice compuesto que `where('__name__','==',id)` requiere (cobra escrituras), y usa `getDoc` directo = 1 read por documento exacto, sin escaneo.

**Verificar:**
```bash
npx tsc -b 2>&1 | head -5
npx vitest run --reporter=verbose 2>&1 | tail -10
```

**Commit:**
```bash
git add src/hooks/useFirestore.ts
git commit -m "perf(firestore): fix N+1 in useSellersByIds — getDoc directo vs loop de getDocs"
```

---

#### Task 4: incrementViews → increment() atómico

**Consume:** `listingService.ts:159-165` — `getDoc + updateDoc(views+1)`
**Produce:** `increment('stats.views', 1)` atómico

**Archivos:**
- Modificar: `src/services/listingService.ts` (función `incrementViews`)
- Test: verificar que el test de listingService existe y pasa

**Qué hacer:**

```ts
import { increment } from 'firebase/firestore';

export async function incrementViews(id: string): Promise<void> {
  const ref = doc(db, COLLECTION, id);
  await updateDoc(ref, { 
    'stats.views': increment(1),
    updatedAt: new Date().toISOString(),
  });
}
```

Esto **elimina la lectura extra** (getDoc) y **elimina el race condition**: si dos usuarios ven el mismo listing al mismo tiempo, ambos incrementos se aplican en vez de que uno sobrescriba al otro.

**Verificar:**
```bash
npx tsc -b 2>&1 | head -5
npx vitest run src/tests/listings.test.ts --reporter=verbose 2>&1 | tail -10
```

**Commit:**
```bash
git add src/services/listingService.ts
git commit -m "perf(firestore): incrementViews → increment() atómico (era read-then-write con race)"
```

---

### PRIORIDAD 2 — Robustez backend + Landing pricing

---

#### Task 5: Sentry en Cloud Functions

**Consume:** `functions/src/` estructura existente — webhook Wompi, proxy IA, createTransaction sin captura
**Produce:** Errores de pagos y AI reportados a Sentry en producción

**Archivos:**
- Modificar: `functions/package.json` (añadir `@sentry/node`)
- Crear: `functions/src/lib/sentry.ts` (init + captureException wrapper)
- Modificar: `functions/src/index.ts` (init al arrancar)
- Modificar: `functions/src/payments/wompiWebhook.ts` (capturar errores)
- Modificar: `functions/src/ai/aiProxy.ts` (capturar errores)
- Modificar: `functions/src/payments/createTransaction.ts` (capturar errores)
- Modificar: `functions/.env.example` (añadir `SENTRY_DSN`)

**Qué hacer:**

Ver detalle completo en el plan original `docs/PLAN-PRODUCCION.md` — Fase 8.

Crear `functions/src/lib/sentry.ts`:
```ts
import * as Sentry from '@sentry/node';
import { logger } from 'firebase-functions/v2';

const SENTRY_DSN = process.env.SENTRY_DSN as string | undefined;
let initialized = false;

export function initSentry(): void {
  if (initialized || !SENTRY_DSN) return;
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: process.env.WOMPI_ENV || 'test',
    tracesSampleRate: 0.1,
  });
  initialized = true;
}

export function captureSentry(error: unknown, context?: Record<string, unknown>): void {
  if (initialized) {
    Sentry.captureException(error, { extra: context });
  } else {
    logger.error('[Sentry not initialized]', error);
  }
}
```

Envolver bloques `try/catch` en `wompiWebhook.ts`, `aiProxy.ts`, `createTransaction.ts`.

**Verificar:**
```bash
cd "/c/Users/ALEXANDER SANDOVAL/Documents/PERSONAL/DESARROLLO/Todo/functions"
npm install 2>&1 | tail -5
npm run build 2>&1 | tail -5
npm test 2>&1 | tail -10
# ESPERADO: 17+ tests pass
```

**Commit:**
```bash
git add functions/package.json functions/src/lib/sentry.ts functions/src/index.ts functions/src/payments/wompiWebhook.ts functions/src/ai/aiProxy.ts functions/src/payments/createTransaction.ts functions/.env.example
git commit -m "feat(observability): Sentry in Cloud Functions (webhook, AI proxy, payments)"
```

---

#### Task 6: Landing — Pricing dinámico desde SubscriptionPlanContext

**Consume:** `SubscriptionPlanContext.tsx` (ya existe), `planService.ts` (ya existe)
**Produce:** Landing con precios que se actualizan automáticamente desde Firestore

**Archivos:**
- Modificar: `src/pages/Landing.tsx` (sección pricing, líneas 238-327)
- Modificar: `src/locales/es.json` (eliminar keys hardcodeadas de pricing)
- Modificar: `src/locales/en.json` (eliminar keys hardcodeadas de pricing)

**Qué hacer:**
1. Importar `useSubscriptionPlans` desde `../context/SubscriptionPlanContext`
2. Reemplazar array de planes hardcodeado (líneas 239-284) con `plans` del contexto
3. Formatear precios con `new Intl.NumberFormat('es-CO', ...)` desde `plan.price` (COP)
4. Usar `plan.commissionRate` para % comisión, `plan.features` para lista de features
5. Eliminar keys `landing.pricing.plan1.*`, `plan2.*`, `plan3.*` de ambos locales
6. Mantener solo keys genéricas: `landing.pricing.badge`, `landing.pricing.title`, `landing.pricing.subtitle`, `landing.pricing.popular`

**Verificar:**
```bash
npx tsc -b 2>&1 | head -5
npx vitest run src/tests/landing.test.tsx --reporter=verbose 2>&1 | tail -10
```

**Commit:**
```bash
git add src/pages/Landing.tsx src/locales/es.json src/locales/en.json
git commit -m "feat(landing): dynamic pricing from SubscriptionPlanContext (was hardcoded in i18n)"
```

---

### PRIORIDAD 3 — Deuda técnica + Marketing

---

#### Task 7: Landing — Analytics events en CTAs

**Consume:** `src/services/analyticsService.ts` (ya existe)
**Produce:** Cada CTA trackea clics

**Archivos:**
- Modificar: `src/services/analyticsService.ts` (añadir métodos landing)
- Modificar: `src/pages/Landing.tsx` (trackEvent en onclick handlers)

**Qué hacer:**
- Añadir `trackLandingEvent(action: string, label?: string)` a analyticsService
- Trackear: hero CTA1/CTA2, how CTA, pricing CTAs, CTA banner, nav links, FAQ toggle

**Verificar:**
```bash
npx tsc -b 2>&1 | head -5
npx vitest run src/tests/landing.test.tsx --reporter=verbose 2>&1 | tail -10
```

**Commit:**
```bash
git add src/services/analyticsService.ts src/pages/Landing.tsx
git commit -m "feat(landing): analytics on all CTAs (hero, pricing, how, nav, faq)"
```

---

#### Task 8: Landing — AI Chat en la landing

**Consume:** `src/components/chat/AIChat.tsx` (ya existe)
**Produce:** Botón del asistente IA visible también en la landing

**Archivos:**
- Modificar: `src/pages/Landing.tsx` (importar e incluir AIChatButton)
- Modificar: `src/components/chat/AIChat.tsx` (soportar ruta raíz si es necesario)

**Verificar:**
```bash
npx tsc -b 2>&1 | head -5
npx vitest run src/tests/landing.test.tsx src/tests/ai-chat.test.ts 2>&1 | tail -10
```

**Commit:**
```bash
git add src/pages/Landing.tsx src/components/chat/AIChat.tsx
git commit -m "feat(landing): AI Chat assistant also available on marketing page"
```

---

#### Task 9: Landing — Social proof counters

**Consume:** `sellerService.ts`, `listingService.ts` (ya existen)
**Produce:** Sección "1,000+ vendedores · 5,000+ productos · 50+ ciudades"

**Archivos:**
- Crear: `src/components/landing/SocialProof.tsx`
- Modificar: `src/pages/Landing.tsx` (insertar entre hero y features)
- Modificar: `src/locales/es.json` (añadir keys)
- Modificar: `src/locales/en.json` (añadir keys)

**Qué hacer:**
- 3 tarjetas con contadores animados: vendedores, productos, ciudades
- Obtener counts desde Firestore (`getCountFromServer` si existe) o usar valores iniciales
- Añadir keys: `landing.social.sellers`, `landing.social.products`, `landing.social.cities`

**Verificar:**
```bash
npx tsc -b 2>&1 | head -5
npx vitest run src/tests/landing.test.tsx --reporter=verbose 2>&1 | tail -15
```

**Commit:**
```bash
git add src/components/landing/SocialProof.tsx src/pages/Landing.tsx src/locales/
git commit -m "feat(landing): social proof counters (sellers, products, cities)"
```

---

#### Task 10: Oxlint — limpiar ~116 warnings

**Produce:** `npx oxlint` con 0 warnings, 0 errors

**Archivos:**
- Múltiples archivos en `src/` — imports no usados, variables sin referencia

**Qué hacer:**
1. Ejecutar `npx oxlint 2>&1 | grep "src/"` para lista completa
2. Eliminar imports no usados de `lucide-react` y otras librerías
3. Prefijar variables no usadas con `_` o eliminarlas
4. Archivos confirmados: `CategoryPage.tsx`, `SettingsPage.tsx`, y más

**Verificar:**
```bash
npx oxlint 2>&1 | tail -3
# ESPERADO: 0 warnings, 0 errors
npx tsc -b 2>&1 | head -3
# ESPERADO: 0 errors
```

**Commit:**
```bash
git add src/pages/CategoryPage.tsx src/pages/SettingsPage.tsx <otros>
git commit -m "chore(lint): clean up oxlint warnings (unused imports, dead code)"
```

---

#### Task 11: Admin — crear rutas /admin/users y /admin/sellers

**Consume:** `AdminPanel.tsx` — botones que navegan a rutas que no existen
**Produce:** Páginas funcionales de administración de usuarios y vendedores

**Archivos:**
- Crear: `src/pages/AdminUsers.tsx` (tabla con búsqueda, roles, acciones)
- Crear: `src/pages/AdminSellers.tsx` (tabla con verificación, suspensión)
- Modificar: `src/App.tsx` (añadir rutas lazy-loaded)

**Verificar:**
```bash
npx tsc -b 2>&1 | head -3
# ESPERADO: 0 errors
npm run build 2>&1 | tail -3
```

**Commit:**
```bash
git add src/App.tsx src/pages/AdminUsers.tsx src/pages/AdminSellers.tsx
git commit -m "feat(admin): AdminUsers and AdminSellers pages (dead links were returning blank)"
```

---

### PRIORIDAD 4 — Marketing refinements + GCP alerts

---

#### Task 12: Landing — Animaciones scroll reveal

**Archivos:**
- Crear: `src/components/landing/ScrollReveal.tsx` (IntersectionObserver wrapper)
- Modificar: `src/pages/Landing.tsx` (envolver secciones)

**Verificar:**
```bash
npx tsc -b 2>&1 | head -3
npx vitest run src/tests/landing.test.tsx --reporter=verbose 2>&1 | tail -10
```

**Commit:**
```bash
git add src/components/landing/ScrollReveal.tsx src/pages/Landing.tsx
git commit -m "feat(landing): scroll reveal animations with IntersectionObserver"
```

---

#### Task 13: Landing — Screenshots de la app

**Archivos:**
- Crear: `public/screenshots/` (directorio con capturas reales)
- Modificar: `src/pages/Landing.tsx` (sección "Vea la app en acción")

> **Nota:** Requiere que la app esté corriendo para capturar las imágenes. Si no es posible ahora, crear placeholder con gradient.

**Verificar:**
```bash
npx tsc -b 2>&1 | head -3
```

**Commit:**
```bash
git add public/screenshots/ src/pages/Landing.tsx
git commit -m "feat(landing): app screenshots section"
```

---

#### Task 14: Log-based alerts en GCP (guía)

**Archivos:**
- Crear: `docs/SETUP-ALERTAS-GCP.md`

**Qué hacer:**
- Instrucciones exactas para crear métricas log-based para `payment.invalid_signature` y `payment.amount_mismatch`
- Configurar alertas en GCP Monitoring

**Verificar:**
```bash
# Configuración manual en GCP Console — no hay test automático
```

**Commit:**
```bash
git add docs/SETUP-ALERTAS-GCP.md
git commit -m "docs: log-based alert setup guide for GCP (fraud detection)"
```

---

### PRIORIDAD 5 — Higiene y cierre

---

#### Task 15: Landing — Redes sociales en footer

**Archivos:**
- Modificar: `src/pages/Landing.tsx` (sección footer)
- Modificar: `src/locales/es.json`, `en.json`

**Verificar:**
```bash
npx tsc -b 2>&1 | head -3
npx vitest run src/tests/landing.test.tsx --reporter=verbose 2>&1 | tail -10
```

**Commit:**
```bash
git add src/pages/Landing.tsx src/locales/
git commit -m "feat(landing): social media icons in footer (IG, X, WhatsApp, YT)"
```

---

## Verificación Final

```bash
cd "/c/Users/ALEXANDER SANDOVAL/Documents/PERSONAL/DESARROLLO/Todo"

echo "=== 1. TypeScript ==="
npx tsc -b 2>&1 | head -3
echo "ESPERADO: 0 errors"

echo "=== 2. Lint ==="
npx oxlint 2>&1 | tail -3
echo "ESPERADO: 0 warnings, 0 errors"

echo "=== 3. Tests frontend ==="
npx vitest run --reporter=verbose 2>&1 | tail -5
echo "ESPERADO: 800+ passed"

echo "=== 4. Tests functions ==="
cd functions && npm test 2>&1 | tail -5
echo "ESPERADO: 17+ passed"

echo "=== 5. Build ==="
cd ..
npm run build 2>&1 | tail -5
echo "ESPERADO: build exitoso + PWA"

echo "=== 6. Functions build ==="
npm --prefix functions run build 2>&1 | tail -3
echo "ESPERADO: build exitoso"

echo "=== 7. Git status ==="
git status --short
echo "ESPERADO: solo archivos esperados"

echo "=== 8. Cache Firestore ==="
grep -c "persistentLocalCache" src/services/firebase.ts
echo "ESPERADO: 1 (caché configurado)"

echo "=== 9. React Query ==="
grep -c "QueryClientProvider" src/main.tsx
echo "ESPERADO: 1 (provider montado)"

echo "=== 10. increment atómico ==="
grep -c "increment(" src/services/listingService.ts
echo "ESPERADO: 1+ (views usa increment atómico)"
```

## Definición de Hecho (DoD)

### 🔴 Prioridad 1 — Costo Firestore (mínimo para considerar el trabajo "hecho")
- [ ] `persistentLocalCache` + `persistentMultipleTabManager` activos en firebase.ts
- [ ] React Query adoptado en hooks de datos (useFeaturedListings, useCategories, Explore) con staleTime
- [ ] `useSellersByIds` sin N+1 — getDoc directo o Promise.all
- [ ] `incrementViews` usa `increment()` atómico

### 🟠 Prioridad 2 — Robustez
- [ ] Sentry inicializado y capturando errores en webhook Wompi, AI proxy, createTransaction
- [ ] Landing con pricing dinámico desde SubscriptionPlanContext

### 🟡 Prioridad 3 — Deuda técnica + marketing
- [ ] Oxlint: 0 warnings
- [ ] AdminUsers + AdminSellers funcionales
- [ ] Analytics en CTAs de Landing
- [ ] AI Chat en Landing
- [ ] Social proof counters

### 🟢 Prioridad 4-5 — Refinamiento
- [ ] Animaciones scroll reveal
- [ ] Screenshots de la app en Landing
- [ ] Guía de alertas GCP
- [ ] Redes sociales en footer
- [ ] `tsc -b` 0 errores
- [ ] `npm test` todos verdes
- [ ] `npm --prefix functions test` todos verdes
- [ ] `npm run build` exitoso
- [ ] Cero rastros de IA en código, commits y docs
