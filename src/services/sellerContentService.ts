/**
 * @file sellerContentService.ts
 * @description Servicio para gestionar publicaciones de contenido de vendedores (seller posts).
 * Permite crear, obtener, publicar y eliminar posts asociados a una tienda.
 */

import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface SellerPostMedia {
  type: 'image' | 'video';
  url: string;
}

export interface SellerPost {
  id: string;
  sellerId: string;
  title: string;
  content: string;
  media: SellerPostMedia[];
  listingIds: string[];
  isPublished: boolean;
  publishedAt: string | null;
  createdAt: string;
}

// ─── Service ────────────────────────────────────────────────────────────────

const COLLECTION = 'seller_posts';

export const sellerContentService = {
  /**
   * Crea un nuevo post para un vendedor.
   * @returns El ID del post creado.
   */
  async createPost(
    sellerId: string,
    title: string,
    content: string,
    listingIds: string[] = [],
    media: SellerPostMedia[] = [],
  ): Promise<string> {
    const postData = {
      sellerId,
      title,
      content,
      media,
      listingIds,
      isPublished: true,
      publishedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    };
    const ref = await addDoc(collection(db, COLLECTION), postData);
    return ref.id;
  },

  /**
   * Obtiene todos los posts de un vendedor, ordenados por fecha de creación descendente.
   */
  async getPosts(sellerId: string, maxResults = 20): Promise<SellerPost[]> {
    const q = query(
      collection(db, COLLECTION),
      where('sellerId', '==', sellerId),
      orderBy('createdAt', 'desc'),
      limit(maxResults),
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as SellerPost));
  },

  /**
   * Publica un post existente (establece isPublished = true y publishedAt).
   */
  async publishPost(postId: string): Promise<void> {
    const ref = doc(db, COLLECTION, postId);
    await updateDoc(ref, {
      isPublished: true,
      publishedAt: serverTimestamp(),
    });
  },

  /**
   * Elimina un post.
   */
  async deletePost(postId: string): Promise<void> {
    const ref = doc(db, COLLECTION, postId);
    await deleteDoc(ref);
  },
};
