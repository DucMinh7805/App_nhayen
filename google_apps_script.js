/**
 * GOOGLE APPS SCRIPT CHO YẾN SÀO MANAGER
 * 
 * HƯỚNG DẪN CÀI ĐẶT (MẤT 2 PHÚT):
 * 1. Mở Google Sheet: https://docs.google.com/spreadsheets/d/10JpIysPojpEY124UrtVDLusFHto2fiRd1vZaenL_fd4/edit
 * 2. Trên thanh menu, chọn: Tiện ích mở rộng (Extensions) -> Apps Script
 * 3. Xoá hết code cũ trong file Code.gs và DÁN TOÀN BỘ CODE NÀY VÀO.
 * 4. Chạy hàm "setupSheet" một lần:
 *    - Ở trên cùng chọn hàm "setupSheet", bấm nút "Chạy" (Run).
 *    - Google sẽ hỏi cấp quyền -> Chọn tài khoản của bạn -> Nâng cao (Advanced) -> Đi tới dự án (Go to project) -> Cho phép (Allow).
 *    -> Tất cả 4 tab (Houses, Harvests, Sales, Users) và dữ liệu mẫu sẽ tự động được tạo!
 * 5. Bấm nút "Triển khai" (Deploy) -> "Tùy chọn triển khai mới" (New deployment):
 *    - Chọn loại (hình bánh răng): "Ứng dụng web" (Web app)
 *    - Mô tả: "API Yến Sào"
 *    - Thực thi dưới dạng (Execute as): "Tôi" (Me)
 *    - Ai có quyền truy cập (Who has access): "Bất kỳ ai" (Anyone)
 *    - Bấm "Triển khai" (Deploy).
 * 6. Copy "URL ứng dụng web" (dạng https://script.google.com/macros/s/.../exec).
 */

const SHEETS = {
  HOUSES: 'Houses',
  HARVESTS: 'Harvests',
  SALES: 'Sales',
  USERS: 'Users',
};

