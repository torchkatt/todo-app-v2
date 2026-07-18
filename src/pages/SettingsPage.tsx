import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { ArrowLeft, Bell, Shield, Globe, Smartphone, LogOut, Loader2, CheckCircle, Moon, Sun } from 'lucide-react';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase';

const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, updateProfile } = useAuth();
  const { theme, toggle } = useTheme();
  const [name, setName] = useState(user?.fullName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [city, setCity] = useState(user?.city || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

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
        <div className="bg-white rounded-xl border border-border p-5">
          <h3 className="text-xs font-extrabold text-text-primary mb-4">Perfil</h3>
          <div className="space-y-3">
            <div><label className="text-xs font-bold text-text-secondary">Nombre</label><input value={name} onChange={e => setName(e.target.value)} className="w-full px-3 py-2.5 mt-1 bg-gray-50 border border-border rounded-xl text-sm outline-none focus:border-purple-400 transition-all" /></div>
            <div><label className="text-xs font-bold text-text-secondary">Teléfono</label><input value={phone} onChange={e => setPhone(e.target.value)} className="w-full px-3 py-2.5 mt-1 bg-gray-50 border border-border rounded-xl text-sm outline-none focus:border-purple-400 transition-all" /></div>
            <div><label className="text-xs font-bold text-text-secondary">Ciudad</label><input value={city} onChange={e => setCity(e.target.value)} className="w-full px-3 py-2.5 mt-1 bg-gray-50 border border-border rounded-xl text-sm outline-none focus:border-purple-400 transition-all" /></div>
            <button onClick={save} disabled={saving} className="px-6 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-extrabold hover:bg-purple-700 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2">
              {saving ? <Loader2 size={16} className="animate-spin" /> : saved ? <CheckCircle size={16} /> : null}
              {saved ? 'Guardado' : 'Guardar cambios'}
            </button>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-border divide-y divide-border">
          {[
            { icon: <Bell size={18} />, title: 'Notificaciones', desc: 'Push, email, ofertas' },
            { icon: <Shield size={18} />, title: 'Privacidad', desc: 'Datos, permisos, seguridad' },
            { icon: <Globe size={18} />, title: 'Idioma', desc: 'Español (Colombia)' },
            { icon: theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />, title: 'Modo oscuro', desc: theme === 'dark' ? 'Activado' : 'Desactivado', onClick: toggle },
            { icon: <Smartphone size={18} />, title: 'App', desc: `v1.0.0 (${import.meta.env.MODE || 'production'})` },
          ].map((item, i) => (
            <div key={i} onClick={(item as any).onClick} className="flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <div className="text-text-muted">{item.icon}</div>
              <div><div className="text-sm font-bold text-text-primary">{item.title}</div><div className="text-[11px] text-text-muted">{item.desc}</div></div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default SettingsPage;
