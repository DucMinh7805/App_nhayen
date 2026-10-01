import React, { useEffect, useMemo, useState } from 'react';
import { Check, ChevronDown, ClipboardList, Leaf, Plus, Scale, Trash2 } from 'lucide-react';
import { NEST_TYPES, SHIFTS } from '../data/constants';

const DRAFT_KEY = 'minhtrieu_harvest_draft';
const today = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};
const readDraft = () => {
  try { return JSON.parse(localStorage.getItem(DRAFT_KEY) || '{}'); } catch { return {}; }
};
const formatDate = (value) => {
  const [year, month, day] = String(value || '').split('-');
  return year && month && day ? `${day}/${month}/${year}` : value;
};

export default function HarvestTab({
  activeHouse, houses = [], onSelectHouse, session, harvests = [], nestTypes = NEST_TYPES, tags = [],
  onAddHarvest, onNavigateToHistory, onRequestDelete,
}) {
  const [draft] = useState(readDraft);
  const [date, setDate] = useState(draft.date || today());
  const [weight, setWeight] = useState(draft.weight || '');
  const [typeId, setTypeId] = useState(draft.typeId || nestTypes[0]?.id || NEST_TYPES[0].id);
  const [shift, setShift] = useState(draft.shift || SHIFTS[0].label);
  const [note, setNote] = useState(draft.note || '');
  const [tagIds, setTagIds] = useState(draft.tagIds || '');
  const [pendingId, setPendingId] = useState(
    draft.pendingUserId === session?.userId ? draft.pendingId || '' : ''
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const activeTypes = useMemo(() => nestTypes.filter((type) => type.isActive !== false), [nestTypes]);
  const selectedType = nestTypes.find((type) => type.id === typeId) || activeTypes[0] || NEST_TYPES[0];
  const activeTags = tags.filter((tag) => tag.isActive !== false);
  const houseHarvests = useMemo(() => harvests.filter((item) => item.houseId === activeHouse?.id), [harvests, activeHouse]);
  const todayWeight = houseHarvests.filter((item) => item.date === date).reduce((sum, item) => sum + Number(item.weight || 0), 0);

  useEffect(() => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ date, weight, typeId, shift, note, tagIds, pendingId, pendingUserId: session?.userId }));
    } catch { /* Lưu nháp trên máy là tùy chọn; phiếu chính vẫn phải ghi vào Sheet. */ }
  }, [date, weight, typeId, shift, note, tagIds, pendingId, session?.userId]);

  useEffect(() => {
    if (!nestTypes.some((item) => item.id === typeId && item.isActive !== false) && activeTypes.length) {
      setTypeId(activeTypes[0].id);
    }
  }, [nestTypes, activeTypes, typeId]);

  const addWeight = (grams) => setWeight(String(Math.max(0, Number(weight || 0) + grams)));

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    const grams = Number(weight);
    if (!activeHouse?.id) { setError('Bạn cần chọn nhà yến trước khi lưu.'); return; }
    if (!Number.isFinite(grams) || grams <= 0) { setError('Nhập khối lượng lớn hơn 0 gram.'); return; }
    setSaving(true);
    try {
      const recordId = pendingId || `harv_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      setPendingId(recordId);
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify({ date, weight, typeId, shift, note, tagIds, pendingId: recordId, pendingUserId: session?.userId }));
      } catch { /* Không ảnh hưởng đến lần gửi hiện tại. */ }
      const record = {
        id: recordId,
        houseId: activeHouse.id,
        houseName: activeHouse.name,
        date,
        weight: grams,
        typeId: selectedType.id,
        typeName: selectedType.label,
        shift,
        note: note.trim(),
        tagIds,
        staffName: session?.name || 'Người nhập',
        createdAt: new Date().toISOString(),
      };
      const saved = await onAddHarvest(record);
      setPendingId('');
      if (saved._recoveredFromSheet && saved._inputMatches === false) {
        setError('Phiếu gửi trước đã lưu vào Sheet với thông tin khác. Hãy kiểm tra Lịch sử; nếu đây là phiếu mới, bấm Lưu lần nữa.');
        return;
      }
      setWeight('');
      setNote('');
      setTagIds('');
      setSuccess(saved._recoveredFromSheet
        ? 'Phiếu từ lần gửi trước đã có trong Google Sheet. Hãy kiểm tra Lịch sử.'
        : `Đã lưu ${Number(saved.weight).toLocaleString('vi-VN')} g vào Google Sheet.`);
    } catch (err) {
      setError(err.message || 'Chưa thể lưu phiếu. Kiểm tra kết nối rồi thử lại.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-enter grid gap-5 xl:grid-cols-[minmax(0,1.28fr)_minmax(310px,.72fr)]">
      <form onSubmit={submit} className="surface p-4 sm:p-6">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-extrabold text-[#18312d] sm:text-xl">Ghi thu hoạch</h2>
            <p className="mt-1 text-sm text-[#60736d]">Chọn nhà, nhập số gram rồi lưu.</p>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#e7f5eb] text-[#075e4b]"><Leaf aria-hidden="true" className="h-5 w-5" /></div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-[#41594d]">Nhà yến thu hoạch</span>
            <select className="field" value={activeHouse?.id || ''} onChange={(event) => onSelectHouse?.(houses.find((house) => house.id === event.target.value))} required>
              {houses.map((house) => <option key={house.id} value={house.id}>{house.name}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-[#41594d]">Ngày thu</span>
            <input className="field" type="date" value={date} onChange={(event) => setDate(event.target.value)} required />
          </label>
        </div>

        <div className="surface-soft mt-4 overflow-hidden p-3 text-center sm:p-5">
          <label htmlFor="harvest-weight" className="eyebrow block">Khối lượng vừa thu</label>
          <div className="mx-auto mt-2 flex max-w-[260px] min-w-0 items-baseline justify-center gap-2">
            <input
              id="harvest-weight" type="number" inputMode="numeric" min="1" step="1"
              className="min-w-0 w-full border-0 bg-transparent text-center font-['Be_Vietnam_Pro'] text-[clamp(2rem,9vw,3.25rem)] font-extrabold tracking-[-.06em] text-[#075e4b] outline-none placeholder:text-[#729b83] focus:ring-0"
              value={weight} onChange={(event) => setWeight(event.target.value)} placeholder="0" aria-describedby="harvest-weight-help"
            />
            <span className="text-base font-bold text-[#60736d]">g</span>
          </div>
          <p id="harvest-weight-help" className="mb-4 text-sm text-[#71847a]">{Number(weight) > 0 ? `≈ ${(Number(weight) / 1000).toLocaleString('vi-VN', { maximumFractionDigits: 2 })} kg` : 'Nhập gram hoặc chọn mức cộng nhanh'}</p>
          <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
            {[50, 100, 500, 1000].map((grams) => (
              <button key={grams} type="button" onClick={() => addWeight(grams)} className="btn-secondary min-h-11 min-w-0 whitespace-nowrap px-0.5 text-[11px] sm:text-sm" aria-label={`Cộng ${grams} gram`}>+{grams === 1000 ? '1kg' : `${grams}g`}</button>
            ))}
          </div>
        </div>

        <fieldset className="mt-5">
          <legend className="mb-2 text-sm font-bold text-[#41594d]">Loại tổ</legend>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {activeTypes.map((type) => {
              const selected = selectedType.id === type.id;
              return (
                <button type="button" key={type.id} onClick={() => setTypeId(type.id)} aria-pressed={selected} className={`flex min-h-12 items-center justify-between gap-2 rounded-2xl border px-3 text-left text-sm font-semibold transition-colors ${selected ? 'border-[#075e4b] bg-[#e7f5eb] text-[#075e4b]' : 'border-[#dce8e1] bg-white text-[#52665d] hover:bg-[#f7faf8]'}`}>
                  <span>{type.shortLabel || type.label}</span>
                  {selected && <Check aria-hidden="true" className="h-4 w-4 shrink-0" />}
                </button>
              );
            })}
          </div>
        </fieldset>

        <details className="mt-5 rounded-2xl border border-[#e1ebe3] bg-[#fbfdfb] px-4 py-3">
          <summary className="flex min-h-8 cursor-pointer list-none items-center justify-between text-sm font-semibold text-[#41594d]">Thêm ca thu, tag và ghi chú <ChevronDown aria-hidden="true" className="h-4 w-4" /></summary>
          <div className="mt-4 grid gap-3 border-t border-[#e1ebe3] pt-4">
            <label className="block"><span className="mb-1.5 block text-sm font-semibold">Ca thu</span><select className="field" value={shift} onChange={(event) => setShift(event.target.value)}>{SHIFTS.map((item) => <option key={item.id} value={item.label}>{item.label}</option>)}</select></label>
            {activeTags.length > 0 && <fieldset><legend className="mb-1.5 text-sm font-semibold">Tag</legend><div className="flex flex-wrap gap-2">{activeTags.map((tag) => {
              const chosen = tagIds.split(',').filter(Boolean).includes(tag.id);
              return <button key={tag.id} type="button" aria-pressed={chosen} onClick={() => setTagIds((current) => {
                const ids = current.split(',').filter(Boolean);
                return (chosen ? ids.filter((id) => id !== tag.id) : [...ids, tag.id]).join(',');
              })} className={`min-h-11 rounded-xl border px-3 text-sm font-semibold ${chosen ? 'border-[#075e4b] bg-[#e7f5eb] text-[#075e4b]' : 'border-[#dce8e1] bg-white text-[#52665d]'}`}>{tag.name}</button>;
            })}</div></fieldset>}
            <label className="block"><span className="mb-1.5 block text-sm font-semibold">Ghi chú</span><input className="field" type="text" value={note} onChange={(event) => setNote(event.target.value)} placeholder="Ví dụ: Thu tầng 2" /></label>
          </div>
        </details>

        {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-semibold text-[#a63434]">{error}</p>}
        {success && <p role="status" className="mt-4 flex items-center gap-2 rounded-xl bg-[#e6f3eb] p-3 text-sm font-semibold text-[#075e4b]"><Check aria-hidden="true" className="h-4 w-4" />{success}</p>}

        <button type="submit" disabled={saving || !activeHouse} className="btn-primary mt-5 flex w-full items-center justify-center gap-2">
          {saving ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/50 border-t-white" /> : <Plus aria-hidden="true" className="h-5 w-5" />}
          {saving ? 'Đang lưu vào Sheet…' : 'Lưu phiếu thu hoạch'}
        </button>
        <p className="mt-2 text-center text-xs text-[#71847a]">Nội dung đang nhập được giữ lại trên thiết bị này.</p>
      </form>

      <aside className="space-y-4">
        <section className="rounded-[24px] bg-[#075e4b] p-5 text-white">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-[#c8e9d3]">Đã thu ngày {formatDate(date)}</span>
            <Scale aria-hidden="true" className="h-5 w-5 text-[#c8e9d3]" />
          </div>
          <div className="mt-3 font-['Be_Vietnam_Pro'] text-[2.35rem] font-extrabold leading-none tracking-tight tabular-nums">{todayWeight.toLocaleString('vi-VN')} <span className="text-lg font-semibold">g</span></div>
          <p className="mt-2 text-sm text-[#c8e9d3]">{activeHouse?.name || 'Chưa chọn nhà yến'}</p>
        </section>
        <section className="surface p-4 sm:p-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="flex items-center gap-2 text-base font-extrabold"><ClipboardList aria-hidden="true" className="h-5 w-5 text-[#075e4b]" /> Phiếu gần đây</h3>
            <button type="button" onClick={onNavigateToHistory} className="min-h-11 text-sm font-bold text-[#075e4b]">Xem tất cả</button>
          </div>
          {houseHarvests.length === 0 ? <p className="rounded-2xl bg-[#f7faf8] p-5 text-center text-sm text-[#60736d]">Nhà yến này chưa có phiếu thu.</p> : (
            <div className="space-y-2">
              {houseHarvests.slice(0, 5).map((item) => <div key={item.id} className="flex items-center justify-between gap-3 rounded-2xl border border-[#e2ebe5] bg-[#fbfdfb] p-3">
                <div className="min-w-0"><p className="truncate text-sm font-bold">{item.typeName}</p><p className="text-xs text-[#71847a]">{formatDate(item.date)}{item.shift ? ` · ${item.shift}` : ''}</p></div>
                <div className="flex shrink-0 items-center gap-1"><span className="font-['Be_Vietnam_Pro'] text-sm font-extrabold text-[#075e4b] tabular-nums">+{Number(item.weight || 0).toLocaleString('vi-VN')} g</span>{session?.canDeleteRecords && <button type="button" aria-label={`Xóa phiếu ${formatDate(item.date)}`} onClick={() => onRequestDelete?.('harvest', item)} className="flex h-10 w-10 items-center justify-center rounded-xl text-[#a25757] hover:bg-red-50"><Trash2 aria-hidden="true" className="h-4 w-4" /></button>}</div>
              </div>)}
            </div>
          )}
        </section>
      </aside>
    </div>
  );
}
