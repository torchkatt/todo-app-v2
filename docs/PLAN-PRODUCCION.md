# Plan de producción — Todo (marketplace)

> **Objetivo:** llevar la app a estado *production-ready*: flujo de pago real y seguro, cero
> huecos de seguridad, backend correcto, reglas coherentes, IA sin exponer secretos, y
> cobertura de tests con emuladores. Ejecutable por otro modelo/dev sin ambigüedad.
>
> **Restricción activa:** la **API key / secretos de Wompi aún no están disponibles**.
> Todo el código de Wompi debe quedar **implementado y funcional**, leyendo las credenciales
> desde variables de entorno/secretos. Donde falte el valor, se deja un **placeholder** y el
> sistema debe **degradar de forma segura** (no cobrar en falso, no marcar pagos como
> aprobados). Ver `FASE 2` y `FASE 9`.
>
> **Convenciones:** código en inglés; comentarios en español, breves. Dinero en **enteros de
> centavos** (`amountInCents: number`) en backend; nunca `float` para acumular. Toda mutación
> financiera pasa por Cloud Functions con idempotencia y audit trail.

---

## 0. Estado actual (diagnóstico base — no volver a auditar, ya está hecho)

Hallazgos críticos que este plan corrige:

1. **Pago simulado:** `openWompiCheckout` (`src/services/paymentService.ts`) nunca se invoca; el
   checkout graba `payment.method: 'simulated'`. No hay cobro real.
2. **Webhook Wompi inseguro:** firma opcional (`functions/src/index.ts:57`), esquema HMAC
   incorrecto (Wompi usa `signature.checksum` SHA-256), sin idempotencia → doble conteo de
   ingresos, sin validación de monto.
3. **Contradicción de reglas:** el cliente crea `transactions` con `totalAmount` propio
   (`src/pages/CheckoutPage.tsx:65`) pero la regla dice `create: if false`.
4. **API key de DeepSeek en el bundle** (`VITE_DEEPSEEK_API_KEY`) → robable; toda la seguridad
   del chat es client-side y se saltea.
5. **`verifyWompiTransaction` apunta a `sandbox` hardcodeado.**
6. **Estados de orden inconsistentes** entre checkout / webhook / reglas → cancelar no funciona.
7. **`functions/package.json` sin script `build`** y runtime inconsistente (json=nodejs20,
   pkg=node 22) → deploy no compila.
8. **`todo-sa-key.json` (clave privada SA) en el working dir.**
9. **Objeto `transaction` del checkout no cumple el tipo `Transaction`** de `src/types/index.ts`
   (faltan `subtotal`, `platformFee`, `sellerEarnings`, `transactionType`; `lineItems` con
   forma equivocada).

**Tests actuales:** 807 pasan, pero muchos son de humo (`typeof x === 'function'`). No hay
tests de reglas ni de integración de pago.

---

## Principios de arquitectura (obligatorios en toda la ejecución)

- **Server-authoritative money:** el frontend **nunca** define el `totalAmount`. El backend
  recalcula subtotal, fees, impuestos y total a partir de los `listingId + quantity` y del
  precio real en Firestore.
- **Idempotencia:** toda operación financiera (crear orden, confirmar pago, actualizar stats)
  es idempotente por `reference` / `wompiTransactionId`.
- **Audit trail:** cada cambio de estado financiero escribe en `audit_logs` (append-only).
- **Fail-safe, no fail-open** en dinero: si falta el secreto de Wompi, el webhook **rechaza**
  (no aprueba). El único fail-open aceptable es el rate-limit por error transitorio de DB.
- **Secretos solo en backend:** DeepSeek y todos los secretos de Wompi viven en Secret Manager
  / env de Functions, nunca en `VITE_*`.

---

## FASE 0 — Higiene y setup (bloqueante, hacer primero)

### 0.1 Secretos y archivos sensibles
- [ ] Eliminar del working dir y **rotar**: `todo-sa-key.json`, `seed_token.txt`.
  - `git rm --cached todo-sa-key.json seed_token.txt` (ya están en `.gitignore`; confirmar).
  - Rotar la service account key en GCP Console (crear nueva, borrar la comprometida).
  - Los scripts de seed (`src/scripts/*.ts`) deben usar `GOOGLE_APPLICATION_CREDENTIALS`
    apuntando a un archivo **fuera del repo**, no un JSON versionable.
