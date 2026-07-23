/**
 * @file components/chat/NewChatModal.tsx
 * @description Modal para buscar usuarios e iniciar una conversación P2P.
 */
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Loader2, MessageCircle, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useChatUI } from '../../context/ChatUIContext';
import { userSearchService } from '../../services/userSearchService';
import { getOrCreateP2PChat } from '../../services/chatService';
import type { User as UserType } from '../../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const NewChatModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const { openChat } = useChatUI();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      // Load initial users
      loadUsers('');
    }
  }, [isOpen]);

  useEffect(() => {
    if (query.length >= 1 || query.length === 0) {
      const timer = setTimeout(() => loadUsers(query), 300);
      return () => clearTimeout(timer);
    }
  }, [query]);

  const loadUsers = async (term: string) => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const users = await userSearchService.search(term, user.id);
      setResults(users);
    } catch { /* silent */ }
    setLoading(false);
  };

  const handleSelectUser = async (other: UserType) => {
    if (!user?.id || !other.id) return;
    setCreating(other.id);
    try {
      const chatId = await getOrCreateP2PChat(other.id);
      openChat(chatId, 'p2p');
      onClose();
    } catch (e: any) {
      alert(e.message || 'Error al iniciar conversación');
    } finally {
      setCreating(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-sm max-h-[80vh] flex flex-col shadow-2xl animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <MessageCircle size={18} className="text-purple-600" />
            <h2 className="text-base font-extrabold">Nueva conversación</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
            <X size={20} />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 shrink-0">
          <div className="relative">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Buscar usuarios por nombre..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-purple-400 focus:bg-white transition-all"
            />
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 size={20} className="animate-spin text-purple-600" />
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-8">
              <User size={32} className="mx-auto mb-2 text-text-muted" />
              <p className="text-sm text-text-muted">No se encontraron usuarios</p>
            </div>
          ) : (
            <div className="space-y-1">
              {results.map(u => (
                <button
                  key={u.id}
                  onClick={() => handleSelectUser(u)}
                  disabled={creating === u.id}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-purple-50 hover:border-purple-200 border border-transparent transition-all active:scale-[0.99] disabled:opacity-50"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                    {u.fullName?.charAt(0).toUpperCase() || '?'}
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <div className="text-sm font-bold text-text-primary truncate">{u.fullName || 'Usuario'}</div>
                    <div className="text-[11px] text-text-muted truncate">{u.email || ''}</div>
                  </div>
                  {creating === u.id ? (
                    <Loader2 size={16} className="animate-spin text-purple-600 shrink-0" />
                  ) : (
                    <MessageCircle size={16} className="text-purple-500 shrink-0" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NewChatModal;
