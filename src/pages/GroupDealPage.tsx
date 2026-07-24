import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft, Heart, Gift, Clock, Users,  Loader2, Zap,
  BadgeCheck, AlertCircle,
} from 'lucide-react';
import { groupDealService } from '../services/groupDealService';
import { useAuth } from '../context/AuthContext';
import SEO from '../components/seo/SEO';
import ShareDealSheet from '../components/social/ShareDealSheet';
import type { GroupDeal, GroupDealParticipant } from '../types';

// ─── Countdown hook ────────────────────────────────────────────────────────

function useCountdown(expiresAt: string): { hours: number; minutes: number; seconds: number; expired: boolean } {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const diff = new Date(expiresAt).getTime() - now;
  if (diff <= 0) return { hours: 0, minutes: 0, seconds: 0, expired: true };

  return {
    hours: Math.floor(diff / (1000 * 60 * 60)),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
    expired: false,
  };
}

// ─── Participant avatar helper ─────────────────────────────────────────────

const participantColors = [
  'bg-purple-500', 'bg-indigo-500', 'bg-pink-500', 'bg-blue-500',
  'bg-teal-500', 'bg-orange-500', 'bg-red-500', 'bg-green-500',
];

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(w => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

// ─── Status badge ──────────────────────────────────────────────────────────

const StatusBadge: React.FC<{ status: GroupDeal['status'] }> = ({ status }) => {
  const map: Record<GroupDeal['status'], { label: string; className: string; icon: React.ReactNode }> = {
    ACTIVE: { label: 'Activo', className: 'bg-green-100 text-green-700', icon: <Zap size={12} /> },
    COMPLETED: { label: 'Completado 🎉', className: 'bg-purple-100 text-purple-700', icon: <BadgeCheck size={12} /> },
    EXPIRED: { label: 'Expirado', className: 'bg-gray-100 text-gray-500', icon: <Clock size={12} /> },
    CANCELLED: { label: 'Cancelado', className: 'bg-red-100 text-red-500', icon: <AlertCircle size={12} /> },
  };
  const m = map[status];
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-extrabold ${m.className}`}>
      {m.icon} {m.label}
    </span>
  );
};

// ─── Page ──────────────────────────────────────────────────────────────────

const GroupDealPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [deal, setDeal] = useState<GroupDeal | null>(null);
  const [participants, setParticipants] = useState<GroupDealParticipant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [showShareSheet, setShowShareSheet] = useState(false);

  const countdown = useCountdown(deal?.expiresAt || '');

  // ─── Fetch deal + participants ───────────────────────────────────────────

  const loadDeal = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const d = await groupDealService.getDeal(id);
      if (!d) { setDeal(null); setLoading(false); return; }
      setDeal(d);

      // Auto-expire if past expiration
      if (d.status === 'ACTIVE' && new Date(d.expiresAt) < new Date()) {
        setDeal(prev => prev ? { ...prev, status: 'EXPIRED' } : prev);
      }

      const p = await groupDealService.getParticipants(id);
      setParticipants(p);
    } catch (e: any) {
      console.error('GroupDealPage error', e);
      setError(e.message || 'Error al cargar la oferta');
    }
    setLoading(false);
  }, [id]);

  useEffect(() => { loadDeal(); }, [loadDeal]);

  // ─── Join handler ────────────────────────────────────────────────────────

  const handleJoin = async () => {
    if (!id || !user) return;
    setJoining(true);
    setJoinError(null);
    try {
      const updated = await groupDealService.join(id, user.id);
      setDeal(updated);
      const p = await groupDealService.getParticipants(id);
      setParticipants(p);
    } catch (e: any) {
      setJoinError(e.message || 'No se pudo unir al grupo');
    }
    setJoining(false);
  };

  // ─── Derived state ───────────────────────────────────────────────────────

  const progress = deal && deal.minParticipants > 0
    ? Math.min((deal.currentCount / deal.minParticipants) * 100, 100)
    : 0;
  const isCompleted = deal?.status === 'COMPLETED';
  const isActive = deal?.status === 'ACTIVE';
  const isExpired = deal?.status === 'EXPIRED' || countdown.expired;
  const isCancelled = deal?.status === 'CANCELLED';
  const alreadyJoined = user && participants.some(p => p.userId === user.id);
  const canJoin = isActive && !alreadyJoined && isAuthenticated && !joining;
  const remaining = deal ? deal.minParticipants - deal.currentCount : 0;

  const ctDisplay = countdown.expired
    ? 'Expirado'
    : `${countdown.hours}h ${String(countdown.minutes).padStart(2, '0')}m ${String(countdown.seconds).padStart(2, '0')}s`;

  // ─── Loading ─────────────────────────────────────────────────────────────

  if (loading) return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center">
      <Loader2 size={28} className="animate-spin text-purple-600" />
    </div>
  );

  // ─── 404 ─────────────────────────────────────────────────────────────────

  if (!deal) return (
    <div className="min-h-screen bg-brand-bg flex flex-col items-center justify-center p-8 text-center">
      <SEO title="Oferta no encontrada" />
      <span className="text-6xl mb-4">🔍</span>
      <h2 className="text-xl font-extrabold mb-2 text-text-primary">Oferta grupal no encontrada</h2>
      <p className="text-sm text-text-muted mb-4">Esta oferta ya no existe o el enlace es incorrecto.</p>
      <button onClick={() => navigate('/')} className="text-purple-600 font-bold text-sm hover:underline">
        Volver al inicio
      </button>
    </div>
  );

  // ─── Error ───────────────────────────────────────────────────────────────

  if (error) return (
    <div className="min-h-screen bg-brand-bg flex flex-col items-center justify-center p-8 text-center">
      <SEO title="Error" />
      <span className="text-6xl mb-4">⚠️</span>
      <h2 className="text-xl font-extrabold mb-2 text-text-primary">Error</h2>
      <p className="text-sm text-text-muted mb-4">{error}</p>
      <button onClick={loadDeal} className="text-purple-600 font-bold text-sm hover:underline">
        Intentar de nuevo
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-brand-bg pb-24">
      <SEO title={deal.title} description={`¡${deal.discountPercent}% OFF! Precio grupal: $${deal.groupPrice.toLocaleString('es-CO')}`} />

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft size={22} />
          </button>
          <h1 className="text-base font-extrabold truncate flex-1">Oferta Grupal</h1>
          <StatusBadge status={isExpired && deal.status === 'ACTIVE' ? 'EXPIRED' : deal.status} />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 pt-5 space-y-6">
        {/* ─── COMPLETED celebration ────────────────────────────────────── */}
        {isCompleted && (
          <div className="p-6 bg-gradient-to-br from-purple-50 via-indigo-50 to-pink-50 rounded-2xl border border-purple-200 text-center animate-fade-in">
            <span className="text-5xl block mb-3">🎉</span>
            <h2 className="text-2xl font-extrabold text-purple-700 mb-2">¡Grupo completado!</h2>
            <p className="text-sm text-text-secondary">
              ¡Llegaron a {deal.minParticipants} personas! Disfruta del precio grupal.
            </p>
            <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl font-extrabold text-sm">
              <BadgeCheck size={18} />
              ${deal.groupPrice.toLocaleString('es-CO')} por persona
            </div>
          </div>
        )}

        {/* ─── EXPIRED banner ──────────────────────────────────────────── */}
        {(isExpired && !isCompleted && !isCancelled) && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-center">
            <span className="text-3xl block mb-1">⏰</span>
            <p className="text-sm font-extrabold text-amber-700">Esta oferta grupal ha expirado</p>
            <p className="text-xs text-amber-600 mt-1">El tiempo para unirse terminó.</p>
          </div>
        )}

        {/* ─── CANCELLED banner ────────────────────────────────────────── */}
        {isCancelled && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-center">
            <span className="text-3xl block mb-1">🚫</span>
            <p className="text-sm font-extrabold text-red-600">Esta oferta fue cancelada</p>
          </div>
        )}

        {/* ─── Deal Card ───────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-border p-5 shadow-sm">
          {/* Hero */}
          <div className="relative h-44 bg-gradient-to-br from-purple-50 via-indigo-50 to-gray-100 rounded-xl flex items-center justify-center mb-4 overflow-hidden">
            <span className="text-7xl">📦</span>
            <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
            <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-extrabold bg-red-500 text-white shadow-lg">
              -{deal.discountPercent}%
            </span>
            {isCompleted && (
              <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-extrabold bg-green-500 text-white shadow-lg flex items-center gap-1">
                <BadgeCheck size={12} /> Completado
              </span>
            )}
          </div>

          {/* Info */}
          <h2 className="text-xl font-extrabold text-text-primary mb-1">{deal.title}</h2>

          {/* Prices */}
          <div className="flex items-baseline gap-3 mt-3">
            <span className="text-3xl font-extrabold text-purple-700">
              ${deal.groupPrice.toLocaleString('es-CO')}
            </span>
            <span className="text-base text-text-muted line-through font-semibold">
              ${deal.originalPrice.toLocaleString('es-CO')}
            </span>
            <span className="text-sm font-extrabold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
              Ahorras ${(deal.originalPrice - deal.groupPrice).toLocaleString('es-CO')}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="mt-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-text-secondary flex items-center gap-1.5">
                <Users size={16} className="text-purple-500" />
                {deal.currentCount} de {deal.minParticipants} personas
              </span>
              {remaining > 0 && (
                <span className="text-xs font-bold text-purple-600">
                  {remaining === 1 ? '¡Falta 1!' : `Faltan ${remaining}`}
                </span>
              )}
            </div>
            <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  isCompleted
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500'
                    : 'bg-gradient-to-r from-purple-500 to-indigo-500'
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
            {/* Tick marks */}
            <div className="flex justify-between mt-1.5 px-0.5">
              {Array.from({ length: deal.minParticipants }, (_, i) => (
                <div
                  key={i}
                  className={`w-1.5 h-1.5 rounded-full transition-colors ${
                    i < deal.currentCount ? 'bg-purple-500' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Countdown */}
          {isActive && (
            <div className="flex items-center gap-2 mt-4 px-3 py-2 bg-amber-50 rounded-lg border border-amber-200">
              <Clock size={16} className="text-amber-600 flex-shrink-0" />
              <span className="text-sm font-bold text-amber-700">
                Expira en {ctDisplay}
              </span>
            </div>
          )}
        </div>

        {/* ─── Participants ────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-border p-5 shadow-sm">
          <h3 className="text-sm font-extrabold text-text-primary mb-3 flex items-center gap-2">
            <Users size={18} className="text-purple-500" />
            Participantes ({participants.length})
          </h3>
          {participants.length === 0 ? (
            <p className="text-sm text-text-muted">Nadie se ha unido aún. ¡Sé el primero!</p>
          ) : (
            <div className="flex flex-wrap gap-3">
              {participants.map((p, idx) => (
                <div key={p.id} className="flex flex-col items-center gap-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-extrabold shadow-sm ${participantColors[idx % participantColors.length]}`}
                    title={p.userId}
                  >
                    {getInitials(p.userId)}
                  </div>
                  <span className="text-[10px] text-text-muted font-medium">#{idx + 1}</span>
                </div>
              ))}
              {/* Placeholder slots */}
              {Array.from({ length: Math.max(0, deal.minParticipants - participants.length) }, (_, i) => (
                <div key={`empty-${i}`} className="flex flex-col items-center gap-1 opacity-40">
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                    <Users size={16} className="text-gray-400" />
                  </div>
                  <span className="text-[10px] text-text-muted font-medium">Vacante</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ─── Actions ─────────────────────────────────────────────────── */}
        <div className="space-y-3">
          {/* Share button — always visible */}
          <button
            onClick={() => setShowShareSheet(true)}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-green-500 hover:bg-green-600 text-white font-extrabold rounded-xl transition-colors text-sm shadow-lg shadow-green-200"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            Compartir en WhatsApp
          </button>

          {/* Join button */}
          {canJoin && (
            <>
              <button
                onClick={handleJoin}
                disabled={joining}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white font-extrabold rounded-xl transition-colors text-sm shadow-lg shadow-purple-200"
              >
                {joining ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  <Users size={20} />
                )}
                {joining ? 'Uniéndote...' : 'Unirme al grupo'}
              </button>
              {joinError && (
                <p className="text-xs text-red-500 text-center">{joinError}</p>
              )}
            </>
          )}

          {/* Already joined */}
          {alreadyJoined && isActive && (
            <div className="w-full text-center py-3 px-4 bg-purple-50 rounded-xl border border-purple-200">
              <span className="text-sm font-extrabold text-purple-700 flex items-center justify-center gap-1.5">
                <BadgeCheck size={16} />
                Ya estás en este grupo
              </span>
              <p className="text-xs text-purple-500 mt-0.5">
                Comparte el enlace para que más personas se unan ↓
              </p>
            </div>
          )}

          {/* Login prompt */}
          {!isAuthenticated && isActive && (
            <div className="w-full text-center">
              <button
                onClick={() => navigate('/login')}
                className="w-full py-3 px-4 bg-gray-100 hover:bg-gray-200 text-text-primary font-bold rounded-xl transition-colors text-sm"
              >
                Inicia sesión para unirte
              </button>
            </div>
          )}

          {/* Gift / Incentive */}
          {(isActive || isCompleted) && (
            <div className="flex items-center gap-2 justify-center text-xs text-text-muted mt-2">
              <Gift size={14} className="text-purple-500" />
              <span>Los primeros 3 compradores reciben 5% cashback extra</span>
            </div>
          )}
        </div>
      </main>

      {/* Share Sheet */}
      <ShareDealSheet
        deal={deal}
        isOpen={showShareSheet}
        onClose={() => setShowShareSheet(false)}
      />
    </div>
  );
};

export default GroupDealPage;
