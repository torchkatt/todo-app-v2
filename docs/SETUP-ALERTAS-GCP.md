# Setup de alertas basadas en logs (GCP)

> Guía manual — requiere acceso a GCP Console del proyecto `todo-a44f9`. No se puede automatizar desde aquí (sin acceso a la consola), pero los logs que se necesitan ya se están emitiendo en el código.

## Por qué

`wompiWebhook` y `aiChat` ya registran eventos de seguridad relevantes (`logger.warn`/`logger.error` de `firebase-functions/v2`, más `audit()` en Firestore), pero nadie se entera si ocurren fuera de horario de revisión manual. Las alertas basadas en logs cierran ese hueco sin tocar código.

## Señales ya emitidas que vale la pena alertar

| Log / evento | Dónde se emite | Qué indica |
|---|---|---|
| `wompiWebhook: invalid signature` | `functions/src/payments/wompiWebhook.ts` | Intento de webhook falsificado — posible fraude |
| `audit('payment.invalid_signature', ...)` | mismo archivo, colección `audit_logs` en Firestore | Igual que arriba, con IP y referencia |
| `429 Too many requests` (rate limit) | `checkRateLimit` en `wompiWebhook` | Posible ataque de fuerza bruta al webhook |
| `wompiWebhook: error processing event` | mismo archivo | Fallo procesando un pago real — revisar cuanto antes |
| `aiChat: DeepSeek request failed` | `functions/src/ai/aiProxy.ts` | Proveedor de IA caído o cuota agotada |
| Eventos de Sentry (`captureError`) | `functions/src/lib/sentry.ts`, ya cableado en wompiWebhook y aiChat | Cualquier excepción no controlada en pagos/IA |

## Pasos (GCP Console → Logging → Alertas basadas en logs)

1. Ir a **Cloud Console → Logging → Log-based Metrics** del proyecto `todo-a44f9`.
2. Crear una métrica contador por cada señal de la tabla, con filtro tipo:
   ```
   resource.type="cloud_function"
   resource.labels.function_name="wompiWebhook"
   textPayload:"invalid signature"
   ```
   (ajustar el filtro según el mensaje exacto — los `logger.error`/`logger.warn` de Functions v2 aparecen en Cloud Logging con severidad `ERROR`/`WARNING`).
3. Ir a **Monitoring → Alerting → Create Policy**, usar la métrica creada como condición.
   - Umbral sugerido para `invalid signature` y rate-limit: **>0 en 5 minutos** (cualquier ocurrencia es sospechosa, el webhook solo debería recibir tráfico de Wompi).
   - Umbral para `error processing event`: **>0 en 5 minutos** (todo fallo de pago real merece revisión).
   - Umbral para `DeepSeek request failed`: **>5 en 15 minutos** (tolera fallos transitorios puntuales, alerta si se sostiene).
4. Configurar canal de notificación (email o Slack vía webhook) en **Monitoring → Alerting → Notification channels**.
5. Si se configura `SENTRY_DSN` (ver `functions/.env.example`), Sentry ya tiene su propio sistema de alertas por proyecto — configurar ahí las reglas de "nueva excepción" y "spike de errores" como alternativa o complemento a los log-based alerts de GCP.

## Nota

Ninguno de estos pasos requiere cambios de código adicionales — todas las señales necesarias ya existen. Es configuración pura en GCP Console, por eso queda documentado en vez de ejecutado en esta sesión.
