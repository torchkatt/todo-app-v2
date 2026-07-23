import { httpsCallable } from 'firebase/functions';
import { functions } from './firebase';
import { executeToolCall } from './aiChatTools';
import { logger } from '../utils/logger';

// La clave de DeepSeek y toda la seguridad/cuota viven en el backend (functions/src/ai/aiProxy.ts).
// Este servicio solo orquesta el loop de tool-calls: los ejecuta con la sesión del usuario
// (gobernados por las reglas de Firestore) y reenvía los resultados al proxy.

interface Message {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  tool_call_id?: string;
  tool_calls?: any[];
}

interface AiChatResponse {
  content: string;
  toolCalls: any[] | null;
  blocked?: boolean;
  quotaExceeded?: boolean;
}

const aiChatCallable = httpsCallable<{ messages: Message[]; continuation?: boolean }, AiChatResponse>(functions, 'aiChat');

// Tope de rondas de tool-calls encadenadas (ej. "¿qué pedidos tengo? → márcalos como listos"),
// mismo orden de magnitud que MAX_CONCURRENT_TOOLS en aiChatSecurity.ts.
const MAX_TOOL_ROUNDS = 4;

export async function chatWithAI(messages: Message[], userId?: string, userRole?: string): Promise<string> {
  if (!userId) return 'Inicia sesión para usar el asistente.';

  try {
    let convo: Message[] = [...messages];
    let content = '';
    let continuation = false;

    for (let round = 0; round <= MAX_TOOL_ROUNDS; round++) {
      const res = await aiChatCallable({ messages: convo, continuation });
      content = res.data.content;
      const toolCalls = res.data.toolCalls;
      if (!toolCalls?.length || round === MAX_TOOL_ROUNDS) break;

      convo = [...convo, { role: 'assistant', content: content || '', tool_calls: toolCalls }];
      for (const toolCall of toolCalls) {
        const fn = toolCall.function;
        let args: any = {};
        try { args = JSON.parse(fn.arguments); } catch (e) { logger.error('[AI] arg parse error:', e); }
        const toolResult = await executeToolCall(fn.name, args, userId, userRole);
        convo.push({ role: 'tool', content: toolResult, tool_call_id: toolCall.id });
      }
      continuation = true;
    }

    return content || '👍 Listo. ¿Necesitas algo más?';
  } catch (e) {
    logger.error('aiChat callable error', e);
    return '⚠️ Error de conexión. Verifica tu conexión a internet.';
  }
}
