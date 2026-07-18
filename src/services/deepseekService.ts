import { TODO_TOOLS, executeToolCall } from './aiChatTools';
import { checkMessage, sanitizeInput } from './aiChatSecurity';
import { logger } from '../utils/logger';

const API_KEY = import.meta.env.VITE_DEEPSEEK_API_KEY;
const API_URL = 'https://api.deepseek.com/chat/completions';

interface Message {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  tool_call_id?: string;
  tool_calls?: any[];
}

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

export async function chatWithDeepSeek(messages: Message[], userId?: string): Promise<string> {
  if (!API_KEY || API_KEY.startsWith('your')) {
    return '⚠️ La API de DeepSeek no está configurada. Agrega VITE_DEEPSEEK_API_KEY en .env';
  }

  // ─── Security check on the last user message ───
  const lastUserMsg = messages.filter(m => m.role === 'user').pop();
  if (lastUserMsg && userId) {
    const secCheck = await checkMessage(userId, lastUserMsg.content);
    if (!secCheck.allowed) {
      return secCheck.error || 'Mensaje bloqueado por seguridad.';
    }
    // Replace with sanitized version
    lastUserMsg.content = secCheck.sanitizedInput;
  }

  const systemMsg: Message = { role: 'system', content: SYSTEM_PROMPT };
  const fullMessages = [systemMsg, ...messages];

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${API_KEY}` },
      body: JSON.stringify({ model: 'deepseek-chat', messages: fullMessages, tools: TODO_TOOLS, tool_choice: 'auto', max_tokens: 1000 }),
    });

    if (!response.ok) {
      const err = await response.text();
      logger.error('DeepSeek API error', response.status, err);
      return `⚠️ Error al conectar con DeepSeek (${response.status}). Intenta de nuevo.`;
    }

    const data = await response.json();
    const choice = data.choices?.[0];
    if (!choice) return '⚠️ No se recibió respuesta del asistente.';

    const msg = choice.message;
    let result = msg.content || '';

    // Handle tool calls
    if (msg.tool_calls && msg.tool_calls.length > 0) {
      for (const toolCall of msg.tool_calls) {
        const fn = toolCall.function;
        let args: any = {};
        try { args = JSON.parse(fn.arguments); } catch {}
        const toolResult = await executeToolCall(fn.name, args, userId);

        fullMessages.push({ role: 'assistant', content: result, tool_calls: msg.tool_calls });
        fullMessages.push({ role: 'tool', content: toolResult, tool_call_id: toolCall.id });

        // Second call with tool results
        const second = await fetch(API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${API_KEY}` },
          body: JSON.stringify({ model: 'deepseek-chat', messages: fullMessages, max_tokens: 800 }),
        });
        if (second.ok) {
          const data2 = await second.json();
          result = data2.choices?.[0]?.message?.content || result;
        }
      }
    }

    return result || '👍 Listo. ¿Necesitas algo más?';
  } catch (e) {
    logger.error('DeepSeek fetch error', e);
    return '⚠️ Error de conexión. Verifica tu conexión a internet.';
  }
}
