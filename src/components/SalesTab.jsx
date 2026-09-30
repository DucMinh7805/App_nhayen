import React, { useEffect, useMemo, useState } from 'react';
import { Check, CircleAlert, CircleCheck, MessageCircle, Phone, Search, ShoppingBag, Trash2 } from 'lucide-react';
import { NEST_TYPES } from '../data/constants';

const DRAFT_KEY = 'minhtrieu_sale_draft';
const readDraft = () => {
  try { return JSON.parse(localStorage.getItem(DRAFT_KEY) || '{}'); } catch { return {}; }
};
const money = (value) => Number(value || 0).toLocaleString('vi-VN');
const safePhone = (value) => String(value || '').replace(/[^0-9+]/g, '');
const dateLabel = (value) => {
  const [year, month, day] = String(value || '').split('-');
  return year && month && day ? `${day}/${month}/${year}` : value;
};
const localToday = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};
const newSaleId = () => `sale_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
const nowIso = () => new Date().toISOString();

export default function SalesTab({
  sales = [], inventoryData, products = [], nestTypes = NEST_TYPES, tags = [], session,
  onAddSale, onUpdateSaleStatus, onRequestDelete,
}) {
  const [draft] = useState(readDraft);
  const catalog = useMemo(() => {
    const list = products.length ? products : nestTypes.map((type) => ({
      id: type.id, name: type.label, stockTypeId: type.id, pricePer100g: type.defaultPricePer100g, isActive: type.isActive,
    }));
    return list.filter((product) => product.isActive !== false);
  }, [products, nestTypes]);
  const [productId, setProductId] = useState(draft.productId || catalog[0]?.id || '');
  const [customerName, setCustomerName] = useState(draft.customerName || '');
  const [customerPhone, setCustomerPhone] = useState(draft.customerPhone || '');
  const [weight, setWeight] = useState(draft.weight || '');
  const [pricePer100g, setPricePer100g] = useState(draft.pricePer100g || String(catalog[0]?.pricePer100g || 0));
  const [status, setStatus] = useState(draft.status || 'paid');
  const [note, setNote] = useState(draft.note || '');
  const [tagIds, setTagIds] = useState(draft.tagIds || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [saving, setSaving] = useState(false);
  const [pendingStatusId, setPendingStatusId] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const product = catalog.find((item) => item.id === productId) || catalog[0];
  const stockTypeId = product?.stockTypeId || product?.inventoryTypeId || product?.id;
  const stockType = inventoryData?.byType?.[stockTypeId];
  const stock = Number(stockType?.stockWeight || 0);
  const grams = Number(weight || 0);
  const totalAmount = Math.round(grams / 100 * Number(pricePer100g || 0));
  const insufficient = grams > 0 && grams > stock;
  const activeTags = tags.filter((tag) => tag.isActive !== false);
  const canViewFinance = session?.role === 'admin';

  useEffect(() => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ productId, customerName, customerPhone, weight, pricePer100g, status, note, tagIds }));
  }, [productId, customerName, customerPhone, weight, pricePer100g, status, note, tagIds]);

  useEffect(() => {
    if (catalog.length && !catalog.some((item) => item.id === productId)) {
      setProductId(catalog[0].id);
      setPricePer100g(String(catalog[0].pricePer100g || 0));
    }
  }, [catalog, productId]);

  const chooseProduct = (id) => {
    const chosen = catalog.find((item) => item.id === id);
    setProductId(id);
    setPricePer100g(String(chosen?.pricePer100g || 0));
    setError('');
  };

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    if (!product) { setError('Chưa có loại tổ bán. Chủ nhà cần thêm vào Danh mục.'); return; }
    if (!customerName.trim()) { setError('Nhập tên khách hàng để lưu đơn.'); return; }
    if (!Number.isFinite(grams) || grams <= 0) { setError('Nhập số gram lớn hơn 0.'); return; }
    if (insufficient) { setError(`Kho chỉ còn ${stock.toLocaleString('vi-VN')} g ${product.name}. Hãy giảm số lượng bán.`); return; }
    setSaving(true);
    try {
      const sale = {
        id: newSaleId(),
        houseId: '',
        houseName: 'Kho tại nhà',
        date: localToday(),
        customerName: customerName.trim(),
        customerPhone: safePhone(customerPhone),
        weight: grams,
        productId: product.id,
        productName: product.name,
        inventoryTypeId: stockTypeId,
        typeId: stockTypeId,
        typeName: product.name,
        pricePer100g: Number(pricePer100g || 0),
        totalAmount,
        status,
        note: note.trim(),
        tagIds,
        staffName: session?.name || 'Người bán',
        createdAt: nowIso(),
      };
      await onAddSale(sale);
      setCustomerName('');
      setCustomerPhone('');
      setWeight('');
      setNote('');
      setTagIds('');
      setSuccess('Đã lưu đơn bán vào Google Sheet và trừ tồn kho.');
    } catch (err) {
      setError(err.message || 'Chưa thể lưu đơn. Kiểm tra kết nối rồi thử lại.');
    } finally {
      setSaving(false);
    }
  };

  const changeStatus = async (sale) => {
    setPendingStatusId(sale.id);
    try { await onUpdateSaleStatus(sale.id, sale.status === 'paid' ? 'debt' : 'paid'); }
    catch (err) { setError(err.message || 'Chưa thể cập nhật thanh toán.'); }
    finally { setPendingStatusId(''); }
  };

  const filteredSales = sales.filter((sale) => {
    const query = searchQuery.trim().toLocaleLowerCase('vi-VN');
    return !query || [sale.customerName, sale.customerPhone, sale.productName, sale.typeName].some((value) => String(value || '').toLocaleLowerCase('vi-VN').includes(query));
  });
  const soldWeight = sales.reduce((sum, sale) => sum + Number(sale.weight || 0), 0);
  const totalDebt = sales.filter((sale) => sale.status === 'debt').reduce((sum, sale) => sum + Number(sale.totalAmount || 0), 0);

  return (
    <div className="page-enter space-y-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="surface p-4">
          <p className="eyebrow">Đã bán</p>
          <p className="mt-1 font-['Be_Vietnam_Pro'] text-2xl font-extrabold tabular-nums">{soldWeight.toLocaleString('vi-VN')} g</p>
          <p className="text-sm text-[#60736d]">{sales.length} đơn bán</p>
        </div>
        {canViewFinance && <div className="surface p-4">
          <p className="eyebrow">Công nợ còn thu</p>
          <p className="mt-1 font-['Be_Vietnam_Pro'] text-2xl font-extrabold text-[#9b6225] tabular-nums">{money(totalDebt)} đ</p>
          <p className="text-sm text-[#60736d]">{sales.filter((sale) => sale.status === 'debt').length} đơn ghi nợ</p>
        </div>}
      </div>
      <div className="grid gap-5 xl:grid-cols-[minmax(0,.9fr)_minmax(0,1.1fr)]">
        <form onSubmit={submit} className="surface p-4 sm:p-6">
          <div className="mb-5 flex items-start justify-between gap-3">
            <div><p className="eyebrow mb-1">Xuất từ kho tại nhà</p><h2 className="text-xl font-extrabold">Thêm đơn bán</h2></div>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#e7f5eb] text-[#075e4b]"><ShoppingBag aria-hidden="true" className="h-5 w-5" /></div>
          </div>
          <div className="grid gap-4">
            <label><span className="mb-1.5 block text-sm font-semibold text-[#41594d]">Loại tổ bán</span><select className="field" value={product?.id || ''} onChange={(event) => chooseProduct(event.target.value)} required>{catalog.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
            <div className="grid grid-cols-2 gap-3">
              <label><span className="mb-1.5 block text-sm font-semibold text-[#41594d]">Số lượng (g)</span><input className="field text-lg font-bold tabular-nums" type="number" inputMode="numeric" min="1" step="1" value={weight} onChange={(event) => setWeight(event.target.value)} placeholder="0" required /></label>
              <div className="surface-soft flex flex-col justify-center px-3"><span className="text-xs font-semibold text-[#60736d]">Kho còn</span><strong className="font-['Be_Vietnam_Pro'] text-lg text-[#075e4b] tabular-nums">{stock.toLocaleString('vi-VN')} g</strong></div>
            </div>
            {insufficient && <p role="alert" className="flex items-start gap-2 rounded-xl bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-900"><CircleAlert aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />Số bán lớn hơn tồn kho của loại tổ này.</p>}
            <div className="grid gap-3 sm:grid-cols-2">
              <label><span className="mb-1.5 block text-sm font-semibold text-[#41594d]">Tên khách hàng</span><input className="field" autoComplete="name" type="text" value={customerName} onChange={(event) => setCustomerName(event.target.value)} placeholder="Ví dụ: Chị Mai" required /></label>
              <label><span className="mb-1.5 block text-sm font-semibold text-[#41594d]">Số điện thoại</span><input className="field" autoComplete="tel" type="tel" inputMode="tel" value={customerPhone} onChange={(event) => setCustomerPhone(event.target.value)} placeholder="Không bắt buộc" /></label>
            </div>
            <fieldset>
              <legend className="mb-2 text-sm font-semibold text-[#41594d]">Thanh toán</legend>
              <div className="grid grid-cols-2 gap-2">
                {[['paid', 'Đã thanh toán'], ['debt', 'Ghi nợ']].map(([value, label]) => <button key={value} type="button" aria-pressed={status === value} onClick={() => setStatus(value)} className={`min-h-12 rounded-2xl border px-3 text-sm font-bold ${status === value ? 'border-[#075e4b] bg-[#e7f5eb] text-[#075e4b]' : 'border-[#dce8e1] bg-white text-[#60736d]'}`}>{label}</button>)}
              </div>
            </fieldset>
            <div className="surface-soft grid gap-3 p-3 sm:grid-cols-2">
              <label><span className="mb-1.5 block text-sm font-semibold text-[#41594d]">Giá bán / 100 g</span><input className="field tabular-nums" type="number" inputMode="numeric" min="0" step="1000" value={pricePer100g} onChange={(event) => setPricePer100g(event.target.value)} readOnly={!canViewFinance} aria-readonly={!canViewFinance} /></label>
              <div className="flex flex-col justify-center"><span className="text-xs font-semibold text-[#60736d]">Thành tiền</span><strong className="font-['Be_Vietnam_Pro'] text-xl font-extrabold text-[#075e4b] tabular-nums">{money(totalAmount)} đ</strong></div>
            </div>
            <details className="rounded-2xl border border-[#e1ebe3] px-4 py-3"><summary className="min-h-8 cursor-pointer text-sm font-semibold text-[#41594d]">Thêm tag và ghi chú</summary><div className="mt-3 space-y-3 border-t border-[#e1ebe3] pt-3">
              {activeTags.length > 0 && <fieldset><legend className="mb-2 text-sm font-semibold">Tag</legend><div className="flex flex-wrap gap-2">{activeTags.map((tag) => {
                const selected = tagIds.split(',').filter(Boolean).includes(tag.id);
                return <button key={tag.id} type="button" aria-pressed={selected} onClick={() => setTagIds((current) => {
                  const ids = current.split(',').filter(Boolean);
                  return (selected ? ids.filter((id) => id !== tag.id) : [...ids, tag.id]).join(',');
                })} className={`min-h-11 rounded-xl border px-3 text-sm font-semibold ${selected ? 'border-[#075e4b] bg-[#e7f5eb] text-[#075e4b]' : 'border-[#dce8e1]'}`}>{tag.name}</button>;
              })}</div></fieldset>}
              <label><span className="mb-1.5 block text-sm font-semibold">Ghi chú</span><input className="field" type="text" value={note} onChange={(event) => setNote(event.target.value)} placeholder="Ví dụ: Hẹn giao cuối tuần" /></label>
            </div></details>
          </div>
          {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-semibold text-[#a63434]">{error}</p>}
          {success && <p role="status" className="mt-4 flex items-center gap-2 rounded-xl bg-[#e6f3eb] p-3 text-sm font-semibold text-[#075e4b]"><Check aria-hidden="true" className="h-4 w-4" />{success}</p>}
          <button type="submit" disabled={saving || insufficient || !product} className="btn-primary mt-5 flex w-full items-center justify-center gap-2">{saving ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/50 border-t-white" /> : <Check aria-hidden="true" className="h-5 w-5" />}{saving ? 'Đang lưu đơn…' : 'Lưu đơn bán'}</button>
          <p className="mt-2 text-center text-xs text-[#71847a]">Đơn được lưu lên Sheet và trừ kho sau khi hoàn tất.</p>
        </form>

        <section className="surface p-4 sm:p-5">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div><p className="eyebrow mb-1">Theo dõi khách hàng</p><h2 className="text-lg font-extrabold">Đơn bán gần đây</h2></div>
            <label className="relative w-full sm:w-56"><span className="sr-only">Tìm đơn bán</span><Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#71847a]" /><input className="field pl-9 text-sm" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Tìm khách, số điện thoại…" /></label>
          </div>
          {filteredSales.length === 0 ? <p className="rounded-2xl bg-[#f7faf8] p-6 text-center text-sm text-[#60736d]">Chưa có đơn nào khớp với tìm kiếm.</p> : (
            <div className="space-y-2">
              {filteredSales.slice(0, 15).map((sale) => {
                const phone = safePhone(sale.customerPhone);
                return <article key={sale.id} className="rounded-2xl border border-[#e1ebe3] bg-[#fbfdfb] p-3.5">
                  <div className="flex items-start justify-between gap-3"><div className="min-w-0"><h3 className="truncate text-sm font-extrabold">{sale.customerName || 'Khách lẻ'}</h3><p className="mt-1 text-xs text-[#60736d]">{dateLabel(sale.date)} · {sale.productName || sale.typeName || 'Tổ yến'} · {Number(sale.weight || 0).toLocaleString('vi-VN')} g</p></div><span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${sale.status === 'paid' ? 'bg-[#e7f5eb] text-[#075e4b]' : 'bg-amber-100 text-amber-900'}`}>{sale.status === 'paid' ? 'Đã thu' : 'Ghi nợ'}</span></div>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-[#e1ebe3] pt-3">
                    <div className="flex items-center gap-1">{phone && <><a href={`tel:${phone}`} aria-label={`Gọi ${sale.customerName}`} className="flex min-h-10 items-center gap-1.5 rounded-xl px-2 text-xs font-bold text-[#075e4b] hover:bg-[#e7f5eb]"><Phone aria-hidden="true" className="h-4 w-4" /> Gọi</a><a href={`https://zalo.me/${phone}`} target="_blank" rel="noreferrer" aria-label={`Nhắn Zalo cho ${sale.customerName}`} className="flex min-h-10 items-center gap-1.5 rounded-xl px-2 text-xs font-bold text-[#2563a3] hover:bg-blue-50"><MessageCircle aria-hidden="true" className="h-4 w-4" /> Zalo</a></>}</div>
                    <div className="flex items-center gap-2">
                      {canViewFinance && <strong className="font-['Be_Vietnam_Pro'] text-sm tabular-nums">{money(sale.totalAmount)} đ</strong>}
                      {canViewFinance && <button type="button" disabled={pendingStatusId === sale.id} onClick={() => changeStatus(sale)} aria-label={sale.status === 'paid' ? 'Chuyển đơn sang ghi nợ' : 'Đánh dấu đã thu tiền'} title={sale.status === 'paid' ? 'Chuyển sang ghi nợ' : 'Đã thu tiền'} className="flex h-10 w-10 items-center justify-center rounded-xl text-[#075e4b] hover:bg-[#e7f5eb] disabled:opacity-50"><CircleCheck aria-hidden="true" className="h-5 w-5" /></button>}
                      {session?.canDeleteRecords && <button type="button" onClick={() => onRequestDelete?.('sale', sale)} aria-label={`Xóa đơn của ${sale.customerName}`} className="flex h-10 w-10 items-center justify-center rounded-xl text-[#b44545] hover:bg-red-50"><Trash2 aria-hidden="true" className="h-4 w-4" /></button>}
                    </div>
                  </div>
                </article>;
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
