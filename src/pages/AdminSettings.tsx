import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Settings, Plus, Loader2, CheckCircle2, XCircle, Trash2, Edit2, Save, X, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../hooks/useAuth';
import { StatusToggleButton } from '../components/StatusToggleButton';
import { cn } from '../lib/utils';

interface LookupItem {
  id: number;
  name: string;
  is_active: boolean;
}

interface TableConfig {
  id: string;
  name: string;
  table: string;
}

const TABLES: TableConfig[] = [
  { id: 'roles', name: 'Roles de Usuario', table: 'roles' },
  { id: 'departments', name: 'Departamentos', table: 'departments' },
  { id: 'districts', name: 'Distritos', table: 'districts' },
  { id: 'asset_types', name: 'Tipos de Activos', table: 'asset_types' },
  { id: 'asset_status', name: 'Estados de Activos', table: 'asset_status' },
  { id: 'service_categories', name: 'Categorías de Servicio', table: 'service_categories' },
  { id: 'service_priorities', name: 'Prioridades de Servicio', table: 'service_priorities' },
];

export function AdminSettings() {
  const { isAdmin, loading: authLoading, profile } = useAuth();
  const [activeTable, setActiveTable] = useState<TableConfig>(TABLES[1]); // Default departments
  const [items, setItems] = useState<LookupItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editDeptId, setEditDeptId] = useState<string>('');
  const [newItemName, setNewItemName] = useState('');
  const [adding, setAdding] = useState(false);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [departments, setDepartments] = useState<LookupItem[]>([]);
  const [selectedDeptId, setSelectedDeptId] = useState<string>('');

  useEffect(() => {
    if (!authLoading && isAdmin) {
      console.log('Admin detected, fetching items for:', activeTable.name);
      fetchItems();
      if (activeTable.id === 'districts') {
        fetchDepartments();
      }
    }
  }, [activeTable, isAdmin, authLoading]);

  const fetchDepartments = async () => {
    const { data } = await supabase.from('departments').select('*').order('name');
    if (data) setDepartments(data);
  };

  const fetchItems = async () => {
    setLoading(true);
    try {
      let query = supabase.from(activeTable.table).select('*');
      
      if (activeTable.id === 'districts') {
        query = supabase.from('districts').select('*, departments(name)');
      }

      const { data, error } = await query.order('name');
      
      if (error) throw error;
      setItems(data || []);
    } catch (error: any) {
      console.error('Error fetching items:', error);
      alert(`Error al cargar datos: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    setAdding(true);
    try {
      const payload: any = { name: newItemName.trim() };
      if (activeTable.id === 'districts') {
        if (!selectedDeptId) {
          alert('Por favor, selecciona un departamento');
          setAdding(false);
          return;
        }
        payload.department_id = parseInt(selectedDeptId);
      }

      const { error } = await supabase
        .from(activeTable.table)
        .insert([payload]);

      if (error) {
        if (error.code === '23505') throw new Error('Ya existe un registro con ese nombre');
        throw error;
      }

      setNewItemName('');
      fetchItems();
    } catch (error: any) {
      console.error('Error adding item:', error);
      alert(`Error al añadir: ${error.message}`);
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteItem = async (id: number, name: string) => {
    if (!window.confirm(`¿Estás seguro de que deseas eliminar permanentemente "${name}"? Esta acción no se puede deshacer si el registro está siendo utilizado.`)) {
      return;
    }

    setUpdatingId(id);
    try {
      const { error } = await supabase
        .from(activeTable.table)
        .delete()
        .eq('id', id);

      if (error) {
        if (error.code === '23503') throw new Error('No se puede eliminar porque este registro está vinculado a otros datos. Prueba desactivarlo en su lugar.');
        throw error;
      }

      fetchItems();
    } catch (error: any) {
      console.error('Error deleting item:', error);
      alert(`Error al eliminar: ${error.message}`);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleUpdateItem = async (id: number) => {
    if (!editName.trim()) return;

    setUpdatingId(id);
    try {
      const payload: any = { name: editName.trim() };
      if (activeTable.id === 'districts' && editDeptId) {
        payload.department_id = parseInt(editDeptId);
      }

      const { error } = await supabase
        .from(activeTable.table)
        .update(payload)
        .eq('id', id);

      if (error) throw error;
      setEditingId(null);
      fetchItems();
    } catch (error: any) {
      console.error('Error updating item:', error);
      alert(`Error al actualizar: ${error.message}`);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleToggleStatus = async (item: LookupItem) => {
    setUpdatingId(item.id);
    try {
      const { error } = await supabase
        .from(activeTable.table)
        .update({ is_active: !item.is_active })
        .eq('id', item.id);

      if (error) throw error;
      fetchItems();
    } catch (error: any) {
      console.error('Error toggling status:', error);
      alert(`Error al cambiar estado: ${error.message}`);
    } finally {
      setUpdatingId(null);
    }
  };

  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-3">
        <Loader2 className="animate-spin text-blue-600" size={32} />
        <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">Verificando permisos...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4 text-center px-6">
        <div className="p-4 bg-red-50 text-red-600 rounded-full">
          <X size={32} />
        </div>
        <div>
          <h3 className="font-bold text-slate-800">Acceso Denegado</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-xs">
            No tienes permisos de administrador para gestionar las tablas atómicas. 
            Tu rol actual es: <span className="font-bold text-slate-700">{profile?.roles?.name || 'Desconocido'}</span>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center h-16 border-b border-slate-200 -mx-6 px-6 -mt-8 bg-white mb-8">
        <div className="flex items-center space-x-2 text-sm">
          <span className="text-slate-400">Administración /</span>
          <span className="font-semibold text-slate-700">Tablas Atómicas</span>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Tabs */}
        <div className="lg:col-span-1 space-y-1">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 px-3">Tablas Disponibles</h3>
          {TABLES.map((table) => (
            <button
              key={table.id}
              onClick={() => setActiveTable(table)}
              className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                activeTable.id === table.id 
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-200' 
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {table.name}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="lg:col-span-3 space-y-6">
          <div className="card">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
              <div>
                <h2 className="text-xl font-bold text-slate-800">{activeTable.name}</h2>
                <p className="text-sm text-slate-500">Gestiona los valores permitidos para {activeTable.name.toLowerCase()}.</p>
              </div>

              <form onSubmit={handleAddItem} className="flex flex-wrap gap-2 w-full md:w-auto">
                {activeTable.id === 'districts' && (
                  <select
                    className="input py-2 text-sm min-w-[150px]"
                    value={selectedDeptId}
                    onChange={(e) => setSelectedDeptId(e.target.value)}
                    required
                  >
                    <option value="">Departamento...</option>
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                )}
                <input
                  type="text"
                  placeholder={`Nuevo ${activeTable.id.slice(0, -1)}`}
                  className="input py-2"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  required
                />
                <button type="submit" disabled={adding} className="btn-primary py-2 px-4 whitespace-nowrap">
                  {adding ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />}
                  <span className="ml-1.5 font-bold">Añadir</span>
                </button>
              </form>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center h-48 gap-3">
                <Loader2 className="animate-spin text-blue-600" size={32} />
                <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">Cargando datos...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Desktop Table */}
                <div className="hidden md:block overflow-hidden bg-slate-50 rounded-2xl border border-slate-100">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-white border-b border-slate-100">
                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest w-20">ID</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Nombre</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-center w-32">Estado</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right w-40">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      <AnimatePresence mode="popLayout">
                        {items.map((item) => (
                          <motion.tr 
                            key={item.id}
                            layout
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="hover:bg-white transition-colors group"
                          >
                            <td className="px-6 py-4 text-sm font-bold text-slate-400">#{item.id}</td>
                            <td className="px-6 py-4">
                              {editingId === item.id ? (
                                <div className="flex flex-col gap-2">
                                  {activeTable.id === 'districts' && (
                                    <select
                                      className="input py-1 px-2 text-xs w-full"
                                      value={editDeptId}
                                      onChange={(e) => setEditDeptId(e.target.value)}
                                    >
                                      <option value="">Departamento...</option>
                                      {departments.map(d => (
                                        <option key={d.id} value={d.id}>{d.name}</option>
                                      ))}
                                    </select>
                                  )}
                                  <input
                                    autoFocus
                                    type="text"
                                    className="input py-1 px-2 text-xs"
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleUpdateItem(item.id)}
                                  />
                                </div>
                              ) : (
                                <div className="flex flex-col">
                                  <span className={`text-sm font-semibold ${item.is_active ? 'text-slate-700' : 'text-slate-400 line-through'}`}>
                                    {item.name}
                                  </span>
                                  {(item as any).departments && (
                                    <span className="text-[10px] text-blue-500 font-bold uppercase tracking-widest mt-0.5">
                                      {(item as any).departments.name}
                                    </span>
                                  )}
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className={cn(
                                "px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider inline-block",
                                item.is_active ? "bg-emerald-50 text-emerald-600" : "bg-slate-200 text-slate-500"
                              )}>
                                {item.is_active ? 'Activo' : 'Inactivo'}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex justify-end gap-1">
                                {editingId === item.id ? (
                                  <>
                                    <button 
                                      onClick={() => handleUpdateItem(item.id)}
                                      className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                      title="Guardar"
                                    >
                                      <Check size={18} />
                                    </button>
                                    <button 
                                      onClick={() => setEditingId(null)}
                                      className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors"
                                      title="Cancelar"
                                    >
                                      <X size={18} />
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button 
                                      onClick={() => {
                                        setEditingId(item.id);
                                        setEditName(item.name);
                                        if (activeTable.id === 'districts') {
                                          setEditDeptId((item as any).department_id?.toString() || '');
                                        }
                                      }}
                                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                                      title="Editar"
                                    >
                                      <Edit2 size={18} />
                                    </button>
                                    <StatusToggleButton 
                                      isActive={item.is_active}
                                      isUpdating={updatingId === item.id}
                                      onConfirm={() => handleToggleStatus(item)}
                                      confirmMessage={`¿Deseas ${item.is_active ? 'desactivar' : 'activar'} "${item.name}"?`}
                                    />
                                    <button 
                                      onClick={() => handleDeleteItem(item.id, item.name)}
                                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                                      title="Eliminar"
                                    >
                                      <Trash2 size={18} />
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </motion.tr>
                        ))}
                      </AnimatePresence>
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className="grid grid-cols-1 gap-3 md:hidden">
                  <AnimatePresence mode="popLayout">
                    {items.map((item) => (
                      <motion.div
                        key={item.id}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm"
                      >
                        {editingId === item.id ? (
                          <div className="space-y-4">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Editando #{item.id}</span>
                              <div className="flex gap-2">
                                <button 
                                  onClick={() => handleUpdateItem(item.id)}
                                  className="w-10 h-10 flex items-center justify-center bg-emerald-600 text-white rounded-xl shadow-lg shadow-emerald-100"
                                >
                                  <Check size={20} />
                                </button>
                                <button 
                                  onClick={() => setEditingId(null)}
                                  className="w-10 h-10 flex items-center justify-center bg-slate-100 text-slate-600 rounded-xl"
                                >
                                  <X size={20} />
                                </button>
                              </div>
                            </div>
                            
                            {activeTable.id === 'districts' && (
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Departamento</label>
                                <select
                                  className="input w-full"
                                  value={editDeptId}
                                  onChange={(e) => setEditDeptId(e.target.value)}
                                >
                                  <option value="">Seleccionar...</option>
                                  {departments.map(d => (
                                    <option key={d.id} value={d.id}>{d.name}</option>
                                  ))}
                                </select>
                              </div>
                            )}
                            
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Nombre</label>
                              <input
                                autoFocus
                                type="text"
                                className="input w-full"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-4">
                            <div className="flex justify-between items-start">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-bold text-slate-400 tracking-wider">#{item.id}</span>
                                  <span className={cn(
                                    "px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider",
                                    item.is_active ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-400"
                                  )}>
                                    {item.is_active ? 'Activo' : 'Inactivo'}
                                  </span>
                                </div>
                                <h4 className={`font-bold text-slate-800 ${!item.is_active && 'text-slate-400 line-through'}`}>{item.name}</h4>
                                {(item as any).departments && (
                                  <div className="flex items-center gap-1.5">
                                    <span className="w-1 h-1 rounded-full bg-blue-500"></span>
                                    <span className="text-[11px] font-bold text-blue-600 uppercase tracking-widest">
                                      {(item as any).departments.name}
                                    </span>
                                  </div>
                                )}
                              </div>

                              <div className="flex gap-1">
                                <button 
                                  onClick={() => {
                                    setEditingId(item.id);
                                    setEditName(item.name);
                                    if (activeTable.id === 'districts') {
                                      setEditDeptId((item as any).department_id?.toString() || '');
                                    }
                                  }}
                                  className="w-10 h-10 flex items-center justify-center bg-blue-50 text-blue-600 rounded-xl"
                                >
                                  <Edit2 size={18} />
                                </button>
                                <StatusToggleButton 
                                  isActive={item.is_active}
                                  isUpdating={updatingId === item.id}
                                  onConfirm={() => handleToggleStatus(item)}
                                  confirmMessage={`¿Deseas ${item.is_active ? 'desactivar' : 'activar'} "${item.name}"?`}
                                />
                                <button 
                                  onClick={() => handleDeleteItem(item.id, item.name)}
                                  className="w-10 h-10 flex items-center justify-center bg-red-50 text-red-600 rounded-xl"
                                >
                                  <Trash2 size={18} />
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
