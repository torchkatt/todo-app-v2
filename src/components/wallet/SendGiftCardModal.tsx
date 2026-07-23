/**
 * @file components/wallet/SendGiftCardModal.tsx
 * @description Modal to create/send a new gift card (Starbucks-style).
 * Multi-step: design → name → message → amount → confirm.
 */
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Loader2, Gift, AlertCircle, ArrowLeft, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { giftCardService } from '../../services/giftCardService';
import { GIFT_CARD_CONFIG } from '../../config/constants';
import { formatCOP } from '../../config/constants';
import type { GiftCard } from '../../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const DESIGNS: { key: GiftCard['design']; emoji: string; labelKey: string }[] = [
  { key: 'default', emoji: '🎁', labelKey: 'giftCard.designDefault' },
  { key: 'birthday', emoji: '🎂', labelKey: 'giftCard.designBirthday' },
  { key: 'celebration', emoji: '🎉', labelKey: 'giftCard.designCelebration' },
  { key: 'thanks', emoji: '🙏', labelKey: 'giftCard.designThanks' },
  { key: 'holiday', emoji: '🎄', labelKey: 'giftCard.designHoliday' },
];

const AMOUNT_PRESETS = [20_000, 50_000, 100_000, 200_000];

type Step = 'design' | 'name' | 'message' | 'amount' | 'confirm';

const STEP_ORDER: Step[] = ['design', 'name', 'message', 'amount', 'confirm'];

