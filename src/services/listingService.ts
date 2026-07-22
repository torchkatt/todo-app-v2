import { collection, doc, getDoc, getDocs, setDoc, updateDoc, query, where, orderBy, limit, increment } from 'firebase/firestore';
import { db } from './firebase';
import type { Listing, ListingType, DeliveryMethod } from '../types';
import { incrementCategoryStats } from './categoryService';

const COLLECTION = 'listings';

/**
 * Create a new listing.
 */
export async function createListing(data: Omit<Listing, 'id' | 'stats' | 'createdAt' | 'updatedAt' | 'discountPercent' | 'isApproved'>): Promise<Listing> {
  const ref = doc(collection(db, COLLECTION));
  const now = new Date().toISOString();
  const discountPercent = data.originalPrice
    ? Math.round(((data.originalPrice - data.price) / data.originalPrice) * 100)
    : 0;
  const listing: Listing = {
    ...data,
    id: ref.id,
    discountPercent,
    isApproved: false, // Requires admin review
    stats: { views: 0, favorites: 0, transactions: 0, rating: 0, ratingCount: 0 },
    createdAt: now,
    updatedAt: now,
  };
  await setDoc(ref, listing);
  // Increment category listing count
  if (data.categoryId) await incrementCategoryStats(data.categoryId, 'listingCount', 1);
  if (data.subcategoryId) await incrementCategoryStats(data.subcategoryId, 'listingCount', 1);
  return listing;
}

/**
 * Get listing by ID.
 */
export async function getListing(id: string): Promise<Listing | null> {
  const snap = await getDoc(doc(db, COLLECTION, id));
  return snap.exists() ? (snap.data() as Listing) : null;
}

/**
 * Get listings by seller.
 */
export async function getListingsBySeller(sellerId: string, maxResults = 50): Promise<Listing[]> {
  const q = query(
    collection(db, COLLECTION),
    where('sellerId', '==', sellerId),
    where('isActive', '==', true),
    orderBy('updatedAt', 'desc'),
    limit(maxResults),
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data() as Listing);
}

/**
 * Search listings with flexible filters.
 */
export async function searchListings(params: {
  query?: string;
  categoryId?: string;
  subcategoryId?: string;
  type?: ListingType;
  deliveryMethod?: DeliveryMethod;
  minPrice?: number;
  maxPrice?: number;
  city?: string;
  isFeatured?: boolean;
  maxResults?: number;
  lastDoc?: any;
}): Promise<{ listings: Listing[]; lastDoc: any }> {
  const {
    query: searchTerm, categoryId, subcategoryId,
    type, minPrice, maxPrice, isFeatured,
    // city: no aplica todavía — Listing no denormaliza la ciudad del seller (vive en
    // Seller.location.city). Filtrar por ciudad requeriría denormalizar el campo al
    // crear/editar el listing o hacer un join con sellers en la búsqueda.
    maxResults = 20,
  } = params;

  // Build Firestore query with supported composite filters
  let q = query(
    collection(db, COLLECTION),
    where('isActive', '==', true),
    where('isApproved', '==', true),
  );

  if (type) q = query(q, where('type', '==', type));
  if (subcategoryId) q = query(q, where('subcategoryId', '==', subcategoryId));
  else if (categoryId) q = query(q, where('categoryId', '==', categoryId));
  if (isFeatured) q = query(q, where('isFeatured', '==', true));

  q = query(q, orderBy('createdAt', 'desc'), limit(maxResults));

  const snap = await getDocs(q);
  let listings = snap.docs.map(d => d.data() as Listing);

  // Client-side filtering for unsupported Firestore queries
  if (searchTerm) {
    const term = searchTerm.toLowerCase();
    listings = listings.filter(l =>
      l.title.toLowerCase().includes(term) ||
      l.description.toLowerCase().includes(term) ||
      l.tags.some(t => t.includes(term))
    );
  }
  if (minPrice !== undefined) listings = listings.filter(l => l.price >= minPrice);
  if (maxPrice !== undefined) listings = listings.filter(l => l.price <= maxPrice);

  return { listings, lastDoc: snap.docs[snap.docs.length - 1] || null };
}

/**
 * Get featured listings for homepage.
 */
export async function getFeaturedListings(city?: string, maxResults = 10): Promise<Listing[]> {
  let q = query(
    collection(db, COLLECTION),
    where('isActive', '==', true),
    where('isFeatured', '==', true),
    where('isApproved', '==', true),
    orderBy('updatedAt', 'desc'),
    limit(maxResults),
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data() as Listing);
}

/**
 * Get recommendations based on category and user favorites.
 */
export async function getRecommendations(categoryIds: string[], excludeSellerId?: string, maxResults = 10): Promise<Listing[]> {
  const all: Listing[] = [];
  for (const catId of categoryIds.slice(0, 3)) {
    const { listings } = await searchListings({ categoryId: catId, maxResults: 5 });
    all.push(...listings);
  }
  return all
    .filter(l => l.sellerId !== excludeSellerId)
    .sort((a, b) => b.stats.transactions - a.stats.transactions)
    .slice(0, maxResults);
}

/**
 * Update a listing.
 */
export async function updateListing(id: string, data: Partial<Omit<Listing, 'id' | 'stats' | 'createdAt'>>): Promise<void> {
  const ref = doc(db, COLLECTION, id);
  await updateDoc(ref, { ...data, updatedAt: new Date().toISOString() });
}

/**
 * Deactivate a listing (soft delete).
 */
export async function deactivateListing(id: string): Promise<void> {
  await updateDoc(doc(db, COLLECTION, id), { isActive: false, updatedAt: new Date().toISOString() });
}

/**
 * Increment view count.
 */
export async function incrementViews(id: string): Promise<void> {
  await updateDoc(doc(db, COLLECTION, id), { 'stats.views': increment(1) });
}
