/**
 * @file SellerStorefront.tsx
 * @description Mini-tienda pública del vendedor — grid de productos, filtro por categoría,
 * compartir tienda, seguir/dejar de seguir. Patrón visual basado en SellerProfile.
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db } from '../services/firebase';
import { getCategory } from '../services/categoryService';
import { useAuth } from '../context/AuthContext';
import { useFollow } from '../hooks/useFollow';
import { formatCOP } from '../config/constants';
import {
  Store,
  MapPin,
  Package,
  Share2,
  Heart,
  Star,
  BadgeCheck,
  ArrowLeft,
  Loader2,
} from 'lucide-react';
import { TierBadge } from '../components/ui';
import type { Seller, Listing, SellerType } from '../types';

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Mapea SellerType a un emoji representativo. */
const TYPE_ICONS: Record<SellerType, string> = {
  food: '🍽️',
  retail: '🛍️',
  service: '🛠️',
  digital: '💻',
  individual: '👤',
};

/** Convierte el campo subscription del Seller a tier de TierBadge. */
function subscriptionToTier(
  subscription: string,
): 'free' | 'pro' | 'black' {
  if (subscription.includes('annual')) return 'black';
  if (subscription.includes('monthly')) return 'pro';
  return 'free';
}

// ─── Constants ──────────────────────────────────────────────────────────────

const LISTINGS_LIMIT = 30;

// ─── Component ──────────────────────────────────────────────────────────────

