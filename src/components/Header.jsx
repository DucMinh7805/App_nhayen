import React from 'react';
import { Download, ShieldCheck, User, Building2, ChevronDown, LogOut } from 'lucide-react';
import { exportToExcel, checkPermission } from '../services/storage';
import { logout } from '../services/auth';

export default function Header({
  activeHouse,
  setActiveHouse,
  houses,
  session,
  onLogout,
  harvests,
  sales,
  inventoryData,
}) {
  const isAdmin = session?.role === 'admin';
  const isManager = session?.role === 'manager';
  const canExport = checkPermission(session, 'export');

  const handleExport = () => {
    exportToExcel(harvests, sales, inventoryData);
  };

  const handleLogout = () => {
    if (confirm('Bạn có chắc muốn đăng xuất?')) {
      logout();
      onLogout();
    }
  };

  const roleLabel = {
    admin: { text: 'Admin', style: 'bg-amber-50 text-amber-900 border-amber-300' },
    manager: { text: 'Quản lý', style: 'bg-blue-50 text-blue-900 border-blue-300' },
    staff: { text: 'Nhân viên', style: 'bg-slate-50 text-slate-700 border-slate-200' },
  };
  const roleBadge = roleLabel[session?.role] || roleLabel.staff;

  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-30">
      <div className="px-4 py-3 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-bold text-sm shadow-xs">
            Y
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm text-slate-900 tracking-tight">Yến Sào Manager</span>
              <span className="text-[10px] font-medium text-emerald-800 bg-emerald-50 px-1.5 py-0.2 rounded-md border border-emerald-200/60">
                PRO
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              {session?.name}
              <span className={`text-[9px] px-1 py-0.2 rounded border font-bold ${roleBadge.style}`}>
                {roleBadge.text}
              </span>
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1.5">
          {canExport && (
            <button
              onClick={handleExport}
              title="Xuất file Excel"
              className="p-2 text-slate-600 hover:text-emerald-700 hover:bg-slate-100 rounded-xl transition border border-slate-200/70 active:scale-95"
            >
              <Download className="w-4 h-4 stroke-[1.75]" />
            </button>
          )}

          <button
            onClick={handleLogout}
            title="Đăng xuất"
            className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition border border-slate-200/70 active:scale-95"
          >
            <LogOut className="w-4 h-4 stroke-[1.75]" />
          </button>
        </div>
      </div>

      {/* House selector */}
      <div className="px-4 pb-2.5 pt-0.5">
        <div className="relative">
          <div className="flex items-center justify-between bg-slate-50 hover:bg-slate-100/80 border border-slate-200/80 rounded-xl px-3 py-1.5 transition">
            <div className="flex items-center gap-2">
              <Building2 className="w-3.5 h-3.5 text-emerald-700" />
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Cơ sở:</span>
              <span className="text-xs font-bold text-slate-800">{activeHouse.name}</span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <select
            value={activeHouse.id}
            onChange={(e) => {
              const h = houses.find((item) => item.id === e.target.value);
              if (h) setActiveHouse(h);
            }}
            className="absolute inset-0 opacity-0 cursor-pointer w-full"
          >
            {houses.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </header>
  );
}
