import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Mail, Lock, User, Eye, EyeOff, Loader2, Sparkles } from 'lucide-react';

const Register: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres'); return; }
    if (!name.trim()) { setError('Ingresa tu nombre'); return; }
    setLoading(true);
    try {
      await register(email, password, name);
      navigate('/app', { replace: true });
    } catch (err: any) {
      const msg = err.code === 'auth/email-already-in-use' ? 'Este correo ya está registrado'
        : err.code === 'auth/weak-password' ? 'Contraseña muy débil'
        : err.code === 'auth/invalid-email' ? 'Correo inválido'
        : 'Error al registrarte. Intenta de nuevo.';
      setError(msg);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-brand-bg flex flex-col">
      <header className="bg-white/80 backdrop-blur-xl border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><ArrowLeft size={22} /></button>
          <h1 className="text-lg font-extrabold">Crear cuenta</h1>
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-purple-200"><Sparkles size={32} className="text-white" /></div>
            <h2 className="text-xl font-extrabold text-text-primary mb-1">Únete a Todo</h2>
            <p className="text-sm text-text-secondary">Crea tu cuenta y empieza a explorar</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <div className="relative">
                <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
                <input value={name} onChange={e => setName(e.target.value)} placeholder="Nombre completo" className="w-full pl-11 pr-4 py-3 bg-white border border-border rounded-xl text-sm outline-none focus:border-purple-400 focus:shadow-sm focus:shadow-purple-100 transition-all" />
              </div>
            </div>
            <div>
              <div className="relative">
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Correo electrónico" className="w-full pl-11 pr-4 py-3 bg-white border border-border rounded-xl text-sm outline-none focus:border-purple-400 focus:shadow-sm focus:shadow-purple-100 transition-all" />
              </div>
            </div>
            <div>
              <div className="relative">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
                <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Contraseña (6+ caracteres)" className="w-full pl-11 pr-11 py-3 bg-white border border-border rounded-xl text-sm outline-none focus:border-purple-400 focus:shadow-sm focus:shadow-purple-100 transition-all" />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary">{showPw ? <EyeOff size={18} /> : <Eye size={18} />}</button>
              </div>
            </div>
            {error && <p className="text-xs font-bold text-red-500 text-center">{error}</p>}
            <button type="submit" disabled={loading} className="w-full py-3 bg-purple-600 text-white rounded-xl text-sm font-extrabold hover:bg-purple-700 transition-all active:scale-[0.98] shadow-lg shadow-purple-200 disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? <Loader2 size={18} className="animate-spin" /> : null}
              Crear cuenta gratis
            </button>
            <p className="text-center text-xs text-text-secondary mt-6">
              ¿Ya tienes cuenta?{' '}
              <Link to="/login" className="text-purple-600 font-bold hover:underline">Inicia sesión</Link>
            </p>
            <p className="text-center text-[10px] text-text-muted leading-relaxed">
              Al registrarte aceptas nuestros{' '}
              <a href="#" className="underline hover:text-text-primary">Términos</a> y{' '}
              <a href="#" className="underline hover:text-text-primary">Política de Privacidad</a>
            </p>
          </form>
        </div>
      </main>
    </div>
  );
};

export default Register;