- [ ] Verificar que `git ls-files | grep -iE "sa-key|\.env$|seed_token|credential"` no
  devuelva nada salvo `.env.example`.

### 0.2 `.env.example` — placeholders (frontend, solo claves públicas)
```
# Firebase (públicas por diseño)
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_MEASUREMENT_ID=
VITE_FIREBASE_VAPID_KEY=

# Wompi — SOLO la llave pública va al frontend (pendiente de obtener)
VITE_WOMPI_PUBLIC_KEY=pub_test_PENDIENTE

# NOTA: NO existe VITE_DEEPSEEK_API_KEY. La IA se sirve vía Cloud Function.
```
- [ ] **Eliminar** `VITE_DEEPSEEK_API_KEY` de `.env` y `.env.example`.

### 0.3 Secretos de backend (Functions) — definir aunque estén pendientes
Usar Firebase Secrets (`firebase functions:secrets:set`) o `.env` de functions (gitignored):
```
WOMPI_PRIVATE_KEY=prv_test_PENDIENTE        # llave privada (server-to-server)
WOMPI_EVENTS_SECRET=PENDIENTE               # secreto de "Eventos" (webhook checksum)
WOMPI_INTEGRITY_SECRET=PENDIENTE            # secreto de integridad (firma del widget)
WOMPI_ENV=test                              # test | prod  → selecciona URLs
DEEPSEEK_API_KEY=PENDIENTE
DEEPSEEK_MODEL=deepseek-chat
DEEPSEEK_MAX_TOKENS=1000
PLATFORM_FEE_BPS=500                         # comisión plataforma en basis points (5%)
IVA_BPS=1900                                 # IVA 19%
```
- [ ] Crear `functions/.env.example` con estas claves (sin valores) y añadir `functions/.env`
  al `.gitignore`.

### 0.4 Build de Functions (deploy roto hoy)
- [ ] En `functions/package.json` añadir scripts y unificar runtime:
```json
{
  "engines": { "node": "20" },
  "scripts": {
    "build": "tsc",
    "build:watch": "tsc -w",
    "serve": "npm run build && firebase emulators:start --only functions",
    "lint": "tsc --noEmit"
  }
}
```
- [ ] En `firebase.json` `functions.runtime` = `"nodejs20"` (coherente con engines).
- [ ] Confirmar `functions/tsconfig.json` con `outDir: "lib"`, `rootDir: "src"`,
  `"strict": true`, `"target": "ES2022"`, `"module": "commonjs"`.
- [ ] Añadir predeploy en `firebase.json`:
```json
"functions": { "source": "functions", "runtime": "nodejs20",
  "predeploy": ["npm --prefix functions run build"] }
```

### 0.5 Emuladores (necesario para tests de fase 7)
- [ ] Añadir a `firebase.json`:
```json
"emulators": {
  "auth": { "port": 9099 },
  "firestore": { "port": 8080 },
  "functions": { "port": 5001 },
  "storage": { "port": 9199 },
  "ui": { "enabled": true }
}
```

**Criterio de aceptación Fase 0:** `npm --prefix functions run build` compila sin errores;
`firebase emulators:start` levanta auth+firestore+functions+storage; ningún secreto en el repo.

---

## FASE 1 — Modelo de órdenes y máquina de estados (fuente única de verdad)

### 1.1 Máquina de estados de transacciones
Crear `functions/src/domain/orderState.ts` (y espejo de solo-lectura en
`src/utils/orderState.ts` para la UI):

```ts
// Estados válidos y transiciones permitidas. Fuente única de verdad.
import { TransactionStatus } from "./types"; // reusar enum de src/types

export const ALLOWED_TRANSITIONS: Record<TransactionStatus, TransactionStatus[]> = {
  PENDING_PAYMENT:   ["PAYMENT_CONFIRMED", "CANCELLED"],
  PAYMENT_CONFIRMED: ["PREPARING", "CONFIRMED", "CANCELLED", "REFUNDED", "DISPUTED"],
  PREPARING:         ["READY", "CANCELLED", "DISPUTED"],
  READY:             ["IN_TRANSIT", "DELIVERED", "CANCELLED", "DISPUTED"],
  IN_TRANSIT:        ["DELIVERED", "DISPUTED"],
  DELIVERED:         ["DISPUTED", "REFUNDED"],
  CONFIRMED:         ["ATTENDED", "NO_SHOW", "CANCELLED", "DISPUTED"],
  ATTENDED:          ["DISPUTED", "REFUNDED"],
  NO_SHOW:           ["DISPUTED"],
  CANCELLED:         [],
  DISPUTED:          ["REFUNDED", "CANCELLED"],
  REFUNDED:          [],
};

export function canTransition(from: TransactionStatus, to: TransactionStatus): boolean {
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}
```

