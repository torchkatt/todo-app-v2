/**
 * @file pages/GiftCardsPage.tsx
 * @description Página de gestión de Gift Cards — lista, recarga automática, envío.
 * Ruta: /gift-cards
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import GiftCardList from '../components/wallet/GiftCardList';
import AutoReloadSettings from '../components/wallet/AutoReloadSettings';
import SendGiftCardModal from '../components/wallet/SendGiftCardModal';

const GiftCardsPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [showSendGift, setShowSendGift] = useState(false);

  if (authLoading) {
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

  return (
    <div className="pb-24 bg-brand-bg min-h-screen">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-border px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft size={22} />
            </button>
            <h1 className="text-lg font-extrabold">{t('giftCards.title')}</h1>
          </div>
          <button
            onClick={() => setShowSendGift(true)}
            className="text-sm font-bold text-purple-600 hover:text-purple-700 transition-colors"
          >
            {t('giftCards.send')}
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Gift Card List */}
        <GiftCardList />

        {/* Auto-Reload Settings */}
        <AutoReloadSettings />
      </main>

      {/* Send Gift Card Modal */}
      <SendGiftCardModal
        isOpen={showSendGift}
        onClose={() => setShowSendGift(false)}
        onSuccess={() => setShowSendGift(false)}
      />
    </div>
  );
};

export default GiftCardsPage;
