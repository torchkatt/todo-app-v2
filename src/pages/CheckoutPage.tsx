import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { httpsCallable } from 'firebase/functions';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useSubscriptionPlans } from '../context/SubscriptionPlanContext';
import { ArrowLeft, ShoppingBag, CreditCard, Truck, MapPin, CheckCircle, AlertTriangle, Crown, Wallet, Ticket, Tag } from 'lucide-react';
import { functions } from '../services/firebase';
import { openWompiCheckout } from '../services/paymentService';
import { walletService } from '../services/walletService';
import { couponService } from '../services/couponService';
import { DeliveryMethod } from '../types';
import { formatCOP, PAYMENT_METHODS } from '../config/constants';
import Button from '../components/ui/Button';
import TrustBadge from '../components/ui/TrustBadge';

interface CreateTransactionResponse {
  reference: string;
  orderId?: string;
  amountInCents: number;
  currency: string;
  integrity?: string;
  integritySignature?: string;
  paymentReady: boolean;
}

const createTransactionCallable = httpsCallable<
  { items: { listingId: string; quantity: number }[]; delivery: { method: DeliveryMethod; address?: string; name?: string; phone?: string } },
  CreateTransactionResponse
>(functions, 'createTransaction');

const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { t } = useTranslation();
  const { items, totalPrice, clearCart } = useCart();
  const { currentTier, currentPlan } = useSubscriptionPlans();
  const [address, setAddress] = React.useState('');
  const [name, setName] = React.useState(user?.fullName || '');
  const [phone, setPhone] = React.useState(user?.phone || '');
  const [submitting, setSubmitting] = React.useState(false);
  const [done, setDone] = React.useState<{ reference: string; paymentReady: boolean } | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [walletBalance, setWalletBalance] = React.useState<number | null>(null);
  const [payWithWallet, setPayWithWallet] = React.useState(false);

  // Coupon state
  const [couponCode, setCouponCode] = React.useState('');
  const [couponApplying, setCouponApplying] = React.useState(false);
  const [couponError, setCouponError] = React.useState<string | null>(null);
  const [appliedCoupon, setAppliedCoupon] = React.useState<{
    code: string;
    couponId: string;
    discount: number;
    finalTotal: number;
  } | null>(null);

  React.useEffect(() => {
    if (!user?.id) return;
    walletService.getBalance(user.id).then(setWalletBalance).catch(() => {});
  }, [user?.id]);

  if (!isAuthenticated) {
    navigate('/login', { state: { from: '/checkout' } });
    return null;
  }

  const distinctSellers = new Set(items.map((i) => i.sellerId));
  const mixedSellers = distinctSellers.size > 1;

  if (done) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center p-8">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4"><CheckCircle size={40} className="text-emerald-500" /></div>
          <h2 className="text-xl font-extrabold mb-2">{t('checkout.orderCreated')}</h2>
          <p className="text-sm text-text-secondary mb-6">
            {done.paymentReady
              ? t('checkout.paymentReady')
              : t('checkout.paymentPending')}
          </p>
          <button onClick={() => navigate(`/orders/${done.reference}`)} className="px-6 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-extrabold hover:bg-purple-700 transition-all active:scale-95 shadow-md shadow-purple-200">{t('checkout.viewOrder')}</button>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-brand-bg flex flex-col">
        <header className="bg-white/80 backdrop-blur-xl border-b border-border px-4 py-3">
          <button onClick={() => navigate('/')} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><ArrowLeft size={22} /></button>
        </header>
        <div className="flex-1 flex items-center justify-center text-center p-8">
          <div><ShoppingBag size={48} className="mx-auto mb-4 text-text-muted" /><h2 className="text-lg font-extrabold mb-2">{t('checkout.empty')}</h2><button onClick={() => navigate('/')} className="text-purple-600 font-bold">{t('checkout.goHome')}</button></div>
        </div>
      </div>
    );
  }

  const handleCheckout = async () => {
    if (mixedSellers) {
      setError(t('checkout.mixedSellers'));
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const deliveryMethod = address.trim() ? DeliveryMethod.SHIPPING : DeliveryMethod.PICKUP;
      const { data } = await createTransactionCallable({
        items: items.map((i) => ({ listingId: i.listingId, quantity: i.quantity })),
        delivery: { method: deliveryMethod, address: address || undefined, name, phone },
      });

      const reference = data.reference || data.orderId;
      const integrity = data.integrity || data.integritySignature;

      if (!reference) {
        throw new Error('No se recibió la referencia del pedido.');
      }

      // Capture coupon for redemption after payment
      const capturedCoupon = appliedCoupon;

      if (data.paymentReady && integrity) {
        openWompiCheckout({
          amountInCents: data.amountInCents,
          reference,
          currency: data.currency,
          integrity,
          customerEmail: user!.email,
          customerFullName: name,
          customerPhone: phone,
          onSuccess: async () => {
            if (capturedCoupon) {
              try { await couponService.redeem(capturedCoupon.couponId, user!.id, reference); } catch {}
            }
            clearCart();
            setDone({ reference, paymentReady: true });
          },
          onError: async () => {
            if (capturedCoupon) {
              try { await couponService.redeem(capturedCoupon.couponId, user!.id, reference); } catch {}
            }
            setError('El pago no se pudo procesar. Tu pedido sigue pendiente, puedes reintentarlo desde "Mis pedidos".');
            clearCart();
            setDone({ reference, paymentReady: true });
          },
        });
      } else {
        clearCart();
        setDone({ reference, paymentReady: false });
      }
    } catch (e: any) {
      setError(e?.message || 'Error al crear el pedido. Intenta de nuevo.');
    }
    setSubmitting(false);
  };

  const handleWalletCheckout = async () => {
    if (!user?.id) return;
    setSubmitting(true);
    setError(null);
    try {
      const deliveryMethod = address.trim() ? DeliveryMethod.SHIPPING : DeliveryMethod.PICKUP;
      const { data } = await createTransactionCallable({
        items: items.map((i) => ({ listingId: i.listingId, quantity: i.quantity })),
        delivery: { method: deliveryMethod, address: address || undefined, name, phone },
      });
      const reference = data.reference || data.orderId;
      if (!reference) throw new Error('No se recibió referencia');

      const capturedCoupon = appliedCoupon;

      await walletService.payWithWallet(user.id, effectiveTotal, reference);
      if (capturedCoupon) {
        try { await couponService.redeem(capturedCoupon.couponId, user.id, reference); } catch {}
      }
      clearCart();
      setDone({ reference, paymentReady: true });
    } catch (e: any) {
      setError(e?.message || 'Error al pagar con wallet');
    }
    setSubmitting(false);
  };

  const handleApplyCoupon = async () => {
    if (!user?.id || !couponCode.trim()) return;
    setCouponApplying(true);
    setCouponError(null);
    try {
      const result = await couponService.apply(couponCode.trim(), user.id, totalPrice);
      setAppliedCoupon({
        code: result.coupon.code,
        couponId: result.coupon.id,
        discount: result.discount,
        finalTotal: result.finalTotal,
      });
      setCouponCode('');
    } catch (e: any) {
      setCouponError(e?.message || 'Cupón inválido');
      setAppliedCoupon(null);
    }
    setCouponApplying(false);
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError(null);
  };

  const effectiveTotal = appliedCoupon ? appliedCoupon.finalTotal : totalPrice;

  return (
    <div className="pb-32 bg-brand-bg min-h-screen">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><ArrowLeft size={22} /></button>
          <h1 className="text-lg font-extrabold">{t('checkout.title')}</h1>
        </div>
      </header>
      <main className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {mixedSellers && (
          <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl">
            <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
            <span className="text-xs font-semibold text-amber-700">{t('checkout.mixedSellers')}</span>
          </div>
        )}
        {error && (
          <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl">
            <AlertTriangle size={16} className="text-red-600 shrink-0 mt-0.5" />
            <span className="text-xs font-semibold text-red-700">{error}</span>
          </div>
        )}
        <div className="bg-white rounded-xl border border-border p-5">
          <h3 className="text-sm font-extrabold mb-4 flex items-center gap-2"><MapPin size={16} className="text-purple-600" /> {t('checkout.contactInfo')}</h3>
          <div className="space-y-3">
            <div><label className="block text-xs font-bold text-text-secondary mb-1">{t('checkout.name')}</label><input value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 border border-border rounded-xl text-sm outline-none focus:border-purple-400 focus:bg-white transition-all" placeholder={t('checkout.name')} /></div>
            <div><label className="block text-xs font-bold text-text-secondary mb-1">{t('checkout.phone')}</label><input value={phone} onChange={e => setPhone(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 border border-border rounded-xl text-sm outline-none focus:border-purple-400 focus:bg-white transition-all" placeholder="300 123 4567" /></div>
            <div><label className="block text-xs font-bold text-text-secondary mb-1">{t('checkout.address')}</label><input value={address} onChange={e => setAddress(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 border border-border rounded-xl text-sm outline-none focus:border-purple-400 focus:bg-white transition-all" placeholder="Calle 123 # 45-67" /></div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-border p-5">
          <h3 className="text-sm font-extrabold mb-4 flex items-center gap-2"><ShoppingBag size={16} className="text-purple-600" /> {t('checkout.summary')}</h3>
          <div className="space-y-3 mb-4">
            {items.map(item => (
              <div key={item.listingId} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-lg">{item.icon || '📦'}</div>
                <div className="flex-1 min-w-0"><div className="text-xs font-bold text-text-primary truncate">{item.title}</div><div className="text-[11px] text-text-muted">x{item.quantity}</div></div>
                <div className="text-xs font-extrabold text-text-primary">{formatCOP(item.price * item.quantity)}</div>
              </div>
            ))}
          </div>
          <div className="border-t border-border pt-3 space-y-1.5">
            {/* TodoPass free shipping badge */}
            {(currentTier === 'pro' || currentTier === 'black') && address.trim() && (
              <div className="flex items-center gap-2 p-2 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg mb-2">
                <Crown size={14} className="text-purple-600 shrink-0" />
                <span className="text-[11px] font-bold text-purple-700">{t('checkout.freeShippingPro')}</span>
              </div>
            )}
            {/* Upsell for free users */}
            {currentTier === 'free' && address.trim() && effectiveTotal >= 150000 && (
              <div className="flex items-center gap-2 p-2 bg-amber-50 rounded-lg mb-2">
                <Crown size={14} className="text-amber-600 shrink-0" />
                <span className="text-[11px] font-bold text-amber-700">{t('checkout.freeShippingUpsell')}</span>
              </div>
            )}
            <div className="flex justify-between text-sm"><span className="text-text-secondary">{t('checkout.subtotal')}</span><span className="font-bold">{formatCOP(totalPrice)}</span></div>
            <div className="flex justify-between text-sm"><span className="text-text-secondary">Envío, comisión e impuestos</span><span className="font-bold text-text-muted">{t('checkout.shippingCalc')}</span></div>
          </div>
        </div>

        {/* Coupon section */}
        <div className="bg-white rounded-xl border border-border p-5">
          <h3 className="text-sm font-extrabold mb-3 flex items-center gap-2">
            <Ticket size={16} className="text-purple-600" /> {t('checkout.coupon') || 'Cupón de descuento'}
          </h3>

          {appliedCoupon ? (
            <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
              <div className="flex items-center gap-2">
                <Tag size={14} className="text-emerald-600" />
                <div>
                  <div className="text-xs font-extrabold text-emerald-700 font-mono">{appliedCoupon.code}</div>
                  <div className="text-[11px] font-semibold text-emerald-600">
                    {formatCOP(appliedCoupon.discount)} de descuento
                  </div>
                </div>
              </div>
              <button
                onClick={handleRemoveCoupon}
                className="text-[10px] font-bold text-emerald-700 hover:text-red-600 transition-colors"
              >
                Quitar
              </button>
            </div>
          ) : (
            <>
              <div className="flex gap-2">
                <input
                  value={couponCode}
                  onChange={e => { setCouponCode(e.target.value); setCouponError(null); }}
                  onKeyDown={e => e.key === 'Enter' && handleApplyCoupon()}
                  placeholder="Código de cupón"
                  className="flex-1 px-4 py-2.5 bg-gray-50 border border-border rounded-xl text-sm outline-none focus:border-purple-400 focus:bg-white transition-all uppercase"
                />
                <Button
                  size="sm"
                  onClick={handleApplyCoupon}
                  loading={couponApplying}
                  disabled={couponApplying || !couponCode.trim()}
                >
                  Aplicar
                </Button>
              </div>
              {couponError && (
                <p className="mt-2 text-xs font-semibold text-red-500">{couponError}</p>
              )}
            </>
          )}
        </div>

        {/* Wallet option & Payment Methods */}
        <div className="space-y-3">
          {/* Wallet toggle */}
          {walletBalance !== null && (
            <div className="bg-white rounded-xl border border-border p-4">
              <button
                onClick={() => setPayWithWallet(!payWithWallet)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${
                  payWithWallet ? 'border-purple-400 bg-purple-50' : 'border-border hover:border-purple-200'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${payWithWallet ? 'bg-purple-600 text-white' : 'bg-gray-50 text-text-secondary'}`}>
                  <Wallet size={18} />
                </div>
                <div className="flex-1 text-left">
                  <div className="text-sm font-extrabold text-text-primary">{t('checkout.payWithWallet')}</div>
                  <div className={`text-xs font-semibold ${walletBalance >= effectiveTotal ? 'text-emerald-600' : 'text-red-500'}`}>
                    {walletBalance >= effectiveTotal
                      ? t('wallet.available', { balance: formatCOP(walletBalance) })
                      : t('wallet.insufficient', { balance: formatCOP(walletBalance) })}
                  </div>
                </div>
                {payWithWallet && <span className="text-purple-600 text-xs font-bold">✓</span>}
              </button>
            </div>
          )}
          <TrustBadge />
          <div className="bg-white rounded-xl border border-border p-4">
            <div className="text-xs font-extrabold mb-2.5 text-slate-800 dark:text-slate-200">{t('checkout.paymentMethods')}</div>
            <div className="flex flex-wrap gap-2">
              {PAYMENT_METHODS.map(m => (
                <div key={m.id} className="px-3 py-1.5 bg-gray-50 dark:bg-slate-800 rounded-lg border border-border text-xs font-semibold text-text-secondary">
                  {m.label}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Coupon discount line in order summary */}
        {appliedCoupon && (
          <div className="flex justify-between text-sm">
            <span className="text-emerald-600 font-semibold flex items-center gap-1">
              <Tag size={12} /> Descuento ({appliedCoupon.code})
            </span>
            <span className="font-bold text-emerald-600">-{formatCOP(appliedCoupon.discount)}</span>
          </div>
        )}
        {appliedCoupon && (
          <div className="flex justify-between text-sm pt-1 border-t border-border">
            <span className="text-text-primary font-extrabold">Total</span>
            <span className="font-extrabold text-purple-600">{formatCOP(effectiveTotal)}</span>
          </div>
        )}

        <Button
          fullWidth
          size="lg"
          onClick={payWithWallet ? handleWalletCheckout : handleCheckout}
          loading={submitting}
          disabled={submitting || mixedSellers || (payWithWallet && walletBalance !== null && walletBalance < effectiveTotal)}
        >
          {payWithWallet ? (
            <>{t('checkout.payWithWallet')} {formatCOP(effectiveTotal)} <Wallet size={18} /></>
          ) : (
            <>{t('checkout.pay')} {formatCOP(effectiveTotal)} <CreditCard size={18} /></>
          )}
        </Button>
        <div className="flex items-center gap-2 justify-center text-[10px] text-text-muted">
          <Truck size={12} /> {address ? 'Envío a domicilio' : 'Recogida local'}
        </div>
      </main>
    </div>
  );
};

export default CheckoutPage;
