/**
 * @file components/wallet/GiftCardList.tsx
 * @description Horizontal scrollable list of user's gift cards (Starbucks-style).
 */
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Gift, Plus, Loader2, ChevronRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { giftCardService } from '../../services/giftCardService';
import { formatCOP } from '../../config/constants';
import type { GiftCard } from '../../types';
import SendGiftCardModal from './SendGiftCardModal';

const STATUS_STYLES: Record<GiftCard['status'], string> = {
  ACTIVE: 'bg-emerald-100 text-emerald-700',
  DEPLETED: 'bg-gray-100 text-gray-500',
  EXPIRED: 'bg-red-100 text-red-600',
  CANCELLED: 'bg-gray-100 text-gray-400',
};

const STATUS_LABELS: Record<GiftCard['status'], string> = {
  ACTIVE: 'Activa',
  DEPLETED: 'Agotada',
  EXPIRED: 'Expirada',
  CANCELLED: 'Cancelada',
};

const GiftCardList: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();
  const [cards, setCards] = useState<GiftCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const loadCards = async () => {
    if (!user?.id) return;
    try {
      const data = await giftCardService.getCards(user.id);
      setCards(data);
    } catch {
      /* silent */
    }
    setLoading(false);
  };

  useEffect(() => {
    loadCards();
  }, [user?.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 size={24} className="animate-spin text-purple-500" />
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-border p-8 text-center">
        <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-purple-50 flex items-center justify-center">
          <Gift size={28} className="text-purple-400" />
        </div>
        <h3 className="text-base font-extrabold text-text-primary mb-1">
          No tienes gift cards
        </h3>
        <p className="text-sm text-text-secondary mb-4">
          Crea tu primera gift card para ti o para regalar
        </p>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-bold hover:bg-purple-700 transition-colors active:scale-[0.97]"
        >
          <Plus size={18} />
          Crear primera gift card
        </button>
        <SendGiftCardModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={loadCards}
        />
      </div>
    );
  }

  const activeCount = cards.filter(c => c.status === 'ACTIVE').length;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">🎁</span>
          <h3 className="text-sm font-extrabold text-text-primary">
            Mis Gift Cards
          </h3>
          <span className="text-xs text-text-muted bg-gray-100 px-2 py-0.5 rounded-full font-bold">
            {activeCount}
          </span>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-1 px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg text-xs font-bold hover:bg-purple-100 transition-colors active:scale-[0.97]"
        >
          <Plus size={14} />
          Nueva
        </button>
      </div>

      {/* Horizontal scrollable cards */}
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide snap-x">
        {cards.map(card => {
          const pct = card.originalAmount > 0
            ? Math.min(100, Math.round((card.balance / card.originalAmount) * 100))
            : 0;
          const designEmoji = giftCardService.getDesignEmoji(card.design);
          const isActive = card.status === 'ACTIVE';

          return (
            <button
              key={card.id}
              onClick={() => navigate(`/gift-cards/${card.id}`)}
              className={`shrink-0 w-[200px] snap-start rounded-2xl border p-4 text-left transition-all active:scale-[0.97] hover:shadow-md ${
                isActive ? 'bg-white border-border' : 'bg-gray-50 border-gray-200 opacity-75'
              }`}
            >
              {/* Design emoji and name */}
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">{designEmoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-text-primary truncate">
                    {card.name}
                  </div>
                  <div className="text-[10px] text-text-muted">
                    {card.source === 'received' ? 'Recibida' : card.source === 'promo' ? 'Promo' : card.source === 'corporate' ? 'Corporativa' : 'Comprada'}
                  </div>
                </div>
              </div>

              {/* Balance */}
              <div className="text-lg font-extrabold text-text-primary mb-2">
                {formatCOP(card.balance)}
              </div>

              {/* Progress bar */}
              <div className="w-full h-1.5 bg-gray-100 rounded-full mb-2 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    pct > 60 ? 'bg-emerald-500' : pct > 20 ? 'bg-amber-400' : 'bg-red-400'
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>

              {/* Status badge */}
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_STYLES[card.status]}`}>
                  {STATUS_LABELS[card.status]}
                </span>
                {isActive && <ChevronRight size={14} className="text-text-muted" />}
              </div>
            </button>
          );
        })}
      </div>

      <SendGiftCardModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={loadCards}
      />
    </div>
  );
};

export default GiftCardList;
