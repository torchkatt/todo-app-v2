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

export async function chatWithAI(messages: Message[], userId?: string): Promise<string> {
  if (!userId) return 'Inicia sesión para usar el asistente.';

  try {
    const first = await aiChatCallable({ messages });
    let { content, toolCalls } = first.data;

    if (toolCalls?.length) {
      const withToolCalls: Message[] = [...messages, { role: 'assistant', content: content || '', tool_calls: toolCalls }];
      for (const toolCall of toolCalls) {
        const fn = toolCall.function;
        let args: any = {};
        try { args = JSON.parse(fn.arguments); } catch (e) { logger.error('[AI] arg parse error:', e); }
        const toolResult = await executeToolCall(fn.name, args, userId);
        withToolCalls.push({ role: 'tool', content: toolResult, tool_call_id: toolCall.id });
      }

      const second = await aiChatCallable({ messages: withToolCalls, continuation: true });
      content = second.data.content || content;
    }

    return content || '👍 Listo. ¿Necesitas algo más?';
  } catch (e) {
    logger.error('aiChat callable error', e);
    return '⚠️ Error de conexión. Verifica tu conexión a internet.';
  }
}
