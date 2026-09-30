import React, { useState } from 'react';
import { Download, Building2, ChevronDown, LogOut, RefreshCw, CheckCircle2 } from 'lucide-react';
import { exportToExcel, checkPermission } from '../services/storage';

export default function Header({
  activeHouse,
  setActiveHouse,
  houses,
  session,
  onLogout,
  onRefresh,
  isRefreshing,
  harvests,
  sales,
  inventoryData,
}) {
  const canExport = checkPermission(session, 'export');

  const handleExport = () => {
    exportToExcel(harvests, sales, inventoryData);
  };

  const roleLabel = {
    admin: { text: 'Chủ nhà', style: 'bg-amber-50 text-amber-900 border-amber-300' },
    manager: { text: 'Quản lý', style: 'bg-blue-50 text-blue-900 border-blue-300' },
    staff: { text: 'Nhân viên', style: 'bg-slate-100 text-slate-700 border-slate-200' },
  };
  const roleBadge = roleLabel[session?.role] || roleLabel.staff;

  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-30 shadow-xs">
      <div className="px-4 py-2.5 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-bold text-sm shadow-xs">
            Y
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm text-slate-900 tracking-tight">Yến Sào Manager</span>
              <span className="text-[9px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.2 rounded-md border border-emerald-200/80">
                PRO
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="truncate max-w-[110px]">{session?.name}</span>
              <span className={`text-[9px] px-1 py-0.1 rounded border font-bold ${roleBadge.style}`}>
                {roleBadge.text}
              </span>
            </div>
          </div>
        </div>

        {/* Top Actions */}
        <div className="flex items-center gap-1">
          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            title="Đồng bộ lại Google Sheet"
            className="p-2 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl transition border border-slate-200/70 active:scale-95 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-600' : ''}`} />
          </button>

          {/* Export Excel */}
          {canExport && (
            <button
              onClick={handleExport}
              title="Xuất file Excel báo cáo"
              className="p-2 text-slate-600 hover:text-emerald-700 hover:bg-slate-100 rounded-xl transition border border-slate-200/70 active:scale-95 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Logout */}
          <button
            onClick={onLogout}
            title="Đăng xuất"
            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition border border-slate-200/70 active:scale-95 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* House Selector Bar */}
      {houses && houses.length > 0 && (
        <div className="px-4 pb-2.5 pt-0.5">
          <div className="relative">
            <div className="flex items-center justify-between bg-slate-50 hover:bg-slate-100/90 border border-slate-200/80 rounded-xl px-3 py-1.5 transition">
              <div className="flex items-center gap-2 min-w-0">
                <Building2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider shrink-0">Cơ sở:</span>
                <span className="text-xs font-bold text-slate-800 truncate">{activeHouse?.name || 'Tất cả cơ sở'}</span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            </div>
            <select
              value={activeHouse?.id || ''}
              onChange={(e) => {
                const h = houses.find((item) => item.id === e.target.value);
                if (h) setActiveHouse(h);
              }}
              className="absolute inset-0 opacity-0 cursor-pointer w-full"
            >
              {houses.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name} {h.address ? `(${h.address})` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
    </header>
  );
}
