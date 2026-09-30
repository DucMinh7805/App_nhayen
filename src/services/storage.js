import * as XLSX from 'xlsx';
import { DEFAULT_HOUSES, INITIAL_HARVESTS, INITIAL_SALES, NEST_TYPES } from '../data/constants';

const KEYS = {
  HOUSES: 'nhayen_houses',
  HARVESTS: 'nhayen_harvests',
  SALES: 'nhayen_sales',
};

// Re-export for Header convenience
export { checkPermission } from './auth';


export const getHouses = () => {
  const data = localStorage.getItem(KEYS.HOUSES);
  if (!data) {
    localStorage.setItem(KEYS.HOUSES, JSON.stringify(DEFAULT_HOUSES));
    return DEFAULT_HOUSES;
  }
  try {
    return JSON.parse(data);
  } catch {
    return DEFAULT_HOUSES;
  }
};

export const saveHouses = (houses) => {
  localStorage.setItem(KEYS.HOUSES, JSON.stringify(houses));
};

export const getHarvests = () => {
  const data = localStorage.getItem(KEYS.HARVESTS);
  if (!data) {
    localStorage.setItem(KEYS.HARVESTS, JSON.stringify(INITIAL_HARVESTS));
    return INITIAL_HARVESTS;
  }
  try {
    return JSON.parse(data);
  } catch {
    return INITIAL_HARVESTS;
  }
};

export const saveHarvests = (harvests) => {
  localStorage.setItem(KEYS.HARVESTS, JSON.stringify(harvests));
};

export const addHarvest = (harvest) => {
  const current = getHarvests();
  const updated = [harvest, ...current];
  saveHarvests(updated);
  return updated;
};

export const deleteHarvest = (id) => {
  const current = getHarvests();
  const updated = current.filter((item) => item.id !== id);
  saveHarvests(updated);
  return updated;
};

export const getSales = () => {
  const data = localStorage.getItem(KEYS.SALES);
  if (!data) {
    localStorage.setItem(KEYS.SALES, JSON.stringify(INITIAL_SALES));
    return INITIAL_SALES;
  }
  try {
    return JSON.parse(data);
  } catch {
    return INITIAL_SALES;
  }
};

export const saveSales = (sales) => {
  localStorage.setItem(KEYS.SALES, JSON.stringify(sales));
};

export const addSale = (sale) => {
  const current = getSales();
  const updated = [sale, ...current];
  saveSales(updated);
  return updated;
};

export const deleteSale = (id) => {
  const current = getSales();
  const updated = current.filter((item) => item.id !== id);
  saveSales(updated);
  return updated;
};

export const updateSaleStatus = (id, newStatus) => {
  const current = getSales();
  const updated = current.map((item) => (item.id === id ? { ...item, status: newStatus } : item));
  saveSales(updated);
  return updated;
};

/**
 * Tính toán tồn kho thời gian thực
 * Tồn kho từng nhà = Tổng thu của nhà - Tổng bán xuất từ nhà
 */
export const calculateInventory = (houses, harvests, sales) => {
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

  // Cộng dồn thu hoạch
  harvests.forEach((harv) => {
    if (houseMap[harv.houseId]) {
      const hData = houseMap[harv.houseId];
      hData.totalHarvestWeight += Number(harv.weight || 0);

      const typeId = harv.typeId || 'tho_a';
      if (!hData.byType[typeId]) {
        hData.byType[typeId] = {
          typeId,
          typeName: harv.typeName || 'Chưa phân loại',
          harvestWeight: 0,
          soldWeight: 0,
          stockWeight: 0,
          estimatedValue: 0,
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

  // Tính tồn & định giá
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

  return {
    byHouse: Object.values(houseMap),
    grandTotalStock,
    grandTotalValue,
  };
};

/**
 * Xuất dữ liệu ra file Excel (.xlsx) chuẩn tiếng Việt
 */
export const exportToExcel = (harvests, sales, inventoryData) => {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Thu hoạch
  const harvestRows = harvests.map((h, i) => ({
    STT: i + 1,
    'Ngày thu': h.date,
    'Nhà yến': h.houseName,
    'Khối lượng (gram)': h.weight,
    'Khối lượng (kg)': (h.weight / 1000).toFixed(2),
    'Loại tổ': h.typeName,
    'Ca thu': h.shift,
    'Người nhập': h.staffName,
    'Ghi chú': h.note || '',
  }));
  const wsHarvest = XLSX.utils.json_to_sheet(harvestRows);
  XLSX.utils.book_append_sheet(wb, wsHarvest, 'Thu Hoạch');

  // Sheet 2: Bán hàng
  const saleRows = sales.map((s, i) => ({
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
  }));
  const wsSales = XLSX.utils.json_to_sheet(saleRows);
  XLSX.utils.book_append_sheet(wb, wsSales, 'Ban Hang');

  // Sheet 3: Tồn kho hiện tại
  const invRows = inventoryData.byHouse.map((h, i) => ({
    STT: i + 1,
    'Tên nhà yến': h.houseName,
    'Tổng thu (g)': h.totalHarvestWeight,
    'Đã xuất bán (g)': h.totalSoldWeight,
    'Tồn kho (g)': h.currentStockWeight,
    'Tồn kho (kg)': (h.currentStockWeight / 1000).toFixed(2),
    'Giá trị tồn ước tính (VND)': h.estimatedValue,
  }));
  const wsInv = XLSX.utils.json_to_sheet(invRows);
  XLSX.utils.book_append_sheet(wb, wsInv, 'Ton Kho');

  // Ghi file
  const fileName = `So_Lieu_Nha_Yen_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, fileName);
};
