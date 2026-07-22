import * as admin from 'firebase-admin';
import type { Transaction } from 'firebase-admin/firestore';

/** Escribe un registro append-only en audit_logs. Nunca lanza — un fallo de auditoría no debe tumbar la operación principal. */
export async function audit(
  action: string,
  details: Record<string, unknown>,
  opts: { performedBy?: string; targetType?: string; targetId?: string } = {}
): Promise<void> {
  try {
    await admin.firestore().collection('audit_logs').add({
      action,
      performedBy: opts.performedBy ?? 'system',
      targetType: opts.targetType,
      targetId: opts.targetId,
      details,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  } catch (e) {
    console.error('audit: failed to write audit log', action, e);
  }
}

/** Variante para usar dentro de una transacción Firestore ya abierta (misma atomicidad que la mutación). */
export function auditInTransaction(
  t: Transaction,
  action: string,
  details: Record<string, unknown>,
  opts: { performedBy?: string; targetType?: string; targetId?: string } = {}
): void {
  const ref = admin.firestore().collection('audit_logs').doc();
  t.set(ref, {
    action,
    performedBy: opts.performedBy ?? 'system',
    targetType: opts.targetType,
    targetId: opts.targetId,
    details,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}
