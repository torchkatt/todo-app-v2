import React, { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';

export const OfflineBanner: React.FC = () => {
  const [offline, setOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const goOffline = () => setOffline(true);
    const goOnline = () => setOffline(false);
    window.addEventListener('offline', goOffline);
    window.addEventListener('online', goOnline);
    return () => {
      window.removeEventListener('offline', goOffline);
      window.removeEventListener('online', goOnline);
    };
  }, []);

  if (!offline) return null;

  return (
    <div className="sticky top-0 z-50 bg-amber-500 text-white px-4 py-2 flex items-center justify-center gap-2 text-sm font-bold shadow-md">
      <WifiOff size={16} strokeWidth={2.5} />
      <span>Sin conexión — algunos datos pueden estar desactualizados</span>
    </div>
  );
};

export default OfflineBanner;
