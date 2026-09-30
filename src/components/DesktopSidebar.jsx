import React, { useState } from 'react';
import { BarChart3, Bird, ShoppingBag, Package, History, Building2, SlidersHorizontal, UserRound, LogOut, ChevronDown } from 'lucide-react';

const DAILY = [
  { id: 'dashboard', label: 'Tổng quan', icon: BarChart3 },
  { id: 'harvest', label: 'Thu hoạch', icon: Bird },
  { id: 'sales', label: 'Bán hàng', icon: ShoppingBag },
  { id: 'history', label: 'Lịch sử', icon: History },
];
const MORE = [
  { id: 'inventory', label: 'Kho tại nhà', icon: Package },
  { id: 'houses', label: 'Nhà yến', icon: Building2, admin: true },
  { id: 'settings', label: 'Danh mục & tên gọi', icon: SlidersHorizontal, admin: true },
  { id: 'users', label: 'Tài khoản', icon: UserRound },
];

export default function DesktopSidebar({ activeTab, setActiveTab, session, onLogout, appName, settings = {}, sales = [] }) {
  const [moreOpen, setMoreOpen] = useState(() => MORE.some((item) => item.id === activeTab));
  const debtCount = session?.role === 'admin' ? sales.filter((sale) => sale.status === 'debt').length : 0;

  const navItem = (item) => {
    const Icon = item.icon;
    const selected = activeTab === item.id;
    return (
      <button
        key={item.id}
        type="button"
        onClick={() => setActiveTab(item.id)}
        aria-current={selected ? 'page' : undefined}
        className={`my-[2px] flex min-h-11 w-full items-center gap-3 rounded-2xl px-4 text-left text-sm font-semibold transition-colors ${selected ? 'bg-[#e6f3eb] text-[#075e4b]' : 'text-[#52665d] hover:bg-[#f4f8f5] hover:text-[#18312d]'}`}
      >
        <Icon aria-hidden="true" className="h-[19px] w-[19px] shrink-0" strokeWidth={1.9} />
        <span className="flex-1">{settings[`${item.id}Label`] || item.label}</span>
        {item.id === 'sales' && debtCount > 0 && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-900">{debtCount}</span>}
      </button>
    );
  };

  return (
    <aside className="sticky top-0 hidden h-screen w-[268px] shrink-0 flex-col border-r border-[#e1ebe3] bg-white/95 px-3 py-5 lg:flex">
      <div className="mb-8 flex items-center gap-3 px-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[17px] bg-[#075e4b] font-['Be_Vietnam_Pro'] text-lg font-extrabold tracking-tight text-white">MT</div>
        <div className="min-w-0">
          <div className="brand-type text-[14px] font-extrabold leading-snug text-[#18312d]">{appName}</div>
          <div className="text-[11px] font-medium text-[#72837b]">Sổ yến gia đình</div>
        </div>
      </div>
      <nav aria-label="Điều hướng chính" className="flex-1 overflow-y-auto">
        <p className="eyebrow mb-2 px-4 text-[11px]">Hằng ngày</p>
        {DAILY.map(navItem)}
        <button
          type="button"
          onClick={() => setMoreOpen((open) => !open)}
          aria-expanded={moreOpen}
          aria-controls="sidebar-more"
          className="mt-5 flex min-h-11 w-full items-center justify-between rounded-2xl px-4 text-left text-sm font-semibold text-[#52665d] hover:bg-[#f4f8f5]"
        >
          <span>Thêm chức năng</span>
          <ChevronDown aria-hidden="true" className={`h-4 w-4 transition-transform ${moreOpen ? 'rotate-180' : ''}`} />
        </button>
        {moreOpen && <div id="sidebar-more" className="mt-1 border-l border-[#dce8e1] pl-2">{MORE.filter((item) => !item.admin || session?.role === 'admin').map(navItem)}</div>}
      </nav>
      <div className="mt-4 rounded-[20px] bg-[#f4f8f5] p-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#dbece1] font-bold text-[#075e4b]">{session?.name?.charAt(0)?.toUpperCase() || 'M'}</div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-bold text-[#18312d]">{session?.name}</div>
            <div className="text-xs text-[#72837b]">{session?.role === 'admin' ? 'Chủ nhà' : 'Nhân viên'}</div>
          </div>
          <button type="button" onClick={onLogout} aria-label="Đăng xuất" title="Đăng xuất" className="flex h-10 w-10 items-center justify-center rounded-xl text-[#60736d] hover:bg-white hover:text-[#b44545]"><LogOut aria-hidden="true" className="h-[18px] w-[18px]" /></button>
        </div>
      </div>
    </aside>
  );
}
