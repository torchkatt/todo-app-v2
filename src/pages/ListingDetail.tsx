import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { ArrowLeft, ShoppingBag, Star, MapPin, Clock, Plus, Minus, BadgeCheck, Loader2 } from 'lucide-react';
import type { Listing, Seller } from '../types';
import SEO from '../components/seo/SEO';

const ListingDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addItem } = useCart();
  const [listing, setListing] = useState<Listing | null>(null);
  const [seller, setSeller] = useState<Seller | null>(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const ls = await getDoc(doc(db, 'listings', id));
        if (!ls.exists()) { setLoading(false); return; }
        const data = { ...ls.data(), id: ls.id } as Listing;
        setListing(data);

        const ss = await getDoc(doc(db, 'sellers', data.sellerId));
        if (ss.exists()) setSeller(ss.data() as Seller);
      } catch (e) { console.error('ListingDetail error', e); }
      setLoading(false);
    })();
  }, [id]);

  if (loading) return <div className="min-h-screen bg-brand-bg flex items-center justify-center"><Loader2 size={28} className="animate-spin text-purple-600" /></div>;

  if (!listing) return (
    <div className="min-h-screen bg-brand-bg flex flex-col items-center justify-center p-8 text-center">
      <SEO title="Producto no encontrado" />
      <span className="text-6xl mb-4">🔍</span>
      <h2 className="text-xl font-extrabold mb-2">Producto no encontrado</h2>
      <button onClick={() => navigate('/')} className="text-purple-600 font-bold text-sm mt-2 hover:underline">Volver al inicio</button>
    </div>
  );

  return (
    <div className="pb-32 bg-brand-bg min-h-screen">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><ArrowLeft size={22} /></button>
          <h1 className="text-base font-extrabold truncate">{listing.title}</h1>
        </div>
      </header>
      <main className="max-w-2xl mx-auto">
      <SEO title={listing.title} description={listing.description?.slice(0, 160)} />
        {/* Hero */}
        <div className="relative h-56 bg-gradient-to-br from-purple-50 via-indigo-50 to-gray-100 flex items-center justify-center">
          <span className="text-8xl">{listing.type === 'service' ? '🛠️' : listing.type === 'digital' ? '📱' : listing.categoryId?.includes('food') ? '🍕' : '📦'}</span>
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
          {listing.discountPercent ? <span className="absolute top-4 left-4 px-2.5 py-1 rounded-full text-xs font-extrabold bg-red-500 text-white shadow-lg">-{listing.discountPercent}%</span> : null}
        </div>

        {/* Info */}
        <div className="px-4 py-5 space-y-5">
          <div>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-extrabold text-text-primary mb-1">{listing.title}</h2>
                <span className="text-[11px] font-bold text-text-muted bg-gray-100 px-2 py-0.5 rounded-full">{listing.type === 'service' ? '🛠️ Servicio' : listing.type === 'digital' ? '📱 Digital' : '📦 Producto'}</span>
              </div>
            </div>
            <div className="flex items-baseline gap-2 mt-3">
              <span className="text-2xl font-extrabold text-purple-700">${listing.price.toLocaleString('es-CO')}</span>
              {listing.originalPrice && <span className="text-sm text-text-muted line-through font-semibold">${listing.originalPrice.toLocaleString('es-CO')}</span>}
            </div>
          </div>

          {/* Description */}
          <div>
            <h3 className="text-sm font-extrabold text-text-primary mb-2">Descripción</h3>
            <p className="text-sm text-text-secondary leading-relaxed">{listing.description || 'Sin descripción disponible.'}</p>
          </div>

          {/* Seller */}
          {seller && (
            <div onClick={() => navigate(`/seller/${seller.id}`)} className="flex items-center gap-3 p-4 bg-white rounded-xl border border-border cursor-pointer hover:border-purple-200 hover:shadow-sm transition-all">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-50 to-indigo-50 flex items-center justify-center text-2xl">{seller.logo || '🏪'}</div>
              <div className="flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-extrabold text-text-primary">{seller.name}</span>
                  {seller.isVerified && <BadgeCheck size={14} className="text-blue-500" />}
                </div>
                <div className="flex items-center gap-1 text-xs text-text-muted mt-0.5">
                  <Star size={12} className="text-amber-400 fill-amber-400" /> {seller.rating} ({seller.ratingCount})
                </div>
              </div>
              <span className="text-xs font-bold text-purple-600">Ver tienda →</span>
            </div>
          )}

          {/* Tags */}
          {listing.tags && listing.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {listing.tags.map(tag => <span key={tag} className="px-2.5 py-1 bg-gray-100 rounded-lg text-[10px] font-semibold text-text-muted">#{tag}</span>)}
            </div>
          )}

          {/* Delivery */}
          <div className="p-4 bg-white rounded-xl border border-border">
            <h3 className="text-xs font-extrabold text-text-primary mb-3 flex items-center gap-2"><MapPin size={14} className="text-purple-600" /> Métodos de entrega</h3>
            <div className="space-y-2">
              {(listing.deliveryMethods || ['pickup']).map((m: string) => (
                <div key={m} className="flex items-center gap-2 text-xs text-text-secondary">
                  <div className="w-2 h-2 rounded-full bg-emerald-400" />
                  {m === 'pickup' ? 'Recogida local' : m === 'shipping' ? 'Envío a domicilio' : m === 'remote' ? 'Virtual / Online' : m === 'digital' ? 'Descarga digital instantánea' : m === 'in_person' ? 'Presencial' : m}
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Sticky buy */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-border p-4 z-50 shadow-2xl">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <div className="flex items-center border border-border rounded-xl overflow-hidden">
            <button onClick={() => setQty(Math.max(1, qty - 1))} className="px-3 py-3 hover:bg-gray-100 transition-colors"><Minus size={16} /></button>
            <span className="px-4 py-3 text-sm font-extrabold min-w-[2rem] text-center">{qty}</span>
            <button onClick={() => setQty(qty + 1)} className="px-3 py-3 hover:bg-gray-100 transition-colors"><Plus size={16} /></button>
          </div>
          <button onClick={() => { addItem({ listingId: listing.id!, title: listing.title, price: listing.price, icon: listing.type === 'service' ? '🛠️' : '📦', quantity: qty, sellerId: listing.sellerId, sellerName: seller?.name || '' }); navigate('/cart'); }}
            className="flex-1 py-3 bg-purple-600 text-white rounded-xl text-sm font-extrabold hover:bg-purple-700 transition-all active:scale-[0.98] shadow-lg shadow-purple-200 flex items-center justify-center gap-2">
            <ShoppingBag size={18} /> Agregar al carrito
          </button>
        </div>
      </div>
    </div>
  );
};

export default ListingDetail;
