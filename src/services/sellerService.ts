/**
 * @file sellerService.ts
 * @description Servicio para gestión de vendedores y onboarding progresivo.
 */
import { db } from './firebase';
import {
  doc, getDoc, setDoc, updateDoc, deleteDoc, addDoc, collection, serverTimestamp,
} from 'firebase/firestore';
import { SellerType, UserRole } from '../types';
import type { Seller, User } from '../types';

// ─── Tipos ───────────────────────────────────────────────────────────────────

export interface OnboardingData {
  type?: SellerType;
  categoryIds?: string[];
  name?: string;
  description?: string;
  logo?: string;
  city?: string;
  address?: string;
  neighborhood?: string;
  phone?: string;
  whatsapp?: string;
  website?: string;
  deliveryEnabled?: boolean;
  baseFee?: number;
  pricePerKm?: number;
  maxDistanceKm?: number;
  freeThreshold?: number;
  estimatedTime?: string;
  pickupEnabled?: boolean;
  tosAccepted?: boolean;
  onboardingStatus?: 'not_started' | 'in_progress' | 'completed';
  onboardingStep?: number;
  completedSteps?: number[];
}

// ─── Service ─────────────────────────────────────────────────────────────────

const ONBOARDING_COL = 'seller_onboarding';

export const sellerService = {

  /** Obtener o crear sesión de onboarding */
  async getOrCreateOnboarding(userId: string): Promise<OnboardingData> {
    const ref = doc(db, ONBOARDING_COL, userId);
    const snap = await getDoc(ref);
    if (snap.exists()) return snap.data() as OnboardingData;
    const initial: OnboardingData = {
      onboardingStatus: 'not_started',
      onboardingStep: 1,
      completedSteps: [],
    };
    await setDoc(ref, initial);
    return initial;
  },

  /** Guardar progreso de un paso */
  async saveStep(userId: string, step: number, data: Partial<OnboardingData>): Promise<void> {
    const ref = doc(db, ONBOARDING_COL, userId);
    const completedSteps: number[] = [];
    const existing = await getDoc(ref);
    if (existing.exists()) {
      completedSteps.push(...(existing.data().completedSteps || []));
    }
    if (!completedSteps.includes(step)) completedSteps.push(step);
    await setDoc(ref, {
      ...data,
      onboardingStatus: 'in_progress',
      onboardingStep: step + 1,
      completedSteps,
      updatedAt: serverTimestamp(),
    }, { merge: true });
  },

  /** Finalizar onboarding → crear seller + actualizar user */
  async completeOnboarding(userId: string, user: User, data: OnboardingData): Promise<Seller> {
    const slug = `tienda-${userId.slice(-6)}`;
    const sellerRef = await addDoc(collection(db, 'sellers'), {
      ownerId: userId,
      name: data.name || `${user.fullName || 'Tienda'} de ${user.fullName || 'Todo'}`,
      slug,
      type: data.type || SellerType.INDIVIDUAL,
      categoryIds: data.categoryIds || [],
      description: data.description || '',
      logo: data.logo || '🏪',
      location: {
        address: data.address || '',
        city: data.city || '',
        neighborhood: data.neighborhood || '',
      },
      contact: {
        phone: data.phone || user.phone || '',
        email: user.email || '',
        whatsapp: data.whatsapp || '',
        website: data.website || '',
      },
      deliveryConfig: {
        isEnabled: data.deliveryEnabled || false,
        baseFee: data.baseFee || 0,
        pricePerKm: data.pricePerKm || 0,
        maxDistanceKm: data.maxDistanceKm || 0,
        freeThreshold: data.freeThreshold || 0,
        estimatedTime: data.estimatedTime || '',
      },
      rating: 0,
      ratingCount: 0,
      subscription: 'free',
      isActive: true,
      isVerified: false,
      stats: {
        totalTransactions: 0, totalRevenue: 0, totalListings: 0, activeListings: 0,
        completionRate: 0, avgRating: 0, responseTimeHours: 0,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Actualizar usuario con multi-rol
    await updateDoc(doc(db, 'users', userId), {
      roles: [UserRole.CUSTOMER, UserRole.SELLER],
      primaryRole: UserRole.SELLER,
      sellerId: sellerRef.id,
      onboardingDone: true,
    });

    // Limpiar onboarding temporal
    await deleteDoc(doc(db, ONBOARDING_COL, userId));

    return { id: sellerRef.id, ownerId: userId, name: data.name || '', slug, type: data.type } as Seller;
  },

  /** Verificar si el usuario ya tiene sellerId en Firestore (para redirect) */
  async hasSellerProfile(userId: string): Promise<boolean> {
    const userSnap = await getDoc(doc(db, 'users', userId));
    if (!userSnap.exists()) return false;
    const u = userSnap.data() as User;
    if (u.sellerId) return true;
    // Fallback: buscar en colección sellers
    const { getDocs, query, where, limit } = await import('firebase/firestore');
    const q = query(collection(db, 'sellers'), where('ownerId', '==', userId), limit(1));
    const snap = await getDocs(q);
    return !snap.empty;
  },
};

// Direct exports for backward compat with tests
export const getOrCreateOnboarding = sellerService.getOrCreateOnboarding.bind(sellerService);
export const saveStep = sellerService.saveStep.bind(sellerService);
export const completeOnboarding = sellerService.completeOnboarding.bind(sellerService);
export const hasSellerProfile = sellerService.hasSellerProfile.bind(sellerService);

// Legacy: getSeller — used by SellerStorefront
export const getSeller = async (id: string) => {
  const snap = await getDoc(doc(db, 'sellers', id));
  return snap.exists() ? ({ ...snap.data(), id: snap.id } as Seller) : null;
};
