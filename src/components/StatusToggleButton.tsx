import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ToggleLeft, ToggleRight, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';

interface StatusToggleButtonProps {
  isActive: boolean;
  onConfirm: () => Promise<void>;
  isUpdating: boolean;
  disabled?: boolean;
  label?: string;
  confirmMessage?: string;
  size?: 'default' | 'sm';
}

export function StatusToggleButton({
  isActive,
  onConfirm,
  isUpdating,
  disabled = false,
  label,
  confirmMessage,
  size = 'default'
}: StatusToggleButtonProps) {
  const [showConfirm, setShowConfirm] = useState(false);

  const handleAction = async () => {
    await onConfirm();
    setShowConfirm(false);
  };

  const isSmall = size === 'sm';

  return (
    <div className="relative">
      <button
        onClick={() => setShowConfirm(!showConfirm)}
        disabled={disabled || isUpdating}
        className={cn(
          "flex items-center gap-2 rounded-lg font-bold text-[10px] uppercase tracking-wider transition-all border shrink-0",
          isSmall ? "px-2 py-1" : "px-3 py-1.5",
          isActive 
            ? "bg-amber-50 text-amber-600 border-amber-100 hover:bg-amber-100" 
            : "bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        {isUpdating ? (
          <Loader2 className="animate-spin" size={isSmall ? 12 : 14} />
        ) : isActive ? (
          <>
            {label && <span className="hidden xs:inline">{label}</span>}
            <ToggleRight size={isSmall ? 14 : 16} />
          </>
        ) : (
          <>
            {label && <span className="hidden xs:inline">{label}</span>}
            <ToggleLeft size={isSmall ? 14 : 16} />
          </>
        )}
      </button>

      <AnimatePresence>
        {showConfirm && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            className="absolute right-0 bottom-full mb-3 z-50 bg-white shadow-2xl rounded-2xl p-4 border border-slate-100 min-w-[240px]"
          >
            <div className="flex items-center gap-2 mb-3 text-slate-700">
              <AlertCircle size={16} className={isActive ? "text-amber-500" : "text-emerald-500"} />
              <p className="text-xs font-bold leading-tight">
                {confirmMessage || `¿Confirmar ${isActive ? 'desactivación' : 'activación'}?`}
              </p>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={handleAction}
                className={cn(
                  "flex-1 py-2 text-white rounded-lg text-[10px] font-bold uppercase transition-transform active:scale-95 shadow-sm",
                  isActive ? "bg-amber-600 shadow-amber-200" : "bg-emerald-600 shadow-emerald-200"
                )}
              >
                Sí, Proceder
              </button>
              <button 
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-2 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-bold uppercase transition-transform active:scale-95 border border-slate-200"
              >
                Cancelar
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
