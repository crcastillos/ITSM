import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { UserProfile } from '../types';
import { 
  ShieldCheck, 
  UserPlus, 
  Mail, 
  User, 
  Info, 
  Loader2, 
  AlertCircle, 
  CheckCircle2, 
  XCircle,
  Edit2,
  X,
  Save,
  Eye,
  EyeOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../hooks/useAuth';

import { createClient } from '@supabase/supabase-js';
import { Navigate } from 'react-router-dom';

import { StatusToggleButton } from '../components/StatusToggleButton';

export function Users() {
  const { user: currentUser, isAdmin, isGerente, loading: authLoading } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  // Redirect if not admin
  if (!authLoading && !isAdmin) {
    return <Navigate to="/" replace />;
  }
  const [roles, setRoles] = useState<{ id: number, name: string }[]>([]);
  
  // Create/Edit User Form State
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [roleId, setRoleId] = useState<number>(3); // 3 = Soporte TI
  const [isFormSubmitting, setIsFormSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Cliente temporal para crear usuarios sin afectar la sesión del admin
  const createTempClient = () => {
    return createClient(
      import.meta.env.VITE_SUPABASE_URL || '',
      import.meta.env.VITE_SUPABASE_ANON_KEY || '',
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false
        }
      }
    );
  };

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, []);

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*, roles(name)')
      .order('created_at');
    
    // Normalizar is_active para registros antiguos (null -> true)
    if (data) {
      const normalizedData = data.map(u => ({
        ...u,
        is_active: u.is_active !== false // Si es null o undefined, es true
      }));
      setUsers(normalizedData);
    }
    setLoading(false);
  };

  const fetchRoles = async () => {
    try {
      const { data, error } = await supabase
        .from('roles')
        .select('id, name');
      
      if (error) {
        console.error("Error fetching roles from DB:", error);
        throw error;
      }
      
      if (data && data.length > 0) {
        // Filtramos por is_active en JS para evitar errores si la columna es nueva
        const activeRoles = data.filter((r: any) => r.is_active !== false);
        setRoles(activeRoles.length > 0 ? activeRoles : data);
        
        // Preseleccionar si no hay uno
        if (!editingUser && !roleId) {
          const defaultRole = data.find((r: any) => r.name === 'Soporte TI') || data[0];
          setRoleId(defaultRole.id);
        }
      } else {
        setRoles([{ id: 1, name: 'Admin' }, { id: 2, name: 'Gerente TI' }, { id: 3, name: 'Soporte TI' }]);
      }
    } catch (err: any) {
      console.error("Critical error fetching roles:", err);
      setRoles([{ id: 1, name: 'Admin' }, { id: 2, name: 'Gerente TI' }, { id: 3, name: 'Soporte TI' }]);
    }
  };

  const handleEditClick = (userToEdit: UserProfile) => {
    setEditingUser(userToEdit);
    setFullName(userToEdit.full_name || '');
    setEmail(userToEdit.email);
    setRoleId(userToEdit.role_id);
    setPassword(''); 
    setMessage(null);
    // Scroll to top to see edit form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
    setEditingUser(null);
    setFullName('');
    setEmail('');
    setPassword('');
    setRoleId(roles[0]?.id || 3);
    setMessage(null);
  };

  const handleToggleStatus = async (user: UserProfile) => {
    const newStatus = !user.is_active;
    
    setUpdatingId(user.id);
    setMessage(null);
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ is_active: newStatus })
        .eq('id', user.id);

      if (error) throw error;
      
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, is_active: newStatus } : u));
      setMessage({ type: 'success', text: `Usuario ${newStatus ? 'activado' : 'desactivado'} correctamente.` });
      
      // Auto-clear message
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      setMessage({ type: 'error', text: `Error al cambiar estado: ${err.message}` });
      alert(`Error al cambiar estado: ${err.message}`);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsFormSubmitting(true);
    setMessage(null);

    try {
      const trimmedEmail = email.trim().toLowerCase();
      
      // Basic local validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email && !editingUser) {
        throw new Error('El correo electrónico es obligatorio');
      }
      
      if (!editingUser && !emailRegex.test(trimmedEmail)) {
        throw new Error(`La dirección de correo "${trimmedEmail}" no tiene un formato válido localmente`);
      }

      if (editingUser) {
        // UPDATE EXISTING PROFILE
        const { error: profileError } = await supabase
          .from('user_profiles')
          .update({
            full_name: fullName,
            role_id: roleId
          })
          .eq('id', editingUser.id);

        if (profileError) throw profileError;
        
        // Handle Password Change
        if (password.trim()) {
          if (editingUser.id === currentUser?.id) {
            // Self-update password
            const { error: authError } = await supabase.auth.updateUser({
              password: password.trim()
            });
            if (authError) {
              console.warn('Profile updated but password change failed:', authError);
              setMessage({ type: 'error', text: `Perfil ok, pero error al cambiar clave: ${authError.message}` });
              return;
            }
          } else {
            // Admin attempting to change another user's password
            // This is normally restricted in client-side Supabase unless service_role is used.
            // We'll offer to send a reset email instead or inform them.
            if (window.confirm('No se puede setear la clave de otro usuario directamente por seguridad. ¿Deseas enviar un correo de restablecimiento a ' + editingUser.email + '?')) {
              const { error: resetError } = await supabase.auth.resetPasswordForEmail(editingUser.email, {
                redirectTo: window.location.origin
              });
              if (resetError) throw resetError;
              setMessage({ type: 'success', text: 'Perfil actualizado y correo de restablecimiento enviado.' });
              setTimeout(resetForm, 2000);
              return;
            }
          }
        }
        
        setMessage({ type: 'success', text: 'Perfil actualizado correctamente.' });
        setTimeout(resetForm, 1500);
      } else {
        // CREATE NEW USER (Usando cliente temporal para no perder la sesión del admin)
        console.log('Intentando registrar usuario:', { email: trimmedEmail, fullName, roleId });
        
        const tempClient = createTempClient();
        const { error: authError } = await tempClient.auth.signUp({
          email: trimmedEmail,
          password,
          options: {
            data: {
              full_name: fullName,
              role_id: roleId
            }
          }
        });

        if (authError) {
          console.error('Error de Supabase Auth:', authError);
          let errorMsg = authError.message;
          
          if (authError.status === 429 || errorMsg.toLowerCase().includes('rate limit')) {
            errorMsg = "Límite de correos excedido. Para evitar esto, desactiva 'Confirm Email' en Supabase (Authentication > Providers > Email) o espera 1 hora.";
          } else if (errorMsg.includes('invalid')) {
            errorMsg = `El correo "${trimmedEmail}" es rechazado. Sugerencia: Desactiva "Confirm Email" en el dashboard de Supabase.`;
          }
          
          throw new Error(errorMsg);
        }
        
        setMessage({ type: 'success', text: 'Usuario registrado exitosamente.' });
        resetForm();
      }
      
      fetchUsers();
    } catch (err: any) {
      console.error('Error en handleSubmit:', err);
      setMessage({ type: 'error', text: err.message || 'Ocurrió un error inesperado' });
    } finally {
      setIsFormSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center min-h-[4rem] md:h-16 border-b border-slate-200 -mx-6 px-6 pl-14 md:pl-6 -mt-8 bg-white mb-8 py-3 md:py-0">
        <div className="flex items-center space-x-2 text-sm">
          <span className="text-slate-400">Configuración /</span>
          <span className="font-semibold text-slate-700">Usuarios y Roles</span>
        </div>
      </header>

      <div className="flex flex-col gap-4 mb-6">
        {message && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 rounded-xl text-sm font-medium flex items-center gap-3 border shadow-sm ${
              message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-red-50 text-red-700 border-red-100'
            }`}
          >
            <AlertCircle size={18} />
            {message.text}
          </motion.div>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* User Form */}
        <div className="xl:col-span-1">
          <div className="card sticky top-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold flex items-center">
                {editingUser ? (
                  <><Edit2 className="mr-2 text-amber-500" size={20} /> Editar Usuario</>
                ) : (
                  <><UserPlus className="mr-2 text-blue-600" size={20} /> Registrar Usuario</>
                )}
              </h2>
              {editingUser && (
                <button onClick={resetForm} className="text-slate-400 hover:text-slate-600">
                  <X size={20} />
                </button>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Nombre Completo</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
                  <input 
                    type="text" 
                    className="input pl-10" 
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="John Doe"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Correo Electrónico</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
                  <input 
                    type="email" 
                    className="input pl-10" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="john@innovasal.com"
                    required
                    disabled={!!editingUser}
                  />
                </div>
                {editingUser && <p className="text-[10px] text-slate-400 mt-1 italic">* El correo no se puede modificar una vez creado.</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">
                  {editingUser ? 'Nueva Contraseña (Opcional)' : 'Contraseña'}
                </label>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"}
                    className="input pr-10" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={editingUser ? "Dejar en blanco para no cambiar" : "••••••••"}
                    required={!editingUser}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {editingUser && editingUser.id !== currentUser?.id && password.trim() && (
                  <p className="text-[9px] text-amber-600 mt-1 font-bold uppercase tracking-tight">
                    * Se enviará un enlace de restablecimiento al usuario.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Rol de Usuario</label>
                <div className="relative">
                  <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
                  <select 
                    className="input pl-10 appearance-none bg-white font-medium text-slate-700"
                    value={roleId}
                    onChange={(e) => setRoleId(Number(e.target.value))}
                    disabled={(!isAdmin && isGerente) || isFormSubmitting}
                  >
                    {roles.length === 0 ? (
                      <option value={3}>Cargando roles...</option>
                    ) : (
                      roles.map(r => (
                        <option key={r.id} value={r.id} disabled={isGerente && r.name !== 'Soporte TI'}>
                          {r.name}
                        </option>
                      ))
                    )}
                  </select>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={isFormSubmitting}
                className={`w-full shadow-lg py-3 flex items-center justify-center font-bold rounded-xl transition-all ${
                  editingUser 
                    ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/20' 
                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20'
                }`}
              >
                {isFormSubmitting ? (
                  <Loader2 className="animate-spin mr-2" size={18} />
                ) : editingUser ? (
                  <Save className="mr-2" size={18} />
                ) : (
                  <UserPlus className="mr-2" size={18} />
                )}
                {editingUser ? 'Guardar Cambios' : 'Registrar Usuario'}
              </button>
            </form>
          </div>
        </div>

        {/* Users List */}
        <div className="xl:col-span-2 space-y-4">
          <div className="flex items-center justify-between px-2">
            <h2 className="font-bold text-gray-700 uppercase tracking-wide text-sm flex items-center">
              <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mr-2"></span>
              Directorio de Usuarios
            </h2>
            <span className="text-[10px] font-black bg-slate-100 px-2 py-1 rounded-md text-slate-500 uppercase tracking-tighter">
              {users.length} Registros
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-48 card">
                <Loader2 className="animate-spin text-slate-300 mb-2" size={24} />
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Sincronizando...</span>
              </div>
            ) : users.map((profile) => (
              <div 
                key={profile.id} 
                className={`card p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group transition-all border-l-4 ${
                  profile.is_active ? 'border-l-emerald-500 shadow-sm' : 'border-l-slate-300 opacity-75'
                } ${editingUser?.id === profile.id ? 'ring-2 ring-amber-500 border-l-amber-500' : 'hover:border-blue-100 hover:shadow-md'}`}
              >
                <div className="flex items-center gap-4 min-w-0 w-full sm:w-auto">
                  <div className={`h-11 w-11 rounded-xl flex items-center justify-center font-display font-black text-xs transition-colors shrink-0 ${
                    profile.is_active ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-slate-100 text-slate-400 border border-slate-200'
                  }`}>
                    {profile.full_name?.charAt(0) || profile.email.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className={`font-bold text-sm leading-none flex items-center gap-2 truncate ${profile.is_active ? 'text-slate-800' : 'text-slate-500'}`}>
                      <span className="truncate">{profile.full_name || 'Sin nombre'}</span>
                      {!profile.is_active && <span className="text-[9px] bg-slate-200 px-1.5 py-0.5 rounded text-slate-500 uppercase shrink-0">Inactivo</span>}
                    </h4>
                    <p className="text-[11px] text-slate-400 lowercase mt-1 truncate">{profile.email}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
                  <div className={`flex items-center px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-wider border ${
                    profile.roles?.name === 'Admin' ? 'bg-purple-50 text-purple-600 border-purple-100' :
                    profile.roles?.name === 'Gerente TI' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                    'bg-slate-50 text-slate-500 border-slate-200'
                  }`}>
                    {profile.roles?.name}
                  </div>

                  {isAdmin && (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleEditClick(profile)}
                        className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all md:opacity-0 md:group-hover:opacity-100"
                        title="Editar Perfil"
                      >
                        <Edit2 size={16} />
                      </button>

                      <StatusToggleButton 
                        isActive={profile.is_active}
                        isUpdating={updatingId === profile.id}
                        onConfirm={() => handleToggleStatus(profile)}
                        disabled={profile.id === currentUser?.id && profile.is_active}
                        label={profile.is_active ? 'Desactivar' : 'Activar'}
                        confirmMessage={`¿Confirmar ${profile.is_active ? 'desactivación' : 'activación'} de este usuario?`}
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
