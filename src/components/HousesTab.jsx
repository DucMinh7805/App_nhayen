import React, { useState } from 'react';
import { Plus, MapPin, Database, RefreshCw, Trash2, Building2, Layers } from 'lucide-react';
import { DEFAULT_HOUSES } from '../data/constants';

export default function HousesTab({ houses, session, onSaveHouses, onResetData, onRequestDelete }) {
  const isAdmin = session?.role === 'admin';
  const [newHouseName, setNewHouseName] = useState('');
  const [newHouseAddress, setNewHouseAddress] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleAddHouse = (e) => {
    e.preventDefault();
    if (!newHouseName.trim()) {
      alert('Vui lòng nhập tên nhà yến!');
      return;
    }

    const newHouse = {
      id: 'h_' + Date.now(),
      name: newHouseName.trim(),
      address: newHouseAddress.trim() || 'Chưa cập nhật',
      color: 'emerald',
    };

    onSaveHouses([...houses, newHouse]);
    setNewHouseName('');
    setNewHouseAddress('');
    setIsAdding(false);
  };

  const handleBackupJson = () => {
    const backupData = {
      timestamp: new Date().toISOString(),
      houses: localStorage.getItem('nhayen_cached_houses') || localStorage.getItem('nhayen_houses'),
      harvests: localStorage.getItem('nhayen_cached_harvests') || localStorage.getItem('nhayen_harvests'),
      sales: localStorage.getItem('nhayen_cached_sales') || localStorage.getItem('nhayen_sales'),
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_nhayen_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      {/* ─── DANH MỤC CƠ SỞ ────────────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl p-5 lg:p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-700" /> Danh mục cơ sở nhà yến ({houses.length})
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Các địa điểm nuôi chim, thu hoạch và kho bảo quản</p>
          </div>
          {isAdmin && (
            <button
              onClick={() => setIsAdding(!isAdding)}
              className="self-start sm:self-auto px-3.5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm shadow-emerald-700/20 cursor-pointer active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" /> {isAdding ? 'Đóng form' : 'Thêm cơ sở mới'}
            </button>
          )}
        </div>

        {isAdding && (
          <form onSubmit={handleAddHouse} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 animate-in fade-in duration-150">
            <span className="text-xs font-bold text-slate-800 block">Thêm cơ sở nhà yến mới:</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                value={newHouseName}
                onChange={(e) => setNewHouseName(e.target.value)}
                placeholder="Tên cơ sở (VD: Nhà 4 - Kiên Giang)"
                required
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold outline-none"
              />
              <input
                type="text"
                value={newHouseAddress}
                onChange={(e) => setNewHouseAddress(e.target.value)}
                placeholder="Địa chỉ (VD: Rạch Giá, Kiên Giang)"
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none"
              />
            </div>
            <button
              type="submit"
              className="py-2.5 px-5 bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
            >
              Lưu cơ sở mới
            </button>
          </form>
        )}

        {/* Grid Danh Sách Các Nhà (1 col mobile, 2-3 col desktop) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {houses.map((house, idx) => (
            <div
              key={house.id}
              className="p-4 bg-slate-50/80 hover:bg-slate-100/70 rounded-2xl border border-slate-200/70 flex items-center justify-between transition"
            >
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center justify-center shrink-0">
                  {idx + 1}
                </span>
                <div>
                  <h4 className="font-bold text-xs text-slate-800">{house.name}</h4>
                  <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 text-slate-400" /> {house.address || 'Kho chi nhánh'}
                  </p>
                </div>
              </div>

              {isAdmin && houses.length > 1 && (
                <button
                  onClick={() => {
                    if (onRequestDelete) {
                      onRequestDelete('house', house);
                    } else {
                      onSaveHouses(houses.filter((h) => h.id !== house.id));
                    }
                  }}
                  className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ─── DỮ LIỆU & SAO LƯU ────────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl p-5 lg:p-6 border border-slate-200/80 shadow-xs space-y-3">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <Database className="w-4 h-4 text-slate-500" /> Đồng bộ & Sao lưu an toàn
        </h3>
        <p className="text-xs text-slate-500 leading-relaxed max-w-2xl">
          Toàn bộ dữ liệu phiếu thu hoạch, đơn bán hàng và tồn kho được lưu trữ và tự động đồng bộ trên <strong>Google Sheet Cloud</strong>. Bạn cũng có thể xuất thêm một file JSON dự phòng về máy tính.
        </p>

        <div className="flex flex-wrap gap-2.5 pt-1">
          <button
            onClick={handleBackupJson}
            className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition cursor-pointer"
          >
            Tải bản sao lưu JSON về máy
          </button>

          {isAdmin && (
            <button
              onClick={onResetData}
              className="py-2.5 px-4 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs rounded-xl border border-rose-200 transition cursor-pointer flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Khôi phục dữ liệu mẫu
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
