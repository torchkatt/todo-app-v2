import { collection, doc, getDoc, getDocs, setDoc, updateDoc, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from './firebase';
import { CATEGORY_SEED } from './categorySeed';
import type { Category } from '../types';

const COLLECTION = 'categories';

/**
 * Seed the categories collection from the static seed file.
 * Only creates categories that don't already exist.
 */
export async function seedCategories(): Promise<number> {
  let created = 0;
  for (const cat of CATEGORY_SEED) {
    const ref = doc(db, COLLECTION, cat.id);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, {
        ...cat,
        stats: { sellerCount: 0, listingCount: 0, transactionCount: 0 },
      });
      created++;
    }
  }
  return created; // 0 = already seeded
}

/**
 * Get a single category by ID.
 */
export async function getCategory(id: string): Promise<Category | null> {
  const snap = await getDoc(doc(db, COLLECTION, id));
  return snap.exists() ? (snap.data() as Category) : null;
}

/**
 * Get all root categories (level 0, active).
 */
export async function getRootCategories(): Promise<Category[]> {
  const q = query(
    collection(db, COLLECTION),
    where('level', '==', 0),
    where('isActive', '==', true),
    orderBy('order'),
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data() as Category);
}

/**
 * Get subcategories for a parent.
 */
export async function getSubcategories(parentId: string): Promise<Category[]> {
  const q = query(
    collection(db, COLLECTION),
    where('parentId', '==', parentId),
    where('isActive', '==', true),
    orderBy('order'),
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data() as Category);
}

/**
 * Get full category breadcrumbs from leaf to root.
 */
export async function getBreadcrumb(categoryId: string): Promise<Pick<Category, 'id' | 'name' | 'slug'>[]> {
  const breadcrumb: Pick<Category, 'id' | 'name' | 'slug'>[] = [];
  let current = await getCategory(categoryId);
  while (current) {
    breadcrumb.unshift({ id: current.id, name: current.name, slug: current.slug });
    if (!current.parentId) break;
    current = await getCategory(current.parentId);
  }
  return breadcrumb;
}

/**
 * Search categories by name.
 */
export async function searchCategories(searchTerm: string, maxResults = 10): Promise<Category[]> {
  // Firestore doesn't support text search natively — filter client-side
  const snap = await getDocs(query(
    collection(db, COLLECTION),
    where('isActive', '==', true),
    limit(50),
  ));
  const term = searchTerm.toLowerCase();
  return snap.docs
    .map(d => d.data() as Category)
    .filter(c => c.name.toLowerCase().includes(term) || c.slug.includes(term))
    .slice(0, maxResults);
}

/**
 * Update category stats (called after new listing/transaction).
 */
export async function incrementCategoryStats(categoryId: string, field: 'listingCount' | 'sellerCount' | 'transactionCount', delta = 1): Promise<void> {
  const ref = doc(db, COLLECTION, categoryId);
  await updateDoc(ref, {
    [`stats.${field}`]: (await getDoc(ref)).data()?.stats?.[field] + delta || delta,
  });
}