// ─── HÀM KHỞI TẠO TỰ ĐỘNG CÁC TAB VÀ DỮ LIỆU BAN ĐẦU ─────────────────────
function setupSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // 1. Tab Houses
  let shHouses = ss.getSheetByName(SHEETS.HOUSES);
  if (!shHouses) {
    shHouses = ss.insertSheet(SHEETS.HOUSES);
    shHouses.appendRow(['id', 'name', 'address', 'color', 'createdAt']);
    shHouses.appendRow(['h1', 'Cửa hàng (Kho chính)', 'Kho trung tâm', 'emerald', '2026-01-01']);
    shHouses.appendRow(['h2', 'Nhà 1 - Bến Tre', 'Bến Tre', 'blue', '2026-01-01']);
    shHouses.appendRow(['h3', 'Nhà 2 - Cần Giờ', 'Cần Giờ, TP.HCM', 'amber', '2026-01-01']);
    shHouses.appendRow(['h4', 'Nhà 3 - Gò Công', 'Tiền Giang', 'purple', '2026-01-01']);
    shHouses.getRange('A1:E1').setFontWeight('bold').setBackground('#047857').setFontColor('#ffffff');
  }

  // 2. Tab Harvests
  let shHarv = ss.getSheetByName(SHEETS.HARVESTS);
  if (!shHarv) {
    shHarv = ss.insertSheet(SHEETS.HARVESTS);
    shHarv.appendRow(['id', 'houseId', 'houseName', 'date', 'weight', 'typeId', 'typeName', 'shift', 'note', 'staffName', 'createdAt']);
    shHarv.appendRow(['harv_1', 'h1', 'Cửa hàng (Kho chính)', '2026-09-25', 1140, 'tho_a', 'Tổ thô loại A (Chọn)', 'Tổng hôm / Chiều tối', 'Tổng hôm 25/9 (phiếu viết tay)', 'Chủ nhà yến', new Date().toISOString()]);
    shHarv.getRange('A1:K1').setFontWeight('bold').setBackground('#047857').setFontColor('#ffffff');
  }

  // 3. Tab Sales
  let shSales = ss.getSheetByName(SHEETS.SALES);
  if (!shSales) {
    shSales = ss.insertSheet(SHEETS.SALES);
    shSales.appendRow(['id', 'houseId', 'houseName', 'date', 'customerName', 'customerPhone', 'weight', 'typeId', 'typeName', 'pricePer100g', 'totalAmount', 'status', 'note', 'staffName', 'createdAt']);
    shSales.appendRow(['sale_1', 'h1', 'Cửa hàng (Kho chính)', '2026-09-26', 'Chị Mai - Bình Dương', '0903123456', 300, 'tho_a', 'Tổ thô loại A (Chọn)', 2900000, 8700000, 'paid', 'Giao Viettel Post', 'Chủ nhà yến', new Date().toISOString()]);
    shSales.getRange('A1:O1').setFontWeight('bold').setBackground('#047857').setFontColor('#ffffff');
  }

  // 4. Tab Users
  let shUsers = ss.getSheetByName(SHEETS.USERS);
  if (!shUsers) {
    shUsers = ss.insertSheet(SHEETS.USERS);
    shUsers.appendRow(['id', 'username', 'passwordHash', 'name', 'role', 'allowedHouses', 'canViewFinance', 'canExport', 'canDeleteRecords', 'canManageUsers', 'isActive', 'createdAt']);
    // passwordHash của 'admin123'
    shUsers.appendRow(['u_admin', 'admin', 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3', 'Chủ nhà yến', 'admin', '', 'TRUE', 'TRUE', 'TRUE', 'TRUE', 'TRUE', new Date().toISOString()]);
    // passwordHash của 'quanly123'
    shUsers.appendRow(['u_manager', 'quanly', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'Quản lý', 'manager', '', 'TRUE', 'TRUE', 'FALSE', 'FALSE', 'TRUE', new Date().toISOString()]);
    // passwordHash của 'nv123456'
    shUsers.appendRow(['u_nv1', 'nhanvien1', '9b8769a4a742959a2d0298c36fb70623f2a2d34a916b59e13902dbf2c1a8df0b', 'Nhân viên 1', 'staff', 'h1,h2', 'FALSE', 'FALSE', 'FALSE', 'FALSE', 'TRUE', new Date().toISOString()]);
    shUsers.getRange('A1:L1').setFontWeight('bold').setBackground('#047857').setFontColor('#ffffff');
  }

  // Xoá Sheet1 mặc định nếu có
  const defaultSheet = ss.getSheetByName('Trang tính1') || ss.getSheetByName('Sheet1');
  if (defaultSheet && ss.getSheets().length > 1) {
    ss.deleteSheet(defaultSheet);
  }
}

// ─── XỬ LÝ GET REQUEST ──────────────────────────────────────────────────
function doGet(e) {
  const resource = e.parameter.resource || 'all';
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  let responseData = {};

  if (resource === 'houses' || resource === 'all') {
    const sh = ss.getSheetByName(SHEETS.HOUSES);
    responseData.houses = sh ? getSheetRows(sh) : [];
  }
  if (resource === 'harvests' || resource === 'all') {
    const sh = ss.getSheetByName(SHEETS.HARVESTS);
    responseData.harvests = sh ? getSheetRows(sh) : [];
  }
  if (resource === 'sales' || resource === 'all') {
    const sh = ss.getSheetByName(SHEETS.SALES);
    responseData.sales = sh ? getSheetRows(sh) : [];
  }
  if (resource === 'users' || resource === 'all') {
    const sh = ss.getSheetByName(SHEETS.USERS);
    responseData.users = sh ? getSheetRows(sh).map(u => {
      delete u.passwordHash; // Không trả password hash ra ngoài khi GET thông thường
      return u;
    }) : [];
  }

  return ContentService.createTextOutput(JSON.stringify(responseData))
    .setMimeType(ContentService.MimeType.JSON);
}

// ─── XỬ LÝ POST REQUEST (THÊM / SỬA / XÓA / ĐĂNG NHẬP) ───────────────────
function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    const action = payload.action;
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    // 1. ĐĂNG NHẬP
    if (action === 'login') {
      const sh = ss.getSheetByName(SHEETS.USERS);
      const users = getSheetRows(sh);
      const user = users.find(u => String(u.username).toLowerCase() === String(payload.username).toLowerCase() && u.isActive !== 'FALSE');

      if (!user) {
        return jsonResponse({ success: false, error: 'Tài khoản không tồn tại hoặc bị vô hiệu' });
      }

      // Hash SHA-256 trên Apps Script
      const hash = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, payload.password)
        .map(b => (b < 0 ? b + 256 : b).toString(16).padStart(2, '0')).join('');

      if (hash !== user.passwordHash) {
        return jsonResponse({ success: false, error: 'Mật khẩu không đúng' });
      }

      const session = {
        userId: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        allowedHouses: user.allowedHouses ? String(user.allowedHouses).split(',').map(s => s.trim()) : null,
        canViewFinance: user.canViewFinance === 'TRUE' || user.canViewFinance === true,
        canExport: user.canExport === 'TRUE' || user.canExport === true,
        canDeleteRecords: user.canDeleteRecords === 'TRUE' || user.canDeleteRecords === true,
        canManageUsers: user.canManageUsers === 'TRUE' || user.canManageUsers === true,
        loginAt: new Date().toISOString()
      };
      return jsonResponse({ success: true, session: session });
    }

    // 2. THÊM PHIẾU THU HOẠCH
    if (action === 'addHarvest') {
      const sh = ss.getSheetByName(SHEETS.HARVESTS);
      const h = payload.data;
      sh.appendRow([h.id, h.houseId, h.houseName, h.date, h.weight, h.typeId, h.typeName, h.shift, h.note || '', h.staffName || '', h.createdAt || new Date().toISOString()]);
      return jsonResponse({ success: true, data: h });
    }

    // 3. XÓA PHIẾU THU HOẠCH
    if (action === 'deleteHarvest') {
      deleteRowById(ss.getSheetByName(SHEETS.HARVESTS), payload.id);
      return jsonResponse({ success: true });
    }

    // 4. THÊM ĐƠN BÁN
    if (action === 'addSale') {
      const sh = ss.getSheetByName(SHEETS.SALES);
      const s = payload.data;
      sh.appendRow([s.id, s.houseId, s.houseName, s.date, s.customerName, s.customerPhone || '', s.weight, s.typeId, s.typeName, s.pricePer100g || 0, s.totalAmount || 0, s.status || 'paid', s.note || '', s.staffName || '', s.createdAt || new Date().toISOString()]);
      return jsonResponse({ success: true, data: s });
    }

    // 5. XÓA ĐƠN BÁN
    if (action === 'deleteSale') {
      deleteRowById(ss.getSheetByName(SHEETS.SALES), payload.id);
      return jsonResponse({ success: true });
    }

    // 6. CẬP NHẬT TRẠNG THÁI BÁN (paid/debt)
    if (action === 'updateSaleStatus') {
      const sh = ss.getSheetByName(SHEETS.SALES);
      const data = sh.getDataRange().getValues();
      for (let i = 1; i < data.length; i++) {
        if (data[i][0] === payload.id) {
          sh.getRange(i + 1, 12).setValue(payload.status); // Cột L: status
          break;
        }
      }
      return jsonResponse({ success: true });
    }

    // 7. THÊM NGƯỜI DÙNG
    if (action === 'addUser') {
      const sh = ss.getSheetByName(SHEETS.USERS);
      const u = payload.data;
      const hash = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, u.password)
        .map(b => (b < 0 ? b + 256 : b).toString(16).padStart(2, '0')).join('');
      sh.appendRow([
        u.id, u.username, hash, u.name, u.role,
        Array.isArray(u.allowedHouses) ? u.allowedHouses.join(',') : (u.allowedHouses || ''),
        u.canViewFinance ? 'TRUE' : 'FALSE',
        u.canExport ? 'TRUE' : 'FALSE',
        u.canDeleteRecords ? 'TRUE' : 'FALSE',
        u.canManageUsers ? 'TRUE' : 'FALSE',
        'TRUE',
        new Date().toISOString()
      ]);
      return jsonResponse({ success: true });
    }

    // 8. ĐỔI MẬT KHẨU
    if (action === 'changePassword') {
      const sh = ss.getSheetByName(SHEETS.USERS);
      const data = sh.getDataRange().getValues();
      const oldHash = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, payload.oldPassword)
        .map(b => (b < 0 ? b + 256 : b).toString(16).padStart(2, '0')).join('');
      const newHash = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, payload.newPassword)
        .map(b => (b < 0 ? b + 256 : b).toString(16).padStart(2, '0')).join('');

      for (let i = 1; i < data.length; i++) {
        if (data[i][0] === payload.userId) {
          if (data[i][2] !== oldHash) {
            return jsonResponse({ success: false, error: 'Mật khẩu cũ không đúng' });
          }
          sh.getRange(i + 1, 3).setValue(newHash); // Cột C: passwordHash
          return jsonResponse({ success: true });
        }
      }
      return jsonResponse({ success: false, error: 'Không tìm thấy tài khoản' });
    }

    return jsonResponse({ success: false, error: 'Hành động không hợp lệ: ' + action });
  } catch (err) {
    return jsonResponse({ success: false, error: err.toString() });
  }
}

// ─── HÀM TIỆN ÍCH ────────────────────────────────────────────────────────
function getSheetRows(sheet) {
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  const headers = data[0];
  const rows = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row[0]) continue;
    const obj = {};
    for (let j = 0; j < headers.length; j++) {
      obj[headers[j]] = row[j];
    }
    rows.push(obj);
  }
  return rows;
}

function deleteRowById(sheet, id) {
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === id) {
      sheet.deleteRow(i + 1);
      return true;
    }
  }
  return false;
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
