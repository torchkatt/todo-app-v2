import React, { useState } from 'react';
import { Sparkles, Store, Bike, MessageCircle, Loader2, Edit } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useChatUI } from '../../context/ChatUIContext';
import { getOrCreateAIChat, type ChatDoc } from '../../services/chatService';
import NewChatModal from './NewChatModal';

function otherPartyLabel(chat: ChatDoc, uid: string): string {
  if (chat.type === 'p2p') {
    // P2P: mostrar el nombre del otro usuario
    return uid === chat.buyerId ? (chat.sellerName || 'Usuario') : (chat.buyerName || 'Usuario');
  }
  if (uid === chat.buyerId) {
    return chat.type === 'seller' ? chat.sellerName || 'Tienda' : chat.courierName || 'Domiciliario';
  }
  return chat.buyerName || 'Comprador';
}

function ChatIcon({ type }: { type: ChatDoc['type'] }) {
  const Icon = type === 'seller' ? Store : type === 'p2p' ? MessageCircle : Bike;
  return <Icon size={18} />;
}

export const ChatHub: React.FC = () => {
  const { user } = useAuth();
  const { chats, unreadChatIds, openChat } = useChatUI();
  const [openingAI, setOpeningAI] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);

  if (!user) return null;

  const aiChat = chats.find((c) => c.type === 'ai');
  const otherChats = chats.filter((c) => c.type !== 'ai');

  const handleOpenAI = async () => {
    if (aiChat) {
      openChat(aiChat.id, 'ai');
      return;
    }
    setOpeningAI(true);
    try {
      const chatId = await getOrCreateAIChat();
      openChat(chatId, 'ai');
    } finally {
      setOpeningAI(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-slate-900 overflow-hidden">
      <div className="p-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-sm leading-none">Tus conversaciones</h3>
            <span className="text-[10px] text-purple-200 font-medium">Asistente, usuarios y negocios</span>
          </div>
          <button
            onClick={() => setShowNewChat(true)}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all active:scale-90"
            title="Nueva conversación"
          >
            <Edit size={14} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto divide-y divide-slate-200/70 dark:divide-slate-700/70">
        <button
          onClick={handleOpenAI}
          disabled={openingAI}
          className="w-full flex items-center gap-3 p-4 hover:bg-white dark:hover:bg-slate-800 transition-colors text-left"
        >
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 text-white flex items-center justify-center shrink-0">
            {openingAI ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold text-text-primary dark:text-slate-100">Asistente Todo</div>
            <div className="text-xs text-text-muted truncate">{aiChat?.lastMessage || '¿Qué estás buscando hoy?'}</div>
          </div>
          {aiChat && unreadChatIds.has(aiChat.id) && <span className="w-2.5 h-2.5 rounded-full bg-purple-600 shrink-0" />}
        </button>

        {otherChats.map((chat) => {
          const unread = unreadChatIds.has(chat.id);
          return (
            <button
              key={chat.id}
              onClick={() => openChat(chat.id, chat.type)}
              className="w-full flex items-center gap-3 p-4 hover:bg-white dark:hover:bg-slate-800 transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0">
                <ChatIcon type={chat.type} />
              </div>
              <div className="flex-1 min-w-0">
                <div className={`text-sm truncate ${unread ? 'font-extrabold text-text-primary dark:text-slate-100' : 'font-bold text-text-secondary dark:text-slate-300'}`}>
                  {otherPartyLabel(chat, user.id)}
                </div>
                <div className="text-xs text-text-muted truncate">{chat.lastMessage || 'Sin mensajes todavía'}</div>
              </div>
              {unread && <span className="w-2.5 h-2.5 rounded-full bg-purple-600 shrink-0" />}
            </button>
          );
        })}

        {otherChats.length === 0 && (
          <div className="p-6 text-center text-[11px] text-text-muted flex flex-col items-center gap-2">
            <MessageCircle size={26} className="text-slate-300" />
            Cuando chatees con una tienda o un domiciliario, aparecerá aquí.
          </div>
        )}
      </div>

      <NewChatModal isOpen={showNewChat} onClose={() => setShowNewChat(false)} />
    </div>
  );
};

export default ChatHub;
