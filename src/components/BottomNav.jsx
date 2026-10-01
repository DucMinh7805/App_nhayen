import React, { useState } from 'react';
import { BarChart3, Bird, ShoppingBag, History, Menu, Package, Building2, SlidersHorizontal, UserRound, LogOut, X } from 'lucide-react';

const PRIMARY = [
  { id: 'dashboard', label: 'Trang chủ', icon: BarChart3 },
  { id: 'harvest', label: 'Thu hoạch', icon: Bird },
  { id: 'sales', label: 'Bán hàng', icon: ShoppingBag },
];
const MORE = [
  { id: 'history', label: 'Lịch sử', icon: History },
  { id: 'inventory', label: 'Kho tại nhà', icon: Package },
  { id: 'houses', label: 'Nhà yến', icon: Building2, admin: true },
  { id: 'settings', label: 'Danh mục & tên gọi', icon: SlidersHorizontal, admin: true },
  { id: 'users', label: 'Tài khoản', icon: UserRound },
];

export default function BottomNav({ activeTab, setActiveTab, session, onLogout, settings = {} }) {
  const [moreOpen, setMoreOpen] = useState(false);
  const moreActive = MORE.some((item) => item.id === activeTab);
  const go = (id) => {
    setActiveTab(id);
    setMoreOpen(false);
  };

  return (
    <>
      {moreOpen && (
        <div className="fixed inset-0 z-[60] bg-[#0e3028]/35" onClick={() => setMoreOpen(false)}>
          <section
            aria-label="Thêm chức năng"
            className="absolute inset-x-0 bottom-0 rounded-t-[28px] bg-white p-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl page-enter"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between px-1">
              <h2 className="text-lg font-extrabold">Thêm chức năng</h2>
              <button type="button" onClick={() => setMoreOpen(false)} aria-label="Đóng menu" className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#f4f8f5]"><X aria-hidden="true" className="h-5 w-5" /></button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {MORE.filter((item) => !item.admin || session?.role === 'admin').map((item) => {
                const Icon = item.icon;
                return (
                  <button key={item.id} type="button" onClick={() => go(item.id)} className="flex min-h-[68px] items-center gap-3 rounded-2xl border border-[#deebe2] bg-[#f8fbf9] px-3 text-left text-sm font-semibold text-[#18312d]">
                    <Icon aria-hidden="true" className="h-5 w-5 shrink-0 text-[#075e4b]" />
                    {settings[`${item.id}Label`] || item.label}
                  </button>
                );
              })}
            </div>
            <button type="button" onClick={onLogout} className="mt-3 flex min-h-12 w-full items-center gap-3 rounded-2xl px-3 text-sm font-semibold text-[#b44545]"><LogOut aria-hidden="true" className="h-5 w-5" /> Đăng xuất</button>
          </section>
        </div>
      )}
      <nav aria-label="Điều hướng chính" className="mobile-bottom-nav border-t border-[#e1ebe3] bg-white/95 px-1 pt-2 shadow-[0_-8px_26px_rgba(23,64,45,.07)] backdrop-blur-xl lg:hidden">
        <div className="mx-auto grid max-w-xl grid-cols-4 items-center">
          {PRIMARY.map((item) => {
            const Icon = item.icon;
            const selected = activeTab === item.id;
            return (
              <button key={item.id} type="button" onClick={() => go(item.id)} aria-current={selected ? 'page' : undefined} className={`flex min-h-[55px] min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 text-[11px] font-semibold transition-colors ${selected ? 'text-[#075e4b]' : 'text-[#71847a]'}`}>
                <span className={`flex h-7 w-10 items-center justify-center rounded-xl ${selected ? 'bg-[#e6f3eb]' : ''}`}><Icon aria-hidden="true" className="h-[19px] w-[19px]" strokeWidth={1.9} /></span>
                <span className="max-w-full text-center leading-4 [overflow-wrap:anywhere]">{settings[`${item.id}Label`] || item.label}</span>
              </button>
            );
          })}
          <button type="button" onClick={() => setMoreOpen(true)} aria-expanded={moreOpen} className={`flex min-h-[55px] min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 text-[11px] font-semibold ${moreActive ? 'text-[#075e4b]' : 'text-[#71847a]'}`}>
            <span className={`flex h-7 w-10 items-center justify-center rounded-xl ${moreActive ? 'bg-[#e6f3eb]' : ''}`}><Menu aria-hidden="true" className="h-[19px] w-[19px]" /></span>
            <span>Thêm</span>
          </button>
        </div>
      </nav>
    </>
  );
}