### 1.2 Compartir tipos entre frontend y functions
- [ ] Copiar/compartir los enums (`TransactionStatus`, `TransactionType`, `DeliveryMethod`,
  `UserRole`) a `functions/src/domain/types.ts`. Mantener sincronizados con
  `src/types/index.ts` (o extraer a un paquete `shared/`). Documentar en el header que son
  espejo.

**Criterio de aceptación:** un cambio de estado inválido (p.ej. `CANCELLED → DELIVERED`) es
rechazado por `canTransition` con test unitario.

---

## FASE 2 — Backend de pagos Wompi (núcleo, con API key pendiente)

Reemplazar por completo `functions/src/index.ts` por una estructura modular:

```
functions/src/
├── index.ts                 # export de todas las functions
├── config.ts                # lee secretos, URLs por WOMPI_ENV, valida presencia
├── domain/
│   ├── types.ts
│   └── orderState.ts
├── payments/
│   ├── createTransaction.ts # callable: crea la orden (montos server-side) + firma integridad
│   ├── wompiWebhook.ts       # onRequest: verifica checksum, idempotente
│   ├── wompiSignature.ts     # helpers de checksum e integridad
│   └── wompiClient.ts        # llamadas server-to-server a la API de Wompi
├── ai/
│   └── aiProxy.ts            # callable: proxy DeepSeek + quota server-side
├── notifications/
│   └── onTransactionCreate.ts
└── lib/
    ├── rateLimit.ts
    └── audit.ts
```

### 2.1 `config.ts` — carga y validación de secretos (degradación segura)
```ts
import { defineSecret } from "firebase-functions/params";

export const WOMPI_PRIVATE_KEY   = defineSecret("WOMPI_PRIVATE_KEY");
export const WOMPI_EVENTS_SECRET = defineSecret("WOMPI_EVENTS_SECRET");
export const WOMPI_INTEGRITY_SECRET = defineSecret("WOMPI_INTEGRITY_SECRET");
export const DEEPSEEK_API_KEY    = defineSecret("DEEPSEEK_API_KEY");

const PENDING = new Set(["", "PENDIENTE", undefined]);

export function wompiConfigured(): boolean {
  return !PENDING.has(WOMPI_PRIVATE_KEY.value()) &&
         !PENDING.has(WOMPI_EVENTS_SECRET.value()) &&
         !PENDING.has(WOMPI_INTEGRITY_SECRET.value());
}

export function wompiUrls() {
  const prod = process.env.WOMPI_ENV === "prod";
  return {
    api: prod ? "https://production.wompi.co/v1" : "https://sandbox.wompi.co/v1",
    checkout: "https://checkout.wompi.co/p/",
  };
}
```
> **Comportamiento con API key pendiente:** `createTransaction` crea la orden en estado
> `PENDING_PAYMENT` con `payment.gateway: "wompi"` pero, si `!wompiConfigured()`, devuelve
> `paymentReady: false` y **no** genera firma de integridad. El webhook, si `!wompiConfigured()`,
> responde `503` y **no** confirma nada. Así nada se marca como pagado en falso.

### 2.2 `wompiSignature.ts` — checksum de eventos e integridad (algoritmos exactos de Wompi)
```ts
import * as crypto from "crypto";

/**
 * Firma de integridad para el Widget/Web Checkout.
 * integrity = SHA256(reference + amountInCents + currency + integritySecret)
 * Se calcula en backend para NO exponer el secreto de integridad.
 */
export function integritySignature(
  reference: string, amountInCents: number, currency: string, secret: string
): string {
  const payload = `${reference}${amountInCents}${currency}${secret}`;
  return crypto.createHash("sha256").update(payload).digest("hex");
}

/**
 * Verificación del webhook de "Eventos".
 * checksum = SHA256( concat(valores de signature.properties en orden) + timestamp + eventsSecret )
 * Los valores se leen del payload por path (p.ej. "transaction.amount_in_cents").
 */
export function verifyEventChecksum(event: any, eventsSecret: string): boolean {
  const props: string[] = event?.signature?.properties ?? [];
  const provided: string = event?.signature?.checksum ?? "";
  if (!props.length || !provided) return false;

  const concatenated = props
    .map((path) => path.split(".").reduce((o, k) => o?.[k], event.data))
    .join("");
  const toSign = `${concatenated}${event.timestamp}${eventsSecret}`;
  const expected = crypto.createHash("sha256").update(toSign).digest("hex");

  // Comparación en tiempo constante
  const a = Buffer.from(expected, "hex");
  const b = Buffer.from(provided, "hex");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
```
> **Nota de implementación:** confirmar contra la doc oficial de Wompi el orden exacto de
> concatenación y si `timestamp` es `event.timestamp` (epoch). Dejar un test unitario con un
> vector de ejemplo de la doc para validar el algoritmo antes de conectar la key real.

