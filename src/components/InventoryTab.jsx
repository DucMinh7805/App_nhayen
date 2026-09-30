import React, { useState } from 'react';
import { Warehouse, ArrowRightLeft, AlertTriangle, Layers, TrendingUp, Building2, CheckCircle2 } from 'lucide-react';
import { NEST_TYPES } from '../data/constants';

export default function InventoryTab({ inventoryData, houses, session, onTransferStock }) {
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [fromHouseId, setFromHouseId] = useState(houses[1]?.id || houses[0]?.id || 'h1');
  const [toHouseId, setToHouseId] = useState(houses[0]?.id || 'h1');
  const [transferWeight, setTransferWeight] = useState(500);
  const [transferNote, setTransferNote] = useState('Chuyển kho sơ chế');

  const isAdmin = session?.role === 'admin';
  const grandTotalKg = (inventoryData.grandTotalStock / 1000).toFixed(2);
  const formattedGrandValue = inventoryData.grandTotalValue.toLocaleString('vi-VN');

  const handleTransfer = (e) => {
    e.preventDefault();
    if (fromHouseId === toHouseId) {
      alert('Cơ sở xuất và nhận phải khác nhau!');
      return;
    }
    if (!transferWeight || Number(transferWeight) <= 0) {
      alert('Vui lòng nhập khối lượng hợp lệ!');
      return;
    }

    if (onTransferStock) {
      onTransferStock(fromHouseId, toHouseId, Number(transferWeight), transferNote);
    }
    setShowTransferModal(false);
  };

  return (
    <div className="space-y-5">
      {/* ─── TOP HERO SUMMARY CARD (LUXURY DARK SLATE) ──────────────────────── */}
      <div className="bg-slate-900 text-white p-5 lg:p-7 rounded-3xl shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Warehouse className="w-4 h-4 text-emerald-400" /> Tồn kho toàn hệ thống
            </span>
            <div className="text-3xl lg:text-4xl font-black font-mono text-emerald-400 mt-1 tabular-nums">
              {inventoryData.grandTotalStock.toLocaleString()} g
              <span className="text-sm font-normal text-slate-400 ml-2">({grandTotalKg} kg)</span>
            </div>
          </div>

          <button
            onClick={() => setShowTransferModal(true)}
            className="self-start sm:self-auto px-4 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-2xl text-xs font-bold transition flex items-center gap-2 shadow-sm shadow-emerald-700/20 cursor-pointer active:scale-95"
          >
            <ArrowRightLeft className="w-4 h-4" /> Luân chuyển kho nội bộ
          </button>
        </div>

        {isAdmin && (
          <div className="pt-3 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="bg-slate-800/60 p-3 rounded-2xl border border-slate-800">
              <span className="text-[11px] text-slate-400 block font-medium">Ước tính giá trị kho hàng:</span>
              <span className="font-extrabold font-mono text-amber-300 text-base tabular-nums mt-0.5 block">
                ~ {formattedGrandValue} đ
              </span>
            </div>

            <div className="bg-slate-800/60 p-3 rounded-2xl border border-slate-800">
              <span className="text-[11px] text-slate-400 block font-medium">Đơn giá thị trường bình quân:</span>
              <span className="font-semibold font-mono text-slate-300 text-sm tabular-nums mt-0.5 block">
                ~ 25.000.000 đ / kg
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ─── GRID CÁC CƠ SỞ NHÀ YẾN (RESPONSIVE GRID) ───────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <Building2 className="w-4 h-4 text-slate-500" /> Tồn kho theo từng nhà yến ({inventoryData.byHouse.length})
          </h3>
          <span className="text-xs text-slate-400">Tự động đối trừ theo thời gian thực</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {inventoryData.byHouse.map((house) => {
            const isLowStock = house.currentStockWeight < 1500;
            return (
              <div
                key={house.houseId}
                className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-4 hover:shadow-md transition"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900">{house.houseName}</h4>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                      Thu: {house.totalHarvestWeight.toLocaleString()}g • Xuất: {house.totalSoldWeight.toLocaleString()}g
                    </p>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      isLowStock
                        ? 'bg-amber-50 text-amber-800 border-amber-200'
                        : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    }`}
                  >
                    {isLowStock ? 'Cần bổ sung' : 'Tồn ổn định'}
                  </span>
                </div>

                {/* Khối Tồn Hiện Tại */}
                <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500">Tồn kho hiện có:</span>
                  <div className="text-right">
                    <span className="text-lg font-black font-mono text-emerald-800 tabular-nums">
                      {house.currentStockWeight.toLocaleString()} g
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono block">
                      ≈ {(house.currentStockWeight / 1000).toFixed(2)} kg
                    </span>
                  </div>
                </div>

                {/* Chi tiết từng phân loại tổ */}
                <div className="space-y-2 pt-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Phân bổ theo loại tổ:
                  </span>

                  <div className="space-y-1.5 text-xs">
                    {Object.values(house.byType || {}).map((tData) => {
                      const percentage =
                        house.totalHarvestWeight > 0
                          ? Math.round((tData.harvestWeight / house.totalHarvestWeight) * 100)
                          : 0;

                      return (
                        <div key={tData.typeId} className="space-y-0.5">
                          <div className="flex justify-between text-[11px]">
                            <span className="font-medium text-slate-600 truncate">{tData.typeName}</span>
                            <span className="font-bold font-mono text-slate-800 tabular-nums">
                              {tData.stockWeight.toLocaleString()}g
                            </span>
                          </div>

                          {/* Progress bar */}
                          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-emerald-600 h-1.5 rounded-full transition-all duration-300"
                              style={{ width: `${Math.min(100, percentage)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Định giá tài sản của nhà này (Admin only) */}
                {isAdmin && house.estimatedValue > 0 && (
                  <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-xs">
                    <span className="text-slate-400">Giá trị quy đổi:</span>
                    <span className="font-bold font-mono text-amber-700">
                      ~ {house.estimatedValue.toLocaleString('vi-VN')} đ
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── MODAL LUÂN CHUYỂN KHO NỘI BỘ ──────────────────────────────────── */}
      {showTransferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-white rounded-3xl p-5 border border-slate-200/80 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <ArrowRightLeft className="w-4 h-4 text-emerald-700" /> Luân chuyển tổ giữa các kho
              </h3>
              <button
                type="button"
                onClick={() => setShowTransferModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-semibold cursor-pointer"
              >
                Đóng
              </button>
            </div>

            <form onSubmit={handleTransfer} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-500 font-bold block mb-1">Cơ sở xuất đi</label>
                <select
                  value={fromHouseId}
                  onChange={(e) => setFromHouseId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold text-slate-800 outline-none"
                >
                  {houses.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-500 font-bold block mb-1">Cơ sở tiếp nhận</label>
                <select
                  value={toHouseId}
                  onChange={(e) => setToHouseId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold text-slate-800 outline-none"
                >
                  {houses.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-500 font-bold block mb-1">Khối lượng chuyển (gram)</label>
                <input
                  type="number"
                  value={transferWeight}
                  onChange={(e) => setTransferWeight(e.target.value)}
                  min="1"
                  step="10"
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono font-bold text-emerald-800 text-sm outline-none"
                />
              </div>

              <div>
                <label className="text-slate-500 font-bold block mb-1">Ghi chú luân chuyển</label>
                <input
                  type="text"
                  value={transferNote}
                  onChange={(e) => setTransferNote(e.target.value)}
                  placeholder="Lý do chuyển..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl font-bold shadow-md shadow-emerald-700/20 cursor-pointer"
                >
                  Xác nhận chuyển
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
