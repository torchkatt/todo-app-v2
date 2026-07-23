import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { ArrowLeft, Send, Loader2, X, Sparkles, Store, Bike, MessageCircle, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { db } from '../../services/firebase';
import { useAuth } from '../../context/AuthContext';
import { useChatUI } from '../../context/ChatUIContext';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';
import { useSpeechSynthesis } from '../../hooks/useSpeechSynthesis';
import { setNavigateHook } from '../../services/aiChatTools';
import { sendMessage, sendAIMessage, type ChatDoc, type ChatMessageDoc, type ChatType } from '../../services/chatService';
import { AI_PROMPT_CHIPS } from '../../config/constants';

const VOICE_MODE_KEY = 'todo_ai_voice_mode';

const AI_WELCOME = `¡Hola! Soy el asistente de **Todo**. Puedo ayudarte a:

🔍 Buscar productos y servicios
🏪 Encontrar vendedores y tiendas
📦 Consultar tus pedidos
📊 Ver tus estadísticas
💡 Responder preguntas sobre Todo

¿Qué estás buscando hoy?`;

function headerFor(type: ChatType, chat: ChatDoc | undefined, uid: string) {
  if (type === 'ai') return { title: 'Asistente Todo', subtitle: 'Marketplace Inteligente', Icon: Sparkles };
  if (!chat) return { title: 'Chat', subtitle: 'Cargando…', Icon: MessageCircle };
  if (type === 'seller') {
    const title = uid === chat.buyerId ? chat.sellerName || 'Tienda' : chat.buyerName || 'Comprador';
    return { title, subtitle: 'Chat del pedido', Icon: Store };
  }
  const title = uid === chat.buyerId ? chat.courierName || 'Domiciliario' : chat.buyerName || 'Comprador';
  return { title, subtitle: 'Entrega en curso', Icon: Bike };
}

interface ChatThreadProps {
  chatId: string;
  type: ChatType;
  onClose: () => void;
  onBack: () => void;
}

export const ChatThread: React.FC<ChatThreadProps> = ({ chatId, type, onClose, onBack }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { chats, markRead } = useChatUI();
  const [messages, setMessages] = useState<ChatMessageDoc[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const isAI = type === 'ai';
  const chat = chats.find((c) => c.id === chatId);

  const { isSupported: micSupported, isListening, transcript, start: startListening, stop: stopListening } = useSpeechRecognition();
  const { isSupported: ttsSupported, isSpeaking, speak, stop: stopSpeaking } = useSpeechSynthesis();
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [voiceModeOn, setVoiceModeOn] = useState(() => localStorage.getItem(VOICE_MODE_KEY) === '1');
  const lastSpokenIdRef = useRef<string | null>(null);

  useEffect(() => { if (transcript) setInput(transcript); }, [transcript]);
  useEffect(() => { if (!isSpeaking) setSpeakingMessageId(null); }, [isSpeaking]);

  // No leer en voz alta el historial ya existente al abrir el hilo — solo
  // los mensajes nuevos que lleguen mientras el modo voz está activo.
  useEffect(() => { lastSpokenIdRef.current = null; }, [chatId]);
  useEffect(() => {
    if (!isAI) return;
    const lastMsg = messages[messages.length - 1];
    if (!lastMsg || lastMsg.senderId !== 'ai') return;
    if (lastSpokenIdRef.current === lastMsg.id) return;
    const isFirstLoad = lastSpokenIdRef.current === null;
    lastSpokenIdRef.current = lastMsg.id;
    if (!isFirstLoad && voiceModeOn) {
      setSpeakingMessageId(lastMsg.id);
      speak(lastMsg.text);
    }
  }, [messages, isAI, voiceModeOn, speak]);

  const toggleVoiceMode = () => {
    setVoiceModeOn((prev) => {
      const next = !prev;
      localStorage.setItem(VOICE_MODE_KEY, next ? '1' : '0');
      if (!next) stopSpeaking();
      return next;
    });
  };

  const handleToggleMic = () => {
    if (isListening) stopListening();
    else startListening();
  };

  const handlePlayMessage = (m: ChatMessageDoc) => {
    if (speakingMessageId === m.id) {
      stopSpeaking();
      setSpeakingMessageId(null);
      return;
    }
    setSpeakingMessageId(m.id);
    speak(m.text);
  };

  useEffect(() => {
    const q = query(collection(db, 'chats', chatId, 'messages'), orderBy('createdAt', 'asc'));
    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() } as ChatMessageDoc)));
    });
    return unsub;
  }, [chatId]);

  useEffect(() => {
    markRead(chatId);
  }, [chatId, messages.length, markRead]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  useEffect(() => {
    if (isAI) setNavigateHook((path) => { navigate(path); onClose(); });
  }, [isAI, navigate, onClose]);

  const handleSend = async () => {
    if (!input.trim() || sending || !user) return;
    const text = input.trim();
    setInput('');
    setSending(true);
    try {
      if (isAI) {
        const history = messages.map((m) => ({ role: m.senderId === 'ai' ? 'assistant' : 'user', content: m.text }));
        await sendAIMessage(chatId, user.id, user.role, history, text);
      } else {
        await sendMessage(chatId, user.id, text);
      }
    } finally {
      setSending(false);
    }
  };

  const { title, subtitle, Icon } = headerFor(type, chat, user?.id ?? '');
  const displayMessages: ChatMessageDoc[] =
    messages.length === 0 && isAI ? [{ id: 'welcome', senderId: 'ai', text: AI_WELCOME, createdAt: null }] : messages;

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-slate-900">
      <div className="p-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white flex items-center justify-between shadow-md shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <button onClick={onBack} aria-label="Volver a conversaciones" className="p-1 -ml-1 hover:bg-white/20 rounded-lg transition-colors text-white/90 shrink-0">
            <ArrowLeft size={18} />
          </button>
          <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0">
            <Icon size={18} />
          </div>
          <div className="min-w-0">
            <h3 className="font-extrabold text-sm leading-none truncate">{title}</h3>
            <span className="text-[10px] text-purple-200 font-medium">{subtitle}</span>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {isAI && ttsSupported && (
            <button
              onClick={toggleVoiceMode}
              aria-label={voiceModeOn ? 'Desactivar lectura automática' : 'Activar lectura automática'}
              title={voiceModeOn ? 'Modo voz activado' : 'Modo voz desactivado'}
              className={`p-1.5 rounded-lg transition-colors ${voiceModeOn ? 'bg-white/25 text-white' : 'hover:bg-white/20 text-white/70'}`}
            >
              {voiceModeOn ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>
          )}
          <button onClick={onClose} aria-label="Cerrar chat" className="p-1.5 hover:bg-white/20 rounded-lg transition-colors text-white/80 hover:text-white">
            <X size={18} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs">
        {displayMessages.map((m) => {
          const isMine = m.senderId === user?.id;
          return (
            <div key={m.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 leading-relaxed shadow-sm ${
                  isMine
                    ? 'bg-purple-600 text-white rounded-br-none font-medium'
                    : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-bl-none border border-slate-200/80 dark:border-slate-700/80'
                }`}
              >
                <div className="whitespace-pre-wrap">{m.text}</div>
                {isAI && !isMine && ttsSupported && (
                  <button
                    onClick={() => handlePlayMessage(m)}
                    aria-label={speakingMessageId === m.id ? 'Detener lectura' : 'Escuchar respuesta'}
                    className="mt-1.5 -ml-1 p-1 text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors rounded-lg"
                  >
                    {speakingMessageId === m.id ? <VolumeX size={13} /> : <Volume2 size={13} />}
                  </button>
                )}
              </div>
            </div>
          );
        })}
        {sending && isAI && (
          <div className="flex justify-start">
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm flex items-center gap-2 text-slate-500">
              <Loader2 size={14} className="animate-spin text-purple-600" />
              <span className="text-[11px] font-semibold">Pensando...</span>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {isAI && messages.length < 3 && (
        <div className="px-3 py-2 overflow-x-auto flex gap-1.5 no-scrollbar bg-slate-100/60 dark:bg-slate-800/60 border-t border-slate-200/50 dark:border-slate-700/50">
          {AI_PROMPT_CHIPS.map((chip, idx) => (
            <button
              key={idx}
              onClick={() => setInput(chip)}
              className="shrink-0 px-2.5 py-1.5 bg-white dark:bg-slate-700 hover:bg-purple-50 text-slate-700 dark:text-slate-200 rounded-xl text-[11px] font-medium border border-slate-200 dark:border-slate-600 transition-all active:scale-95"
            >
              {chip}
            </button>
          ))}
        </div>
      )}

      <div className="p-3 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700">
        <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isListening ? 'Escuchando...' : isAI ? 'Ej: busca macbook...' : 'Escribe un mensaje...'}
            disabled={sending}
            className="flex-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 outline-none focus:border-purple-500 transition-all"
          />
          {micSupported && (
            <button
              type="button"
              onClick={handleToggleMic}
              disabled={sending}
              aria-label={isListening ? 'Detener grabación' : 'Hablar en vez de escribir'}
              className={`p-2.5 rounded-xl transition-all active:scale-95 flex items-center justify-center shrink-0 ${
                isListening
                  ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse'
                  : 'bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-purple-600 hover:border-purple-300'
              }`}
            >
              {isListening ? <MicOff size={15} /> : <Mic size={15} />}
            </button>
          )}
          <button
            type="submit"
            disabled={!input.trim() || sending}
            className="p-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white rounded-xl transition-all active:scale-95 flex items-center justify-center shadow-md shadow-purple-200 dark:shadow-none"
          >
            <Send size={15} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatThread;