### 2.3 `createTransaction.ts` — callable, montos server-side
Firma: `createTransaction(data: { items: {listingId, quantity}[], delivery: {...} })`.

Lógica obligatoria:
1. `context.auth` requerido; si no, `unauthenticated`.
2. Leer cada `listing` de Firestore; validar `isActive`, `isApproved`, `quantity` (stock).
3. **Todos los items deben ser del mismo `sellerId`** (o dividir en N órdenes; decidir y
   documentar — recomendado: una orden por seller).
4. Calcular en **centavos enteros**:
   - `subtotal = Σ (listing.price * 100 * quantity)`
   - `deliveryFee` según `seller.deliveryConfig` y método.
   - `platformFee = round(subtotal * PLATFORM_FEE_BPS / 10000)`
   - `taxes = round(subtotal * IVA_BPS / 10000)` (si aplica; validar régimen).
   - `totalAmount = subtotal + deliveryFee + taxes`
   - `sellerEarnings = subtotal - platformFee`
5. Generar `reference` único e idempotente: `TODO-{sellerId}-{uuid}`.
6. Escribir el doc `transactions/{reference}` con estado `PENDING_PAYMENT`, `transactionType`
   correcto, `lineItems` conforme al tipo `LineItem` (`unitPrice`, `totalPrice`), y
   `payment: { gateway:"wompi", status:"pending", amount: totalAmount, currency:"COP" }`.
7. Escritura idempotente: usar `db.doc(...).create()` (falla si existe) o transacción que
   verifique inexistencia.
8. Si `wompiConfigured()`: devolver `{ reference, amountInCents: totalAmount, currency:"COP",
   integrity: integritySignature(...), publicKey: <desde config server o eco de pub>, paymentReady: true }`.
   Si no: `{ reference, amountInCents: totalAmount, paymentReady: false }`.
9. Registrar en `audit_logs` (`action: "transaction.created"`).

> **Decisión de diseño:** el stock (`quantity`) se **reserva** al crear la orden dentro de una
> transacción Firestore (decrementar `listing.quantity`), y se **restituye** si la orden se
> cancela o el pago es declinado/expira. Documentar y testear la restitución.

### 2.4 `wompiWebhook.ts` — seguro e idempotente (reemplaza el actual)
Reglas duras (todas obligatorias):
1. Solo `POST`; else `405`.
2. Tamaño de payload ≤ 100KB; else `413`.
3. Rate-limit por IP (mantener `lib/rateLimit.ts`; fail-open solo por error de DB).
4. Si `!wompiConfigured()` → `503 Service Unavailable` (no procesar).
5. **Verificar checksum SIEMPRE** con `verifyEventChecksum`. Si falla → `401` + log + audit.
   **Nunca** procesar sin firma válida.
6. **Idempotencia:** clave = `event.data.transaction.id` (id de Wompi). Antes de mutar, en una
   `db.runTransaction`, leer `processed_events/{wompiTxId}`; si existe → `200 { received:true,
   duplicate:true }` sin re-aplicar. Si no, crear el doc dentro de la misma transacción.
7. **Validar monto:** el `amount_in_cents` del evento debe coincidir con
   `transaction.payment.amount` de la orden. Si difiere → `409` + audit `payment.amount_mismatch`
   + estado `DISPUTED` (no confirmar).
8. Aplicar transición vía `canTransition`. Mapear `APPROVED→PAYMENT_CONFIRMED`,
   `DECLINED/VOIDED/ERROR→CANCELLED` (+ restituir stock).
