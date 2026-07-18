import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/authService';
import { Mail, Lock, User, Loader2, Sparkles } from 'lucide-react';

interface Props { onClose: () => void; }

const GuestConversion: React.FC<Props> = ({ onClose }) => {
  const { user, updateProfile } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState(user?.fullName || '');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleConvert = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !password || !name) { setError('Completa todos los campos'); return; }
    if (password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres'); return; }
    setLoading(true);
    try {
      await authService.convertGuest(user!.id, email, password, name);
      await updateProfile({ fullName: name, email, isGuest: false });
      onClose();
    } catch (err: any) {
      setError(err.code === 'auth/email-already-in-use' ? 'Este correo ya está registrado' : 'Error al crear cuenta');
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[70] bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-sm bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-2xl animate-fade-up" onClick={e => e.stopPropagation()}>
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center mx-auto mb-3"><Sparkles size={28} className="text-white" /></div>
          <h2 className="text-lg font-extrabold">Guarda tu cuenta</h2>
          <p className="text-xs text-text-secondary mt-1">Convierte tu cuenta de invitado en una cuenta permanente</p>
        </div>
        <form onSubmit={handleConvert} className="space-y-3">
          <div className="relative">
            <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Nombre completo" className="w-full pl-10 pr-3 py-2.5 bg-gray-50 dark:bg-gray-700 border border-border rounded-xl text-sm outline-none focus:border-purple-400 transition-all" />
          </div>
          <div className="relative">
            <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Correo electrónico" className="w-full pl-10 pr-3 py-2.5 bg-gray-50 dark:bg-gray-700 border border-border rounded-xl text-sm outline-none focus:border-purple-400 transition-all" />
          </div>
          <div className="relative">
            <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Contraseña" className="w-full pl-10 pr-3 py-2.5 bg-gray-50 dark:bg-gray-700 border border-border rounded-xl text-sm outline-none focus:border-purple-400 transition-all" />
          </div>
          {error && <p className="text-xs font-bold text-red-500 text-center">{error}</p>}
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 bg-gray-100 dark:bg-gray-700 rounded-xl text-sm font-bold hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">Ahora no</button>
            <button type="submit" disabled={loading} className="flex-1 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-extrabold hover:bg-purple-700 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1">
              {loading ? <Loader2 size={16} className="animate-spin" /> : null}
              Guardar cuenta
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GuestConversion;
