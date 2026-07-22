import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';
import { requestPermission, onMessageListener } from '../services/firebase';
import { X, Package, Star, AlertCircle } from 'lucide-react';

interface Notification {
  id: string;
  title: string;
  body: string;
  type: 'order_update' | 'review' | 'promo' | 'system';
  read: boolean;
  link?: string;
  createdAt: any;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  showBanner: boolean;
  dismissBanner: () => void;
  requestPushPermission: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showBanner, setShowBanner] = useState(false);
  const [currentBanner, setCurrentBanner] = useState<Notification | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    const q = query(collection(db, 'notifications'), where('userId', '==', user.id), orderBy('createdAt', 'desc'), limit(20));
    const unsub = onSnapshot(q, snap => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as Notification));
      setNotifications(list);
      setUnreadCount(list.filter(n => !n.read).length);
    });
    return unsub;
  }, [user?.id]);

  // Listen for FCM foreground messages
  useEffect(() => {
    let cancelled = false;
    onMessageListener().then((payload: any) => {
      if (cancelled) return;
      const n: Notification = {
        id: Date.now().toString(),
        title: payload.notification?.title || 'Todo',
        body: payload.notification?.body || '',
        type: 'system',
        read: false,
        createdAt: new Date().toISOString(),
      };
      setNotifications(prev => [n, ...prev]);
      setCurrentBanner(n);
      setShowBanner(true);
    }).catch((err) => console.error('[NotificationContext] onMessageListener error:', err));
    return () => { cancelled = true; };
  }, []);

  const dismissBanner = useCallback(() => setShowBanner(false), []);

  const requestPushPermission = useCallback(async () => {
    try {
      const token = await requestPermission();
      if (token) {
        // Save token to user doc
        const { doc, updateDoc } = await import('firebase/firestore');
        await updateDoc(doc(db, 'users', user!.id), { fcmToken: token });
      }
    } catch {}
  }, [user?.id]);

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, showBanner, dismissBanner, requestPushPermission }}>
      {children}

      {/* In-app banner */}
      {showBanner && currentBanner && (
        <div className="fixed top-4 left-4 right-4 z-[60] max-w-sm mx-auto bg-white rounded-2xl border border-border shadow-2xl p-4 animate-fade-up flex items-start gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
            currentBanner.type === 'order_update' ? 'bg-purple-50 text-purple-600' :
            currentBanner.type === 'review' ? 'bg-amber-50 text-amber-500' : 'bg-blue-50 text-blue-500'
          }`}>
            {currentBanner.type === 'order_update' ? <Package size={20} /> : currentBanner.type === 'review' ? <Star size={20} /> : <AlertCircle size={20} />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-extrabold text-text-primary">{currentBanner.title}</div>
            <div className="text-xs text-text-secondary mt-0.5 line-clamp-2">{currentBanner.body}</div>
          </div>
          <button onClick={dismissBanner} className="p-1 hover:bg-gray-100 rounded-lg transition-colors"><X size={16} /></button>
        </div>
      )}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be inside NotificationProvider');
  return ctx;
};
