/**
 * @file components/wallet/AutoReloadSettings.tsx
 * @description Auto-reload configuration panel for gift card wallet (Starbucks-style).
 */
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { RefreshCw, Loader2, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { walletService } from '../../services/walletService';
import { AUTO_RELOAD_CONFIG } from '../../config/constants';
import { formatCOP } from '../../config/constants';
import type { AutoReloadConfig } from '../../types';

const THRESHOLD_PRESETS = [10_000, 25_000, 50_000, 100_000, 200_000];
const AMOUNT_PRESETS = [20_000, 50_000, 100_000, 200_000, 500_000];

const AutoReloadSettings: React.FC = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [config, setConfig] = useState<AutoReloadConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Editable local state
  const [enabled, setEnabled] = useState(false);
  const [threshold, setThreshold] = useState<number>(AUTO_RELOAD_CONFIG.defaultThreshold);
  const [amount, setAmount] = useState<number>(AUTO_RELOAD_CONFIG.defaultAmount);

  const loadConfig = async () => {
    if (!user?.id) return;
    try {
      const cfg = await walletService.getAutoReloadConfig(user.id);
      if (cfg) {
        setConfig(cfg);
        setEnabled(cfg.enabled);
        setThreshold(cfg.threshold);
        setAmount(cfg.amount);
      } else {
        setEnabled(false);
        setThreshold(AUTO_RELOAD_CONFIG.defaultThreshold);
        setAmount(AUTO_RELOAD_CONFIG.defaultAmount);
      }
    } catch {
      /* silent — use defaults */
    }
    setLoading(false);
  };

  useEffect(() => {
    loadConfig();
  }, [user?.id]);

  const handleSave = async () => {
    if (!user?.id) return;
    setError(null);
    setSuccess(false);
    setSaving(true);

    try {
      await walletService.setAutoReloadConfig(user.id, {
        enabled,
        threshold,
        amount,
      });
      setSuccess(true);
      await loadConfig();
    } catch (e: any) {
      setError(e.message || t('giftCard.autoReloadError'));
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 size={22} className="animate-spin text-purple-500" />
      </div>
    );
  }

  const monthlyCount = config?.monthlyCount ?? 0;
  const maxMonthly = config?.maxMonthly ?? AUTO_RELOAD_CONFIG.maxMonthly;
  const lastReloadAt = config?.lastReloadAt;

  return (
    <div className="bg-white rounded-2xl border border-border p-5">
      {/* Header with toggle */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
            <RefreshCw size={18} className="text-purple-600" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-text-primary">
              Recarga automática
            </h3>
            <p className="text-[11px] text-text-muted">
              Recarga tu gift card cuando el saldo baje de un límite
            </p>
          </div>
        </div>

        {/* Toggle switch */}
        <button
          role="switch"
          aria-checked={enabled}
          onClick={() => setEnabled(!enabled)}
          className={`relative w-12 h-7 rounded-full transition-colors ${
            enabled ? 'bg-purple-600' : 'bg-gray-200'
          }`}
        >
          <span
            className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${
              enabled ? 'left-[22px]' : 'left-0.5'
            }`}
          />
        </button>
      </div>

      {enabled && (
        <div className="space-y-5">
          {/* Threshold selection */}
          <div>
            <label className="text-xs font-bold text-text-primary mb-2 block">
              Recargar cuando baje de
            </label>
            <div className="flex flex-wrap gap-2">
              {THRESHOLD_PRESETS.map(preset => (
                <button
                  key={preset}
                  onClick={() => setThreshold(preset)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    threshold === preset
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'bg-gray-50 text-text-primary border border-gray-200 hover:border-purple-300'
                  }`}
                >
                  {formatCOP(preset)}
                </button>
              ))}
            </div>
          </div>

          {/* Amount selection */}
          <div>
            <label className="text-xs font-bold text-text-primary mb-2 block">
              Monto a recargar
            </label>
            <div className="flex flex-wrap gap-2">
              {AMOUNT_PRESETS.map(preset => (
                <button
                  key={preset}
                  onClick={() => setAmount(preset)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    amount === preset
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'bg-gray-50 text-text-primary border border-gray-200 hover:border-purple-300'
                  }`}
                >
                  {formatCOP(preset)}
                </button>
              ))}
            </div>
          </div>

          {/* Monthly usage */}
          <div className="flex items-center gap-2 text-xs text-text-secondary bg-gray-50 rounded-xl px-3 py-2.5">
            <Clock size={14} className="text-text-muted shrink-0" />
            <span>
              Este mes:{' '}
              <span className="font-bold text-text-primary">{monthlyCount}</span>
              {' / '}
              <span className="font-bold text-text-primary">{maxMonthly}</span>
              {' '}recargas
            </span>
          </div>

          {/* Last reload */}
          {lastReloadAt && (
            <div className="flex items-center gap-2 text-xs text-text-secondary bg-gray-50 rounded-xl px-3 py-2.5">
              <RefreshCw size={14} className="text-text-muted shrink-0" />
              <span>
                Última recarga:{' '}
                <span className="font-bold text-text-primary">
                  {new Date(lastReloadAt).toLocaleDateString('es-CO', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </span>
            </div>
          )}

          {/* Save button */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-3 bg-purple-600 text-white rounded-xl font-bold text-sm hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Guardando...
              </>
            ) : (
              'Guardar configuración'
            )}
          </button>

          {/* Success message */}
          {success && (
            <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 rounded-xl px-3 py-2.5">
              <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
              <span>Configuración guardada exitosamente</span>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="flex items-center gap-2 text-xs text-red-700 bg-red-50 rounded-xl px-3 py-2.5">
              <AlertCircle size={14} className="text-red-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AutoReloadSettings;
