import { Navigate, Outlet } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

interface ProtectedRouteProps {
  allowedRoles?: string[];
}

export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { profile, loading, user } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Cargando Sistema...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to={`/login${window.location.search}${window.location.hash}`} replace />;
  }

  // Si está autenticado pero no tiene perfil
  if (user && !profile && !loading) {
    const handleLogout = async () => {
      const { supabase } = await import('../lib/supabase');
      await supabase.auth.signOut();
      window.location.href = '/login';
    };

    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50 p-8 text-center">
        <div className="max-w-md space-y-6">
          <div className="card bg-white p-8 border-red-100">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle size={32} />
            </div>
            <h2 className="text-xl font-bold text-slate-800">Error de Configuración</h2>
            <p className="text-sm text-slate-500 mt-2">
              Tu usuario existe en la autenticación pero no tiene un perfil vinculado. 
              Por favor, borra tu usuario en Supabase y créalo de nuevo <b>después</b> de haber ejecutado el script SQL.
            </p>
            <div className="flex flex-col gap-3 mt-6">
              <button onClick={() => window.location.reload()} className="btn-primary w-full">
                Reintentar
              </button>
              <button onClick={handleLogout} className="text-sm font-semibold text-slate-500 py-2">
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Si está desactivado (solo si el valor es explícitamente false)
  if (profile && profile.is_active === false) {
    const handleLogout = async () => {
      const { supabase } = await import('../lib/supabase');
      await supabase.auth.signOut();
      window.location.href = '/login';
    };

    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50 p-8 text-center">
        <div className="max-w-md space-y-6">
          <div className="card bg-white p-8 border-red-100 flex flex-col items-center">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
              <AlertCircle size={32} />
            </div>
            <h2 className="text-xl font-bold text-slate-800">Acceso Restringido</h2>
            <p className="text-sm text-slate-500 mt-2">
              Tu cuenta ha sido desactivada por un administrador del sistema.
            </p>
            <button onClick={handleLogout} className="btn-primary w-full mt-8">
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (allowedRoles && profile.roles && !allowedRoles.includes(profile.roles.name)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
