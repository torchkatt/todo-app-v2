/**
 * @file FeedPostCard.tsx
 * @description Card para una publicación individual de un vendedor en el feed.
 * Muestra nombre del vendedor, título, contenido, primera imagen, listings vinculados
 * y fecha relativa.
 */

import React, { useState, useEffect } from 'react';
import { Heart, Clock, Image, MessageCircle, Store } from 'lucide-react';
import type { SellerPost, Seller } from '../../types';
import { getSeller } from '../../services/sellerService';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Convierte una fecha ISO a texto relativo en español. */
function timeAgo(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diffMs = now - then;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHrs = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHrs / 24);

  if (diffSec < 60) return 'ahora';
  if (diffMin < 60) return `hace ${diffMin}m`;
  if (diffHrs < 24) return `hace ${diffHrs}h`;
  if (diffDays === 1) return 'ayer';
  if (diffDays < 7) return `hace ${diffDays}d`;
  if (diffDays < 30) return `hace ${Math.floor(diffDays / 7)} sem`;
  if (diffDays < 365) return `hace ${Math.floor(diffDays / 30)} meses`;
  return `hace ${Math.floor(diffDays / 365)}a`;
}

// ─── Props ───────────────────────────────────────────────────────────────────

export interface FeedPostCardProps {
  /** Post del vendedor a mostrar */
  post: SellerPost;
  /** Callback al hacer clic en un listing vinculado */
  onViewListing?: (id: string) => void;
}

// ─── Component ───────────────────────────────────────────────────────────────

const FeedPostCard: React.FC<FeedPostCardProps> = ({ post, onViewListing }) => {
  const [seller, setSeller] = useState<Seller | null>(null);
  const [sellerLoading, setSellerLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const s = await getSeller(post.sellerId);
        if (!cancelled) setSeller(s);
      } catch (e) {
        console.error('Error fetching seller for post card:', e);
      } finally {
        if (!cancelled) setSellerLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [post.sellerId]);

  const firstImage = post.media?.find(m => m.type === 'image')?.url;
  const publishedDate = post.publishedAt || post.createdAt;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-border dark:border-slate-700 overflow-hidden hover:shadow-md transition-shadow">
      {/* Seller header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-extrabold text-sm flex-shrink-0">
          {sellerLoading ? (
            <Store size={16} className="animate-pulse" />
          ) : seller?.logo ? (
            <span>{seller.logo}</span>
          ) : (
            <Store size={16} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-extrabold text-text-primary dark:text-slate-100 truncate">
            {sellerLoading ? (
              <span className="inline-block w-24 h-3 bg-gray-200 dark:bg-slate-600 rounded animate-pulse" />
            ) : (
              seller?.name || post.sellerId
            )}
          </div>
          <div className="flex items-center gap-1 text-xs text-text-muted dark:text-slate-400">
            <Clock size={12} />
            <span>{timeAgo(publishedDate)}</span>
          </div>
        </div>
      </div>

      {/* Media — first image */}
      {firstImage && (
        <div className="relative w-full aspect-video bg-gray-100 dark:bg-slate-700 overflow-hidden">
          <img
            src={firstImage}
            alt={post.title}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={e => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>
      )}

      {/* Content */}
      <div className="px-4 py-3">
        <h3 className="text-base font-extrabold text-text-primary dark:text-slate-100 mb-1.5">
          {post.title}
        </h3>
        {post.content && (
          <p className="text-sm text-text-secondary dark:text-slate-300 leading-relaxed whitespace-pre-line">
            {post.content.length > 250
              ? `${post.content.slice(0, 250)}...`
              : post.content}
          </p>
        )}

        {/* Listing links */}
        {post.listingIds && post.listingIds.length > 0 && (
          <div className="mt-3 pt-3 border-t border-border dark:border-slate-700">
            <p className="text-xs font-bold text-text-muted dark:text-slate-400 mb-2 flex items-center gap-1">
              <Store size={12} />
              Productos ({post.listingIds.length})
            </p>
            <div className="flex flex-wrap gap-1.5">
              {post.listingIds.map(id => (
                <button
                  key={id}
                  onClick={() => onViewListing?.(id)}
                  className="px-2.5 py-1 rounded-full bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 text-xs font-bold hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors"
                >
                  Ver producto
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FeedPostCard;
