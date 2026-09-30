/**
 * services/supabase.js
 * Supabase client + tất cả các hàm CRUD thay thế localStorage
 * Khi chưa có .env.local → tự động fallback về localStorage (chế độ offline/dev)
 */

import { createClient } from '@supabase/supabase-js';
import { DEFAULT_HOUSES, INITIAL_HARVESTS, INITIAL_SALES, NEST_TYPES } from '../data/constants';
import * as XLSX from 'xlsx';

// ─── Khởi tạo Supabase Client ────────────────────────────────────────────────
const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL  || '';
const supabaseKey  = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const IS_CLOUD_MODE = Boolean(supabaseUrl && supabaseKey);

export const supabase = IS_CLOUD_MODE
  ? createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false }, // Dùng custom auth, không cần Supabase Auth
      realtime: { params: { eventsPerSecond: 5 } },
    })
  : null;

// ─── Chuẩn hoá tên cột snake_case (Supabase) ↔ camelCase (App) ──────────────

function toAppHarvest(row) {
  if (!row) return null;
  return {
    id:         row.id,
    houseId:    row.house_id,
    houseName:  row.house_name,
    date:       row.date,
    weight:     row.weight,
    typeId:     row.type_id,
    typeName:   row.type_name,
    shift:      row.shift,
    note:       row.note,
    staffName:  row.staff_name,
    createdAt:  row.created_at,
  };
}

function toDbHarvest(h) {
  return {
    id:         h.id,
    house_id:   h.houseId,
    house_name: h.houseName,
    date:       h.date,
    weight:     h.weight,
    type_id:    h.typeId,
    type_name:  h.typeName,
    shift:      h.shift,
    note:       h.note || '',
    staff_name: h.staffName || '',
  };
}

function toAppSale(row) {
  if (!row) return null;
  return {
    id:             row.id,
    houseId:        row.house_id,
    houseName:      row.house_name,
    date:           row.date,
    customerName:   row.customer_name,
    customerPhone:  row.customer_phone,
    weight:         row.weight,
    typeId:         row.type_id,
    typeName:       row.type_name,
    pricePer100g:   row.price_per_100g,
    totalAmount:    row.total_amount,
    status:         row.status,
    note:           row.note,
    createdAt:      row.created_at,
  };
}

function toDbSale(s) {
  return {
    id:              s.id,
    house_id:        s.houseId,
    house_name:      s.houseName,
    date:            s.date,
    customer_name:   s.customerName,
    customer_phone:  s.customerPhone || '',
    weight:          s.weight,
    type_id:         s.typeId,
    type_name:       s.typeName,
    price_per_100g:  s.pricePer100g || 0,
    total_amount:    s.totalAmount || 0,
    status:          s.status || 'paid',
    note:            s.note || '',
    staff_name:      s.staffName || '',
  };
}

function toAppHouse(row) {
  if (!row) return null;
  return { id: row.id, name: row.name, address: row.address, color: row.color };
}

// ─── LocalStorage Keys (Fallback khi chưa có Supabase) ──────────────────────
const LS = {
  HOUSES:   'nhayen_houses',
  HARVESTS: 'nhayen_harvests',
  SALES:    'nhayen_sales',
};

function lsGet(key, fallback) {
  try {
    const d = localStorage.getItem(key);
    return d ? JSON.parse(d) : null;
  } catch {
    return null;
  }
}

