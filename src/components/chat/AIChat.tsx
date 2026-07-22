import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { setNavigateHook } from '../../services/aiChatTools';
import { chatWithAI } from '../../services/aiChatService';
import { MessageSquare, Send, Loader2, X, Sparkles } from 'lucide-react';
import { AI_PROMPT_CHIPS } from '../../config/constants';

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
      {/* FAB — posicionado en bottom-20 en móvil para jamás tapar la barra inferior de navegación (BottomTabs) */}
      <button
        onClick={() => setOpen(!open)}
        aria-label="Abrir asistente de IA"
        className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-40 w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 text-white shadow-xl shadow-purple-500/30 hover:shadow-purple-500/50 hover:scale-105 transition-all active:scale-95 flex items-center justify-center cursor-pointer"
      >
        {open ? <X size={24} /> : <MessageSquare size={24} />}
      </button>
      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-36 right-3 sm:bottom-24 sm:right-6 z-50 w-[380px] max-w-[calc(100vw-24px)] h-[520px] max-h-[calc(100vh-160px)] bg-white rounded-2xl border border-border shadow-2xl flex flex-col overflow-hidden animate-fade-up">
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
    const newMsgs = [...messages, { role: 'user', content: text }];
    setMessages(newMsgs);
    setLoading(true);

    try {
      const reply = await chatWithAI(
        newMsgs.map(m => ({ role: m.role as any, content: m.content })),
        user.id
      );
      setMessages([...newMsgs, { role: 'assistant', content: reply }]);
    } catch {
      setMessages([...newMsgs, { role: 'assistant', content: '⚠️ Ocurrió un error. Intenta nuevamente.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleChip = (prompt: string) => {
    setInput(prompt);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <Sparkles size={18} />
          </div>
          <div>
            <h3 className="font-extrabold text-sm leading-none">Asistente Todo</h3>
            <span className="text-[10px] text-purple-200 font-medium">Marketplace Inteligente</span>
          </div>
        </div>
        <button onClick={onClose} className="p-1.5 hover:bg-white/20 rounded-lg transition-colors text-white/80 hover:text-white">
          <X size={18} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-3 leading-relaxed shadow-sm ${
              m.role === 'user'
                ? 'bg-purple-600 text-white rounded-br-none font-medium'
                : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-bl-none border border-slate-200/80 dark:border-slate-700/80'
            }`}>
              <div className="whitespace-pre-wrap">{m.content}</div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm flex items-center gap-2 text-slate-500">
              <Loader2 size={14} className="animate-spin text-purple-600" />
              <span className="text-[11px] font-semibold">Pensando...</span>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Suggestion Chips */}
      {messages.length < 3 && (
        <div className="px-3 py-2 overflow-x-auto flex gap-1.5 no-scrollbar bg-slate-100/60 dark:bg-slate-800/60 border-t border-slate-200/50 dark:border-slate-700/50">
          {AI_PROMPT_CHIPS.map((chip, idx) => (
            <button
              key={idx}
              onClick={() => handleChip(chip)}
              className="shrink-0 px-2.5 py-1.5 bg-white dark:bg-slate-700 hover:bg-purple-50 text-slate-700 dark:text-slate-200 rounded-xl text-[11px] font-medium border border-slate-200 dark:border-slate-600 transition-all active:scale-95"
            >
              {chip}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="p-3 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700">
        <form onSubmit={e => { e.preventDefault(); handleSend(); }} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ej: busca macbook..."
            disabled={loading}
            className="flex-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 outline-none focus:border-purple-500 transition-all"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="p-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white rounded-xl transition-all active:scale-95 flex items-center justify-center shadow-md shadow-purple-200 dark:shadow-none"
          >
            <Send size={15} />
          </button>
        </form>
      </div>
    </div>
  );
};
