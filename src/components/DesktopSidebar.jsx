import React from 'react';
import {
  PlusCircle,
  History,
  Warehouse,
  ShoppingBag,
  Building2,
  UserCog,
  RefreshCw,
  LogOut,
  Download,
  Building,
  ChevronDown,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import { exportToExcel, checkPermission } from '../services/storage';

export default function DesktopSidebar({
  activeTab,
  setActiveTab,
  session,
  houses,
  activeHouse,
  setActiveHouse,
  onLogout,
  onRefresh,
  isRefreshing,
  harvests,
  sales,
  inventoryData,
}) {
  const isAdmin = session?.role === 'admin';
  const canExport = checkPermission(session, 'export');

  const navItems = [
    { id: 'harvest', label: 'Thu hoạch tổ', icon: PlusCircle, badge: null },
    { id: 'sales', label: 'Bán hàng & Nợ', icon: ShoppingBag, badge: sales.filter((s) => s.status === 'debt').length || null, badgeColor: 'bg-amber-100 text-amber-800' },
    { id: 'inventory', label: 'Tồn kho & Chuyển', icon: Warehouse, badge: null },
    { id: 'history', label: 'Lịch sử & Báo cáo', icon: History, badge: null },
    { id: 'houses', label: 'Danh mục cơ sở', icon: Building2, badge: houses.length },
    { id: 'users', label: 'Phân quyền & TK', icon: UserCog, badge: null },
  ];

  const handleExport = () => {
    exportToExcel(harvests, sales, inventoryData);
  };

  return (
    <aside className="hidden md:flex flex-col w-64 lg:w-72 bg-white border-r border-slate-200/80 h-screen sticky top-0 shrink-0 select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-700 text-white flex items-center justify-center font-black text-lg shadow-sm">
            Y
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-extrabold text-slate-900 text-base tracking-tight">Yến Sào Manager</h1>
              <span className="text-[9px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.2 rounded-md border border-emerald-200/80">
                PRO
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">Hệ thống quản lý nhà yến</p>
          </div>
        </div>

        {/* Live Cloud Status */}
        <div className="mt-3.5 flex items-center justify-between bg-slate-50 border border-slate-200/70 rounded-xl px-3 py-1.5">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[11px] font-semibold text-slate-600">Google Sheet Live</span>
          </div>
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            title="Đồng bộ lại Google Sheet"
            className="p-1 hover:text-emerald-700 rounded-lg transition text-slate-400 hover:bg-slate-200/60 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* House Selector */}
      {houses && houses.length > 0 && (
        <div className="px-4 py-3 border-b border-slate-100">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
            Cơ sở đang thao tác:
          </label>
          <div className="relative">
            <div className="flex items-center justify-between bg-slate-50 hover:bg-slate-100/90 border border-slate-200 rounded-xl px-3 py-2 transition cursor-pointer">
              <div className="flex items-center gap-2 min-w-0">
                <Building className="w-4 h-4 text-emerald-700 shrink-0" />
                <span className="text-xs font-bold text-slate-800 truncate">{activeHouse?.name || 'Chọn nhà yến'}</span>
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

      {/* Navigation Menu */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1">
          Chức năng chính
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition cursor-pointer ${
                isActive
                  ? 'bg-emerald-700 text-white shadow-sm shadow-emerald-700/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white stroke-[2.2]' : 'text-slate-400 stroke-[1.8]'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge !== null && item.badge > 0 && (
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                    isActive ? 'bg-white/20 text-white' : item.badgeColor || 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Quick Export Excel Banner */}
      {canExport && (
        <div className="px-4 py-2">
          <button
            onClick={handleExport}
            className="w-full flex items-center justify-center gap-2 py-2 bg-emerald-50 hover:bg-emerald-100/80 text-emerald-800 border border-emerald-200/80 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" /> Xuất Báo Cáo Excel
          </button>
        </div>
      )}

      {/* User Profile & Logout */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
              isAdmin ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-700'
            }`}>
              {isAdmin ? <ShieldCheck className="w-4 h-4 text-amber-700" /> : <UserCheck className="w-4 h-4 text-slate-700" />}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-slate-800 truncate">{session?.name}</div>
              <div className="text-[10px] text-slate-400 font-medium">
                {isAdmin ? 'Quản trị viên (Admin)' : 'Nhân viên'}
              </div>
            </div>
          </div>

          <button
            onClick={onLogout}
            title="Đăng xuất"
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
