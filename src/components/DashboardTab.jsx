import React, { useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  Building2,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  Feather,
  History,
  Package,
  ShoppingBag,
  Wallet,
} from 'lucide-react';

function numericValue(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  const text = String(value ?? '').trim().replace(/[^\d,.-]/g, '');
  if (/^-?\d{1,3}(?:\.\d{3})+(?:,\d+)?$/.test(text)) return Number(text.replace(/\./g, '').replace(',', '.')) || 0;
  if (/^-?\d{1,3}(?:,\d{3})+(?:\.\d+)?$/.test(text)) return Number(text.replace(/,/g, '')) || 0;
  return Number(text.replace(',', '.')) || 0;
}

const weightOf = (record) => Math.max(0, numericValue(record?.weight));
const amountOf = (record) => Math.max(0, numericValue(record?.totalAmount));
const formatWeight = (value) => `${Number(value || 0).toLocaleString('vi-VN', { maximumFractionDigits: 1 })} g`;
const formatMoney = (value) => `${Math.round(Number(value) || 0).toLocaleString('vi-VN')} ₫`;

function compactMoney(value) {
  const amount = Number(value) || 0;
  if (amount >= 1_000_000_000) {
    return `${(amount / 1_000_000_000).toLocaleString('vi-VN', { maximumFractionDigits: 1 })} tỷ ₫`;
  }
  if (amount >= 1_000_000) {
    return `${(amount / 1_000_000).toLocaleString('vi-VN', { maximumFractionDigits: 1 })} triệu ₫`;
  }
  return formatMoney(amount);
}

function dateParts(value) {
  const text = String(value || '');
  const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(text);
  if (iso) return { year: Number(iso[1]), month: Number(iso[2]), day: Number(iso[3]) };
  const local = /^(\d{1,2})\/(\d{1,2})\/(\d{4})/.exec(text);
  if (local) return { year: Number(local[3]), month: Number(local[2]), day: Number(local[1]) };
  return null;
}

function isTransfer(record) {
  return String(record?.id || '').startsWith('trans_');
}

function sum(records, getValue) {
  return records.reduce((total, record) => total + getValue(record), 0);
}

function SelectField({ id, label, value, onChange, children, icon: Icon }) {
  return (
    <div className="min-w-0">
      <label htmlFor={id} className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-600">
        <Icon size={14} aria-hidden="true" className="text-emerald-700" />
        {label}
      </label>
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={onChange}
          className="min-h-11 w-full appearance-none rounded-2xl border border-slate-200 bg-white px-3.5 pr-9 text-sm font-semibold text-slate-800 shadow-sm outline-none transition-colors hover:border-emerald-300 focus:border-emerald-500 motion-reduce:transition-none"
        >
          {children}
        </select>
        <ChevronDown size={16} aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
      </div>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, detail, featured = false, title }) {
  return (
    <article
      className={`group min-w-0 rounded-[1.25rem] border p-3.5 shadow-sm transition-transform duration-200 motion-safe:hover:-translate-y-0.5 motion-reduce:transition-none sm:p-5 ${
        featured
          ? 'col-span-2 border-emerald-800 bg-gradient-to-br from-emerald-800 to-emerald-700 text-white'
          : 'border-[#e2ebe5] bg-white text-slate-900'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <span className={`text-xs font-semibold leading-5 sm:text-sm ${featured ? 'text-emerald-100' : 'text-slate-600'}`}>{label}</span>
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${featured ? 'bg-white/15 text-white' : 'bg-emerald-50 text-emerald-700'}`}>
          <Icon size={18} aria-hidden="true" />
        </span>
      </div>
      <p className={`metric-number mt-3 font-bold tracking-tight tabular-nums ${featured ? 'metric-number-lg text-white' : 'text-slate-900'}`} title={title || value}>
        {value}
      </p>
      <p className={`mt-2 text-xs leading-4 ${featured ? 'text-emerald-100/90' : 'text-slate-500'}`}>{detail}</p>
    </article>
  );
}

