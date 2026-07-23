/**
 * @file pages/WalletPage.tsx
 * @description Página de billetera digital — saldo, historial, recargas.
 */
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, ArrowUpRight, ArrowDownLeft, Gift, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { walletService } from '../services/walletService';
import WalletCard from '../components/wallet/WalletCard';
import TopUpModal from '../components/wallet/TopUpModal';
import { formatCOP } from '../config/constants';
import type { Wallet, WalletTransaction } from '../types';

const TYPE_ICONS: Record<string, React.ReactNode> = {
  TOP_UP: <ArrowDownLeft size={16} className="text-emerald-600" />,
  PAYMENT: <ArrowUpRight size={16} className="text-red-500" />,
  CASHBACK_EARNED: <Gift size={16} className="text-amber-500" />,
  CASHBACK_CLAIMED: <Gift size={16} className="text-purple-600" />,
  GIFT_SENT: <ArrowUpRight size={16} className="text-red-400" />,
  GIFT_RECEIVED: <ArrowDownLeft size={16} className="text-emerald-500" />,
};

const TYPE_COLORS: Record<string, string> = {
  TOP_UP: 'bg-emerald-50',
  PAYMENT: 'bg-red-50',
  CASHBACK_EARNED: 'bg-amber-50',
  CASHBACK_CLAIMED: 'bg-purple-50',
  GIFT_SENT: 'bg-red-50',
  GIFT_RECEIVED: 'bg-emerald-50',
};

const WalletPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTopUp, setShowTopUp] = useState(false);

  const load = async () => {
    if (!user?.id) return;
    try {
      const [w, txs] = await Promise.all([
        walletService.getWallet(user.id),
        walletService.getTransactions(user.id),
      ]);
      setWallet(w);
      setTransactions(txs);
    } catch { /* silent */ }
    setLoading(false);
  };

  useEffect(() => { load(); }, [user?.id]);

  if (loading) return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center">
      <Loader2 size={28} className="animate-spin text-purple-600" />
    </div>
  );

  return (
    <div className="pb-24 bg-brand-bg min-h-screen">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft size={22} />
          </button>
          <h1 className="text-lg font-extrabold">Mi Billetera</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {wallet && <WalletCard wallet={wallet} onTopUp={() => setShowTopUp(true)} />}

        {/* Transactions */}
        <div>
          <h3 className="text-sm font-extrabold text-text-primary mb-3">Movimientos</h3>
          {transactions.length === 0 ? (
            <div className="bg-white rounded-xl border border-border p-8 text-center">
              <Clock size={32} className="mx-auto mb-2 text-text-muted" />
              <p className="text-sm text-text-muted">No hay movimientos aún</p>
              <p className="text-xs text-text-muted mt-1">Recarga saldo para empezar</p>
            </div>
          ) : (
            <div className="space-y-2">
              {transactions.map(tx => (
                <div key={tx.id} className="bg-white rounded-xl border border-border p-4 flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl ${TYPE_COLORS[tx.type] || 'bg-gray-50'} flex items-center justify-center shrink-0`}>
                    {TYPE_ICONS[tx.type] || <Clock size={16} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-text-primary truncate">{tx.description}</div>
                    <div className="text-[11px] text-text-muted mt-0.5">
                      {new Date(tx.createdAt).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  <div className={`text-sm font-extrabold ${
                    tx.type === 'TOP_UP' || tx.type === 'CASHBACK_EARNED' || tx.type === 'GIFT_RECEIVED'
                      ? 'text-emerald-600' : 'text-text-primary'
                  }`}>
                    {tx.type === 'TOP_UP' || tx.type === 'CASHBACK_EARNED' || tx.type === 'GIFT_RECEIVED' ? '+' : '-'}{formatCOP(tx.amount)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <TopUpModal
        isOpen={showTopUp}
        onClose={() => setShowTopUp(false)}
        onSuccess={load}
      />
    </div>
  );
};

export default WalletPage;
