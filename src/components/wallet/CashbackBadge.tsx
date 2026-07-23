/**
 * @file components/wallet/CashbackBadge.tsx
 * @description Badge que muestra cashback disponible del usuario. WeChat/Rappi style.
 */
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { cashbackService } from '../../services/cashbackService';
import { Gift } from 'lucide-react';
import { formatCOP } from '../../config/constants';

const CashbackBadge: React.FC = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [total, setTotal] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) { setLoading(false); return; }
    (async () => {
      try {
        const t = await cashbackService.getPendingTotal(user.id);
        setTotal(t);
      } catch { /* silent */ }
      setLoading(false);
    })();
  }, [user?.id]);

  if (loading || total === null || total <= 0) return null;

  return (
    <button
      onClick={() => navigate('/wallet')}
      className="w-full bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-3 flex items-center gap-3 hover:shadow-md transition-all active:scale-[0.99]"
    >
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-sm">
        <Gift size={18} className="text-white" />
      </div>
      <div className="flex-1 text-left">
        <div className="text-xs font-extrabold text-amber-800">💰 {t('cashback.title')}</div>
        <div className="text-lg font-extrabold text-amber-900">{formatCOP(total)}</div>
      </div>
      <div className="text-amber-600 text-xs font-bold">{t('cashback.claim')} →</div>
    </button>
  );
};

export default CashbackBadge;
