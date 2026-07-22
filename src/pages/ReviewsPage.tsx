import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Send } from 'lucide-react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../context/AuthContext';

const ReviewsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!user || rating === 0) return;
    setSubmitting(true);
    await addDoc(collection(db, 'reviews'), {
      userId: user.id, userName: user.fullName || 'Usuario',
      rating, comment, targetType: 'listing', targetId: 'general',
      createdAt: serverTimestamp(),
    });
    setRating(0);
    setComment('');
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-brand-bg">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><ArrowLeft size={22} /></button>
          <h1 className="text-lg font-extrabold">Reseñas</h1>
        </div>
      </header>
      <main className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        <div className="bg-white rounded-xl border border-border p-6 text-center">
          <h2 className="text-sm font-extrabold mb-4">¿Cómo calificas tu experiencia en Todo?</h2>
          <div className="flex justify-center gap-2 mb-6">
            {[1,2,3,4,5].map(n => (
              <button key={n} onClick={() => setRating(n)} className={`w-12 h-12 rounded-xl text-2xl transition-all hover:scale-110 ${n <= rating ? 'scale-110' : 'opacity-30'}`}>{n <= rating ? '⭐' : '☆'}</button>
            ))}
          </div>
          <textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="Cuéntanos tu experiencia (opcional)" rows={3} className="w-full px-4 py-3 bg-gray-50 border border-border rounded-xl text-sm outline-none focus:border-purple-400 transition-all resize-none mb-4" />
          <button onClick={submit} disabled={rating === 0 || submitting} className="px-6 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-extrabold hover:bg-purple-700 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2 mx-auto">
            {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            Enviar reseña
          </button>
        </div>
      </main>
    </div>
  );
};

export default ReviewsPage;
