import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { ArrowLeft, Heart, ShoppingBag, Loader2 } from 'lucide-react';

const FavoritesPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [favs, setFavs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      const snap = await getDoc(doc(db, 'users', user.id));
      const ids: string[] = snap.data()?.favoriteListingIds || [];
      const items: any[] = [];
      for (const id of ids.slice(0, 20)) {
        const ls = await getDoc(doc(db, 'listings', id));
        if (ls.exists()) items.push({ id, ...ls.data() });
      }
      setFavs(items);
      setLoading(false);
    })();
  }, [user?.id]);

  const remove = async (id: string) => {
    if (!user?.id) return;
    const snap = await getDoc(doc(db, 'users', user.id));
    const ids: string[] = snap.data()?.favoriteListingIds || [];
    await updateDoc(doc(db, 'users', user.id), { favoriteListingIds: ids.filter(f => f !== id) });
    setFavs(prev => prev.filter(f => f.id !== id));
  };

  return (
    <div className="pb-24 bg-brand-bg min-h-screen">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><ArrowLeft size={22} /></button>
          <h1 className="text-lg font-extrabold">Favoritos</h1>
          <span className="text-xs text-text-muted font-semibold">{favs.length}</span>
        </div>
      </header>
      <main className="max-w-2xl mx-auto px-4 py-6">
        {loading ? <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin text-purple-600" /></div>
        : favs.length === 0 ? <div className="text-center py-16"><Heart size={48} className="mx-auto mb-4 text-text-muted" /><h2 className="text-lg font-extrabold mb-2">No tienes favoritos</h2><p className="text-sm text-text-secondary mb-4">Guarda productos para verlos después</p><button onClick={() => navigate('/')} className="text-purple-600 font-bold text-sm">Explorar Todo</button></div>
        : <div className="space-y-2">{favs.map((f: any) => (
            <div key={f.id} className="bg-white rounded-xl border border-border p-4 flex items-center gap-3 hover:border-purple-200 transition-all">
              <span className="text-2xl">{f.type === 'service' ? '🛠️' : '📦'}</span>
              <div className="flex-1 min-w-0 cursor-pointer" onClick={() => navigate(`/listing/${f.id}`)}>
                <div className="text-sm font-extrabold text-text-primary truncate">{f.title}</div>
                <div className="text-xs font-bold text-purple-700">${(f.price || 0).toLocaleString('es-CO')}</div>
              </div>
              <button onClick={() => remove(f.id)} className="text-xs text-red-500 font-bold hover:underline">Quitar</button>
            </div>
          ))}
        </div>}
      </main>
    </div>
  );
};

export default FavoritesPage;
