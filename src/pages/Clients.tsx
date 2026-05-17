import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Client, Contact, Department, District, Custodian } from '../types';
import { 
  Plus, 
  Search, 
  UserPlus, 
  Edit2,
  Building2, 
  ChevronRight, 
  Phone, 
  Mail, 
  X, 
  Loader2, 
  MapPin, 
  Briefcase, 
  Globe, 
  Fingerprint,
  Users,
  ShieldCheck,
  Tag,
  Map,
  BadgeCheck,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { StatusToggleButton } from '../components/StatusToggleButton';
import { FeedbackAlert } from '../components/FeedbackAlert';
import { cn } from '../lib/utils';
import { useAuth } from '../hooks/useAuth';

export function Clients() {
  const { isAdmin, isGerente } = useAuth();
  const canManage = isAdmin || isGerente;

  const [clients, setClients] = useState<Client[]>([]);
  const [allContacts, setAllContacts] = useState<(Contact & { clients?: { name: string } })[]>([]);
  const [allCustodians, setAllCustodians] = useState<(Custodian & { clients?: { name: string } })[]>([]);
  const [activeTab, setActiveTab] = useState<'clients' | 'contacts' | 'responsibles'>('clients');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [updatingContactId, setUpdatingContactId] = useState<string | null>(null);

  // States for the new client modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isContactsModalOpen, setIsContactsModalOpen] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [contactLoading, setContactLoading] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [contactFormData, setContactFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    position: '',
    is_active: true
  });
  const [submittingContact, setSubmittingContact] = useState(false);

  // Custodians states
  const [isCustodiansModalOpen, setIsCustodiansModalOpen] = useState(false);
  const [custodians, setCustodians] = useState<Custodian[]>([]);
  const [custodianLoading, setCustodianLoading] = useState(false);
  const [editingCustodian, setEditingCustodian] = useState<Custodian | null>(null);
  const [custodianFormData, setCustodianFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    department: '',
    job_title: '',
    is_active: true
  });
  const [submittingCustodian, setSubmittingCustodian] = useState(false);
  const [updatingCustodianId, setUpdatingCustodianId] = useState<string | null>(null);

  // Alert State
  const [pageMessage, setPageMessage] = useState<{ type: 'success' | 'alert' | 'error' | 'info' | 'warning', text: string } | null>(null);
  const [modalMessage, setModalMessage] = useState<{ type: 'success' | 'alert' | 'error' | 'info' | 'warning', text: string } | null>(null);

  const [departments, setDepartments] = useState<Department[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [filteredDistricts, setFilteredDistricts] = useState<District[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    trade_name: '',
    nit: '',
    nrc: '',
    economic_activity: '',
    address: '',
    department_id: '',
    district_id: '',
    email: '',
    phone: ''
  });

  useEffect(() => {
    fetchAllData();
    fetchGeography();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    await Promise.all([
      fetchClients(),
      fetchAllContacts(),
      fetchAllCustodians()
    ]);
    setLoading(false);
  };

  const fetchAllContacts = async () => {
    const { data, error } = await supabase
      .from('contacts')
      .select('*, clients(name)')
      .order('full_name');
    
    if (!error && data) {
      setAllContacts(data as any);
    }
  };

  const fetchAllCustodians = async () => {
    const { data, error } = await supabase
      .from('client_custodians')
      .select('*, clients(name)')
      .order('full_name');
    
    if (!error && data) {
      setAllCustodians(data as any);
    }
  };

  useEffect(() => {
    if (selectedClient) {
      fetchContacts(selectedClient.id);
      fetchCustodians(selectedClient.id);
    } else {
      setContacts([]);
      setCustodians([]);
    }
  }, [selectedClient]);

  const fetchCustodians = async (clientId: string) => {
    setCustodianLoading(true);
    const { data, error } = await supabase
      .from('client_custodians')
      .select('*')
      .eq('client_id', clientId)
      .order('full_name');
    
    if (!error && data) {
      const normalized = data.map((c: any) => ({
        ...c,
        is_active: c.is_active !== false
      })) as Custodian[];
      setCustodians(normalized);
    }
    setCustodianLoading(false);
  };

  const handleToggleCustodianStatus = async (custodian: Custodian) => {
    const newStatus = !custodian.is_active;
    setUpdatingCustodianId(custodian.id);
    try {
      const { error } = await supabase
        .from('client_custodians')
        .update({ is_active: newStatus })
        .eq('id', custodian.id);

      if (error) throw error;
      setCustodians(prev => prev.map(c => c.id === custodian.id ? { ...c, is_active: newStatus } : c));
      await fetchAllCustodians();
      setPageMessage({ type: 'success', text: `Responsable ${newStatus ? 'activado' : 'desactivado'} correctamente.` });
      setTimeout(() => setPageMessage(null), 3000);
    } catch (err: any) {
      setPageMessage({ type: 'error', text: `Error: ${err.message}` });
    } finally {
      setUpdatingCustodianId(null);
    }
  };

  const handleOpenCustodianModal = (custodian?: Custodian) => {
    if (custodian) {
      setEditingCustodian(custodian);
      setCustodianFormData({
        full_name: custodian.full_name,
        email: custodian.email || '',
        phone: custodian.phone || '',
        department: custodian.department || '',
        job_title: custodian.job_title || '',
        is_active: custodian.is_active
      });
    } else {
      setEditingCustodian(null);
      setCustodianFormData({
        full_name: '',
        email: '',
        phone: '',
        department: '',
        job_title: '',
        is_active: true
      });
    }
    setModalMessage(null);
    setIsCustodiansModalOpen(true);
  };

  const handleSaveCustodian = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient || submittingCustodian) return;

    setSubmittingCustodian(true);
    setModalMessage(null);
    try {
      const payload = {
        client_id: selectedClient.id,
        full_name: custodianFormData.full_name.trim(),
        email: custodianFormData.email.trim() || null,
        phone: custodianFormData.phone.trim() || null,
        department: custodianFormData.department.trim() || null,
        job_title: custodianFormData.job_title.trim() || null,
        is_active: custodianFormData.is_active
      };

      if (editingCustodian) {
        const { error } = await supabase
          .from('client_custodians')
          .update(payload)
          .eq('id', editingCustodian.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('client_custodians')
          .insert([payload]);
        if (error) throw error;
      }

      await fetchCustodians(selectedClient.id);
      await fetchAllCustodians();
      setPageMessage({ 
        type: 'success', 
        text: editingCustodian ? 'Información del responsable actualizada correctamente.' : 'Nuevo responsable registrado exitosamente.' 
      });
      setIsCustodiansModalOpen(false);
      setEditingCustodian(null);
      setTimeout(() => setPageMessage(null), 4000);
    } catch (err: any) {
      setModalMessage({ type: 'error', text: `Error: ${err.message}` });
    } finally {
      setSubmittingCustodian(false);
    }
  };

  const fetchContacts = async (clientId: string) => {
    setContactLoading(true);
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('client_id', clientId)
      .order('full_name');
    
    if (!error && data) {
      const normalized = data.map((c: any) => ({
        ...c,
        is_active: c.is_active !== false
      })) as Contact[];
      setContacts(normalized);
    }
    setContactLoading(false);
  };

  const handleToggleContactStatus = async (contact: Contact) => {
    const newStatus = !contact.is_active;
    setUpdatingContactId(contact.id);
    try {
      const { error } = await supabase
        .from('contacts')
        .update({ is_active: newStatus })
        .eq('id', contact.id);

      if (error) throw error;
      setContacts(prev => prev.map(c => c.id === contact.id ? { ...c, is_active: newStatus } : c));
      await fetchAllContacts();
      setPageMessage({ type: 'success', text: `Contacto ${newStatus ? 'activado' : 'desactivado'} correctamente.` });
      setTimeout(() => setPageMessage(null), 3000);
    } catch (err: any) {
      setPageMessage({ type: 'error', text: `Error: ${err.message}` });
    } finally {
      setUpdatingContactId(null);
    }
  };

  const handleOpenContactModal = (contact?: Contact) => {
    if (contact) {
      setEditingContact(contact);
      setContactFormData({
        full_name: contact.full_name,
        email: contact.email || '',
        phone: contact.phone || '',
        position: contact.position || '',
        is_active: contact.is_active
      });
    } else {
      setEditingContact(null);
      setContactFormData({
        full_name: '',
        email: '',
        phone: '',
        position: '',
        is_active: true
      });
    }
    setModalMessage(null);
    setIsContactsModalOpen(true);
  };

  const handleSaveContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient || submittingContact) return;

    setSubmittingContact(true);
    setModalMessage(null);
    try {
      const payload = {
        client_id: selectedClient.id,
        full_name: contactFormData.full_name.trim(),
        email: contactFormData.email.trim() || null,
        phone: contactFormData.phone.trim() || null,
        position: contactFormData.position.trim() || null,
        is_active: contactFormData.is_active
      };

      if (editingContact) {
        const { error } = await supabase
          .from('contacts')
          .update(payload)
          .eq('id', editingContact.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('contacts')
          .insert([payload]);
        if (error) throw error;
      }

      await fetchContacts(selectedClient.id);
      await fetchAllContacts();
      setPageMessage({ 
        type: 'success', 
        text: editingContact ? 'Información de contacto actualizada correctamente.' : 'Nuevo contacto registrado exitosamente.' 
      });
      setIsContactsModalOpen(false);
      setEditingContact(null);
      setContactFormData({ full_name: '', email: '', phone: '', position: '', is_active: true });
      setTimeout(() => setPageMessage(null), 4000);
    } catch (err: any) {
      setModalMessage({ type: 'error', text: `Error: ${err.message}` });
    } finally {
      setSubmittingContact(false);
    }
  };

  const fetchGeography = async () => {
    const { data: depts } = await supabase.from('departments').select('*').eq('is_active', true).order('name');
    const { data: dists } = await supabase.from('districts').select('*').eq('is_active', true).order('name');
    if (depts) setDepartments(depts);
    if (dists) setDistricts(dists);
  };

  useEffect(() => {
    if (formData.department_id) {
      setFilteredDistricts(districts.filter(d => d.department_id === parseInt(formData.department_id)));
    } else {
      setFilteredDistricts([]);
    }
  }, [formData.department_id, districts]);

  const fetchClients = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('clients')
      .select('*, departments(name), districts(name)')
      .order('name');
    
    if (!error && data) {
      const normalized = data.map((c: any) => ({
        ...c,
        is_active: c.is_active !== false
      })) as Client[];
      setClients(normalized);
    }
    setLoading(false);
  };

  const handleOpenModal = (client?: Client) => {
    setModalMessage(null);
    if (client) {
      setEditingClient(client);
      setFormData({
        name: client.name,
        trade_name: client.trade_name || '',
        nit: client.nit || '',
        nrc: client.nrc || '',
        economic_activity: client.economic_activity || '',
        address: client.address,
        department_id: client.department_id?.toString() || '',
        district_id: client.district_id?.toString() || '',
        email: client.email || '',
        phone: client.phone || ''
      });
    } else {
      setEditingClient(null);
      setFormData({
        name: '', trade_name: '', nit: '', nrc: '', 
        economic_activity: '', address: '', department_id: '',
        district_id: '', email: '', phone: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleRegisterClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    // Validación básica de campos requeridos (además de HTML5)
    if (!formData.name.trim()) {
      setModalMessage({ type: 'warning', text: 'El nombre o razón social es obligatorio.' });
      return;
    }

    if (!formData.department_id || !formData.district_id) {
      setModalMessage({ type: 'warning', text: 'Por favor selecciona un departamento y un distrito.' });
      return;
    }

    setSubmitting(true);
    setModalMessage(null);
    console.log('Starting client registration process...');

    try {
      const nameTrimmed = formData.name.trim();
      const nitClean = formData.nit.replace(/-/g, '').trim();
      const nrcClean = formData.nrc.trim();

      // Verificar duplicidad si es nuevo o si el nombre cambió
      if (!editingClient || editingClient.name.toLowerCase() !== nameTrimmed.toLowerCase()) {
        console.log('Checking for duplicates:', nameTrimmed);
        const { data: existingClient, error: checkError } = await supabase
          .from('clients')
          .select('id')
          .ilike('name', nameTrimmed)
          .limit(1)
          .maybeSingle();

        if (checkError) {
          console.error('Error checking for existing client:', checkError);
          throw checkError;
        }

        if (existingClient) {
          setModalMessage({ type: 'error', text: `Ya existe un cliente registrado con el nombre: ${nameTrimmed}` });
          setSubmitting(false);
          return;
        }
      }

      const payload = {
        name: nameTrimmed,
        trade_name: formData.trade_name.trim() || null,
        nit: nitClean || null,
        nrc: nrcClean || null,
        economic_activity: formData.economic_activity.trim() || null,
        address: formData.address.trim() || null,
        email: formData.email.trim() || null,
        phone: formData.phone.trim() || null,
        department_id: parseInt(formData.department_id),
        district_id: parseInt(formData.district_id),
        is_active: editingClient ? editingClient.is_active : true
      };

      if (editingClient) {
        console.log('Updating client:', editingClient.id);
        const { error: updateError } = await supabase
          .from('clients')
          .update(payload)
          .eq('id', editingClient.id);
        
        if (updateError) throw updateError;
      } else {
        console.log('Inserting new client');
        const { error: insertError } = await supabase.from('clients').insert([payload]);
        if (insertError) {
          console.error('Supabase insert error details:', insertError);
          if (insertError.code === 'PGRST204') {
            throw new Error('La base de datos aún no tiene las columnas de ubicación o actividad económica. Por favor, ejecuta el script SQL de migración en el editor de Supabase.');
          }
          throw insertError;
        }
      }

      console.log('Client saved successfully');
      setIsModalOpen(false);
      setEditingClient(null);
      setFormData({
        name: '', trade_name: '', nit: '', nrc: '', 
        economic_activity: '', address: '', department_id: '',
        district_id: '', email: '', phone: ''
      });
      await fetchAllData();
      if (selectedClient && editingClient?.id === selectedClient.id) {
        // Refresh selected client details
        const { data: refreshed } = await supabase.from('clients').select('*, departments(name), districts(name)').eq('id', selectedClient.id).single();
        if (refreshed) setSelectedClient(refreshed);
      }
      setPageMessage({ 
        type: 'success', 
        text: editingClient ? 'Datos del cliente actualizados exitosamente.' : 'Cliente registrado exitosamente en el sistema.' 
      });
      setTimeout(() => setPageMessage(null), 4000);
    } catch (err: any) {
      console.error('Unexpected error in handleRegisterClient:', err);
      setModalMessage({ type: 'error', text: `Error al registrar cliente: ${err.message || 'Error desconocido'}` });
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (client: Client) => {
    const newStatus = !client.is_active;
    setUpdatingId(client.id);
    try {
      const { error } = await supabase
        .from('clients')
        .update({ is_active: newStatus })
        .eq('id', client.id);

      if (error) throw error;
      setClients(prev => prev.map(c => c.id === client.id ? { ...c, is_active: newStatus } : c));
      setPageMessage({ type: 'success', text: `Cliente ${client.name} ${newStatus ? 'activado' : 'desactivado'} correctamente.` });
      setTimeout(() => setPageMessage(null), 3000);
    } catch (err: any) {
      setPageMessage({ type: 'error', text: `Error al actualizar estado: ${err.message}` });
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    (c.trade_name && c.trade_name.toLowerCase().includes(search.toLowerCase())) ||
    (c.nit && c.nit.includes(search))
  );

  const filteredContacts = !selectedClient ? [] : allContacts.filter(c => 
    c.client_id === selectedClient.id && (
      c.full_name.toLowerCase().includes(search.toLowerCase()) ||
      (c.email && c.email.toLowerCase().includes(search.toLowerCase())) ||
      (c.position && c.position.toLowerCase().includes(search.toLowerCase()))
    )
  );

  const filteredCustodians = !selectedClient ? [] : allCustodians.filter(c => 
    c.client_id === selectedClient.id && (
      c.full_name.toLowerCase().includes(search.toLowerCase()) ||
      (c.email && c.email.toLowerCase().includes(search.toLowerCase())) ||
      (c.job_title && c.job_title.toLowerCase().includes(search.toLowerCase())) ||
      (c.department && c.department.toLowerCase().includes(search.toLowerCase()))
    )
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

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Clientes</h1>
          <p className="text-slate-500 text-sm">Gestiona la base de datos de clientes y su información fiscal.</p>
        </div>
        {canManage && (
          <button onClick={() => handleOpenModal()} className="btn-primary w-full md:w-auto">
            <Plus className="mr-2" size={20} />
            Nuevo Cliente
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-col gap-4">
            <div className="flex p-1 bg-slate-100 rounded-2xl w-fit">
              <button 
                onClick={() => setActiveTab('clients')}
                className={cn(
                  "px-4 py-2 text-xs font-bold uppercase tracking-widest rounded-xl transition-all",
                  activeTab === 'clients' ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                )}
              >
                Clientes
              </button>
              <button 
                onClick={() => setActiveTab('contacts')}
                className={cn(
                  "px-4 py-2 text-xs font-bold uppercase tracking-widest rounded-xl transition-all",
                  activeTab === 'contacts' ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                )}
              >
                Contactos
              </button>
              <button 
                onClick={() => setActiveTab('responsibles')}
                className={cn(
                  "px-4 py-2 text-xs font-bold uppercase tracking-widest rounded-xl transition-all",
                  activeTab === 'responsibles' ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                )}
              >
                Responsables
              </button>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input 
                type="text" 
                placeholder={
                  activeTab === 'clients' ? "Buscar por nombre, NIT o nombre comercial..." :
                  activeTab === 'contacts' ? "Buscar contacto por nombre, email o cargo..." :
                  "Buscar responsable por nombre, email, dpto o cargo..."
                }
                className="input pl-10 w-full"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="card shadow-sm border-slate-200 overflow-hidden">
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-100">
                  {activeTab === 'clients' ? (
                    <tr>
                      <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cliente</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Estado</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Acciones</th>
                    </tr>
                  ) : activeTab === 'contacts' ? (
                    <tr>
                      <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nombre</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Cliente</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Acciones</th>
                    </tr>
                  ) : (
                    <tr>
                      <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nombre</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Cliente</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Acciones</th>
                    </tr>
                  )}
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {loading ? (
                    <tr>
                      <td colSpan={3} className="px-6 py-12 text-center text-slate-400">
                        <Loader2 className="animate-spin mx-auto mb-2" size={24} />
                        Cargando data...
                      </td>
                    </tr>
                  ) : activeTab === 'clients' ? (
                    filteredClients.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-6 py-12 text-center text-slate-400">No se encontraron clientes.</td>
                      </tr>
                    ) : (
                      filteredClients.map((client) => (
                        <tr 
                          key={client.id} 
                          className={cn(
                            "hover:bg-slate-50/50 transition-colors group cursor-pointer",
                            selectedClient?.id === client.id && "bg-blue-50/50"
                          )}
                          onClick={() => setSelectedClient(client)}
                        >
                          <td className="px-6 py-4">
                            <div className="font-bold text-slate-900">{client.name}</div>
                            <div className="flex flex-wrap gap-2 items-center mt-0.5">
                               <div className="text-[10px] text-slate-400 font-mono tracking-tighter">NIT: {client.nit || '---'}</div>
                               {client.departments && (
                                 <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded flex items-center gap-1 uppercase tracking-wider font-bold">
                                   <MapPin size={10} className="text-slate-400" />
                                   {(client.departments as any).name}
                                 </span>
                               )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                             <div className="flex justify-center">
                              <span className={cn(
                                "flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                                client.is_active ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-400"
                              )}>
                                <span className={cn("w-1.5 h-1.5 rounded-full", client.is_active ? "bg-emerald-500" : "bg-slate-300")}></span>
                                {client.is_active ? 'Activo' : 'Inactivo'}
                              </span>
                             </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2" onClick={e => e.stopPropagation()}>
                              {canManage && (
                                <>
                                  <button onClick={() => handleOpenModal(client)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title="Editar Cliente">
                                    <Edit2 size={18} />
                                  </button>
                                  <button onClick={() => { setSelectedClient(client); handleOpenContactModal(); }} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all" title="Agregar Contacto">
                                    <UserPlus size={18} />
                                  </button>
                                  <StatusToggleButton isActive={client.is_active} isUpdating={updatingId === client.id} onConfirm={() => handleToggleStatus(client)} confirmMessage={`¿Deseas ${client.is_active ? 'desactivar' : 'activar'} el cliente ${client.name}?`} />
                                </>
                              )}
                              <ChevronRight size={18} className="text-slate-300" />
                            </div>
                          </td>
                        </tr>
                      ))
                    )
                  ) : activeTab === 'contacts' ? (
                    !selectedClient ? (
                      <tr>
                        <td colSpan={3} className="px-6 py-12 text-center text-slate-400">
                          <Info className="mx-auto mb-2 opacity-50" size={24} />
                          Selecciona un cliente para ver sus contactos.
                        </td>
                      </tr>
                    ) : filteredContacts.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-6 py-12 text-center text-slate-400">No se encontraron contactos para este cliente.</td>
                      </tr>
                    ) : (
                      filteredContacts.map((contact) => (
                        <tr 
                          key={contact.id} 
                          className="hover:bg-slate-50/50 transition-colors group cursor-pointer"
                          onClick={() => {
                            const client = clients.find(c => c.id === contact.client_id);
                            if (client) setSelectedClient(client);
                          }}
                        >
                          <td className="px-6 py-4">
                            <div className="font-bold text-slate-900">{contact.full_name}</div>
                            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{contact.position || 'Contacto'}</div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="text-xs font-medium text-slate-600">{(contact.clients as any)?.name}</div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2" onClick={e => e.stopPropagation()}>
                               <div className="flex flex-col items-end mr-3">
                                  {contact.phone && <span className="text-[10px] text-slate-500">{contact.phone}</span>}
                                  {contact.email && <span className="text-[10px] text-slate-400">{contact.email}</span>}
                               </div>
                               {canManage && (
                                 <div className="flex items-center gap-1">
                                   <StatusToggleButton 
                                      isActive={contact.is_active}
                                      isUpdating={updatingContactId === contact.id}
                                      onConfirm={() => handleToggleContactStatus(contact)}
                                      confirmMessage={`¿Deseas ${contact.is_active ? 'desactivar' : 'activar'} a ${contact.full_name}?`}
                                      size="sm"
                                    />
                                    <button 
                                      onClick={() => {
                                        const client = clients.find(c => c.id === contact.client_id);
                                        if (client) setSelectedClient(client);
                                        handleOpenContactModal(contact);
                                      }}
                                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                      title="Editar Contacto"
                                    >
                                      <Edit2 size={16} />
                                    </button>
                                 </div>
                               )}
                               <ChevronRight size={18} className="text-slate-300" />
                            </div>
                          </td>
                        </tr>
                      ))
                    )
                  ) : (
                    !selectedClient ? (
                      <tr>
                        <td colSpan={3} className="px-6 py-12 text-center text-slate-400">
                          <Info className="mx-auto mb-2 opacity-50" size={24} />
                          Selecciona un cliente para ver sus responsables.
                        </td>
                      </tr>
                    ) : filteredCustodians.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-6 py-12 text-center text-slate-400">No se encontraron responsables para este cliente.</td>
                      </tr>
                    ) : (
                      filteredCustodians.map((custodian) => (
                        <tr 
                          key={custodian.id} 
                          className="hover:bg-slate-50/50 transition-colors group cursor-pointer"
                          onClick={() => {
                            const client = clients.find(c => c.id === custodian.client_id);
                            if (client) setSelectedClient(client);
                          }}
                        >
                          <td className="px-6 py-4">
                            <div className="font-bold text-slate-900">{custodian.full_name}</div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] text-purple-600 font-bold uppercase tracking-widest">{custodian.job_title || 'Responsable'}</span>
                              <span className="text-[9px] text-slate-300">•</span>
                              <span className="text-[9px] text-slate-400 uppercase">{custodian.department}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="text-xs font-medium text-slate-600">{(custodian.clients as any)?.name}</div>
                          </td>
                          <td className="px-6 py-4 text-right">
                             <div className="flex items-center justify-end gap-2" onClick={e => e.stopPropagation()}>
                               <div className="flex flex-col items-end mr-3">
                                  {custodian.phone && <span className="text-[10px] text-slate-500">{custodian.phone}</span>}
                                  {custodian.email && <span className="text-[10px] text-slate-400">{custodian.email}</span>}
                               </div>
                               {canManage && (
                                 <div className="flex items-center gap-1">
                                   <StatusToggleButton 
                                      isActive={custodian.is_active}
                                      isUpdating={updatingCustodianId === custodian.id}
                                      onConfirm={() => handleToggleCustodianStatus(custodian)}
                                      confirmMessage={`¿Deseas ${custodian.is_active ? 'desactivar' : 'activar'} a ${custodian.full_name}?`}
                                      size="sm"
                                    />
                                    <button 
                                      onClick={() => {
                                        const client = clients.find(c => c.id === custodian.client_id);
                                        if (client) setSelectedClient(client);
                                        handleOpenCustodianModal(custodian);
                                      }}
                                      className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                                      title="Editar Responsable"
                                    >
                                      <Edit2 size={16} />
                                    </button>
                                 </div>
                               )}
                               <ChevronRight size={18} className="text-slate-300" />
                            </div>
                          </td>
                        </tr>
                      ))
                    )
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View */}
            <div className="md:hidden divide-y divide-slate-100">
              {loading ? (
                <div className="p-12 text-center text-slate-400">
                  <Loader2 className="animate-spin mx-auto mb-2" size={24} />
                  Cargando data...
                </div>
              ) : activeTab === 'clients' ? (
                filteredClients.length === 0 ? (
                  <div className="p-12 text-center text-slate-400">No se encontraron clientes.</div>
                ) : (
                  filteredClients.map((client) => (
                    <div 
                      key={client.id}
                      className={cn(
                        "p-5 space-y-4 active:bg-slate-50 transition-colors",
                        selectedClient?.id === client.id && "bg-blue-50/30"
                      )}
                      onClick={() => setSelectedClient(client)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                             <span className={cn(
                              "px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest",
                              client.is_active ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-slate-50 text-slate-400 border border-slate-100"
                            )}>
                              {client.is_active ? 'Activo' : 'Inactivo'}
                            </span>
                          </div>
                          <h4 className="font-bold text-slate-800 text-base">{client.name}</h4>
                        </div>
                        <ChevronRight size={20} className="text-slate-300" />
                      </div>
                    </div>
                  ))
                )
              ) : activeTab === 'contacts' ? (
                !selectedClient ? (
                  <div className="p-12 text-center text-slate-400">
                    <Info className="mx-auto mb-2 opacity-50" size={24} />
                    Selecciona un cliente para ver sus contactos.
                  </div>
                ) : filteredContacts.length === 0 ? (
                  <div className="p-12 text-center text-slate-400">No se encontraron contactos para este cliente.</div>
                ) : (
                  filteredContacts.map((contact) => (
                    <div 
                      key={contact.id}
                      className="p-5 active:bg-slate-50 transition-colors"
                      onClick={() => {
                        const client = clients.find(c => c.id === contact.client_id);
                        if (client) setSelectedClient(client);
                      }}
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <span className={cn("w-2 h-2 rounded-full shrink-0", contact.is_active ? "bg-emerald-500" : "bg-slate-300")}></span>
                          <div>
                            <div className="text-[8px] text-blue-600 font-bold uppercase tracking-widest mb-1">{(contact.clients as any)?.name}</div>
                            <h4 className="font-bold text-slate-800 text-sm">{contact.full_name}</h4>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{contact.position || 'Contacto'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {canManage && (
                            <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                              <StatusToggleButton 
                                isActive={contact.is_active}
                                isUpdating={updatingContactId === contact.id}
                                onConfirm={() => handleToggleContactStatus(contact)}
                                confirmMessage={`¿Deseas ${contact.is_active ? 'desactivar' : 'activar'} a ${contact.full_name}?`}
                                size="sm"
                              />
                              <button 
                                onClick={() => {
                                  const client = clients.find(c => c.id === contact.client_id);
                                  if (client) setSelectedClient(client);
                                  handleOpenContactModal(contact);
                                }}
                                className="w-8 h-8 flex items-center justify-center bg-blue-50 text-blue-600 rounded-lg"
                              >
                                <Edit2 size={16} />
                              </button>
                            </div>
                          )}
                          <ChevronRight size={20} className="text-slate-300" />
                        </div>
                      </div>
                    </div>
                  ))
                )
              ) : (
                !selectedClient ? (
                  <div className="p-12 text-center text-slate-400">
                    <Info className="mx-auto mb-2 opacity-50" size={24} />
                    Selecciona un cliente para ver sus responsables.
                  </div>
                ) : filteredCustodians.length === 0 ? (
                  <div className="p-12 text-center text-slate-400">No se encontraron responsables para este cliente.</div>
                ) : (
                  filteredCustodians.map((custodian) => (
                    <div 
                      key={custodian.id}
                      className="p-5 active:bg-slate-50 transition-colors"
                      onClick={() => {
                        const client = clients.find(c => c.id === custodian.client_id);
                        if (client) setSelectedClient(client);
                      }}
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <span className={cn("w-2 h-2 rounded-full shrink-0", custodian.is_active ? "bg-purple-500" : "bg-slate-300")}></span>
                          <div>
                            <div className="text-[8px] text-purple-600 font-bold uppercase tracking-widest mb-1">{(custodian.clients as any)?.name}</div>
                            <h4 className="font-bold text-slate-800 text-sm">{custodian.full_name}</h4>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{custodian.job_title || 'Responsable'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {canManage && (
                            <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                              <StatusToggleButton 
                                isActive={custodian.is_active}
                                isUpdating={updatingCustodianId === custodian.id}
                                onConfirm={() => handleToggleCustodianStatus(custodian)}
                                confirmMessage={`¿Deseas ${custodian.is_active ? 'desactivar' : 'activar'} a ${custodian.full_name}?`}
                                size="sm"
                              />
                              <button 
                                onClick={() => {
                                  const client = clients.find(c => c.id === custodian.client_id);
                                  if (client) setSelectedClient(client);
                                  handleOpenCustodianModal(custodian);
                                }}
                                className="w-8 h-8 flex items-center justify-center bg-purple-50 text-purple-600 rounded-lg"
                              >
                                <Edit2 size={16} />
                              </button>
                            </div>
                          )}
                          <ChevronRight size={20} className="text-slate-300" />
                        </div>
                      </div>
                    </div>
                  ))
                )
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <AnimatePresence mode="wait">
            {selectedClient ? (
              <motion.div
                key={selectedClient.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className={cn(
                  "card border-l-4 border-l-blue-500 transition-all shadow-xl lg:shadow-md",
                  "fixed inset-0 z-[60] bg-white lg:relative lg:inset-auto lg:z-0 lg:bg-white",
                  "flex flex-col lg:sticky lg:top-6 lg:h-auto overflow-hidden lg:rounded-3xl"
                )}
              >
                {/* Header with quick actions */}
                <div className="p-6 bg-slate-50/50 border-b border-slate-100 flex justify-between items-start shrink-0">
                  <div className="flex gap-4 min-w-0">
                    <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-100 shrink-0">
                      <Building2 size={24} />
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-lg font-bold text-slate-900 leading-tight truncate">{selectedClient.name}</h2>
                      {selectedClient.trade_name && (
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest truncate mt-0.5">{selectedClient.trade_name}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {canManage && (
                      <button 
                        onClick={() => handleOpenModal(selectedClient)}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                        title="Editar Cliente"
                      >
                        <Edit2 size={18} />
                      </button>
                    )}
                    <button 
                      onClick={() => setSelectedClient(null)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                      title="Cerrar Detalles"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>

                {/* Content (Scrollable) */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                  {/* Fiscal Info Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50/50 p-3 rounded-2xl border border-slate-100">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">NIT</p>
                      <p className="text-xs font-mono font-bold text-slate-700">{selectedClient.nit || '---'}</p>
                    </div>
                    <div className="bg-slate-50/50 p-3 rounded-2xl border border-slate-100 text-right">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">NRC</p>
                      <p className="text-xs font-mono font-bold text-slate-700">{selectedClient.nrc || '---'}</p>
                    </div>
                  </div>

                  {/* Contacts Section */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                        <Users size={12} className="text-blue-500" /> 
                        Contactos ({contacts.length})
                      </h3>
                      {canManage && (
                        <button 
                          onClick={() => handleOpenContactModal()}
                          className="flex items-center gap-1 text-[9px] font-bold text-blue-600 hover:bg-blue-50 px-2 py-1 rounded-lg transition-all border border-transparent hover:border-blue-100 uppercase tracking-widest"
                        >
                          <Plus size={10} /> Agregar
                        </button>
                      )}
                    </div>
                    {contactLoading ? (
                      <div className="flex justify-center py-4">
                        <Loader2 className="animate-spin text-slate-300" size={16} />
                      </div>
                    ) : contacts.length > 0 ? (
                      <div className="grid grid-cols-1 gap-2">
                        {contacts.map(contact => (
                          <div key={contact.id} className={cn(
                            "group p-3 rounded-2xl border transition-all relative overflow-hidden",
                            contact.is_active ? "bg-white border-slate-100 shadow-sm" : "bg-slate-50 opacity-60 border-slate-100"
                          )}>
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex items-center gap-2 pr-12">
                                <span className={cn("w-2 h-2 rounded-full shrink-0", contact.is_active ? "bg-emerald-500" : "bg-slate-300")}></span>
                                <div className="min-w-0">
                                  <p className="text-xs font-bold text-slate-800 truncate">{contact.full_name}</p>
                                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest truncate">{contact.position || 'Representante'}</p>
                                </div>
                              </div>
                              {canManage && (
                                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 backdrop-blur-sm p-1 rounded-lg shadow-sm">
                                  <StatusToggleButton 
                                    isActive={contact.is_active}
                                    isUpdating={updatingContactId === contact.id}
                                    onConfirm={() => handleToggleContactStatus(contact)}
                                    confirmMessage={`¿Deseas ${contact.is_active ? 'desactivar' : 'activar'} a ${contact.full_name}?`}
                                    size="sm"
                                  />
                                  <button onClick={() => handleOpenContactModal(contact)} className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                    <Edit2 size={10} />
                                  </button>
                                </div>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-x-4 gap-y-1">
                              {contact.phone && (
                                <div className="flex items-center gap-1 text-[10px] text-slate-500 font-medium">
                                  <Phone size={10} className="text-slate-300" /> {contact.phone}
                                </div>
                              )}
                              {contact.email && (
                                <div className="flex items-center gap-1 text-[10px] text-slate-500 font-medium shrink-0">
                                  <Mail size={10} className="text-slate-300" /> <span className="truncate max-w-[140px]">{contact.email}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.2em]">Sin contactos registrados</p>
                      </div>
                    )}
                  </div>

                  {/* Custodians Section */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-[10px] font-bold text-purple-600 uppercase tracking-[0.2em] flex items-center gap-2">
                        <ShieldCheck size={12} /> 
                        Responsables ({custodians.length})
                      </h3>
                      {canManage && (
                        <button 
                          onClick={() => handleOpenCustodianModal()}
                          className="flex items-center gap-1 text-[9px] font-bold text-purple-600 hover:bg-purple-50 px-2 py-1 rounded-lg transition-all border border-transparent hover:border-purple-100 uppercase tracking-widest"
                        >
                          <Plus size={10} /> Agregar
                        </button>
                      )}
                    </div>
                    {custodianLoading ? (
                      <div className="flex justify-center py-4">
                        <Loader2 className="animate-spin text-purple-300" size={16} />
                      </div>
                    ) : custodians.length > 0 ? (
                      <div className="grid grid-cols-1 gap-2">
                        {custodians.map(custodian => (
                          <div key={custodian.id} className={cn(
                            "group p-3 rounded-2xl border transition-all relative overflow-hidden",
                            custodian.is_active ? "bg-purple-50/20 border-purple-100 shadow-sm" : "bg-slate-50 opacity-60 border-slate-100"
                          )}>
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex items-center gap-2 pr-12">
                                <span className={cn("w-2 h-2 rounded-full shrink-0", custodian.is_active ? "bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.4)]" : "bg-slate-300")}></span>
                                <div className="min-w-0">
                                  <p className="text-xs font-bold text-slate-800 truncate">{custodian.full_name}</p>
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    <p className="text-[9px] text-purple-600 font-bold uppercase tracking-widest truncate">{custodian.job_title || 'Titular'}</p>
                                    {custodian.department && (
                                      <>
                                        <span className="text-[9px] text-purple-200">•</span>
                                        <p className="text-[9px] text-slate-400 font-medium uppercase truncate">{custodian.department}</p>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                              {canManage && (
                                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 backdrop-blur-sm p-1 rounded-lg shadow-sm">
                                  <StatusToggleButton 
                                    isActive={custodian.is_active}
                                    isUpdating={updatingCustodianId === custodian.id}
                                    onConfirm={() => handleToggleCustodianStatus(custodian)}
                                    confirmMessage={`¿Deseas ${custodian.is_active ? 'desactivar' : 'activar'} a ${custodian.full_name}?`}
                                    size="sm"
                                  />
                                  <button onClick={() => handleOpenCustodianModal(custodian)} className="p-1 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors">
                                    <Edit2 size={10} />
                                  </button>
                                </div>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-x-4 gap-y-1">
                              {custodian.phone && (
                                <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-medium">
                                  <Phone size={10} className="text-slate-300" /> {custodian.phone}
                                </div>
                              )}
                              {custodian.email && (
                                <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-medium shrink-0">
                                  <Mail size={10} className="text-slate-300" /> <span className="truncate max-w-[140px]">{custodian.email}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 bg-purple-50/10 rounded-3xl border border-dashed border-purple-100">
                        <p className="text-[9px] text-purple-400 font-bold uppercase tracking-[0.2em]">Sin responsables registrados</p>
                      </div>
                    )}
                  </div>

                  {/* Location & Global Info */}
                  <div className="pt-6 border-t border-slate-100 space-y-4">
                    <div className="flex items-start gap-4 p-3 bg-slate-50/50 rounded-2xl border border-slate-100">
                      <div className="p-2 bg-slate-100 text-slate-500 rounded-lg shrink-0">
                        <MapPin size={16} />
                      </div>
                      <div className="text-xs text-slate-600 leading-relaxed min-w-0">
                        <p className="font-medium text-slate-800">{selectedClient.address}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1.5">
                          {selectedClient.districts?.name}, {selectedClient.departments?.name}
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-3">
                      {selectedClient.email && (
                        <div className="flex items-center gap-4 p-3 bg-slate-50/50 rounded-2xl border border-slate-100">
                          <div className="p-2 bg-slate-100 text-slate-500 rounded-lg shrink-0">
                            <Mail size={16} />
                          </div>
                          <p className="text-xs text-slate-700 font-medium truncate">{selectedClient.email}</p>
                        </div>
                      )}
                      {selectedClient.phone && (
                        <div className="flex items-center gap-4 p-3 bg-white lg:bg-slate-50/50 rounded-2xl border border-slate-100">
                          <div className="p-2 bg-slate-100 text-slate-500 rounded-lg shrink-0">
                            <Phone size={16} />
                          </div>
                          <p className="text-xs text-slate-700 font-bold">{selectedClient.phone}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="card border-dashed border-2 flex flex-col items-center justify-center py-16 px-6 text-center text-slate-400">
                <div className="p-4 bg-slate-50 rounded-full mb-4">
                  <Building2 size={32} />
                </div>
                <h3 className="font-bold text-slate-600">Ningún cliente seleccionado</h3>
                <p className="text-xs mt-1">Selecciona un cliente de la lista para ver sus detalles y contactos.</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* New Client Modal */}
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
                      {editingClient ? <Edit2 size={24} /> : <Building2 size={24} />}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-slate-800 leading-tight">
                        {editingClient ? 'Editar Cliente' : 'Registro de Nuevo Cliente'}
                      </h2>
                      <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-0.5">
                        {editingClient ? `Editando: ${editingClient.name}` : 'Información Corporativa & Fiscal'}
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

              <form onSubmit={handleRegisterClient} className="p-6 pt-2 overflow-y-auto space-y-6">
                {/* General Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Razon Social / Nombre</label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                      <input 
                        type="text" required 
                        placeholder="Nombre de la empresa o cliente"
                        className="input pl-10"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Nombre Comercial</label>
                    <div className="relative">
                      <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                      <input 
                        type="text" 
                        placeholder="Nombre comercial"
                        className="input pl-10"
                        value={formData.trade_name}
                        onChange={(e) => setFormData({...formData, trade_name: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                {/* Fiscal Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-blue-50/30 p-4 rounded-2xl border border-blue-100/50">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">NIT (Sin guiones)</label>
                    <div className="relative">
                      <Fingerprint className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                      <input 
                        type="text" 
                        placeholder="Ej: 06141201901011"
                        className="input pl-10 font-mono text-sm"
                        value={formData.nit}
                        onChange={(e) => setFormData({...formData, nit: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">NRC (Con guiones)</label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                      <input 
                        type="text" 
                        placeholder="Ej: 123456-7"
                        className="input pl-10 font-mono text-sm"
                        value={formData.nrc}
                        onChange={(e) => setFormData({...formData, nrc: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="md:col-span-2 space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Actividad Económica</label>
                    <input 
                      type="text"
                      placeholder="Giro o actividad de la empresa"
                      className="input"
                      value={formData.economic_activity}
                      onChange={(e) => setFormData({...formData, economic_activity: e.target.value})}
                    />
                  </div>
                </div>

                {/* Contact Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Correo Electrónico</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                      <input 
                        type="email" 
                        placeholder="correo@ejemplo.com"
                        className="input pl-10"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Teléfono</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                      <input 
                        type="tel"
                        placeholder="Número de teléfono"
                        className="input pl-10"
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                {/* location */}
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Departamento</label>
                      <select 
                        required
                        className="input"
                        value={formData.department_id}
                        onChange={(e) => setFormData({...formData, department_id: e.target.value, district_id: ''})}
                      >
                        <option value="">Selecciona...</option>
                        {departments.map(d => (
                          <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Distrito</label>
                      <select 
                        required
                        disabled={!formData.department_id}
                        className="input disabled:bg-slate-50 disabled:text-slate-400 transition-colors"
                        value={formData.district_id}
                        onChange={(e) => setFormData({...formData, district_id: e.target.value})}
                      >
                        <option value="">Selecciona...</option>
                        {filteredDistricts.map(d => (
                          <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Dirección Completa</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 text-slate-300" size={16} />
                      <textarea 
                        rows={2} required
                        placeholder="Dirección del domicilio o fiscal..."
                        className="input pl-10 min-h-[80px]"
                        value={formData.address}
                        onChange={(e) => setFormData({...formData, address: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button 
                    type="button" 
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-slate-200 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    disabled={submitting}
                    className="flex-[2] py-3 bg-blue-600 text-white rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-200 transition-all flex items-center justify-center gap-2"
                  >
                    {submitting ? <Loader2 className="animate-spin" size={18} /> : (editingClient ? <Edit2 size={18} /> : <Plus size={18} />)}
                    {submitting ? 'Procesando...' : (editingClient ? 'Guardar Cambios' : 'Finalizar Registro')}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      {/* Custodian Manager Modal */}
      <AnimatePresence>
        {isCustodiansModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setIsCustodiansModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" 
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="p-6 bg-purple-50 border-b border-purple-100 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-600 text-white rounded-xl shadow-lg shadow-purple-200">
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-800 leading-tight">
                      {editingCustodian ? 'Editar Responsable' : 'Nuevo Responsable de Activos'}
                    </h2>
                    <p className="text-[10px] text-purple-500 font-bold uppercase tracking-widest mt-0.5">
                      Responsable Final en: {selectedClient?.name}
                    </p>
                  </div>
                </div>
                <button onClick={() => setIsCustodiansModalOpen(false)} className="p-2 hover:bg-purple-100 rounded-lg text-slate-400 transition-colors">
                  <X size={18} />
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

              <form onSubmit={handleSaveCustodian} className="p-6 pt-2 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Nombre Completo (Responsable)</label>
                  <input 
                    type="text" required 
                    placeholder="Ej: Juan Pérez"
                    className="input border-purple-50 focus:border-purple-400"
                    value={custodianFormData.full_name}
                    onChange={(e) => setCustodianFormData({...custodianFormData, full_name: e.target.value})}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Departamento / Área</label>
                    <input 
                      type="text"
                      placeholder="Ej: Contabilidad"
                      className="input border-purple-50 focus:border-purple-400"
                      value={custodianFormData.department}
                      onChange={(e) => setCustodianFormData({...custodianFormData, department: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Cargo</label>
                    <input 
                      type="text"
                      placeholder="Ej: Analista"
                      className="input border-purple-50 focus:border-purple-400"
                      value={custodianFormData.job_title}
                      onChange={(e) => setCustodianFormData({...custodianFormData, job_title: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Teléfono</label>
                    <input 
                      type="tel"
                      className="input border-purple-50 focus:border-purple-400"
                      value={custodianFormData.phone}
                      onChange={(e) => setCustodianFormData({...custodianFormData, phone: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Email Corporativo</label>
                    <input 
                      type="email"
                      className="input border-purple-50 focus:border-purple-400"
                      value={custodianFormData.email}
                      onChange={(e) => setCustodianFormData({...custodianFormData, email: e.target.value})}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-purple-50/30 rounded-2xl border border-purple-100">
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "w-2.5 h-2.5 rounded-full",
                      custodianFormData.is_active ? "bg-purple-500 animate-pulse" : "bg-slate-300"
                    )}></div>
                    <span className="text-[10px] font-bold text-purple-700 uppercase tracking-widest">
                      {custodianFormData.is_active ? 'Responsable Habilitado' : 'Responsable Inactivo'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCustodianFormData(prev => ({ ...prev, is_active: !prev.is_active }))}
                    className={cn(
                      "px-4 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all shadow-sm",
                      custodianFormData.is_active ? "bg-white text-amber-600 border border-amber-100 hover:bg-amber-50" : "bg-white text-emerald-600 border border-emerald-100 hover:bg-emerald-50"
                    )}
                  >
                    {custodianFormData.is_active ? 'Deshabilitar' : 'Habilitar'}
                  </button>
                </div>

                <div className="flex gap-4 pt-6">
                  <button 
                    type="button" 
                    onClick={() => setIsCustodiansModalOpen(false)}
                    className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-slate-200 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    disabled={submittingCustodian}
                    className="flex-[2] py-4 bg-purple-600 text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl shadow-purple-200 hover:bg-purple-700 transition-all"
                  >
                    {submittingCustodian ? <Loader2 className="animate-spin" size={18} /> : (editingCustodian ? <BadgeCheck size={18} /> : <ShieldCheck size={18} />)}
                    {editingCustodian ? 'Actualizar Responsable' : 'Registrar Responsable'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      {/* Contact Manager Modal */}
      <AnimatePresence>
        {isContactsModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setIsContactsModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" 
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="p-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 text-blue-600 rounded-xl">
                    <UserPlus size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-800 leading-tight">
                      {editingContact ? 'Editar Contacto' : 'Nuevo Contacto'}
                    </h2>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">
                      Para: {selectedClient?.name}
                    </p>
                  </div>
                </div>
                <button onClick={() => setIsContactsModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-lg text-slate-400">
                  <X size={18} />
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

              <form onSubmit={handleSaveContact} className="p-6 pt-2 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Nombre Completo</label>
                  <input 
                    type="text" required 
                    className="input"
                    value={contactFormData.full_name}
                    onChange={(e) => setContactFormData({...contactFormData, full_name: e.target.value})}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Cargo / Posición</label>
                  <input 
                    type="text"
                    className="input"
                    value={contactFormData.position}
                    onChange={(e) => setContactFormData({...contactFormData, position: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Teléfono</label>
                    <input 
                      type="tel"
                      className="input"
                      value={contactFormData.phone}
                      onChange={(e) => setContactFormData({...contactFormData, phone: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Correo</label>
                    <input 
                      type="email"
                      className="input"
                      value={contactFormData.email}
                      onChange={(e) => setContactFormData({...contactFormData, email: e.target.value})}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      contactFormData.is_active ? "bg-emerald-500" : "bg-slate-300"
                    )}></div>
                    <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                      {contactFormData.is_active ? 'Contacto Activo' : 'Contacto Inactivo'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setContactFormData(prev => ({ ...prev, is_active: !prev.is_active }))}
                    className={cn(
                      "px-3 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-colors",
                      contactFormData.is_active ? "bg-amber-50 text-amber-600 hover:bg-amber-100" : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                    )}
                  >
                    {contactFormData.is_active ? 'Desactivar' : 'Activar'}
                  </button>
                </div>

                <div className="flex gap-3 pt-4">
                  <button 
                    type="button" 
                    onClick={() => setIsContactsModalOpen(false)}
                    className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-slate-200 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    disabled={submittingContact}
                    className="flex-[2] py-3 bg-blue-600 text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-blue-200"
                  >
                    {submittingContact ? <Loader2 className="animate-spin" size={16} /> : <UserPlus size={16} />}
                    {editingContact ? 'Actualizar' : 'Registrar'}
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
