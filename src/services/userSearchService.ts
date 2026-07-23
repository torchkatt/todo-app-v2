/**
 * @file userSearchService.ts
 * @description Búsqueda de usuarios para iniciar conversaciones P2P.
 */
import { db } from './firebase';
import {
  collection, getDocs,
  query, where, orderBy, limit,
  doc, getDoc,
} from 'firebase/firestore';
import type { User } from '../types';

export const userSearchService = {
  /**
   * Buscar usuarios por nombre o email (client-side).
   * Firestore no tiene full-text search, así que traemos usuarios activos
   * y filtramos en cliente. Para producción, idealmente con Algolia/Typesense.
   */
  async search(query_text: string, currentUserId: string, max = 20): Promise<User[]> {
    const q = query(
      collection(db, 'users'),
      where('isActive', '==', true),
      orderBy('createdAt', 'desc'),
      limit(50),
    );
    const snap = await getDocs(q);

    const term = query_text.toLowerCase().trim();
    const results = snap.docs
      .map(d => ({ ...d.data(), id: d.id } as User))
      .filter(u => {
        if (u.id === currentUserId) return false; // No mostrarse a sí mismo
        if (!term) return true;
        return (
          u.fullName?.toLowerCase().includes(term) ||
          u.email?.toLowerCase().includes(term)
        );
      })
      .slice(0, max);

    return results;
  },

  /**
   * Obtener usuario por ID (para mostrar datos al iniciar chat).
   */
  async getUserById(userId: string): Promise<User | null> {
    const snap = await getDoc(doc(db, 'users', userId));
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as User;
  },
};
