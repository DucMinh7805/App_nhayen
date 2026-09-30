import React from 'react';
import { CloudCheck, CloudOff, RefreshCw } from 'lucide-react';

const TITLES = {
  dashboard: 'Tổng quan',
  harvest: 'Thu hoạch',
  sales: 'Bán hàng',
  inventory: 'Kho tại nhà',
  history: 'Lịch sử',
  houses: 'Nhà yến',
  settings: 'Danh mục & tên gọi',
  users: 'Tài khoản',
};

export default function Header({ activeTab, appName, session, onRefresh, isRefreshing, syncStatus = 'loading', lastSyncedAt, settings = {} }) {
  const title = settings[`${activeTab}Label`] || TITLES[activeTab] || 'Tổng quan';
  const syncTime = lastSyncedAt?.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  const statusText = isRefreshing
    ? 'Đang đồng bộ'
    : syncStatus === 'offline'
      ? 'Chưa đồng bộ'
      : syncStatus === 'ready'
        ? `Đã đồng bộ lúc ${syncTime}`
        : 'Đang tải dữ liệu';
  const StatusIcon = syncStatus === 'offline' ? CloudOff : CloudCheck;

  return (
    <header className="relative z-30 shrink-0 border-b border-[#e0eae2] bg-[#f5f8f6]/94 backdrop-blur-xl md:mb-6 md:border-b-0 md:bg-transparent md:backdrop-blur-none">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 md:px-0 md:py-1">
        <div className="min-w-0">
          <div className="flex items-center gap-2 md:hidden">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] bg-[#075e4b] font-['Be_Vietnam_Pro'] text-[13px] font-extrabold tracking-tight text-white">MT</span>
            <div className="min-w-0">
              <div className="truncate font-['Be_Vietnam_Pro'] text-[13px] font-bold leading-tight text-[#18312d]">{appName}</div>
              <div className="truncate text-xs text-[#60736d]">{title} · {statusText}</div>
            </div>
          </div>
          <div className="hidden md:block">
            <p className="eyebrow mb-1">Không gian làm việc của {session?.name || 'gia đình'}</p>
            <h1 className="text-[1.85rem] font-extrabold leading-tight text-[#18312d]">{title}</h1>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <div className={`hidden items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold sm:flex ${syncStatus === 'offline' ? 'bg-amber-50 text-amber-800' : 'bg-[#e6f3ea] text-[#256349]'}`} role="status" aria-live="polite">
            <StatusIcon aria-hidden="true" className="h-4 w-4" />
            {statusText}
          </div>
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            aria-label={isRefreshing ? 'Đang đồng bộ dữ liệu' : 'Đồng bộ dữ liệu mới nhất'}
            title="Tải dữ liệu từ Google Sheet ngay (web cũng tự cập nhật mỗi 30 giây)"
            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#d8e6dc] bg-white text-[#075e4b] transition-colors hover:bg-[#e9f5ef] disabled:opacity-50"
          >
            <RefreshCw aria-hidden="true" className={`h-[18px] w-[18px] ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>
    </header>
  );
}
