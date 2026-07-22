/**
 * @file Onboarding.tsx
 * @description Tour/tutorial inicial de la aplicación.
 * Se muestra ÚNICAMENTE cuando un usuario inicia sesión (autenticado) y aún no ha completado el tutorial.
 */

import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../context/AuthContext';
import { ShoppingBag, Search, Heart, MessageSquare } from 'lucide-react';
import { Button } from '../ui/Button';

/** Pasos del mini tutorial */
const STEPS = [
  { icon: <Search size={24} />, title: 'Explora', desc: 'Busca productos, servicios y contenido digital de cientos de vendedores' },
  { icon: <ShoppingBag size={24} />, title: 'Compra', desc: 'Agrega al carrito y paga con Wompi, PSE, Nequi o tarjeta' },
  { icon: <Heart size={24} />, title: 'Guarda', desc: 'Agrega a favoritos lo que te guste y vuelve después' },
  { icon: <MessageSquare size={24} />, title: 'Pregunta', desc: 'Usa el asistente AI para encontrar lo que necesitas' },
];

/**
 * Componente Modal Onboarding.
 * @returns {JSX.Element | null} Modal de tutorial renderizado.
 */
const Onboarding: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // 🛑 ÚNICAMENTE MOSTRAR CUANDO EL USUARIO ESTÁ AUTENTICADO (No antes, ni a invitados)
    if (!isAuthenticated || !user?.id || user.isGuest) {
      setVisible(false);
      return;
    }

    // Si ya completó el onboarding localmente en este dispositivo, no mostrar modal
    if (localStorage.getItem(`todo_onboarding_${user.id}`) === 'true') {
      setVisible(false);
      return;
    }

    // Consultar estado en Firestore para sincronización entre dispositivos
    (async () => {
      try {
        const ref = doc(db, 'users', user.id);
        const snap = await getDoc(ref);
        if (snap.exists() && snap.data()?.onboardingDone) {
          localStorage.setItem(`todo_onboarding_${user.id}`, 'true');
          setVisible(false);
          return;
        }
        setVisible(true);
      } catch (e) {
        setVisible(false);
      }
    })();
  }, [user?.id, user?.isGuest, isAuthenticated]);

  /**
   * Finaliza el tutorial, guarda el estado en Firestore y en localStorage asociándolo al ID del usuario.
   */
  const finish = async () => {
    if (user?.id) {
      localStorage.setItem(`todo_onboarding_${user.id}`, 'true');
    }
    setVisible(false);

    if (isAuthenticated && user?.id && !user.isGuest) {
      try {
        const ref = doc(db, 'users', user.id);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          await setDoc(ref, { onboardingDone: true }, { merge: true });
        }
      } catch (e) {
        console.warn('[Onboarding] Firestore update skipped:', e);
      }
    }
  };

  if (!visible) return null;

  const s = STEPS[step];

  return (
    <div className="fixed inset-0 z-[80] bg-black/60 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full max-w-sm bg-white dark:bg-slate-800 rounded-t-3xl sm:rounded-3xl p-8 animate-fade-up border border-slate-100 dark:border-slate-700/60 shadow-2xl">
        {/* Dots de progreso */}
        <div className="flex justify-center gap-1.5 mb-8">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i === step ? 'w-8 bg-purple-600' : 'w-1.5 bg-slate-300 dark:bg-slate-600'
              }`}
            />
          ))}
        </div>

        {/* Contenido del paso actual */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 flex items-center justify-center mx-auto mb-5 text-purple-600 dark:text-purple-400">
            {s.icon}
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 mb-2">{s.title}</h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 max-w-xs mx-auto leading-relaxed">{s.desc}</p>
        </div>

        {/* Botones de acción */}
        <div className="flex gap-3 items-center">
          <button
            onClick={finish}
            className="text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors px-2"
          >
            Saltar
          </button>
          <Button
            onClick={() => (step < STEPS.length - 1 ? setStep(step + 1) : finish())}
            fullWidth
            variant="primary"
          >
            {step < STEPS.length - 1 ? 'Siguiente' : '¡Comenzar!'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
