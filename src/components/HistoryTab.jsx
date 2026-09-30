import React, { useState, useMemo } from 'react';
import { Filter, Calendar, Search, Download, Trash2, TrendingUp, Sparkles, Scale, ShoppingBag, ArrowUpRight } from 'lucide-react';
import { exportToExcel } from '../services/storage';
import { NEST_TYPES } from '../data/constants';

export default function HistoryTab({
  houses,
  harvests,
  sales,
  inventoryData,
  onDeleteHarvest,
  session,
  onRequestDelete,
}) {
  const [viewType, setViewType] = useState('harvests'); // 'harvests' | 'sales'
  const [selectedHouseId, setSelectedHouseId] = useState('all');
  const [selectedPeriod, setSelectedPeriod] = useState('this_month'); // 'all' | 'today' | '7days' | 'this_month'
  const [selectedTypeId, setSelectedTypeId] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const todayStr = new Date().toISOString().slice(0, 10);
  const currentMonthStr = todayStr.slice(0, 7);

  // Lọc lịch sử thu hoạch
  const filteredHarvests = useMemo(() => {
    return harvests.filter((item) => {
      if (selectedHouseId !== 'all' && item.houseId !== selectedHouseId) return false;
      if (selectedTypeId !== 'all' && item.typeId !== selectedTypeId) return false;

      // Period filter
      if (selectedPeriod === 'today' && item.date !== todayStr) return false;
      if (selectedPeriod === 'this_month' && !item.date.startsWith(currentMonthStr)) return false;
      if (selectedPeriod === '7days') {
        const d = new Date(item.date);
        const diff = (new Date() - d) / (1000 * 60 * 60 * 24);
        if (diff > 7 || diff < 0) return false;
      }

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchNote = item.note && item.note.toLowerCase().includes(query);
        const matchStaff = item.staffName && item.staffName.toLowerCase().includes(query);
        const matchHouse = item.houseName && item.houseName.toLowerCase().includes(query);
        if (!matchNote && !matchStaff && !matchHouse) return false;
      }
      return true;
    });
  }, [harvests, selectedHouseId, selectedPeriod, selectedTypeId, searchQuery, todayStr, currentMonthStr]);

  // Lọc lịch sử bán hàng
  const filteredSales = useMemo(() => {
    return sales.filter((item) => {
      if (selectedHouseId !== 'all' && item.houseId !== selectedHouseId) return false;
      if (selectedTypeId !== 'all' && item.typeId !== selectedTypeId) return false;

      if (selectedPeriod === 'today' && item.date !== todayStr) return false;
      if (selectedPeriod === 'this_month' && !item.date.startsWith(currentMonthStr)) return false;
      if (selectedPeriod === '7days') {
        const d = new Date(item.date);
        const diff = (new Date() - d) / (1000 * 60 * 60 * 24);
        if (diff > 7 || diff < 0) return false;
      }

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchCust = item.customerName && item.customerName.toLowerCase().includes(query);
        const matchPhone = item.customerPhone && item.customerPhone.includes(query);
        const matchHouse = item.houseName && item.houseName.toLowerCase().includes(query);
        if (!matchCust && !matchPhone && !matchHouse) return false;
      }
      return true;
    });
  }, [sales, selectedHouseId, selectedPeriod, selectedTypeId, searchQuery, todayStr, currentMonthStr]);

  // Thống kê nhanh
  const stats = useMemo(() => {
    const totalHarvestG = filteredHarvests.reduce((sum, i) => sum + Number(i.weight || 0), 0);
    const totalSalesAmount = filteredSales.reduce((sum, i) => sum + Number(i.totalAmount || 0), 0);
    const totalSoldG = filteredSales.reduce((sum, i) => sum + Number(i.weight || 0), 0);

    return {
      totalHarvestG,
      totalHarvestKg: (totalHarvestG / 1000).toFixed(2),
      harvestCount: filteredHarvests.length,
      totalSalesAmount,
      totalSoldG,
      salesCount: filteredSales.length,
    };
  }, [filteredHarvests, filteredSales]);

  return (
    <div className="space-y-5">
      {/* ─── SWITCHER TAB & FILTERS BAR ────────────────────────────────────── */}
      <div className="bg-white rounded-3xl p-4 lg:p-5 border border-slate-200/80 shadow-xs space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Switcher Tab */}
          <div className="bg-slate-100 p-1 rounded-2xl flex items-center gap-1 text-xs font-bold w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setViewType('harvests')}
              className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
                viewType === 'harvests'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Scale className="w-3.5 h-3.5" />
              <span>Thu hoạch ({filteredHarvests.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setViewType('sales')}
              className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
                viewType === 'sales'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Bán hàng ({filteredSales.length})</span>
            </button>
          </div>

          <button
            onClick={() => exportToExcel(harvests, sales, inventoryData)}
            className="self-end sm:self-auto text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100/80 px-3.5 py-2 rounded-xl border border-emerald-200/80 transition flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" /> Xuất Báo Cáo Excel
          </button>
        </div>

        {/* Filters Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1">
          {/* Lọc nhà yến */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Nhà yến:
            </label>
            <select
              value={selectedHouseId}
              onChange={(e) => setSelectedHouseId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 outline-none"
            >
              <option value="all">Tất cả nhà yến</option>
              {houses.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name}
                </option>
              ))}
            </select>
          </div>

          {/* Lọc thời gian */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Thời gian:
            </label>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 outline-none"
            >
              <option value="this_month">Tháng này ({currentMonthStr})</option>
              <option value="today">Hôm nay</option>
              <option value="7days">7 ngày gần nhất</option>
              <option value="all">Toàn bộ thời gian</option>
            </select>
          </div>

          {/* Lọc loại tổ */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Phân loại:
            </label>
            <select
              value={selectedTypeId}
              onChange={(e) => setSelectedTypeId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 outline-none"
            >
              <option value="all">Tất cả loại tổ</option>
              {NEST_TYPES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          {/* Ô tìm kiếm */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Tìm kiếm:
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm ghi chú, tên, SĐT..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-2 text-xs text-slate-800 outline-none"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>
        </div>
      </div>

      {/* ─── KPI STATS THEO BỘ LỌC ─────────────────────────────────────────── */}
      {viewType === 'harvests' ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <div className="bg-white border border-slate-200/80 p-4 rounded-3xl shadow-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Tổng sản lượng thu
            </span>
            <div className="text-xl font-black font-mono text-emerald-800 mt-1 tabular-nums">
              {stats.totalHarvestG.toLocaleString()} g
            </div>
            <span className="text-xs text-slate-500 font-medium">≈ {stats.totalHarvestKg} kg</span>
          </div>

          <div className="bg-white border border-slate-200/80 p-4 rounded-3xl shadow-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Tổng số đợt thu
            </span>
            <div className="text-xl font-black font-mono text-slate-800 mt-1 tabular-nums">
              {stats.harvestCount} phiếu
            </div>
            <span className="text-xs text-slate-500 font-medium">theo tiêu chí lọc</span>
          </div>

          <div className="bg-white border border-slate-200/80 p-4 rounded-3xl shadow-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Bình quân / đợt
            </span>
            <div className="text-xl font-black font-mono text-slate-800 mt-1 tabular-nums">
              {stats.harvestCount > 0 ? Math.round(stats.totalHarvestG / stats.harvestCount) : 0} g
            </div>
            <span className="text-xs text-slate-500 font-medium">năng suất trung bình</span>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <div className="bg-white border border-slate-200/80 p-4 rounded-3xl shadow-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Tổng doanh thu bán
            </span>
            <div className="text-xl font-black font-mono text-slate-900 mt-1 tabular-nums">
              {stats.totalSalesAmount.toLocaleString('vi-VN')} đ
            </div>
            <span className="text-xs text-slate-500 font-medium">{stats.salesCount} đơn bán</span>
          </div>

          <div className="bg-white border border-slate-200/80 p-4 rounded-3xl shadow-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Tổng khối lượng xuất
            </span>
            <div className="text-xl font-black font-mono text-blue-700 mt-1 tabular-nums">
              {stats.totalSoldG.toLocaleString()} g
            </div>
            <span className="text-xs text-slate-500 font-medium">≈ {(stats.totalSoldG / 1000).toFixed(2)} kg</span>
          </div>

          <div className="bg-white border border-slate-200/80 p-4 rounded-3xl shadow-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Số lượng đơn hàng
            </span>
            <div className="text-xl font-black font-mono text-slate-800 mt-1 tabular-nums">
              {stats.salesCount} đơn
            </div>
            <span className="text-xs text-slate-500 font-medium">hoàn thành</span>
          </div>
        </div>
      )}

      {/* ─── DATA TABLE / CARD LIST ────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
          {viewType === 'harvests' ? 'Chi tiết các phiếu thu hoạch' : 'Chi tiết các đơn xuất bán'}
        </h3>

        {viewType === 'harvests' ? (
          filteredHarvests.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              Không có phiếu thu nào khớp với bộ lọc.
            </div>
          ) : (
            <div className="space-y-2">
              {filteredHarvests.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 bg-slate-50/80 hover:bg-slate-100/70 rounded-2xl border border-slate-200/60 flex items-center justify-between transition"
                >
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-slate-900">{item.date}</span>
                      <span className="text-[10px] text-slate-700 bg-slate-200/80 px-2 py-0.5 rounded-md font-semibold">
                        {item.houseName}
                      </span>
                      {item.shift && (
                        <span className="text-[10px] text-slate-500 bg-white border border-slate-200 px-1.5 py-0.2 rounded">
                          {item.shift}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      <strong className="text-emerald-800 font-semibold">{item.typeName}</strong>
                      {item.staffName && <span> • Người nhập: {item.staffName}</span>}
                      {item.note && <span className="italic text-slate-400"> • "{item.note}"</span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <div className="text-base font-black font-mono text-emerald-700 tabular-nums">
                        +{item.weight.toLocaleString()}g
                      </div>
                      <div className="text-xs text-slate-400 font-mono">
                        {(item.weight / 1000).toFixed(2)} kg
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        if (onRequestDelete) {
                          onRequestDelete('harvest', item);
                        } else {
                          onDeleteHarvest(item.id);
                        }
                      }}
                      className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          filteredSales.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              Không có đơn bán nào khớp với bộ lọc.
            </div>
          ) : (
            <div className="space-y-2">
              {filteredSales.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 bg-slate-50/80 hover:bg-slate-100/70 rounded-2xl border border-slate-200/60 flex items-center justify-between transition"
                >
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-slate-900">{item.customerName}</span>
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                          item.status === 'paid'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}
                      >
                        {item.status === 'paid' ? 'Đã thanh toán' : 'Ghi nợ'}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      {item.date} • Xuất: <strong>{item.houseName}</strong> • {item.typeName}
                      {item.customerPhone && <span> • SĐT: {item.customerPhone}</span>}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-base font-black font-mono text-slate-900 tabular-nums">
                      {(item.totalAmount || 0).toLocaleString('vi-VN')} đ
                    </div>
                    <div className="text-xs text-slate-400 font-mono">
                      {item.weight}g
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}
