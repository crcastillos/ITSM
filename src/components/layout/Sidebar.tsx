import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  BarChart3, 
  Users, 
  Monitor, 
  ShieldCheck, 
  LogOut, 
  Menu, 
  X, 
  BookOpen,
  LayoutDashboard,
  Settings
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { motion, AnimatePresence } from 'motion/react';
import { clsx } from 'clsx';

export function Sidebar() {
  const { profile, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isLargeScreen, setIsLargeScreen] = useState(typeof window !== 'undefined' ? window.innerWidth >= 1024 : true);

  React.useEffect(() => {
    const handleResize = () => {
      setIsLargeScreen(window.innerWidth >= 1024);
      if (window.innerWidth >= 1024) {
        setIsOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/' },
    { name: 'Clientes', icon: Users, path: '/clients', role: ['Admin', 'Gerente TI'] },
    { name: 'Inventario', icon: Monitor, path: '/assets' },
    { name: 'Catálogo', icon: BookOpen, path: '/services' },
    { name: 'Usuarios', icon: ShieldCheck, path: '/users', role: ['Admin'] },
    { name: 'Ajustes', icon: Settings, path: '/settings', role: ['Admin'] },
  ];

  const filteredItems = navItems.filter(item => 
    !item.role || (profile?.roles?.name && item.role.includes(profile.roles.name))
  );

  return (
    <>
      {/* Mobile Toggle */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 bg-white rounded-lg shadow-md border border-slate-200"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      <AnimatePresence mode="wait">
        {(isOpen || isLargeScreen) && (
          <motion.aside
            initial={isLargeScreen ? false : { x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={clsx(
              "fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 text-white flex flex-col border-r border-slate-800 shadow-xl lg:shadow-none lg:static lg:h-screen lg:z-0",
              isOpen ? "block" : "hidden lg:flex"
            )}
          >
            <div className="p-6 border-b border-slate-800">
              <h1 className="font-display text-xl font-bold text-blue-400 tracking-tight">
                ITSM-INNOVASAL
              </h1>
              <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-widest font-bold">
                Panel de Gestión
              </p>
            </div>

            <nav className="flex-1 py-6 space-y-1">
              <div className="px-6 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                Principal
              </div>
              {filteredItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className={({ isActive }) => clsx(
                    "flex items-center px-6 py-3 transition-colors duration-200 text-sm",
                    isActive 
                      ? "sidebar-active" 
                      : "text-slate-300 hover:bg-slate-800/50 hover:text-white"
                  )}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                </NavLink>
              ))}
              
      <div className="px-6 py-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
        Sistema
      </div>
      <div className="px-6 py-3 text-xs text-slate-500 italic">
        v1.0.0 Stable
      </div>
    </nav>

            <div className="p-4 border-t border-slate-800 flex items-center bg-slate-950/50 mt-auto">
              <div className="h-9 w-9 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xs shrink-0">
                {profile?.full_name?.charAt(0) || profile?.email?.charAt(0).toUpperCase()}
              </div>
              <div className="ml-3 overflow-hidden flex-1">
                <p className="text-xs font-bold leading-none truncate">{profile?.full_name || 'Usuario'}</p>
                <p className="text-[10px] text-slate-500 mt-1 uppercase font-bold tracking-wider truncate">
                  Rol: {profile?.roles?.name}
                </p>
              </div>
              <button 
                onClick={signOut}
                className="p-2 text-slate-500 hover:text-red-400 transition-colors"
                title="Cerrar Sesión"
              >
                <LogOut size={16} />
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-slate-950/40 backdrop-blur-[2px] z-30"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
