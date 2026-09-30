import React from 'react';
import { AlertTriangle, Trash2, Check, X } from 'lucide-react';

export default function ConfirmModal({
  isOpen,
  title = 'Xác nhận hành động',
  message,
  confirmLabel = 'Xác nhận',
  cancelLabel = 'Hủy',
  variant = 'danger', // 'danger' | 'primary' | 'warning'
  onConfirm,
  onCancel,
  loading = false,
}) {
  if (!isOpen) return null;

  const config = {
    danger: {
      btn: 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20',
      icon: <Trash2 className="w-5 h-5 text-rose-600" />,
      iconBg: 'bg-rose-100',
    },
    warning: {
      btn: 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/20',
      icon: <AlertTriangle className="w-5 h-5 text-amber-600" />,
      iconBg: 'bg-amber-100',
    },
    primary: {
      btn: 'bg-emerald-700 hover:bg-emerald-800 text-white shadow-emerald-700/20',
      icon: <Check className="w-5 h-5 text-emerald-600" />,
      iconBg: 'bg-emerald-100',
    },
  }[variant] || {
    btn: 'bg-slate-800 hover:bg-slate-900 text-white',
    icon: <AlertTriangle className="w-5 h-5 text-slate-600" />,
    iconBg: 'bg-slate-100',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-slate-200/80 p-5 space-y-4 animate-in zoom-in-95 duration-150">
        <div className="flex items-start gap-3.5">
          <div className={`w-10 h-10 rounded-2xl ${config.iconBg} flex items-center justify-center shrink-0`}>
            {config.icon}
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">{title}</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">{message}</p>
          </div>
        </div>

        <div className="flex gap-2.5 pt-2">
          <button
            type="button"
            disabled={loading}
            onClick={onCancel}
            className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition cursor-pointer"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className={`flex-1 py-2.5 font-bold text-xs rounded-xl shadow-md transition cursor-pointer flex items-center justify-center gap-1.5 ${config.btn}`}
          >
            {loading ? (
              <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : null}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
