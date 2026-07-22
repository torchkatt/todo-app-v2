import { logger } from '../utils/logger';
import { doc, updateDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import { UserRole } from '../types';

// NOTA: esta es la copia client-side, usada solo como feedback inmediato en la UI
// (evita un roundtrip innecesario para casos obvios). La autoridad real es
// functions/src/ai/security.ts, que corre en cada llamada al proxy de IA — el backend
// nunca confía en este chequeo.

// ─── L1: Input Validation ───

export const INPUT_LIMITS = {
  MAX_MESSAGE_LENGTH: 500,
  MAX_PROFILE_FIELD: 100,
  MAX_SEARCH_QUERY: 100,
  MAX_CONCURRENT_TOOLS: 5,
} as const;

// Acotado a inyección de prompt y manipulación financiera/de datos real. Se retiraron
// patrones que bloqueaban consultas legítimas (p.ej. "¿tienen productos de seguridad?",
// "¿hay algún problema con mi pedido?"): /malicious|hack|exploit|vulnerability/i y /override/i.
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

// ─── L2: Role Enforcement ───

const DESTRUCTIVE_TOOLS = new Set([
  'cancelOrder', 'deleteListing', 'blockUser', 'refundTransaction',
  'updateListing', 'deactivateListing', 'manageCart',
]);

export function canExecuteTool(toolName: string, userRole?: string): boolean {
  // Authenticated users can use most tools
  if (!userRole) return false;

  // SUPER_ADMIN can do everything
  if (userRole === UserRole.SUPER_ADMIN) return true;

  // Destructive tools require SUPER_ADMIN
  if (DESTRUCTIVE_TOOLS.has(toolName) && userRole !== UserRole.SUPER_ADMIN) {
    return false;
  }

  return true;
}

// ─── L3: Rate Limiting ───

const RATE_LIMITS = new Map<string, { count: number; resetAt: number }>();
const RATE_WINDOW_MS = 60000; // 1 minute
const MAX_TOOL_CALLS_PER_WINDOW = 20;

export function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = RATE_LIMITS.get(userId);
  if (!entry || now > entry.resetAt) {
    RATE_LIMITS.set(userId, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  if (entry.count >= MAX_TOOL_CALLS_PER_WINDOW) return false;
  entry.count++;
  return true;
}

// ─── L4: Destructive Action Guard ───

export function requiresConfirmation(toolName: string, args: any): string | null {
  if (!DESTRUCTIVE_TOOLS.has(toolName)) return null;

  switch (toolName) {
    case 'cancelOrder':
      return `¿Estás seguro de cancelar la orden ${args.orderId || ''}?`;
    case 'deleteListing':
      return `¿Estás seguro de eliminar el listado ${args.listingId || ''}?`;
    case 'refundTransaction':
      return `¿Estás seguro de reembolsar $${args.amount || 0} de la transacción ${args.transactionId || ''}?`;
    default:
      return 'Esta acción no se puede deshacer. ¿Confirmas?';
  }
}

// ─── L5: Prompt Injection Detection ───

export function detectInjection(text: string): { detected: boolean; pattern?: string } {
  for (const pattern of JAILBREAK_PATTERNS) {
    if (pattern.test(text)) {
      return { detected: true, pattern: pattern.source.slice(0, 50) };
    }
  }
  return { detected: false };
}

export function sanitizeInput(text: string): string {
  return text
    .replace(/<[^>]*>/g, '')
    .replace(/[<>]/g, '')
    .slice(0, INPUT_LIMITS.MAX_MESSAGE_LENGTH);
}

// ─── Strike System ───

const STRIKE_THRESHOLD = 3;
const STRIKE_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const strikes = new Map<string, { count: number; strikes: Array<{ pattern: string; time: number }> }>();

export async function recordStrike(userId: string, pattern: string): Promise<{
  blocked: boolean;
  strikeCount: number;
  message: string;
}> {
  const now = Date.now();
  let record = strikes.get(userId);

  if (!record) {
    record = { count: 0, strikes: [] };
    strikes.set(userId, record);
  }

  // Clean expired strikes
  record.strikes = record.strikes.filter(s => now - s.time < STRIKE_TTL_MS);
  record.strikes.push({ pattern, time: now });
  record.count = record.strikes.length;

  // Log to Firestore audit
  try {
    await addDoc(collection(db, 'audit_logs'), {
      action: 'ai_chat_strike',
      performedBy: userId,
      details: { pattern: pattern.slice(0, 100), strikeCount: record.count },
      createdAt: serverTimestamp(),
    });
  } catch (e) { logger.error('Failed to log strike', e); }

  if (record.count >= STRIKE_THRESHOLD) {
    // Block user
    try {
      await updateDoc(doc(db, 'users', userId), { isActive: false, bannedAt: new Date().toISOString() });
    } catch (e) { logger.error('Failed to block user', e); }

    return {
      blocked: true,
      strikeCount: record.count,
      message: `Tu cuenta ha sido bloqueada por actividad sospechosa (${record.count} infracciones). Contacta a soporte.`,
    };
  }

  return {
    blocked: false,
    strikeCount: record.count,
    message: `Advertencia (${record.count}/${STRIKE_THRESHOLD}): comportamiento no permitido detectado.`,
  };
}

// ─── Full security check pipeline ───

export interface SecurityResult {
  allowed: boolean;
  blocked: boolean;
  sanitizedInput: string;
  error?: string;
}

export async function checkMessage(userId: string, text: string, userRole?: string): Promise<SecurityResult> {
  // L1: Sanitize
  const sanitized = sanitizeInput(text);

  // L5: Injection detection
  const injection = detectInjection(sanitized);
  if (injection.detected) {
    const strike = await recordStrike(userId, injection.pattern || 'unknown');
    if (strike.blocked) {
      return { allowed: false, blocked: true, sanitizedInput: '', error: strike.message };
    }
    return { allowed: false, blocked: false, sanitizedInput: '', error: strike.message };
  }

  // L3: Rate limit
  if (!checkRateLimit(userId)) {
    return { allowed: false, blocked: false, sanitizedInput: '', error: 'Demasiadas solicitudes. Espera un momento.' };
  }

  return { allowed: true, blocked: false, sanitizedInput: sanitized };
}

export async function checkToolAction(
  userId: string,
  toolName: string,
  args: any,
  userRole?: string
): Promise<SecurityResult> {
  // L2: Role enforcement
  if (!canExecuteTool(toolName, userRole)) {
    return { allowed: false, blocked: false, sanitizedInput: '', error: 'No tienes permisos para esta acción.' };
  }

  // L4: Confirmation for destructive actions
  const confirmation = requiresConfirmation(toolName, args);
  if (confirmation) {
    return { allowed: true, blocked: false, sanitizedInput: '', error: confirmation };
  }

  return { allowed: true, blocked: false, sanitizedInput: '' };
}
