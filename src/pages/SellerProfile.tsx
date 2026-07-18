import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../services/firebase';
import { ArrowLeft, Star, ShoppingBag, MapPin, BadgeCheck, Loader2, Package, Clock, TrendingUp } from 'lucide-react';
import type { Seller, Listing } from '../types';

const SellerProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [seller, setSeller] = useState<Seller | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const ss = await getDoc(doc(db, 'sellers', id));
        if (!ss.exists()) { setLoading(false); return; }
        setSeller({ id: ss.id, ...ss.data() } as Seller);

        const lq = query(collection(db, 'listings'), where('sellerId', '==', id), where('isActive', '==', true), orderBy('createdAt', 'desc'), limit(30));
        const ls = await getDocs(lq);
        setListings(ls.docs.map(d => ({ id: d.id, ...d.data() } as Listing)));
      } catch (e) { console.error('SellerProfile error', e); }
      setLoading(false);
    })();
  }, [id]);

  if (loading) return <div className="min-h-screen bg-brand-bg flex items-center justify-center"><Loader2 size={28} className="animate-spin text-purple-600" /></div>;

  if (!seller) return (
    <div className="min-h-screen bg-brand-bg flex flex-col items-center justify-center p-8 text-center">
      <span className="text-6xl mb-4">🏪</span>
      <h2 className="text-lg font-extrabold mb-2">Tienda no encontrada</h2>
      <button onClick={() => navigate('/')} className="text-purple-600 font-bold text-sm hover:underline">Volver al inicio</button>
    </div>
  );

  return (
    <div className="pb-24 bg-brand-bg min-h-screen">
      {/* Cover */}
      <div className="relative h-48 bg-gradient-to-br from-purple-600 via-indigo-600 to-purple-800 flex items-end p-6">
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative z-10 flex items-end gap-4">
          <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-4xl shadow-lg">{seller.logo || '🏪'}</div>
          <div className="mb-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold text-white">{seller.name}</h1>
              {seller.isVerified && <BadgeCheck size={18} className="text-blue-300" />}
            </div>
            <div className="flex items-center gap-3 mt-1 text-sm text-white/80">
              <span className="flex items-center gap-1"><Star size={14} className="text-amber-300 fill-amber-300" /> {seller.rating || 'Nuevo'}</span>
              {seller.location?.city && <span className="flex items-center gap-1"><MapPin size={14} /> {seller.location.city}</span>}
              <span className="flex items-center gap-1"><Package size={14} /> {listings.length} productos</span>
            </div>
          </div>
        </div>
      </div>

      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><ArrowLeft size={22} /></button>
          <h1 className="text-lg font-extrabold truncate">{seller.name}</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-xl border border-border p-4 text-center"><div className="text-lg font-extrabold text-purple-700">{seller.stats?.totalTransactions || 0}</div><div className="text-[10px] text-text-muted font-semibold">Ventas</div></div>
          <div className="bg-white rounded-xl border border-border p-4 text-center"><div className="text-lg font-extrabold text-emerald-600">{Math.round((seller.stats?.completionRate || 0) * 100)}%</div><div className="text-[10px] text-text-muted font-semibold">Cumplimiento</div></div>
          <div className="bg-white rounded-xl border border-border p-4 text-center"><div className="text-lg font-extrabold text-amber-500">{seller.rating || '—'}</div><div className="text-[10px] text-text-muted font-semibold">Calificación</div></div>
        </div>

        {/* Description */}
        {seller.description && (
          <div className="bg-white rounded-xl border border-border p-5">
            <h3 className="text-xs font-extrabold text-text-primary mb-2">Acerca de</h3>
            <p className="text-sm text-text-secondary leading-relaxed">{seller.description}</p>
          </div>
        )}

        {/* Delivery */}
        {seller.deliveryConfig?.isEnabled && (
          <div className="bg-white rounded-xl border border-border p-5">
            <h3 className="text-xs font-extrabold text-text-primary mb-2 flex items-center gap-2"><MapPin size={14} className="text-purple-600" /> Envío disponible</h3>
            <div className="text-xs text-text-secondary">Desde ${seller.deliveryConfig.baseFee?.toLocaleString('es-CO')} · Hasta {seller.deliveryConfig.maxDistanceKm} km · ${seller.deliveryConfig.pricePerKm?.toLocaleString('es-CO')}/km{seller.deliveryConfig.freeThreshold ? ` · Gratis sobre $${seller.deliveryConfig.freeThreshold.toLocaleString('es-CO')}` : ''}</div>
          </div>
        )}

        {/* Listings */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-extrabold text-text-primary">Productos y servicios ({listings.length})</h3>
          </div>
          {listings.length === 0 ? (
            <p className="text-sm text-text-muted text-center py-8">Esta tienda no tiene productos activos aún.</p>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {listings.map(l => (
                <div key={l.id} onClick={() => navigate(`/listing/${l.id}`)} className="bg-white rounded-xl border border-border overflow-hidden hover:shadow-lg hover:border-purple-200 transition-all cursor-pointer active:scale-[0.98]">
                  <div className="h-24 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center"><span className="text-3xl">{l.type === 'service' ? '🛠️' : '📦'}</span></div>
                  <div className="p-3">
                    <h4 className="text-xs font-extrabold text-text-primary truncate">{l.title}</h4>
                    <div className="text-sm font-extrabold text-purple-700 mt-1">${l.price.toLocaleString('es-CO')}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default SellerProfile;
