import { TransactionStatus } from '../types';

// Espejo de solo lectura de functions/src/domain/orderState.ts — usar solo para
// reflejar estados válidos en la UI (timeline, badges). La autoridad es el backend.
export const ALLOWED_TRANSITIONS: Record<TransactionStatus, TransactionStatus[]> = {
  [TransactionStatus.PENDING_PAYMENT]: [TransactionStatus.PAYMENT_CONFIRMED, TransactionStatus.CANCELLED],
  [TransactionStatus.PAYMENT_CONFIRMED]: [
    TransactionStatus.PREPARING,
    TransactionStatus.CONFIRMED,
    TransactionStatus.CANCELLED,
    TransactionStatus.REFUNDED,
    TransactionStatus.DISPUTED,
  ],
  [TransactionStatus.PREPARING]: [TransactionStatus.READY, TransactionStatus.CANCELLED, TransactionStatus.DISPUTED],
  [TransactionStatus.READY]: [
    TransactionStatus.IN_TRANSIT,
    TransactionStatus.DELIVERED,
    TransactionStatus.CANCELLED,
    TransactionStatus.DISPUTED,
  ],
  [TransactionStatus.IN_TRANSIT]: [TransactionStatus.DELIVERED, TransactionStatus.DISPUTED],
  [TransactionStatus.DELIVERED]: [TransactionStatus.DISPUTED, TransactionStatus.REFUNDED],
  [TransactionStatus.CONFIRMED]: [
    TransactionStatus.ATTENDED,
    TransactionStatus.NO_SHOW,
    TransactionStatus.CANCELLED,
    TransactionStatus.DISPUTED,
  ],
  [TransactionStatus.ATTENDED]: [TransactionStatus.DISPUTED, TransactionStatus.REFUNDED],
  [TransactionStatus.NO_SHOW]: [TransactionStatus.DISPUTED],
  [TransactionStatus.CANCELLED]: [],
  [TransactionStatus.DISPUTED]: [TransactionStatus.REFUNDED, TransactionStatus.CANCELLED],
  [TransactionStatus.REFUNDED]: [],
};

export function canTransition(from: TransactionStatus, to: TransactionStatus): boolean {
  if (from === to) return false;
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}

// Timeline de estados "felices" para la ruta de compra (PURCHASE, con envío).
export const PURCHASE_TIMELINE: TransactionStatus[] = [
  TransactionStatus.PENDING_PAYMENT,
  TransactionStatus.PAYMENT_CONFIRMED,
  TransactionStatus.PREPARING,
  TransactionStatus.READY,
  TransactionStatus.IN_TRANSIT,
  TransactionStatus.DELIVERED,
];
