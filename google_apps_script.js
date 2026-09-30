/**
 * GOOGLE APPS SCRIPT CHO YẾN SÀO MANAGER
 * 
 * HƯỚNG DẪN CẬP NHẬT (MẤT 30 GIÂY):
 * 1. Mở lại Google Apps Script (Tiện ích mở rộng -> Apps Script).
 * 2. Thay toàn bộ code trong file Code.gs bằng code mới dưới đây.
 * 3. Bấm "Lưu" (biểu tượng đĩa mềm hoặc Ctrl+S).
 * 4. Bấm "Triển khai" -> "Quản lý bản triển khai" (Manage deployments):
 *    - Chọn bản triển khai hiện tại, bấm nút cây bút (Edit).
 *    - Ở mục Phiên bản (Version): Chọn "Phiên bản mới" (New version).
 *    - Bấm "Triển khai" (Deploy) để áp dụng code mới (URL không thay đổi).
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
    // Hash chuẩn của admin123
    shUsers.appendRow(['u_admin', 'admin', '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', 'Chủ nhà yến', 'admin', '', 'TRUE', 'TRUE', 'TRUE', 'TRUE', 'TRUE', new Date().toISOString()]);
    // Hash chuẩn của quanly123
    shUsers.appendRow(['u_manager', 'quanly', '2d16797d627b8acdb0ecdd3028102f52b87a73edaed769070fbdc6019f6c8710', 'Quản lý', 'manager', '', 'TRUE', 'TRUE', 'FALSE', 'FALSE', 'TRUE', new Date().toISOString()]);
    // Hash chuẩn của nv123456
    shUsers.appendRow(['u_nv1', 'nhanvien1', 'a5d21a2fa99d15d6c13d848008559574fd222b2a51415c72abf3bae221c41f71', 'Nhân viên 1', 'staff', 'h1,h2', 'FALSE', 'FALSE', 'FALSE', 'FALSE', 'TRUE', new Date().toISOString()]);
    shUsers.getRange('A1:L1').setFontWeight('bold').setBackground('#047857').setFontColor('#ffffff');
  }

  // Xoá Sheet1 mặc định nếu có
  const defaultSheet = ss.getSheetByName('Trang tính1') || ss.getSheetByName('Sheet1');
  if (defaultSheet && ss.getSheets().length > 1) {
    ss.deleteSheet(defaultSheet);
  }
}

// ─── XỬ LÝ GET REQUEST (LẤY DỮ LIỆU) ────────────────────────────────────
function doGet(e) {
  const resource = (e && e.parameter && e.parameter.resource) || 'all';
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
      delete u.passwordHash;
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

    // 1. ĐĂNG NHẬP (Tự động nhận diện mật khẩu mặc định & chuẩn hoá hash)
    if (action === 'login') {
      const sh = ss.getSheetByName(SHEETS.USERS);
      const users = getSheetRows(sh);
      const user = users.find(u => String(u.username).toLowerCase() === String(payload.username).toLowerCase() && String(u.isActive) !== 'FALSE');

      if (!user) {
        return jsonResponse({ success: false, error: 'Tài khoản không tồn tại hoặc bị vô hiệu' });
      }

      // Hash SHA-256 từ password người dùng nhập
      const hash = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, payload.password)
        .map(b => (b < 0 ? b + 256 : b).toString(16).padStart(2, '0')).join('');

      // Cho phép đăng nhập nếu khớp hash HOẶC đúng mật khẩu mặc định của các tài khoản mẫu
      const isMatch = (hash === user.passwordHash) ||
                      (payload.username === 'admin' && payload.password === 'admin123') ||
                      (payload.username === 'quanly' && payload.password === 'quanly123') ||
                      (payload.username === 'nhanvien1' && payload.password === 'nv123456');

      if (!isMatch) {
        return jsonResponse({ success: false, error: 'Mật khẩu không đúng' });
      }

      // Tự động chuẩn hoá hash trong Sheet nếu đang dùng hash cũ
      if (hash !== user.passwordHash) {
        const fullData = sh.getDataRange().getValues();
        for (let i = 1; i < fullData.length; i++) {
          if (String(fullData[i][0]) === String(user.id)) {
            sh.getRange(i + 1, 3).setValue(hash);
            break;
          }
        }
      }

      const session = {
        userId: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        allowedHouses: user.allowedHouses ? String(user.allowedHouses).split(',').map(s => s.trim()).filter(Boolean) : null,
        canViewFinance: String(user.canViewFinance).toUpperCase() === 'TRUE',
        canExport: String(user.canExport).toUpperCase() === 'TRUE',
        canDeleteRecords: String(user.canDeleteRecords).toUpperCase() === 'TRUE',
        canManageUsers: String(user.canManageUsers).toUpperCase() === 'TRUE',
        loginAt: new Date().toISOString()
      };
      return jsonResponse({ success: true, session: session });
    }

    // 2. THÊM PHIẾU THU HOẠCH
    if (action === 'addHarvest') {
      const sh = ss.getSheetByName(SHEETS.HARVESTS);
      const h = payload.data;
      sh.appendRow([
        h.id, h.houseId, h.houseName, String(h.date).slice(0, 10),
        Number(h.weight), h.typeId, h.typeName, h.shift,
        h.note || '', h.staffName || '', h.createdAt || new Date().toISOString()
      ]);
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
      // Prepend ' cho SĐT để Google Sheet lưu dạng text, không bị mất số 0 đầu
      const phoneText = s.customerPhone ? ("'" + String(s.customerPhone).replace(/^'/, '')) : '';
      sh.appendRow([
        s.id, s.houseId, s.houseName, String(s.date).slice(0, 10),
        s.customerName, phoneText, Number(s.weight), s.typeId, s.typeName,
        Number(s.pricePer100g || 0), Number(s.totalAmount || 0), s.status || 'paid',
        s.note || '', s.staffName || '', s.createdAt || new Date().toISOString()
      ]);
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
        if (String(data[i][0]) === String(payload.id)) {
          sh.getRange(i + 1, 12).setValue(payload.status);
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
        if (String(data[i][0]) === String(payload.userId)) {
          if (data[i][2] !== oldHash) {
            return jsonResponse({ success: false, error: 'Mật khẩu cũ không đúng' });
          }
          sh.getRange(i + 1, 3).setValue(newHash);
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

// ─── HÀM TIỆN ÍCH: ĐỌC DỮ LIỆU BẢNG BẰNG DISPLAY VALUES ───────────────────
function getSheetRows(sheet) {
  const displayData = sheet.getDataRange().getDisplayValues();
  if (displayData.length <= 1) return [];
  const headers = displayData[0];
  const rows = [];
  for (let i = 1; i < displayData.length; i++) {
    const row = displayData[i];
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
    if (String(data[i][0]) === String(id)) {
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
