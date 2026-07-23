import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useChatUI } from '../../context/ChatUIContext';
import { MessageSquare, X } from 'lucide-react';
import ChatHub from './ChatHub';
import ChatThread from './ChatThread';

export const AIChatButton: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const { isOpen, activeChatId, activeChatType, toggleHub, closeChat, goToHub, hasUnread } = useChatUI();

  // Don't show for unauthenticated or guests
  if (!isAuthenticated || user?.isGuest) return null;

  return (
    <>
      {/* FAB — posicionado en bottom-20 en móvil para jamás tapar la barra inferior de navegación (BottomTabs) */}
      <button
        onClick={toggleHub}
        aria-label="Abrir conversaciones"
        className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-40 w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 text-white shadow-xl shadow-purple-500/30 hover:shadow-purple-500/50 hover:scale-105 transition-all active:scale-95 flex items-center justify-center cursor-pointer"
      >
        {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
        {!isOpen && hasUnread && (
          <span className="absolute top-1 right-1 w-3 h-3 rounded-full bg-red-500 border-2 border-white" />
        )}
      </button>
      {/* Chat panel */}
      {isOpen && (
        <div className="fixed bottom-36 right-3 sm:bottom-24 sm:right-6 z-50 w-[380px] max-w-[calc(100vw-24px)] h-[520px] max-h-[calc(100vh-160px)] bg-white rounded-2xl border border-border shadow-2xl flex flex-col overflow-hidden animate-fade-up">
          {activeChatId && activeChatType ? (
            <ChatThread chatId={activeChatId} type={activeChatType} onClose={closeChat} onBack={goToHub} />
          ) : (
            <ChatHub />
          )}
        </div>
      )}
    </>
  );
};

export default AIChatButton;
