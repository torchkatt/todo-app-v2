import { useQuery } from '@tanstack/react-query';
import { collection, getDocs, query, where, orderBy, limit, documentId } from 'firebase/firestore';
import { db } from '../services/firebase';
import type { Listing, Seller, Category } from '../types';

// Firestore 'in' admite hasta 30 valores por query.
const IN_QUERY_CHUNK = 30;
function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export function useFeaturedListings() {
  const { data, isLoading } = useQuery({
    queryKey: ['listings', 'featured'],
    queryFn: async () => {
      const q = query(collection(db, 'listings'), where('isActive', '==', true), where('isFeatured', '==', true), where('isApproved', '==', true), orderBy('createdAt', 'desc'), limit(6));
      const snap = await getDocs(q);
      return snap.docs.map(d => d.data() as Listing);
    },
  });
  return { data: data ?? [], loading: isLoading };
}

export function useCategories() {
  const { data, isLoading } = useQuery({
    queryKey: ['categories', 'root'],
    queryFn: async () => {
      const q = query(collection(db, 'categories'), where('level', '==', 0), where('isActive', '==', true), orderBy('order'), limit(20));
      const snap = await getDocs(q);
      return snap.docs.map(d => d.data() as Category);
    },
  });
  return { data: data ?? [], loading: isLoading };
}

export function useSubcategories(parentId: string | null) {
  const { data } = useQuery({
    queryKey: ['categories', 'sub', parentId],
    queryFn: async () => {
      const q = query(collection(db, 'categories'), where('parentId', '==', parentId), where('isActive', '==', true), orderBy('order'), limit(20));
      const snap = await getDocs(q);
      return snap.docs.map(d => d.data() as Category);
    },
    enabled: !!parentId,
  });
  return data ?? [];
}

export function useSellersByIds(ids: string[]) {
  const sortedIds = [...ids].sort();
  const { data } = useQuery({
    queryKey: ['sellers', 'byIds', sortedIds],
    queryFn: async () => {
      const result: Record<string, Seller> = {};
      const batches = await Promise.all(
        chunk(sortedIds, IN_QUERY_CHUNK).map(batchIds => {
          const q = query(collection(db, 'sellers'), where(documentId(), 'in', batchIds));
          return getDocs(q);
        })
      );
      for (const snap of batches) {
        snap.docs.forEach(d => { result[d.id] = d.data() as Seller; });
      }
      return result;
    },
    enabled: sortedIds.length > 0,
  });
  return data ?? {};
}
