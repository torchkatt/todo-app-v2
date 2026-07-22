import { describe, it, expect } from 'vitest';
import * as crypto from 'crypto';
import { integritySignature, verifyEventChecksum } from './wompiSignature';

describe('integritySignature', () => {
  it('calcula SHA256(reference + amountInCents + currency + secret)', () => {
    const reference = 'TODO-seller1-abc123';
    const amountInCents = 5000000;
    const currency = 'COP';
    const secret = 'test-integrity-secret';
    const expected = crypto
      .createHash('sha256')
      .update(`${reference}${amountInCents}${currency}${secret}`)
      .digest('hex');
    expect(integritySignature(reference, amountInCents, currency, secret)).toBe(expected);
  });

  it('es determinista: mismos inputs producen la misma firma', () => {
    const a = integritySignature('REF-1', 1000, 'COP', 'secret');
    const b = integritySignature('REF-1', 1000, 'COP', 'secret');
    expect(a).toBe(b);
  });

  it('cambia si cambia el monto (evita reutilizar firma para otro monto)', () => {
    const a = integritySignature('REF-1', 1000, 'COP', 'secret');
    const b = integritySignature('REF-1', 2000, 'COP', 'secret');
    expect(a).not.toBe(b);
  });
});

function buildEvent(overrides: Partial<{
  amountInCents: number;
  txId: string;
  status: string;
  timestamp: number;
  secret: string;
}> = {}) {
  const amountInCents = overrides.amountInCents ?? 5000000;
  const txId = overrides.txId ?? 'wompi-tx-1';
  const status = overrides.status ?? 'APPROVED';
  const timestamp = overrides.timestamp ?? 1700000000;
  const secret = overrides.secret ?? 'events-secret';

  const data = { transaction: { id: txId, status, amount_in_cents: amountInCents } };
  const properties = ['transaction.id', 'transaction.status', 'transaction.amount_in_cents'];
  const concatenated = properties.map((p) => String(p.split('.').reduce<any>((o, k) => o?.[k], data))).join('');
  const checksum = crypto.createHash('sha256').update(`${concatenated}${timestamp}${secret}`).digest('hex');

  return { event: 'transaction.updated', data, timestamp, signature: { properties, checksum } };
}

describe('verifyEventChecksum', () => {
  it('acepta un checksum válido', () => {
    const secret = 'events-secret';
    const event = buildEvent({ secret });
    expect(verifyEventChecksum(event as any, secret)).toBe(true);
  });

  it('rechaza un checksum inválido', () => {
    const event = buildEvent({ secret: 'events-secret' });
    event.signature.checksum = 'a'.repeat(64);
    expect(verifyEventChecksum(event as any, 'events-secret')).toBe(false);
  });

  it('rechaza si se usa el secreto equivocado', () => {
    const event = buildEvent({ secret: 'events-secret' });
    expect(verifyEventChecksum(event as any, 'wrong-secret')).toBe(false);
  });

  it('rechaza si el payload fue alterado (monto distinto al firmado)', () => {
    const event = buildEvent({ secret: 'events-secret', amountInCents: 5000000 });
    event.data.transaction.amount_in_cents = 1; // tampering
    expect(verifyEventChecksum(event as any, 'events-secret')).toBe(false);
  });

  it('rechaza payload sin properties o checksum', () => {
    expect(verifyEventChecksum({ data: {}, timestamp: 1 } as any, 'secret')).toBe(false);
    expect(verifyEventChecksum({ data: {}, timestamp: 1, signature: { properties: [], checksum: '' } } as any, 'secret')).toBe(false);
  });
});