const SendGiftCardModal: React.FC<Props> = ({ isOpen, onClose, onSuccess }) => {
  const { user } = useAuth();
  const { t } = useTranslation();

  const [step, setStep] = useState<Step>('design');
  const [design, setDesign] = useState<GiftCard['design']>('default');
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const getAmount = (): number | null => {
    if (selectedAmount) return selectedAmount;
    if (customAmount) {
      const n = parseInt(customAmount.replace(/[^0-9]/g, ''), 10);
      return isNaN(n) ? null : n;
    }
    return null;
  };

  const currentStepIndex = STEP_ORDER.indexOf(step);
  const canGoBack = currentStepIndex > 0;

  const handleBack = () => {
    if (canGoBack) {
      setStep(STEP_ORDER[currentStepIndex - 1]);
      setError(null);
    }
  };

  const handleNext = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < STEP_ORDER.length) {
      setStep(STEP_ORDER[nextIndex]);
      setError(null);
    }
  };

  const handleClose = () => {
    // Reset state
    setStep('design');
    setDesign('default');
    setName('');
    setMessage('');
    setSelectedAmount(null);
    setCustomAmount('');
    setError(null);
    onClose();
  };

  const handleCreate = async () => {
    if (!user?.id) return;
    const amount = getAmount();
    if (!amount) {
      setError('Selecciona o ingresa un monto');
      return;
    }
    if (amount < GIFT_CARD_CONFIG.minCreateAmount) {
      setError(`El monto mínimo es ${formatCOP(GIFT_CARD_CONFIG.minCreateAmount)}`);
      return;
    }

    setError(null);
    setLoading(true);

    try {
      await giftCardService.create(
        user.id,
        name || 'Gift Card',
        amount,
        design,
        message || undefined,
      );
      onSuccess?.();
      handleClose();
    } catch (e: any) {
      setError(e.message || t('giftCard.insufficientBalance'));
    }
    setLoading(false);
  };

  const amount = getAmount();
  const chosenDesign = DESIGNS.find(d => d.key === design) || DESIGNS[0];

  // ── Step content ───────────────────────────────────────────────

  const renderStep = () => {
    switch (step) {
      case 'design':
        return (
          <div>
            <h3 className="text-sm font-extrabold text-text-primary mb-1">
              Elige un diseño
            </h3>
            <p className="text-xs text-text-secondary mb-4">
              Selecciona el estilo de tu gift card
            </p>
            <div className="grid grid-cols-3 gap-2">
              {DESIGNS.map(d => (
                <button
                  key={d.key}
                  onClick={() => setDesign(d.key)}
                  className={`p-3 rounded-xl border-2 text-center transition-all ${
                    design === d.key
                      ? 'border-purple-500 bg-purple-50 shadow-sm'
                      : 'border-gray-200 bg-white hover:border-purple-200'
                  }`}
                >
                  <span className="text-3xl block mb-1">{d.emoji}</span>
                  <span className="text-[11px] font-bold text-text-primary">
                    {t(d.labelKey)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        );

      case 'name':
        return (
          <div>
            <h3 className="text-sm font-extrabold text-text-primary mb-1">
              Nombre de la gift card
            </h3>
            <p className="text-xs text-text-secondary mb-4">
              Así la identificarás en tu lista
            </p>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ej: Para mamá"
              maxLength={40}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold outline-none focus:border-purple-400 focus:bg-white transition-all"
              autoFocus
            />
            <div className="text-right text-xs text-text-muted mt-1">
              {name.length}/40
            </div>
          </div>
        );

      case 'message':
        return (
          <div>
            <h3 className="text-sm font-extrabold text-text-primary mb-1">
              Mensaje (opcional)
            </h3>
            <p className="text-xs text-text-secondary mb-4">
              Agrega una dedicatoria personal
            </p>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value.slice(0, 200))}
              placeholder="Ej: ¡Feliz cumpleaños! Disfruta tu regalo 🎂"
              maxLength={200}
              rows={3}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-purple-400 focus:bg-white transition-all resize-none"
            />
            <div className="text-right text-xs text-text-muted mt-1">
              {message.length}/200
            </div>
          </div>
        );

      case 'amount':
        return (
          <div>
            <h3 className="text-sm font-extrabold text-text-primary mb-1">
              Monto a cargar
            </h3>
            <p className="text-xs text-text-secondary mb-1">
              Mínimo {formatCOP(GIFT_CARD_CONFIG.minCreateAmount)}
            </p>

            <div className="grid grid-cols-2 gap-2 mb-4">
              {AMOUNT_PRESETS.map(preset => (
                <button
                  key={preset}
                  onClick={() => { setSelectedAmount(preset); setCustomAmount(''); }}
                  className={`py-3 rounded-xl text-sm font-bold transition-all ${
                    selectedAmount === preset
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'bg-gray-50 text-text-primary border border-gray-200 hover:border-purple-300'
                  }`}
                >
                  {formatCOP(preset)}
                </button>
              ))}
            </div>

            <div>
              <label className="text-xs font-bold text-text-secondary mb-1 block">
                Otro monto
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary font-bold text-sm">
                  $
                </span>
                <input
                  type="text"
                  value={customAmount}
                  onChange={e => {
                    setCustomAmount(e.target.value.replace(/[^0-9]/g, ''));
                    setSelectedAmount(null);
                  }}
                  placeholder="0"
                  className="w-full pl-8 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-lg font-extrabold outline-none focus:border-purple-400 focus:bg-white transition-all"
                />
              </div>
            </div>
          </div>
        );

      case 'confirm':
        return (
          <div>
            <h3 className="text-sm font-extrabold text-text-primary mb-1">
              Confirma tu gift card
            </h3>
            <p className="text-xs text-text-secondary mb-4">
              Revisa los detalles antes de crearla
            </p>

            {/* Preview card */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-2xl p-5 mb-4">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-4xl">{chosenDesign.emoji}</span>
                <div>
                  <div className="text-base font-extrabold text-text-primary">
                    {name || 'Gift Card'}
                  </div>
                  <div className="text-xs text-text-muted">
                    {chosenDesign.label}
                  </div>
                </div>
              </div>

              {message && (
                <div className="bg-white/70 rounded-xl p-3 mb-3">
                  <p className="text-xs text-text-secondary italic">
                    &ldquo;{message}&rdquo;
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-xs text-text-muted">Monto a cargar</span>
                <span className="text-xl font-extrabold text-purple-700">
                  {amount ? formatCOP(amount) : '—'}
                </span>
              </div>
            </div>

            {/* Descripción del costo */}
            <div className="text-xs text-text-secondary bg-gray-50 rounded-xl p-3 mb-1">
              Este monto se descontará de tu saldo principal para cargar la gift card.
            </div>
          </div>
        );
    }
  };

  // ── Footer ────────────────────────────────────────────────────

  const isLastStep = step === 'confirm';
  const canProceed = (() => {
    switch (step) {
      case 'design': return true;
      case 'name': return true; // Name can be empty (will default)
      case 'message': return true; // Message is optional
      case 'amount': return amount !== null && amount >= GIFT_CARD_CONFIG.minCreateAmount;
      case 'confirm': return true;
      default: return false;
    }
  })();

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-sm max-h-[90vh] overflow-y-auto p-6 animate-slide-up shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
              <Gift size={18} className="text-purple-600" />
            </div>
            <h2 className="text-lg font-extrabold text-text-primary">
              Nueva Gift Card
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} className="text-text-muted" />
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex gap-1.5 mb-5">
          {STEP_ORDER.map((s, i) => (
            <div
              key={s}
              className={`flex-1 h-1 rounded-full transition-colors ${
                i <= currentStepIndex
                  ? 'bg-purple-600'
                  : 'bg-gray-200'
              }`}
            />
          ))}
        </div>

        {/* Step content */}
        <div className="mb-6 min-h-[180px]">
          {renderStep()}
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 text-xs text-red-700 bg-red-50 rounded-xl px-3 py-2.5 mb-4">
            <AlertCircle size={14} className="text-red-500 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3">
          {canGoBack && (
            <button
              onClick={handleBack}
              disabled={loading}
              className="shrink-0 w-10 h-10 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-40"
            >
              <ArrowLeft size={18} className="text-text-primary" />
            </button>
          )}

          {isLastStep ? (
            <button
              onClick={handleCreate}
              disabled={!canProceed || loading}
              className="flex-1 py-3 bg-purple-600 text-white rounded-xl font-extrabold text-sm hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Creando...
                </>
              ) : (
                <>
                  <Check size={18} />
                  Crear gift card
                  {amount ? <> — {formatCOP(amount)}</> : null}
                </>
              )}
            </button>
          ) : (
            <button
              onClick={handleNext}
              disabled={!canProceed}
              className="flex-1 py-3 bg-purple-600 text-white rounded-xl font-extrabold text-sm hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
            >
              {step === 'amount' ? 'Revisar' : 'Continuar'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SendGiftCardModal;
