import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import {
  Sparkles, ShoppingBag, Store, MapPin, Truck, Check, ArrowLeft,
  ArrowRight, Loader2, X, Package,   
} from 'lucide-react';
import { sellerService, type OnboardingData } from '../services/sellerService';
import { getRootCategories, getSubcategories } from '../services/categoryService';
import { CIUDADES_COLOMBIA } from '../config/constants';
import type { Category } from '../types';
import { SellerType, UserRole } from '../types';

// ─── STEP CONFIG ─────────────────────────────────────────────────────────────
const STEPS = [
  { id: 1, titleKey: 'sellerOnboarding.step1.title', icon: ShoppingBag },
  { id: 2, titleKey: 'sellerOnboarding.step2.title', icon: Store },
  { id: 3, titleKey: 'sellerOnboarding.step3.title', icon: MapPin },
  { id: 4, titleKey: 'sellerOnboarding.step4.title', icon: Truck },
  { id: 5, titleKey: 'sellerOnboarding.step5.title', icon: Sparkles },
];

const SELLER_TYPE_OPTIONS: { value: SellerType; icon: string; titleKey: string; descKey: string }[] = [
  { value: SellerType.RETAIL, icon: '📦', titleKey: 'sellerOnboarding.step1.product', descKey: 'sellerOnboarding.step1.productDesc' },
  { value: SellerType.SERVICE, icon: '🔧', titleKey: 'sellerOnboarding.step1.service', descKey: 'sellerOnboarding.step1.serviceDesc' },
  { value: SellerType.DIGITAL, icon: '💾', titleKey: 'sellerOnboarding.step1.digital', descKey: 'sellerOnboarding.step1.digitalDesc' },
  { value: SellerType.INDIVIDUAL, icon: '👤', titleKey: 'sellerOnboarding.step1.individual', descKey: 'sellerOnboarding.step1.individualDesc' },
];

