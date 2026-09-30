import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { ShoppingBag, Check, Trash2, User, Phone, Tag, Building2, MessageCircle, AlertTriangle, Plus, Search, DollarSign } from 'lucide-react';
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
  const [houseId, setHouseId] = useState(houses[0]?.id || 'h1');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [weight, setWeight] = useState(300);
  const [selectedType, setSelectedType] = useState(NEST_TYPES[0]);
  const [pricePer100g, setPricePer100g] = useState(NEST_TYPES[0].defaultPricePer100g);
  const [status, setStatus] = useState('paid');
  const [note, setNote] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const totalAmount = Math.round(((Number(weight) || 0) / 100) * (Number(pricePer100g) || 0));

  const activeHouseStock = inventoryData?.byHouse?.find((h) => h.houseId === houseId);
  const currentStockG = activeHouseStock ? activeHouseStock.currentStockWeight : 0;
  const isStockSufficient = currentStockG >= Number(weight || 0);

  const totalRevenue = sales.reduce((sum, s) => sum + (s.totalAmount || 0), 0);
  const totalDebt = sales
    .filter((s) => s.status === 'debt')
    .reduce((sum, s) => sum + (s.totalAmount || 0), 0);
  const totalSoldWeight = sales.reduce((sum, s) => sum + (s.weight || 0), 0);

  const filteredSales = sales.filter((s) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (s.customerName && s.customerName.toLowerCase().includes(q)) ||
      (s.customerPhone && s.customerPhone.includes(q)) ||
      (s.houseName && s.houseName.toLowerCase().includes(q))
    );
  });

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
      particleCount: 35,
      spread: 50,
      origin: { y: 0.8 },
      colors: ['#047857', '#3b82f6'],
    });

    setCustomerName('');
    setCustomerPhone('');
    setNote('');
  };

  return (
    <div className="space-y-5">
      {/* ─── TOP KPI CARDS ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="bg-white border border-slate-200/80 p-4 lg:p-5 rounded-3xl shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Tổng doanh thu đã bán
          </span>
          <div className="text-xl lg:text-2xl font-black font-mono text-slate-900 mt-1 tabular-nums">
            {totalRevenue.toLocaleString('vi-VN')} đ
          </div>
          <span className="text-xs text-slate-500 mt-0.5 inline-block font-medium">
            {sales.length} đơn hoàn tất
          </span>
        </div>

        <div className="bg-white border border-slate-200/80 p-4 lg:p-5 rounded-3xl shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Công nợ còn phải thu
          </span>
          <div className="text-xl lg:text-2xl font-black font-mono text-amber-600 mt-1 tabular-nums">
            {totalDebt.toLocaleString('vi-VN')} đ
          </div>
          <span className="text-xs text-amber-700/80 mt-0.5 inline-block font-medium">
            {sales.filter((s) => s.status === 'debt').length} đơn ghi nợ
          </span>
        </div>

        <div className="bg-white border border-slate-200/80 p-4 lg:p-5 rounded-3xl shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Tổng sản lượng đã xuất
          </span>
          <div className="text-xl lg:text-2xl font-black font-mono text-emerald-800 mt-1 tabular-nums">
            {totalSoldWeight.toLocaleString()} g
          </div>
          <span className="text-xs text-slate-500 mt-0.5 inline-block font-medium">
            ≈ {(totalSoldWeight / 1000).toFixed(2)} kg tổ xuất kho
          </span>
        </div>
      </div>

      {/* ─── 2 CỘT RESPONSIVE ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6">
        {/* CỘT TRÁI: FORM TẠO ĐƠN BÁN (lg:col-span-5) */}
        <div className="lg:col-span-5 space-y-4">
          <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-5 lg:p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-xs">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Tạo đơn bán & xuất kho</h3>
                <p className="text-[11px] text-slate-400">Tự động trừ tồn kho nhà tương ứng</p>
              </div>
            </div>

            {/* Chọn cơ sở xuất */}
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1">
                <Building2 className="w-3 h-3 text-slate-400" /> Xuất từ nhà yến:
              </label>
              <select
                value={houseId}
                onChange={(e) => setHouseId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none cursor-pointer"
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-2.5 py-2 text-xs font-semibold text-slate-800 outline-none"
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
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-2.5 py-2 text-xs font-semibold text-slate-800 outline-none"
                  />
                  <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>
            </div>

            {/* Loại tổ bán */}
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
                      className={`px-3 py-2 rounded-xl text-left text-xs transition border flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-700 text-white font-semibold border-emerald-700'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium border-slate-200/80'
                      }`}
                    >
                      <span className="truncate">{type.label}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Khối lượng (g) & Đơn giá / 100g */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1 block">
                  Khối lượng (gram)
                </label>
                <input
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(Number(e.target.value))}
                  placeholder="300"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-800 outline-none"
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
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-800 outline-none"
                />
              </div>
            </div>

            {/* Cảnh báo tồn kho */}
            {!isStockSufficient && (
              <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs text-rose-800">
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
                  className={`py-2.5 rounded-xl text-xs font-bold transition border cursor-pointer ${
                    status === 'paid'
                      ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                      : 'bg-slate-50 text-slate-600 border-slate-200'
                  }`}
                >
                  ✓ Đã thanh toán
                </button>
                <button
                  type="button"
                  onClick={() => setStatus('debt')}
                  className={`py-2.5 rounded-xl text-xs font-bold transition border cursor-pointer ${
                    status === 'debt'
                      ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                      : 'bg-slate-50 text-slate-600 border-slate-200'
                  }`}
                >
                  ⚠ Ghi nợ khách
                </button>
              </div>
            </div>

            {/* Thành tiền & Nút Lưu */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 block font-medium">Tổng thành tiền:</span>
                <span className="text-lg font-black font-mono text-emerald-800">
                  {totalAmount.toLocaleString('vi-VN')} đ
                </span>
              </div>
              <button
                type="submit"
                className="py-3 px-6 bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs rounded-2xl shadow-md transition cursor-pointer active:scale-95"
              >
                Lưu đơn bán
              </button>
            </div>
          </form>
        </div>

        {/* CỘT PHẢI: DANH SÁCH ĐƠN BÁN HÀNG (lg:col-span-7) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-3xl p-5 lg:p-6 border border-slate-200/80 shadow-xs space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Danh sách đơn bán hàng ({filteredSales.length})</h3>
                <p className="text-[11px] text-slate-400">Theo dõi doanh thu, giao hàng và công nợ</p>
              </div>

              {/* Ô Tìm Kiếm */}
              <div className="relative min-w-[200px]">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm khách, SĐT, nhà..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 outline-none"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {filteredSales.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                Chưa có đơn bán hàng nào khớp với tìm kiếm.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[560px] overflow-y-auto pr-1">
                {filteredSales.map((sale) => {
                  const isPaid = sale.status === 'paid';
                  return (
                    <div
                      key={sale.id}
                      className="p-3.5 bg-slate-50/80 hover:bg-slate-100/70 rounded-2xl border border-slate-200/70 space-y-2.5 transition"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-slate-900">{sale.customerName}</span>
                            <span
                              className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${
                                isPaid
                                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                  : 'bg-amber-100 text-amber-800 border-amber-300 animate-pulse'
                              }`}
                            >
                              {isPaid ? 'ĐÃ THU TIỀN' : 'GHI NỢ'}
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            {sale.date} • Xuất từ: <strong className="text-slate-700">{sale.houseName}</strong>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-base font-black font-mono text-slate-900 tabular-nums">
                            {(sale.totalAmount || 0).toLocaleString('vi-VN')} đ
                          </div>
                          <div className="text-xs text-slate-500 font-mono">
                            {sale.weight}g • {sale.typeName}
                          </div>
                        </div>
                      </div>

                      {/* Actions Footer */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-xs">
                        <div className="flex items-center gap-2">
                          {sale.customerPhone && (
                            <>
                              <a
                                href={`tel:${sale.customerPhone}`}
                                className="flex items-center gap-1 text-slate-700 hover:text-emerald-700 font-semibold bg-white px-2.5 py-1 rounded-xl border border-slate-200 shadow-2xs"
                              >
                                <Phone className="w-3 h-3 text-emerald-600" /> {sale.customerPhone}
                              </a>
                              <a
                                href={`https://zalo.me/${sale.customerPhone}`}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-1 text-blue-600 hover:text-blue-800 font-semibold bg-white px-2.5 py-1 rounded-xl border border-slate-200 shadow-2xs"
                              >
                                <MessageCircle className="w-3 h-3 text-blue-500" /> Zalo
                              </a>
                            </>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Toggle Trạng Thái */}
                          <button
                            type="button"
                            onClick={() =>
                              onUpdateSaleStatus(sale.id, isPaid ? 'debt' : 'paid')
                            }
                            className={`px-3 py-1 rounded-xl font-bold text-xs border transition cursor-pointer ${
                              isPaid
                                ? 'bg-white text-slate-600 border-slate-200 hover:bg-amber-50 hover:text-amber-700'
                                : 'bg-emerald-700 text-white border-emerald-700 hover:bg-emerald-800 shadow-xs'
                            }`}
                          >
                            {isPaid ? 'Đổi sang nợ' : '✓ Thu nợ ngay'}
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => {
                              if (onRequestDelete) {
                                onRequestDelete('sale', sale);
                              } else {
                                onDeleteSale(sale.id);
                              }
                            }}
                            className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
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
      </div>
    </div>
  );
}
