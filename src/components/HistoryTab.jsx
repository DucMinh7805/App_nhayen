import React, { useState, useMemo } from 'react';
import { Filter, Calendar, Search, Download, Trash2, TrendingUp, Sparkles, Scale, ShoppingBag } from 'lucide-react';
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
    <div className="space-y-3.5 max-w-md mx-auto">
      {/* Switcher Tab: Thu Hoạch vs Bán Hàng */}
      <div className="bg-slate-200/80 p-1 rounded-2xl grid grid-cols-2 gap-1 text-xs font-bold">
        <button
          type="button"
          onClick={() => setViewType('harvests')}
          className={`py-2 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
            viewType === 'harvests'
              ? 'bg-white text-emerald-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Scale className="w-3.5 h-3.5 text-emerald-700" />
          <span>Thu hoạch ({filteredHarvests.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setViewType('sales')}
          className={`py-2 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
            viewType === 'sales'
              ? 'bg-white text-emerald-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <ShoppingBag className="w-3.5 h-3.5 text-blue-700" />
          <span>Bán hàng ({filteredSales.length})</span>
        </button>
      </div>

      {/* Bộ lọc tinh gọn */}
      <div className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-xs space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-emerald-700" /> Bộ lọc dữ liệu
          </span>
          <button
            onClick={() => exportToExcel(harvests, sales, inventoryData)}
            className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200/60 cursor-pointer"
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
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-700 outline-none"
          >
            <option value="this_month">Tháng này ({currentMonthStr})</option>
            <option value="today">Hôm nay</option>
            <option value="7days">7 ngày gần nhất</option>
            <option value="all">Tất cả thời gian</option>
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
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-7 pr-2.5 py-1.5 text-xs text-slate-700 outline-none"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-1/2 -translate-y-1/2" />
          </div>
        </div>
      </div>

      {/* KPI Thống Kê Theo Bộ Lọc */}
      {viewType === 'harvests' ? (
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-white border border-slate-200/80 p-3 rounded-2xl shadow-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Tổng thu theo lọc
            </span>
            <div className="text-base font-black font-mono text-emerald-800 mt-0.5 tabular-nums">
              {stats.totalHarvestG.toLocaleString()} g
            </div>
            <span className="text-[10px] text-slate-400 font-medium">
              ≈ {stats.totalHarvestKg} kg • {stats.harvestCount} đợt
            </span>
          </div>

          <div className="bg-white border border-slate-200/80 p-3 rounded-2xl shadow-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Trung bình mỗi đợt
            </span>
            <div className="text-base font-black font-mono text-slate-800 mt-0.5 tabular-nums">
              {stats.harvestCount > 0 ? Math.round(stats.totalHarvestG / stats.harvestCount) : 0} g
            </div>
            <span className="text-[10px] text-slate-400 font-medium">sản lượng/phiếu</span>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-white border border-slate-200/80 p-3 rounded-2xl shadow-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Doanh thu theo lọc
            </span>
            <div className="text-base font-black font-mono text-slate-900 mt-0.5 tabular-nums">
              {stats.totalSalesAmount.toLocaleString('vi-VN')} đ
            </div>
            <span className="text-[10px] text-slate-400 font-medium">{stats.salesCount} đơn bán</span>
          </div>

          <div className="bg-white border border-slate-200/80 p-3 rounded-2xl shadow-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Tổng xuất bán
            </span>
            <div className="text-base font-black font-mono text-blue-700 mt-0.5 tabular-nums">
              {stats.totalSoldG.toLocaleString()} g
            </div>
            <span className="text-[10px] text-slate-400 font-medium">
              ≈ {(stats.totalSoldG / 1000).toFixed(2)} kg
            </span>
          </div>
        </div>
      )}

      {/* Danh Sách Chi Tiết */}
      <div className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-xs space-y-2">
        <div className="flex justify-between items-center px-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            {viewType === 'harvests' ? 'Chi tiết phiếu thu' : 'Chi tiết đơn bán'}
          </span>
        </div>

        {viewType === 'harvests' ? (
          filteredHarvests.length === 0 ? (
            <div className="text-center py-6 text-slate-400 text-xs">Không có phiếu thu nào khớp với bộ lọc.</div>
          ) : (
            <div className="space-y-1.5">
              {filteredHarvests.map((item) => (
                <div
                  key={item.id}
                  className="p-2.5 bg-slate-50/70 hover:bg-slate-50 rounded-xl border border-slate-200/60 flex items-center justify-between"
                >
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-800">{item.date}</span>
                      <span className="text-[10px] text-slate-600 bg-slate-200/70 px-1.5 py-0.2 rounded font-medium">
                        {item.houseName}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      <span className="font-semibold text-emerald-800">{item.typeName}</span>
                      {item.shift && <span> • {item.shift}</span>}
                      {item.note && <span className="italic text-slate-400"> • "{item.note}"</span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <div className="text-sm font-black font-mono text-emerald-700 tabular-nums">
                        +{item.weight.toLocaleString()}g
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
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
                      className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          filteredSales.length === 0 ? (
            <div className="text-center py-6 text-slate-400 text-xs">Không có đơn bán nào khớp với bộ lọc.</div>
          ) : (
            <div className="space-y-1.5">
              {filteredSales.map((item) => (
                <div
                  key={item.id}
                  className="p-2.5 bg-slate-50/70 hover:bg-slate-50 rounded-xl border border-slate-200/60 flex items-center justify-between"
                >
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-800">{item.customerName}</span>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${
                          item.status === 'paid'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}
                      >
                        {item.status === 'paid' ? 'Đã thanh toán' : 'Ghi nợ'}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {item.date} • {item.houseName} • {item.typeName}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-sm font-black font-mono text-slate-900 tabular-nums">
                      {(item.totalAmount || 0).toLocaleString('vi-VN')} đ
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
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
