import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Mail, Lock, Eye, EyeOff, Loader2, Globe, Sparkles } from 'lucide-react';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from || '/';
  const { login, loginWithGoogle, loginAnonymously } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !password) { setError('Ingresa correo y contraseña'); return; }
    setLoading(true);
    try { await login(email, password); navigate(from, { replace: true }); }
    catch (err: any) {
      const msg = err.code === 'auth/user-not-found' ? 'Usuario no encontrado'
        : err.code === 'auth/wrong-password' ? 'Contraseña incorrecta'
        : err.code === 'auth/invalid-credential' ? 'Credenciales inválidas'
        : err.code === 'auth/too-many-requests' ? 'Demasiados intentos. Espera un momento.'
        : 'Error al iniciar sesión';
      setError(msg);
    }
    setLoading(false);
  };

  const handleGoogle = async () => {
    setLoading(true);
    try { await loginWithGoogle(); navigate(from, { replace: true }); }
    catch (e) { setError('Error con Google. Intenta de nuevo.'); }
    setLoading(false);
  };

  const handleGuest = async () => {
    setLoading(true);
    try { await loginAnonymously(); navigate(from, { replace: true }); }
    catch (e) { setError('Error al entrar como invitado.'); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-brand-bg flex flex-col">
      <header className="bg-white/80 backdrop-blur-xl border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><ArrowLeft size={22} /></button>
          <h1 className="text-lg font-extrabold">Iniciar sesión</h1>
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-purple-200"><Sparkles size={32} className="text-white" /></div>
            <h2 className="text-xl font-extrabold text-text-primary mb-1">Bienvenido de vuelta</h2>
            <p className="text-sm text-text-secondary">Ingresa a tu cuenta de Todo</p>
          </div>

          <form onSubmit={handleEmailLogin} className="space-y-4 mb-6">
            <div>
              <div className="relative">
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Correo electrónico" className="w-full pl-11 pr-4 py-3 bg-white border border-border rounded-xl text-sm outline-none focus:border-purple-400 transition-all" />
              </div>
            </div>
            <div>
              <div className="relative">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
                <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Contraseña" className="w-full pl-11 pr-11 py-3 bg-white border border-border rounded-xl text-sm outline-none focus:border-purple-400 transition-all" />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted">{showPw ? <EyeOff size={18} /> : <Eye size={18} />}</button>
              </div>
            </div>
            {error && <p className="text-xs font-bold text-red-500 text-center">{error}</p>}
            <button type="submit" disabled={loading} className="w-full py-3 bg-purple-600 text-white rounded-xl text-sm font-extrabold hover:bg-purple-700 transition-all active:scale-[0.98] shadow-lg shadow-purple-200 disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? <Loader2 size={18} className="animate-spin" /> : null}
              Iniciar sesión
            </button>
          </form>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
            <div className="relative flex justify-center"><span className="bg-brand-bg px-3 text-xs text-text-muted font-semibold">O continúa con</span></div>
          </div>

          <div className="space-y-3">
            <button onClick={handleGoogle} disabled={loading} className="w-full py-3 bg-white border border-border rounded-xl text-sm font-bold hover:bg-gray-50 transition-all active:scale-[0.98] flex items-center justify-center gap-3 shadow-sm">
              <Globe size={20} /> Google
            </button>
            <button onClick={handleGuest} disabled={loading} className="w-full py-3 bg-gray-50 border border-border rounded-xl text-sm font-bold text-text-secondary hover:bg-gray-100 transition-all active:scale-[0.98]">
              Continuar como invitado
            </button>
          </div>

          <p className="text-center text-xs text-text-secondary mt-6">
            ¿No tienes cuenta?{' '}
            <Link to="/register" className="text-purple-600 font-bold hover:underline">Regístrate</Link>
          </p>
        </div>
      </main>
    </div>
  );
};

export default Login;
