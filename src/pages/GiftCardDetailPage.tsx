/**
 * @file pages/GiftCardDetailPage.tsx
 * @description Página de detalle de Gift Card — hero, info, acciones, transacciones.
 * Ruta: /gift-cards/:id
 */
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft, Loader2, ArrowUpCircle, ArrowDownCircle,
  RotateCcw, AlertTriangle, Clock, CreditCard, Gift, Ban, XCircle,
  Calendar, Info, MessageCircle, Send, Trash2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { giftCardService } from '../services/giftCardService';
import { formatCOP } from '../config/constants';
import type { GiftCard, GiftCardTransaction } from '../types';

// ─── Helpers ────────────────────────────────────────────────────────────

const DESIGN_EMOJIS: Record<string, string> = {
  default: '🎁',
  birthday: '🎂',
  celebration: '🎉',
  thanks: '🙏',
  holiday: '🎄',
};

const getDesignEmoji = (design?: string): string =>
  DESIGN_EMOJIS[design || 'default'] || '🎁';

const TX_ICONS: Record<string, React.ReactNode> = {
  LOAD: <ArrowDownCircle size={16} className="text-emerald-600" />,
  PURCHASE: <ArrowUpCircle size={16} className="text-red-500" />,
  TRANSFER_IN: <ArrowDownCircle size={16} className="text-emerald-500" />,
  TRANSFER_OUT: <ArrowUpCircle size={16} className="text-red-400" />,
  REFUND: <RotateCcw size={16} className="text-amber-500" />,
  EXPIRATION: <AlertTriangle size={16} className="text-gray-400" />,
};

const TX_LABELS: Record<string, string> = {
  LOAD: 'Carga',
  PURCHASE: 'Compra',
  TRANSFER_IN: 'Recibido',
  TRANSFER_OUT: 'Enviado',
  REFUND: 'Reembolso',
  EXPIRATION: 'Vencimiento',
};

const TX_COLORS: Record<string, string> = {
  LOAD: 'bg-emerald-50',
  PURCHASE: 'bg-red-50',
  TRANSFER_IN: 'bg-emerald-50',
  TRANSFER_OUT: 'bg-red-50',
  REFUND: 'bg-amber-50',
  EXPIRATION: 'bg-gray-50',
};

const STATUS_BADGES: Record<string, { label: string; color: string }> = {
  ACTIVE: { label: 'Activa', color: 'bg-emerald-100 text-emerald-700' },
  DEPLETED: { label: 'Agotada', color: 'bg-amber-100 text-amber-700' },
  EXPIRED: { label: 'Expirada', color: 'bg-red-100 text-red-700' },
  CANCELLED: { label: 'Cancelada', color: 'bg-gray-100 text-gray-600' },
};

const SOURCE_LABELS: Record<string, string> = {
  purchased: 'Comprada',
  received: 'Recibida',
  promo: 'Promoción',
  corporate: 'Corporativa',
};

// ─── Component ──────────────────────────────────────────────────────────

const GiftCardDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const { user, isAuthenticated, loading: authLoading } = useAuth();

  const [card, setCard] = useState<GiftCard | null>(null);
  const [transactions, setTransactions] = useState<GiftCardTransaction[]>([]);
  const [activeCards, setActiveCards] = useState<GiftCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Transfer form state
  const [showTransfer, setShowTransfer] = useState(false);
  const [transferTo, setTransferTo] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferError, setTransferError] = useState<string | null>(null);
  const [transferring, setTransferring] = useState(false);

  // Deactivate state
  const [showDeactivate, setShowDeactivate] = useState(false);
  const [deactivating, setDeactivating] = useState(false);

  const load = useCallback(async () => {
    if (!id || !user?.id) return;
    try {
      const cardData = await giftCardService.getCard(id);
      if (!cardData) {
        setError('Gift card no encontrada');
        setLoading(false);
        return;
      }
      if (cardData.userId !== user.id) {
        setError('No tienes acceso a esta gift card');
        setLoading(false);
        return;
      }
      setCard(cardData);

      const [txs, cards] = await Promise.all([
        giftCardService.getTransactions(id),
        giftCardService.getActiveCards(user.id),
      ]);
      setTransactions(txs);
      setActiveCards(cards);
    } catch {
      setError('Error al cargar la gift card');
    }
    setLoading(false);
  }, [id, user?.id]);

  useEffect(() => { load(); }, [load]);

  // ── Transfer handler ──
  const handleTransfer = async () => {
    setTransferError(null);
    const amount = Number(transferAmount);

    if (!transferTo) {
      setTransferError('Selecciona una gift card destino');
      return;
    }
    if (transferTo === id) {
      setTransferError('No puedes transferir a la misma card');
      return;
    }
    if (!amount || amount < 1000) {
      setTransferError('El monto mínimo es $1.000');
      return;
    }
    if (amount > (card?.balance ?? 0)) {
      setTransferError('Saldo insuficiente en la card origen');
      return;
    }

    setTransferring(true);
    try {
      await giftCardService.transfer(id!, transferTo, amount, user!.id);
      setShowTransfer(false);
      setTransferTo('');
      setTransferAmount('');
      await load();
    } catch (e: unknown) {
      setTransferError(e instanceof Error ? e.message : 'Error al transferir');
    }
    setTransferring(false);
  };

  // ── Deactivate handler ──
  const handleDeactivate = async () => {
    setDeactivating(true);
    try {
      await giftCardService.deactivate(id!, user!.id);
      await load();
      setShowDeactivate(false);
    } catch {
      // ignore
    }
    setDeactivating(false);
  };

  // ── Auth / loading guard ──
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-purple-600" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-brand-bg flex flex-col items-center justify-center gap-3 p-8">
        <p className="text-sm text-text-muted">{t('auth.loginRequired')}</p>
        <button
          onClick={() => navigate('/login')}
          className="px-5 py-2 bg-purple-600 text-white text-sm font-bold rounded-xl"
        >
          {t('auth.login')}
        </button>
      </div>
    );
  }

  if (error || !card) {
    return (
      <div className="min-h-screen bg-brand-bg flex flex-col items-center justify-center gap-3 p-8">
        <XCircle size={40} className="text-red-400" />
        <p className="text-sm text-text-muted">{error || 'Gift card no encontrada'}</p>
        <button
          onClick={() => navigate('/gift-cards')}
          className="px-4 py-2 bg-purple-600 text-white text-sm font-bold rounded-xl"
        >
          Volver a Gift Cards
        </button>
      </div>
    );
  }

  const isActive = card.status === 'ACTIVE';
  const progress = card.originalAmount > 0
    ? Math.min((card.balance / card.originalAmount) * 100, 100)
    : 0;

  return (
    <div className="pb-24 bg-brand-bg min-h-screen">
      {/* ── Header ── */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft size={22} />
          </button>
          <h1 className="text-lg font-extrabold truncate">{card.name}</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {/* ── Card Hero ── */}
        <div className="bg-gradient-to-br from-purple-500 to-purple-700 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center gap-4">
            <span className="text-5xl">{getDesignEmoji(card.design)}</span>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-extrabold truncate">{card.name}</h2>
              <p className="text-3xl font-extrabold mt-1">{formatCOP(card.balance)}</p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-4">
            <div className="flex justify-between text-xs text-white/70 mb-1">
              <span>Saldo disponible</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            {card.originalAmount > 0 && (
              <p className="text-xs text-white/60 mt-1">
                Original: {formatCOP(card.originalAmount)}
              </p>
            )}
          </div>
        </div>

        {/* ── Info Section ── */}
        <div className="bg-white rounded-xl border border-border p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <Calendar size={16} className="text-text-muted" />
            <span className="text-text-muted">Creada:</span>
            <span className="font-bold text-text-primary">
              {new Date(card.createdAt).toLocaleDateString('es-CO', {
                day: 'numeric', month: 'long', year: 'numeric',
              })}
            </span>
          </div>

          {card.expiresAt && (
            <div className="flex items-center gap-2 text-sm">
              <Clock size={16} className="text-text-muted" />
              <span className="text-text-muted">Expira:</span>
              <span className="font-bold text-text-primary">
                {new Date(card.expiresAt).toLocaleDateString('es-CO', {
                  day: 'numeric', month: 'long', year: 'numeric',
                })}
              </span>
            </div>
          )}

          <div className="flex items-center gap-2 text-sm">
            <Info size={16} className="text-text-muted" />
            <span className="text-text-muted">Estado:</span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${STATUS_BADGES[card.status]?.color || 'bg-gray-100 text-gray-600'}`}>
              {STATUS_BADGES[card.status]?.label || card.status}
            </span>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <CreditCard size={16} className="text-text-muted" />
            <span className="text-text-muted">Origen:</span>
            <span className="font-bold text-text-primary">
              {SOURCE_LABELS[card.source] || card.source}
            </span>
          </div>

          {card.message && (
            <div className="flex items-start gap-2 text-sm">
              <MessageCircle size={16} className="text-text-muted mt-0.5" />
              <div>
                <span className="text-text-muted">Mensaje:</span>
                <p className="font-medium text-text-primary italic mt-0.5">{card.message}</p>
              </div>
            </div>
          )}
        </div>

        {/* ── Actions Section ── */}
        <div className="bg-white rounded-xl border border-border p-4">
          {isActive ? (
            <div className="space-y-3">
              <h3 className="text-sm font-extrabold text-text-primary">Acciones</h3>

              {/* Transfer button / form */}
              {!showTransfer ? (
                <button
                  onClick={() => setShowTransfer(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-50 text-purple-700 text-sm font-bold rounded-xl hover:bg-purple-100 transition-colors"
                >
                  <Send size={16} />
                  Transferir saldo
                </button>
              ) : (
                <div className="border border-purple-200 rounded-xl p-3 space-y-3 bg-purple-50/50">
                  <p className="text-sm font-bold text-purple-800">Transferir saldo</p>

                  {/* Target card selector */}
                  <div>
                    <label className="text-xs font-bold text-text-muted mb-1 block">
                      Gift card destino
                    </label>
                    <select
                      value={transferTo}
                      onChange={e => setTransferTo(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-white"
                    >
                      <option value="">Seleccionar...</option>
                      {activeCards
                        .filter(c => c.id !== card.id)
                        .map(c => (
                          <option key={c.id} value={c.id}>
                            {getDesignEmoji(c.design)} {c.name} ({formatCOP(c.balance)})
                          </option>
                        ))}
                    </select>
                  </div>

                  {/* Amount input */}
                  <div>
                    <label className="text-xs font-bold text-text-muted mb-1 block">
                      Monto
                    </label>
                    <input
                      type="number"
                      value={transferAmount}
                      onChange={e => setTransferAmount(e.target.value)}
                      placeholder="Ej: 50000"
                      min={1000}
                      max={card.balance}
                      className="w-full px-3 py-2 text-sm border border-border rounded-lg"
                    />
                  </div>

                  {transferError && (
                    <p className="text-xs text-red-600 font-medium">{transferError}</p>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={handleTransfer}
                      disabled={transferring}
                      className="flex-1 px-4 py-2 bg-purple-600 text-white text-sm font-bold rounded-xl hover:bg-purple-700 disabled:opacity-50 transition-colors"
                    >
                      {transferring ? (
                        <Loader2 size={16} className="animate-spin mx-auto" />
                      ) : (
                        'Confirmar'
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setShowTransfer(false);
                        setTransferError(null);
                        setTransferTo('');
                        setTransferAmount('');
                      }}
                      className="px-4 py-2 text-sm font-bold text-text-muted hover:text-text-primary transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

              {/* Deactivate button */}
              {!showDeactivate ? (
                <button
                  onClick={() => setShowDeactivate(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-50 text-red-600 text-sm font-bold rounded-xl hover:bg-red-100 transition-colors"
                >
                  <Ban size={16} />
                  Desactivar gift card
                </button>
              ) : (
                <div className="border border-red-200 rounded-xl p-3 space-y-3 bg-red-50/50">
                  <div className="flex items-start gap-2">
                    <AlertTriangle size={18} className="text-red-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-bold text-red-700">¿Desactivar gift card?</p>
                      <p className="text-xs text-red-600 mt-0.5">
                        {card.balance > 0
                          ? `Se devolverán ${formatCOP(card.balance)} a tu wallet principal.`
                          : 'Esta card no tiene saldo.'}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={handleDeactivate}
                      disabled={deactivating}
                      className="flex-1 px-4 py-2 bg-red-600 text-white text-sm font-bold rounded-xl hover:bg-red-700 disabled:opacity-50 transition-colors"
                    >
                      {deactivating ? (
                        <Loader2 size={16} className="animate-spin mx-auto" />
                      ) : (
                        'Sí, desactivar'
                      )}
                    </button>
                    <button
                      onClick={() => setShowDeactivate(false)}
                      className="px-4 py-2 text-sm font-bold text-text-muted hover:text-text-primary transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-4">
              <div className="flex justify-center mb-2">
                {card.status === 'DEPLETED' && <Gift size={28} className="text-amber-400" />}
                {card.status === 'EXPIRED' && <Clock size={28} className="text-red-400" />}
                {card.status === 'CANCELLED' && <Ban size={28} className="text-gray-400" />}
              </div>
              <p className="text-sm font-bold text-text-primary">
                {card.status === 'DEPLETED' && 'Esta gift card se ha agotado.'}
                {card.status === 'EXPIRED' && 'Esta gift card ha expirado.'}
                {card.status === 'CANCELLED' && 'Esta gift card ha sido cancelada.'}
              </p>
              <p className="text-xs text-text-muted mt-1">
                {card.status === 'DEPLETED' && 'Puedes crear una nueva gift card desde tu wallet.'}
                {card.status === 'EXPIRED' && 'El saldo expirado no se puede recuperar.'}
                {card.status === 'CANCELLED' && 'El saldo fue devuelto a tu wallet principal.'}
              </p>
            </div>
          )}
        </div>

        {/* ── Transactions Section ── */}
        <div>
          <h3 className="text-sm font-extrabold text-text-primary mb-3">Transacciones</h3>

          {transactions.length === 0 ? (
            <div className="bg-white rounded-xl border border-border p-8 text-center">
              <Clock size={32} className="mx-auto mb-2 text-text-muted" />
              <p className="text-sm text-text-muted">Sin transacciones aún</p>
              <p className="text-xs text-text-muted mt-1">
                Las transacciones aparecerán aquí cuando uses esta gift card.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {transactions.map(tx => (
                <div
                  key={tx.id}
                  className="bg-white rounded-xl border border-border p-4 flex items-center gap-3"
                >
                  <div
                    className={`w-9 h-9 rounded-xl ${
                      TX_COLORS[tx.type] || 'bg-gray-50'
                    } flex items-center justify-center shrink-0`}
                  >
                    {TX_ICONS[tx.type] || <Clock size={16} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-text-primary truncate">
                        {tx.description}
                      </span>
                      <span className="text-[10px] font-bold text-text-muted uppercase">
                        {TX_LABELS[tx.type] || tx.type}
                      </span>
                    </div>
                    <div className="text-[11px] text-text-muted mt-0.5">
                      {new Date(tx.createdAt).toLocaleDateString('es-CO', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div
                      className={`text-sm font-extrabold ${
                        tx.type === 'LOAD' || tx.type === 'TRANSFER_IN' || tx.type === 'REFUND'
                          ? 'text-emerald-600'
                          : 'text-text-primary'
                      }`}
                    >
                      {tx.type === 'LOAD' || tx.type === 'TRANSFER_IN' || tx.type === 'REFUND'
                        ? '+'
                        : '-'}
                      {formatCOP(tx.amount)}
                    </div>
                    <div className="text-[10px] text-text-muted mt-0.5">
                      Saldo: {formatCOP(tx.balanceAfter)}
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

export default GiftCardDetailPage;