function lsSet(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

// ════════════════════════════════════════════════════════════════════════════
// HOUSES
// ════════════════════════════════════════════════════════════════════════════

export async function getHouses() {
  if (IS_CLOUD_MODE) {
    const { data, error } = await supabase
      .from('houses')
      .select('*')
      .eq('is_active', true)
      .order('created_at');
    if (error) throw error;
    return data.map(toAppHouse);
  }
  return lsGet(LS.HOUSES) || DEFAULT_HOUSES;
}

export async function saveHouses(houses) {
  if (IS_CLOUD_MODE) {
    // Upsert (thêm hoặc cập nhật)
    const rows = houses.map((h) => ({
      id: h.id, name: h.name, address: h.address || '', color: h.color || 'emerald',
    }));
    const { error } = await supabase.from('houses').upsert(rows);
    if (error) throw error;
  } else {
    lsSet(LS.HOUSES, houses);
  }
}

// ════════════════════════════════════════════════════════════════════════════
// HARVESTS
// ════════════════════════════════════════════════════════════════════════════

export async function getHarvests() {
  if (IS_CLOUD_MODE) {
    const { data, error } = await supabase
      .from('harvests')
      .select('*')
      .order('date', { ascending: false })
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data.map(toAppHarvest);
  }
  return lsGet(LS.HARVESTS) || INITIAL_HARVESTS;
}

export async function addHarvest(harvest) {
  if (IS_CLOUD_MODE) {
    const { data, error } = await supabase
      .from('harvests')
      .insert(toDbHarvest(harvest))
      .select();
    if (error) throw error;
    return data.map(toAppHarvest)[0];
  }
  const current = lsGet(LS.HARVESTS) || [];
  const updated = [harvest, ...current];
  lsSet(LS.HARVESTS, updated);
  return harvest;
}

export async function deleteHarvest(id) {
  if (IS_CLOUD_MODE) {
    const { error } = await supabase.from('harvests').delete().eq('id', id);
    if (error) throw error;
    return id;
  }
  const current = lsGet(LS.HARVESTS) || [];
  lsSet(LS.HARVESTS, current.filter((i) => i.id !== id));
  return id;
}

// ════════════════════════════════════════════════════════════════════════════
// SALES
// ════════════════════════════════════════════════════════════════════════════

export async function getSales() {
  if (IS_CLOUD_MODE) {
    const { data, error } = await supabase
      .from('sales')
      .select('*')
      .order('date', { ascending: false })
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data.map(toAppSale);
  }
  return lsGet(LS.SALES) || INITIAL_SALES;
}

export async function addSale(sale) {
  if (IS_CLOUD_MODE) {
    const { data, error } = await supabase
      .from('sales')
      .insert(toDbSale(sale))
      .select();
    if (error) throw error;
    return data.map(toAppSale)[0];
  }
  const current = lsGet(LS.SALES) || [];
  const updated = [sale, ...current];
  lsSet(LS.SALES, updated);
  return sale;
}

export async function deleteSale(id) {
  if (IS_CLOUD_MODE) {
    const { error } = await supabase.from('sales').delete().eq('id', id);
    if (error) throw error;
    return id;
  }
  const current = lsGet(LS.SALES) || [];
  lsSet(LS.SALES, current.filter((i) => i.id !== id));
  return id;
}

export async function updateSaleStatus(id, newStatus) {
  if (IS_CLOUD_MODE) {
    const { data, error } = await supabase
      .from('sales')
      .update({ status: newStatus })
      .eq('id', id)
      .select();
    if (error) throw error;
    return data.map(toAppSale)[0];
  }
  const current = lsGet(LS.SALES) || [];
  const updated = current.map((item) => (item.id === id ? { ...item, status: newStatus } : item));
  lsSet(LS.SALES, updated);
  return updated.find((i) => i.id === id);
}

// ════════════════════════════════════════════════════════════════════════════
// INVENTORY CALCULATION (Pure JS — không phụ thuộc storage)
// ════════════════════════════════════════════════════════════════════════════

export function calculateInventory(houses, harvests, sales) {
  const houseMap = {};

  houses.forEach((h) => {
    houseMap[h.id] = {
      houseId: h.id,
      houseName: h.name,
      totalHarvestWeight: 0,
      totalSoldWeight: 0,
      currentStockWeight: 0,
      byType: {},
      estimatedValue: 0,
    };

    NEST_TYPES.forEach((nt) => {
      houseMap[h.id].byType[nt.id] = {
        typeId: nt.id,
        typeName: nt.label,
        harvestWeight: 0,
        soldWeight: 0,
        stockWeight: 0,
        estimatedValue: 0,
      };
    });
  });

  // Cộng thu hoạch
  harvests.forEach((harv) => {
    if (houseMap[harv.houseId]) {
      const hData = houseMap[harv.houseId];
      hData.totalHarvestWeight += Number(harv.weight || 0);
      const typeId = harv.typeId || 'tho_a';
      if (!hData.byType[typeId]) {
        hData.byType[typeId] = {
          typeId, typeName: harv.typeName || 'Khác',
          harvestWeight: 0, soldWeight: 0, stockWeight: 0, estimatedValue: 0,
        };
      }
      hData.byType[typeId].harvestWeight += Number(harv.weight || 0);
    }
  });

  // Trừ bán hàng
  sales.forEach((s) => {
    if (houseMap[s.houseId]) {
      const hData = houseMap[s.houseId];
      hData.totalSoldWeight += Number(s.weight || 0);
      const typeId = s.typeId || 'tho_a';
      if (hData.byType[typeId]) {
        hData.byType[typeId].soldWeight += Number(s.weight || 0);
      }
    }
  });

  let grandTotalStock = 0;
  let grandTotalValue = 0;

  Object.values(houseMap).forEach((hData) => {
    hData.currentStockWeight = Math.max(0, hData.totalHarvestWeight - hData.totalSoldWeight);
    grandTotalStock += hData.currentStockWeight;

    let hValue = 0;
    Object.values(hData.byType).forEach((tData) => {
      tData.stockWeight = Math.max(0, tData.harvestWeight - tData.soldWeight);
      const nestConfig = NEST_TYPES.find((n) => n.id === tData.typeId);
      const pricePerGram = (nestConfig ? nestConfig.defaultPricePer100g : 2500000) / 100;
      tData.estimatedValue = tData.stockWeight * pricePerGram;
      hValue += tData.estimatedValue;
    });

    hData.estimatedValue = hValue;
    grandTotalValue += hValue;
  });

  return { byHouse: Object.values(houseMap), grandTotalStock, grandTotalValue };
}

// ─── Re-export checkPermission ───────────────────────────────────────────────
export { checkPermission } from './auth';

// ════════════════════════════════════════════════════════════════════════════
// EXCEL EXPORT
// ════════════════════════════════════════════════════════════════════════════

export function exportToExcel(harvests, sales, inventoryData) {
  const wb = XLSX.utils.book_new();

  const wsHarvest = XLSX.utils.json_to_sheet(
    harvests.map((h, i) => ({
      STT: i + 1,
      'Ngày thu': h.date,
      'Nhà yến': h.houseName,
      'Khối lượng (gram)': h.weight,
      'Khối lượng (kg)': (h.weight / 1000).toFixed(2),
      'Loại tổ': h.typeName,
      'Ca thu': h.shift,
      'Người nhập': h.staffName,
      'Ghi chú': h.note || '',
    }))
  );
  XLSX.utils.book_append_sheet(wb, wsHarvest, 'Thu Hoach');

  const wsSales = XLSX.utils.json_to_sheet(
    sales.map((s, i) => ({
      STT: i + 1,
      'Ngày bán': s.date,
      'Khách hàng': s.customerName,
      'SĐT': s.customerPhone || '',
      'Xuất từ nhà': s.houseName,
      'Số lượng (g)': s.weight,
      'Đơn giá / 100g': s.pricePer100g,
      'Thành tiền (VND)': s.totalAmount,
      'Trạng thái': s.status === 'paid' ? 'Đã thanh toán' : 'Ghi nợ',
      'Ghi chú': s.note || '',
    }))
  );
  XLSX.utils.book_append_sheet(wb, wsSales, 'Ban Hang');

  const wsInv = XLSX.utils.json_to_sheet(
    inventoryData.byHouse.map((h, i) => ({
      STT: i + 1,
      'Tên nhà yến': h.houseName,
      'Tổng thu (g)': h.totalHarvestWeight,
      'Đã xuất bán (g)': h.totalSoldWeight,
      'Tồn kho (g)': h.currentStockWeight,
      'Tồn kho (kg)': (h.currentStockWeight / 1000).toFixed(2),
      'Giá trị ước tính (VND)': h.estimatedValue,
    }))
  );
  XLSX.utils.book_append_sheet(wb, wsInv, 'Ton Kho');

  XLSX.writeFile(wb, `So_Lieu_Nha_Yen_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

// ════════════════════════════════════════════════════════════════════════════
// REALTIME SUBSCRIPTION (Khi có Supabase — lắng nghe cập nhật từ mọi thiết bị)
// ════════════════════════════════════════════════════════════════════════════

/**
 * Đăng ký lắng nghe thay đổi realtime từ Supabase
 * App tự động cập nhật khi nhân viên từ điện thoại khác nhập dữ liệu mới
 */
export function subscribeToChanges({ onHarvestChange, onSaleChange, onHouseChange } = {}) {
  if (!IS_CLOUD_MODE || !supabase) return () => {};

  const channel = supabase
    .channel('nhayen_realtime')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'harvests' }, (payload) => {
      if (onHarvestChange) onHarvestChange(payload);
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'sales' }, (payload) => {
      if (onSaleChange) onSaleChange(payload);
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'houses' }, (payload) => {
      if (onHouseChange) onHouseChange(payload);
    })
    .subscribe();

  // Trả về hàm cleanup để hủy subscription khi unmount
  return () => supabase.removeChannel(channel);
}
