import React from 'react';
import { useNavigate } from 'react-router-dom';
import { httpsCallable } from 'firebase/functions';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { ArrowLeft, ShoppingBag, CreditCard, Shield, Lock, Truck, MapPin, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import { functions } from '../services/firebase';
import { openWompiCheckout } from '../services/paymentService';
import { DeliveryMethod } from '../types';
import { formatCOP, PAYMENT_METHODS } from '../config/constants';
import Button from '../components/ui/Button';
import TrustBadge from '../components/ui/TrustBadge';

interface CreateTransactionResponse {
  reference: string;
  amountInCents: number;
  currency: string;
  integrity?: string;
  paymentReady: boolean;
}

const createTransactionCallable = httpsCallable<
  { items: { listingId: string; quantity: number }[]; delivery: { method: DeliveryMethod; address?: string; name?: string; phone?: string } },
  CreateTransactionResponse
>(functions, 'createTransaction');

const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { items, totalPrice, clearCart } = useCart();
  const [address, setAddress] = React.useState('');
  const [name, setName] = React.useState(user?.fullName || '');
  const [phone, setPhone] = React.useState(user?.phone || '');
  const [submitting, setSubmitting] = React.useState(false);
  const [done, setDone] = React.useState<{ reference: string; paymentReady: boolean } | null>(null);
  const [error, setError] = React.useState<string | null>(null);

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
          <h2 className="text-xl font-extrabold mb-2">¡Pedido creado!</h2>
          <p className="text-sm text-text-secondary mb-6">
            {done.paymentReady
              ? 'Recibirás una notificación cuando el vendedor confirme.'
              : 'El pago con Wompi aún no está disponible. Tu pedido queda pendiente de pago — te avisaremos cuando puedas completarlo.'}
          </p>
          <button onClick={() => navigate(`/orders/${done.reference}`)} className="px-6 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-extrabold hover:bg-purple-700 transition-all active:scale-95 shadow-md shadow-purple-200">Ver mi pedido</button>
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
          <div><ShoppingBag size={48} className="mx-auto mb-4 text-text-muted" /><h2 className="text-lg font-extrabold mb-2">Tu carrito está vacío</h2><button onClick={() => navigate('/')} className="text-purple-600 font-bold">Ir al inicio</button></div>
        </div>
      </div>
    );
  }

  const handleCheckout = async () => {
    if (mixedSellers) {
      setError('Tu carrito tiene productos de distintos vendedores. Paga por separado a cada uno.');
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

      if (data.paymentReady && data.integrity) {
        openWompiCheckout({
          amountInCents: data.amountInCents,
          reference: data.reference,
          currency: data.currency,
          integrity: data.integrity,
          customerEmail: user!.email,
          customerFullName: name,
          customerPhone: phone,
          onSuccess: () => {
            clearCart();
            setDone({ reference: data.reference, paymentReady: true });
          },
          onError: () => {
            setError('El pago no se pudo procesar. Tu pedido sigue pendiente, puedes reintentarlo desde "Mis pedidos".');
            clearCart();
            setDone({ reference: data.reference, paymentReady: true });
          },
        });
      } else {
        clearCart();
        setDone({ reference: data.reference, paymentReady: false });
      }
    } catch (e: any) {
      setError(e?.message || 'Error al crear el pedido. Intenta de nuevo.');
    }
    setSubmitting(false);
  };

  return (
    <div className="pb-32 bg-brand-bg min-h-screen">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><ArrowLeft size={22} /></button>
          <h1 className="text-lg font-extrabold">Finalizar compra</h1>
        </div>
      </header>
      <main className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {mixedSellers && (
          <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl">
            <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
            <span className="text-xs font-semibold text-amber-700">Tu carrito tiene productos de distintos vendedores. Debes pagar por separado a cada uno — vuelve al carrito y quita los de un vendedor para continuar.</span>
          </div>
        )}
        {error && (
          <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl">
            <AlertTriangle size={16} className="text-red-600 shrink-0 mt-0.5" />
            <span className="text-xs font-semibold text-red-700">{error}</span>
          </div>
        )}
        <div className="bg-white rounded-xl border border-border p-5">
          <h3 className="text-sm font-extrabold mb-4 flex items-center gap-2"><MapPin size={16} className="text-purple-600" /> Información de contacto</h3>
          <div className="space-y-3">
            <div><label className="block text-xs font-bold text-text-secondary mb-1">Nombre</label><input value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 border border-border rounded-xl text-sm outline-none focus:border-purple-400 focus:bg-white transition-all" placeholder="Tu nombre" /></div>
            <div><label className="block text-xs font-bold text-text-secondary mb-1">Teléfono</label><input value={phone} onChange={e => setPhone(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 border border-border rounded-xl text-sm outline-none focus:border-purple-400 focus:bg-white transition-all" placeholder="300 123 4567" /></div>
            <div><label className="block text-xs font-bold text-text-secondary mb-1">Dirección (opcional — vacío = recogida local)</label><input value={address} onChange={e => setAddress(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 border border-border rounded-xl text-sm outline-none focus:border-purple-400 focus:bg-white transition-all" placeholder="Calle 123 # 45-67" /></div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-border p-5">
          <h3 className="text-sm font-extrabold mb-4 flex items-center gap-2"><ShoppingBag size={16} className="text-purple-600" /> Resumen</h3>
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
            <div className="flex justify-between text-sm"><span className="text-text-secondary">Subtotal</span><span className="font-bold">{formatCOP(totalPrice)}</span></div>
            <div className="flex justify-between text-sm"><span className="text-text-secondary">Envío, comisión e impuestos</span><span className="font-bold text-text-muted">Se calculan al confirmar</span></div>
          </div>
        </div>

        {/* Dynamic Trust Badge & Payment Methods */}
        <div className="space-y-3">
          <TrustBadge />
          <div className="bg-white rounded-xl border border-border p-4">
            <div className="text-xs font-extrabold mb-2.5 text-slate-800 dark:text-slate-200">Métodos de pago aceptados</div>
            <div className="flex flex-wrap gap-2">
              {PAYMENT_METHODS.map(m => (
                <div key={m.id} className="px-3 py-1.5 bg-gray-50 dark:bg-slate-800 rounded-lg border border-border text-xs font-semibold text-text-secondary">
                  {m.label}
                </div>
              ))}
            </div>
          </div>
        </div>

        <Button
          fullWidth
          size="lg"
          onClick={handleCheckout}
          loading={submitting}
          disabled={submitting || mixedSellers}
        >
          Pagar {formatCOP(totalPrice)} <CreditCard size={18} />
        </Button>
        <div className="flex items-center gap-2 justify-center text-[10px] text-text-muted">
          <Truck size={12} /> {address ? 'Envío a domicilio' : 'Recogida local'}
        </div>
      </main>
    </div>
  );
};

export default CheckoutPage;
