import React, { useState } from 'react';
import { Warehouse, ArrowRightLeft, AlertTriangle } from 'lucide-react';
import { NEST_TYPES } from '../data/constants';

export default function InventoryTab({ inventoryData, houses, onTransferStock }) {
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [fromHouseId, setFromHouseId] = useState(houses[1]?.id || 'h2');
  const [toHouseId, setToHouseId] = useState(houses[0]?.id || 'h1');
  const [transferWeight, setTransferWeight] = useState(500);
  const [transferNote, setTransferNote] = useState('Chuyển kho sơ chế');

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
    <div className="space-y-3.5 max-w-md mx-auto">
      {/* Thẻ tổng quan quy mô tinh gọn */}
      <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-sm space-y-3">
        <div className="flex justify-between items-start">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Warehouse className="w-3.5 h-3.5 text-emerald-400" /> Tồn kho toàn hệ thống
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold font-mono text-emerald-400 mt-1 tabular-nums">
              {inventoryData.grandTotalStock.toLocaleString()} g
              <span className="text-xs font-normal text-slate-400 ml-1.5">({grandTotalKg} kg)</span>
            </div>
          </div>
          <button
            onClick={() => setShowTransferModal(true)}
            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition flex items-center gap-1.5"
          >
            <ArrowRightLeft className="w-3 h-3 text-emerald-400" /> Chuyển kho
          </button>
        </div>

        <div className="pt-2.5 border-t border-slate-800 grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-[11px] text-slate-400 block">Ước tính giá trị hàng:</span>
            <span className="font-extrabold font-mono text-amber-300 text-sm tabular-nums">
              ~ {formattedGrandValue} đ
            </span>
          </div>
          <div>
            <span className="text-[11px] text-slate-400 block">Giá vốn quy chuẩn:</span>
            <span className="font-semibold font-mono text-slate-300 text-xs tabular-nums">
              25.000.000 đ/kg
            </span>
          </div>
        </div>
      </div>

      {/* Danh sách từng nhà yến */}
      <div className="space-y-2">
        <div className="flex justify-between items-center px-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Tồn kho theo từng nhà ({inventoryData.byHouse.length})
          </span>
          <span className="text-[11px] text-slate-400">Tự động trừ theo đơn bán</span>
        </div>

        {inventoryData.byHouse.map((house) => {
          const isLowStock = house.currentStockWeight < 1500;
          return (
            <div
              key={house.houseId}
              className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-xs space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-xs text-slate-900">{house.houseName}</h4>
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                    Thu: {house.totalHarvestWeight.toLocaleString()}g • Xuất: {house.totalSoldWeight.toLocaleString()}g
                  </p>
                </div>

                <div className="text-right">
                  <div className="text-sm font-extrabold font-mono text-emerald-800 tabular-nums">
                    {house.currentStockWeight.toLocaleString()} g
                  </div>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.2 rounded-full inline-block ${
                      isLowStock
                        ? 'bg-amber-50 text-amber-800 border border-amber-200'
                        : 'bg-emerald-50 text-emerald-800'
                    }`}
                  >
                    {isLowStock ? 'Cần bổ sung' : 'Dồi dào'}
                  </span>
                </div>
              </div>

              {/* Bóc tách chủng loại tổ */}
              <div className="grid grid-cols-2 gap-1.5 text-xs bg-slate-50/70 p-2 rounded-xl border border-slate-100">
                {Object.values(house.byType).map((typeData) => (
                  <div key={typeData.typeId} className="flex justify-between items-center px-1 py-0.5">
                    <span className="text-slate-500 text-[11px] truncate pr-1">{typeData.typeName}</span>
                    <span className="font-mono font-semibold text-slate-800 tabular-nums text-[11px]">
                      {typeData.stockWeight.toLocaleString()}g
                    </span>
                  </div>
                ))}
              </div>

              {/* Giá trị ước tính */}
              <div className="flex justify-between items-center text-[11px] px-1 pt-0.5">
                <span className="text-slate-400">Giá trị tồn ước tính:</span>
                <span className="font-bold font-mono text-emerald-800 tabular-nums">
                  {house.estimatedValue.toLocaleString('vi-VN')} đ
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Chuyển kho */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-4 max-w-sm w-full shadow-xl space-y-3">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <span className="font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <ArrowRightLeft className="w-4 h-4 text-emerald-700" /> Luân chuyển kho nội bộ
              </span>
              <button
                onClick={() => setShowTransferModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleTransfer} className="space-y-2.5 text-xs">
              <div>
                <label className="text-slate-500 font-medium block mb-1">Cơ sở xuất đi</label>
                <select
                  value={fromHouseId}
                  onChange={(e) => setFromHouseId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-semibold text-slate-700 outline-none"
                >
                  {houses.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-500 font-medium block mb-1">Cơ sở tiếp nhận</label>
                <select
                  value={toHouseId}
                  onChange={(e) => setToHouseId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-semibold text-slate-700 outline-none"
                >
                  {houses.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-500 font-medium block mb-1">Số lượng chuyển (gram)</label>
                <input
                  type="number"
                  value={transferWeight}
                  onChange={(e) => setTransferWeight(e.target.value)}
                  min="1"
                  step="10"
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-mono font-bold text-emerald-800 text-sm outline-none"
                />
              </div>

              <div>
                <label className="text-slate-500 font-medium block mb-1">Ghi chú</label>
                <input
                  type="text"
                  value={transferNote}
                  onChange={(e) => setTransferNote(e.target.value)}
                  placeholder="Lý do chuyển..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 outline-none"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl font-bold"
                >
                  Xác nhận
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
