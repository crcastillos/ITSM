import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Service } from '../types';
import { BookOpen, Search, Shield, Zap, Info, Clock, Briefcase, Plus } from 'lucide-react';
import { motion } from 'motion/react';
import { StatusToggleButton } from '../components/StatusToggleButton';
import { cn } from '../lib/utils';
import { useAuth } from '../hooks/useAuth';

export function Services() {
  const { isAdmin, isGerente } = useAuth();
  const canManage = isAdmin || isGerente;
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    const { data, error } = await supabase
      .from('services')
      .select('*, service_categories(name), service_priorities(name)')
      .order('name');
    
    if (!error && data) {
      // Normalizar is_active
      const normalized = data.map((s: any) => ({
        ...s,
        is_active: s.is_active !== false
      })) as Service[];
      setServices(normalized);
    }
    setLoading(false);
  };

  const handleToggleStatus = async (service: Service) => {
    const newStatus = !service.is_active;
    setUpdatingId(service.id);
    try {
      const { error } = await supabase
        .from('services')
        .update({ is_active: newStatus })
        .eq('id', service.id);

      if (error) throw error;
      setServices(prev => prev.map(s => s.id === service.id ? { ...s, is_active: newStatus } : s));
    } catch (err: any) {
      alert(`Error al actualizar estado: ${err.message}`);
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredServices = services.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) || 
    s.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center min-h-[4rem] md:h-16 border-b border-slate-200 -mx-6 px-6 pl-14 md:pl-6 -mt-8 bg-white mb-8 py-3 md:py-0">
        <div className="flex items-center space-x-2 text-sm">
          <span className="text-slate-400">Módulos /</span>
          <span className="font-semibold text-slate-700">Catálogo ITSM</span>
        </div>
      </header>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input 
          type="text" 
          placeholder="Buscar en el catálogo..." 
          className="input pl-10 h-12 shadow-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredServices.map((service, idx) => (
          <motion.div
            key={service.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05 }}
            className={cn(
              "card flex flex-col sm:flex-row gap-6 hover:border-blue-200 transition-all border-l-4",
              service.is_active ? "border-l-blue-500" : "border-l-slate-300 opacity-75"
            )}
          >
            <div className={cn(
              "h-20 w-20 sm:h-24 sm:w-24 shrink-0 rounded-2xl flex items-center justify-center transition-colors",
              service.is_active ? "bg-blue-50 text-blue-600" : "bg-slate-100 text-slate-400"
            )}>
              <Briefcase size={32} />
            </div>
            
            <div className="flex-1 space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h3 className={cn(
                    "font-bold text-lg leading-tight truncate",
                    service.is_active ? "text-gray-900" : "text-gray-400"
                  )}>
                    {service.name}
                  </h3>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">
                    {service.service_categories?.name}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase border h-fit ${
                    service.service_priorities?.name === 'Critical' ? 'bg-red-50 text-red-600 border-red-100' :
                    service.service_priorities?.name === 'High' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                    'bg-blue-50 text-blue-600 border-blue-100'
                  }`}>
                    {service.service_priorities?.name}
                  </div>
                  {canManage && (
                    <StatusToggleButton 
                      isActive={service.is_active}
                      isUpdating={updatingId === service.id}
                      onConfirm={() => handleToggleStatus(service)}
                      confirmMessage={`¿Deseas ${service.is_active ? 'desactivar' : 'activar'} el servicio ${service.name}?`}
                    />
                  )}
                </div>
              </div>

              <p className="text-sm text-gray-500 leading-relaxed">
                {service.description || 'Sin descripción detallada disponible para este servicio.'}
              </p>

              <div className="flex items-center gap-4 pt-2">
                <div className="flex items-center text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                  <Clock size={12} className="mr-1" />
                  SLA: 4h Response
                </div>
                <div className="flex items-center text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                  <Shield size={12} className="mr-1" />
                  Compliance: ITIL v4
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
