import { describe, it, expect } from 'vitest';
import { canTransition, mapWompiStatus } from './orderState';
import { TransactionStatus } from './types';

describe('orderState.canTransition', () => {
  it('permite transiciones válidas de la ruta feliz de compra', () => {
    expect(canTransition(TransactionStatus.PENDING_PAYMENT, TransactionStatus.PAYMENT_CONFIRMED)).toBe(true);
    expect(canTransition(TransactionStatus.PAYMENT_CONFIRMED, TransactionStatus.PREPARING)).toBe(true);
    expect(canTransition(TransactionStatus.PREPARING, TransactionStatus.READY)).toBe(true);
    expect(canTransition(TransactionStatus.READY, TransactionStatus.IN_TRANSIT)).toBe(true);
    expect(canTransition(TransactionStatus.IN_TRANSIT, TransactionStatus.DELIVERED)).toBe(true);
  });

  it('rechaza transiciones inválidas', () => {
    expect(canTransition(TransactionStatus.CANCELLED, TransactionStatus.DELIVERED)).toBe(false);
    expect(canTransition(TransactionStatus.REFUNDED, TransactionStatus.PAYMENT_CONFIRMED)).toBe(false);
    expect(canTransition(TransactionStatus.PENDING_PAYMENT, TransactionStatus.DELIVERED)).toBe(false);
    expect(canTransition(TransactionStatus.DELIVERED, TransactionStatus.PENDING_PAYMENT)).toBe(false);
  });

  it('rechaza permanecer en el mismo estado', () => {
    expect(canTransition(TransactionStatus.PENDING_PAYMENT, TransactionStatus.PENDING_PAYMENT)).toBe(false);
  });

  it('CANCELLED y REFUNDED son estados terminales', () => {
    expect(canTransition(TransactionStatus.CANCELLED, TransactionStatus.CANCELLED)).toBe(false);
    expect(canTransition(TransactionStatus.CANCELLED, TransactionStatus.REFUNDED)).toBe(false);
    expect(canTransition(TransactionStatus.REFUNDED, TransactionStatus.CANCELLED)).toBe(false);
  });

  it('permite disputar y luego reembolsar o cancelar', () => {
    expect(canTransition(TransactionStatus.DELIVERED, TransactionStatus.DISPUTED)).toBe(true);
    expect(canTransition(TransactionStatus.DISPUTED, TransactionStatus.REFUNDED)).toBe(true);
    expect(canTransition(TransactionStatus.DISPUTED, TransactionStatus.CANCELLED)).toBe(true);
  });

  it('ruta de booking: CONFIRMED -> ATTENDED/NO_SHOW', () => {
    expect(canTransition(TransactionStatus.CONFIRMED, TransactionStatus.ATTENDED)).toBe(true);
    expect(canTransition(TransactionStatus.CONFIRMED, TransactionStatus.NO_SHOW)).toBe(true);
    expect(canTransition(TransactionStatus.ATTENDED, TransactionStatus.PREPARING)).toBe(false);
  });
});

describe('mapWompiStatus', () => {
  it('APPROVED mapea a PAYMENT_CONFIRMED', () => {
    expect(mapWompiStatus('APPROVED')).toBe(TransactionStatus.PAYMENT_CONFIRMED);
  });

  it('DECLINED, VOIDED y ERROR mapean a CANCELLED', () => {
    expect(mapWompiStatus('DECLINED')).toBe(TransactionStatus.CANCELLED);
    expect(mapWompiStatus('VOIDED')).toBe(TransactionStatus.CANCELLED);
    expect(mapWompiStatus('ERROR')).toBe(TransactionStatus.CANCELLED);
  });

  it('PENDING u otro estado transitorio no produce transición', () => {
    expect(mapWompiStatus('PENDING')).toBeNull();
    expect(mapWompiStatus('SOMETHING_UNKNOWN')).toBeNull();
  });
});
