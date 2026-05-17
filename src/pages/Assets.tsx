import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Asset } from '../types';
import { Plus, Search, Monitor, Laptop, Server, Smartphone, HardDrive, Printer, Filter, X, Loader2, Edit2, FileText, Hash, Building2, Calendar, User, MapPin, ShieldCheck, Tag, Info, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { StatusToggleButton } from '../components/StatusToggleButton';
import { cn } from '../lib/utils';
import { useAuth } from '../hooks/useAuth';

export function Assets() {
  const { isAdmin, isGerente } = useAuth();
  const canManage = isAdmin || isGerente;
  const [assets, setAssets] = useState<Asset[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [assetTypes, setAssetTypes] = useState<{id: number, name: string}[]>([]);
  const [assetStatuses, setAssetStatuses] = useState<{id: number, name: string}[]>([]);
  const [clients, setClients] = useState<{id: string, name: string}[]>([]);
  const [allCustodians, setAllCustodians] = useState<{id: string, full_name: string, client_id: string}[]>([]);

  const [formData, setFormData] = useState({
    name: '',
    asset_tag: '',
    client_id: '',
    type_id: '',
    status_id: '',
    serial_number: '',
    manufacturer: '',
    model: '',
    physical_location: '',
    purchase_date: '',
    warranty_expiry: '',
    custodian_id: '',
    description: '',
    is_active: true
  });

  useEffect(() => {
    fetchAssets();
    fetchMetadata();
  }, []);

  const fetchMetadata = async () => {
    const [types, statuses, cls, custs] = await Promise.all([
      supabase.from('asset_types').select('id, name').eq('is_active', true).order('name'),
      supabase.from('asset_status').select('id, name').eq('is_active', true).order('name'),
      supabase.from('clients').select('id, name').eq('is_active', true).order('name'),
      supabase.from('client_custodians').select('id, full_name, client_id').eq('is_active', true).order('full_name')
    ]);

    if (types.data) setAssetTypes(types.data);
    if (statuses.data) setAssetStatuses(statuses.data);
    if (cls.data) setClients(cls.data);
    if (custs.data) setAllCustodians(custs.data);
  };

  const fetchAssets = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('assets')
      .select('*, asset_types(name), asset_status(name), clients(name), custodian:client_custodians(full_name)')
      .order('created_at', { ascending: false });

    if (!error && data) {
      const normalized = data.map((a: any) => ({
        ...a,
        is_active: a.is_active !== false
      })) as Asset[];
      setAssets(normalized);
    }
    setLoading(false);
  };

  const handleOpenModal = (asset?: Asset) => {
    if (asset) {
      setSelectedAsset(asset);
      setFormData({
        name: asset.name,
        asset_tag: asset.asset_tag || '',
        client_id: asset.client_id,
        type_id: asset.type_id.toString(),
        status_id: asset.status_id.toString(),
        serial_number: asset.serial_number || '',
        manufacturer: asset.manufacturer || '',
        model: asset.model || '',
        physical_location: asset.physical_location || '',
        purchase_date: asset.purchase_date || '',
        warranty_expiry: asset.warranty_expiry || '',
        custodian_id: asset.custodian_id || '',
        description: asset.description || '',
        is_active: asset.is_active
      });
    } else {
      setSelectedAsset(null);
      setFormData({
        name: '',
        asset_tag: '',
        client_id: '',
        type_id: '',
        status_id: '',
        serial_number: '',
        manufacturer: '',
        model: '',
        physical_location: '',
        purchase_date: '',
        warranty_expiry: '',
        custodian_id: '',
        description: '',
        is_active: true
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);

    try {
      const payload = {
        name: formData.name.trim(),
        asset_tag: formData.asset_tag.trim() || null,
        client_id: formData.client_id,
        type_id: parseInt(formData.type_id),
        status_id: parseInt(formData.status_id),
        serial_number: formData.serial_number.trim() || null,
        manufacturer: formData.manufacturer.trim() || null,
        model: formData.model.trim() || null,
        physical_location: formData.physical_location.trim() || null,
        purchase_date: formData.purchase_date || null,
        warranty_expiry: formData.warranty_expiry || null,
        custodian_id: formData.custodian_id || null,
        description: formData.description.trim() || null,
        is_active: formData.is_active
      };

      if (selectedAsset) {
        const { error } = await supabase
          .from('assets')
          .update(payload)
          .eq('id', selectedAsset.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('assets')
          .insert([payload]);
        if (error) throw error;
      }

      await fetchAssets();
      setIsModalOpen(false);
      alert(selectedAsset ? 'Activo actualizado correctamente' : 'Activo registrado correctamente');
    } catch (err: any) {
      alert(`Error al guardar activo: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (asset: Asset) => {
    const newStatus = !asset.is_active;
    setUpdatingId(asset.id);
    try {
      const { error } = await supabase
        .from('assets')
        .update({ is_active: newStatus })
        .eq('id', asset.id);

      if (error) throw error;
      setAssets(prev => prev.map(a => a.id === asset.id ? { ...a, is_active: newStatus } : a));
    } catch (err: any) {
      alert(`Error al actualizar estado: ${err.message}`);
    } finally {
      setUpdatingId(null);
    }
  };

  const getIcon = (typeName: string) => {
    switch (typeName.toLowerCase()) {
      case 'laptop': return Laptop;
      case 'desktop': return Monitor;
      case 'server': return Server;
      case 'network device': return HardDrive;
      case 'printer': return Printer;
      case 'phone': return Smartphone;
      default: return Monitor;
    }
  };

  const filteredAssets = assets.filter(a => 
    a.name.toLowerCase().includes(search.toLowerCase()) || 
    a.serial_number?.toLowerCase().includes(search.toLowerCase()) ||
    a.asset_tag?.toLowerCase().includes(search.toLowerCase()) ||
    a.manufacturer?.toLowerCase().includes(search.toLowerCase()) ||
    a.clients?.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center min-h-[4rem] md:h-16 border-b border-slate-200 -mx-6 px-6 pl-14 md:pl-6 -mt-8 bg-white mb-8 py-3 md:py-0 gap-4 md:gap-0">
        <div className="flex items-center space-x-2 text-sm">
          <span className="text-slate-400">Módulos /</span>
          <span className="font-semibold text-slate-700">Inventario de Activos</span>
        </div>
        {canManage && (
          <button onClick={() => handleOpenModal()} className="btn-primary w-full md:w-auto">
            <Plus className="mr-2" size={20} />
            Nuevo Activo
          </button>
        )}
      </header>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por nombre, S/N o cliente..." 
            className="input pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button className="px-4 py-2 bg-white border border-gray-200 rounded-lg flex items-center gap-2 text-sm font-medium text-gray-600 hover:bg-gray-50">
          <Filter size={18} />
          Filtros
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredAssets.map((asset, idx) => {
          const Icon = getIcon(asset.asset_types?.name || '');
          const statusColors = {
            'Available': 'bg-emerald-100 text-emerald-700',
            'Assigned': 'bg-blue-100 text-blue-700',
            'Maintenance': 'bg-amber-100 text-amber-700',
            'Retired': 'bg-gray-100 text-gray-700',
            'Broken': 'bg-red-100 text-red-700',
          }[asset.asset_status?.name || 'Available'] || 'bg-gray-100 text-gray-700';

          return (
            <motion.div
              key={asset.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
              onClick={() => handleOpenModal(asset)}
              className={cn(
                "card group hover:shadow-lg transition-all border-l-4 cursor-pointer",
                asset.is_active ? "border-l-blue-500 shadow-sm" : "border-l-slate-300 opacity-75"
              )}
            >
              <div className="flex items-start justify-between">
                <div className="flex gap-4">
                  <div className={cn(
                    "h-12 w-12 rounded-2xl flex items-center justify-center transition-colors",
                    asset.is_active ? "bg-gray-50 text-gray-400 group-hover:bg-blue-50 group-hover:text-blue-500" : "bg-slate-100 text-slate-300"
                  )}>
                    <Icon size={28} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className={cn(
                        "font-bold transition-colors truncate",
                        asset.is_active ? "text-gray-900 group-hover:text-blue-600" : "text-gray-400"
                      )}>{asset.name}</h3>
                      {asset.asset_tag && (
                        <span className="px-1.5 py-0.5 bg-blue-50 text-[9px] font-bold text-blue-600 rounded uppercase tracking-tighter shrink-0 border border-blue-100">
                          {asset.asset_tag}
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{asset.asset_types?.name}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="flex gap-2">
                    {canManage && (
                      <button 
                        onClick={() => handleOpenModal(asset)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                        title="Editar Activo"
                      >
                        <Edit2 size={16} />
                      </button>
                    )}
                    <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase shrink-0 ${statusColors}`}>
                      {asset.asset_status?.name}
                    </span>
                  </div>
                  {canManage && (
                    <StatusToggleButton 
                      isActive={asset.is_active}
                      isUpdating={updatingId === asset.id}
                      onConfirm={() => handleToggleStatus(asset)}
                      confirmMessage={`¿Deseas ${asset.is_active ? 'desactivar' : 'activar'} el activo ${asset.name}?`}
                      size="sm"
                    />
                  )}
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="p-2 bg-slate-50/50 rounded-xl border border-slate-100">
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mb-1 flex items-center gap-1">
                    <User size={10} /> Responsable (Cliente)
                  </p>
                  <p className="text-[11px] font-bold text-slate-700 truncate">
                    {asset.custodian?.full_name || 'Sin asignar'}
                  </p>
                </div>
                <div className="p-2 bg-slate-50/50 rounded-xl border border-slate-100">
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mb-1 flex items-center gap-1">
                    <Building2 size={10} /> Cliente
                  </p>
                  <p className="text-[11px] font-bold text-slate-700 truncate">
                    {asset.clients?.name}
                  </p>
                </div>
              </div>

              {asset.description && (
                <div className="mt-3 p-2 bg-slate-50/30 rounded-lg border border-slate-100/50">
                  <p className="text-[10px] text-slate-500 line-clamp-1 italic">"{asset.description}"</p>
                </div>
              )}

              <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Hash size={12} className="text-slate-400" />
                  <p className="text-[11px] font-mono text-slate-500 truncate max-w-[120px]">{asset.serial_number || 'S/N: N/A'}</p>
                </div>
                {asset.warranty_expiry && (
                  <div className={cn(
                    "flex items-center gap-1 text-[10px] font-bold uppercase tracking-tighter",
                    new Date(asset.warranty_expiry) < new Date() ? "text-red-500" : "text-emerald-600"
                  )}>
                    <ShieldCheck size={12} />
                    {new Date(asset.warranty_expiry) < new Date() ? 'Garantía Vencida' : 'Con Garantía'}
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
        {!loading && filteredAssets.length === 0 && (
          <div className="col-span-full py-20 text-center">
            <Monitor size={48} className="mx-auto text-gray-100 mb-4" />
            <p className="text-gray-400">No hay activos registrados que coincidan con la búsqueda.</p>
          </div>
        )}
      </div>
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
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
              className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 text-blue-600 rounded-xl">
                    {selectedAsset ? <Edit2 size={24} /> : <Plus size={24} />}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-800 leading-tight">
                      {selectedAsset ? 'Editar Activo' : 'Registrar Nuevo Activo'}
                    </h2>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-0.5">
                      {selectedAsset ? `ID: ${selectedAsset.id.slice(0, 8)}` : 'Gestión de Inventario'}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 hover:bg-slate-200 rounded-lg transition-colors text-slate-400 hover:text-slate-600"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 overflow-y-auto">
                <div className="space-y-8">
                  {/* Section 1: Identification */}
                  <section>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-1 h-4 bg-blue-600 rounded-full"></div>
                      <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest">1. Identificación del Activo</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5 md:col-span-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Nombre Comercial / Etiqueta</label>
                        <input required disabled={!canManage} type="text" className="input" placeholder="Ej: Estación de Trabajo Diseño 01" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1">
                          <Tag size={10} /> Asset Tag (Interno)
                        </label>
                        <input type="text" disabled={!canManage} className="input" placeholder="INV-2024-001" value={formData.asset_tag} onChange={(e) => setFormData({...formData, asset_tag: e.target.value})} />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1">
                          <Hash size={10} /> Número de Serie (S/N)
                        </label>
                        <input type="text" disabled={!canManage} className="input" placeholder="SN-XXXX-XXXX" value={formData.serial_number} onChange={(e) => setFormData({...formData, serial_number: e.target.value})} />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Fabricante</label>
                        <input type="text" disabled={!canManage} className="input" placeholder="Ej: Dell, HP, Cisco..." value={formData.manufacturer} onChange={(e) => setFormData({...formData, manufacturer: e.target.value})} />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Modelo</label>
                        <input type="text" disabled={!canManage} className="input" placeholder="Ej: Latitude 5420" value={formData.model} onChange={(e) => setFormData({...formData, model: e.target.value})} />
                      </div>
                    </div>
                  </section>

                  {/* Section 2: Responsibility & Ownership */}
                  <section>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-1 h-4 bg-purple-600 rounded-full"></div>
                      <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest">2. Propiedad y Responsabilidad</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1">
                          <Building2 size={10} /> Cliente Titular
                        </label>
                        <select required disabled={!canManage} className="input appearance-none" value={formData.client_id} onChange={(e) => setFormData({...formData, client_id: e.target.value})}>
                          <option value="">Seleccionar cliente...</option>
                          {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1">
                          <User size={10} /> Responsable Final (Titular)
                        </label>
                        <select 
                          required 
                          disabled={!canManage || !formData.client_id}
                          className="input appearance-none border-purple-100 bg-purple-50/10 focus:border-purple-500 disabled:opacity-50" 
                          value={formData.custodian_id} 
                          onChange={(e) => setFormData({...formData, custodian_id: e.target.value})}
                        >
                          <option value="">{formData.client_id ? 'Seleccionar responsable...' : 'Primero selecciona un cliente'}</option>
                          {allCustodians.filter(c => c.client_id === formData.client_id).map(c => (
                            <option key={c.id} value={c.id}>{c.full_name}</option>
                          ))}
                        </select>
                        <p className="text-[9px] text-slate-400 mt-1 italic">* Personal del cliente responsable físico del activo.</p>
                      </div>
                    </div>
                  </section>

                  {/* Section 3: Status & Technical Details */}
                  <section>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-1 h-4 bg-emerald-600 rounded-full"></div>
                      <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest">3. Estado y Clasificación</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1">
                          <Monitor size={10} /> Tipo de Activo
                        </label>
                        <select required disabled={!canManage} className="input appearance-none" value={formData.type_id} onChange={(e) => setFormData({...formData, type_id: e.target.value})}>
                          <option value="">Seleccionar tipo...</option>
                          {assetTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Estado de Operación</label>
                        <select required disabled={!canManage} className="input appearance-none" value={formData.status_id} onChange={(e) => setFormData({...formData, status_id: e.target.value})}>
                          <option value="">Seleccionar estado...</option>
                          {assetStatuses.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                      </div>
                    </div>
                  </section>

                  {/* Section 4: Lifecycle & Support */}
                  <section>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-1 h-4 bg-amber-600 rounded-full"></div>
                      <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest">4. Ciclo de Vida y Soporte</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5 md:col-span-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1">
                          <MapPin size={10} /> Ubicación Física
                        </label>
                        <input type="text" disabled={!canManage} className="input" placeholder="Ej: Oficina Central, Piso 2, Rack A" value={formData.physical_location} onChange={(e) => setFormData({...formData, physical_location: e.target.value})} />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1">
                          <Calendar size={10} /> Fecha de Adquisición
                        </label>
                        <input type="date" disabled={!canManage} className="input" value={formData.purchase_date} onChange={(e) => setFormData({...formData, purchase_date: e.target.value})} />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1">
                          <ShieldCheck size={10} /> Vencimiento de Garantía
                        </label>
                        <input type="date" disabled={!canManage} className="input border-emerald-100" value={formData.warranty_expiry} onChange={(e) => setFormData({...formData, warranty_expiry: e.target.value})} />
                      </div>
                      <div className="space-y-1.5 md:col-span-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1">
                          <Info size={10} /> Notas Adicionales
                        </label>
                        <textarea disabled={!canManage} className="input min-h-[80px] py-3 resize-none" placeholder="Especificaciones técnicas, historial breve, etc..." value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} />
                      </div>
                    </div>
                  </section>

                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "w-2.5 h-2.5 rounded-full animate-pulse",
                        formData.is_active ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-slate-300"
                      )}></div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-800 uppercase tracking-widest block leading-none">
                          {formData.is_active ? 'Activo en Producción' : 'Activo Inhabilitado'}
                        </span>
                        <span className="text-[9px] text-slate-400 font-medium">Control de visibilidad en el sistema</span>
                      </div>
                    </div>
                    {canManage && (
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, is_active: !prev.is_active }))}
                        className={cn(
                          "px-4 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all",
                          formData.is_active 
                            ? "bg-amber-100 text-amber-700 hover:bg-amber-200" 
                            : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                        )}
                      >
                        {formData.is_active ? 'Desactivar' : 'Activar'}
                      </button>
                    )}
                  </div>
                </div>

                <div className="mt-10 pt-6 border-t border-slate-100 flex gap-4">
                  <button type="button" onClick={() => setIsModalOpen(false)} className={cn(
                    "py-4 bg-slate-100 text-slate-600 rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-slate-200 transition-colors",
                    canManage ? "flex-1" : "flex-tracking w-full"
                  )}>
                    {canManage ? 'Cancelar' : 'Cerrar'}
                  </button>
                  {canManage && (
                    <button type="submit" disabled={submitting} className="flex-[2] py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-blue-600 shadow-xl shadow-slate-200 transition-all flex items-center justify-center gap-3">
                      {submitting ? <Loader2 className="animate-spin" size={18} /> : (selectedAsset ? <Save size={18} /> : <Plus size={18} />)}
                      {submitting ? 'Guardando...' : (selectedAsset ? 'Actualizar Activo' : 'Registrar Activo')}
                    </button>
                  )}
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
