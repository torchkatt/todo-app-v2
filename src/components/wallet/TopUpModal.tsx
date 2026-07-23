/**
 * @file components/wallet/TopUpModal.tsx
 * @description Modal para recargar saldo en la wallet con montos predefinidos.
 */
import React, { useState } from 'react';
import { X, Loader2, Wallet } from 'lucide-react';
import { WALLET_CONFIG } from '../../config/constants';
import { formatCOP } from '../../config/constants';
import { walletService } from '../../services/walletService';
import { useAuth } from '../../context/AuthContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const PRESETS = [20_000, 50_000, 100_000, 200_000, 500_000];

const TopUpModal: React.FC<Props> = ({ isOpen, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const getAmount = (): number | null => {
    if (selectedAmount) return selectedAmount;
    if (customAmount) {
      const n = parseInt(customAmount.replace(/[^0-9]/g, ''));
      return isNaN(n) ? null : n;
    }
    return null;
  };

  const handleTopUp = async () => {
    const amount = getAmount();
    if (!amount || !user?.id) return;
    if (amount < WALLET_CONFIG.minTopUp) return;
    if (amount > WALLET_CONFIG.maxTopUp) return;

    setLoading(true);
    try {
      await walletService.topUp(user.id, amount);
      onSuccess();
      onClose();
    } catch (e: any) {
      alert(e.message || 'Error al recargar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-sm p-6 animate-slide-up shadow-2xl">
        <button onClick={onClose} className="absolute top-4 right-4 p-1 hover:bg-gray-100 rounded-full">
          <X size={20} />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
            <Wallet size={20} className="text-purple-600" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold">Recargar saldo</h2>
            <p className="text-xs text-text-secondary">Monto entre {formatCOP(WALLET_CONFIG.minTopUp)} y {formatCOP(WALLET_CONFIG.maxTopUp)}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-4">
          {PRESETS.map(amount => (
            <button
              key={amount}
              onClick={() => { setSelectedAmount(amount); setCustomAmount(''); }}
              className={`py-3 rounded-xl text-sm font-bold transition-all ${
                selectedAmount === amount
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'bg-gray-50 text-text-primary border border-gray-200 hover:border-purple-300'
              }`}
            >
              {formatCOP(amount)}
            </button>
          ))}
        </div>

        <div className="mb-6">
          <label className="text-xs font-bold text-text-secondary mb-1 block">Otro monto</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary font-bold">$</span>
            <input
              type="text"
              value={customAmount}
              onChange={e => { setCustomAmount(e.target.value.replace(/[^0-9]/g, '')); setSelectedAmount(null); }}
              placeholder="0"
              className="w-full pl-8 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-lg font-extrabold outline-none focus:border-purple-400 focus:bg-white transition-all"
            />
          </div>
        </div>

        <button
          onClick={handleTopUp}
          disabled={!getAmount() || (getAmount()! < WALLET_CONFIG.minTopUp) || loading}
          className="w-full py-3.5 bg-purple-600 text-white rounded-xl font-extrabold text-sm hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-[0.98] flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : null}
          {loading ? 'Procesando...' : `Recargar ${getAmount() ? formatCOP(getAmount()!) : ''}`}
        </button>
      </div>
    </div>
  );
};

export default TopUpModal;
