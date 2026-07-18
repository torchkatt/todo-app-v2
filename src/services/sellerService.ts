import { collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, query, where, orderBy, limit, startAfter } from 'firebase/firestore';
import { db } from './firebase';
import type { Seller, SellerType, SellerStats } from '../types';

const COLLECTION = 'sellers';

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

/**
 * Create a new seller.
 */
export async function createSeller(data: Omit<Seller, 'id' | 'slug' | 'stats' | 'createdAt' | 'updatedAt' | 'rating' | 'ratingCount'>): Promise<Seller> {
  const ref = doc(collection(db, COLLECTION));
  const now = new Date().toISOString();
  const seller: Seller = {
    ...data,
    id: ref.id,
    slug: `${slugify(data.name)}-${ref.id.slice(-6)}`,
    rating: 0,
    ratingCount: 0,
    stats: { totalTransactions: 0, totalRevenue: 0, totalListings: 0, activeListings: 0, completionRate: 1, avgRating: 0, responseTimeHours: 0 },
    createdAt: now,
    updatedAt: now,
  };
  await setDoc(ref, seller);
  return seller;
}

/**
 * Get seller by ID.
 */
export async function getSeller(id: string): Promise<Seller | null> {
  const snap = await getDoc(doc(db, COLLECTION, id));
  return snap.exists() ? (snap.data() as Seller) : null;
}

/**
 * Get seller by owner (userId).
 */
export async function getSellerByOwner(ownerId: string): Promise<Seller | null> {
  const q = query(collection(db, COLLECTION), where('ownerId', '==', ownerId), where('isActive', '==', true), limit(1));
  const snap = await getDocs(q);
  return snap.empty ? null : snap.docs[0].data() as Seller;
}

/**
 * Update seller.
 */
export async function updateSeller(id: string, data: Partial<Omit<Seller, 'id' | 'stats' | 'createdAt'>>): Promise<void> {
  const ref = doc(db, COLLECTION, id);
  await updateDoc(ref, { ...data, updatedAt: new Date().toISOString() });
}

/**
 * Search sellers by name, type, category, or city.
 */
export async function searchSellers(params: {
  query?: string;
  type?: SellerType;
  categoryId?: string;
  city?: string;
  maxResults?: number;
  lastDoc?: any;
}): Promise<{ sellers: Seller[]; lastDoc: any }> {
  const { query: searchTerm, type, city, maxResults = 20 } = params;

  let q = query(collection(db, COLLECTION), where('isActive', '==', true), orderBy('rating', 'desc'), limit(maxResults));

  if (city) {
    q = query(q, where('location.city', '==', city));
  }
  if (type) {
    q = query(q, where('type', '==', type));
  }

  const snap = await getDocs(q);
  let sellers = snap.docs.map(d => d.data() as Seller);

  // Client-side filtering for text search and category
  if (searchTerm) {
    const term = searchTerm.toLowerCase();
    sellers = sellers.filter(s =>
      s.name.toLowerCase().includes(term) ||
      s.description?.toLowerCase().includes(term) ||
      s.location.address.toLowerCase().includes(term)
    );
  }

  return { sellers, lastDoc: snap.docs[snap.docs.length - 1] || null };
}

/**
 * Get sellers by category.
 */
export async function getSellersByCategory(categoryId: string, maxResults = 50): Promise<Seller[]> {
  const q = query(
    collection(db, COLLECTION),
    where('categoryIds', 'array-contains', categoryId),
    where('isActive', '==', true),
    orderBy('stats.totalTransactions', 'desc'),
    limit(maxResults),
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data() as Seller);
}

/**
 * Disable a seller.
 */
export async function disableSeller(id: string): Promise<void> {
  await updateDoc(doc(db, COLLECTION, id), { isActive: false, updatedAt: new Date().toISOString() });
}
