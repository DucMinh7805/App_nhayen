import React from 'react';
import { CircleAlert, Package, Scale } from 'lucide-react';
import { NEST_TYPES } from '../data/constants';

export default function InventoryTab({ inventoryData, nestTypes = NEST_TYPES, session }) {
  const stock = Number(inventoryData?.grandTotalStock || 0);
  const harvested = Number(inventoryData?.totalHarvestWeight || 0);
  const sold = Number(inventoryData?.totalSoldWeight || 0);
  const byType = inventoryData?.byType || {};
  const types = [
    ...nestTypes.map((type) => byType[type.id] || {
      typeId: type.id, typeName: type.label, harvestWeight: 0, soldWeight: 0, stockWeight: 0, estimatedValue: 0,
    }),
    ...Object.values(byType).filter((item) => !nestTypes.some((type) => type.id === item.typeId)),
  ];
  const positiveTotal = types.reduce((sum, type) => sum + Math.max(0, Number(type.stockWeight || 0)), 0);
  const isAdmin = session?.role === 'admin';

  return (
    <div className="page-enter space-y-5">
      <section className="rounded-[28px] bg-[#075e4b] p-5 text-white sm:p-7">
        <div className="flex items-start justify-between gap-3">
          <div><p className="text-sm font-semibold text-[#c8e9d3]">Kho duy nhất · tại nhà</p><h2 className="mt-1 text-lg font-extrabold">Tổ yến đang có</h2></div>
          <Package aria-hidden="true" className="h-6 w-6 text-[#c8e9d3]" />
        </div>
        <p className="mt-5 font-['Be_Vietnam_Pro'] text-[clamp(2.6rem,9vw,4.5rem)] font-extrabold leading-none tracking-[-.06em] tabular-nums">{stock.toLocaleString('vi-VN')} <span className="text-xl font-semibold">g</span></p>
        <p className="mt-2 text-sm text-[#c8e9d3]">≈ {(stock / 1000).toLocaleString('vi-VN', { maximumFractionDigits: 2 })} kg</p>
        <div className="mt-6 grid grid-cols-2 gap-3 border-t border-white/20 pt-5">
          <div><span className="block text-xs text-[#c8e9d3]">Đã thu hoạch</span><strong className="mt-1 block text-lg font-extrabold tabular-nums">{harvested.toLocaleString('vi-VN')} g</strong></div>
          <div><span className="block text-xs text-[#c8e9d3]">Đã bán</span><strong className="mt-1 block text-lg font-extrabold tabular-nums">{sold.toLocaleString('vi-VN')} g</strong></div>
        </div>
      </section>
      {inventoryData?.hasNegativeStock && <div role="alert" className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-900"><CircleAlert aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0" /><span>Sổ hiện thiếu {Number(inventoryData.shortageWeight || 0).toLocaleString('vi-VN')} g. Hãy kiểm tra phiếu thu và đơn bán cũ.</span></div>}
      <section className="surface p-4 sm:p-6">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div><p className="eyebrow mb-1">Chi tiết kho</p><h2 className="text-lg font-extrabold">Tồn theo loại tổ</h2></div>
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#e7f5eb] text-[#075e4b]"><Scale aria-hidden="true" className="h-5 w-5" /></div>
        </div>
        <p className="mb-5 text-sm text-[#60736d]">Tất cả nhà yến đưa sản lượng về cùng một kho. Đơn bán tự trừ tại đây.</p>
        {types.length === 0 ? <p className="rounded-2xl bg-[#f8fbf9] p-6 text-center text-sm text-[#60736d]">Chưa có loại tổ nào trong danh mục.</p> : (
          <div className="grid gap-3 md:grid-cols-2">
            {types.map((type) => {
              const amount = Number(type.stockWeight || 0);
              const percent = positiveTotal > 0 ? Math.max(0, amount) / positiveTotal * 100 : 0;
              return <article key={type.typeId} className="rounded-[20px] border border-[#e1ebe3] bg-[#fbfdfb] p-4">
                <div className="flex items-start justify-between gap-3"><h3 className="text-sm font-extrabold">{type.typeName}</h3><strong className={`shrink-0 font-['Be_Vietnam_Pro'] text-lg tabular-nums ${amount < 0 ? 'text-[#b44545]' : 'text-[#075e4b]'}`}>{amount.toLocaleString('vi-VN')} g</strong></div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#e6eee8]" role="img" aria-label={`${type.typeName}: ${amount.toLocaleString('vi-VN')} gram còn lại`}><div className="h-full rounded-full bg-[#3e9c70]" style={{ width: `${percent}%` }} /></div>
                <div className="mt-3 flex items-center justify-between gap-2 text-xs text-[#60736d]"><span>Thu {Number(type.harvestWeight || 0).toLocaleString('vi-VN')} g</span><span>Bán {Number(type.soldWeight || 0).toLocaleString('vi-VN')} g</span></div>
                {isAdmin && Number(type.estimatedValue || 0) > 0 && <p className="mt-3 border-t border-[#e1ebe3] pt-3 text-xs text-[#60736d]">Giá trị tham khảo: <strong className="text-[#41594d]">≈ {Number(type.estimatedValue).toLocaleString('vi-VN')} đ</strong></p>}
              </article>;
            })}
          </div>
        )}
      </section>
    </div>
  );
}
