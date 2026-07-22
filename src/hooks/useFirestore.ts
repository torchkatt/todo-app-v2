import { useState, useEffect } from 'react';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '../services/firebase';
import type { Listing, Seller, Category } from '../types';

export function useFeaturedListings() {
  const [data, setData] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    (async () => {
      try {
        const q = query(collection(db, 'listings'), where('isActive', '==', true), where('isFeatured', '==', true), where('isApproved', '==', true), orderBy('createdAt', 'desc'), limit(6));
        const snap = await getDocs(q);
        setData(snap.docs.map(d => d.data() as Listing));
      } catch (e) { console.error('Failed to load featured', e); }
      setLoading(false);
    })();
  }, []);
  return { data, loading };
}

export function useCategories() {
  const [data, setData] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    (async () => {
      try {
        const q = query(collection(db, 'categories'), where('level', '==', 0), where('isActive', '==', true), orderBy('order'), limit(20));
        const snap = await getDocs(q);
        setData(snap.docs.map(d => d.data() as Category));
      } catch (e) { console.error('Failed to load categories', e); }
      setLoading(false);
    })();
  }, []);
  return { data, loading };
}

export function useSubcategories(parentId: string | null) {
  const [data, setData] = useState<Category[]>([]);
  useEffect(() => {
    if (!parentId) { setData([]); return; }
    (async () => {
      try {
        const q = query(collection(db, 'categories'), where('parentId', '==', parentId), where('isActive', '==', true), orderBy('order'), limit(20));
        const snap = await getDocs(q);
        setData(snap.docs.map(d => d.data() as Category));
      } catch (e) { console.error('Failed to load subcategories', e); }
    })();
  }, [parentId]);
  return data;
}

export function useSellersByIds(ids: string[]) {
  const [data, setData] = useState<Record<string, Seller>>({});
  useEffect(() => {
    if (!ids.length) return;
    (async () => {
      const result: Record<string, Seller> = {};
      for (const id of ids) {
        const q = query(collection(db, 'sellers'), where('__name__', '==', id), limit(1));
        const snap = await getDocs(q);
        if (!snap.empty) result[id] = snap.docs[0].data() as Seller;
      }
      setData(result);
    })();
  }, [JSON.stringify(ids)]);
  return data;
}
