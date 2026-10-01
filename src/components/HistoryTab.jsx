import React, { useState } from 'react';
import { Download, Filter, Search, ShoppingBag, Sprout, Trash2 } from 'lucide-react';
import { exportToExcel } from '../services/storage';
import { NEST_TYPES } from '../data/constants';

const today = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};
const dateLabel = (value) => {
  const [year, month, day] = String(value || '').split('-');
  return year && month && day ? `${day}/${month}/${year}` : value;
};
const amount = (value) => Number(value || 0).toLocaleString('vi-VN');
const hasTag = (record, tagId) => String(record.tagIds || '').split(',').includes(tagId);

export default function HistoryTab({
  houses = [], harvests = [], sales = [], inventoryData, nestTypes = NEST_TYPES, tags = [],
  session, onRequestDelete,
}) {
  const [currentDate] = useState(today);
  const [kind, setKind] = useState('harvests');
  const [period, setPeriod] = useState('this_month');
  const [month, setMonth] = useState(currentDate.slice(0, 7));
  const [year, setYear] = useState(currentDate.slice(0, 4));
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [houseId, setHouseId] = useState('all');
  const [typeId, setTypeId] = useState('all');
  const [tagId, setTagId] = useState('all');
  const [paymentStatus, setPaymentStatus] = useState('all');
  const [query, setQuery] = useState('');
  const isAdmin = session?.role === 'admin';

  const passesDate = (value) => {
    const date = String(value || '').slice(0, 10);
    if (period === 'today') return date === currentDate;
    if (period === 'this_month') return date.startsWith(currentDate.slice(0, 7));
    if (period === 'this_year') return date.startsWith(currentDate.slice(0, 4));
    if (period === 'month') return date.startsWith(month);
    if (period === 'year') return date.startsWith(year);
    if (period === 'custom') return (!fromDate || date >= fromDate) && (!toDate || date <= toDate);
    if (period === '7days') {
      const cutoff = new Date(`${currentDate}T00:00:00`);
      cutoff.setDate(cutoff.getDate() - 6);
      const first = `${cutoff.getFullYear()}-${String(cutoff.getMonth() + 1).padStart(2, '0')}-${String(cutoff.getDate()).padStart(2, '0')}`;
      return date >= first && date <= currentDate;
    }
    return true;
  };
  const containsQuery = (record) => {
    const q = query.trim().toLocaleLowerCase('vi-VN');
    return !q || [
      record.houseName, record.typeName, record.productName, record.customerName,
      record.customerPhone, record.staffName, record.note,
    ].some((value) => String(value || '').toLocaleLowerCase('vi-VN').includes(q));
  };

  const filteredHarvests = harvests.filter((record) =>
    passesDate(record.date) &&
    (houseId === 'all' || record.houseId === houseId) &&
    (typeId === 'all' || record.typeId === typeId) &&
    (tagId === 'all' || hasTag(record, tagId)) &&
    containsQuery(record)
  );

  const filteredSales = sales.filter((record) =>
    passesDate(record.date) &&
    (typeId === 'all' || record.inventoryTypeId === typeId || record.typeId === typeId) &&
    (tagId === 'all' || hasTag(record, tagId)) &&
    (paymentStatus === 'all' || record.status === paymentStatus) &&
    containsQuery(record)
  );

  const records = kind === 'harvests' ? filteredHarvests : filteredSales;
  const totalWeight = records.reduce((sum, record) => sum + Number(record.weight || 0), 0);
  const totalAmount = filteredSales.reduce((sum, record) => sum + Number(record.totalAmount || 0), 0);

  return (
    <div className="page-enter space-y-5">
      <section className="surface p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex rounded-2xl bg-[#f1f7f3] p-1">
            <button type="button" onClick={() => setKind('harvests')} aria-pressed={kind === 'harvests'} className={`flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-bold ${kind === 'harvests' ? 'bg-[#075e4b] text-white' : 'text-[#60736d]'}`}><Sprout aria-hidden="true" className="h-4 w-4" /> Thu hoạch</button>
            <button type="button" onClick={() => setKind('sales')} aria-pressed={kind === 'sales'} className={`flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-bold ${kind === 'sales' ? 'bg-[#075e4b] text-white' : 'text-[#60736d]'}`}><ShoppingBag aria-hidden="true" className="h-4 w-4" /> Bán hàng</button>
          </div>
          {isAdmin && <button type="button" onClick={() => exportToExcel(filteredHarvests, filteredSales, inventoryData)} className="btn-secondary flex items-center gap-2 text-sm"><Download aria-hidden="true" className="h-4 w-4" /> Xuất Excel theo bộ lọc</button>}
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
          <label><span className="mb-1.5 block text-sm font-semibold text-[#41594d]">Thời gian</span><select className="field" value={period} onChange={(event) => setPeriod(event.target.value)}>
            <option value="this_month">Tháng này</option><option value="today">Hôm nay</option><option value="7days">7 ngày gần đây</option><option value="this_year">Năm nay</option><option value="month">Chọn tháng</option><option value="year">Chọn năm</option><option value="custom">Khoảng ngày</option><option value="all">Tất cả</option>
          </select></label>
          <label className="relative"><span className="mb-1.5 block text-sm font-semibold text-[#41594d]">Tìm kiếm</span><Search aria-hidden="true" className="pointer-events-none absolute bottom-4 left-3 h-4 w-4 text-[#71847a]" /><input className="field pl-9" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tên khách, ghi chú, số điện thoại…" /></label>
        </div>
        {period === 'month' && <label className="mt-3 block"><span className="mb-1.5 block text-sm font-semibold">Chọn tháng</span><input className="field max-w-xs" type="month" value={month} onChange={(event) => setMonth(event.target.value)} /></label>}
        {period === 'year' && <label className="mt-3 block"><span className="mb-1.5 block text-sm font-semibold">Chọn năm</span><select className="field max-w-xs" value={year} onChange={(event) => setYear(event.target.value)}>{Array.from({length: 8}, (_, index) => String(Number(currentDate.slice(0, 4)) - index)).map((value) => <option key={value} value={value}>{value}</option>)}</select></label>}
        {period === 'custom' && <div className="mt-3 grid gap-3 sm:grid-cols-2"><label><span className="mb-1.5 block text-sm font-semibold">Từ ngày</span><input className="field" type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} /></label><label><span className="mb-1.5 block text-sm font-semibold">Đến ngày</span><input className="field" type="date" min={fromDate || undefined} value={toDate} onChange={(event) => setToDate(event.target.value)} /></label></div>}
        <details className="mt-3 rounded-2xl border border-[#e1ebe3] px-3 py-2">
          <summary className="flex min-h-10 cursor-pointer list-none items-center gap-2 text-sm font-semibold text-[#075e4b]"><Filter aria-hidden="true" className="h-4 w-4" /> Lọc thêm theo loại, nhãn{kind === 'harvests' ? ', nhà yến' : ', thanh toán'}</summary>
          <div className="grid gap-3 border-t border-[#e1ebe3] pt-3 sm:grid-cols-2 lg:grid-cols-4">
            {kind === 'harvests' && <label><span className="mb-1.5 block text-sm font-semibold">Nhà yến</span><select className="field" value={houseId} onChange={(event) => setHouseId(event.target.value)}><option value="all">Tất cả nhà</option>{houses.map((house) => <option key={house.id} value={house.id}>{house.name}</option>)}</select></label>}
            <label><span className="mb-1.5 block text-sm font-semibold">Loại tổ</span><select className="field" value={typeId} onChange={(event) => setTypeId(event.target.value)}><option value="all">Tất cả loại</option>{nestTypes.map((type) => <option key={type.id} value={type.id}>{type.label}</option>)}</select></label>
            {tags.length > 0 && <label><span className="mb-1.5 block text-sm font-semibold">Nhãn</span><select className="field" value={tagId} onChange={(event) => setTagId(event.target.value)}><option value="all">Tất cả nhãn</option>{tags.map((tag) => <option key={tag.id} value={tag.id}>{tag.name}</option>)}</select></label>}
            {kind === 'sales' && <label><span className="mb-1.5 block text-sm font-semibold">Thanh toán</span><select className="field" value={paymentStatus} onChange={(event) => setPaymentStatus(event.target.value)}><option value="all">Tất cả</option><option value="paid">Đã thanh toán</option><option value="debt">Ghi nợ</option></select></label>}
          </div>
        </details>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        <div className="surface min-w-0 p-4"><p className="eyebrow">Số phiếu</p><p className="metric-number mt-1 font-['Be_Vietnam_Pro'] font-extrabold tabular-nums">{records.length}</p></div>
        <div className="surface min-w-0 p-4"><p className="eyebrow">{kind === 'harvests' ? 'Đã thu' : 'Đã bán'}</p><p className="metric-number mt-1 font-['Be_Vietnam_Pro'] font-extrabold text-[#075e4b] tabular-nums">{amount(totalWeight)} g</p></div>
        {kind === 'sales' && isAdmin && <div className="surface min-w-0 p-4"><p className="eyebrow">Giá trị đơn</p><p className="metric-number mt-1 font-['Be_Vietnam_Pro'] font-extrabold tabular-nums">{amount(totalAmount)} đ</p></div>}
      </section>

      <section className="surface p-4 sm:p-5">
        <h2 className="mb-4 text-lg font-extrabold">{kind === 'harvests' ? 'Phiếu thu hoạch' : 'Đơn bán hàng'}</h2>
        {records.length === 0 ? <p className="rounded-2xl bg-[#f8fbf9] p-8 text-center text-sm text-[#60736d]">Không có dữ liệu khớp bộ lọc này. Hãy đổi thời gian hoặc từ khóa.</p> : (
          <div className="space-y-2">
            {[...records].sort((a, b) => String(b.date).localeCompare(String(a.date))).map((record) => <article key={record.id} className="flex items-start justify-between gap-3 rounded-2xl border border-[#e1ebe3] bg-[#fbfdfb] p-3.5">
              <div className="min-w-0"><p className="text-sm font-bold">{kind === 'harvests' ? (record.houseName || 'Nhà yến') : (record.customerName || 'Khách lẻ')}</p><p className="mt-1 text-xs text-[#60736d]">{dateLabel(record.date)} · {record.productName || record.typeName || 'Chưa phân loại'}</p>{record.note && <p className="mt-1 truncate text-xs text-[#71847a]">{record.note}</p>}{kind === 'sales' && <span className={`mt-2 inline-block rounded-full px-2 py-0.5 text-[11px] font-bold ${record.status === 'paid' ? 'bg-[#e7f5eb] text-[#075e4b]' : 'bg-amber-100 text-amber-900'}`}>{record.status === 'paid' ? 'Đã thanh toán' : 'Ghi nợ'}</span>}</div>
              <div className="flex shrink-0 items-center gap-1"><div className="text-right"><strong className="font-['Be_Vietnam_Pro'] text-sm text-[#075e4b] tabular-nums">{kind === 'harvests' ? '+' : ''}{amount(record.weight)} g</strong>{kind === 'sales' && isAdmin && <p className="text-xs font-semibold text-[#60736d] tabular-nums">{amount(record.totalAmount)} đ</p>}</div>{isAdmin && <button type="button" onClick={() => onRequestDelete?.(kind === 'harvests' ? 'harvest' : 'sale', record)} aria-label={`Xóa ${kind === 'harvests' ? 'phiếu thu' : 'đơn bán'} ngày ${dateLabel(record.date)}`} className="flex h-10 w-10 items-center justify-center rounded-xl text-[#b44545] hover:bg-red-50"><Trash2 aria-hidden="true" className="h-4 w-4" /></button>}</div>
            </article>)}
          </div>
        )}
      </section>
    </div>
  );
}
