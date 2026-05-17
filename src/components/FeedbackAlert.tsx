import React from 'react';
import { motion } from 'motion/react';
import { AlertCircle, CheckCircle2, Info, XCircle, X } from 'lucide-react';

export type AlertType = 'success' | 'error' | 'info' | 'warning';

interface FeedbackAlertProps {
  type: AlertType;
  message: string;
  onClose?: () => void;
  className?: string;
}

export function FeedbackAlert({ type, message, onClose, className = '' }: FeedbackAlertProps) {
  const configs = {
    success: {
      bg: 'bg-emerald-50',
      border: 'border-emerald-100',
      text: 'text-emerald-700',
      icon: <CheckCircle2 size={18} className="text-emerald-500" />
    },
    error: {
      bg: 'bg-red-50',
      border: 'border-red-100',
      text: 'text-red-700',
      icon: <XCircle size={18} className="text-red-500" />
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-100',
      text: 'text-blue-700',
      icon: <Info size={18} className="text-blue-500" />
    },
    warning: {
      bg: 'bg-amber-50',
      border: 'border-amber-100',
      text: 'text-amber-700',
      icon: <AlertCircle size={18} className="text-amber-500" />
    }
  };

  const config = configs[type];

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`p-4 rounded-xl border flex items-center gap-3 shadow-sm ${config.bg} ${config.border} ${config.text} ${className}`}
    >
      <div className="shrink-0">{config.icon}</div>
      <div className="flex-1 text-sm font-medium">{message}</div>
      {onClose && (
        <button 
          onClick={onClose}
          type="button"
          className="shrink-0 p-1 hover:bg-black/5 rounded-lg transition-colors"
        >
          <X size={16} />
        </button>
      )}
    </motion.div>
  );
}
