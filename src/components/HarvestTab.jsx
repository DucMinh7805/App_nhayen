import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { Calendar, Tag, Clock, FileText, Check, Trash2, ArrowUpRight, Scale, Sparkles, Plus, History } from 'lucide-react';
import { NEST_TYPES, SHIFTS } from '../data/constants';

export default function HarvestTab({
  activeHouse,
  session,
  harvests,
  onAddHarvest,
  onDeleteHarvest,
  onNavigateToHistory,
  onRequestDelete,
}) {
  const todayStr = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(todayStr);
  const [weight, setWeight] = useState(1140);
  const [selectedType, setSelectedType] = useState(NEST_TYPES[0]);
  const [selectedShift, setSelectedShift] = useState(SHIFTS[0].label);
  const [note, setNote] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const kgValue = ((Number(weight) || 0) / 1000).toFixed(2);

  // Tính tổng thu hôm nay của nhà yến này
  const todayTotalWeight = harvests
    .filter((h) => h.houseId === activeHouse?.id && h.date === (date || todayStr))
    .reduce((sum, h) => sum + Number(h.weight || 0), 0);

  // Toàn bộ đợt thu của nhà này
  const houseHarvests = harvests.filter((h) => h.houseId === activeHouse?.id);

  const handleAdjustWeight = (delta) => {
    const current = Number(weight) || 0;
    const next = Math.max(0, current + delta);
    setWeight(next);
  };

  const handleResetWeight = () => {
    setWeight('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!weight || Number(weight) <= 0) {
      alert('Vui lòng nhập khối lượng thu hoạch!');
      return;
    }

    const newRecord = {
      id: 'harv_' + Date.now(),
      houseId: activeHouse.id,
      houseName: activeHouse.name,
      date: date || todayStr,
      weight: Number(weight),
      typeId: selectedType.id,
      typeName: selectedType.label,
      shift: selectedShift,
      note: note.trim(),
      staffName: session?.name || 'Nhân viên',
      createdAt: new Date().toISOString(),
    };

    onAddHarvest(newRecord);

    confetti({
      particleCount: 40,
      spread: 60,
      origin: { y: 0.8 },
      colors: ['#047857', '#059669', '#10b981'],
    });

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Toast thông báo lưu thành công */}
      {savedSuccess && (
        <div className="bg-emerald-700 text-white px-4 py-3 rounded-2xl text-xs font-semibold flex items-center justify-between shadow-md animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 stroke-[2.5]" />
            <span>Đã ghi nhận +{weight}g vào Google Sheet thành công!</span>
          </div>
          <button
            onClick={() => onNavigateToHistory()}
            className="text-xs text-emerald-100 hover:text-white underline font-semibold cursor-pointer"
          >
            Xem lịch sử
          </button>
        </div>
      )}

      {/* Grid 2 Cột trên Desktop, 1 Cột trên Mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6">
        {/* ─── CỘT TRÁI: FORM NHẬP LIỆU THU HOẠCH (lg:col-span-7) ─────────── */}
        <div className="lg:col-span-7 space-y-4">
          <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-5 md:p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                  <Scale className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Phiếu nhập thu hoạch</h3>
                  <p className="text-[11px] text-slate-400">Ghi nhận số lượng thu tổ mới</p>
                </div>
              </div>

              {/* Ngày thu */}
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 outline-none focus:border-emerald-600 cursor-pointer"
                />
              </div>
            </div>

            {/* Khối Hero Numpad */}
            <div className="bg-slate-50/90 rounded-2xl p-4 md:p-5 border border-slate-200/70 text-center space-y-2.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Khối lượng tổ thu được
              </label>

              <div className="flex items-baseline justify-center gap-2 py-1">
                <input
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="0"
                  className="text-4xl md:text-5xl font-black text-emerald-800 font-mono text-center w-56 bg-transparent outline-none tabular-nums tracking-tight"
                />
                <span className="text-base font-bold text-slate-400 font-mono">gram</span>
              </div>

              <div className="text-xs font-mono text-slate-500 font-medium">
                Quy đổi: <strong className="text-slate-800 font-bold text-sm">{kgValue}</strong> kg
              </div>

              {/* Quick Adjust Buttons */}
              <div className="grid grid-cols-5 gap-1.5 pt-1 max-w-md mx-auto">
                {[50, 100, 500, 1000].map((step) => (
                  <button
                    type="button"
                    key={step}
                    onClick={() => handleAdjustWeight(step)}
                    className="py-2 bg-white hover:bg-emerald-50 active:bg-emerald-100 border border-slate-200/80 hover:border-emerald-300 rounded-xl text-xs font-mono font-bold text-slate-700 hover:text-emerald-800 transition cursor-pointer shadow-2xs"
                  >
                    +{step >= 1000 ? `${step / 1000}kg` : `${step}g`}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={handleResetWeight}
                  className="py-2 bg-rose-50 hover:bg-rose-100 active:bg-rose-200 border border-rose-200 rounded-xl text-xs font-bold text-rose-700 transition cursor-pointer shadow-2xs"
                >
                  Xóa
                </button>
              </div>
            </div>

            {/* Phân loại tổ */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                <Tag className="w-3 h-3 text-slate-400" /> Loại tổ thu hoạch
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {NEST_TYPES.map((type) => {
                  const isSelected = selectedType.id === type.id;
                  return (
                    <button
                      type="button"
                      key={type.id}
                      onClick={() => setSelectedType(type)}
                      className={`px-3 py-2.5 rounded-xl text-left text-xs transition border flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-700 text-white font-semibold border-emerald-700 shadow-sm'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium border-slate-200/80'
                      }`}
                    >
                      <span className="truncate">{type.label}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[2.5] shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Ca thu & Ghi chú */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-400" /> Ca thu
                </label>
                <select
                  value={selectedShift}
                  onChange={(e) => setSelectedShift(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 outline-none cursor-pointer"
                >
                  {SHIFTS.map((s) => (
                    <option key={s.id} value={s.label}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1">
                  <FileText className="w-3 h-3 text-slate-400" /> Ghi chú
                </label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="VD: Thu tầng 2, tổ trắng đẹp..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 outline-none"
                />
              </div>
            </div>

            {/* Nút Submit */}
            <button
              type="submit"
              className="w-full py-3.5 bg-emerald-700 hover:bg-emerald-600 active:scale-[0.99] text-white font-bold rounded-2xl shadow-md shadow-emerald-700/20 transition flex items-center justify-center gap-2 text-sm cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Lưu phiếu thu (+{weight || 0}g)</span>
              <span className="text-emerald-200 text-xs font-normal">[{activeHouse?.name}]</span>
            </button>
          </form>
        </div>

        {/* ─── CỘT PHẢI: TỔNG QUAN HÔM NAY & LỊCH SỬ GẦN ĐÂY (lg:col-span-5) ─ */}
        <div className="lg:col-span-5 space-y-4">
          {/* Card Thống kê sản lượng hôm nay */}
          <div className="bg-gradient-to-br from-emerald-800 to-emerald-700 rounded-3xl p-5 text-white shadow-md space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase font-bold text-emerald-200 tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" /> Sản lượng ngày {date || todayStr}
              </span>
              <span className="text-xs bg-emerald-900/50 px-2.5 py-0.5 rounded-full border border-emerald-500/30 text-emerald-200">
                {activeHouse?.name}
              </span>
            </div>

            <div className="pt-1">
              <div className="text-3xl lg:text-4xl font-black font-mono tracking-tight tabular-nums">
                {todayTotalWeight.toLocaleString()}g
              </div>
              <div className="text-xs text-emerald-200 font-mono mt-0.5">
                ≈ <strong className="text-white">{(todayTotalWeight / 1000).toFixed(2)}</strong> kg thu hoạch
              </div>
            </div>

            <div className="pt-2 border-t border-emerald-600/60 flex items-center justify-between text-xs text-emerald-100">
              <span>Đợt thu cơ sở này:</span>
              <span className="font-bold text-white font-mono">{houseHarvests.length} phiếu</span>
            </div>
          </div>

          {/* Danh sách các phiếu vừa nhập */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-slate-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Phiếu thu gần đây
                </h4>
              </div>
              <button
                onClick={onNavigateToHistory}
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-0.5 cursor-pointer"
              >
                Xem tất cả <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {houseHarvests.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                Chưa có phiếu thu nào cho cơ sở này.
              </div>
            ) : (
              <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                {houseHarvests.slice(0, 6).map((item) => (
                  <div
                    key={item.id}
                    className="p-3 bg-slate-50/80 hover:bg-slate-100/70 rounded-2xl border border-slate-200/60 flex items-center justify-between transition"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">{item.date}</span>
                        <span className="text-[10px] text-slate-600 bg-slate-200/80 px-1.5 py-0.2 rounded font-medium">
                          {item.shift}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        <span className="font-semibold text-emerald-800">{item.typeName}</span>
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
