import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { collection, query, where, orderBy, limit, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from './AuthContext';
import { getChatReadAt, markChatRead, type ChatDoc, type ChatType } from '../services/chatService';

interface ChatUIContextType {
  chats: ChatDoc[];
  unreadChatIds: Set<string>;
  hasUnread: boolean;
  isOpen: boolean;
  activeChatId: string | null;
  /** Tipo del hilo activo, conocido de antemano por quien llamó a openChat —
   * no depende de que el snapshot de `chats` ya haya traído el doc (evita una
   * carrera al abrir un chat recién creado). */
  activeChatType: ChatType | null;
  /** Abre el panel directo en un hilo — usado desde OrderDetail (no es ancestro del FAB). */
  openChat: (chatId: string, type: ChatType) => void;
  /** Abre el panel en la lista de conversaciones — usado por el FAB. */
  openHub: () => void;
  closeChat: () => void;
  goToHub: () => void;
  toggleHub: () => void;
  markRead: (chatId: string) => Promise<void>;
}

const ChatUIContext = createContext<ChatUIContextType | null>(null);

export const useChatUI = () => {
  const ctx = useContext(ChatUIContext);
  if (!ctx) throw new Error('useChatUI debe usarse dentro de ChatUIProvider');
  return ctx;
};

export const ChatUIProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();
  const [chats, setChats] = useState<ChatDoc[]>([]);
  const [unreadChatIds, setUnreadChatIds] = useState<Set<string>>(new Set());
  const [isOpen, setIsOpen] = useState(false);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [activeChatType, setActiveChatType] = useState<ChatType | null>(null);
  const readCache = useRef<Map<string, Timestamp | null>>(new Map());

  // Cerrar el chat al navegar a otra pantalla
  const prevPath = useRef(location.pathname);
  useEffect(() => {
    if (prevPath.current !== location.pathname && isOpen) {
      setIsOpen(false);
      setActiveChatId(null);
      setActiveChatType(null);
    }
    prevPath.current = location.pathname;
  }, [location.pathname, isOpen]);

  useEffect(() => {
    if (!user?.id) {
      setChats([]);
      return;
    }
    const q = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', user.id),
      orderBy('lastMessageAt', 'desc'),
      limit(50)
    );
    const unsub = onSnapshot(q, (snap) => {
      setChats(snap.docs.map((d) => ({ id: d.id, ...d.data() } as ChatDoc)));
    });
    return unsub;
  }, [user?.id]);

  // Recalcula "no leído" solo para los chats cuyo lastMessageAt cambió, con un
  // getDoc puntual por chat (cacheado) — no un listener persistente por hilo.
  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    (async () => {
      const uid = user.id;
      const next = new Set<string>();
      for (const chat of chats) {
        if (!chat.lastMessageAt || chat.lastMessageSenderId === uid) continue;
        let readAt = readCache.current.get(chat.id);
        if (readAt === undefined) {
          readAt = await getChatReadAt(chat.id, uid);
          readCache.current.set(chat.id, readAt);
        }
        if (!readAt || chat.lastMessageAt.toMillis() > readAt.toMillis()) {
          next.add(chat.id);
        }
      }
      if (!cancelled) setUnreadChatIds(next);
    })();
    return () => {
      cancelled = true;
    };
  }, [chats, user?.id]);

  const openChat = useCallback((chatId: string, type: ChatType) => {
    setActiveChatId(chatId);
    setActiveChatType(type);
    setIsOpen(true);
  }, []);

  const openHub = useCallback(() => {
    setActiveChatId(null);
    setActiveChatType(null);
    setIsOpen(true);
  }, []);

  const closeChat = useCallback(() => {
    setIsOpen(false);
    setActiveChatId(null);
    setActiveChatType(null);
  }, []);

  const goToHub = useCallback(() => {
    setActiveChatId(null);
    setActiveChatType(null);
  }, []);

  const toggleHub = useCallback(() => {
    setIsOpen((o) => {
      if (o) {
        setActiveChatId(null);
        setActiveChatType(null);
      }
      return !o;
    });
  }, []);

  const markRead = useCallback(
    async (chatId: string) => {
      if (!user?.id) return;
      await markChatRead(chatId, user.id);
      readCache.current.set(chatId, Timestamp.now());
      setUnreadChatIds((prev) => {
        if (!prev.has(chatId)) return prev;
        const next = new Set(prev);
        next.delete(chatId);
        return next;
      });
    },
    [user?.id]
  );

  return (
    <ChatUIContext.Provider
      value={{
        chats,
        unreadChatIds,
        hasUnread: unreadChatIds.size > 0,
        isOpen,
        activeChatId,
        activeChatType,
        openChat,
        openHub,
        closeChat,
        goToHub,
        toggleHub,
        markRead,
      }}
    >
      {children}
    </ChatUIContext.Provider>
  );
};
