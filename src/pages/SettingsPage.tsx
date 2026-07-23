import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNotifications } from '../context/NotificationContext';
import { ArrowLeft, Bell, Shield, Globe, Smartphone, Loader2, CheckCircle, Moon, Sun, RefreshCw } from 'lucide-react';
import i18n from '../i18n';

const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, updateProfile } = useAuth();
  const { theme, toggle } = useTheme();
  const { requestPushPermission } = useNotifications();
  const [name, setName] = useState(user?.fullName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [city, setCity] = useState(user?.city || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(
    typeof Notification !== 'undefined' && Notification.permission === 'granted'
  );
  const [requestingPush, setRequestingPush] = useState(false);
  const [lang, setLang] = useState(i18n.language?.startsWith('en') ? 'en' : 'es');

  const toggleLang = () => {
    const next = lang === 'es' ? 'en' : 'es';
    i18n.changeLanguage(next);
    setLang(next);
  };

  const handleTogglePush = async () => {
    if (pushEnabled || requestingPush) return;
    setRequestingPush(true);
    try {
      await requestPushPermission();
      setPushEnabled(typeof Notification !== 'undefined' && Notification.permission === 'granted');
    } finally {
      setRequestingPush(false);
    }
  };

  // Estado del Service Worker PWA para actualización manual en Ajustes
  const [swReg, setSwReg] = useState<ServiceWorkerRegistration | null>(null);
  const [hasUpdate, setHasUpdate] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    navigator.serviceWorker.ready.then((reg) => {
      setSwReg(reg);
      if (reg.waiting) {
        setHasUpdate(true);
      }
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        if (!newWorker) return;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            setHasUpdate(true);
          }
        });
      });
    });
  }, []);

  const handleUpdateApp = () => {
    setUpdating(true);
    if (swReg?.waiting) {
      swReg.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  const save = async () => {
    setSaving(true);
    await updateProfile({ fullName: name, phone, city });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    setSaving(false);
  };

  return (
    <div className="min-h-screen bg-brand-bg">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><ArrowLeft size={22} /></button>
          <h1 className="text-lg font-extrabold">Configuración</h1>
        </div>
      </header>
      <main className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {/* Perfil */}
        <div className="bg-white rounded-xl border border-border p-5">
          <h3 className="text-xs font-extrabold text-text-primary mb-4">Perfil</h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-text-secondary">Nombre</label>
              <input value={name} onChange={e => setName(e.target.value)} className="w-full px-3 py-2.5 mt-1 bg-gray-50 border border-border rounded-xl text-sm outline-none focus:border-purple-400 transition-all" />
            </div>
            <div>
              <label className="text-xs font-bold text-text-secondary">Teléfono</label>
              <input value={phone} onChange={e => setPhone(e.target.value)} className="w-full px-3 py-2.5 mt-1 bg-gray-50 border border-border rounded-xl text-sm outline-none focus:border-purple-400 transition-all" />
            </div>
            <div>
              <label className="text-xs font-bold text-text-secondary">Ciudad</label>
              <input value={city} onChange={e => setCity(e.target.value)} className="w-full px-3 py-2.5 mt-1 bg-gray-50 border border-border rounded-xl text-sm outline-none focus:border-purple-400 transition-all" />
            </div>
            <button onClick={save} disabled={saving} className="px-6 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-extrabold hover:bg-purple-700 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2">
              {saving ? <Loader2 size={16} className="animate-spin" /> : saved ? <CheckCircle size={16} /> : null}
              {saved ? 'Guardado' : 'Guardar cambios'}
            </button>
          </div>
        </div>

        {/* Opciones Generales */}
        <div className="bg-white rounded-xl border border-border divide-y divide-border">
          {[
            {
              icon: requestingPush ? <Loader2 size={18} className="animate-spin" /> : <Bell size={18} />,
              title: 'Notificaciones push',
              desc: pushEnabled ? 'Activadas' : requestingPush ? 'Solicitando permiso...' : 'Desactivadas — toca para activar',
              onClick: handleTogglePush,
            },
            { icon: <Shield size={18} />, title: 'Privacidad', desc: 'Datos, permisos, seguridad' },
            { icon: <Globe size={18} />, title: 'Idioma', desc: lang === 'es' ? 'Español' : 'English', onClick: toggleLang },
            { icon: theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />, title: 'Modo oscuro', desc: theme === 'dark' ? 'Activado' : 'Desactivado', onClick: toggle },
          ].map((item, i) => (
            <div key={i} onClick={(item as any).onClick} className="flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <div className="text-text-muted">{item.icon}</div>
              <div>
                <div className="text-sm font-bold text-text-primary">{item.title}</div>
                <div className="text-[11px] text-text-muted">{item.desc}</div>
              </div>
            </div>
          ))}

          {/* Actualización de la App */}
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-text-muted"><Smartphone size={18} /></div>
              <div>
                <div className="text-sm font-bold text-text-primary">Versión de la App</div>
                <div className="text-[11px] text-text-muted">
                  {hasUpdate ? '✨ ¡Nueva versión lista para instalar!' : 'v1.3.0 — Todo está actualizado'}
                </div>
              </div>
            </div>
            {hasUpdate && (
              <button
                onClick={handleUpdateApp}
                disabled={updating}
                className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
              >
                {updating ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
                Actualizar
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default SettingsPage;
