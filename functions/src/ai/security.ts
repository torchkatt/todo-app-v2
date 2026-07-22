import * as admin from 'firebase-admin';
import { checkRateLimit } from '../lib/rateLimit';
import { audit } from '../lib/audit';

// Autoridad server-side de la seguridad del chat IA. La copia en
// src/services/aiChatSecurity.ts es solo feedback inmediato en el cliente (UX);
// este módulo es la fuente de verdad — se ejecuta en cada llamada al proxy.

export const INPUT_LIMITS = {
  MAX_MESSAGE_LENGTH: 500,
} as const;

// Patrones acotados a inyección de prompt y manipulación financiera/de datos real.
// Se retiraron patrones que generaban falsos positivos en consultas legítimas
// (p.ej. "¿tienen productos de seguridad?", "¿hay algún problema con mi pedido?").
const JAILBREAK_PATTERNS = [
  /ignore\s+(all\s+)?(previous|above|prior)/i,
  /forget\s+(all\s+)?(previous|instructions|rules)/i,
  /system\s+(prompt|instruction|message)/i,
  /you\s+are\s+(now|free|liberated)/i,
  /\bDAN\b|JAILBREAK|BYPASS/i,
  /sudo|admin\s+mode|developer\s+mode/i,
  /bypass\s+(security|safety|payment|checkout|verification)/i,
  /delete\s+(all\s+)?data|drop\s+database|truncate/i,
  /execute\s+(command|sql|query|code)/i,
  /steal\s+(data|info|credentials|password)/i,
  /access\s+(other\s+)?users?\s+(data|account)/i,
  /fake\s+(transaction|order|payment|review)/i,
  /modify\s+(price|amount|balance|stock)/i,
];

const STRIKE_THRESHOLD = 3;
const STRIKE_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 días

export function sanitizeInput(text: string): string {
  return text
    .replace(/<[^>]*>/g, '')
    .replace(/[<>]/g, '')
    .slice(0, INPUT_LIMITS.MAX_MESSAGE_LENGTH);
}

export function detectInjection(text: string): { detected: boolean; pattern?: string } {
  for (const pattern of JAILBREAK_PATTERNS) {
    if (pattern.test(text)) return { detected: true, pattern: pattern.source.slice(0, 50) };
  }
  return { detected: false };
}

async function recordStrike(userId: string, pattern: string): Promise<{ blocked: boolean; strikeCount: number; message: string }> {
  const db = admin.firestore();
  const ref = db.collection('ai_strikes').doc(userId);
  const now = Date.now();

  const strikeCount = await db.runTransaction(async (t) => {
    const snap = await t.get(ref);
    const strikes: Array<{ pattern: string; time: number }> = snap.exists ? snap.data()!.strikes ?? [] : [];
    const fresh = strikes.filter((s) => now - s.time < STRIKE_TTL_MS);
    fresh.push({ pattern: pattern.slice(0, 100), time: now });
    t.set(ref, { strikes: fresh, count: fresh.length, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
    return fresh.length;
  });

  await audit('ai_chat_strike', { pattern: pattern.slice(0, 100), strikeCount }, { performedBy: userId, targetType: 'user', targetId: userId });

  if (strikeCount >= STRIKE_THRESHOLD) {
    await db.collection('users').doc(userId).update({ isActive: false, bannedAt: new Date().toISOString() });
    return {
      blocked: true,
      strikeCount,
      message: `Tu cuenta ha sido bloqueada por actividad sospechosa (${strikeCount} infracciones). Contacta a soporte.`,
    };
  }

  return {
    blocked: false,
    strikeCount,
    message: `Advertencia (${strikeCount}/${STRIKE_THRESHOLD}): comportamiento no permitido detectado.`,
  };
}

export interface SecurityResult {
  allowed: boolean;
  blocked: boolean;
  sanitizedInput: string;
  error?: string;
}

export async function checkMessage(userId: string, text: string): Promise<SecurityResult> {
  const sanitized = sanitizeInput(text);

  const injection = detectInjection(sanitized);
  if (injection.detected) {
    const strike = await recordStrike(userId, injection.pattern || 'unknown');
    return { allowed: false, blocked: strike.blocked, sanitizedInput: '', error: strike.message };
  }

  if (!(await checkRateLimit(userId, 'ai_chat'))) {
    return { allowed: false, blocked: false, sanitizedInput: '', error: 'Demasiadas solicitudes. Espera un momento.' };
  }

  return { allowed: true, blocked: false, sanitizedInput: sanitized };
}