function buildTrend(harvests, year, month, mode) {
  let buckets;
  if (!month) {
    buckets = Array.from({ length: 12 }, (_, index) => ({
      key: index + 1,
      label: `T${index + 1}`,
      fullLabel: `Tháng ${index + 1}`,
      weight: 0,
    }));
  } else {
    const days = new Date(year, month, 0).getDate();
    if (mode === 'day') {
      buckets = Array.from({ length: days }, (_, index) => ({
        key: index + 1,
        label: String(index + 1),
        fullLabel: `Ngày ${index + 1}`,
        weight: 0,
      }));
    } else {
      buckets = Array.from({ length: Math.ceil(days / 7) }, (_, index) => {
        const first = index * 7 + 1;
        const last = Math.min((index + 1) * 7, days);
        return {
          key: index,
          label: `${first}–${last}`,
          fullLabel: `Ngày ${first}–${last}`,
          weight: 0,
        };
      });
    }
  }

  harvests.forEach((record) => {
    const date = dateParts(record.date);
    if (!date || date.year !== year || (month && date.month !== month)) return;
    const index = !month ? date.month - 1 : mode === 'day' ? date.day - 1 : Math.floor((date.day - 1) / 7);
    if (buckets[index]) buckets[index].weight += weightOf(record);
  });

  return buckets;
}