9. Solo en `PAYMENT_CONFIRMED` (y solo una vez, garantizado por idempotencia): incrementar
   `seller.stats.totalRevenue/totalTransactions`, crear notificación, escribir `audit_logs`.
10. Todo el bloque de mutaciones dentro de **una** `runTransaction` para atomicidad.

Esqueleto:
```ts
export const wompiWebhook = onRequest(
  { secrets: [WOMPI_EVENTS_SECRET, WOMPI_PRIVATE_KEY, WOMPI_INTEGRITY_SECRET], cors: false },
  async (req, res) => {
    if (req.method !== "POST") return void res.status(405).send("Method Not Allowed");
    const raw = JSON.stringify(req.body);
    if (raw.length > MAX_PAYLOAD_SIZE) return void res.status(413).send("Payload too large");
    const ip = (req.headers["x-forwarded-for"] as string) || req.ip || "unknown";
    if (!(await checkRateLimit(ip))) return void res.status(429).send("Too many requests");
    if (!wompiConfigured()) return void res.status(503).send("Payments not configured");

    const event = req.body;
    if (!event?.data?.transaction) return void res.status(400).send("Invalid payload");
    if (!verifyEventChecksum(event, WOMPI_EVENTS_SECRET.value())) {
      await audit("payment.invalid_signature", { ip });
      return void res.status(401).send("Invalid signature");
    }
    try {
      await db.runTransaction(async (t) => {
        const tx = event.data.transaction;
        const evtRef = db.collection("processed_events").doc(tx.id);
        if ((await t.get(evtRef)).exists) return; // idempotente
        const orderRef = db.collection("transactions").doc(tx.reference);
        const order = await t.get(orderRef);
        if (!order.exists) throw new HttpError(404, "order not found");
        const data = order.data()!;
        if (tx.amount_in_cents !== data.payment.amount) {
          t.update(orderRef, { status: "DISPUTED", updatedAt: now() });
          t.set(evtRef, { at: now(), reason: "amount_mismatch" });
          return;
        }
        const nextStatus = mapWompiStatus(tx.status);       // APPROVED→PAYMENT_CONFIRMED...
        if (!canTransition(data.status, nextStatus)) { t.set(evtRef,{at:now(),skipped:true}); return; }
        t.update(orderRef, { status: nextStatus, "payment.status": tx.status.toLowerCase(),
          "payment.wompiId": tx.id, "payment.method": tx.payment_method?.type ?? "unknown",
          "payment.approvedAt": now(), updatedAt: now() });
        if (nextStatus === "PAYMENT_CONFIRMED") {
          t.update(db.collection("sellers").doc(data.sellerId), {
            "stats.totalRevenue": FieldValue.increment(data.sellerEarnings),
            "stats.totalTransactions": FieldValue.increment(1), updatedAt: now() });
          t.set(db.collection("notifications").doc(), buyerPaidNotification(data, tx.reference));
        }
        t.set(evtRef, { at: now(), status: nextStatus });
      });
      res.status(200).send({ received: true });
    } catch (e) { logger.error("Webhook error", e); res.status(500).send("Error"); }
  });
```

### 2.5 `wompiClient.ts` — verificación server-to-server (reemplaza `verifyWompiTransaction`)
- [ ] Consultar `GET {api}/transactions/{id}` con `Authorization: Bearer <WOMPI_PRIVATE_KEY>`,
  usando `wompiUrls().api` (respeta `WOMPI_ENV`, no hardcodear sandbox).
- [ ] Exponer callable `verifyTransaction({ wompiTxId })` para reconciliación / fallback si el
  webhook no llegó. Debe re-aplicar la misma lógica idempotente del webhook.

### 2.6 `onTransactionCreate.ts` (migrar el existente)
- [ ] Mantener notificación in-app al comprador y al vendedor.
- [ ] Integrar envío de **email real** (SendGrid/Mailgun) detrás de flag `EMAIL_ENABLED`; si no
  configurado, degradar a solo notificación (no dejar `logger.info` como "envío").

**Criterio de aceptación Fase 2:**
- Webhook rechaza (`401`) cualquier evento sin checksum válido (test).
- Reenviar el mismo evento 3× produce **un solo** incremento de revenue (test idempotencia).
- Evento con `amount_in_cents` distinto → orden `DISPUTED`, sin confirmar (test).
- Con secretos `PENDIENTE`, webhook responde `503` y `createTransaction` devuelve
  `paymentReady:false`.

---

