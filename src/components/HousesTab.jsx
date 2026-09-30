import React, { useState } from 'react';
import { Plus, MapPin, Database, RefreshCw, Trash2, Building2 } from 'lucide-react';
import { DEFAULT_HOUSES, INITIAL_HARVESTS, INITIAL_SALES } from '../data/constants';

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
    <div className="space-y-3.5 max-w-md mx-auto">
      {/* Danh mục cơ sở nhà yến */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-emerald-700" /> Danh mục cơ sở ({houses.length})
            </h3>
            <p className="text-[11px] text-slate-400">Các điểm thu hoạch & kho lưu trữ</p>
          </div>
          {isAdmin && (
            <button
              onClick={() => setIsAdding(!isAdding)}
              className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-semibold transition flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> {isAdding ? 'Đóng' : 'Thêm mới'}
            </button>
          )}
        </div>

        {isAdding && (
          <form onSubmit={handleAddHouse} className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 space-y-2 animate-in fade-in duration-150">
            <span className="text-[11px] font-bold text-slate-700 block">Thông tin cơ sở mới:</span>
            <input
              type="text"
              value={newHouseName}
              onChange={(e) => setNewHouseName(e.target.value)}
              placeholder="Tên nhà (VD: Nhà 4 - Kiên Giang)"
              required
              className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold outline-none"
            />
            <input
              type="text"
              value={newHouseAddress}
              onChange={(e) => setNewHouseAddress(e.target.value)}
              placeholder="Địa chỉ (VD: Rạch Giá, Kiên Giang)"
              className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs outline-none"
            />
            <button
              type="submit"
              className="w-full py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
            >
              Lưu cơ sở
            </button>
          </form>
        )}

        {/* Danh sách các nhà */}
        <div className="space-y-1.5">
          {houses.map((house, idx) => (
            <div
              key={house.id}
              className="p-3 bg-slate-50/70 rounded-xl border border-slate-200/60 flex items-center justify-between"
            >
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 text-[11px] font-bold flex items-center justify-center shrink-0">
                  {idx + 1}
                </span>
                <div>
                  <h4 className="font-bold text-xs text-slate-800">{house.name}</h4>
                  <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.2">
                    <MapPin className="w-3 h-3" /> {house.address || 'Kho chi nhánh'}
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
                  className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Sao lưu dữ liệu */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-2.5">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
          <Database className="w-3.5 h-3.5 text-slate-500" /> Dữ liệu & Sao lưu
        </h3>
        <p className="text-xs text-slate-500 leading-relaxed">
          Dữ liệu của bạn được tự động đồng bộ hóa trên <strong>Google Sheet</strong>. Bạn có thể tải thêm 1 bản dự phòng JSON về máy tính.
        </p>

        <div className="flex gap-2 pt-1">
          <button
            onClick={handleBackupJson}
            className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition cursor-pointer"
          >
            Tải bản sao lưu JSON
          </button>

          {isAdmin && (
            <button
              onClick={onResetData}
              className="py-2.5 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs rounded-xl border border-rose-200 transition cursor-pointer flex items-center gap-1"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Khôi phục gốc
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
