/**
 * @file components/wallet/CashbackList.tsx
 * @description Lista de cashbacks pendientes con botón "Reclamar" y "Reclamar todo".
 */
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Gift, Loader2, Check, AlertTriangle, Clock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { cashbackService } from '../../services/cashbackService';
import { formatCOP } from '../../config/constants';
import type { CashbackRecord } from '../../types';

const CashbackList: React.FC = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [records, setRecords] = useState<CashbackRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [claimingAll, setClaimingAll] = useState(false);

  const load = async () => {
    if (!user?.id) return;
    try {
      const [r, t] = await Promise.all([
        cashbackService.getPendingCashback(user.id),
        cashbackService.getPendingTotal(user.id),
      ]);
      setRecords(r);
      setTotal(t);
    } catch { /* silent */ }
    setLoading(false);
  };

  useEffect(() => { load(); }, [user?.id]);

  const handleClaim = async (recordId: string) => {
    if (!user?.id) return;
    setClaimingId(recordId);
    try {
      await cashbackService.claimCashback(user.id, recordId);
      await load();
    } catch { /* silent */ }
    setClaimingId(null);
  };

  const handleClaimAll = async () => {
    if (!user?.id) return;
    setClaimingAll(true);
    try {
      await cashbackService.claimAll(user.id);
      await load();
    } catch { /* silent */ }
    setClaimingAll(false);
  };

  if (loading) return <div className="flex justify-center py-4"><Loader2 size={18} className="animate-spin text-purple-600" /></div>;
  if (records.length === 0) return null;

  const expiringSoon = records.filter(r => {
    const daysLeft = Math.ceil((new Date(r.expiresAt).getTime() - Date.now()) / 86400000);
    return daysLeft <= 7;
  });

  return (
    <div className="bg-white rounded-xl border border-border p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-extrabold text-text-primary flex items-center gap-1.5">
          <Gift size={14} className="text-amber-500" /> {t('cashback.total')}
        </h3>
        <span className="text-sm font-extrabold text-emerald-600">{formatCOP(total)}</span>
      </div>

      {expiringSoon.length > 0 && (
        <div className="flex items-center gap-2 p-2 bg-red-50 rounded-lg mb-3 text-xs font-semibold text-red-600">
          <AlertTriangle size={14} />
          {t('cashback.expiringCount', { count: expiringSoon.length })}
        </div>
      )}

      <div className="space-y-1.5">
        {records.slice(0, 5).map(r => {
          const daysLeft = Math.ceil((new Date(r.expiresAt).getTime() - Date.now()) / 86400000);
          return (
            <div key={r.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-text-primary">{t('cashback.atRate', { amount: formatCOP(r.amount), rate: r.rateBps })}</div>
                <div className="text-[10px] text-text-muted flex items-center gap-1">
                  <Clock size={10} />
                  {daysLeft > 0 ? t('cashback.expiresInDays', { days: daysLeft }) : t('cashback.expiresToday')}
                </div>
              </div>
              <button
                onClick={() => handleClaim(r.id!)}
                disabled={claimingId === r.id}
                className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-[10px] font-extrabold hover:bg-emerald-100 transition-all disabled:opacity-50 flex items-center gap-1"
              >
                {claimingId === r.id ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                {t('cashback.claim')}
              </button>
            </div>
          );
        })}
      </div>

      {records.length > 5 && (
        <p className="text-[10px] text-text-muted text-center mt-2">+{records.length - 5} más</p>
      )}

      {records.length > 1 && (
        <button
          onClick={handleClaimAll}
          disabled={claimingAll}
          className="w-full mt-3 py-2 bg-purple-50 text-purple-700 rounded-xl text-xs font-extrabold hover:bg-purple-100 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
        >
          {claimingAll ? <Loader2 size={14} className="animate-spin" /> : <Gift size={14} />}
          {t('cashback.claimAll', { total: formatCOP(total) })}
        </button>
      )}
    </div>
  );
};

export default CashbackList;
