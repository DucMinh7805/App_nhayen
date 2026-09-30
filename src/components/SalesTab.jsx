import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { ShoppingBag, Check, Trash2, User, Phone, Tag } from 'lucide-react';
import { NEST_TYPES } from '../data/constants';

export default function SalesTab({
  houses,
  sales,
  inventoryData,
  onAddSale,
  onDeleteSale,
  onUpdateSaleStatus,
}) {
  const [houseId, setHouseId] = useState(houses[0]?.id || 'h1');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [weight, setWeight] = useState(300);
  const [selectedType, setSelectedType] = useState(NEST_TYPES[0]);
  const [pricePer100g, setPricePer100g] = useState(NEST_TYPES[0].defaultPricePer100g);
  const [status, setStatus] = useState('paid');
  const [note, setNote] = useState('');

  const totalAmount = Math.round(((Number(weight) || 0) / 100) * (Number(pricePer100g) || 0));

  const activeHouseStock = inventoryData.byHouse.find((h) => h.houseId === houseId);
  const currentStockG = activeHouseStock ? activeHouseStock.currentStockWeight : 0;
  const isStockSufficient = currentStockG >= Number(weight || 0);

  const totalRevenue = sales.reduce((sum, s) => sum + (s.totalAmount || 0), 0);
  const totalDebt = sales
    .filter((s) => s.status === 'debt')
    .reduce((sum, s) => sum + (s.totalAmount || 0), 0);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!customerName.trim()) {
      alert('Vui lòng nhập tên khách hàng!');
      return;
    }
    if (!weight || Number(weight) <= 0) {
      alert('Vui lòng nhập khối lượng xuất bán!');
      return;
    }

    const houseObj = houses.find((h) => h.id === houseId) || houses[0];

    const newSale = {
      id: 'sale_' + Date.now(),
      houseId: houseObj.id,
      houseName: houseObj.name,
      date: new Date().toISOString().slice(0, 10),
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      weight: Number(weight),
      typeId: selectedType.id,
      typeName: selectedType.label,
      pricePer100g: Number(pricePer100g),
      totalAmount,
      status,
      note: note.trim(),
      createdAt: new Date().toISOString(),
    };

    onAddSale(newSale);

    confetti({
      particleCount: 30,
      spread: 50,
      origin: { y: 0.8 },
      colors: ['#047857', '#3b82f6'],
    });

    setCustomerName('');
    setCustomerPhone('');
    setNote('');
  };

  return (
    <div className="space-y-3.5 max-w-md mx-auto">
      {/* KPI Bán hàng & Công nợ tối giản */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-white border border-slate-200/80 p-3 rounded-2xl shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Doanh thu đã bán
          </span>
          <div className="text-base font-extrabold font-mono text-slate-900 mt-0.5 tabular-nums">
            {totalRevenue.toLocaleString('vi-VN')} đ
          </div>
          <span className="text-[10px] text-slate-400">{sales.length} đơn hoàn tất</span>
        </div>

        <div className="bg-white border border-slate-200/80 p-3 rounded-2xl shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Công nợ còn lại
          </span>
          <div className="text-base font-extrabold font-mono text-amber-700 mt-0.5 tabular-nums">
            {totalDebt.toLocaleString('vi-VN')} đ
          </div>
          <span className="text-[10px] text-slate-400">
            {sales.filter((s) => s.status === 'debt').length} đơn chưa thu
          </span>
        </div>
      </div>

      {/* Form xuất bán mới */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex justify-between items-center pb-2 border-b border-slate-100">
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <ShoppingBag className="w-3.5 h-3.5 text-emerald-700" /> Tạo đơn xuất bán
          </span>
          <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/50">
            Tự trừ tồn kho
          </span>
        </div>

        {/* Chọn nhà xuất kho */}
        <div>
          <div className="flex justify-between items-center mb-1 text-[11px]">
            <span className="text-slate-500 font-semibold uppercase tracking-wider">Xuất từ kho</span>
            <span className={`font-mono font-bold ${isStockSufficient ? 'text-emerald-700' : 'text-rose-600'}`}>
              Khả dụng: {currentStockG.toLocaleString()}g
            </span>
          </div>
          <select
            value={houseId}
            onChange={(e) => setHouseId(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-800 outline-none"
          >
            {houses.map((h) => {
              const hStock = inventoryData.byHouse.find((item) => item.houseId === h.id);
              const stock = hStock ? hStock.currentStockWeight : 0;
              return (
                <option key={h.id} value={h.id}>
                  {h.name} ({stock.toLocaleString()}g)
                </option>
              );
            })}
          </select>
        </div>

        {/* Khách hàng & SĐT */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[11px] font-semibold text-slate-400 block mb-1">Khách hàng</label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="VD: Chị Mai..."
              required
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-medium text-slate-800 outline-none"
            />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-slate-400 block mb-1">Số điện thoại</label>
            <input
              type="tel"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="09xx..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-medium text-slate-800 outline-none"
            />
          </div>
        </div>

        {/* Sản phẩm & Số lượng */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[11px] font-semibold text-slate-400 block mb-1">Loại yến</label>
            <select
              value={selectedType.id}
              onChange={(e) => {
                const t = NEST_TYPES.find((item) => item.id === e.target.value);
                if (t) {
                  setSelectedType(t);
                  setPricePer100g(t.defaultPricePer100g);
                }
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-medium text-slate-800 outline-none"
            >
              {NEST_TYPES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-400 block mb-1">Số lượng (gram)</label>
            <input
              type="number"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              min="1"
              step="10"
              required
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-mono font-bold text-slate-900 outline-none text-center tabular-nums"
            />
          </div>
        </div>

        {/* Đơn giá & Thành tiền */}
        <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-200/70 space-y-1.5">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-500 font-medium">Đơn giá / 100g</span>
            <input
              type="number"
              value={pricePer100g}
              onChange={(e) => setPricePer100g(e.target.value)}
              step="50000"
              required
              className="w-32 bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-mono font-bold text-right outline-none tabular-nums"
            />
          </div>

          <div className="flex justify-between items-center pt-1 border-t border-slate-200/50">
            <span className="text-xs font-bold text-slate-600">Thành tiền:</span>
            <span className="text-sm font-extrabold font-mono text-emerald-800 tabular-nums">
              {totalAmount.toLocaleString('vi-VN')} đ
            </span>
          </div>
        </div>

        {/* Trạng thái thanh toán dạng Pill */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setStatus('paid')}
            className={`py-2 px-3 rounded-xl border text-xs font-semibold transition flex items-center justify-center gap-1.5 ${
              status === 'paid'
                ? 'bg-emerald-700 text-white border-emerald-700 shadow-2xs'
                : 'bg-slate-50 border-slate-200 text-slate-600'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${status === 'paid' ? 'bg-white' : 'bg-emerald-500'}`}></span>
            Đã thanh toán
          </button>

          <button
            type="button"
            onClick={() => setStatus('debt')}
            className={`py-2 px-3 rounded-xl border text-xs font-semibold transition flex items-center justify-center gap-1.5 ${
              status === 'debt'
                ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                : 'bg-slate-50 border-slate-200 text-slate-600'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${status === 'debt' ? 'bg-white' : 'bg-amber-500'}`}></span>
            Ghi nợ
          </button>
        </div>

        <button
          type="submit"
          disabled={!isStockSufficient}
          className={`w-full py-3 rounded-2xl font-bold text-white text-xs shadow-xs transition flex items-center justify-center gap-2 cursor-pointer ${
            isStockSufficient
              ? 'bg-emerald-700 hover:bg-emerald-600'
              : 'bg-slate-300 cursor-not-allowed text-slate-500'
          }`}
        >
          {isStockSufficient ? 'Xuất bán & Trừ kho' : 'Kho không đủ hàng để xuất'}
        </button>
      </form>

      {/* Danh sách đơn bán gần đây */}
      <div className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-xs space-y-2">
        <div className="flex justify-between items-center px-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Đơn xuất gần đây ({sales.length})
          </span>
        </div>

        {sales.length === 0 ? (
          <div className="text-center py-6 text-slate-400 text-xs">Chưa có đơn xuất bán nào.</div>
        ) : (
          <div className="space-y-1.5">
            {sales.map((s) => (
              <div
                key={s.id}
                className="p-2.5 bg-slate-50/70 rounded-xl border border-slate-200/60 flex items-center justify-between gap-2"
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-xs text-slate-800">{s.customerName}</span>
                    <span className="text-[10px] text-slate-400 font-mono">• {s.date}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {s.houseName} • {s.weight}g ({s.typeName})
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <div className="text-xs font-extrabold font-mono text-slate-900 tabular-nums">
                      {s.totalAmount?.toLocaleString('vi-VN')} đ
                    </div>
                    <button
                      onClick={() =>
                        onUpdateSaleStatus(s.id, s.status === 'paid' ? 'debt' : 'paid')
                      }
                      className={`text-[10px] font-semibold px-2 py-0.2 rounded-full inline-block mt-0.5 transition cursor-pointer ${
                        s.status === 'paid'
                          ? 'bg-emerald-50 text-emerald-800'
                          : 'bg-amber-50 text-amber-800 border border-amber-300'
                      }`}
                    >
                      {s.status === 'paid' ? 'Đã thu' : 'Còn nợ'}
                    </button>
                  </div>
                  <button
                    onClick={() => {
                      if (confirm(`Xóa đơn của ${s.customerName}?`)) {
                        onDeleteSale(s.id);
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
