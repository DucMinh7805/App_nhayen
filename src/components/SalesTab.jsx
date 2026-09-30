import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { ShoppingBag, Check, Trash2, User, Phone, Tag, Building2, MessageCircle, AlertTriangle, Plus } from 'lucide-react';
import { NEST_TYPES } from '../data/constants';

export default function SalesTab({
  houses,
  sales,
  inventoryData,
  onAddSale,
  onDeleteSale,
  onUpdateSaleStatus,
  onRequestDelete,
}) {
  const [isAdding, setIsAdding] = useState(false);
  const [houseId, setHouseId] = useState(houses[0]?.id || 'h1');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [weight, setWeight] = useState(300);
  const [selectedType, setSelectedType] = useState(NEST_TYPES[0]);
  const [pricePer100g, setPricePer100g] = useState(NEST_TYPES[0].defaultPricePer100g);
  const [status, setStatus] = useState('paid');
  const [note, setNote] = useState('');

  const totalAmount = Math.round(((Number(weight) || 0) / 100) * (Number(pricePer100g) || 0));

  const activeHouseStock = inventoryData?.byHouse?.find((h) => h.houseId === houseId);
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
    setIsAdding(false);
  };

  return (
    <div className="space-y-3.5 max-w-md mx-auto">
      {/* KPI Bán hàng & Công nợ */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-white border border-slate-200/80 p-3.5 rounded-2xl shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Doanh thu đã bán
          </span>
          <div className="text-base font-black font-mono text-slate-900 mt-0.5 tabular-nums">
            {totalRevenue.toLocaleString('vi-VN')} đ
          </div>
          <span className="text-[10px] text-slate-400 font-medium">{sales.length} đơn bán</span>
        </div>

        <div className="bg-white border border-slate-200/80 p-3.5 rounded-2xl shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Công nợ chưa thu
          </span>
          <div className="text-base font-black font-mono text-amber-600 mt-0.5 tabular-nums">
            {totalDebt.toLocaleString('vi-VN')} đ
          </div>
          <span className="text-[10px] text-slate-400 font-medium">
            {sales.filter((s) => s.status === 'debt').length} đơn ghi nợ
          </span>
        </div>
      </div>

      {/* Nút Tạo Đơn Bán Mới */}
      {!isAdding ? (
        <button
          type="button"
          onClick={() => setIsAdding(true)}
          className="w-full py-3 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-1.5 shadow-sm transition cursor-pointer active:scale-[0.99]"
        >
          <Plus className="w-4 h-4" /> Xuất bán đơn mới (Trừ kho)
        </button>
      ) : (
        /* Form Tạo Đơn Mới */
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm space-y-3 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <ShoppingBag className="w-3.5 h-3.5 text-emerald-700" /> Tạo đơn bán & xuất kho
            </span>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="text-[11px] text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              Đóng
            </button>
          </div>

          {/* Chọn cơ sở xuất */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1">
              <Building2 className="w-3 h-3 text-slate-400" /> Xuất từ nhà yến:
            </label>
            <select
              value={houseId}
              onChange={(e) => setHouseId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none"
            >
              {houses.map((h) => {
                const stock = inventoryData?.byHouse?.find((item) => item.houseId === h.id)?.currentStockWeight || 0;
                return (
                  <option key={h.id} value={h.id}>
                    {h.name} (Tồn: {stock.toLocaleString()}g)
                  </option>
                );
              })}
            </select>
          </div>

          {/* Khách hàng & SĐT */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1 block">
                Tên khách hàng *
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Chị Mai..."
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-2.5 py-1.5 text-xs font-semibold text-slate-800 outline-none"
                />
                <User className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1 block">
                SĐT liên hệ
              </label>
              <div className="relative">
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="0903..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-2.5 py-1.5 text-xs font-semibold text-slate-800 outline-none"
                />
                <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>
          </div>

          {/* Loại tổ & Giá bán */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
              Loại tổ bán:
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {NEST_TYPES.map((type) => {
                const isSelected = selectedType.id === type.id;
                return (
                  <button
                    type="button"
                    key={type.id}
                    onClick={() => {
                      setSelectedType(type);
                      setPricePer100g(type.defaultPricePer100g);
                    }}
                    className={`px-2.5 py-1.5 rounded-xl text-left text-xs transition border flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-700 text-white font-semibold border-emerald-700'
                        : 'bg-slate-50/70 hover:bg-slate-100 text-slate-700 font-medium border-slate-200/70'
                    }`}
                  >
                    <span className="truncate">{type.label}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Số lượng (Gram) & Đơn giá / 100g */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1 block">
                Khối lượng (gram)
              </label>
              <input
                type="number"
                value={weight}
                onChange={(e) => setWeight(Number(e.target.value))}
                placeholder="300"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-mono font-bold text-slate-800 outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1 block">
                Đơn giá / 100g
              </label>
              <input
                type="number"
                step="50000"
                value={pricePer100g}
                onChange={(e) => setPricePer100g(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-mono font-bold text-slate-800 outline-none"
              />
            </div>
          </div>

          {/* Cảnh báo tồn kho */}
          {!isStockSufficient && (
            <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 rounded-xl p-2.5 text-[11px] text-rose-800">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>
                Cảnh báo: Kho chỉ còn <strong>{currentStockG.toLocaleString()}g</strong>, bạn đang xuất{' '}
                <strong>{weight}g</strong>!
              </span>
            </div>
          )}

          {/* Trạng thái thanh toán */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1 block">
              Trạng thái thanh toán
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setStatus('paid')}
                className={`py-2 rounded-xl text-xs font-bold transition border cursor-pointer ${
                  status === 'paid'
                    ? 'bg-emerald-700 text-white border-emerald-700'
                    : 'bg-slate-50 text-slate-600 border-slate-200'
                }`}
              >
                ✓ Đã thanh toán
              </button>
              <button
                type="button"
                onClick={() => setStatus('debt')}
                className={`py-2 rounded-xl text-xs font-bold transition border cursor-pointer ${
                  status === 'debt'
                    ? 'bg-amber-600 text-white border-amber-600'
                    : 'bg-slate-50 text-slate-600 border-slate-200'
                }`}
              >
                ⚠ Ghi nợ khách
              </button>
            </div>
          </div>

          {/* Thành tiền & Submit */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 block font-medium">Tổng thành tiền:</span>
              <span className="text-base font-black font-mono text-emerald-800">
                {totalAmount.toLocaleString('vi-VN')} đ
              </span>
            </div>
            <button
              type="submit"
              className="py-2.5 px-5 bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer active:scale-95"
            >
              Lưu đơn bán
            </button>
          </div>
        </form>
      )}

      {/* Danh sách các đơn bán hàng */}
      <div className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-xs space-y-2.5">
        <div className="flex justify-between items-center px-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Lịch sử bán hàng ({sales.length})
          </span>
        </div>

        {sales.length === 0 ? (
          <div className="text-center py-6 text-slate-400 text-xs">Chưa có đơn bán hàng nào.</div>
        ) : (
          <div className="space-y-2">
            {sales.map((sale) => {
              const isPaid = sale.status === 'paid';
              return (
                <div
                  key={sale.id}
                  className="p-3 bg-slate-50/80 rounded-2xl border border-slate-200/60 space-y-2"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-slate-900">{sale.customerName}</span>
                        <span
                          className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded-full border ${
                            isPaid
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : 'bg-amber-50 text-amber-800 border-amber-200'
                          }`}
                        >
                          {isPaid ? 'ĐÃ THU' : 'GHI NỢ'}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {sale.date} • Xuất: <strong className="text-slate-600">{sale.houseName}</strong>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-sm font-black font-mono text-slate-900 tabular-nums">
                        {(sale.totalAmount || 0).toLocaleString('vi-VN')} đ
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        {sale.weight}g • {sale.typeName}
                      </div>
                    </div>
                  </div>

                  {/* Actions: Gọi điện / Zalo / Đổi trạng thái / Xóa */}
                  <div className="flex items-center justify-between pt-1.5 border-t border-slate-200/60 text-[11px]">
                    <div className="flex items-center gap-2">
                      {sale.customerPhone && (
                        <>
                          <a
                            href={`tel:${sale.customerPhone}`}
                            className="flex items-center gap-1 text-slate-600 hover:text-emerald-700 font-medium bg-white px-2 py-1 rounded-lg border border-slate-200"
                          >
                            <Phone className="w-3 h-3 text-emerald-600" /> {sale.customerPhone}
                          </a>
                          <a
                            href={`https://zalo.me/${sale.customerPhone}`}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium bg-white px-2 py-1 rounded-lg border border-slate-200"
                          >
                            <MessageCircle className="w-3 h-3 text-blue-500" /> Zalo
                          </a>
                        </>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* Nút đổi trạng thái thanh toán */}
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateSaleStatus(sale.id, isPaid ? 'debt' : 'paid')
                        }
                        className={`px-2 py-1 rounded-lg font-bold text-[10px] border transition cursor-pointer ${
                          isPaid
                            ? 'bg-white text-slate-500 border-slate-200 hover:bg-amber-50 hover:text-amber-700'
                            : 'bg-emerald-700 text-white border-emerald-700 hover:bg-emerald-800'
                        }`}
                      >
                        {isPaid ? 'Đổi sang nợ' : '✓ Đã thu tiền'}
                      </button>

                      {/* Nút xóa */}
                      <button
                        type="button"
                        onClick={() => {
                          if (onRequestDelete) {
                            onRequestDelete('sale', sale);
                          } else {
                            onDeleteSale(sale.id);
                          }
                        }}
                        className="p-1 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