const SellerStorefront: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();
  const { isFollowing, followerCount, toggleFollow } = useFollow(user?.id, id);

  const [seller, setSeller] = useState<Seller | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [categoryNames, setCategoryNames] = useState<Record<string, string>>({});
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [shareCopied, setShareCopied] = useState(false);

  // ─── Fetch seller + listings ──────────────────────────────────────────

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        // Cargar seller desde Firestore
        const { getSeller } = await import('../services/sellerService');
        const s = await getSeller(id);
        if (cancelled) return;
        setSeller(s);

        if (!s) {
          setLoading(false);
          return;
        }

        // Cargar listings activos del seller
        const lq = query(
          collection(db, 'listings'),
          where('sellerId', '==', id),
          where('isActive', '==', true),
          orderBy('createdAt', 'desc'),
          limit(LISTINGS_LIMIT),
        );
        const ls = await getDocs(lq);
        if (cancelled) return;
        const listingData = ls.docs.map(d => ({
          id: d.id,
          ...d.data(),
        } as Listing));
        setListings(listingData);

        // Resolver nombres de categorías para los categoryIds únicos
        const uniqueCategoryIds = Array.from(
          new Set(listingData.map(l => l.categoryId).filter(Boolean)),
        );
        const nameMap: Record<string, string> = {};
        await Promise.all(
          uniqueCategoryIds.map(async (cid) => {
            try {
              const cat = await getCategory(cid);
              nameMap[cid] = cat?.name || cid;
            } catch {
              nameMap[cid] = cid;
            }
          }),
        );
        if (!cancelled) setCategoryNames(nameMap);
      } catch (e) {
        console.error('SellerStorefront error:', e);
      }
      if (!cancelled) setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  // ─── Derived ──────────────────────────────────────────────────────────

  const uniqueCategories = useMemo(() => {
    const idSet = new Set(listings.map(l => l.categoryId).filter(Boolean));
    return Array.from(idSet);
  }, [listings]);

  const filteredListings = useMemo(() => {
    if (!selectedCategoryId) return listings;
    return listings.filter(l => l.categoryId === selectedCategoryId);
  }, [listings, selectedCategoryId]);

  // ─── Handlers ─────────────────────────────────────────────────────────

  const handleShare = useCallback(async () => {
    if (!id) return;
    const url = `${window.location.origin}/seller/${id}`;
    try {
      await navigator.clipboard.writeText(url);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    } catch {
      // Fallback: prompt manual copy
      prompt('Copia este enlace para compartir:', url);
    }
  }, [id]);

  // ─── Loading ──────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-bg dark:bg-gray-900 flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-purple-600" />
      </div>
    );
  }

  // ─── 404 ──────────────────────────────────────────────────────────────

  if (!seller) {
    return (
      <div className="min-h-screen bg-brand-bg dark:bg-gray-900 flex flex-col items-center justify-center p-8 text-center">
        <span className="text-6xl mb-4">🏪</span>
        <h2 className="text-lg font-extrabold mb-2 text-text-primary dark:text-slate-100">
          Tienda no encontrada
        </h2>
        <button
          onClick={() => navigate('/')}
          className="text-purple-600 font-bold text-sm hover:underline"
        >
          Volver al inicio
        </button>
      </div>
    );
  }

  // ─── Render ───────────────────────────────────────────────────────────

  return (
    <div className="pb-24 bg-brand-bg dark:bg-gray-900 min-h-screen">
      {/* ── Cover ──────────────────────────────────────────────────── */}
      <div className="relative h-48 bg-gradient-to-br from-purple-600 via-indigo-600 to-purple-800 flex items-end p-6">
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative z-10 flex items-end gap-4">
          {/* Logo / Type emoji */}
          <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-4xl shadow-lg">
            {seller.logo || TYPE_ICONS[seller.type] || '🏪'}
          </div>
          <div className="mb-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold text-white">
                {seller.name}
              </h1>
              {seller.isVerified && (
                <BadgeCheck size={18} className="text-blue-300" />
              )}
              <TierBadge
                tier={subscriptionToTier(seller.subscription)}
                size="sm"
              />
            </div>
            <div className="flex items-center gap-3 mt-1 text-sm text-white/80">
              <span className="flex items-center gap-1">
                <Star
                  size={14}
                  className="text-amber-300 fill-amber-300"
                />
                {seller.rating || 'Nuevo'}
              </span>
              {seller.location?.city && (
                <span className="flex items-center gap-1">
                  <MapPin size={14} />
                  {seller.location.city}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Package size={14} />
                {listings.length} productos
              </span>
            </div>
          </div>
        </div>

        {/* Follow + Share buttons */}
        <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
          {/* Share */}
          <button
            onClick={handleShare}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-bold bg-white/20 text-white border border-white/30 hover:bg-white/30 transition-all"
          >
            <Share2 size={14} />
            {shareCopied ? '¡Copiado!' : t('seller.shareStore')}
          </button>

          {/* Follow */}
          {user && id && user.id !== seller.ownerId && (
            <button
              onClick={toggleFollow}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                isFollowing
                  ? 'bg-white/20 text-white border border-white/30'
                  : 'bg-white text-purple-700 shadow-md'
              }`}
            >
              <Heart
                size={14}
                className={isFollowing ? 'fill-white' : ''}
              />
              {isFollowing ? t('seller.following') : t('seller.follow')}
              {followerCount > 0 && (
                <span className="ml-1 opacity-70">· {followerCount}</span>
              )}
            </button>
          )}
        </div>
      </div>

      {/* ── Sticky header ──────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-b border-border dark:border-slate-700 px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-colors"
          >
            <ArrowLeft size={22} />
          </button>
          <h1 className="text-lg font-extrabold truncate text-text-primary dark:text-slate-100">
            Tienda de {seller.name}
          </h1>
        </div>
      </header>

      {/* ── Main ───────────────────────────────────────────────────── */}
      <main className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-border dark:border-slate-700 p-4 text-center">
            <div className="text-lg font-extrabold text-purple-700 dark:text-purple-400">
              {followerCount}
            </div>
            <div className="text-[10px] text-text-muted dark:text-slate-400 font-semibold">
              {t('follow.followers', { count: followerCount })}
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-border dark:border-slate-700 p-4 text-center">
            <div className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400">
              {listings.length}
            </div>
            <div className="text-[10px] text-text-muted dark:text-slate-400 font-semibold">
              {t('seller.products', { count: listings.length })}
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-border dark:border-slate-700 p-4 text-center">
            <div className="text-lg font-extrabold text-amber-500">
              {seller.rating || '—'}
            </div>
            <div className="text-[10px] text-text-muted dark:text-slate-400 font-semibold">
              Calificación
            </div>
          </div>
        </div>

        {/* Categories filter */}
        {uniqueCategories.length > 1 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <button
              onClick={() => setSelectedCategoryId(null)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                selectedCategoryId === null
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-800 border border-border dark:border-slate-700 text-text-secondary dark:text-slate-400 hover:border-purple-300 dark:hover:border-purple-600'
              }`}
            >
              Todos
            </button>
            {uniqueCategories.map(catId => (
              <button
                key={catId}
                onClick={() => setSelectedCategoryId(catId)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                  selectedCategoryId === catId
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'bg-white dark:bg-slate-800 border border-border dark:border-slate-700 text-text-secondary dark:text-slate-400 hover:border-purple-300 dark:hover:border-purple-600'
                }`}
              >
                {categoryNames[catId] || catId}
              </button>
            ))}
          </div>
        )}

        {/* Listings grid */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-extrabold text-text-primary dark:text-slate-100">
              Productos y servicios ({filteredListings.length})
            </h3>
          </div>

          {filteredListings.length === 0 ? (
            <p className="text-sm text-text-muted dark:text-slate-400 text-center py-8">
              {selectedCategoryId
                ? 'No hay productos en esta categoría.'
                : t('seller.noActiveListings')}
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {filteredListings.map(l => (
                <div
                  key={l.id}
                  onClick={() => navigate(`/listing/${l.id}`)}
                  className="bg-white dark:bg-slate-800 rounded-xl border border-border dark:border-slate-700 overflow-hidden hover:shadow-lg hover:border-purple-200 dark:hover:border-purple-500 transition-all cursor-pointer active:scale-[0.98]"
                >
                  {/* Image / emoji placeholder */}
                  <div className="h-28 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center">
                    {l.images?.[0] ? (
                      <img
                        src={l.images[0]}
                        alt={l.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <span className="text-4xl">
                        {l.type === 'service'
                          ? '🛠️'
                          : l.type === 'digital'
                            ? '📱'
                            : '📦'}
                      </span>
                    )}
                    {l.discountPercent ? (
                      <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded-full text-[10px] font-extrabold bg-red-500 text-white shadow-sm">
                        -{l.discountPercent}%
                      </span>
                    ) : null}
                  </div>
                  <div className="p-3">
                    <h4 className="text-xs font-extrabold text-text-primary dark:text-slate-100 truncate mb-1">
                      {l.title}
                    </h4>
                    <div className="text-sm font-extrabold text-purple-700 dark:text-purple-400">
                      {formatCOP(l.price)}
                    </div>
                    <div className="flex items-center gap-1 mt-1.5 pt-1.5 border-t border-gray-100 dark:border-slate-700">
                      <Star
                        size={11}
                        className="text-amber-400 fill-amber-400"
                      />
                      <span className="text-[10px] text-text-muted dark:text-slate-400 font-bold">
                        {l.stats?.rating || 'Nuevo'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default SellerStorefront;