## FASE 3 — Reglas de Firestore y Storage coherentes

### 3.1 `firestore.rules`
- [ ] `transactions`: mantener `create: if false` (solo Cloud Function). **Restringir `update`
  del comprador** a solo `CANCELLED` desde `PENDING_PAYMENT` (no `PENDING`), y validar que
  **no** pueda tocar campos financieros:
```
allow update: if isAdmin() ||
  (isOwner(resource.data.buyerId) &&
   resource.data.status == 'PENDING_PAYMENT' &&
   request.resource.data.status == 'CANCELLED' &&
   request.resource.data.diff(resource.data).affectedKeys().hasOnly(['status','updatedAt']));
```
- [ ] `sellers`: `update` de dueño **no** debe permitir escribir `stats.*`, `subscription`,
  `isVerified` (esos los mueve backend). Añadir `hasOnly([...campos editables...])`.
- [ ] `listings`: en `create/update`, validar que el seller es dueño **y** que `stats`,
  `isApproved`, `isFeatured` no los fija el seller (moderación/backend).
- [ ] `analytics_events`, `notifications`, `users`: revisar que `role` no sea auto-escalable
  (ya cubierto por `canCreateUser` = CUSTOMER; verificar que `update` no permita cambiar `role`
  — el `hasOnly` actual lo cubre; **añadir test**).
- [ ] Colecciones nuevas: `processed_events` y `rate_limits` → `read/write: if false`
  (solo backend con Admin SDK). `audit_logs` → `read: if isAdmin(); write: if false`.
  `ai_usage` → `read: if isOwner; write: if false` (lo escribe la function).

### 3.2 Storage
- [ ] `storage.rules`: para `avatars/{userId}` añadir límite de tamaño y content-type:
```
allow write: if (isOwner(userId) || isAdmin())
  && request.resource.size < 5 * 1024 * 1024
  && request.resource.contentType.matches('image/.*');
```
- [ ] Definir path para imágenes de `listings/{sellerId}/{listingId}/**` con validación de
  `isSellerOwner` y mismos límites.

**Criterio de aceptación Fase 3:** tests con `@firebase/rules-unit-testing` que prueben:
comprador no puede cambiar `totalAmount`; seller no puede subir su propio `stats.totalRevenue`;
usuario no puede escalar `role` a ADMIN; escritura directa a `transactions` denegada.

---

## FASE 4 — Proxy de IA (DeepSeek) + quotas server-side

### 4.1 Mover la clave y la llamada al backend
Crear callable `functions/src/ai/aiProxy.ts`:
- Firma: `aiChat({ messages: {role,content}[] })`, `context.auth` requerido.
- Pasos:
  1. Validar auth; resolver `tier` del usuario (reusar lógica de
     `src/services/aiChatUsageService.ts` → portar a backend).
  2. **Rate-limit y quota server-side** en `ai_usage/{userId}` (idempotente por día).
     Si excede → devolver error de cuota (no llamar a DeepSeek).
  3. Ejecutar `checkMessage` (jailbreak/sanitización) **en backend** (portar
     `aiChatSecurity.ts`).
  4. Llamar a DeepSeek con `DEEPSEEK_API_KEY` (secreto). Manejar `tool_calls`.
  5. **Los tools que leen/escriben Firestore siguen ejecutándose con permisos del usuario.**
     Opciones: (a) devolver `tool_calls` al cliente, que los ejecuta con su auth (gobernado por
     rules) y reenvía resultados al callable; **recomendado** — preserva el modelo de permisos.
     (b) ejecutarlos en backend validando ownership manualmente (más trabajo). Elegir (a).
  6. Incrementar `ai_usage` solo en llamada exitosa.
- [ ] Declarar `DEEPSEEK_API_KEY` como secret; nunca en `VITE_*`.

### 4.2 Frontend
- [ ] `src/services/deepseekService.ts` → renombrar a `aiChatService.ts`; reemplazar `fetch`
  directo por `httpsCallable(functions, "aiChat")`. Mantener el loop de tools client-side
  (opción a).
- [ ] Borrar toda referencia a `VITE_DEEPSEEK_*`.
- [ ] `src/services/aiChatSecurity.ts` y `aiChatUsageService.ts`: la copia client-side queda solo
  como UX (feedback inmediato); la **autoridad** es el backend.

