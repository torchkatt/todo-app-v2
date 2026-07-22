import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../context/AuthContext';
import { ShoppingBag, Search, Heart, MessageSquare } from 'lucide-react';

const STEPS = [
  { icon: <Search size={24} />, title: 'Explora', desc: 'Busca productos, servicios y contenido digital de cientos de vendedores' },
  { icon: <ShoppingBag size={24} />, title: 'Compra', desc: 'Agrega al carrito y paga con Wompi, PSE, Nequi o tarjeta' },
  { icon: <Heart size={24} />, title: 'Guarda', desc: 'Agrega a favoritos lo que te guste y vuelve después' },
  { icon: <MessageSquare size={24} />, title: 'Pregunta', desc: 'Usa el asistente AI para encontrar lo que necesitas' },
];

const Onboarding: React.FC = () => {
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      const ref = doc(db, 'users', user.id);
      const snap = await getDoc(ref);
      if (!snap.data()?.onboardingDone) {
        setVisible(true);
      }
    })();
  }, [user?.id]);

  const finish = async () => {
    if (user?.id) {
      await setDoc(doc(db, 'users', user.id), { onboardingDone: true }, { merge: true });
    }
    setVisible(false);
  };

  if (!visible) return null;

  const s = STEPS[step];

  return (
    <div className="fixed inset-0 z-[80] bg-black/60 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full max-w-sm bg-white dark:bg-gray-800 rounded-t-3xl sm:rounded-3xl p-8 animate-fade-up">
        {/* Dots */}
        <div className="flex justify-center gap-1.5 mb-8">
          {STEPS.map((_, i) => (
            <div key={i} className={`h-1.5 rounded-full transition-all ${i === step ? 'w-8 bg-purple-600' : 'w-1.5 bg-gray-300 dark:bg-gray-600'}`} />
          ))}
        </div>

        {/* Content */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 flex items-center justify-center mx-auto mb-5 text-purple-600">
            {s.icon}
          </div>
          <h2 className="text-xl font-extrabold text-text-primary mb-2">{s.title}</h2>
          <p className="text-sm text-text-secondary max-w-xs mx-auto leading-relaxed">{s.desc}</p>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button onClick={finish} className="text-xs font-bold text-text-muted hover:text-text-secondary transition-colors px-2">
            Saltar
          </button>
          <button onClick={() => step < STEPS.length - 1 ? setStep(step + 1) : finish()}
            className="flex-1 py-3 bg-purple-600 text-white rounded-xl text-sm font-extrabold hover:bg-purple-700 transition-all active:scale-95 shadow-lg shadow-purple-200">
            {step < STEPS.length - 1 ? 'Siguiente' : '¡Comenzar!'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
