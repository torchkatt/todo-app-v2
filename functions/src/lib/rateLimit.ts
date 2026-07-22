import * as admin from 'firebase-admin';

const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minuto
const RATE_LIMIT_MAX_REQUESTS = 30; // por IP por ventana

/** Fail-open solo ante error transitorio de DB — nunca fail-open en dinero. */
export async function checkRateLimit(ip: string, bucket: string): Promise<boolean> {
  const db = admin.firestore();
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW_MS;
  const ref = db.collection('rate_limits').doc(`${bucket}_${ip}`);
  try {
    return await db.runTransaction(async (t) => {
      const snap = await t.get(ref);
      if (!snap.exists) {
        t.set(ref, { count: 1, windowStart: now });
        return true;
      }
      const data = snap.data()!;
      if (data.windowStart < windowStart) {
        t.set(ref, { count: 1, windowStart: now });
        return true;
      }
      if (data.count >= RATE_LIMIT_MAX_REQUESTS) return false;
      t.update(ref, { count: admin.firestore.FieldValue.increment(1) });
      return true;
    });
  } catch {
    return true; // fail open solo por error de DB, no por lógica de negocio
  }
}
