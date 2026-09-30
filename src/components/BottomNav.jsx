import React from 'react';
import { PlusCircle, History, Warehouse, ShoppingBag, Settings2, UserCog } from 'lucide-react';

export default function BottomNav({ activeTab, setActiveTab, session }) {
  const tabs = [
    { id: 'harvest', label: 'Thu hoạch', icon: PlusCircle },
    { id: 'history', label: 'Lịch sử', icon: History },
    { id: 'inventory', label: 'Tồn kho', icon: Warehouse },
    { id: 'sales', label: 'Bán hàng', icon: ShoppingBag },
    { id: 'houses', label: 'Cơ sở', icon: Settings2 },
    { id: 'users', label: 'Tài khoản', icon: UserCog },
  ];

  return (
    <nav className="bg-white/95 backdrop-blur-md border-t border-slate-200/80 px-1.5 py-1.5 flex justify-around items-center sticky bottom-0 z-30 shadow-xs">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl transition-all cursor-pointer ${
              isActive
                ? 'text-emerald-800 font-bold'
                : 'text-slate-400 hover:text-slate-600 font-medium'
            }`}
          >
            <div className={`p-1 rounded-lg transition ${isActive ? 'bg-emerald-50 text-emerald-800' : ''}`}>
              <Icon className="w-4 h-4 stroke-[1.8]" />
            </div>
            <span className="text-[9px] tracking-tight leading-none">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
