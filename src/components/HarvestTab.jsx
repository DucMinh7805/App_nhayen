import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { Calendar, Tag, Clock, FileText, Check, Trash2, ArrowUpRight, Scale } from 'lucide-react';
import { NEST_TYPES, SHIFTS } from '../data/constants';

export default function HarvestTab({
  activeHouse,
  session,
  harvests,
  onAddHarvest,
  onDeleteHarvest,
  onNavigateToHistory,
}) {
  const todayStr = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState('2026-09-25');
  const [weight, setWeight] = useState(1140);
  const [selectedType, setSelectedType] = useState(NEST_TYPES[0]);
  const [selectedShift, setSelectedShift] = useState(SHIFTS[0].label);
  const [note, setNote] = useState('Tổng hôm (phiếu ghi tay)');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const kgValue = ((Number(weight) || 0) / 1000).toFixed(2);

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
    .filter((h) => h.houseId === activeHouse.id)
    .slice(0, 3);

  return (
    <div className="space-y-3.5 max-w-md mx-auto">
      {/* Ghi chú ngữ cảnh tối giản */}
      <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
        <span className="flex items-center gap-1.5 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
          Đang nhập cho: <strong className="text-slate-800">{activeHouse.name}</strong>
        </span>
        <span className="font-mono text-slate-400">Mẫu: 25/9 · 1140g</span>
      </div>

      {savedSuccess && (
        <div className="bg-emerald-700 text-white px-3.5 py-2.5 rounded-2xl text-xs font-semibold flex items-center justify-between shadow-md transition-all">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 stroke-[2.5]" />
            <span>Đã ghi nhận +{weight}g vào kho thành công</span>
          </div>
          <button
            onClick={() => onNavigateToHistory()}
            className="text-[11px] text-emerald-100 hover:text-white underline font-medium"
          >
            Lịch sử
          </button>
        </div>
      )}

      {/* Thẻ nhập liệu chính */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-4">
        {/* Hàng 1: Ngày thu gọn gàng */}
        <div className="flex items-center justify-between gap-2">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-emerald-700" /> Ngày thu
          </label>
          <div className="flex items-center gap-1.5">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs font-semibold text-slate-800 outline-none focus:border-emerald-600"
            />
            <button
              type="button"
              onClick={() => setDate(todayStr)}
              className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-1 rounded-xl border border-emerald-200/60 hover:bg-emerald-100 transition"
            >
              Hôm nay
            </button>
          </div>
        </div>

        {/* Khối nhập số lượng (Ergonomic Hero Number Pad) */}
        <div className="bg-slate-50/70 border border-slate-200/70 rounded-2xl p-3.5 space-y-3">
          <div className="flex justify-between items-baseline">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Khối lượng thu hoạch
            </span>
            <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200/50 tabular-nums">
              ≈ {kgValue} kg
            </span>
          </div>

          <div className="flex items-center justify-center gap-1.5">
            <input
              type="number"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              step="5"
              min="1"
              placeholder="0"
              required
              className="w-full text-center text-4xl font-extrabold font-mono tracking-tight text-slate-900 bg-transparent outline-none tabular-nums"
            />
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0">
              gram
            </span>
          </div>

          {/* Thanh Segmented Pill: Phím tăng nhanh 1 chạm */}
          <div className="grid grid-cols-5 gap-1 pt-1 border-t border-slate-200/60">
            <button
              type="button"
              onClick={() => handleAdjustWeight(50)}
              className="py-1.5 text-xs font-semibold bg-white border border-slate-200/80 hover:bg-slate-100 text-slate-700 rounded-xl transition active:scale-95"
            >
              +50g
            </button>
            <button
              type="button"
              onClick={() => handleAdjustWeight(100)}
              className="py-1.5 text-xs font-semibold bg-white border border-slate-200/80 hover:bg-slate-100 text-slate-700 rounded-xl transition active:scale-95"
            >
              +100g
            </button>
            <button
              type="button"
              onClick={() => handleAdjustWeight(500)}
              className="py-1.5 text-xs font-semibold bg-white border border-slate-200/80 hover:bg-slate-100 text-slate-700 rounded-xl transition active:scale-95"
            >
              +500g
            </button>
            <button
              type="button"
              onClick={() => handleAdjustWeight(1000)}
              className="py-1.5 text-xs font-bold bg-white border border-slate-200/80 hover:bg-slate-100 text-emerald-800 rounded-xl transition active:scale-95"
            >
              +1kg
            </button>
            <button
              type="button"
              onClick={handleResetWeight}
              className="py-1.5 text-xs font-medium bg-rose-50/70 border border-rose-200/60 hover:bg-rose-100 text-rose-700 rounded-xl transition active:scale-95"
            >
              Xóa
            </button>
          </div>
        </div>

        {/* Phân loại tổ yến (Tag Chips) */}
        <div>
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-emerald-700" /> Phân loại tổ
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            {NEST_TYPES.map((type) => {
              const isSelected = selectedType.id === type.id;
              return (
                <button
                  type="button"
                  key={type.id}
                  onClick={() => setSelectedType(type)}
                  className={`px-3 py-2 rounded-xl text-left text-xs transition border flex items-center justify-between ${
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
              placeholder="VD: Tổng hôm..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-medium text-slate-700 outline-none"
            />
          </div>
        </div>

        {/* Nút Submit CTA */}
        <button
          type="submit"
          className="w-full py-3.5 bg-emerald-700 hover:bg-emerald-600 active:scale-[0.99] text-white font-bold rounded-2xl shadow-sm transition flex items-center justify-center gap-2 text-sm cursor-pointer"
        >
          <span>Lưu phiếu thu</span>
          <span className="text-emerald-200 text-xs font-normal">[{activeHouse.name}]</span>
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
            className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-0.5"
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
