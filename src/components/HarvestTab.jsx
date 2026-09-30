import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { Calendar, Tag, Clock, FileText, Check, Trash2, ArrowUpRight, Scale, Sparkles } from 'lucide-react';
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
      particleCount: 35,
      spread: 50,
      origin: { y: 0.8 },
      colors: ['#047857', '#059669', '#10b981'],
    });

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const recentHouseHarvests = harvests
    .filter((h) => h.houseId === activeHouse?.id)
    .slice(0, 3);

  return (
    <div className="space-y-3.5 max-w-md mx-auto">
      {/* Thẻ thống kê sản lượng thu hôm nay */}
      <div className="bg-gradient-to-r from-emerald-800 to-emerald-700 rounded-2xl p-3.5 text-white shadow-xs flex items-center justify-between">
        <div>
          <div className="text-[10px] uppercase font-bold text-emerald-200 tracking-wider flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-300" /> Thu ngày {date || todayStr}
          </div>
          <div className="text-lg font-black font-mono tracking-tight tabular-nums mt-0.5">
            {todayTotalWeight.toLocaleString()}g{' '}
            <span className="text-xs font-normal text-emerald-200 font-sans">
              ({(todayTotalWeight / 1000).toFixed(2)} kg)
            </span>
          </div>
        </div>
        <div className="text-right text-[11px] text-emerald-100">
          <div className="font-semibold text-white">{activeHouse?.name}</div>
          <div className="text-[10px] text-emerald-200 opacity-80">{recentHouseHarvests.length} đợt thu</div>
        </div>
      </div>

      {savedSuccess && (
        <div className="bg-emerald-700 text-white px-3.5 py-2.5 rounded-2xl text-xs font-semibold flex items-center justify-between shadow-md animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 stroke-[2.5]" />
            <span>Đã ghi nhận +{weight}g vào Google Sheet thành công!</span>
          </div>
          <button
            onClick={() => onNavigateToHistory()}
            className="text-[11px] text-emerald-100 hover:text-white underline font-medium cursor-pointer"
          >
            Lịch sử
          </button>
        </div>
      )}

      {/* Thẻ nhập liệu chính */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-4">
        {/* Hàng 1: Ngày thu gọn gàng */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
            <Calendar className="w-3.5 h-3.5 text-emerald-700" />
            <span>Ngày thu hoạch</span>
          </div>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs font-semibold text-slate-800 outline-none focus:border-emerald-600"
          />
        </div>

        {/* Khối Hero: Số lượng (Gram) & Bàn phím số */}
        <div className="bg-slate-50/80 rounded-2xl p-3.5 border border-slate-200/60 text-center space-y-2">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
            Khối lượng tổ thu được
          </label>

          <div className="flex items-baseline justify-center gap-1.5 py-1">
            <input
              type="number"
              value={weight}
              onChange={(e) => setWeight(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="0"
              className="text-4xl font-black text-emerald-800 font-mono text-center w-48 bg-transparent outline-none tabular-nums"
            />
            <span className="text-sm font-bold text-slate-400 font-mono">gram</span>
          </div>

          <div className="text-xs font-mono text-slate-500 font-medium">
            ≈ <strong className="text-slate-700 font-bold">{kgValue}</strong> kg
          </div>

          {/* Quick adjust chips */}
          <div className="grid grid-cols-5 gap-1 pt-1">
            {[50, 100, 500, 1000].map((step) => (
              <button
                type="button"
                key={step}
                onClick={() => handleAdjustWeight(step)}
                className="py-1.5 bg-white hover:bg-emerald-50 active:bg-emerald-100 border border-slate-200/80 hover:border-emerald-300 rounded-xl text-xs font-mono font-bold text-slate-700 hover:text-emerald-800 transition cursor-pointer"
              >
                +{step >= 1000 ? `${step / 1000}kg` : `${step}g`}
              </button>
            ))}
            <button
              type="button"
              onClick={handleResetWeight}
              className="py-1.5 bg-rose-50 hover:bg-rose-100 active:bg-rose-200 border border-rose-200 rounded-xl text-xs font-bold text-rose-700 transition cursor-pointer"
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
          <div className="grid grid-cols-2 gap-1.5">
            {NEST_TYPES.map((type) => {
              const isSelected = selectedType.id === type.id;
              return (
                <button
                  type="button"
                  key={type.id}
                  onClick={() => setSelectedType(type)}
                  className={`px-3 py-2 rounded-xl text-left text-xs transition border flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-700 text-white font-semibold border-emerald-700 shadow-xs'
                      : 'bg-slate-50/60 hover:bg-slate-100 text-slate-700 font-medium border-slate-200/70'
                  }`}
                >
                  <span className="truncate">{type.label}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 stroke-[2.5] shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Ca thu & Ghi chú ngắn */}
        <div className="grid grid-cols-2 gap-2 pt-0.5">
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-400" /> Ca thu
            </label>
            <select
              value={selectedShift}
              onChange={(e) => setSelectedShift(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-700 outline-none"
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
              placeholder="VD: Thu tầng 2..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-medium text-slate-700 outline-none"
            />
          </div>
        </div>

        {/* Nút Submit CTA */}
        <button
          type="submit"
          className="w-full py-3.5 bg-emerald-700 hover:bg-emerald-600 active:scale-[0.99] text-white font-bold rounded-2xl shadow-md shadow-emerald-700/20 transition flex items-center justify-center gap-2 text-sm cursor-pointer"
        >
          <span>Lưu phiếu thu (+{weight || 0}g)</span>
          <span className="text-emerald-200 text-xs font-normal">[{activeHouse?.name}]</span>
        </button>
      </form>

      {/* Danh sách phiếu gần đây */}
      <div className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-xs space-y-2.5">
        <div className="flex justify-between items-center px-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Vừa nhập gần đây
          </span>
          <button
            onClick={onNavigateToHistory}
            className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-0.5 cursor-pointer"
          >
            Toàn bộ lịch sử <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentHouseHarvests.length === 0 ? (
          <div className="text-center py-4 text-slate-400 text-xs">Chưa có phiếu thu nào hôm nay.</div>
        ) : (
          <div className="space-y-1.5">
            {recentHouseHarvests.map((item) => (
              <div
                key={item.id}
                className="p-2.5 bg-slate-50/80 rounded-xl border border-slate-200/60 flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-800">{item.date}</span>
                    <span className="text-[10px] text-slate-500 bg-slate-200/70 px-1.5 py-0.2 rounded font-medium">
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
                    <div className="text-sm font-extrabold font-mono text-emerald-700 tabular-nums">
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
  );
}
