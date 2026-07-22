import { TransactionStatus } from './types';

// Estados válidos y transiciones permitidas. Fuente única de verdad
// (espejo de solo lectura en src/utils/orderState.ts para la UI).
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

// Estados en los que aún no se ha confirmado el pago; cancelar restituye stock.
export const STOCK_RESTITUTION_STATUSES: TransactionStatus[] = [TransactionStatus.CANCELLED];

export function canTransition(from: TransactionStatus, to: TransactionStatus): boolean {
  if (from === to) return false;
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}

export function mapWompiStatus(wompiStatus: string): TransactionStatus | null {
  switch (wompiStatus) {
    case 'APPROVED':
      return TransactionStatus.PAYMENT_CONFIRMED;
    case 'DECLINED':
    case 'VOIDED':
    case 'ERROR':
      return TransactionStatus.CANCELLED;
    default:
      return null; // PENDING u otro estado transitorio de Wompi: no aplicar transición
  }
}
