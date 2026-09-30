import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, Layers3, Plus, Save, Settings2, ShoppingBag, Tags, X } from 'lucide-react';

const NAV_LABELS = [
  ['dashboardLabel', 'Tổng quan'],
  ['harvestLabel', 'Thu hoạch'],
  ['salesLabel', 'Bán hàng'],
  ['inventoryLabel', 'Kho tại nhà'],
  ['historyLabel', 'Lịch sử'],
  ['housesLabel', 'Nhà yến'],
  ['usersLabel', 'Tài khoản'],
  ['settingsLabel', 'Danh mục & tên gọi'],
];
const COLORS = [
  ['emerald', 'Xanh lá'], ['blue', 'Xanh dương'], ['amber', 'Vàng ấm'],
  ['rose', 'Hồng'], ['purple', 'Tím'],
];
const SECTIONS = [
  { id: 'name', label: 'Tên gọi', icon: Settings2 },
  { id: 'types', label: 'Loại tổ', icon: Layers3 },
  { id: 'products', label: 'Mặt hàng bán', icon: ShoppingBag },
  { id: 'tags', label: 'Nhãn', icon: Tags },
];

function copyConfig(nestTypes, products, tags, settings) {
  return {
    nestTypes: (nestTypes || []).map((item) => ({ ...item, isActive: item.isActive !== false })),
    products: (products || []).map((item) => ({ ...item, isActive: item.isActive !== false })),
    tags: (tags || []).map((item) => ({ ...item, isActive: item.isActive !== false })),
    settings: {
      appName: 'Quản lý Yến sào Minh Triều',
      ...Object.fromEntries(NAV_LABELS.map(([key, label]) => [key, label])),
      ...(settings || {}),
    },
  };
}

function Input({ label, value, onChange, placeholder, maxLength = 100 }) {
  return (
    <label className="block min-w-0">
      <span className="mb-1.5 block text-sm font-semibold text-[#41594d]">{label}</span>
      <input className="field" type="text" value={value ?? ''} maxLength={maxLength}
        onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
    </label>
  );
}

function Price({ label, value, onChange }) {
  const number = Number(value);
  return (
    <label className="block min-w-0">
      <span className="mb-1.5 block text-sm font-semibold text-[#41594d]">{label}</span>
      <div className="relative">
        <input className="field pr-18 tabular-nums" type="number" inputMode="numeric" min="0" step="1000"
          value={value ?? ''} onChange={(event) => onChange(event.target.value)} />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#71847a]">đ / 100 g</span>
      </div>
      <span className="mt-1 block text-xs text-[#71847a]">
        {Number.isFinite(number) ? number.toLocaleString('vi-VN') + ' đ cho 100 g' : 'Nhập đơn giá bằng VNĐ'}
      </span>
    </label>
  );
}