// ─── PAGE ────────────────────────────────────────────────────────────────────
const SellerOnboarding: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, switchRole } = useAuth();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [data, setData] = useState<OnboardingData>({});

  // Cargar onboarding existente + categorías
  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      try {
        const [onboarding, cats] = await Promise.all([
          sellerService.getOrCreateOnboarding(user.id),
          getRootCategories().catch(() => []),
        ]);
        if (onboarding.onboardingStep) setStep(onboarding.onboardingStep);
        setData(onboarding);
        setCategories(cats || []);
      } catch { /* continue with defaults */ }
      setLoading(false);
    })();
  }, [user?.id]);

  const update = (partial: Partial<OnboardingData>) => setData(prev => ({ ...prev, ...partial }));

  const saveAndNext = async () => {
    if (!user?.id) return;
    setSaving(true);
    try {
      await sellerService.saveStep(user.id, step, data);
      if (step < 5) setStep(s => s + 1);
    } catch { /* silent */ }
    setSaving(false);
  };

  const handleComplete = async () => {
    if (!user?.id || !user) return;
    setSaving(true);
    try {
      await sellerService.completeOnboarding(user.id, user, data);
      await switchRole(UserRole.SELLER);
      navigate('/seller?first=true');
    } catch { /* silent */ }
    setSaving(false);
  };

  const canProceed = (): boolean => {
    switch (step) {
      case 1: return !!data.type;
      case 2: return !!data.name?.trim();
      case 3: return !!data.city;
      case 4: return true; // delivery es opcional
      case 5: return !!data.tosAccepted;
      default: return false;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-bg pb-24">
      {/* ── Header ── */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-border px-4 py-3">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <button onClick={() => step > 1 ? setStep(s => s - 1) : navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-sm font-extrabold flex items-center gap-2">
            <Store size={16} className="text-purple-600" />
            {t('sellerOnboarding.title')}
          </h1>
          <button onClick={() => navigate('/')} className="p-2 hover:bg-gray-100 rounded-full">
            <X size={20} />
          </button>
        </div>
        {/* Progress bar */}
        <div className="max-w-2xl mx-auto mt-3 flex gap-1.5">
          {STEPS.map(s => (
            <div key={s.id} className={`flex-1 h-1.5 rounded-full transition-colors ${
              s.id <= step ? 'bg-purple-600' : 'bg-gray-200'
            }`} />
          ))}
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 pt-8">
        {/* ═══════════════════ STEP 1: TYPE & CATEGORIES ═══════════════════ */}
        {step === 1 && (
          <div className="animate-fade-in">
            <div className="text-center mb-8">
              <span className="inline-block px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-bold mb-3">Paso 1 de 5</span>
              <h2 className="text-2xl font-black text-text-primary">{t('sellerOnboarding.step1.title')}</h2>
              <p className="text-sm text-text-secondary mt-2">{t('sellerOnboarding.step1.subtitle')}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {SELLER_TYPE_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => update({ type: opt.value })}
                  className={`p-5 rounded-2xl border-2 text-left transition-all ${
                    data.type === opt.value
                      ? 'border-purple-500 bg-purple-50 shadow-md'
                      : 'border-gray-200 bg-white hover:border-purple-200'
                  }`}
                >
                  <span className="text-3xl">{opt.icon}</span>
                  <h3 className="text-sm font-extrabold text-text-primary mt-3">{t(opt.titleKey)}</h3>
                  <p className="text-xs text-text-secondary mt-1">{t(opt.descKey)}</p>
                </button>
              ))}
            </div>
            {data.type && categories.length > 0 && (
              <div className="mt-6">
                <p className="text-sm font-bold text-text-primary mb-3">{t('sellerOnboarding.step1.categories')}</p>
                <div className="flex flex-wrap gap-2">
                  {categories.map(c => {
                    const active = data.categoryIds?.includes(c.id);
                    return (
                      <button
                        key={c.id}
                        onClick={() => {
                          const ids = data.categoryIds || [];
                          update({ categoryIds: active ? ids.filter(id => id !== c.id) : [...ids, c.id] });
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                          active ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-text-secondary border-gray-200 hover:border-purple-200'
                        }`}
                      >
                        {c.icon} {c.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════ STEP 2: STORE INFO ═══════════════════ */}
        {step === 2 && (
          <div className="animate-fade-in">
            <div className="text-center mb-8">
              <span className="inline-block px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-bold mb-3">Paso 2 de 5</span>
              <h2 className="text-2xl font-black text-text-primary">{t('sellerOnboarding.step2.title')}</h2>
              <p className="text-sm text-text-secondary mt-2">{t('sellerOnboarding.step2.subtitle')}</p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-text-primary mb-1.5 block">{t('sellerOnboarding.step2.nameLabel')}</label>
                <input
                  type="text"
                  value={data.name || ''}
                  onChange={e => update({ name: e.target.value })}
                  placeholder={t('sellerOnboarding.step2.namePlaceholder', { name: user?.fullName || '' })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-purple-300"
                  maxLength={60}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-text-primary mb-1.5 block">{t('sellerOnboarding.step2.descLabel')}</label>
                <textarea
                  value={data.description || ''}
                  onChange={e => update({ description: e.target.value })}
                  placeholder={t('sellerOnboarding.step2.descPlaceholder')}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-purple-300 resize-none"
                  rows={4}
                  maxLength={500}
                />
                <span className="text-[10px] text-text-muted">{(data.description || '').length}/500</span>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════ STEP 3: LOCATION & CONTACT ═══════════════════ */}
        {step === 3 && (
          <div className="animate-fade-in">
            <div className="text-center mb-8">
              <span className="inline-block px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-bold mb-3">Paso 3 de 5</span>
              <h2 className="text-2xl font-black text-text-primary">{t('sellerOnboarding.step3.title')}</h2>
              <p className="text-sm text-text-secondary mt-2">{t('sellerOnboarding.step3.subtitle')}</p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-text-primary mb-1.5 block">{t('sellerOnboarding.step3.cityLabel')}</label>
                <select
                  value={data.city || ''}
                  onChange={e => update({ city: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-purple-300 bg-white"
                >
                  <option value="">{t('sellerOnboarding.step3.cityPlaceholder')}</option>
                  {CIUDADES_COLOMBIA.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-text-primary mb-1.5 block">{t('sellerOnboarding.step3.addressLabel')}</label>
                <input
                  type="text" value={data.address || ''}
                  onChange={e => update({ address: e.target.value })}
                  placeholder="Cra 5 #10-20, Centro"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-purple-300"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-text-primary mb-1.5 block">{t('sellerOnboarding.step3.phoneLabel')}</label>
                <input
                  type="tel" value={data.phone || user?.phone || ''}
                  onChange={e => update({ phone: e.target.value })}
                  placeholder="+57 300 123 4567"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-purple-300"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-text-primary mb-1.5 block">WhatsApp</label>
                  <input type="tel" value={data.whatsapp || ''} onChange={e => update({ whatsapp: e.target.value })}
                    placeholder="+57 300..."
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-purple-300" />
                </div>
                <div>
                  <label className="text-xs font-bold text-text-primary mb-1.5 block">{t('sellerOnboarding.step3.websiteLabel')}</label>
                  <input type="url" value={data.website || ''} onChange={e => update({ website: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-purple-300" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════ STEP 4: DELIVERY ═══════════════════ */}
        {step === 4 && (
          <div className="animate-fade-in">
            <div className="text-center mb-8">
              <span className="inline-block px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-bold mb-3">Paso 4 de 5</span>
              <h2 className="text-2xl font-black text-text-primary">{t('sellerOnboarding.step4.title')}</h2>
              <p className="text-sm text-text-secondary mt-2">{t('sellerOnboarding.step4.subtitle')}</p>
            </div>
            <div className="space-y-5">
              <label className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200 cursor-pointer">
                <div>
                  <span className="text-sm font-bold text-text-primary">{t('sellerOnboarding.step4.deliveryToggle')}</span>
                  <p className="text-xs text-text-secondary mt-0.5">{t('sellerOnboarding.step4.deliveryDesc')}</p>
                </div>
                <input type="checkbox" checked={data.deliveryEnabled || false}
                  onChange={e => update({ deliveryEnabled: e.target.checked })}
                  className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500" />
              </label>

              {data.deliveryEnabled && (
                <div className="pl-4 space-y-3 border-l-2 border-purple-200">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-text-primary mb-1 block">{t('sellerOnboarding.step4.baseFee')}</label>
                      <input type="number" value={data.baseFee || 0}
                        onChange={e => update({ baseFee: Number(e.target.value) })}
                        className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-purple-300" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-text-primary mb-1 block">{t('sellerOnboarding.step4.pricePerKm')}</label>
                      <input type="number" value={data.pricePerKm || 0}
                        onChange={e => update({ pricePerKm: Number(e.target.value) })}
                        className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-purple-300" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-text-primary mb-1 block">{t('sellerOnboarding.step4.maxDistance')}</label>
                      <input type="number" value={data.maxDistanceKm || 0}
                        onChange={e => update({ maxDistanceKm: Number(e.target.value) })}
                        className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-purple-300" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-text-primary mb-1 block">{t('sellerOnboarding.step4.estimatedTime')}</label>
                      <input type="text" value={data.estimatedTime || ''}
                        onChange={e => update({ estimatedTime: e.target.value })}
                        placeholder="30-45 min"
                        className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-purple-300" />
                    </div>
                  </div>
                </div>
              )}

              <label className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200 cursor-pointer">
                <div>
                  <span className="text-sm font-bold text-text-primary">{t('sellerOnboarding.step4.pickupToggle')}</span>
                  <p className="text-xs text-text-secondary mt-0.5">{t('sellerOnboarding.step4.pickupDesc')}</p>
                </div>
                <input type="checkbox" checked={data.pickupEnabled || false}
                  onChange={e => update({ pickupEnabled: e.target.checked })}
                  className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500" />
              </label>
            </div>
          </div>
        )}

        {/* ═══════════════════ STEP 5: REVIEW & PUBLISH ═══════════════════ */}
        {step === 5 && (
          <div className="animate-fade-in">
            <div className="text-center mb-8">
              <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold mb-3">Paso 5 de 5</span>
              <h2 className="text-2xl font-black text-text-primary">{t('sellerOnboarding.step5.title')}</h2>
              <p className="text-sm text-text-secondary mt-2">{t('sellerOnboarding.step5.subtitle')}</p>
            </div>

            {/* Summary cards */}
            <div className="space-y-3 mb-8">
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <h3 className="text-xs font-extrabold text-purple-600 mb-2 flex items-center gap-1.5">
                  <ShoppingBag size={14} /> {t('sellerOnboarding.step1.title')}
                </h3>
                <p className="text-sm font-bold text-text-primary">{data.type ? t(`sellerOnboarding.step1.${data.type}`) : '—'}</p>
                {data.categoryIds && data.categoryIds.length > 0 && (
                  <p className="text-xs text-text-secondary mt-1">{data.categoryIds.length} categorías seleccionadas</p>
                )}
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <h3 className="text-xs font-extrabold text-purple-600 mb-2 flex items-center gap-1.5">
                  <Store size={14} /> {t('sellerOnboarding.step2.title')}
                </h3>
                <p className="text-sm font-bold text-text-primary">{data.name || '—'}</p>
                {data.description && <p className="text-xs text-text-secondary mt-1 line-clamp-2">{data.description}</p>}
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <h3 className="text-xs font-extrabold text-purple-600 mb-2 flex items-center gap-1.5">
                  <MapPin size={14} /> {t('sellerOnboarding.step3.title')}
                </h3>
                <p className="text-sm font-bold text-text-primary">{data.city || '—'}</p>
                {data.phone && <p className="text-xs text-text-secondary">{data.phone}</p>}
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <h3 className="text-xs font-extrabold text-purple-600 mb-2 flex items-center gap-1.5">
                  <Truck size={14} /> {t('sellerOnboarding.step4.title')}
                </h3>
                <p className="text-sm text-text-primary">
                  {data.deliveryEnabled ? `Envío desde COP ${data.baseFee || 0}` : 'Sin envío'}
                  {data.pickupEnabled ? ' · Recogida disponible' : ''}
                </p>
              </div>
            </div>

            {/* TOS checkbox */}
            <label className="flex items-start gap-3 p-4 bg-amber-50 rounded-xl border border-amber-200 cursor-pointer">
              <input type="checkbox" checked={data.tosAccepted || false}
                onChange={e => update({ tosAccepted: e.target.checked })}
                className="mt-0.5 w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500" />
              <div>
                <span className="text-sm font-bold text-amber-800">{t('sellerOnboarding.step5.tosLabel')}</span>
                <p className="text-xs text-amber-700 mt-0.5">{t('sellerOnboarding.step5.tosDesc')}</p>
              </div>
            </label>
          </div>
        )}

        {/* ── Navigation Buttons ── */}
        <div className="mt-8 flex gap-3">
          {step > 1 && (
            <button onClick={() => setStep(s => s - 1)}
              className="flex-1 px-5 py-3.5 rounded-xl border border-gray-200 text-sm font-extrabold text-text-primary
                hover:bg-gray-50 transition-all active:scale-95">
              {t('common.back')}
            </button>
          )}
          {step < 5 ? (
            <button onClick={saveAndNext} disabled={!canProceed() || saving}
              className="flex-1 px-5 py-3.5 rounded-xl bg-purple-600 text-white text-sm font-extrabold
                hover:bg-purple-700 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2">
              {saving ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
              {t('sellerOnboarding.next')}
            </button>
          ) : (
            <button onClick={handleComplete} disabled={!canProceed() || saving}
              className="flex-1 px-5 py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 text-white text-sm font-extrabold
                hover:from-emerald-700 hover:to-green-700 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-emerald-200">
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
              {t('sellerOnboarding.publish')}
            </button>
          )}
        </div>
      </main>
    </div>
  );
};

export default SellerOnboarding;
