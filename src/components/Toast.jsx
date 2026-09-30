import React from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

export default function Toast({ toast, onClose }) {
  if (!toast) return null;

  const { type = 'success', message, title } = toast;

  const config = {
    success: {
      bg: 'bg-emerald-900/95 border-emerald-700/80 text-emerald-100',
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />,
      defaultTitle: 'Thành công',
    },
    error: {
      bg: 'bg-rose-900/95 border-rose-700/80 text-rose-100',
      icon: <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />,
      defaultTitle: 'Lỗi',
    },
    warning: {
      bg: 'bg-amber-900/95 border-amber-700/80 text-amber-100',
      icon: <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />,
      defaultTitle: 'Cảnh báo',
    },
    info: {
      bg: 'bg-slate-900/95 border-slate-700/80 text-slate-100',
      icon: <Info className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />,
      defaultTitle: 'Thông tin',
    },
  }[type] || {
    bg: 'bg-slate-900/95 border-slate-700/80 text-slate-100',
    icon: <Info className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />,
    defaultTitle: 'Thông báo',
  };

  return (
    <div className="fixed bottom-20 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-sm z-50 animate-in fade-in slide-in-from-bottom-4 duration-200">
      <div className={`flex items-start gap-3 p-3.5 rounded-2xl border shadow-xl backdrop-blur-md ${config.bg}`}>
        {config.icon}
        <div className="flex-1 min-w-0 pr-1">
          {title && <h4 className="text-xs font-bold tracking-tight text-white mb-0.5">{title || config.defaultTitle}</h4>}
          <p className="text-xs font-medium leading-relaxed opacity-95">{message}</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
