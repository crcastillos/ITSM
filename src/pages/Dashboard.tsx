import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Users, Monitor, BookOpen, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';

export function Dashboard() {
  const [stats, setStats] = useState({
    clients: 0,
    assets: 0,
    services: 0
  });

  useEffect(() => {
    async function fetchStats() {
      const [{ count: cCount }, { count: aCount }, { count: sCount }] = await Promise.all([
        supabase.from('clients').select('*', { count: 'exact', head: true }),
        supabase.from('assets').select('*', { count: 'exact', head: true }),
        supabase.from('services').select('*', { count: 'exact', head: true }),
      ]);

      setStats({
        clients: cCount || 0,
        assets: aCount || 0,
        services: sCount || 0
      });
    }
    fetchStats();
  }, []);

  const cards = [
    { label: 'Clientes', value: stats.clients, icon: Users, color: 'bg-blue-500' },
    { label: 'IT Assets', value: stats.assets, icon: Monitor, color: 'bg-indigo-500' },
    { label: 'Catálogo de Servicios', value: stats.services, icon: BookOpen, color: 'bg-emerald-500' },
  ];

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center min-h-[4rem] md:h-16 border-b border-slate-200 -mx-6 px-6 pl-14 md:pl-6 -mt-8 bg-white mb-8 py-3 md:py-0">
        <div className="flex items-center space-x-2 text-sm">
          <span className="text-slate-400">Principal /</span>
          <span className="font-semibold text-slate-700">Dashboard</span>
        </div>
      </header>

      <section>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {cards.map((card, idx) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="stat-card flex flex-col justify-between min-h-[120px]"
            >
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{card.label}</p>
                <div className="flex items-center justify-between mt-2">
                  <h3 className="text-3xl font-bold text-slate-800 font-display">{card.value.toLocaleString()}</h3>
                  <div className="text-slate-200 group-hover:text-blue-600 transition-colors">
                    <card.icon size={24} />
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between">
                <span className="text-[10px] text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded-full uppercase tracking-tighter">+2 este mes</span>
                <span className="text-[10px] text-slate-400 font-medium">Sincronizado</span>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <h3 className="text-sm font-bold text-slate-700">Resumen de Capacidad TI</h3>
          <button className="text-[10px] font-bold text-blue-600 uppercase hover:underline">Configurar</button>
        </div>
        <div className="p-8 flex flex-col md:flex-row items-center gap-12">
          <div className="flex-1 space-y-4">
            <h2 className="text-2xl font-bold font-display text-slate-800 leading-tight">Infraestructura Bajo Control</h2>
            <p className="text-slate-500 text-sm leading-relaxed max-w-md">
              ITSM-INNOVASAL te permite gestionar incidentes, activos y cambios desde una única interfaz optimizada para alta disponibilidad.
            </p>
            <div className="flex gap-4 pt-4">
              <button className="btn-primary px-8">
                Generar Reporte
              </button>
              <button className="px-6 py-2 text-slate-600 text-sm font-bold hover:bg-slate-50 rounded-md transition-colors">
                Ver Métricas
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 w-full md:w-auto">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-center">
              <p className="text-2xl font-bold text-slate-800">98%</p>
              <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">Uptime</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-center">
              <p className="text-2xl font-bold text-slate-800">4.2h</p>
              <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">SLA Promedio</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
