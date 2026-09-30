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

// Sheet định dạng Việt có thể trả "1.140" thay vì số 1140.
// Dữ liệu số từ API vẫn đi qua nhánh Number để giữ nguyên phần thập phân.
const toFiniteNumber = (value) => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (value == null || value === '') return 0;

  const text = String(value).trim().replace(/[^\d,.-]/g, '');
  if (/^-?\d{1,3}(?:\.\d{3})+(?:,\d+)?$/.test(text)) {
    return Number(text.replace(/\./g, '').replace(',', '.')) || 0;
  }
  if (/^-?\d{1,3}(?:,\d{3})+(?:\.\d+)?$/.test(text)) {
    return Number(text.replace(/,/g, '')) || 0;
  }
  const parsed = Number(text.replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : 0;
};

const createTypeSummary = (typeId, typeName, pricePer100g = 0) => ({
  typeId,
  typeName,
  harvestWeight: 0,
  soldWeight: 0,
  stockWeight: 0,
  shortageWeight: 0,
  pricePer100g,
  estimatedValue: 0,
});

/**
 * Một kho vật lý: mọi nhà là nguồn thu hoạch, mọi đơn bán trừ cùng một kho.
 * `byHouse` được giữ cho báo cáo nguồn sản lượng và dữ liệu cũ; không dùng làm tồn kho vật lý.
 * Danh mục loại tổ có thể truyền vào đối số thứ tư khi admin chỉnh sửa danh mục.
 */
