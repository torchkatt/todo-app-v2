import axios from 'axios';
import * as admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions/v2';
import { DEEPSEEK_API_KEY, DEEPSEEK_MODEL, SENTRY_DSN, deepseekConfigured } from '../config';
import { checkMessage } from './security';
import { checkAndIncrementUsage, resolveTier } from './usage';
import { TODO_TOOLS } from './tools';
import { captureError } from '../lib/sentry';

const API_URL = 'https://api.deepseek.com/chat/completions';
const MAX_TOKENS = 1000;

const SYSTEM_PROMPT = `Eres el asistente IA de **Todo** — un marketplace general de Colombia donde se puede comprar productos, contratar servicios, descargar contenido digital y más.

**Tus capacidades:**
- Buscar productos y servicios usando la función searchListings
- Encontrar vendedores con searchSellers
- Consultar categorías con getCategories
- Ver detalles de productos/servicios con getListingDetail
- Ver detalles de vendedores con getSellerDetail
- Consultar pedidos del usuario con getUserTransactions
- Ver estadísticas con getUserStats
- Responder preguntas generales sobre Todo con getTodoInfo
- Navegar a secciones con navigateTo

**Reglas:**
1. Siempre responde en español colombiano
2. Sé amable, profesional y directo
3. Usa las funciones cuando el usuario busque algo específico
4. Si no sabes algo, sé honesto
5. NO inventes información sobre productos o precios
6. Recomienda usar los filtros de categoría cuando sea relevante
7. Los precios están en pesos colombianos (COP)`;

interface ProxyMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  tool_call_id?: string;
  tool_calls?: any[];
}

interface AiChatRequest {
  messages: ProxyMessage[];
  continuation?: boolean;
}

export const aiChat = onCall({ cors: true, secrets: [DEEPSEEK_API_KEY, SENTRY_DSN] }, async (request) => {
  const auth = request.auth;
  if (!auth) throw new HttpsError('unauthenticated', 'Debes iniciar sesión.');

  const data = request.data as AiChatRequest;
  if (!Array.isArray(data?.messages) || data.messages.length === 0) {
    throw new HttpsError('invalid-argument', 'Faltan mensajes.');
  }

  if (!deepseekConfigured()) {
    return { content: '⚠️ El asistente de IA no está configurado por el momento.', toolCalls: null };
  }

  const messages = [...data.messages];

  if (!data.continuation) {
    const userDoc = await admin.firestore().collection('users').doc(auth.uid).get();
    if (!userDoc.exists) throw new HttpsError('not-found', 'Usuario no encontrado.');
    const user = userDoc.data()!;

    const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user');
    if (lastUserMsg) {
      const secCheck = await checkMessage(auth.uid, lastUserMsg.content);
      if (!secCheck.allowed) {
        return { content: secCheck.error || 'Mensaje bloqueado por seguridad.', toolCalls: null, blocked: secCheck.blocked };
      }
      lastUserMsg.content = secCheck.sanitizedInput;
    }

    const tier = resolveTier({ role: user.role, isGuest: !!user.isGuest });
    const usage = await checkAndIncrementUsage(auth.uid, tier);
    if (!usage.allowed) {
      return {
        content: `Has alcanzado el límite de ${usage.used} mensajes de hoy.`,
        toolCalls: null,
        quotaExceeded: true,
      };
    }
  }

  const fullMessages: ProxyMessage[] = [{ role: 'system', content: SYSTEM_PROMPT }, ...messages];

  try {
    const response = await axios.post(
      API_URL,
      {
        model: DEEPSEEK_MODEL.value() || 'deepseek-v4-flash',
        messages: fullMessages,
        tools: TODO_TOOLS,
        tool_choice: 'auto',
        max_tokens: MAX_TOKENS,
      },
      { headers: { Authorization: `Bearer ${DEEPSEEK_API_KEY.value()}` }, timeout: 20_000 }
    );

    const choice = response.data?.choices?.[0];
    if (!choice) return { content: '⚠️ No se recibió respuesta del asistente.', toolCalls: null };

    const msg = choice.message;
    if (msg.tool_calls?.length) {
      return { content: msg.content || '', toolCalls: msg.tool_calls };
    }
    return { content: msg.content || '👍 Listo. ¿Necesitas algo más?', toolCalls: null };
  } catch (e) {
    logger.error('aiChat: DeepSeek request failed', e);
    captureError(e, { uid: auth.uid });
    return { content: '⚠️ Error al conectar con el asistente. Intenta de nuevo.', toolCalls: null };
  }
});
