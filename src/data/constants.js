export const DEFAULT_GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzS9SHQo2A8hJnylC-EnO9lczSpZ2nKribh0QbGQzqTYxZOkcFiX08pdcft3OZHAKC8fg/exec';

export const DEFAULT_HOUSES = [
  { id: 'h1', name: 'Cửa hàng (Kho chính)', address: 'Kho trung tâm', color: 'emerald' },
  { id: 'h2', name: 'Nhà 1 - Bến Tre', address: 'Bến Tre', color: 'blue' },
  { id: 'h3', name: 'Nhà 2 - Cần Giờ', address: 'Cần Giờ, TP.HCM', color: 'amber' },
  { id: 'h4', name: 'Nhà 3 - Gò Công', address: 'Tiền Giang', color: 'purple' },
];

export const NEST_TYPES = [
  { id: 'tho_a', label: 'Tổ thô loại A (Chọn)', shortLabel: 'Thô A', defaultPricePer100g: 2900000, color: 'emerald' },
  { id: 'tho_b', label: 'Tổ thô xô (Loại B)', shortLabel: 'Thô B', defaultPricePer100g: 2400000, color: 'blue' },
  { id: 'chan_yen', label: 'Chân tổ yến', shortLabel: 'Chân yến', defaultPricePer100g: 2200000, color: 'amber' },
  { id: 'vun_gay', label: 'Tổ vụn / gãy', shortLabel: 'Vụn gãy', defaultPricePer100g: 1800000, color: 'rose' },
  { id: 'tinh_che', label: 'Yến tinh chế', shortLabel: 'Tinh chế', defaultPricePer100g: 3800000, color: 'purple' },
];

export const SHIFTS = [
  { id: 'toi_tong', label: 'Tổng hôm / Chiều tối' },
  { id: 'sang', label: 'Ca sáng' },
  { id: 'chieu', label: 'Ca chiều' },
];

export const USERS = [
  { id: 'u_admin', username: 'admin', name: 'Chủ nhà yến (Admin)', role: 'admin', label: 'Quản trị viên' },
  { id: 'u_nv1', username: 'nhanvien1', name: 'Nhân viên A', role: 'staff', label: 'Nhân viên' },
];

export const INITIAL_HARVESTS = [
  {
    id: 'harv_1',
    houseId: 'h1',
    houseName: 'Cửa hàng (Kho chính)',
    date: '2026-09-25',
    weight: 1140,
    typeId: 'tho_a',
    typeName: 'Tổ thô loại A (Chọn)',
    shift: 'Tổng hôm / Chiều tối',
    note: 'Tổng hôm 25/9 (phiếu viết tay)',
    staffName: 'Chủ nhà yến',
    createdAt: '2026-09-25T18:30:00Z',
  },
  {
    id: 'harv_2',
    houseId: 'h2',
    houseName: 'Nhà 1 - Bến Tre',
    date: '2026-09-24',
    weight: 980,
    typeId: 'tho_b',
    typeName: 'Tổ thô xô (Loại B)',
    shift: 'Ca sáng',
    note: 'Thu cánh phải tầng 2',
    staffName: 'Nhân viên A',
    createdAt: '2026-09-24T10:15:00Z',
  },
  {
    id: 'harv_3',
    houseId: 'h3',
    houseName: 'Nhà 2 - Cần Giờ',
    date: '2026-09-22',
    weight: 1520,
    typeId: 'tho_a',
    typeName: 'Tổ thô loại A (Chọn)',
    shift: 'Tổng hôm / Chiều tối',
    note: 'Đợt rộ cuối tháng, tổ trắng đẹp',
    staffName: 'Chủ nhà yến',
    createdAt: '2026-09-22T19:00:00Z',
  },
];

export const INITIAL_SALES = [
  {
    id: 'sale_1',
    houseId: 'h1',
    houseName: 'Cửa hàng (Kho chính)',
    date: '2026-09-26',
    customerName: 'Chị Mai - Bình Dương',
    customerPhone: '0903123456',
    weight: 300,
    typeId: 'tho_a',
    typeName: 'Tổ thô loại A (Chọn)',
    pricePer100g: 2900000,
    totalAmount: 8700000,
    status: 'paid',
    note: 'Giao Viettel Post, đã thanh toán CK',
    staffName: 'Chủ nhà yến',
    createdAt: '2026-09-26T14:20:00Z',
  },
  {
    id: 'sale_2',
    houseId: 'h2',
    houseName: 'Nhà 1 - Bến Tre',
    date: '2026-09-23',
    customerName: 'Anh Tuấn (Đại lý Sài Gòn)',
    customerPhone: '0988654321',
    weight: 500,
    typeId: 'tho_b',
    typeName: 'Tổ thô xô (Loại B)',
    pricePer100g: 2400000,
    totalAmount: 12000000,
    status: 'debt',
    note: 'Hẹn thanh toán ngày 05 tháng sau',
    staffName: 'Nhân viên A',
    createdAt: '2026-09-23T11:00:00Z',
  },
];
