import { db } from './firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';

// ─── Types ───
export interface SubscriptionPlan {
  id: string;
  name: string;
  slug: string;
  price: number; // in COP — 0 for free
  period: 'monthly' | 'annual' | 'lifetime';
  commissionRate: number; // 0.10 = 10%
  features: string[];
  highlight: boolean;
  isActive: boolean;
  sortOrder: number;
  createdAt?: any;
  updatedAt?: any;
}

export interface SellerSubscription {
  sellerId: string;
  planId: string;
  status: 'active' | 'cancelled' | 'expired' | 'trial';
  startedAt: string;
  expiresAt?: string;
  cancelledAt?: string;
  autoRenew: boolean;
  paymentMethod?: string;
}

// ─── Default Plans ───
const DEFAULT_PLANS: Omit<SubscriptionPlan, 'createdAt' | 'updatedAt'>[] = [
  {
    id: 'free',
    name: 'Gratis',
    slug: 'free',
    price: 0,
    period: 'monthly',
    commissionRate: 0.10,
    features: [
      'Hasta 20 productos publicados',
      'Comisión 10% por venta',
      'Soporte por chat IA',
      'Estadísticas básicas',
    ],
    highlight: false,
    isActive: true,
    sortOrder: 0,
  },
  {
    id: 'seller_pass_monthly',
    name: 'Seller Pass Mensual',
    slug: 'seller-pass-monthly',
    price: 49900,
    period: 'monthly',
    commissionRate: 0.05,
    features: [
      'Productos ilimitados',
      'Comisión reducida 5%',
      'Estadísticas avanzadas',
      'Dashboard de revenue',
      'Soporte prioritario',
      'Insignia verificada',
    ],
    highlight: true,
    isActive: true,
    sortOrder: 1,
  },
  {
    id: 'seller_pass_annual',
    name: 'Seller Pass Anual',
    slug: 'seller-pass-annual',
    price: 499900,
    period: 'annual',
    commissionRate: 0.05,
    features: [
      'Todo lo del plan mensual',
      '2 meses gratis (vs mensual)',
      'Comisión reducida 5%',
      'Dashboard de revenue',
      'Exportación de datos',
      'API access',
      'Soporte 24/7',
    ],
    highlight: true,
    isActive: true,
    sortOrder: 2,
  },
];

// ─── Service ───
export const planService = {
  async getAll(): Promise<SubscriptionPlan[]> {
    const snap = await getDocs(collection(db, 'subscription_plans'));
    if (snap.empty) {
      await this.seedDefaults();
      const fresh = await getDocs(collection(db, 'subscription_plans'));
      return fresh.docs.map(d => ({ id: d.id, ...d.data() } as SubscriptionPlan));
    }
    return snap.docs
      .map(d => ({ id: d.id, ...d.data() } as SubscriptionPlan))
      .filter(p => p.isActive)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  },

  async getById(id: string): Promise<SubscriptionPlan | null> {
    const d = await getDoc(doc(db, 'subscription_plans', id));
    if (!d.exists()) return null;
    return { id: d.id, ...d.data() } as SubscriptionPlan;
  },

  async seedDefaults(): Promise<void> {
    for (const plan of DEFAULT_PLANS) {
      await setDoc(doc(db, 'subscription_plans', plan.id), {
        ...plan,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  },
};

// ─── Seller Subscription Service ───
export const sellerSubscriptionService = {
  async getCurrentPlan(sellerId: string): Promise<{
    subscription: SellerSubscription;
    plan: SubscriptionPlan;
  } | null> {
    const subDoc = await getDoc(doc(db, 'seller_subscriptions', sellerId));
    if (!subDoc.exists()) return null;
    const subscription = { id: subDoc.id, ...subDoc.data() } as unknown as SellerSubscription;
    const plan = await planService.getById(subscription.planId);
    if (!plan) return null;
    return { subscription, plan };
  },

  async upgradePlan(sellerId: string, planId: string): Promise<void> {
    const plan = await planService.getById(planId);
    if (!plan) throw new Error('Plan not found');

    // Calculate expiration
    const now = new Date();
    const expiresAt = new Date(now);
    if (plan.period === 'monthly') expiresAt.setMonth(expiresAt.getMonth() + 1);
    else if (plan.period === 'annual') expiresAt.setFullYear(expiresAt.getFullYear() + 1);

    await setDoc(doc(db, 'seller_subscriptions', sellerId), {
      sellerId,
      planId: plan.id,
      status: 'active',
      startedAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      autoRenew: true,
      updatedAt: serverTimestamp(),
    });
  },

  async cancelSubscription(sellerId: string): Promise<void> {
    const ref = doc(db, 'seller_subscriptions', sellerId);
    const snap = await getDoc(ref);
    if (!snap.exists()) throw new Error('No subscription found');

    const data = snap.data() as SellerSubscription;
    await setDoc(ref, {
      ...data,
      status: 'cancelled',
      cancelledAt: new Date().toISOString(),
      autoRenew: false,
    }, { merge: true });
  },
};