function Color({ value, onChange }) {
  return (
    <label className="block min-w-0">
      <span className="mb-1.5 block text-sm font-semibold text-[#41594d]">Màu nhận diện</span>
      <select className="field" value={value || 'emerald'} onChange={(event) => onChange(event.target.value)}>
        {COLORS.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
      </select>
    </label>
  );
}

function CatalogCard({ collection, item, types, isNew, onChange, onRemove }) {
  const title = collection === 'nestTypes' ? item.label : item.name;
  const noun = collection === 'nestTypes' ? 'loại tổ' : collection === 'products' ? 'mặt hàng' : 'nhãn';
  const set = (field, value) => onChange(item.id, field, value);
  return (
    <article className={'surface p-4 sm:p-5 ' + (item.isActive ? '' : 'opacity-75')}>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate text-base font-bold text-[#18312d]">{title || 'Mới thêm ' + noun}</h3>
          <p className="mt-0.5 text-xs text-[#71847a]">
            {isNew ? 'Chưa lưu vào Google Sheet' : 'Ngừng dùng vẫn giữ nguyên các phiếu cũ'}
          </p>
        </div>
        {isNew ? (
          <button type="button" onClick={() => onRemove(item.id)}
            className="inline-flex min-h-10 items-center gap-1 rounded-xl border border-[#e4e8e3] px-3 text-sm font-semibold text-[#6a7970] hover:bg-[#f3f6f2]">
            <X aria-hidden="true" className="h-4 w-4" /> Bỏ
          </button>
        ) : (
          <button type="button" aria-pressed={item.isActive} onClick={() => set('isActive', !item.isActive)}
            className={'min-h-10 rounded-xl border px-3 text-sm font-semibold transition-colors ' +
              (item.isActive ? 'border-[#a9d3b7] bg-[#eaf6ee] text-[#14604b]' : 'border-[#e2e7e2] bg-[#f4f6f4] text-[#687b70]')}>
            {item.isActive ? 'Đang dùng' : 'Ngừng dùng'}
          </button>
        )}
      </div>
      {collection === 'nestTypes' && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Input label="Tên loại tổ" value={item.label} onChange={(value) => set('label', value)} placeholder="Ví dụ: Tổ thô loại A" />
          <Input label="Tên ngắn" value={item.shortLabel} onChange={(value) => set('shortLabel', value)} placeholder="Ví dụ: Thô A" maxLength={40} />
          <Price label="Giá tham khảo" value={item.defaultPricePer100g} onChange={(value) => set('defaultPricePer100g', value)} />
          <Color value={item.color} onChange={(value) => set('color', value)} />
        </div>
      )}
      {collection === 'products' && (
        <div className="grid gap-3 sm:grid-cols-3">
          <Input label="Tên mặt hàng bán" value={item.name} onChange={(value) => set('name', value)} placeholder="Ví dụ: Tổ đẹp hộp 100 g" />
          <label className="block min-w-0">
            <span className="mb-1.5 block text-sm font-semibold text-[#41594d]">Trừ từ loại tổ trong kho</span>
            <select className="field" value={item.stockTypeId || ''} onChange={(event) => set('stockTypeId', event.target.value)}>
              {!item.stockTypeId && <option value="">Chọn loại tổ</option>}
              {types.map((type) => (
                <option key={type.id} value={type.id}>{type.label}{type.isActive ? '' : ' (ngừng dùng)'}</option>
              ))}
            </select>
          </label>
          <Price label="Giá bán" value={item.pricePer100g} onChange={(value) => set('pricePer100g', value)} />
        </div>
      )}
      {collection === 'tags' && (
        <div className="grid gap-3 sm:grid-cols-2">
          <Input label="Tên nhãn" value={item.name} onChange={(value) => set('name', value)} placeholder="Ví dụ: Tổ đẹp" maxLength={80} />
          <Color value={item.color} onChange={(value) => set('color', value)} />
        </div>
      )}
    </article>
  );
}

export default function SettingsTab({ nestTypes = [], products = [], tags = [], settings = {}, onSaveConfiguration }) {
  const incoming = useMemo(
    () => copyConfig(nestTypes, products, tags, settings),
    [nestTypes, products, tags, settings],
  );
  const [draft, setDraft] = useState(incoming);
  const [section, setSection] = useState('name');
  const [newIds, setNewIds] = useState([]);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const previousProps = useRef(JSON.stringify(incoming));

  useEffect(() => {
    const signature = JSON.stringify(incoming);
    if (signature !== previousProps.current && !dirty && !saving) {
      setDraft(incoming);
      setNewIds([]);
    }
    previousProps.current = signature;
  }, [incoming, dirty, saving]);

  const changeSettings = (key, value) => {
    setDraft((current) => ({ ...current, settings: { ...current.settings, [key]: value } }));
    setDirty(true);
    setFeedback(null);
  };
  const changeItem = (collection, id, field, value) => {
    setDraft((current) => ({
      ...current,
      [collection]: current[collection].map((item) => item.id === id ? { ...item, [field]: value } : item),
    }));
    setDirty(true);
    setFeedback(null);
  };
  const addItem = (collection) => {
    const prefix = collection === 'nestTypes' ? 'loai' : collection === 'products' ? 'hang' : 'nhan';
    const id = prefix + '_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
    const order = Math.max(0, ...draft[collection].map((item) => Number(item.sortOrder || 0))) + 1;
    const item = collection === 'nestTypes'
      ? { id, label: '', shortLabel: '', defaultPricePer100g: '', color: 'emerald', isActive: true, sortOrder: order }
      : collection === 'products'
        ? { id, name: '', stockTypeId: draft.nestTypes.find((type) => type.isActive)?.id || draft.nestTypes[0]?.id || '', pricePer100g: '', isActive: true, sortOrder: order }
        : { id, name: '', color: 'emerald', isActive: true, sortOrder: order };
    setDraft((current) => ({ ...current, [collection]: [...current[collection], item] }));
    setNewIds((current) => [...current, id]);
    setDirty(true);
    setFeedback(null);
  };
  const removeNew = (collection, id) => {
    setDraft((current) => ({ ...current, [collection]: current[collection].filter((item) => item.id !== id) }));
    setNewIds((current) => current.filter((value) => value !== id));
    setDirty(true);
    setFeedback(null);
  };
  const reset = () => {
    setDraft(copyConfig(nestTypes, products, tags, settings));
    setNewIds([]);
    setDirty(false);
    setFeedback(null);
  };

  const save = async () => {
    if (!dirty || saving) return;
    setFeedback(null);
    if (!draft.settings.appName?.trim()) {
      setSection('name');
      setFeedback({ type: 'error', message: 'Vui lòng nhập tên ứng dụng.' });
      return;
    }
    if (draft.nestTypes.some((item) => !item.label?.trim() || !item.shortLabel?.trim())) {
      setSection('types');
      setFeedback({ type: 'error', message: 'Mỗi loại tổ cần có tên đầy đủ và tên ngắn.' });
      return;
    }
    const typeIds = new Set(draft.nestTypes.map((item) => item.id));
    if (draft.products.some((item) => !item.name?.trim() || !typeIds.has(item.stockTypeId))) {
      setSection('products');
      setFeedback({ type: 'error', message: 'Mỗi mặt hàng cần có tên và loại tổ lấy từ kho.' });
      return;
    }
    if (draft.tags.some((item) => !item.name?.trim())) {
      setSection('tags');
      setFeedback({ type: 'error', message: 'Mỗi nhãn cần có tên.' });
      return;
    }
    const prices = [
      ...draft.nestTypes.map((item) => item.defaultPricePer100g),
      ...draft.products.map((item) => item.pricePer100g),
    ];
    if (prices.some((value) => String(value).trim() === '' || !Number.isFinite(Number(value)) || Number(value) < 0)) {
      setFeedback({ type: 'error', message: 'Đơn giá phải là số từ 0 trở lên.' });
      return;
    }
    const payload = {
      nestTypes: draft.nestTypes.map((item) => ({ ...item, label: item.label.trim(), shortLabel: item.shortLabel.trim(), defaultPricePer100g: Number(item.defaultPricePer100g) })),
      products: draft.products.map((item) => ({ ...item, name: item.name.trim(), pricePer100g: Number(item.pricePer100g) })),
      tags: draft.tags.map((item) => ({ ...item, name: item.name.trim() })),
      settings: Object.fromEntries(Object.entries(draft.settings).map(([key, value]) => [key, String(value ?? '').trim()])),
    };
    setSaving(true);
    try {
      const saved = await onSaveConfiguration(payload);
      setDraft(copyConfig(saved?.nestTypes || payload.nestTypes, saved?.products || payload.products,
        saved?.tags || payload.tags, saved?.settings || payload.settings));
      setNewIds([]);
      setDirty(false);
      setFeedback({ type: 'success', message: 'Đã lưu danh mục và tên gọi vào Google Sheet.' });
    } catch (error) {
      setFeedback({ type: 'error', message: error?.message || 'Chưa thể lưu. Vui lòng thử lại.' });
    } finally {
      setSaving(false);
    }
  };

  const count = (items) => items.filter((item) => item.isActive !== false).length;
  const collection = section === 'types' ? 'nestTypes' : section === 'products' ? 'products' : 'tags';
  const sectionInfo = section === 'types'
    ? ['Loại tổ thu hoạch', 'Dùng khi nhập sản lượng và tính tồn kho theo từng loại.', 'Thêm loại tổ']
    : section === 'products'
      ? ['Mặt hàng bán & giá', 'Mỗi mặt hàng chọn một loại tổ trong kho để tự trừ đúng số gram.', 'Thêm mặt hàng']
      : ['Nhãn ghi chú nhanh', 'Gắn nhãn cho phiếu để tìm và lọc lại dễ hơn.', 'Thêm nhãn'];

  return (
    <div className="page-enter space-y-5">
      <section className="surface p-4 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="eyebrow">Dành cho chủ nhà</p>
            <h2 className="mt-1 text-xl font-extrabold text-[#18312d] sm:text-2xl">Danh mục & tên gọi</h2>
            <p className="mt-1 max-w-2xl text-sm text-[#60736d]">Chỉnh một lần, cả nhà dùng chung. Mục ngừng dùng vẫn giữ trong phiếu cũ.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {dirty && <span className="rounded-full bg-[#fff4e8] px-3 py-1.5 text-xs font-bold text-[#9b6225]">Chưa lưu</span>}
            <button type="button" className="btn-primary inline-flex items-center gap-2" onClick={save} disabled={!dirty || saving}>
              {saving ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" /> : <Save aria-hidden="true" className="h-4 w-4" />}
              {saving ? 'Đang lưu…' : 'Lưu thay đổi'}
            </button>
          </div>
        </div>
        {feedback && (
          <div role={feedback.type === 'error' ? 'alert' : 'status'}
            className={'mt-4 flex items-start gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold ' +
              (feedback.type === 'error' ? 'border-[#f1c9c5] bg-[#fff5f3] text-[#a63f3f]' : 'border-[#b8dac4] bg-[#edf8f0] text-[#17644b]')}>
            {feedback.type === 'error'
              ? <AlertCircle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
              : <CheckCircle2 aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />}
            {feedback.message}
          </div>
        )}
      </section>

      <nav aria-label="Phần cài đặt" className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {SECTIONS.map((item) => {
          const Icon = item.icon;
          const selected = section === item.id;
          return (
            <button key={item.id} type="button" onClick={() => setSection(item.id)}
              aria-current={selected ? 'page' : undefined}
              className={'flex min-h-12 items-center justify-center gap-2 rounded-2xl border px-3 text-sm font-bold transition-all ' +
                (selected ? 'border-[#075e4b] bg-[#075e4b] text-white shadow-[0_7px_18px_rgba(7,94,75,.15)]' :
                  'border-[#dce8e1] bg-white text-[#41594d] hover:border-[#9ccbb2] hover:bg-[#f6faf7]')}>
              <Icon aria-hidden="true" className="h-4 w-4 shrink-0" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <fieldset disabled={saving} className="min-w-0">
        <legend className="sr-only">{SECTIONS.find((item) => item.id === section)?.label}</legend>
        {section === 'name' ? (
          <section className="surface space-y-5 p-4 sm:p-6">
            <div>
              <h3 className="text-lg font-bold">Tên ứng dụng</h3>
              <p className="mt-1 text-sm text-[#60736d]">Hiện trên màn hình đăng nhập, đầu trang và thanh điều hướng.</p>
            </div>
            <Input label="Tên hiển thị" value={draft.settings.appName ?? 'Quản lý Yến sào Minh Triều'}
              onChange={(value) => changeSettings('appName', value)} maxLength={80} />
            <div className="border-t border-[#e3ece6] pt-5">
              <h3 className="text-lg font-bold">Tên các mục trong ứng dụng</h3>
              <p className="mt-1 text-sm text-[#60736d]">Đặt tên ngắn, dễ nhận biết trên điện thoại.</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {NAV_LABELS.map(([key, fallback]) => (
                  <Input key={key} label={fallback} value={draft.settings[key] ?? fallback}
                    onChange={(value) => changeSettings(key, value)} maxLength={32} placeholder={fallback} />
                ))}
              </div>
            </div>
          </section>
        ) : (
          <section className="space-y-3">
            <div className="surface flex flex-wrap items-center justify-between gap-3 p-4 sm:p-5">
              <div>
                <h3 className="text-lg font-bold">{sectionInfo[0]} <span className="text-sm font-semibold text-[#71847a]">({count(draft[collection])})</span></h3>
                <p className="mt-1 text-sm text-[#60736d]">{sectionInfo[1]}</p>
              </div>
              <button type="button" className="btn-secondary inline-flex items-center gap-2"
                disabled={collection === 'products' && !draft.nestTypes.length}
                onClick={() => addItem(collection)}>
                <Plus aria-hidden="true" className="h-4 w-4" /> {sectionInfo[2]}
              </button>
            </div>
            {draft[collection].map((item) => (
              <CatalogCard key={item.id} collection={collection} item={item} types={draft.nestTypes}
                isNew={newIds.includes(item.id)}
                onChange={(id, field, value) => changeItem(collection, id, field, value)}
                onRemove={(id) => removeNew(collection, id)} />
            ))}
            {!draft[collection].length && (
              <p className="surface p-6 text-center text-sm text-[#60736d]">
                {collection === 'products' ? 'Thêm loại tổ trước, rồi đặt tên và giá bán ở đây.' : 'Chưa có mục nào. Bạn có thể thêm khi cần.'}
              </p>
            )}
          </section>
        )}
      </fieldset>

      {dirty && (
        <div className="surface flex flex-wrap items-center justify-between gap-3 p-4">
          <p className="text-sm text-[#60736d]">Các thay đổi áp dụng sau khi lưu thành công.</p>
          <div className="flex gap-2">
            <button type="button" className="btn-secondary" onClick={reset} disabled={saving}>Bỏ thay đổi</button>
            <button type="button" className="btn-primary inline-flex items-center gap-2" onClick={save} disabled={saving}>
              <Save aria-hidden="true" className="h-4 w-4" /> {saving ? 'Đang lưu…' : 'Lưu thay đổi'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