export default function DashboardTab({ houses = [], harvests = [], sales = [], inventoryData, session, settings = {}, onNavigate }) {
  const [today, setToday] = useState(() => new Date());
  const currentYear = today.getFullYear();
  const [selectedHouseId, setSelectedHouseId] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState(0);
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear());
  const [chartMode, setChartMode] = useState('week');
  const isAdmin = session?.role === 'admin';

  useEffect(() => {
    const timer = window.setInterval(() => setToday(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  // The caller supplies only houses the current user may see. Filter records here as well
  // so the dashboard never derives a house comparison from an unassigned location.
  const allowedHouseIds = useMemo(() => new Set(houses.map((house) => String(house.id))), [houses]);
  const visibleHarvests = useMemo(
    () => harvests.filter((record) => allowedHouseIds.has(String(record.houseId)) && !isTransfer(record)),
    [harvests, allowedHouseIds],
  );
  const visibleSales = useMemo(
    () => sales.filter((record) => (!record.houseId || allowedHouseIds.has(String(record.houseId))) && !isTransfer(record)),
    [sales, allowedHouseIds],
  );
  const yearOptions = useMemo(() => {
    const years = new Set([currentYear, selectedYear]);
    [...visibleHarvests, ...visibleSales].forEach((record) => {
      const year = dateParts(record.date)?.year;
      if (year) years.add(year);
    });
    return [...years].sort((a, b) => b - a);
  }, [visibleHarvests, visibleSales, selectedYear, currentYear]);

  const effectiveHouseId = houses.some((house) => String(house.id) === selectedHouseId) ? selectedHouseId : 'all';
  const selectedHouseName = houses.find((house) => String(house.id) === effectiveHouseId)?.name;
  const inDatePeriod = (record) => {
    const date = dateParts(record.date);
    return date && date.year === selectedYear && (!selectedMonth || date.month === selectedMonth);
  };
  const periodHarvests = visibleHarvests.filter((record) => inDatePeriod(record)
    && (effectiveHouseId === 'all' || String(record.houseId) === effectiveHouseId));
  // Đơn bán được xuất từ một kho chung; nhà yến trên phiếu cũ không còn là vị trí kho.
  const periodSales = visibleSales.filter(inDatePeriod);

  const totalHarvest = sum(periodHarvests, weightOf);
  const todayHarvests = visibleHarvests.filter((record) => {
    const date = dateParts(record.date);
    return date?.year === today.getFullYear() && date.month === today.getMonth() + 1
      && date.day === today.getDate()
      && (effectiveHouseId === 'all' || String(record.houseId) === effectiveHouseId);
  });
  const yearHarvests = visibleHarvests.filter((record) => dateParts(record.date)?.year === selectedYear
    && (effectiveHouseId === 'all' || String(record.houseId) === effectiveHouseId));
  const todayHarvest = sum(todayHarvests, weightOf);
  const yearHarvest = sum(yearHarvests, weightOf);
  const totalSold = sum(periodSales, weightOf);
  const totalRevenue = sum(periodSales, amountOf);
  const paidRevenue = sum(periodSales.filter((sale) => sale.status === 'paid'), amountOf);
  const debt = sum(periodSales.filter((sale) => sale.status === 'debt'), amountOf);
  const centralStock = inventoryData?.grandTotalStock != null
    ? numericValue(inventoryData.grandTotalStock)
    : sum(harvests, weightOf) - sum(sales, weightOf);

  const trend = buildTrend(periodHarvests, selectedYear, selectedMonth, chartMode);
  const peak = Math.max(0, ...trend.map((bucket) => bucket.weight));
  const periodLabel = selectedMonth ? `Tháng ${selectedMonth}/${selectedYear}` : `Năm ${selectedYear}`;

  const comparison = effectiveHouseId === 'all'
    ? houses.map((house) => ({
      key: String(house.id),
      label: house.name,
      value: sum(periodHarvests.filter((record) => String(record.houseId) === String(house.id)), weightOf),
    })).sort((a, b) => b.value - a.value)
    : [...periodHarvests.reduce((map, record) => {
      const key = String(record.typeId || record.typeName || 'other');
      const previous = map.get(key);
      map.set(key, {
        key,
        label: String(record.typeName || previous?.label || 'Chưa phân loại'),
        value: (previous?.value || 0) + weightOf(record),
      });
      return map;
    }, new Map()).values()].sort((a, b) => b.value - a.value);
  const comparisonMax = Math.max(1, ...comparison.map((item) => item.value));
  const shortcuts = [
    { tab: 'harvest', label: 'Thu hoạch', hint: 'Ghi số gram', icon: Feather },
    { tab: 'sales', label: 'Bán hàng', hint: 'Tạo đơn bán', icon: ShoppingBag },
    { tab: 'inventory', label: 'Xem kho', hint: 'Yến còn lại', icon: Package },
    { tab: 'history', label: 'Lịch sử', hint: 'Tìm phiếu cũ', icon: History },
  ];

  return (
    <section aria-labelledby="dashboard-title" className="space-y-4 pb-3 md:space-y-5">
      <div className="rounded-[1.35rem] border border-emerald-100 bg-[#eaf5ed] px-4 py-4 sm:px-6 sm:py-5">
        <p className="text-xs font-bold text-emerald-700">Sổ yến gia đình</p>
        <h2 id="dashboard-title" className="mt-1 text-xl font-extrabold leading-tight text-[#194b3e] sm:text-2xl">Bắt đầu từ đây</h2>
        <p className="mt-1 text-sm text-[#52665d]">Chọn việc bạn muốn làm, số liệu nằm ngay bên dưới.</p>
      </div>

      <nav aria-label="Chức năng nhanh" className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {shortcuts.map(({ tab, label, hint, icon: Icon }) => (
          <button key={tab} type="button" onClick={() => onNavigate?.(tab)} className="flex min-h-[74px] min-w-0 items-center gap-2.5 rounded-[1.15rem] border border-[#dce8e1] bg-white px-3 text-left text-sm text-[#18312d] shadow-sm transition-colors hover:border-[#91c6aa] hover:bg-[#f4faf6]">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#e7f5eb] text-[#075e4b]"><Icon size={19} aria-hidden="true" /></span>
            <span className="min-w-0 flex-1 leading-tight"><strong className="block font-bold [overflow-wrap:anywhere]">{settings[`${tab}Label`] || label}</strong><small className="mt-1 block text-[11px] leading-4 text-[#71847a]">{hint}</small></span>
            <ChevronRight size={15} aria-hidden="true" className="hidden shrink-0 text-[#71847a] sm:block" />
          </button>
        ))}
      </nav>

      <details className="rounded-[1.15rem] border border-[#e2ebe5] bg-white px-4 py-3 shadow-sm">
        <summary className="flex min-h-9 cursor-pointer list-none items-center justify-between gap-3 text-sm font-bold text-[#18312d]">
          <span className="min-w-0">Báo cáo: {periodLabel}{selectedHouseName ? ` · ${selectedHouseName}` : ''}</span>
          <span className="flex shrink-0 items-center gap-1 text-xs text-[#075e4b]">Đổi lọc <ChevronDown size={16} aria-hidden="true" /></span>
        </summary>
        <div className="grid grid-cols-2 gap-3 border-t border-[#e2ebe5] pt-4 sm:grid-cols-3">
          <div className="col-span-2 sm:col-span-1">
            <SelectField id="dashboard-house" label="Nhà yến" icon={Building2} value={effectiveHouseId} onChange={(event) => setSelectedHouseId(event.target.value)}>
              <option value="all">Tất cả nhà yến</option>
              {houses.map((house) => <option key={house.id} value={String(house.id)}>{house.name}</option>)}
            </SelectField>
          </div>
          <SelectField id="dashboard-month" label="Tháng" icon={CalendarDays} value={selectedMonth} onChange={(event) => setSelectedMonth(Number(event.target.value))}>
            <option value={0}>Cả năm</option>
            {Array.from({ length: 12 }, (_, index) => <option key={index + 1} value={index + 1}>Tháng {index + 1}</option>)}
          </SelectField>
          <SelectField id="dashboard-year" label="Năm" icon={CalendarDays} value={selectedYear} onChange={(event) => setSelectedYear(Number(event.target.value))}>
            {yearOptions.map((year) => <option key={year} value={year}>{year}</option>)}
          </SelectField>
        </div>
        {effectiveHouseId !== 'all' && <p className="mt-3 text-xs leading-5 text-slate-500">Nhà yến chỉ lọc sản lượng thu hoạch. Kho và đơn bán vẫn tính chung.</p>}
      </details>

      <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
        <MetricCard featured icon={Feather} label={`Đã thu · ${periodLabel}`} value={formatWeight(totalHarvest)} detail={`${periodHarvests.length} phiếu thu hoạch`} />
        <MetricCard icon={CalendarDays} label="Hôm nay" value={formatWeight(todayHarvest)} detail={`${todayHarvests.length} phiếu đã ghi`} />
        <MetricCard icon={Package} label="Kho đang có" value={formatWeight(centralStock)} detail="Tồn kho chung hiện tại" />
      </div>

      <details className="rounded-[1.25rem] border border-[#e2ebe5] bg-white px-4 py-3 shadow-sm">
        <summary className="flex min-h-9 cursor-pointer list-none items-center justify-between gap-3 text-sm font-bold text-[#075e4b]">Xem thêm số liệu <ChevronDown size={17} aria-hidden="true" /></summary>
        <div className="mt-3 grid grid-cols-1 gap-2.5 border-t border-[#e2ebe5] pt-3 sm:grid-cols-2 sm:gap-3">
          {selectedMonth > 0 && <MetricCard icon={BarChart3} label={`Cả năm ${selectedYear}`} value={formatWeight(yearHarvest)} detail={`${yearHarvests.length} phiếu thu hoạch`} />}
          <MetricCard icon={ShoppingBag} label="Đã bán trong kỳ" value={formatWeight(totalSold)} detail={`${periodSales.length} đơn từ kho chung`} />
          {isAdmin && <>
            <MetricCard icon={Wallet} label="Doanh thu" value={compactMoney(totalRevenue)} title={formatMoney(totalRevenue)} detail={`Đã thu ${compactMoney(paidRevenue)}`} />
            <MetricCard icon={Wallet} label="Công nợ" value={compactMoney(debt)} title={formatMoney(debt)} detail="Đơn chưa thanh toán" />
          </>}
        </div>
      </details>

      <details className="rounded-[1.25rem] border border-[#e2ebe5] bg-white px-3 py-3 shadow-sm sm:px-4">
        <summary className="flex min-h-9 cursor-pointer list-none items-center justify-between gap-3 px-1 text-sm font-bold text-[#075e4b]">Biểu đồ và sản lượng {effectiveHouseId === 'all' ? 'từng nhà' : 'theo loại tổ'} <ChevronDown size={17} aria-hidden="true" /></summary>
      <div className="mt-3 grid gap-4 border-t border-[#e2ebe5] pt-3 xl:grid-cols-[minmax(0,1.65fr)_minmax(18rem,1fr)] xl:gap-5">
        <section aria-labelledby="production-trend-title" className="min-w-0 rounded-[1.5rem] border border-[#e2ebe5] bg-white p-4 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700"><BarChart3 size={17} aria-hidden="true" /></span>
                <h3 id="production-trend-title" className="text-base font-bold text-slate-900">Nhịp thu hoạch</h3>
              </div>
              <p className="mt-1 text-xs text-slate-500">{selectedMonth ? (chartMode === 'week' ? 'Theo từng tuần trong tháng' : 'Theo từng ngày trong tháng') : 'Theo từng tháng trong năm'}</p>
            </div>
            {selectedMonth > 0 && (
              <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1" role="group" aria-label="Cách xem biểu đồ">
                <button type="button" aria-pressed={chartMode === 'week'} onClick={() => setChartMode('week')} className={`min-h-8 rounded-lg px-3 text-xs font-semibold transition-colors motion-reduce:transition-none ${chartMode === 'week' ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>Tuần</button>
                <button type="button" aria-pressed={chartMode === 'day'} onClick={() => setChartMode('day')} className={`min-h-8 rounded-lg px-3 text-xs font-semibold transition-colors motion-reduce:transition-none ${chartMode === 'day' ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>Ngày</button>
              </div>
            )}
          </div>

          {peak === 0 ? (
            <div className="mt-5 flex min-h-48 flex-col items-center justify-center rounded-2xl bg-slate-50 px-4 text-center">
              <Feather size={25} aria-hidden="true" className="text-emerald-300" />
              <p className="mt-2 text-sm font-semibold text-slate-700">Chưa có sản lượng trong khoảng này</p>
              <p className="mt-1 text-xs text-slate-500">Bạn có thể chọn tháng, năm hoặc nhà yến khác để xem.</p>
            </div>
          ) : (
            <>
              <div role="img" aria-label={`Biểu đồ sản lượng ${periodLabel.toLowerCase()}, cao nhất ${formatWeight(peak)} trong một kỳ`} className="relative mt-6 h-44 sm:h-52">
                <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 border-t border-dashed border-slate-200" />
                <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-1/2 border-t border-dashed border-slate-200" />
                <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 border-t border-slate-200" />
                <div aria-hidden="true" className="absolute inset-0 grid items-end gap-1.5 sm:gap-2" style={{ gridTemplateColumns: `repeat(${trend.length}, minmax(0, 1fr))` }}>
                  {trend.map((bucket) => (
                    <div key={bucket.key} className="flex h-full items-end justify-center" title={`${bucket.fullLabel}: ${formatWeight(bucket.weight)}`}>
                      <div className={`w-full max-w-11 rounded-t-md bg-gradient-to-t from-emerald-700 to-emerald-400 transition-[height] duration-300 motion-reduce:transition-none ${bucket.weight ? 'min-h-1.5' : 'bg-slate-200'}`} style={{ height: bucket.weight ? `${Math.max(4, (bucket.weight / peak) * 100)}%` : '2px' }} />
                    </div>
                  ))}
                </div>
              </div>
              <div aria-hidden="true" className="mt-2 grid gap-1.5 text-center text-[10px] font-medium text-slate-500 sm:gap-2" style={{ gridTemplateColumns: `repeat(${trend.length}, minmax(0, 1fr))` }}>
                {trend.map((bucket, index) => {
                  const showLabel = trend.length <= 12 || index === 0 || index === trend.length - 1 || index % 5 === 4;
                  return <span key={bucket.key} className="truncate">{showLabel ? bucket.label : ''}</span>;
                })}
              </div>
              <details className="group mt-5 border-t border-slate-100 pt-3 text-xs text-slate-600">
                <summary className="w-fit cursor-pointer rounded-lg py-1 font-semibold text-emerald-800 hover:text-emerald-900">Xem số liệu từng kỳ</summary>
                <ul className="mt-3 max-h-52 overflow-y-auto rounded-xl bg-slate-50 p-3" aria-label="Sản lượng từng kỳ">
                  {trend.map((bucket) => <li key={bucket.key} className="flex justify-between gap-4 border-b border-slate-200/70 py-1.5 last:border-0"><span>{bucket.fullLabel}</span><strong className="tabular-nums text-slate-800">{formatWeight(bucket.weight)}</strong></li>)}
                </ul>
              </details>
            </>
          )}
        </section>

        <section aria-labelledby="production-breakdown-title" className="min-w-0 rounded-[1.5rem] border border-[#e2ebe5] bg-white p-4 shadow-sm sm:p-6">
          <h3 id="production-breakdown-title" className="text-base font-bold text-slate-900">{effectiveHouseId === 'all' ? 'Theo từng nhà yến' : 'Theo loại tổ'}</h3>
          <p className="mt-1 text-xs text-slate-500">Sản lượng thu trong {periodLabel.toLowerCase()}</p>
          {comparison.length === 0 || comparison.every((item) => item.value === 0) ? (
            <p className="mt-7 rounded-2xl bg-slate-50 p-5 text-center text-sm text-slate-500">Chưa có dữ liệu để so sánh.</p>
          ) : (
            <ul className="mt-5 space-y-5">
              {comparison.map((item) => (
                <li key={item.key}>
                  <div className="mb-2 flex items-baseline justify-between gap-3 text-xs">
                    <span className="min-w-0 truncate font-semibold text-slate-700" title={item.label}>{item.label}</span>
                    <strong className="min-w-0 text-right tabular-nums text-slate-900 [overflow-wrap:anywhere]">{formatWeight(item.value)}</strong>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-emerald-50" aria-hidden="true">
                    <div className="h-full rounded-full bg-gradient-to-r from-emerald-700 to-emerald-400 transition-[width] duration-300 motion-reduce:transition-none" style={{ width: `${(item.value / comparisonMax) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
      </details>
    </section>
  );
}
