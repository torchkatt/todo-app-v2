import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { ArrowLeft, ShoppingBag, CreditCard, Shield, Truck, MapPin, Loader2, CheckCircle } from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../services/firebase';

const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { items, totalPrice, clearCart } = useCart();
  const [address, setAddress] = React.useState('');
  const [name, setName] = React.useState(user?.fullName || '');
  const [phone, setPhone] = React.useState(user?.phone || '');
  const [submitting, setSubmitting] = React.useState(false);
  const [done, setDone] = React.useState(false);

  if (!isAuthenticated) {
    navigate('/login', { state: { from: '/checkout' } });
    return null;
  }

  if (done) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center p-8">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4"><CheckCircle size={40} className="text-emerald-500" /></div>
          <h2 className="text-xl font-extrabold mb-2">¡Pedido creado!</h2>
          <p className="text-sm text-text-secondary mb-6">Recibirás una notificación cuando el vendedor confirme.</p>
          <button onClick={() => navigate('/orders')} className="px-6 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-extrabold hover:bg-purple-700 transition-all active:scale-95 shadow-md shadow-purple-200">Ver mis pedidos</button>
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
    setSubmitting(true);
    try {
      const sellerId = items[0]?.sellerId || 'unknown';
      const transaction = {
        buyerId: user!.id,
        sellerId,
        lineItems: items.map(i => ({ listingId: i.listingId, title: i.title, price: i.price, quantity: i.quantity })),
        totalAmount: totalPrice,
        status: 'PENDING_PAYMENT',
        payment: { method: 'simulated', status: 'pending' },
        delivery: { address, name, phone, method: address ? 'shipping' : 'pickup' },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      await addDoc(collection(db, 'transactions'), transaction);

      // Update user impact stats
      await import('firebase/firestore').then(async ({ updateDoc, doc }) => {
        const ref = doc(db, 'users', user!.id);
        const snap = await import('firebase/firestore').then(({ getDoc }) => getDoc(ref));
        if (snap.exists()) {
          const u = snap.data();
          await updateDoc(ref, {
            'impact.totalTransactions': (u.impact?.totalTransactions || 0) + 1,
            'impact.totalSpent': (u.impact?.totalSpent || 0) + totalPrice,
            'impact.streak.current': (u.impact?.streak?.current || 0) + 1,
            'impact.streak.lastActivity': new Date().toISOString(),
          });
        }
      });

      clearCart();
      setDone(true);
    } catch (e) {
      alert('Error al crear el pedido. Intenta de nuevo.');
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
        <div className="bg-white rounded-xl border border-border p-5">
          <h3 className="text-sm font-extrabold mb-4 flex items-center gap-2"><MapPin size={16} className="text-purple-600" /> Información de contacto</h3>
          <div className="space-y-3">
            <div><label className="block text-xs font-bold text-text-secondary mb-1">Nombre</label><input value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 border border-border rounded-xl text-sm outline-none focus:border-purple-400 focus:bg-white transition-all" placeholder="Tu nombre" /></div>
            <div><label className="block text-xs font-bold text-text-secondary mb-1">Teléfono</label><input value={phone} onChange={e => setPhone(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 border border-border rounded-xl text-sm outline-none focus:border-purple-400 focus:bg-white transition-all" placeholder="300 123 4567" /></div>
            <div><label className="block text-xs font-bold text-text-secondary mb-1">Dirección</label><input value={address} onChange={e => setAddress(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 border border-border rounded-xl text-sm outline-none focus:border-purple-400 focus:bg-white transition-all" placeholder="Calle 123 # 45-67" /></div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-border p-5">
          <h3 className="text-sm font-extrabold mb-4 flex items-center gap-2"><ShoppingBag size={16} className="text-purple-600" /> Resumen</h3>
          <div className="space-y-3 mb-4">
            {items.map(item => (
              <div key={item.listingId} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-lg">{item.icon || '📦'}</div>
                <div className="flex-1 min-w-0"><div className="text-xs font-bold text-text-primary truncate">{item.title}</div><div className="text-[11px] text-text-muted">x{item.quantity}</div></div>
                <div className="text-xs font-extrabold text-text-primary">${(item.price * item.quantity).toLocaleString('es-CO')}</div>
              </div>
            ))}
          </div>
          <div className="border-t border-border pt-3 space-y-1.5">
            <div className="flex justify-between text-sm"><span className="text-text-secondary">Subtotal</span><span className="font-bold">${totalPrice.toLocaleString('es-CO')}</span></div>
            <div className="flex justify-between text-sm"><span className="text-text-secondary">Envío</span><span className="font-bold text-emerald-600">Gratis</span></div>
            <div className="flex justify-between text-sm border-t border-border pt-2"><span className="font-extrabold text-text-primary">Total</span><span className="font-extrabold text-purple-700 text-lg">${totalPrice.toLocaleString('es-CO')}</span></div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-border p-5">
          <h3 className="text-sm font-extrabold mb-4 flex items-center gap-2"><CreditCard size={16} className="text-purple-600" /> Pago</h3>
          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl border border-border"><Shield size={16} className="text-emerald-600" /><span className="text-xs font-semibold text-text-secondary">Pago seguro vía <strong className="text-text-primary">Wompi</strong> (simulado)</span></div>
          <div className="flex flex-wrap gap-2 mt-3">
            {['💳 Tarjeta', '🏦 PSE', '📱 Nequi', '💵 Efecty'].map(m => (<div key={m} className="px-3 py-1.5 bg-gray-50 rounded-lg border border-border text-xs font-semibold text-text-muted">{m}</div>))}
          </div>
        </div>
        <button onClick={handleCheckout} disabled={submitting}
          className="w-full py-3.5 bg-purple-600 text-white rounded-xl text-sm font-extrabold hover:bg-purple-700 transition-all active:scale-[0.98] shadow-lg shadow-purple-200 disabled:opacity-50 flex items-center justify-center gap-2">
          {submitting ? <Loader2 size={18} className="animate-spin" /> : null}
          {submitting ? 'Procesando...' : `Pagar $${totalPrice.toLocaleString('es-CO')}`}
          {!submitting && <CreditCard size={18} />}
        </button>
      </main>
    </div>
  );
};

export default CheckoutPage;