export const calculateInventory = (houses = [], harvests = [], sales = [], nestTypes = NEST_TYPES) => {
  const catalog = new Map((nestTypes || []).map((type) => [String(type.id), type]));
  const byType = Object.create(null);
  const houseMap = Object.create(null);

  const ensureType = (target, typeId, fallbackName) => {
    if (!target[typeId]) {
      const config = catalog.get(typeId);
      target[typeId] = createTypeSummary(
        typeId,
        config?.label || config?.name || fallbackName || 'Chưa phân loại',
        toFiniteNumber(config?.defaultPricePer100g ?? config?.pricePer100g)
      );
    }
    return target[typeId];
  };

  const ensureHouse = (id, name) => {
    const houseId = String(id || 'chua_xac_dinh');
    if (!houseMap[houseId]) {
      houseMap[houseId] = {
        houseId,
        houseName: name || 'Nhà yến chưa xác định',
        totalHarvestWeight: 0,
        totalSoldWeight: 0,
        currentStockWeight: 0, // Tương thích dữ liệu cũ; không phải tồn kho vật lý.
        byType: Object.create(null),
        estimatedValue: 0,
        isPhysicalStock: false,
      };
    }
    return houseMap[houseId];
  };

  (houses || []).forEach((house) => ensureHouse(house.id, house.name));
  (nestTypes || []).forEach((type) => ensureType(byType, String(type.id), type.label || type.name));

  let totalHarvestWeight = 0;
  let totalSoldWeight = 0;

  (harvests || []).forEach((record) => {
    const weight = toFiniteNumber(record.weight);
    const typeId = String(record.inventoryTypeId || record.stockTypeId || record.typeId || 'chua_phan_loai');
    const source = ensureHouse(record.houseId, record.houseName);
    totalHarvestWeight += weight;
    ensureType(byType, typeId, record.inventoryTypeName || record.typeName).harvestWeight += weight;
    source.totalHarvestWeight += weight;
    ensureType(source.byType, typeId, record.inventoryTypeName || record.typeName).harvestWeight += weight;
  });

  (sales || []).forEach((record) => {
    const weight = toFiniteNumber(record.weight);
    // Loại bán có thể khác tên loại hàng; inventoryTypeId nối về hàng thật trong kho.
    const typeId = String(record.inventoryTypeId || record.stockTypeId || record.typeId || 'chua_phan_loai');
    totalSoldWeight += weight;
    ensureType(byType, typeId, record.inventoryTypeName || record.typeName).soldWeight += weight;

    // houseId trên đơn cũ chỉ là nhãn lịch sử, không quyết định kho bị trừ.
    if (record.houseId && houseMap[String(record.houseId)]) {
      const source = houseMap[String(record.houseId)];
      source.totalSoldWeight += weight;
      ensureType(source.byType, typeId, record.inventoryTypeName || record.typeName).soldWeight += weight;
    }
  });

  let grandTotalValue = 0;
  let shortageWeight = 0;
  Object.values(byType).forEach((type) => {
    type.stockWeight = type.harvestWeight - type.soldWeight;
    type.shortageWeight = Math.max(0, -type.stockWeight);
    type.estimatedValue = Math.max(0, type.stockWeight) * type.pricePer100g / 100;
    shortageWeight += type.shortageWeight;
    grandTotalValue += type.estimatedValue;
  });

  Object.values(houseMap).forEach((house) => {
    house.currentStockWeight = house.totalHarvestWeight - house.totalSoldWeight;
    Object.values(house.byType).forEach((type) => {
      type.stockWeight = type.harvestWeight - type.soldWeight;
      type.shortageWeight = Math.max(0, -type.stockWeight);
      type.estimatedValue = Math.max(0, type.stockWeight) * type.pricePer100g / 100;
      house.estimatedValue += type.estimatedValue;
    });
  });

  return {
    totalHarvestWeight,
    totalSoldWeight,
    grandTotalStock: totalHarvestWeight - totalSoldWeight,
    grandTotalValue,
    shortageWeight,
    hasNegativeStock: shortageWeight > 0,
    byType,
    byHouse: Object.values(houseMap),
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
    'Khối lượng (kg)': (toFiniteNumber(h.weight) / 1000).toFixed(2),
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
    'Kho xuất': 'Kho tại nhà',
    'Số lượng (g)': s.weight,
    'Đơn giá / 100g': s.pricePer100g,
    'Thành tiền (VND)': s.totalAmount,
    'Trạng thái': s.status === 'paid' ? 'Đã thanh toán' : 'Ghi nợ',
    'Ghi chú': s.note || '',
  }));
  const wsSales = XLSX.utils.json_to_sheet(saleRows);
  XLSX.utils.book_append_sheet(wb, wsSales, 'Bán hàng');

  // Sheet 3: Một kho chung, gồm tổng và chi tiết từng loại hàng.
  const invRows = [
    {
      STT: '',
      'Loại tổ': 'TỔNG KHO TẠI NHÀ',
      'Tổng thu (g)': inventoryData.totalHarvestWeight,
      'Đã bán (g)': inventoryData.totalSoldWeight,
      'Tồn kho (g)': inventoryData.grandTotalStock,
      'Thiếu hụt theo loại (g)': inventoryData.shortageWeight,
      'Đơn giá tham chiếu / 100g': '',
      'Giá trị tồn ước tính (VNĐ)': inventoryData.grandTotalValue,
    },
    ...Object.values(inventoryData.byType || {}).map((type, index) => ({
      STT: index + 1,
      'Loại tổ': type.typeName,
      'Tổng thu (g)': type.harvestWeight,
      'Đã bán (g)': type.soldWeight,
      'Tồn kho (g)': type.stockWeight,
      'Thiếu hụt theo loại (g)': type.shortageWeight,
      'Đơn giá tham chiếu / 100g': type.pricePer100g,
      'Giá trị tồn ước tính (VNĐ)': type.estimatedValue,
    })),
  ];
  const wsInv = XLSX.utils.json_to_sheet(invRows);
  XLSX.utils.book_append_sheet(wb, wsInv, 'Tồn kho hiện tại');

  // Sheet 4: Nguồn sản lượng theo nhà, tách khỏi tồn kho vật lý.
  const sourceRows = inventoryData.byHouse.map((house, index) => ({
    STT: index + 1,
    'Nhà yến': house.houseName,
    'Sản lượng thu (g)': house.totalHarvestWeight,
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(sourceRows), 'Sản lượng theo nhà');

  // Ghi file
  const fileName = `So_lieu_Yen_sao_Minh_Trieu_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, fileName);
};
