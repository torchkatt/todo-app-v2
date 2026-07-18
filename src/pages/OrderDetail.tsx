import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';
import { ArrowLeft, Package, Clock, CheckCircle, XCircle, Truck, Loader2, ShoppingBag, CreditCard, Phone, MapPin } from 'lucide-react';

const STATUS_MAP: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  PENDING_PAYMENT: { label: 'Pendiente de pago', icon: <Clock size={16} />, color: 'text-amber-600 bg-amber-50 border-amber-200' },
  PAYMENT_CONFIRMED: { label: 'Pago confirmado', icon: <CheckCircle size={16} />, color: 'text-blue-600 bg-blue-50 border-blue-200' },
  PREPARING: { label: 'Preparando pedido', icon: <Package size={16} />, color: 'text-purple-600 bg-purple-50 border-purple-200' },
  SHIPPED: { label: 'En camino', icon: <Truck size={16} />, color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
  DELIVERED: { label: 'Entregado', icon: <CheckCircle size={16} />, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  CANCELLED: { label: 'Cancelado', icon: <XCircle size={16} />, color: 'text-red-600 bg-red-50 border-red-200' },
  REFUNDED: { label: 'Reembolsado', icon: <XCircle size={16} />, color: 'text-red-600 bg-red-50 border-red-200' },
};

const TIMELINE = ['PENDING_PAYMENT', 'PAYMENT_CONFIRMED', 'PREPARING', 'SHIPPED', 'DELIVERED'];

const OrderDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<any>(null);
  const [seller, setSeller] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const snap = await getDoc(doc(db, 'transactions', id));
        if (!snap.exists()) { setLoading(false); return; }
        const data = { id: snap.id, ...snap.data() } as any;
        setOrder(data);
        if (data.sellerId) {
          const ss = await getDoc(doc(db, 'sellers', data.sellerId));
          if (ss.exists()) setSeller(ss.data());
        }
      } catch (e) { console.error('OrderDetail error', e); }
      setLoading(false);
    })();
  }, [id]);

  if (loading) return <div className="min-h-screen bg-brand-bg flex items-center justify-center"><Loader2 size={28} className="animate-spin text-purple-600" /></div>;

  if (!order) return (
    <div className="min-h-screen bg-brand-bg flex flex-col items-center justify-center p-8 text-center">
      <Package size={48} className="text-text-muted mb-4" />
      <h2 className="text-lg font-extrabold mb-2">Pedido no encontrado</h2>
      <button onClick={() => navigate('/orders')} className="text-purple-600 font-bold text-sm hover:underline">Ver mis pedidos</button>
    </div>
  );

  const statusInfo = STATUS_MAP[order.status] || { label: order.status, icon: <Package size={16} />, color: 'text-gray-600 bg-gray-50 border-gray-200' };
  const currentIdx = TIMELINE.indexOf(order.status);

  return (
    <div className="pb-24 bg-brand-bg min-h-screen">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><ArrowLeft size={22} /></button>
          <h1 className="text-base font-extrabold">Pedido #{id?.slice(-8)}</h1>
        </div>
      </header>
      <main className="max-w-2xl mx-auto px-4 py-6 space-y-4">

        {/* Status card */}
        <div className={`rounded-xl border-2 p-5 flex items-center gap-3 ${statusInfo.color}`}>
          <div className="p-2 rounded-xl bg-white/80">{statusInfo.icon}</div>
          <div><div className="text-sm font-extrabold">{statusInfo.label}</div><div className="text-[11px] opacity-70">{order.createdAt?.toDate ? new Date(order.createdAt.toDate()).toLocaleString('es-CO') : 'Recién creado'}</div></div>
        </div>

        {/* Timeline */}
        <div className="bg-white rounded-xl border border-border p-5">
          <h3 className="text-xs font-extrabold text-text-primary mb-4">Seguimiento</h3>
          <div className="space-y-0">
            {TIMELINE.map((s, i) => {
              const info = STATUS_MAP[s];
              const done = i <= currentIdx;
              const current = i === currentIdx;
              return (
                <div key={s} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${done ? 'bg-purple-600 text-white' : 'bg-gray-100 text-text-muted'}`}>
                      {done ? <CheckCircle size={14} /> : i + 1}
                    </div>
                    {i < TIMELINE.length - 1 && <div className={`w-0.5 h-8 ${done && i < currentIdx ? 'bg-purple-600' : 'bg-gray-100'}`} />}
                  </div>
                  <div className={`pb-6 ${current ? 'font-extrabold text-text-primary' : 'text-text-muted'}`}>
                    <div className="text-xs">{info.label}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Items */}
        <div className="bg-white rounded-xl border border-border p-5">
          <h3 className="text-xs font-extrabold text-text-primary mb-4 flex items-center gap-2"><ShoppingBag size={14} className="text-purple-600" /> Items ({order.lineItems?.length || 0})</h3>
          <div className="space-y-3">
            {order.lineItems?.map((item: any, i: number) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-2xl">📦</span>
                <div className="flex-1 min-w-0"><div className="text-sm font-bold text-text-primary truncate">{item.title}</div><div className="text-[11px] text-text-muted">x{item.quantity || 1}</div></div>
                <div className="text-sm font-extrabold text-text-primary">${((item.price || 0) * (item.quantity || 1)).toLocaleString('es-CO')}</div>
              </div>
            ))}
          </div>
          <div className="border-t border-border mt-4 pt-4 space-y-1">
            <div className="flex justify-between text-sm"><span className="text-text-secondary">Subtotal</span><span className="font-bold">${(order.totalAmount || 0).toLocaleString('es-CO')}</span></div>
            <div className="flex justify-between text-sm"><span className="text-text-secondary">Envío</span><span className="font-bold text-emerald-600">Gratis</span></div>
            <div className="flex justify-between text-sm border-t border-border pt-2 mt-2"><span className="font-extrabold text-text-primary">Total</span><span className="font-extrabold text-purple-700 text-lg">${(order.totalAmount || 0).toLocaleString('es-CO')}</span></div>
          </div>
        </div>

        {/* Delivery info */}
        {order.delivery && (
          <div className="bg-white rounded-xl border border-border p-5">
            <h3 className="text-xs font-extrabold text-text-primary mb-3 flex items-center gap-2"><Truck size={14} className="text-purple-600" /> Entrega</h3>
            <div className="space-y-2 text-sm text-text-secondary">
              {order.delivery.name && <div className="flex items-center gap-2"><Phone size={14} className="text-text-muted" /> {order.delivery.name} · {order.delivery.phone}</div>}
              {order.delivery.address && <div className="flex items-center gap-2"><MapPin size={14} className="text-text-muted" /> {order.delivery.address}</div>}
              {order.delivery.method && <div className="flex items-center gap-2"><Package size={14} className="text-text-muted" /> {order.delivery.method === 'pickup' ? 'Recogida local' : 'Envío a domicilio'}</div>}
            </div>
          </div>
        )}

        {/* Payment info */}
        <div className="bg-white rounded-xl border border-border p-5">
          <h3 className="text-xs font-extrabold text-text-primary mb-3 flex items-center gap-2"><CreditCard size={14} className="text-purple-600" /> Pago</h3>
          <div className="text-sm text-text-secondary">{order.payment?.method ? `Método: ${order.payment.method}` : 'Método: No especificado'} · {order.payment?.status || 'Pendiente'}</div>
        </div>

        {/* Seller */}
        {seller && (
          <button onClick={() => navigate(`/seller/${seller.id}`)} className="w-full bg-white rounded-xl border border-border p-4 flex items-center gap-3 hover:border-purple-200 transition-all">
            <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center text-2xl">{seller.logo || '🏪'}</div>
            <div className="flex-1 text-left"><div className="text-sm font-extrabold text-text-primary">{seller.name}</div><div className="text-[11px] text-text-muted">Ver tienda →</div></div>
          </button>
        )}
      </main>
    </div>
  );
};

export default OrderDetail;
