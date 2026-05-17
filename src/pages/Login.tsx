import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { LogIn, Mail, Lock, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../hooks/useAuth';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [view, setView] = useState<'login' | 'forgot' | 'update' | 'loading'>('loading');
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    // Check hash immediately to prevent redirects
    if (window.location.hash.includes('type=recovery') || window.location.search.includes('type=recovery')) {
      setView('update');
    } else {
      setView('login');
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, _session) => {
      console.log('Auth Event in Login:', event);
      if (event === 'PASSWORD_RECOVERY') {
        setView('update');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Redirigir si ya está logueado y NO estamos en modo recuperación ni cargando
  useEffect(() => {
    if (!authLoading && user && view === 'login') {
      navigate('/', { replace: true });
    }
  }, [user, navigate, view, authLoading]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      navigate('/', { replace: true });
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión');
      setLoading(false);
    }
  };

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin,
      });

      if (error) throw error;
      setMessage('Se ha enviado un enlace de recuperación a tu correo electrónico.');
      setLoading(false);
    } catch (err: any) {
      setError(err.message || 'Error al enviar correo de recuperación');
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      // Ensure we have a session before updating
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('No se pudo establecer una sesión de recuperación. Inténtalo de nuevo desde el enlace de tu correo.');
      }

      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;
      setMessage('Contraseña actualizada con éxito. Ya puedes ingresar.');
      // Clear hash
      window.history.replaceState(null, '', window.location.pathname);
      setTimeout(() => setView('login'), 2000);
    } catch (err: any) {
      setError(err.message || 'Error al actualizar contraseña');
    } finally {
      setLoading(false);
    }
  };

  if (view === 'loading' || (authLoading && view === 'login')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 font-sans">
        <div className="text-center">
          <Loader2 className="animate-spin text-blue-600 mx-auto mb-4" size={40} />
          <p className="text-gray-500 font-medium">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 font-sans">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full"
      >
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl font-bold text-gray-900 tracking-tight">
            ITSM-INNOVASAL
          </h1>
          <p className="text-gray-500 mt-2">
            {view === 'login' && 'Ingresa tus credenciales para continuar'}
            {view === 'forgot' && 'Recuperar acceso a tu cuenta'}
            {view === 'update' && 'Ingresa tu nueva contraseña'}
          </p>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100">
          <AnimatePresence mode="wait">
            {view === 'login' && (
              <motion.form 
                key="login"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                onSubmit={handleLogin} 
                className="space-y-6"
              >
                {error && (
                  <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg text-center font-medium">
                    {error}
                  </div>
                )}
                {message && (
                  <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-600 text-sm rounded-lg text-center font-medium">
                    {message}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Correo Electrónico</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                      <Mail size={18} />
                    </span>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="input pl-10"
                      placeholder="ejemplo@innovasal.com"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-semibold text-gray-700">Contraseña</label>
                    <button 
                      type="button"
                      onClick={() => setView('forgot')}
                      className="text-xs font-bold text-blue-600 hover:text-blue-700 uppercase tracking-wider"
                    >
                      ¿Olvidaste tu clave?
                    </button>
                  </div>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                      <Lock size={18} />
                    </span>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="input pl-10"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full h-12 shadow-lg shadow-blue-500/20"
                >
                  {loading ? (
                    <Loader2 className="animate-spin mr-2" size={20} />
                  ) : (
                    <>
                      <LogIn className="mr-2" size={20} />
                      Iniciar Sesión
                    </>
                  )}
                </button>
              </motion.form>
            )}

            {view === 'forgot' && (
              <motion.form 
                key="forgot"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                onSubmit={handleResetRequest} 
                className="space-y-6"
              >
                {error && (
                  <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg text-center font-medium">
                    {error}
                  </div>
                )}
                {message && (
                  <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-600 text-sm rounded-lg text-center font-medium">
                    {message}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Correo Electrónico</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                      <Mail size={18} />
                    </span>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="input pl-10"
                      placeholder="Correo vinculado a tu cuenta"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full h-12"
                >
                  {loading ? (
                    <Loader2 className="animate-spin mr-2" size={20} />
                  ) : (
                    'Enviar enlace de recuperación'
                  )}
                </button>

                <button 
                  type="button" 
                  onClick={() => setView('login')}
                  className="w-full text-sm text-gray-400 font-medium hover:text-gray-600 transition-colors"
                >
                  Volver al inicio
                </button>
              </motion.form>
            )}

            {view === 'update' && (
              <motion.form 
                key="update"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                onSubmit={handleUpdatePassword} 
                className="space-y-6"
              >
                {error && (
                  <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg text-center font-medium">
                    {error}
                  </div>
                )}
                {message && (
                  <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-600 text-sm rounded-lg text-center font-medium">
                    {message}
                  </div>
                )}

                <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl mb-4">
                  <p className="text-xs text-blue-600 font-medium leading-relaxed">
                    Identidad verificada. Por favor, crea una nueva contraseña segura para tu cuenta.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Nueva Contraseña</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                      <Lock size={18} />
                    </span>
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="input pl-10"
                      placeholder="Mínimo 8 caracteres"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Confirmar Contraseña</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                      <Lock size={18} />
                    </span>
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="input pl-10"
                      placeholder="Repite tu contraseña"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full h-12 bg-blue-700 hover:bg-blue-800"
                >
                  {loading ? (
                    <Loader2 className="animate-spin mr-2" size={20} />
                  ) : (
                    'Actualizar y Continuar'
                  )}
                </button>
              </motion.form>
            )}
          </AnimatePresence>

          <div className="mt-8 pt-6 border-t border-gray-50 text-center">
            <p className="text-xs text-gray-400 uppercase tracking-widest font-bold">
              Secure Access System
            </p>
          </div>
        </div>
        
        <p className="text-center mt-8 text-sm text-gray-400">
          © {new Date().getFullYear()} InnovaSal. Todos los derechos reservados.
        </p>
      </motion.div>
    </div>
  );
}
