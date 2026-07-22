import { db } from './firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs, orderBy, limit } from 'firebase/firestore';

type EventName =
  | 'page_view' | 'search' | 'add_to_cart' | 'remove_from_cart'
  | 'checkout_start' | 'purchase' | 'login' | 'register'
  | 'logout' | 'view_listing' | 'view_seller' | 'add_favorite'
  | 'remove_favorite' | 'ai_chat_message' | 'ai_tool_call'
  | 'error' | 'click_cta' | 'share' | 'install_pwa';

interface AnalyticsEvent {
  name: EventName;
  userId?: string;
  properties?: Record<string, any>;
}

// Batch queue
let queue: AnalyticsEvent[] = [];
let flushing = false;

async function flush() {
  if (flushing || queue.length === 0) return;
  flushing = true;
  const batch = queue.splice(0);
  try {
    for (const event of batch) {
      await addDoc(collection(db, 'analytics_events'), {
        name: event.name,
        userId: event.userId || 'anonymous',
        properties: event.properties || {},
        timestamp: serverTimestamp(),
        date: new Date().toISOString().split('T')[0],
        hour: new Date().getHours(),
      });
    }
  } catch { /* silent */ }
  flushing = false;
}

// Auto-flush every 5s
if (typeof window !== 'undefined') {
  setInterval(flush, 5000);
}

export const analytics = {
  track(event: AnalyticsEvent) {
    queue.push(event);
    if (queue.length >= 10) flush();
  },

  // Convenience methods
  pageView(path: string, userId?: string) {
    this.track({ name: 'page_view', userId, properties: { path } });
  },
  search(query: string, resultsCount: number, userId?: string) {
    this.track({ name: 'search', userId, properties: { query, resultsCount } });
  },
  addToCart(listingId: string, price: number, userId?: string) {
    this.track({ name: 'add_to_cart', userId, properties: { listingId, price } });
  },
  purchase(amount: number, itemCount: number, userId?: string) {
    this.track({ name: 'purchase', userId, properties: { amount, itemCount } });
  },
  error(message: string, code?: string) {
    this.track({ name: 'error', properties: { message, code } });
  },
  login(method: string, userId?: string) {
    this.track({ name: 'login', userId, properties: { method } });
  },

  // Report queries
  async getDailyActiveUsers(sinceDays: number = 7): Promise<number> {
    const start = new Date();
    start.setDate(start.getDate() - sinceDays);
    const q = query(
      collection(db, 'analytics_events'),
      where('name', 'in', ['page_view']),
      orderBy('timestamp', 'desc'),
      limit(1000)
    );
    const snap = await getDocs(q);
    const users = new Set(snap.docs.map(d => d.data().userId));
    return users.size;
  },

  async getPopularListings(days: number = 7, max: number = 10): Promise<Array<{ id: string; count: number }>> {
    const start = new Date();
    start.setDate(start.getDate() - days);
    const q = query(
      collection(db, 'analytics_events'),
      where('name', '==', 'view_listing'),
      orderBy('timestamp', 'desc'),
      limit(500)
    );
    const snap = await getDocs(q);
    const counts: Record<string, number> = {};
    snap.docs.forEach(d => {
      const pid = d.data().properties?.listingId;
      if (pid) counts[pid] = (counts[pid] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, max)
      .map(([id, count]) => ({ id, count }));
  },
};
