import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { TODO_TOOLS, executeToolCall, setNavigateHook } from '../../services/aiChatTools';
import { chatWithDeepSeek } from '../../services/deepseekService';
import { MessageSquare, Send, Loader2, X, Sparkles, ChevronDown } from 'lucide-react';

const WELCOME = `¡Hola! Soy el asistente de **Todo**. Puedo ayudarte a:

🔍 Buscar productos y servicios
🏪 Encontrar vendedores y tiendas
📦 Consultar tus pedidos
📊 Ver tus estadísticas
💡 Responder preguntas sobre Todo

¿Qué estás buscando hoy?`;

export const AIChatButton: React.FC = () => {
  const [open, setOpen] = useState(false);
  const { isAuthenticated, user } = useAuth();

  // Don't show for unauthenticated or guests
  if (!isAuthenticated || user?.isGuest) return null;

  return (
    <>
      {/* FAB */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 text-white shadow-xl shadow-purple-500/30 hover:shadow-purple-500/50 hover:scale-105 transition-all active:scale-95 flex items-center justify-center"
      >
        {open ? <X size={24} /> : <MessageSquare size={24} />}
      </button>
      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-[380px] max-w-[calc(100vw-24px)] h-[560px] max-h-[calc(100vh-160px)] bg-white rounded-2xl border border-border shadow-2xl flex flex-col overflow-hidden animate-fade-up">
          <AIChat onClose={() => setOpen(false)} />
        </div>
      )}
    </>
  );
};

const AIChat: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([{ role: 'assistant', content: WELCOME }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setNavigateHook((path) => { navigate(path); onClose(); });
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, navigate, onClose]);

  const handleSend = async () => {
    if (!input.trim() || loading || !user) return;
    const text = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setLoading(true);

    try {
      // Build conversation history for DeepSeek
      const history = messages.slice(-12).map(m => ({ role: m.role as any, content: m.content }));
      history.push({ role: 'user', content: text });

      const response = await chatWithDeepSeek(history, user.id);
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Ocurrió un error. Por favor intenta de nuevo.' }]);
    }
    setLoading(false);
  };

  return (
    <>
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-4 text-white shrink-0">
        <div className="flex items-center gap-2">
          <Sparkles size={18} />
          <h3 className="text-sm font-extrabold flex-1">Asistente Todo</h3>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-lg transition-colors"><X size={16} /></button>
        </div>
        <p className="text-[10px] text-purple-100 mt-0.5">Marketplace inteligente</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl p-3 text-sm leading-relaxed ${
              msg.role === 'user'
                ? 'bg-purple-600 text-white rounded-br-md'
                : 'bg-white border border-border shadow-sm rounded-bl-md'
            }`}>
              <div className="whitespace-pre-wrap" style={{ whiteSpace: 'pre-wrap' }}>
                {msg.content.split('\n').map((line, j) => {
                  if (line.startsWith('•')) return <div key={j} className="flex gap-1.5"><span className="shrink-0">•</span><span>{line.slice(1).trim()}</span></div>;
                  if (line.startsWith('🔍') || line.startsWith('🏪') || line.startsWith('📦') || line.startsWith('📊') || line.startsWith('💡') || line.startsWith('⭐') || line.startsWith('💰') || line.startsWith('🛒') || line.startsWith('💵') || line.startsWith('🔥')) return <div key={j}>{line}</div>;
                  if (line.trim().startsWith('**') && line.trim().endsWith('**')) return <div key={j} className="font-extrabold mt-2 mb-1">{line.replace(/\*\*/g, '')}</div>;
                  return <div key={j}>{line}</div>;
                })}
              </div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-border rounded-2xl rounded-bl-md p-3">
              <Loader2 size={16} className="animate-spin text-purple-600" />
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-border bg-white shrink-0">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="Ej: busca macbook..."
            disabled={loading}
            className="flex-1 px-4 py-2.5 bg-gray-100 border border-transparent rounded-xl text-sm outline-none focus:border-purple-400 focus:bg-white transition-all disabled:opacity-50"
          />
          <button onClick={handleSend} disabled={loading || !input.trim()}
            className="p-2.5 rounded-xl bg-purple-600 text-white hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed active:scale-95">
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          </button>
        </div>
      </div>
    </>
  );
};
