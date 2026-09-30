-- ═══════════════════════════════════════════════════════════════════════════
-- Yến Sào Manager — Supabase Database Schema
-- Chạy toàn bộ file này trong: Supabase Dashboard → SQL Editor → New Query
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── 1. Bảng Nhà Yến / Cơ Sở ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS houses (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  address     TEXT DEFAULT '',
  color       TEXT DEFAULT 'emerald',
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 2. Bảng Phiếu Thu Hoạch ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS harvests (
  id          TEXT PRIMARY KEY,
  house_id    TEXT NOT NULL REFERENCES houses(id) ON DELETE CASCADE,
  house_name  TEXT NOT NULL,
  date        DATE NOT NULL,
  weight      INTEGER NOT NULL CHECK (weight > 0),   -- gram
  type_id     TEXT NOT NULL DEFAULT 'tho_a',
  type_name   TEXT NOT NULL DEFAULT 'Tổ thô loại A',
  shift       TEXT DEFAULT 'Tổng hôm / Chiều tối',
  note        TEXT DEFAULT '',
  staff_name  TEXT DEFAULT '',
  staff_id    TEXT DEFAULT '',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 3. Bảng Đơn Bán / Xuất Kho ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sales (
  id               TEXT PRIMARY KEY,
  house_id         TEXT NOT NULL REFERENCES houses(id) ON DELETE CASCADE,
  house_name       TEXT NOT NULL,
  date             DATE NOT NULL,
  customer_name    TEXT NOT NULL,
  customer_phone   TEXT DEFAULT '',
  weight           INTEGER NOT NULL CHECK (weight > 0),   -- gram
  type_id          TEXT DEFAULT 'tho_a',
  type_name        TEXT DEFAULT 'Tổ thô loại A',
  price_per_100g   BIGINT DEFAULT 0,
  total_amount     BIGINT DEFAULT 0,
  status           TEXT DEFAULT 'paid' CHECK (status IN ('paid', 'debt')),
  note             TEXT DEFAULT '',
  staff_name       TEXT DEFAULT '',
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 4. Bảng Người Dùng App (tuỳ chỉnh, bổ sung Supabase Auth) ───────────────
CREATE TABLE IF NOT EXISTS app_users (
  id              TEXT PRIMARY KEY,
  username        TEXT UNIQUE NOT NULL,
  password_hash   TEXT NOT NULL,
  name            TEXT NOT NULL,
  role            TEXT DEFAULT 'staff' CHECK (role IN ('admin', 'manager', 'staff')),
  allowed_houses  TEXT[] DEFAULT NULL,    -- NULL = toàn quyền; ['h1','h2'] = giới hạn
  can_view_finance   BOOLEAN DEFAULT FALSE,
  can_export         BOOLEAN DEFAULT FALSE,
  can_delete_records BOOLEAN DEFAULT FALSE,
  can_manage_users   BOOLEAN DEFAULT FALSE,
  is_active          BOOLEAN DEFAULT TRUE,
  created_at         TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 5. Dữ liệu mẫu: 4 Nhà Yến mặc định ─────────────────────────────────────
INSERT INTO houses (id, name, address, color) VALUES
  ('h1', 'Cửa hàng (Kho chính)', 'Kho trung tâm', 'emerald'),
  ('h2', 'Nhà 1 - Bến Tre',      'Bến Tre',        'blue'),
  ('h3', 'Nhà 2 - Cần Giờ',      'Cần Giờ, TP.HCM','amber'),
  ('h4', 'Nhà 3 - Gò Công',      'Tiền Giang',     'purple')
ON CONFLICT (id) DO NOTHING;

-- ─── 6. Dữ liệu mẫu: Phiếu thu hoạch ────────────────────────────────────────
INSERT INTO harvests (id, house_id, house_name, date, weight, type_id, type_name, shift, note, staff_name) VALUES
  ('harv_1', 'h1', 'Cửa hàng (Kho chính)', '2026-09-25', 1140, 'tho_a', 'Tổ thô loại A (Chọn)', 'Tổng hôm / Chiều tối', 'Tổng hôm 25/9 (phiếu viết tay)', 'Admin'),
  ('harv_2', 'h2', 'Nhà 1 - Bến Tre',      '2026-09-24',  980, 'tho_b', 'Tổ thô xô (Loại B)',    'Ca sáng',               'Thu cánh phải tầng 2',              'Nhân viên A'),
  ('harv_3', 'h3', 'Nhà 2 - Cần Giờ',      '2026-09-22', 1520, 'tho_a', 'Tổ thô loại A (Chọn)', 'Tổng hôm / Chiều tối', 'Đợt rộ cuối tháng',                 'Admin'),
  ('harv_4', 'h4', 'Nhà 3 - Gò Công',      '2026-09-18',  650, 'chan_yen','Chân tổ yến',          'Ca sáng',               'Thu chân tổ dính thanh gỗ',          'Nhân viên A'),
  ('harv_5', 'h1', 'Cửa hàng (Kho chính)', '2026-09-15', 2100, 'tho_a', 'Tổ thô loại A (Chọn)', 'Tổng hôm / Chiều tối', 'Tổng đợt giữa tháng',               'Admin')
ON CONFLICT (id) DO NOTHING;

-- ─── 7. Dữ liệu mẫu: Đơn bán ────────────────────────────────────────────────
INSERT INTO sales (id, house_id, house_name, date, customer_name, customer_phone, weight, type_id, type_name, price_per_100g, total_amount, status, note) VALUES
  ('sale_1', 'h1', 'Cửa hàng (Kho chính)', '2026-09-26', 'Chị Mai - Bình Dương',        '0903123456', 300, 'tho_a', 'Tổ thô loại A (Chọn)', 2900000, 8700000,  'paid', 'Giao Viettel Post'),
  ('sale_2', 'h2', 'Nhà 1 - Bến Tre',      '2026-09-23', 'Anh Tuấn (Đại lý Sài Gòn)', '0988654321', 500, 'tho_b', 'Tổ thô xô (Loại B)',    2400000, 12000000, 'debt', 'Hẹn thanh toán 05/10')
ON CONFLICT (id) DO NOTHING;

-- ─── 8. Row Level Security (RLS) — Bảo mật theo hàng dữ liệu ─────────────────
-- Bật RLS (mặc định tất cả đều bị chặn trừ khi có policy)
ALTER TABLE houses   ENABLE ROW LEVEL SECURITY;
ALTER TABLE harvests ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales    ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;

-- Policy: Cho phép đọc/ghi toàn bộ với anon key (app tự quản lý auth)
-- Vì app dùng custom auth (SHA-256), không dùng Supabase Auth nên policy rộng
CREATE POLICY "allow_all_houses"   ON houses   FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_harvests" ON harvests FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_sales"    ON sales    FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_users"    ON app_users FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- ─── 9. Indexes để tăng tốc truy vấn ─────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_harvests_house_id   ON harvests (house_id);
CREATE INDEX IF NOT EXISTS idx_harvests_date       ON harvests (date DESC);
CREATE INDEX IF NOT EXISTS idx_sales_house_id      ON sales    (house_id);
CREATE INDEX IF NOT EXISTS idx_sales_date          ON sales    (date DESC);
CREATE INDEX IF NOT EXISTS idx_sales_status        ON sales    (status);
CREATE INDEX IF NOT EXISTS idx_app_users_username  ON app_users (username);

-- ─── Hoàn tất! ────────────────────────────────────────────────────────────────
-- Kiểm tra: SELECT * FROM houses;
