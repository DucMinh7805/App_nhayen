import React, { useState, useMemo } from 'react';
import { Filter, Calendar, Search, Download, Trash2 } from 'lucide-react';
import { exportToExcel } from '../services/storage';
import { NEST_TYPES } from '../data/constants';

export default function HistoryTab({ houses, harvests, sales, inventoryData, onDeleteHarvest }) {
  const [selectedHouseId, setSelectedHouseId] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState('2026-09');
  const [selectedTypeId, setSelectedTypeId] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredHarvests = useMemo(() => {
    return harvests.filter((item) => {
      if (selectedHouseId !== 'all' && item.houseId !== selectedHouseId) return false;
      if (selectedMonth !== 'all' && !item.date.startsWith(selectedMonth)) return false;
      if (selectedTypeId !== 'all' && item.typeId !== selectedTypeId) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchNote = item.note && item.note.toLowerCase().includes(query);
        const matchStaff = item.staffName && item.staffName.toLowerCase().includes(query);
        const matchHouse = item.houseName && item.houseName.toLowerCase().includes(query);
        if (!matchNote && !matchStaff && !matchHouse) return false;
      }
      return true;
    });
  }, [harvests, selectedHouseId, selectedMonth, selectedTypeId, searchQuery]);

  const stats = useMemo(() => {
    const totalG = filteredHarvests.reduce((sum, i) => sum + Number(i.weight || 0), 0);
    const count = filteredHarvests.length;
    const avg = count > 0 ? Math.round(totalG / count) : 0;
    return {
      totalG,
      totalKg: (totalG / 1000).toFixed(2),
      count,
      avg,
    };
  }, [filteredHarvests]);

  return (
    <div className="space-y-3.5 max-w-md mx-auto">
      {/* Bộ lọc tinh gọn */}
      <div className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-xs space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-emerald-700" /> Bộ lọc dữ liệu
          </span>
          <button
            onClick={() => exportToExcel(filteredHarvests, sales, inventoryData)}
            className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200/60"
          >
            <Download className="w-3 h-3" /> Xuất Excel
          </button>
        </div>

        {/* Lọc nhà & Thời gian */}
        <div className="grid grid-cols-2 gap-2">
          <select
            value={selectedHouseId}
            onChange={(e) => setSelectedHouseId(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-700 outline-none"
          >
            <option value="all">Tất cả nhà yến</option>
            {houses.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name}
              </option>
            ))}
          </select>

          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-700 outline-none"
          >
            <option value="all">Cả năm 2026</option>
            <option value="2026-09">Tháng 09/2026</option>
            <option value="2026-08">Tháng 08/2026</option>
          </select>
        </div>

        {/* Lọc loại tổ & Tìm kiếm */}
        <div className="grid grid-cols-2 gap-2">
          <select
            value={selectedTypeId}
            onChange={(e) => setSelectedTypeId(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-medium text-slate-700 outline-none"
          >
            <option value="all">Tất cả loại tổ</option>
            {NEST_TYPES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>

          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-6 pr-2 py-1.5 text-xs outline-none"
            />
            <Search className="w-3 h-3 text-slate-400 absolute left-2 top-1/2 -translate-y-1/2" />
          </div>
        </div>
      </div>

      {/* KPI 3 Thẻ tối giản */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-white border border-slate-200/80 p-3 rounded-2xl shadow-xs">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tổng thu</div>
          <div className="text-base font-extrabold font-mono text-emerald-800 mt-0.5 tabular-nums">
            {stats.totalG.toLocaleString()}g
          </div>
          <div className="text-[10px] text-slate-500 font-mono font-medium">≈ {stats.totalKg} kg</div>
        </div>

        <div className="bg-white border border-slate-200/80 p-3 rounded-2xl shadow-xs">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Số lượt</div>
          <div className="text-base font-extrabold font-mono text-slate-800 mt-0.5 tabular-nums">
            {stats.count} <span className="text-xs font-normal text-slate-400">lần</span>
          </div>
          <div className="text-[10px] text-slate-500">Đợt thu hoạch</div>
        </div>

        <div className="bg-white border border-slate-200/80 p-3 rounded-2xl shadow-xs">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Bình quân</div>
          <div className="text-base font-extrabold font-mono text-slate-800 mt-0.5 tabular-nums">
            {stats.avg.toLocaleString()}g
          </div>
          <div className="text-[10px] text-slate-500">Mỗi đợt thu</div>
        </div>
      </div>

      {/* Danh sách các phiếu */}
      <div className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-xs space-y-2">
        <div className="flex justify-between items-center px-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Chi tiết phiếu thu ({filteredHarvests.length})
          </span>
        </div>

        {filteredHarvests.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs">Không tìm thấy bản ghi phù hợp.</div>
        ) : (
          <div className="space-y-1.5">
            {filteredHarvests.map((item) => (
              <div
                key={item.id}
                className="p-3 bg-slate-50/70 hover:bg-slate-100/70 rounded-xl border border-slate-200/60 transition flex items-center justify-between gap-2"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-bold text-xs text-slate-800">{item.houseName}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-200/80 text-slate-600 font-mono">
                      {item.date}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-800 font-medium">
                      {item.shift}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-500 flex items-center gap-1">
                    <span className="font-medium text-emerald-800">{item.typeName}</span>
                    {item.note && <span className="italic text-slate-400 truncate max-w-[160px]"> • "{item.note}"</span>}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="text-right">
                    <div className="text-sm font-extrabold font-mono text-emerald-700 tabular-nums">
                      +{item.weight.toLocaleString()}g
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {(item.weight / 1000).toFixed(2)} kg
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      if (confirm(`Xóa phiếu ngày ${item.date} (${item.weight}g)?`)) {
                        onDeleteHarvest(item.id);
                      }
                    }}
                    className="p-1 text-slate-300 hover:text-rose-600 rounded-lg transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
