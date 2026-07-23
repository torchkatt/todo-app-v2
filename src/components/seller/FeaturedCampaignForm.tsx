/**
 * @file FeaturedCampaignForm.tsx
 * @description Formulario para crear campañas de listings destacados/patrocinados.
 * Permite seleccionar un listing, tipo de campaña (diaria/semanal/mensual),
 * y muestra las campañas activas actuales.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Star, Loader2, Calendar, DollarSign, Check, X, AlertCircle } from 'lucide-react';
import { featuredService } from '../../services/featuredService';
import { getListingsBySeller } from '../../services/listingService';
import { FEATURED_CONFIG } from '../../config/constants';
import type { Listing, FeaturedListing } from '../../types';

// ─── Campaign type options ───────────────────────────────────────────────────

const CAMPAIGN_TYPES = [
  {
    value: 'daily' as const,
    label: 'Diario',
    price: FEATURED_CONFIG.dailyPrice,
    icon: '📅',
    description: '1 día de visibilidad',
  },
  {
    value: 'weekly' as const,
    label: 'Semanal',
    price: FEATURED_CONFIG.weeklyPrice,
    icon: '📆',
    description: '7 días de visibilidad',
  },
  {
    value: 'monthly' as const,
    label: 'Mensual',
    price: FEATURED_CONFIG.monthlyPrice,
    icon: '🗓️',
    description: '30 días de visibilidad',
  },
] as const;

// ─── Props ───────────────────────────────────────────────────────────────────

export interface FeaturedCampaignFormProps {
  /** ID del vendedor */
  sellerId: string;
  /** Callback al completar exitosamente */
  onComplete?: () => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatCOP(amount: number): string {
  return `$${amount.toLocaleString('es-CO')}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

// ─── Component ───────────────────────────────────────────────────────────────

const FeaturedCampaignForm: React.FC<FeaturedCampaignFormProps> = ({
  sellerId,
  onComplete,
}) => {
  // ─── State ─────────────────────────────────────────────────────────────

  const [listings, setListings] = useState<Listing[]>([]);
  const [selectedListingId, setSelectedListingId] = useState('');
  const [campaignType, setCampaignType] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [activeCampaigns, setActiveCampaigns] = useState<FeaturedListing[]>([]);

  const [loadingListings, setLoadingListings] = useState(true);
  const [loadingCampaigns, setLoadingCampaigns] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // ─── Fetch data ────────────────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const [lsts, campaigns] = await Promise.all([
          getListingsBySeller(sellerId, 50),
          featuredService.getActiveCampaigns(sellerId),
        ]);
        if (!cancelled) {
          setListings(lsts);
          setActiveCampaigns(campaigns);
          if (lsts.length > 0 && !selectedListingId) {
            setSelectedListingId(lsts[0].id);
          }
        }
      } catch (e) {
        console.error('Error loading featured form data:', e);
        if (!cancelled) setError('Error al cargar datos. Intenta de nuevo.');
      } finally {
        if (!cancelled) {
          setLoadingListings(false);
          setLoadingCampaigns(false);
        }
      }
    };

    load();
    return () => { cancelled = true; };
  }, [sellerId]);

  // ─── Computed ──────────────────────────────────────────────────────────

  const selectedCampaign = CAMPAIGN_TYPES.find(ct => ct.value === campaignType)!;
  const canSubmit = selectedListingId && !submitting;
  const activeCount = activeCampaigns.length;
  const atMax = activeCount >= FEATURED_CONFIG.maxPerSeller;

  // ─── Submit ────────────────────────────────────────────────────────────

  const handleSubmit = useCallback(async () => {
    if (!selectedListingId) {
      setError('Selecciona un producto para destacar');
      return;
    }

    setError(null);
    setSuccess(null);
    setSubmitting(true);

    try {
      await featuredService.createCampaign(sellerId, selectedListingId, campaignType);
      setSuccess(`¡Campaña ${selectedCampaign.label.toLowerCase()} creada exitosamente!`);

      // Refrescar campañas activas
      const updated = await featuredService.getActiveCampaigns(sellerId);
      setActiveCampaigns(updated);

      onComplete?.();
    } catch (e: any) {
      console.error('Error creating featured campaign:', e);
      setError(e?.message || 'Error al crear la campaña. Intenta de nuevo.');
    } finally {
      setSubmitting(false);
    }
  }, [sellerId, selectedListingId, campaignType, selectedCampaign, onComplete]);

  // ─── Deactivate campaign ───────────────────────────────────────────────

  const handleDeactivate = useCallback(async (campaignId: string) => {
    try {
      await featuredService.deactivateCampaign(campaignId);
      setActiveCampaigns(prev => prev.filter(c => c.id !== campaignId));
      setSuccess('Campaña desactivada.');
    } catch (e) {
      console.error('Error deactivating campaign:', e);
      setError('Error al desactivar la campaña.');
    }
  }, []);

  // ─── Loading ───────────────────────────────────────────────────────────

  if (loadingListings && loadingCampaigns) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={24} className="animate-spin text-purple-500" />
        <span className="ml-2 text-sm text-text-muted dark:text-slate-400">Cargando...</span>
      </div>
    );
  }

  // ─── Render ────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Feedback */}
      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm font-bold text-red-600 dark:text-red-400">
          <AlertCircle size={18} />
          {error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-sm font-bold text-green-600 dark:text-green-400">
          <Check size={18} />
          {success}
        </div>
      )}

      {/* Campaign type selector */}
      <div>
        <label className="block text-xs font-extrabold text-text-primary dark:text-slate-200 mb-3">
          <Star size={14} className="inline mr-1 text-yellow-500" />
          Tipo de campaña
        </label>
        <div className="grid grid-cols-3 gap-2">
          {CAMPAIGN_TYPES.map(ct => (
            <button
              key={ct.value}
              onClick={() => setCampaignType(ct.value)}
              className={`flex flex-col items-center gap-1 px-3 py-3 rounded-xl border-2 transition-all ${
                campaignType === ct.value
                  ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300'
                  : 'border-border dark:border-slate-600 bg-white dark:bg-slate-800 text-text-secondary dark:text-slate-400 hover:border-purple-300 dark:hover:border-purple-600'
              }`}
            >
              <span className="text-xl">{ct.icon}</span>
              <span className="text-xs font-extrabold">{ct.label}</span>
              <span className="text-[10px] font-bold">{formatCOP(ct.price)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Listing selector */}
      <div>
        <label className="block text-xs font-extrabold text-text-primary dark:text-slate-200 mb-2">
          <DollarSign size={14} className="inline mr-1" />
          Producto a destacar
        </label>
        {loadingListings ? (
          <div className="flex items-center gap-2 text-sm text-text-muted dark:text-slate-400 py-2">
            <Loader2 size={16} className="animate-spin" />
            Cargando productos...
          </div>
        ) : listings.length === 0 ? (
          <p className="text-xs text-text-muted dark:text-slate-500 py-2">
            No tienes productos activos para destacar.
          </p>
        ) : (
          <select
            value={selectedListingId}
            onChange={e => setSelectedListingId(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-border dark:border-slate-600 bg-white dark:bg-slate-700 text-sm text-text-primary dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 transition-all"
          >
            <option value="" disabled>Selecciona un producto...</option>
            {listings.map(l => (
              <option key={l.id} value={l.id}>
                {l.title} — {formatCOP(l.price)}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Price summary */}
      <div className="px-4 py-3 rounded-xl bg-gray-50 dark:bg-slate-800/60 border border-border dark:border-slate-700">
        <div className="flex items-center justify-between text-sm">
          <span className="font-bold text-text-secondary dark:text-slate-400">
            Tipo seleccionado
          </span>
          <span className="font-extrabold text-text-primary dark:text-slate-200">
            {selectedCampaign.label}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm mt-2">
          <span className="font-bold text-text-secondary dark:text-slate-400">
            Precio
          </span>
          <span className="font-extrabold text-purple-600 dark:text-purple-400">
            {formatCOP(selectedCampaign.price)}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm mt-2">
          <span className="font-bold text-text-secondary dark:text-slate-400">
            Duración
          </span>
          <span className="font-extrabold text-text-primary dark:text-slate-200">
            {selectedCampaign.description}
          </span>
        </div>
      </div>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={!canSubmit || atMax}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
      >
        {submitting ? (
          <Loader2 size={18} className="animate-spin" />
        ) : (
          <Star size={18} />
        )}
        {atMax
          ? `Límite alcanzado (${FEATURED_CONFIG.maxPerSeller} máx.)`
          : submitting
            ? 'Creando campaña...'
            : `Crear campaña — ${formatCOP(selectedCampaign.price)}`}
      </button>

      {atMax && (
        <p className="text-xs text-center text-amber-600 dark:text-amber-400 font-bold">
          Has alcanzado el límite de {FEATURED_CONFIG.maxPerSeller} campañas activas.
          Desactiva una para crear una nueva.
        </p>
      )}

      {/* Active campaigns */}
      <div>
        <h3 className="text-sm font-extrabold text-text-primary dark:text-slate-200 mb-3 flex items-center gap-2">
          <Calendar size={16} />
          Campañas activas ({activeCount}/{FEATURED_CONFIG.maxPerSeller})
        </h3>

        {loadingCampaigns ? (
          <div className="flex items-center gap-2 text-sm text-text-muted dark:text-slate-400 py-2">
            <Loader2 size={16} className="animate-spin" />
            Cargando campañas...
          </div>
        ) : activeCampaigns.length === 0 ? (
          <p className="text-xs text-text-muted dark:text-slate-500 py-2">
            No tienes campañas activas. ¡Crea tu primera campaña destacada!
          </p>
        ) : (
          <div className="space-y-2">
            {activeCampaigns.map(c => (
              <div
                key={c.id}
                className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white dark:bg-slate-800 border border-border dark:border-slate-700"
              >
                <div className="w-10 h-10 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 flex items-center justify-center flex-shrink-0">
                  <Star size={18} className="text-yellow-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-extrabold text-text-primary dark:text-slate-200 truncate">
                    {c.campaignType === 'daily' ? 'Diaria' : c.campaignType === 'weekly' ? 'Semanal' : 'Mensual'}
                  </div>
                  <div className="text-[10px] text-text-muted dark:text-slate-400 flex items-center gap-2">
                    <Calendar size={10} />
                    <span>
                      {formatDate(c.startDate)} — {formatDate(c.endDate)}
                    </span>
                  </div>
                  <div className="text-[10px] text-text-muted dark:text-slate-400 flex items-center gap-2 mt-0.5">
                    <span>👁 {c.impressions} impresiones</span>
                    <span>👆 {c.clicks} clics</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-xs font-extrabold text-purple-600 dark:text-purple-400">
                    {formatCOP(c.budget)}
                  </span>
                  <button
                    onClick={() => handleDeactivate(c.id)}
                    className="p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
                    title="Desactivar campaña"
                  >
                    <X size={14} className="text-red-400 hover:text-red-600 dark:hover:text-red-300" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FeaturedCampaignForm;
