import * as crypto from 'crypto';

/**
 * Firma de integridad para el Widget/Web Checkout de Wompi.
 * integrity = SHA256(reference + amountInCents + currency + integritySecret)
 * Se calcula en backend para NO exponer el secreto de integridad al cliente.
 */
export function integritySignature(
  reference: string,
  amountInCents: number,
  currency: string,
  secret: string
): string {
  const payload = `${reference}${amountInCents}${currency}${secret}`;
  return crypto.createHash('sha256').update(payload).digest('hex');
}

interface WompiEvent {
  event: string;
  data: Record<string, any>;
  sent_at?: string;
  timestamp: number;
  signature: { properties: string[]; checksum: string };
}

/**
 * Verificación del webhook de "Eventos" de Wompi.
 * checksum = SHA256( concat(valores de signature.properties, en el orden dado) + timestamp + eventsSecret )
 * Los valores se leen del payload por path (p.ej. "transaction.id", "transaction.status",
 * "transaction.amount_in_cents") relativo a `event.data`.
 *
 * NOTA: verificar este algoritmo contra la doc oficial de Wompi con un vector de ejemplo real
 * antes de activar la key de producción (ver docs/PLAN-PRODUCCION.md Fase 9).
 */
export function verifyEventChecksum(event: WompiEvent, eventsSecret: string): boolean {
  const props = event?.signature?.properties ?? [];
  const provided = event?.signature?.checksum ?? '';
  if (!props.length || !provided || !event.timestamp) return false;

  const concatenated = props
    .map((path) => path.split('.').reduce<any>((o, k) => o?.[k], event.data))
    .map((v) => (v === undefined || v === null ? '' : String(v)))
    .join('');
  const toSign = `${concatenated}${event.timestamp}${eventsSecret}`;
  const expected = crypto.createHash('sha256').update(toSign).digest('hex');

  const a = Buffer.from(expected, 'hex');
  const b = Buffer.from(provided, 'hex');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