### 4.3 Afinar falsos positivos de jailbreak
- [ ] Revisar `JAILBREAK_PATTERNS` en `aiChatSecurity.ts`: quitar/《acotar》 `/malicious|hack|
  exploit|vulnerability/i` y `/override/i` (bloquean consultas legítimas). Mantener los patrones
  de inyección de prompt y de manipulación financiera (`fake transaction`, `modify price`, etc.).
- [ ] Añadir tests que confirmen que preguntas legítimas ("¿tienen productos de seguridad?",
  "¿hay algún problema con mi pedido?") **no** se bloquean.

**Criterio de aceptación Fase 4:** el bundle de producción **no contiene** la key de DeepSeek
(`grep -r "sk-" dist/` vacío); exceder la cuota diaria devuelve error swithout llamar a DeepSeek;
el chat sigue funcionando end-to-end contra el emulador de functions.

---

## FASE 5 — Reescritura del checkout (frontend)

### 5.1 `src/pages/CheckoutPage.tsx`
- [ ] Eliminar `addDoc(collection(db,'transactions'), ...)` y toda construcción de montos en el
  cliente.
- [ ] Flujo nuevo:
  1. `const { reference, amountInCents, currency, integrity, paymentReady } =
     await httpsCallable(functions,'createTransaction')({ items, delivery })`.
  2. Si `!paymentReady` (Wompi pendiente): mostrar estado "Pago no disponible aún" y dejar la
     orden en `PENDING_PAYMENT` (permite probar todo el flujo salvo el cobro real).
  3. Si `paymentReady`: abrir el Widget de Wompi con `reference`, `amountInCents`, `currency`,
     `publicKey` (`VITE_WOMPI_PUBLIC_KEY`) y **`signature:integrity`** = `integrity` (del backend).
  4. `redirectUrl` → `/orders/{reference}`. La confirmación real llega por **webhook**, no por
     el `onSuccess` del cliente (el cliente solo muestra "procesando").
- [ ] Quitar la actualización client-side de `user.impact.totalSpent/totalTransactions` en el
  checkout: eso debe moverlo el backend al confirmar el pago (evita inflar métricas sin pago).

### 5.2 `src/services/paymentService.ts`
- [ ] Reescribir `openWompiCheckout` para recibir `integrity` y `amountInCents` ya calculados
  (no calcular `amount * 100` ni IVA en el cliente).
- [ ] Eliminar `verifyWompiTransaction` del cliente (mover a callable `verifyTransaction`).
- [ ] Corregir el comentario/URL muerta (`WOMPI_URL` idéntico en ambas ramas).

### 5.3 Página de orden
- [ ] `src/pages/OrderDetail.tsx`: reflejar estados reales de la máquina; polling o
  `onSnapshot` a `transactions/{reference}` para mostrar `PENDING_PAYMENT → PAYMENT_CONFIRMED`.

**Criterio de aceptación Fase 5:** con Wompi pendiente, el usuario completa el checkout, se crea
la orden con montos correctos calculados por backend, y la UI muestra "pago pendiente de
configuración" sin errores. Ningún monto se origina en el cliente.

---

## FASE 6 — Correcciones funcionales y de calidad

- [ ] **Alinear `CartItem`/`LineItem`:** el carrito debe producir items con la forma que espera
  `createTransaction` (`listingId`, `quantity`); el backend arma `LineItem` con `unitPrice`,
  `totalPrice`.
- [ ] **Formatters de dinero:** `src/utils/formatters.ts` debe formatear desde centavos
  (`amountInCents / 100`) de forma consistente; auditar todos los `toLocaleString` de precios.
- [ ] **`logger`:** verificar que en producción no filtre datos sensibles (`src/utils/logger.ts`).
- [ ] **Sentry:** confirmar que el DSN es de proyecto y que no captura PII (emails, direcciones)
  en breadcrumbs de checkout.
- [ ] **i18n:** verificar que los nuevos textos (estados de pago) estén en `es.json` y `en.json`.
- [ ] **Índices Firestore:** añadir a `firestore.indexes.json` los índices para las queries de
  `getUserTransactions` (`buyerId + createdAt desc`) y revenue (`sellerId + createdAt`).

---

## FASE 7 — Testing (elevar de humo a real)

### 7.1 Tests de reglas (nuevos) — `@firebase/rules-unit-testing`
- [ ] `tests/rules/transactions.rules.test.ts`: create denegado a cliente; update solo cancela;
  no puede mutar montos.
