import React, { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';

// Only relevant when PWA registerType is 'autoUpdate'
export const ReloadPrompt: React.FC = () => {
  const [needRefresh, setNeedRefresh] = useState(false);
  const [sw, setSw] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    // Listen for new service worker waiting
    const onUpdate = (registration: ServiceWorkerRegistration) => {
      setSw(registration);
      setNeedRefresh(true);
    };

    // Check on load
    navigator.serviceWorker.ready.then((reg) => {
      if (reg.waiting) onUpdate(reg);
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        if (!newWorker) return;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            onUpdate(reg);
          }
        });
      });
    });

    // Also listen globally
    const handler = () => {
      navigator.serviceWorker?.ready.then((reg) => {
        reg.update().catch((err) => console.error('[ReloadPrompt] update error:', err));
      });
    };
    window.addEventListener('swUpdated', handler);

    return () => {
      window.removeEventListener('swUpdated', handler);
    };
  }, []);

  const reload = () => {
    sw?.waiting?.postMessage({ type: 'SKIP_WAITING' });
    setNeedRefresh(false);
    window.location.reload();
  };

  if (!needRefresh) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-brand-primary text-white px-5 py-3 rounded-full shadow-xl flex items-center gap-3 text-sm font-bold animate-fade-up">
      <RefreshCw size={16} className="animate-spin" />
      <span>Nueva versión disponible</span>
      <button
        onClick={reload}
        className="bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full text-xs font-black transition-all"
      >
        ACTUALIZAR
      </button>
    </div>
  );
};

export default ReloadPrompt;
