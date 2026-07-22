import * as admin from 'firebase-admin';
import { UserRole } from '../domain/types';

export type AIChatPlanTier = 'free' | 'pass_monthly' | 'pass_annual' | 'admin' | 'guest';

const DAILY_LIMITS: Record<AIChatPlanTier, number> = {
  guest: 5,
  free: 20,
  pass_monthly: 100,
  pass_annual: Infinity,
  admin: Infinity,
};

function todayString(): string {
  return new Date().toISOString().slice(0, 10);
}

// NOTA: 'pass_monthly'/'pass_annual' existen en el modelo de planes pero hoy no hay
// campo en User que los active (solo Seller.subscription, que es otro concepto: el
// plan del vendedor, no del comprador en el chat). Se resuelven aquí como 'free' hasta
// que exista una entitlement real de usuario para el chat IA.
export function resolveTier(user: { role: UserRole; isGuest: boolean }): AIChatPlanTier {
  if (user.role === UserRole.SUPER_ADMIN || user.role === UserRole.ADMIN) return 'admin';
  if (user.isGuest) return 'guest';
  return 'free';
}

/** Verifica la cuota diaria e incrementa atómicamente en la misma operación (evita doble gasto). */
export async function checkAndIncrementUsage(
  userId: string,
  tier: AIChatPlanTier
): Promise<{ allowed: boolean; remaining: number; used: number; limit: number }> {
  const limit = DAILY_LIMITS[tier];
  const db = admin.firestore();
  const ref = db.collection('ai_usage').doc(userId);
  const today = todayString();

  return db.runTransaction(async (t) => {
    const snap = await t.get(ref);
    const data = snap.exists ? snap.data()! : null;
    const sameDay = data?.lastMessageDate === today;
    const usedToday = sameDay ? data!.messagesToday ?? 0 : 0;

    if (limit !== Infinity && usedToday >= limit) {
      return { allowed: false, remaining: 0, used: usedToday, limit };
    }

    t.set(
      ref,
      {
        userId,
        tier,
        messagesToday: usedToday + 1,
        lastMessageDate: today,
        totalMessages: admin.firestore.FieldValue.increment(1),
      },
      { merge: true }
    );

    const remaining = limit === Infinity ? Infinity : limit - (usedToday + 1);
    return { allowed: true, remaining, used: usedToday + 1, limit };
  });
}
