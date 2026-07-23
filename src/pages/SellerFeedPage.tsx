/**
 * @file SellerFeedPage.tsx
 * @description Feed de contenido de vendedores seguidos.
 * Muestra publicaciones de todos los sellers que el usuario sigue,
 * ordenadas por fecha de publicación (más reciente primero).
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { followService } from '../services/followService';
import { sellerContentService } from '../services/sellerContentService';
import { ArrowLeft, Loader2, Store } from 'lucide-react';
import FeedPostCard from '../components/seller/FeedPostCard';
import type { SellerPost } from '../types';

// ─── Skeleton ────────────────────────────────────────────────────────────────

const PostSkeleton: React.FC = () => (
  <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-border dark:border-slate-700 overflow-hidden animate-pulse">
    {/* Header skeleton */}
    <div className="flex items-center gap-3 px-4 pt-4 pb-3">
      <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-slate-600" />
      <div className="flex-1 space-y-2">
        <div className="w-32 h-3 bg-gray-200 dark:bg-slate-600 rounded" />
        <div className="w-20 h-2.5 bg-gray-200 dark:bg-slate-600 rounded" />
      </div>
    </div>
    {/* Image skeleton */}
    <div className="w-full aspect-video bg-gray-200 dark:bg-slate-600" />
    {/* Content skeleton */}
    <div className="px-4 py-3 space-y-2">
      <div className="w-3/4 h-4 bg-gray-200 dark:bg-slate-600 rounded" />
      <div className="w-full h-3 bg-gray-200 dark:bg-slate-600 rounded" />
      <div className="w-2/3 h-3 bg-gray-200 dark:bg-slate-600 rounded" />
    </div>
  </div>
);

// ─── Component ───────────────────────────────────────────────────────────────

const SellerFeedPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [posts, setPosts] = useState<SellerPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setError(null);

        // 1. Obtener sellers seguidos
        const sellerIds = await followService.getFollowedSellers(user.id);

        if (sellerIds.length === 0) {
          if (!cancelled) {
            setPosts([]);
            setLoading(false);
          }
          return;
        }

        // 2. Obtener posts de cada seller en paralelo
        const postsArrays = await Promise.all(
          sellerIds.map(sid =>
            sellerContentService.getPosts(sid, 10).catch((e) => {
              console.error(`Error fetching posts for seller ${sid}:`, e);
              return [] as SellerPost[];
            })
          )
        );

        if (cancelled) return;

        // 3. Flatten y ordenar por publishedAt desc (más reciente primero)
        const allPosts = postsArrays
          .flat()
          .filter(p => p.isPublished)
          .sort((a, b) => {
            const dateA = a.publishedAt || a.createdAt || '';
            const dateB = b.publishedAt || b.createdAt || '';
            return new Date(dateB).getTime() - new Date(dateA).getTime();
          });

        setPosts(allPosts);
      } catch (e) {
        console.error('Error loading feed:', e);
        if (!cancelled) setError('Error al cargar el feed. Intenta de nuevo.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [user?.id]);

  const handleViewListing = (id: string) => {
    navigate(`/listing/${id}`);
  };

  // ─── Not authenticated ────────────────────────────────────────────────

  if (!user || user.isGuest) {
    return (
      <div className="min-h-screen bg-brand-bg dark:bg-gray-900">
        {/* Header */}
        <div className="sticky top-0 z-20 bg-white/90 dark:bg-slate-800/90 backdrop-blur-lg border-b border-border dark:border-slate-700">
          <div className="flex items-center gap-3 px-4 py-3 max-w-2xl mx-auto">
            <button
              onClick={() => navigate(-1)}
              className="p-1.5 -ml-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-colors"
            >
              <ArrowLeft size={20} className="text-text-primary dark:text-slate-200" />
            </button>
            <h1 className="text-lg font-extrabold text-text-primary dark:text-slate-100">
              Feed
            </h1>
          </div>
        </div>

        <div className="max-w-xl mx-auto px-4 py-16 text-center">
          <Store size={48} className="mx-auto text-text-muted dark:text-slate-500 mb-4" />
          <p className="text-sm font-bold text-text-muted dark:text-slate-400">
            Inicia sesión para ver contenido de los vendedores que sigues
          </p>
          <button
            onClick={() => navigate('/login')}
            className="mt-4 px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-sm transition-all active:scale-[0.98]"
          >
            Iniciar sesión
          </button>
        </div>
      </div>
    );
  }

  // ─── Loading ───────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-bg dark:bg-gray-900">
        {/* Header */}
        <div className="sticky top-0 z-20 bg-white/90 dark:bg-slate-800/90 backdrop-blur-lg border-b border-border dark:border-slate-700">
          <div className="flex items-center gap-3 px-4 py-3 max-w-2xl mx-auto">
            <button
              onClick={() => navigate(-1)}
              className="p-1.5 -ml-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-colors"
            >
              <ArrowLeft size={20} className="text-text-primary dark:text-slate-200" />
            </button>
            <h1 className="text-lg font-extrabold text-text-primary dark:text-slate-100">
              Feed
            </h1>
          </div>
        </div>

        <div className="max-w-xl mx-auto px-4 py-4 space-y-4">
          <PostSkeleton />
          <PostSkeleton />
          <PostSkeleton />
        </div>
      </div>
    );
  }

  // ─── Error ─────────────────────────────────────────────────────────────

  if (error) {
    return (
      <div className="min-h-screen bg-brand-bg dark:bg-gray-900">
        {/* Header */}
        <div className="sticky top-0 z-20 bg-white/90 dark:bg-slate-800/90 backdrop-blur-lg border-b border-border dark:border-slate-700">
          <div className="flex items-center gap-3 px-4 py-3 max-w-2xl mx-auto">
            <button
              onClick={() => navigate(-1)}
              className="p-1.5 -ml-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-colors"
            >
              <ArrowLeft size={20} className="text-text-primary dark:text-slate-200" />
            </button>
            <h1 className="text-lg font-extrabold text-text-primary dark:text-slate-100">
              Feed
            </h1>
          </div>
        </div>

        <div className="max-w-xl mx-auto px-4 py-16 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-50 dark:bg-red-900/20 mb-4">
            <span className="text-2xl">😔</span>
          </div>
          <p className="text-sm font-bold text-red-600 dark:text-red-400">{error}</p>
          <button
            onClick={() => { setLoading(true); setError(null); }}
            className="mt-4 px-4 py-2 rounded-xl bg-gray-100 dark:bg-slate-700 text-text-primary dark:text-slate-200 font-bold text-sm hover:bg-gray-200 dark:hover:bg-slate-600 transition-all"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  // ─── Empty ─────────────────────────────────────────────────────────────

  if (posts.length === 0) {
    return (
      <div className="min-h-screen bg-brand-bg dark:bg-gray-900">
        {/* Header */}
        <div className="sticky top-0 z-20 bg-white/90 dark:bg-slate-800/90 backdrop-blur-lg border-b border-border dark:border-slate-700">
          <div className="flex items-center gap-3 px-4 py-3 max-w-2xl mx-auto">
            <button
              onClick={() => navigate(-1)}
              className="p-1.5 -ml-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-colors"
            >
              <ArrowLeft size={20} className="text-text-primary dark:text-slate-200" />
            </button>
            <h1 className="text-lg font-extrabold text-text-primary dark:text-slate-100">
              Feed
            </h1>
          </div>
        </div>

        <div className="max-w-xl mx-auto px-4 py-16 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-50 dark:bg-purple-900/20 mb-4">
            <Store size={32} className="text-purple-400 dark:text-purple-300" />
          </div>
          <p className="text-sm font-bold text-text-muted dark:text-slate-400">
            Sigue vendedores para ver su contenido aquí
          </p>
          <button
            onClick={() => navigate('/explore')}
            className="mt-4 px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-sm transition-all active:scale-[0.98]"
          >
            Explorar vendedores
          </button>
        </div>
      </div>
    );
  }

  // ─── Feed ──────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-brand-bg dark:bg-gray-900">
      {/* Sticky header */}
      <div className="sticky top-0 z-20 bg-white/90 dark:bg-slate-800/90 backdrop-blur-lg border-b border-border dark:border-slate-700">
        <div className="flex items-center gap-3 px-4 py-3 max-w-2xl mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="p-1.5 -ml-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-colors"
          >
            <ArrowLeft size={20} className="text-text-primary dark:text-slate-200" />
          </button>
          <h1 className="text-lg font-extrabold text-text-primary dark:text-slate-100">
            Feed
          </h1>
        </div>
      </div>

      {/* Posts list */}
      <div className="max-w-xl mx-auto px-4 py-4 space-y-4 pb-24">
        {posts.map(post => (
          <FeedPostCard
            key={post.id}
            post={post}
            onViewListing={handleViewListing}
          />
        ))}
      </div>
    </div>
  );
};

export default SellerFeedPage;
