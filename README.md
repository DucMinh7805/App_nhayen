# 🪺 Mini App Quản Lý Nhà Yến (Yến Sào Manager)

Ứng dụng chuyên nghiệp thiết kế theo định hướng **Mobile-First**, số hóa toàn diện quy trình ghi chép thu hoạch nhà yến (thay thế sổ sách, giấy viết tay), quản lý tồn kho đa cơ sở và quản lý bán hàng.

---

## 🚀 Cách Chạy Ứng Dụng

Ứng dụng đang chạy sẵn tại máy của bạn:
- **Trên máy tính (Local):** [http://localhost:5173/](http://localhost:5173/)
- **Mở trực tiếp trên điện thoại (cùng mạng Wi-Fi):** `http://192.168.2.103:5173/`

Lệnh khởi động khi cần:
```bash
npm install
npm run dev -- --host
```

---

## 🌟 Tính Năng Đã Xây Dựng

### 1. 📥 Thu Hoạch (Harvest Entry - Tối ưu 1 chạm trên điện thoại)
- Chuẩn hóa trực tiếp từ mẫu giấy ghi tay: `Nhà yến + Ngày + Khối lượng (gram) + Tag + Ca thu`.
- Ô nhập gram cực lớn, tự động quy đổi ra `kg`.
- Phím tắt nhanh: `+100g`, `+500g`, `+1kg`, `Xóa trắng` cho phép thợ thao tác 1 tay ngay tại chuồng yến.
- Tự động cộng dồn vào tồn kho ngay khi bấm **Lưu phiếu**.

### 2. 📜 Lịch Sử & Thống Kê Số Liệu
- Lọc linh hoạt theo: Từng nhà yến hoặc toàn bộ, theo tháng (hoặc cả năm), theo loại tổ (Thô A, Thô B, Chân tổ, Vụn...).
- Thống kê chỉ số KPI: Tổng sản lượng (g & kg), số lượt thu, sản lượng trung bình mỗi đợt.
- Nút **Xuất Excel (.xlsx)** trích xuất báo cáo có sẵn tiếng Việt.

### 3. 🏢 Quản Lý Hàng Tồn Kho Theo Quy Mô Từng Nhà
- Công thức: `Tồn kho = Tổng thu hoạch − Tổng xuất bán`.
- Bóc tách số lượng chi tiết từng chủng loại tổ yến trong từng nhà.
- Định giá quy mô: Ước tính giá trị tiền hàng tồn kho dựa theo giá thị trường.
- Cảnh báo tồn thấp (< 1.5 kg) cho từng cơ sở.
- Hỗ trợ **Luân chuyển kho nội bộ** giữa các nhà (ví dụ chuyển yến từ nhà nuôi về kho trung tâm).

### 4. 💰 Buôn Bán & Xuất Kho Tự Động Trừ Tồn
- Chọn xuất bán từ nhà yến nào → Tồn kho nhà đó tự động giảm trừ tương ứng.
- Tính tiền tự động theo đơn giá / 100g.
- Quản lý công nợ: Phân loại **Đã thanh toán** và **Ghi nợ** (bấm 1 chạm để cập nhật khi khách trả nợ).

### 5. 👥 Phân Quyền & Sao Lưu Dữ Liệu
- Nút chuyển đổi nhanh quyền ở góc trên:
  - **Nhân viên / Thợ:** Giao diện tối giản để nhập liệu nhanh.
  - **Chủ nhà yến (Admin):** Toàn quyền xem tài chính, giá trị tồn, công nợ và quản trị.
- Tải file sao lưu dự phòng (JSON) hoặc khôi phục dữ liệu gốc bất cứ lúc nào.
