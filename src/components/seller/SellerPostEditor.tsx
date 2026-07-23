/**
 * @file SellerPostEditor.tsx
 * @description Modal/Sheet para crear publicaciones de contenido de vendedor.
 * Permite título, contenido, URLs de imágenes y vincular listings activos.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db } from '../../services/firebase';
import { sellerContentService, SellerPostMedia } from '../../services/sellerContentService';
import { Image, Send, X, Plus, Loader2 } from 'lucide-react';
import type { Listing } from '../../types';

// ─── Props ──────────────────────────────────────────────────────────────────

export interface SellerPostEditorProps {
  /** ID del vendedor que crea el post */
  sellerId: string;
  /** Callback al cerrar el modal */
  onClose: () => void;
  /** Callback opcional cuando el post se crea exitosamente */
  onCreated?: (postId: string) => void;
}

// ─── Component ──────────────────────────────────────────────────────────────

const SellerPostEditor: React.FC<SellerPostEditorProps> = ({
  sellerId,
  onClose,
  onCreated,
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [media, setMedia] = useState<SellerPostMedia[]>([]);
  const [selectedListingIds, setSelectedListingIds] = useState<string[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loadingListings, setLoadingListings] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ─── Fetch active listings ────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const q = query(
          collection(db, 'listings'),
          where('sellerId', '==', sellerId),
          where('isActive', '==', true),
          orderBy('createdAt', 'desc'),
          limit(50),
        );
        const snap = await getDocs(q);
        if (!cancelled) {
          setListings(snap.docs.map(d => ({ id: d.id, ...d.data() } as Listing)));
        }
      } catch (e) {
        console.error('Error fetching listings for post editor:', e);
      } finally {
        if (!cancelled) setLoadingListings(false);
      }
    })();
    return () => { cancelled = true; };
  }, [sellerId]);

  // ─── Media handlers ───────────────────────────────────────────────────

  const addImage = useCallback(() => {
    const url = imageUrl.trim();
    if (!url) return;
    setMedia(prev => [...prev, { type: 'image' as const, url }]);
    setImageUrl('');
  }, [imageUrl]);

  const removeMedia = useCallback((index: number) => {
    setMedia(prev => prev.filter((_, i) => i !== index));
  }, []);

  // ─── Listing toggle ───────────────────────────────────────────────────

  const toggleListing = useCallback((listingId: string) => {
    setSelectedListingIds(prev =>
      prev.includes(listingId)
        ? prev.filter(id => id !== listingId)
        : [...prev, listingId],
    );
  }, []);

  // ─── Submit ───────────────────────────────────────────────────────────

  const handleSubmit = useCallback(async () => {
    if (!title.trim()) {
      setError('El título es obligatorio');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const postId = await sellerContentService.createPost(
        sellerId,
        title.trim(),
        content.trim(),
        selectedListingIds,
        media,
      );
      onCreated?.(postId);
      onClose();
    } catch (e) {
      console.error('Error creating post:', e);
      setError('Error al crear la publicación. Intenta de nuevo.');
    } finally {
      setSubmitting(false);
    }
  }, [sellerId, title, content, selectedListingIds, media, onCreated, onClose]);

  // ─── Render ───────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="relative z-10 w-full sm:max-w-lg max-h-[90vh] bg-white dark:bg-slate-800 rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border dark:border-slate-700">
          <h2 className="text-base font-extrabold text-text-primary dark:text-slate-100">
            Nueva publicación
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-colors"
          >
            <X size={20} className="text-text-secondary dark:text-slate-400" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-extrabold text-text-primary dark:text-slate-200 mb-1.5">
              Título
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Ej: ¡Nuevos productos disponibles!"
              className="w-full px-3 py-2.5 rounded-xl border border-border dark:border-slate-600 bg-white dark:bg-slate-700 text-sm text-text-primary dark:text-slate-100 placeholder:text-text-muted dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 transition-all"
              maxLength={200}
            />
          </div>

          {/* Content */}
          <div>
            <label className="block text-xs font-extrabold text-text-primary dark:text-slate-200 mb-1.5">
              Contenido
            </label>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Escribe el contenido de tu publicación..."
              rows={4}
              className="w-full px-3 py-2.5 rounded-xl border border-border dark:border-slate-600 bg-white dark:bg-slate-700 text-sm text-text-primary dark:text-slate-100 placeholder:text-text-muted dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 transition-all resize-none"
              maxLength={2000}
            />
          </div>

          {/* Image URL input */}
          <div>
            <label className="block text-xs font-extrabold text-text-primary dark:text-slate-200 mb-1.5">
              <Image size={14} className="inline mr-1" />
              Imagen (URL)
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={imageUrl}
                onChange={e => setImageUrl(e.target.value)}
                placeholder="https://ejemplo.com/imagen.jpg"
                className="flex-1 px-3 py-2.5 rounded-xl border border-border dark:border-slate-600 bg-white dark:bg-slate-700 text-sm text-text-primary dark:text-slate-100 placeholder:text-text-muted dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 transition-all"
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addImage();
                  }
                }}
              />
              <button
                onClick={addImage}
                disabled={!imageUrl.trim()}
                className="px-3 py-2.5 rounded-xl bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-900/50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <Plus size={18} />
              </button>
            </div>

            {/* Media previews */}
            {media.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {media.map((m, i) => (
                  <div
                    key={i}
                    className="relative group w-16 h-16 rounded-lg overflow-hidden border border-border dark:border-slate-600 bg-gray-100 dark:bg-slate-700"
                  >
                    <img
                      src={m.url}
                      alt={`Media ${i + 1}`}
                      className="w-full h-full object-cover"
                      onError={e => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                    <button
                      onClick={() => removeMedia(i)}
                      className="absolute top-0.5 right-0.5 p-0.5 bg-black/60 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Link listings */}
          <div>
            <label className="block text-xs font-extrabold text-text-primary dark:text-slate-200 mb-2">
              Vincular productos ({selectedListingIds.length} seleccionados)
            </label>
            {loadingListings ? (
              <div className="flex items-center gap-2 text-sm text-text-muted dark:text-slate-400 py-2">
                <Loader2 size={16} className="animate-spin" />
                Cargando productos...
              </div>
            ) : listings.length === 0 ? (
              <p className="text-xs text-text-muted dark:text-slate-500 py-2">
                No tienes productos activos para vincular.
              </p>
            ) : (
              <div className="max-h-40 overflow-y-auto space-y-1.5 rounded-xl border border-border dark:border-slate-600 p-2 bg-gray-50 dark:bg-slate-900/40">
                {listings.map(l => (
                  <label
                    key={l.id}
                    className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700/50 cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selectedListingIds.includes(l.id)}
                      onChange={() => toggleListing(l.id)}
                      className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500 accent-purple-600"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-text-primary dark:text-slate-200 truncate">
                        {l.title}
                      </div>
                      <div className="text-[10px] text-text-muted dark:text-slate-500">
                        ${l.price.toLocaleString('es-CO')}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="px-3 py-2 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-xs font-bold text-red-600 dark:text-red-400">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-border dark:border-slate-700">
          <button
            onClick={handleSubmit}
            disabled={submitting || !title.trim()}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
          >
            {submitting ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Send size={18} />
            )}
            {submitting ? 'Publicando...' : 'Publicar'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SellerPostEditor;
