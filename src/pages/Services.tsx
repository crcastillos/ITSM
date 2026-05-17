import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { BookOpen, Search, Shield, Zap, Info, Clock, Briefcase, Plus, Edit2, X, Loader2, Save, Tag, AlertTriangle, User, Calendar, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { StatusToggleButton } from '../components/StatusToggleButton';
import { FeedbackAlert } from '../components/FeedbackAlert';
import { cn } from '../lib/utils';
import { useAuth } from '../hooks/useAuth';
import { Service, LookupTable } from '../types';

export function Services() {
  const { isAdmin, isGerente } = useAuth();
  const canManage = isAdmin || isGerente;
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<LookupTable[]>([]);
  const [priorities, setPriorities] = useState<LookupTable[]>([]);
  const [serviceTypes, setServiceTypes] = useState<LookupTable[]>([]);
  const [allChannels, setAllChannels] = useState<LookupTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [pageMessage, setPageMessage] = useState<{ type: 'success' | 'error' | 'info' | 'warning', text: string } | null>(null);
  const [modalMessage, setModalMessage] = useState<{ type: 'success' | 'error' | 'info' | 'warning', text: string } | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  
  // Detail View State
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [viewService, setViewService] = useState<Service | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category_id: 0,
    priority_id: 0,
    sla_hours: 24,
    service_type: 'Solicitud',
    service_owner: '',
    availability_schedule: 'Lun-Vie 08:00-18:00',
    request_canals: ['Portal'],
    technical_dependencies: '',
    cost_center: '',
    is_active: true
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([
      fetchServices(),
      fetchLookups()
    ]);
    setLoading(false);
  };

  const fetchLookups = async () => {
    const [cats, prios, channels, types] = await Promise.all([
      supabase.from('service_categories').select('*').eq('is_active', true).order('name'),
      supabase.from('service_priorities').select('*').eq('is_active', true).order('id'),
      supabase.from('service_request_channels').select('*').eq('is_active', true).order('name'),
      supabase.from('service_types').select('*').eq('is_active', true).order('name')
    ]);

    if (cats.data) setCategories(cats.data);
    if (prios.data) setPriorities(prios.data);
    if (channels.data) setAllChannels(channels.data);
    if (types.data) setServiceTypes(types.data);
    
    // Set default values if we have lookups
    if (cats.data?.[0] && formData.category_id === 0) {
      setFormData(prev => ({ ...prev, category_id: cats.data[0].id }));
    }
    if (prios.data?.[0] && formData.priority_id === 0) {
      setFormData(prev => ({ ...prev, priority_id: prios.data[0].id }));
    }
    if (types.data?.[0] && (formData.service_type === 'Solicitud' || formData.service_type === '')) {
      setFormData(prev => ({ ...prev, service_type: types.data[0].name }));
    }
  };

  const fetchServices = async () => {
    const { data, error } = await supabase
      .from('services')
      .select('*, service_categories(name), service_priorities(name)')
      .order('name');
    
    if (error) {
      console.error('Error fetching services:', error);
      if (error.message.includes('column') || error.message.includes('does not exist')) {
        setPageMessage({ type: 'error', text: 'Error de Esquema: Faltan columnas en la tabla "services". Por favor ejecuta el archivo supabase_schema.sql en Supabase.' });
      }
      return;
    }

    if (data) {
      console.log('Services loaded:', data);
      setServices(data as Service[]);
    }
  };

  const handleOpenDetail = (service: Service) => {
    setViewService(service);
    setIsDetailOpen(true);
  };

  const handleOpenModal = (service?: Service) => {
    setModalMessage(null);
    if (service) {
      setEditingService(service);
      setFormData({
        name: service.name,
        description: service.description || '',
        category_id: service.category_id,
        priority_id: service.priority_id,
        sla_hours: service.sla_hours || 24,
        service_type: service.service_type || 'Solicitud',
        service_owner: service.service_owner || '',
        availability_schedule: service.availability_schedule || 'Lun-Vie 08:00-18:00',
        request_canals: service.request_canals || ['Portal'],
        technical_dependencies: service.technical_dependencies || '',
        cost_center: service.cost_center || '',
        is_active: service.is_active
      });
    } else {
      setEditingService(null);
      setFormData({
        name: '',
        description: '',
        category_id: categories[0]?.id || 0,
        priority_id: priorities[0]?.id || 0,
        sla_hours: 24,
        service_type: 'Solicitud',
        service_owner: '',
        availability_schedule: 'Lun-Vie 08:00-18:00',
        request_canals: ['Portal'],
        technical_dependencies: '',
        cost_center: '',
        is_active: true
      });
    }
    setIsModalOpen(true);
  };

  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!formData.name.trim()) {
      setModalMessage({ type: 'warning', text: 'El nombre del servicio es obligatorio.' });
      return;
    }

    if (formData.category_id === 0 || formData.priority_id === 0) {
      setModalMessage({ type: 'warning', text: 'Debes seleccionar una categoría y una prioridad válida.' });
      return;
    }

    setIsSubmitting(true);
    setModalMessage(null);

    try {
      if (editingService) {
        console.log('Intentando actualizar servicio ID:', editingService.id);
        const { data: updateData, error: updateError, status } = await supabase
          .from('services')
          .update({
            name: formData.name.trim(),
            description: formData.description.trim(),
            category_id: formData.category_id,
            priority_id: formData.priority_id,
            sla_hours: formData.sla_hours,
            service_type: formData.service_type,
            service_owner: formData.service_owner.trim(),
            availability_schedule: formData.availability_schedule.trim(),
            request_canals: formData.request_canals,
            technical_dependencies: formData.technical_dependencies.trim(),
            cost_center: formData.cost_center.trim(),
            is_active: formData.is_active
          })
          .eq('id', editingService.id)
          .select();

        console.log('Respuesta de actualización:', { status, updateData });

        if (updateError) {
          console.error('Error de Supabase al actualizar:', updateError);
          throw updateError;
        }

        if (!updateData || updateData.length === 0) {
          throw new Error('No se pudo encontrar el registro para actualizar o no tienes permisos (RLS).');
        }
        
        setPageMessage({ type: 'success', text: `Servicio "${formData.name.trim()}" actualizado correctamente.` });
      } else {
        const { error: insertError } = await supabase
          .from('services')
          .insert([{
            name: formData.name.trim(),
            description: formData.description.trim(),
            category_id: formData.category_id,
            priority_id: formData.priority_id,
            sla_hours: formData.sla_hours,
            service_type: formData.service_type,
            service_owner: formData.service_owner.trim(),
            availability_schedule: formData.availability_schedule.trim(),
            request_canals: formData.request_canals,
            technical_dependencies: formData.technical_dependencies.trim(),
            cost_center: formData.cost_center.trim(),
            is_active: formData.is_active
          }]);

        if (insertError) {
          console.error('Error de Supabase al insertar:', insertError);
          throw insertError;
        }
        
        setPageMessage({ type: 'success', text: 'Nuevo servicio registrado exitosamente.' });
      }

      await fetchServices();
      setIsModalOpen(false);
      setTimeout(() => setPageMessage(null), 3000);
    } catch (err: any) {
      setModalMessage({ type: 'error', text: `Error: ${err.message}` });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (service: Service) => {
    const newStatus = !service.is_active;
    setUpdatingId(service.id);
    setPageMessage(null);
    try {
      const { error } = await supabase
        .from('services')
        .update({ is_active: newStatus })
        .eq('id', service.id);

      if (error) throw error;
      setServices(prev => prev.map(s => s.id === service.id ? { ...s, is_active: newStatus } : s));
      setPageMessage({ type: 'success', text: `Servicio ${service.name} ${newStatus ? 'activado' : 'desactivado'} correctamente.` });
      setTimeout(() => setPageMessage(null), 3000);
    } catch (err: any) {
      setPageMessage({ type: 'error', text: `Error al actualizar estado: ${err.message}` });
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
      <AnimatePresence>
        {pageMessage && (
          <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] w-full max-w-md px-4">
            <FeedbackAlert 
              type={pageMessage.type as any} 
              message={pageMessage.text} 
              onClose={() => setPageMessage(null)}
            />
          </div>
        )}
      </AnimatePresence>

      <header className="flex flex-col md:flex-row justify-between items-start md:items-center min-h-[4rem] md:h-16 border-b border-slate-200 -mx-6 px-6 pl-14 md:pl-6 -mt-8 bg-white mb-8 py-3 md:py-0 gap-4">
        <div className="flex items-center space-x-2 text-sm">
          <span className="text-slate-400">Módulos /</span>
          <span className="font-semibold text-slate-700">Catálogo de Servicios</span>
        </div>
        {canManage && (
          <button 
            onClick={() => handleOpenModal()}
            className="btn-primary w-full md:w-auto h-10 px-4"
          >
            <Plus size={18} className="mr-2" />
            Nuevo Servicio
          </button>
        )}
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
              "card flex flex-col sm:flex-row gap-6 hover:border-blue-200 transition-all border-l-4 cursor-pointer group/card",
              service.is_active ? "border-l-blue-500" : "border-l-slate-300 opacity-75"
            )}
            onClick={() => handleOpenDetail(service)}
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
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                         <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenModal(service);
                          }}
                        className="p-1 text-slate-400 hover:text-blue-600 transition-colors"
                        title="Editar servicio"
                      >
                        <Edit2 size={16} />
                      </button>
                      <StatusToggleButton 
                        isActive={service.is_active}
                        isUpdating={updatingId === service.id}
                        onConfirm={() => handleToggleStatus(service)}
                        confirmMessage={`¿Deseas ${service.is_active ? 'desactivar' : 'activar'} el servicio ${service.name}?`}
                      />
                    </div>
                  )}
                </div>
              </div>

              <p className="text-sm text-gray-500 leading-relaxed">
                {service.description || 'Sin descripción detallada disponible para este servicio.'}
              </p>

                  <div className="flex items-center gap-4 pt-2 flex-wrap">
                    <div className="flex items-center text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                      <Clock size={12} className="mr-1" />
                      SLA: {service.sla_hours}h {service.service_type === 'Incidente' ? 'Restauración' : 'Resolución'}
                    </div>
                    <div className="flex items-center text-[10px] font-bold text-blue-500 uppercase tracking-tighter">
                      <Shield size={12} className="mr-1" />
                      {service.service_type}
                    </div>
                    {service.service_owner && (
                      <div className="flex items-center text-[10px] font-bold text-emerald-500 uppercase tracking-tighter">
                        <User size={12} className="mr-1" />
                        {service.service_owner}
                      </div>
                    )}
                    <div className="flex items-center text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                      <BookOpen size={12} className="mr-1" />
                      ITIL v4 Ready
                    </div>
                  </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Modal de Detalle (Vista Previa) */}
      <AnimatePresence>
        {isDetailOpen && viewService && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-0 sm:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDetailOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 100 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 100 }}
              className="relative w-full max-w-2xl bg-white sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col h-full sm:h-auto sm:max-h-[90vh]"
            >
              {/* Header */}
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white relative z-10">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "h-12 w-12 rounded-2xl flex items-center justify-center",
                    viewService.is_active ? "bg-blue-50 text-blue-600" : "bg-slate-100 text-slate-400"
                  )}>
                    <Briefcase size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-900 leading-tight">
                      {viewService.name}
                    </h2>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-0.5 rounded">
                        {viewService.service_categories?.name}
                      </span>
                      <span className={cn(
                        "text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded",
                        viewService.is_active ? "text-emerald-500 bg-emerald-50" : "text-slate-400 bg-slate-100"
                      )}>
                        {viewService.is_active ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => setIsDetailOpen(false)}
                  className="h-10 w-10 flex items-center justify-center rounded-xl text-slate-400 hover:bg-slate-50 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 md:p-8 overflow-y-auto space-y-8 custom-scrollbar">
                {/* description */}
                <div className="space-y-3">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Resumen del Servicio</h4>
                  <p className="text-slate-600 leading-relaxed text-sm md:text-base bg-slate-50/50 p-4 rounded-2xl border border-slate-100/50 italic">
                    {viewService.description || "No hay una descripción detallada para este servicio."}
                  </p>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Column 1 */}
                  <div className="space-y-6">
                    <div className="flex items-start gap-3">
                      <div className="mt-1 text-blue-500"><Shield size={18} /></div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Tipo de Negocio</p>
                        <p className="text-sm font-bold text-slate-800">{viewService.service_type}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="mt-1 text-emerald-500"><User size={18} /></div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Dueño del Servicio</p>
                        <p className="text-sm font-bold text-slate-800">{viewService.service_owner || "--"}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="mt-1 text-orange-500"><Clock size={18} /></div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">SLA Comprometido</p>
                        <p className="text-sm font-bold text-slate-800">{viewService.sla_hours} Horas</p>
                      </div>
                    </div>
                  </div>

                  {/* Column 2 */}
                  <div className="space-y-6">
                    <div className="flex items-start gap-3">
                      <div className="mt-1 text-purple-500"><Calendar size={18} /></div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Disponibilidad</p>
                        <p className="text-sm font-bold text-slate-800">{viewService.availability_schedule || "--"}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="mt-1 text-slate-500"><Briefcase size={18} /></div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Centro de Costo</p>
                        <p className="text-sm font-bold text-slate-800">{viewService.cost_center || "--"}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="mt-1 text-sky-500"><Tag size={18} /></div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Prioridad Sugerida</p>
                        <p className="text-sm font-bold text-slate-800">{viewService.service_priorities?.name}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Canals */}
                <div className="space-y-3">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Canales Disponibles</h4>
                  <div className="flex flex-wrap gap-2">
                    {viewService.request_canals?.map(canal => (
                      <span key={canal} className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-xs font-bold border border-blue-100">
                        {canal}
                      </span>
                    )) || <span className="text-slate-400 text-xs italic">No hay canales definidos.</span>}
                  </div>
                </div>

                {/* Technical Dependencies */}
                <div className="space-y-3 p-6 bg-slate-900 rounded-2xl">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                    <AlertTriangle size={14} className="text-amber-500" />
                    Dependencias Críticas
                  </h4>
                  <p className="text-slate-300 text-xs md:text-sm leading-relaxed whitespace-pre-line">
                    {viewService.technical_dependencies || "Este servicio no tiene dependencias críticas registradas."}
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BookOpen size={16} className="text-slate-400" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">ITIL v4 Compliant</span>
                </div>
                {canManage && (
                  <button 
                    onClick={() => {
                      setIsDetailOpen(false);
                      handleOpenModal(viewService);
                    }}
                    className="btn-primary py-2 px-6 h-10 text-xs"
                  >
                    <Edit2 size={14} className="mr-2" />
                    Editar Catálogo
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal de Registro/Edición */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Zap size={20} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">
                      {editingService ? 'Editar Servicio' : 'Nuevo Servicio'}
                    </h2>
                    <p className="text-xs text-slate-400 font-medium">Configura los parámetros del catálogo</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="h-10 w-10 flex items-center justify-center rounded-xl text-slate-400 hover:bg-slate-50 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="px-6 py-2">
                <AnimatePresence mode="wait">
                  {modalMessage && (
                    <FeedbackAlert 
                      type={modalMessage.type as any} 
                      message={modalMessage.text} 
                      onClose={() => setModalMessage(null)}
                      className="my-2"
                    />
                  )}
                </AnimatePresence>
              </div>

              <form onSubmit={handleSaveService} className="p-6 overflow-y-auto space-y-6 pt-2">
                <div className="space-y-6">
                  {/* General Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Nombre del Servicio</label>
                      <div className="relative">
                        <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input 
                          type="text"
                          required
                          className="input pl-10"
                          placeholder="Ej: Mantenimiento Preventivo de Laptops"
                          value={formData.name}
                          onChange={(e) => setFormData({...formData, name: e.target.value})}
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Tipo de Servicio</label>
                      <select 
                        className="input"
                        required
                        value={formData.service_type}
                        onChange={(e) => setFormData({...formData, service_type: e.target.value})}
                      >
                        <option value="" disabled>Seleccionar tipo</option>
                        {serviceTypes.map(type => (
                          <option key={type.id} value={type.name}>{type.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">SLA (Horas)</label>
                      <div className="relative">
                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input 
                          type="number"
                          min="1"
                          required
                          className="input pl-10"
                          value={formData.sla_hours}
                          onChange={(e) => setFormData({...formData, sla_hours: parseInt(e.target.value)})}
                        />
                      </div>
                    </div>
                  </div>

                  {/* ITIL Parameters */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Categoría</label>
                      <select 
                        className="input"
                        required
                        value={formData.category_id}
                        onChange={(e) => setFormData({...formData, category_id: parseInt(e.target.value)})}
                      >
                        <option value={0} disabled>Seleccionar categoría</option>
                        {categories.map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Prioridad Sugerida</label>
                      <select 
                        className="input"
                        required
                        value={formData.priority_id}
                        onChange={(e) => setFormData({...formData, priority_id: parseInt(e.target.value)})}
                      >
                        <option value={0} disabled>Seleccionar prioridad</option>
                        {priorities.map(prio => (
                          <option key={prio.id} value={prio.id}>{prio.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Responsibility & Availability */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Propietario del Servicio (Owner)</label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input 
                          type="text"
                          className="input pl-10"
                          placeholder="Ej: Infraestructura / Redes"
                          value={formData.service_owner}
                          onChange={(e) => setFormData({...formData, service_owner: e.target.value})}
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Horario de Disponibilidad</label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input 
                          type="text"
                          className="input pl-10"
                          placeholder="Ej: 24/7 o Lun-Vie 8-18"
                          value={formData.availability_schedule}
                          onChange={(e) => setFormData({...formData, availability_schedule: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Canals & Cost */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Canales de Solicitud</label>
                      <div className="flex flex-wrap gap-2 pt-1">
                        {allChannels.map(canal => (
                          <button
                            key={canal.id}
                            type="button"
                            title={canal.description}
                            onClick={() => {
                              const current = formData.request_canals;
                              if (current.includes(canal.name)) {
                                setFormData({...formData, request_canals: current.filter(c => c !== canal.name)});
                              } else {
                                setFormData({...formData, request_canals: [...current, canal.name]});
                              }
                            }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                              formData.request_canals.includes(canal.name)
                                ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                                : 'bg-slate-50 text-slate-400 border-slate-100 hover:bg-slate-100'
                            }`}
                          >
                            {canal.name}
                          </button>
                        ))}
                      </div>
                      {allChannels.length === 0 && <p className="text-[10px] text-red-500 italic">No hay canales configurados en Ajustes.</p>}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Centro de Costo / Nivel</label>
                      <div className="relative">
                        <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input 
                          type="text"
                          className="input pl-10"
                          placeholder="Ej: IT-ADMIN-01"
                          value={formData.cost_center}
                          onChange={(e) => setFormData({...formData, cost_center: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Descripción del Servicio</label>
                    <textarea 
                      className="input min-h-[80px] py-3 text-sm"
                      placeholder="Indique el alcance, requisitos y beneficios del servicio para el usuario final..."
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Dependencias Técnicas</label>
                    <div className="relative">
                      <AlertTriangle className="absolute left-3 top-3 text-slate-400" size={16} />
                      <textarea 
                        className="input pl-10 min-h-[60px] py-2.5 text-sm"
                        placeholder="Ej: Active Directory, Conectividad VPN..."
                        value={formData.technical_dependencies}
                        onChange={(e) => setFormData({...formData, technical_dependencies: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-4 border-t border-slate-50 sticky bottom-0 bg-white">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 h-12 bg-slate-50 text-slate-600 font-bold rounded-xl hover:bg-slate-100 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-[2] h-12 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 flex items-center justify-center transition-all disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <Loader2 className="animate-spin mr-2" size={20} />
                    ) : (
                      <>
                        <Save className="mr-2" size={20} />
                        {editingService ? 'Guardar Cambios' : 'Registrar Servicio'}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
