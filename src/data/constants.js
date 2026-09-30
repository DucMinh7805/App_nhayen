export const DEFAULT_HOUSES = [
  { id: 'h1', name: 'Cửa hàng (Kho chính)', address: 'Kho trung tâm', color: 'emerald' },
  { id: 'h2', name: 'Nhà 1 - Bến Tre', address: 'Bến Tre', color: 'blue' },
  { id: 'h3', name: 'Nhà 2 - Cần Giờ', address: 'Cần Giờ, TP.HCM', color: 'amber' },
  { id: 'h4', name: 'Nhà 3 - Gò Công', address: 'Tiền Giang', color: 'purple' },
];

export const NEST_TYPES = [
  { id: 'tho_a', label: 'Tổ thô loại A (Chọn)', defaultPricePer100g: 2900000, color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  { id: 'tho_b', label: 'Tổ thô xô (Loại B)', defaultPricePer100g: 2400000, color: 'bg-blue-100 text-blue-800 border-blue-200' },
  { id: 'chan_yen', label: 'Chân tổ yến', defaultPricePer100g: 2200000, color: 'bg-amber-100 text-amber-800 border-amber-200' },
  { id: 'vun_gay', label: 'Tổ vụn / gãy', defaultPricePer100g: 1800000, color: 'bg-rose-100 text-rose-800 border-rose-200' },
  { id: 'tinh_che', label: 'Yến tinh chế', defaultPricePer100g: 3800000, color: 'bg-purple-100 text-purple-800 border-purple-200' },
];

export const SHIFTS = [
  { id: 'toi_tong', label: 'Tổng hôm / Chiều tối' },
  { id: 'sang', label: 'Ca sáng' },
  { id: 'chieu', label: 'Ca chiều' },
];

export const USERS = [
  { id: 'u1', name: 'Nguyễn Văn A', role: 'staff', label: 'Nhân viên thu hái' },
  { id: 'u2', name: 'Trần Thị B', role: 'staff', label: 'Nhân viên kho' },
  { id: 'u_admin', name: 'Chủ nhà yến (Admin)', role: 'admin', label: 'Quản trị viên' },
];

export const INITIAL_HARVESTS = [
  {
    id: 'harv_1',
    houseId: 'h1',
    houseName: 'Cửa hàng (Kho chính)',
    date: '2026-09-25',
    weight: 1140, // 1140g from hand note
    typeId: 'tho_a',
    typeName: 'Tổ thô loại A (Chọn)',
    shift: 'Tổng hôm / Chiều tối',
    note: 'Tổng hôm 25/9 (phiếu viết tay)',
    staffName: 'Nguyễn Văn A',
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
    staffName: 'Trần Thị B',
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
    staffName: 'Nguyễn Văn A',
    createdAt: '2026-09-22T19:00:00Z',
  },
  {
    id: 'harv_4',
    houseId: 'h4',
    houseName: 'Nhà 3 - Gò Công',
    date: '2026-09-18',
    weight: 650,
    typeId: 'chan_yen',
    typeName: 'Chân tổ yến',
    shift: 'Ca sáng',
    note: 'Thu chân tổ dính thanh gỗ',
    staffName: 'Trần Thị B',
    createdAt: '2026-09-18T09:30:00Z',
  },
  {
    id: 'harv_5',
    houseId: 'h1',
    houseName: 'Cửa hàng (Kho chính)',
    date: '2026-09-15',
    weight: 2100,
    typeId: 'tho_a',
    typeName: 'Tổ thô loại A (Chọn)',
    shift: 'Tổng hôm / Chiều tối',
    note: 'Tổng đợt giữa tháng',
    staffName: 'Nguyễn Văn A',
    createdAt: '2026-09-15T18:00:00Z',
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
    status: 'paid', // 'paid' | 'debt'
    note: 'Giao Viettel Post, đã thanh toán CK',
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
    createdAt: '2026-09-23T11:00:00Z',
  },
];