- [ ] `tests/rules/users.rules.test.ts`: no escalar `role`.
- [ ] `tests/rules/sellers.rules.test.ts`: seller no escribe `stats`.
- [ ] `tests/rules/storage.rules.test.ts`: límites de tamaño/tipo.

### 7.2 Tests de functions (emulador) — `firebase-functions-test`
- [ ] `createTransaction`: montos correctos, rechazo de stock insuficiente, una orden por seller.
- [ ] `wompiWebhook`: firma inválida→401; idempotencia (3× = 1 incremento); mismatch→DISPUTED;
  `503` con secretos pendientes.
- [ ] `verifyEventChecksum` / `integritySignature`: vectores de la doc de Wompi.
- [ ] `aiProxy`: quota excedida no llama a DeepSeek (mockear fetch); jailbreak bloqueado; mensaje
  legítimo pasa.
- [ ] `orderState.canTransition`: matriz de transiciones válidas/ inválidas.

### 7.3 Depurar tests de humo existentes
- [ ] Reemplazar los `expect(typeof x).toBe('function')` de `payment.test.ts` y
  `expanded-services.test.ts` por asserts de comportamiento reales (o marcarlos como smoke y no
  contarlos como cobertura).

**Criterio de aceptación Fase 7:** `npm test` (frontend) + `npm --prefix functions test`
(emulador) verdes; cobertura real de los módulos de pago ≥ 90% de ramas.

---

## FASE 8 — Observabilidad, CI/CD y checklist de deploy

- [ ] **CI (GitHub Actions)** en `.github/`: en cada PR correr `tsc -b`, `oxlint`, `vitest run`,
  `npm --prefix functions run build`, y tests de reglas contra emulador.
- [ ] **Bloqueo de secretos:** paso de CI que falle si `git grep -E "prv_|sk-|PRIVATE KEY"` en el
  árbol o si `dist/` contiene claves.
- [ ] **Sentry** en Functions (no solo frontend): capturar errores del webhook y del proxy IA.
- [ ] **Alertas:** log-based alert en GCP para `payment.invalid_signature` y
  `payment.amount_mismatch` (posible fraude).
- [ ] **Runbook de go-live Wompi** (cuando llegue la key): setear secretos, `WOMPI_ENV=prod`,
  registrar URL del webhook en el panel de Wompi, correr `verifyTransaction` contra una
  transacción real de prueba, confirmar checksum con vector real.

---

## FASE 9 — Activación de Wompi (pendiente de credenciales — documentar, no ejecutar aún)

Cuando el usuario obtenga las llaves:
1. `firebase functions:secrets:set WOMPI_PRIVATE_KEY` / `WOMPI_EVENTS_SECRET` /
   `WOMPI_INTEGRITY_SECRET`.
2. `VITE_WOMPI_PUBLIC_KEY` en el `.env` del frontend (pub key es pública).
3. `WOMPI_ENV=test` para validar en sandbox; luego `prod`.
4. Registrar el endpoint del webhook (`https://<region>-<project>.cloudfunctions.net/wompiWebhook`)
   en el panel de Wompi → sección Eventos.
5. Correr el checklist de la Fase 8 (verificación de checksum con evento real, transacción de
   prueba end-to-end, idempotencia, mismatch).
6. Recién ahí, `paymentReady:true` fluye y el cobro es real.

---

## Orden de ejecución recomendado (dependencias)

```
Fase 0 → Fase 1 → Fase 2 → Fase 3 → Fase 4 → Fase 5 → Fase 6 → Fase 7 → Fase 8 → (Fase 9)
```
Fases 3 y 4 pueden paralelizarse tras la 2. La 5 depende de 2 (callables) y 3 (reglas).

## Definición de "Hecho" (Definition of Done global)
- [ ] Ningún secreto server-side en `VITE_*` ni en el repo; bundle sin claves.
- [ ] Ningún monto financiero se origina en el cliente.
- [ ] Webhook: firma obligatoria + idempotente + validación de monto + audit.
- [ ] Reglas de Firestore/Storage con tests que prueban los abusos clave.
- [ ] Máquina de estados única aplicada en backend y reflejada en UI.
- [ ] Con Wompi pendiente, la app degrada de forma segura (no cobra en falso, no aprueba).
- [ ] `tsc -b`, `oxlint`, `vitest`, build de functions y tests de emulador en verde en CI.
- [ ] Cero rastros de IA en código, commits y docs (regla del core).
```
