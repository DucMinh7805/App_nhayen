/**
 * Google Apps Script cho Quản lý Yến sào Minh Triều.
 *
 * Dán mã này vào Code.gs của Apps Script gắn với bảng tính, lưu và triển khai
 * một phiên bản Web App mới. Triển khai Vercel không tự cập nhật Apps Script.
 * Mã tự đổi tên bốn tab cũ và tiêu đề cột sang tiếng Việt khi nhận yêu cầu đầu
 * tiên sau triển khai. setName giữ nguyên sheetId/gid và mọi dòng dữ liệu.
 * Không cần chạy setupSheet; hàm đó chỉ tạo cấu trúc thiếu, không tạo dữ liệu
 * mẫu và không xóa tab nào. Các tab cấu hình ít dùng được ẩn, không mất dữ liệu.
 */

const SCHEMA = {
  HOUSES: {
    name: 'Nhà yến', legacy: 'Houses',
    keys: ['id', 'name', 'address', 'color', 'createdAt', 'isActive'],
    headers: ['Mã cơ sở', 'Tên cơ sở', 'Địa chỉ', 'Màu', 'Ngày tạo', 'Đang sử dụng'],
  },
  HARVESTS: {
    name: 'Thu hoạch', legacy: 'Harvests',
    keys: ['id', 'houseId', 'houseName', 'date', 'weight', 'typeId', 'typeName', 'shift', 'note', 'staffName', 'createdAt', 'tagIds'],
    headers: ['Mã phiếu', 'Mã nhà yến', 'Tên nhà yến', 'Ngày thu hoạch', 'Khối lượng (g)', 'Mã loại tổ', 'Loại tổ', 'Ca thu', 'Ghi chú', 'Người nhập', 'Thời gian tạo', 'Mã nhãn'],
  },
  SALES: {
    name: 'Bán hàng', legacy: 'Sales',
    keys: ['id', 'houseId', 'houseName', 'date', 'customerName', 'customerPhone', 'weight', 'typeId', 'typeName', 'pricePer100g', 'totalAmount', 'status', 'note', 'staffName', 'createdAt', 'productId', 'productName', 'tagIds'],
    headers: ['Mã đơn', 'Mã nhà yến', 'Tên nhà yến', 'Ngày bán', 'Khách hàng', 'Số điện thoại', 'Khối lượng (g)', 'Mã loại tổ trong kho', 'Loại tổ trong kho', 'Đơn giá / 100g', 'Thành tiền (VNĐ)', 'Thanh toán', 'Ghi chú', 'Người nhập', 'Thời gian tạo', 'Mã mặt hàng', 'Mặt hàng bán', 'Mã nhãn'],
  },
  USERS: {
    name: 'Tài khoản', legacy: 'Users',
    keys: ['id', 'username', 'passwordHash', 'name', 'role', 'allowedHouses', 'canViewFinance', 'canExport', 'canDeleteRecords', 'canManageUsers', 'isActive', 'createdAt'],
    headers: ['Mã tài khoản', 'Tên đăng nhập', 'Mật khẩu (mã bảo vệ)', 'Họ tên', 'Vai trò', 'Nhà yến được quản lý', 'Xem tài chính', 'Xuất báo cáo', 'Xóa phiếu', 'Quản lý tài khoản', 'Đang sử dụng', 'Ngày tạo'],
  },
  NEST_TYPES: {
    name: 'Loại tổ', legacy: 'NestTypes',
    keys: ['id', 'label', 'shortLabel', 'defaultPricePer100g', 'color', 'isActive', 'sortOrder', 'createdAt', 'updatedAt'],
    headers: ['Mã loại tổ', 'Tên loại tổ', 'Tên ngắn', 'Giá tham khảo / 100g', 'Màu', 'Đang sử dụng', 'Thứ tự', 'Ngày tạo', 'Ngày sửa'],
  },
  PRODUCTS: {
    name: 'Mặt hàng bán', legacy: 'Products',
    keys: ['id', 'name', 'stockTypeId', 'pricePer100g', 'isActive', 'sortOrder', 'createdAt', 'updatedAt'],
    headers: ['Mã mặt hàng', 'Tên mặt hàng bán', 'Mã loại tổ trong kho', 'Giá bán / 100g', 'Đang sử dụng', 'Thứ tự', 'Ngày tạo', 'Ngày sửa'],
  },
  TAGS: {
    name: 'Nhãn', legacy: 'Tags',
    keys: ['id', 'name', 'color', 'isActive', 'sortOrder', 'createdAt', 'updatedAt'],
    headers: ['Mã nhãn', 'Tên nhãn', 'Màu', 'Đang sử dụng', 'Thứ tự', 'Ngày tạo', 'Ngày sửa'],
  },
  SETTINGS: {
    name: 'Cài đặt', legacy: 'Settings',
    keys: ['key', 'value', 'updatedAt'],
    headers: ['Mã nội dung', 'Nội dung hiển thị', 'Ngày sửa'],
  },
};

const DEFAULT_NEST_TYPES = [
  { id: 'tho_a', label: 'Tổ thô loại A (Chọn)', shortLabel: 'Thô A', defaultPricePer100g: 2900000, color: 'emerald' },
  { id: 'tho_b', label: 'Tổ thô xô (Loại B)', shortLabel: 'Thô B', defaultPricePer100g: 2400000, color: 'blue' },
  { id: 'chan_yen', label: 'Chân tổ yến', shortLabel: 'Chân yến', defaultPricePer100g: 2200000, color: 'amber' },
  { id: 'vun_gay', label: 'Tổ vụn / gãy', shortLabel: 'Vụn gãy', defaultPricePer100g: 1800000, color: 'rose' },
  { id: 'tinh_che', label: 'Yến tinh chế', shortLabel: 'Tinh chế', defaultPricePer100g: 3800000, color: 'purple' },
];

function setupSheet() {
  ensureSchema_(SpreadsheetApp.getActiveSpreadsheet());
}

function ensureSchema_(ss) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    Object.keys(SCHEMA).forEach(key => ensureSheet_(ss, key));
    seedConfiguration_(ss);
    const props = PropertiesService.getScriptProperties();
    if (props.getProperty('MINH_TRIEU_TABS_SIMPLIFIED') !== '1') {
      ['NEST_TYPES', 'PRODUCTS', 'TAGS', 'SETTINGS'].forEach(key => {
        const sheet = ss.getSheetByName(SCHEMA[key].name);
        if (sheet && !sheet.isSheetHidden()) sheet.hideSheet();
      });
      props.setProperty('MINH_TRIEU_TABS_SIMPLIFIED', '1');
    }
    if (props.getProperty('MINH_TRIEU_VALUES_VI') !== '1') {
      [
        { key: 'SALES', column: 12, values: { paid: 'Đã thanh toán', debt: 'Ghi nợ' } },
        { key: 'USERS', column: 5, values: { admin: 'Chủ nhà', staff: 'Nhân viên' } },
      ].forEach(spec => {
        const sheet = ss.getSheetByName(SCHEMA[spec.key].name);
        if (sheet.getLastRow() <= 1) return;
        sheet.getRange(2, spec.column, sheet.getLastRow() - 1, 1).getValues()
          .forEach((row, index) => {
            const translated = spec.values[String(row[0]).trim().toLowerCase()];
            if (translated) sheet.getRange(index + 2, spec.column).setValue(translated);
          });
      });
      props.setProperty('MINH_TRIEU_VALUES_VI', '1');
    }
  } finally {
    lock.releaseLock();
  }
}

function ensureSheet_(ss, key) {
  const spec = SCHEMA[key];
  let sheet = ss.getSheetByName(spec.name);
  if (!sheet) {
    sheet = ss.getSheetByName(spec.legacy);
    if (sheet) sheet.setName(spec.name); // Giữ nguyên sheetId/gid và dữ liệu.
  }
  if (!sheet) sheet = ss.insertSheet(spec.name);
  if (sheet.getMaxColumns() < spec.headers.length) {
    sheet.insertColumnsAfter(sheet.getMaxColumns(), spec.headers.length - sheet.getMaxColumns());
  }

  const existing = sheet.getLastRow() > 0
    ? sheet.getRange(1, 1, 1, spec.headers.length).getDisplayValues()[0]
    : [];
  if (existing.some((value, index) => value !== spec.headers[index]) ||
      existing.length !== spec.headers.length) {
    sheet.getRange(1, 1, 1, spec.headers.length).setValues([spec.headers]);
    sheet.getRange(1, 1, 1, spec.headers.length)
      .setFontWeight('bold').setBackground('#14645d').setFontColor('#ffffff');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function seedConfiguration_(ss) {
  const types = ss.getSheetByName(SCHEMA.NEST_TYPES.name);
  if (types.getLastRow() <= 1) {
    DEFAULT_NEST_TYPES.forEach((type, index) => types.appendRow([
      type.id, type.label, type.shortLabel, type.defaultPricePer100g,
      type.color, true, index + 1, new Date().toISOString(), '',
    ]));
  }
  const products = ss.getSheetByName(SCHEMA.PRODUCTS.name);
  if (products.getLastRow() <= 1) {
    DEFAULT_NEST_TYPES.forEach((type, index) => products.appendRow([
      'p_' + type.id, type.label, type.id, type.defaultPricePer100g,
      true, index + 1, new Date().toISOString(), '',
    ]));
  }
  const settings = ss.getSheetByName(SCHEMA.SETTINGS.name);
  if (settings.getLastRow() <= 1) {
    settings.appendRow(['appName', 'Quản lý Yến sào Minh Triều', new Date().toISOString()]);
  }
}

function getRows_(ss, key) {
  const sheet = ss.getSheetByName(SCHEMA[key].name);
  if (!sheet || sheet.getLastRow() <= 1) return [];
  const width = SCHEMA[key].keys.length;
  const raw = sheet.getRange(2, 1, sheet.getLastRow() - 1, width).getValues();
  const shown = sheet.getRange(2, 1, sheet.getLastRow() - 1, width).getDisplayValues();
  return raw.map((row, rowIndex) => {
    const item = {};
    SCHEMA[key].keys.forEach((field, column) => {
      const value = row[column];
      if (['weight', 'pricePer100g', 'totalAmount', 'defaultPricePer100g', 'sortOrder'].indexOf(field) !== -1) {
        item[field] = numberFromCell_(value);
      } else if (key === 'SALES' && field === 'status') {
        item[field] = String(value).trim().toLowerCase() === 'ghi nợ' ? 'debt'
          : String(value).trim().toLowerCase() === 'đã thanh toán' ? 'paid' : value;
      } else if (key === 'USERS' && field === 'role') {
        item[field] = String(value).trim().toLowerCase() === 'chủ nhà' ? 'admin'
          : String(value).trim().toLowerCase() === 'nhân viên' ? 'staff' : value;
      } else if (value instanceof Date && field === 'date') {
        item[field] = Utilities.formatDate(value, Session.getScriptTimeZone(), 'yyyy-MM-dd');
      } else {
        item[field] = value instanceof Date ? shown[rowIndex][column] : value;
      }
    });
    return item;
  }).filter(item => item[SCHEMA[key].keys[0]] !== '');
}

function numberFromCell_(value) {
  if (typeof value === 'number') return value;
  const text = String(value == null ? '' : value).trim().replace(/[^\d.,-]/g, '');
  if (!text) return 0;
  const comma = text.lastIndexOf(',');
  const dot = text.lastIndexOf('.');
  if (comma !== -1 && dot !== -1) {
    const decimal = comma > dot ? ',' : '.';
    const grouping = decimal === ',' ? '.' : ',';
    return Number(text.split(grouping).join('').replace(decimal, '.')) || 0;
  }
  const separator = comma !== -1 ? ',' : dot !== -1 ? '.' : '';
  if (!separator) return Number(text) || 0;
  const parts = text.split(separator);
  if (parts.length > 2 || (parts.length === 2 && parts[1].length === 3 && parts[0].length <= 3)) {
    return Number(parts.join('')) || 0;
  }
  return Number(text.replace(separator, '.')) || 0;
}

function jsonResponse_(value) {
  return ContentService.createTextOutput(JSON.stringify(value))
    .setMimeType(ContentService.MimeType.JSON);
}

// Không công bố dữ liệu qua GET. Ứng dụng đọc bằng POST có phiên đăng nhập.
function doGet() {
  return jsonResponse_({ success: false, error: 'Vui lòng đăng nhập trong ứng dụng để xem dữ liệu.' });
}

function hash_(value) {
  return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(value))
    .map(byte => (byte < 0 ? byte + 256 : byte).toString(16).padStart(2, '0')).join('');
}

function secret_() {
  const props = PropertiesService.getScriptProperties();
  let value = props.getProperty('MINH_TRIEU_SESSION_SECRET');
  if (!value) {
    value = Utilities.getUuid() + Utilities.getUuid() + Utilities.getUuid();
    props.setProperty('MINH_TRIEU_SESSION_SECRET', value);
  }
  return value;
}

function sign_(unsigned) {
  return Utilities.base64EncodeWebSafe(
    Utilities.computeHmacSha256Signature(unsigned, secret_())
  ).replace(/=+$/, '');
}

function makeToken_(user) {
  const data = JSON.stringify({
    id: String(user.id), issuedAt: Date.now(),
    passwordVersion: String(user.passwordHash).slice(0, 16),
  });
  const unsigned = Utilities.base64EncodeWebSafe(data).replace(/=+$/, '');
  return unsigned + '.' + sign_(unsigned);
}

function sameString_(a, b) {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return mismatch === 0;
}

function signedInUser_(ss, token) {
  if (!token || typeof token !== 'string') throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
  const parts = token.split('.');
  if (parts.length !== 2 || !sameString_(parts[1], sign_(parts[0]))) {
    throw new Error('Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.');
  }
  const padded = parts[0] + '='.repeat((4 - parts[0].length % 4) % 4);
  const bytes = Utilities.base64DecodeWebSafe(padded);
  const payload = JSON.parse(Utilities.newBlob(bytes).getDataAsString());
  if (!Number.isFinite(Number(payload.issuedAt)) ||
      Date.now() - Number(payload.issuedAt) > 7 * 24 * 60 * 60 * 1000 ||
      Number(payload.issuedAt) > Date.now() + 60000) {
    throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
  }
  const user = getRows_(ss, 'USERS').find(item => String(item.id) === String(payload.id));
  if (!user || String(user.isActive).toUpperCase() === 'FALSE' ||
      String(user.passwordHash).slice(0, 16) !== payload.passwordVersion) {
    throw new Error('Tài khoản hoặc phiên đăng nhập không còn hiệu lực.');
  }
  return user;
}

function requireAdmin_(user) {
  if (String(user.role) !== 'admin') throw new Error('Chỉ chủ nhà mới có quyền thay đổi mục này.');
}

function allowedHouses_(user) {
  if (String(user.role) === 'admin') return null;
  if (!user.allowedHouses) return [];
  return String(user.allowedHouses).split(',').map(x => x.trim()).filter(Boolean);
}

function mayUseHouse_(user, houseId) {
  if (!houseId) return true; // Đơn bán lấy từ kho duy nhất tại nhà.
  const allowed = allowedHouses_(user);
  return allowed === null || allowed.indexOf(String(houseId)) !== -1;
}

function publicSession_(user) {
  return {
    userId: user.id, username: user.username, name: user.name,
    role: user.role, allowedHouses: allowedHouses_(user),
    canViewFinance: String(user.role) === 'admin',
    canExport: String(user.role) === 'admin',
    canDeleteRecords: String(user.role) === 'admin',
    canManageUsers: String(user.role) === 'admin',
    token: makeToken_(user), loginAt: new Date().toISOString(),
  };
}

function configuration_(ss) {
  const nestTypes = getRows_(ss, 'NEST_TYPES').map(item => ({
    ...item,
    defaultPricePer100g: Number(item.defaultPricePer100g) || 0,
    isActive: String(item.isActive).toUpperCase() !== 'FALSE',
    sortOrder: Number(item.sortOrder) || 0,
  }));
  const products = getRows_(ss, 'PRODUCTS').map(item => ({
    ...item,
    pricePer100g: Number(item.pricePer100g) || 0,
    isActive: String(item.isActive).toUpperCase() !== 'FALSE',
    sortOrder: Number(item.sortOrder) || 0,
  }));
  const tags = getRows_(ss, 'TAGS').map(item => ({
    ...item,
    isActive: String(item.isActive).toUpperCase() !== 'FALSE',
    sortOrder: Number(item.sortOrder) || 0,
  }));
  const settings = {};
  getRows_(ss, 'SETTINGS').forEach(item => { settings[String(item.key)] = String(item.value); });
  return { nestTypes, products, tags, settings };
}

function readableData_(ss, user, resource) {
  const isAdmin = String(user.role) === 'admin';
  const scoped = rows => rows.filter(item => mayUseHouse_(user, item.houseId));
  const result = { success: true };
  if (resource === 'all' || resource === 'houses') {
    result.houses = getRows_(ss, 'HOUSES').filter(item =>
      String(item.isActive).toUpperCase() !== 'FALSE' && mayUseHouse_(user, item.id)
    );
  }
  if (resource === 'all' || resource === 'harvests') {
    result.harvests = scoped(getRows_(ss, 'HARVESTS'));
  }
  if (resource === 'all' || resource === 'sales') {
    result.sales = scoped(getRows_(ss, 'SALES')).map(item => isAdmin ? item : {
      ...item, pricePer100g: 0, totalAmount: 0,
    });
  }
  if (resource === 'all' || resource === 'configuration') {
    Object.assign(result, configuration_(ss));
  }
  if (resource === 'users') {
    requireAdmin_(user);
    result.users = getRows_(ss, 'USERS').map(item => {
      const visible = { ...item };
      delete visible.passwordHash;
      return visible;
    });
  }
  if (['all', 'houses', 'harvests', 'sales', 'configuration', 'users'].indexOf(resource) === -1) {
    throw new Error('Loại dữ liệu không hợp lệ.');
  }
  return result;
}

function safeText_(value, limit) {
  const text = String(value == null ? '' : value).trim().slice(0, limit || 200);
  return /^[=+@-]/.test(text) ? "'" + text : text;
}

function validId_(value) {
  const id = String(value || '').trim();
  if (!/^[a-zA-Z0-9_-]{1,80}$/.test(id)) throw new Error('Mã danh mục không hợp lệ.');
  return id;
}

function positiveWeight_(value) {
  const weight = Number(value);
  if (!Number.isFinite(weight) || weight <= 0 || weight > 100000000) {
    throw new Error('Khối lượng phải lớn hơn 0.');
  }
  return weight;
}

function nonnegativePrice_(value) {
  const price = Number(value);
  if (!Number.isFinite(price) || price < 0 || price > 100000000000) {
    throw new Error('Đơn giá không hợp lệ.');
  }
  return price;
}

function tagsText_(value) {
  return (Array.isArray(value) ? value : String(value || '').split(','))
    .map(item => String(item).trim()).filter(Boolean).map(validId_).join(',');
}

function findRow_(sheet, id) {
  const values = sheet.getRange(1, 1, Math.max(sheet.getLastRow(), 1), 1).getValues();
  for (let row = 2; row <= values.length; row++) {
    if (String(values[row - 1][0]) === String(id)) return row;
  }
  return 0;
}

function upsertRows_(ss, key, incoming) {
  const sheet = ss.getSheetByName(SCHEMA[key].name);
  const columns = SCHEMA[key].keys;
  incoming.forEach(item => {
    const id = key === 'SETTINGS' ? item.key : item.id;
    const rowNumber = findRow_(sheet, id);
    const old = rowNumber ? getRows_(ss, key).find(row => String(row[columns[0]]) === String(id)) : {};
    const merged = { ...old, ...item };
    if (rowNumber && old.createdAt && !item.createdAt) merged.createdAt = old.createdAt;
    if (!rowNumber && columns.indexOf('createdAt') !== -1 && !merged.createdAt) {
      merged.createdAt = new Date().toISOString();
    }
    const values = columns.map(column => merged[column] == null ? '' : merged[column]);
    if (rowNumber) sheet.getRange(rowNumber, 1, 1, values.length).setValues([values]);
    else sheet.appendRow(values);
  });
}

function saveConfiguration_(ss, data) {
  const now = new Date().toISOString();
  const types = data.nestTypes;
  const products = data.products;
  const tags = data.tags;
  const settings = data.settings;
  let typeRows;
  let productRows;
  let tagRows;
  let settingRows;
  const ensureUnique = (rows, field) => {
    if (new Set(rows.map(row => row[field])).size !== rows.length) {
      throw new Error('Có mã danh mục bị trùng.');
    }
  };
  if (types !== undefined) {
    if (!Array.isArray(types) || types.length > 100) throw new Error('Danh sách loại tổ không hợp lệ.');
    typeRows = types.map((item, index) => ({
      id: validId_(item.id),
      label: safeText_(item.label, 100),
      shortLabel: safeText_(item.shortLabel || item.label, 40),
      defaultPricePer100g: nonnegativePrice_(item.defaultPricePer100g),
      color: safeText_(item.color || 'emerald', 20),
      isActive: item.isActive !== false,
      sortOrder: Number.isFinite(Number(item.sortOrder)) ? Number(item.sortOrder) : index + 1,
      createdAt: item.createdAt || '', updatedAt: now,
    }));
    if (typeRows.some(row => !row.label)) throw new Error('Loại tổ cần có tên.');
    ensureUnique(typeRows, 'id');
  }
  if (products !== undefined) {
    if (!Array.isArray(products) || products.length > 500) throw new Error('Danh sách mặt hàng không hợp lệ.');
    const validTypes = new Set([
      ...getRows_(ss, 'NEST_TYPES').map(row => String(row.id)),
      ...(typeRows || []).map(row => row.id),
    ]);
    productRows = products.map((item, index) => ({
      id: validId_(item.id),
      name: safeText_(item.name, 100),
      stockTypeId: validId_(item.stockTypeId),
      pricePer100g: nonnegativePrice_(item.pricePer100g),
      isActive: item.isActive !== false,
      sortOrder: Number.isFinite(Number(item.sortOrder)) ? Number(item.sortOrder) : index + 1,
      createdAt: item.createdAt || '', updatedAt: now,
    }));
    if (productRows.some(row => !row.name || !validTypes.has(row.stockTypeId))) {
      throw new Error('Mặt hàng cần tên và loại tổ trong kho hợp lệ.');
    }
    ensureUnique(productRows, 'id');
  }
  if (tags !== undefined) {
    if (!Array.isArray(tags) || tags.length > 200) throw new Error('Danh sách nhãn không hợp lệ.');
    tagRows = tags.map((item, index) => ({
      id: validId_(item.id),
      name: safeText_(item.name, 80),
      color: safeText_(item.color || 'emerald', 20),
      isActive: item.isActive !== false,
      sortOrder: Number.isFinite(Number(item.sortOrder)) ? Number(item.sortOrder) : index + 1,
      createdAt: item.createdAt || '', updatedAt: now,
    }));
    if (tagRows.some(row => !row.name)) throw new Error('Nhãn cần có tên.');
    ensureUnique(tagRows, 'id');
  }
  if (settings !== undefined) {
    if (!settings || typeof settings !== 'object' || Array.isArray(settings) ||
        Object.keys(settings).length > 100) throw new Error('Cài đặt không hợp lệ.');
    settingRows = Object.keys(settings).map(key => {
      if (!/^[a-zA-Z][a-zA-Z0-9_.-]{0,79}$/.test(key)) throw new Error('Mã nội dung không hợp lệ.');
      return { key, value: safeText_(settings[key], 250), updatedAt: now };
    });
  }
  if (typeRows) upsertRows_(ss, 'NEST_TYPES', typeRows);
  if (productRows) upsertRows_(ss, 'PRODUCTS', productRows);
  if (tagRows) upsertRows_(ss, 'TAGS', tagRows);
  if (settingRows) upsertRows_(ss, 'SETTINGS', settingRows);
  return configuration_(ss);
}

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    const action = String(payload.action || '');
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    ensureSchema_(ss);

    if (action === 'login') {
      const user = getRows_(ss, 'USERS').find(item =>
        String(item.username).toLowerCase() === String(payload.username || '').trim().toLowerCase() &&
        String(item.isActive).toUpperCase() !== 'FALSE'
      );
      if (!user || !payload.password || hash_(payload.password) !== String(user.passwordHash)) {
        throw new Error('Tên đăng nhập hoặc mật khẩu không đúng.');
      }
      return jsonResponse_({ success: true, session: publicSession_(user) });
    }

    const user = signedInUser_(ss, payload.token);
    if (action === 'getData') {
      return jsonResponse_(readableData_(ss, user, String(payload.resource || 'all')));
    }

    const lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      if (action === 'saveConfiguration') {
        requireAdmin_(user);
        return jsonResponse_({ success: true, ...saveConfiguration_(ss, payload.data || {}) });
      }
      if (action === 'saveHouses') {
        requireAdmin_(user);
        const houses = payload.houses;
        if (!Array.isArray(houses) || houses.length === 0 || houses.length > 100) {
          throw new Error('Danh sách nhà yến không hợp lệ.');
        }
        const retainedIds = new Set(houses.map(house => validId_(house.id)));
        upsertRows_(ss, 'HOUSES', houses.map(house => ({
          id: validId_(house.id),
          name: safeText_(house.name, 100),
          address: safeText_(house.address, 200),
          color: safeText_(house.color || 'emerald', 20),
          isActive: true,
        })));
        upsertRows_(ss, 'HOUSES', getRows_(ss, 'HOUSES')
          .filter(house => !retainedIds.has(String(house.id)))
          .map(house => ({ id: house.id, isActive: false })));
        return jsonResponse_({ success: true, houses: getRows_(ss, 'HOUSES')
          .filter(house => String(house.isActive).toUpperCase() !== 'FALSE') });
      }
      if (action === 'addHarvest') {
        const h = payload.data || {};
        if (!mayUseHouse_(user, h.houseId)) throw new Error('Không được nhập liệu cho nhà yến này.');
        const sheet = ss.getSheetByName(SCHEMA.HARVESTS.name);
        if (findRow_(sheet, h.id)) throw new Error('Phiếu này đã được lưu.');
        const type = configuration_(ss).nestTypes.find(item => String(item.id) === String(h.typeId));
        if (!type || !type.isActive) throw new Error('Loại tổ không còn sử dụng.');
        const house = getRows_(ss, 'HOUSES').find(item => String(item.id) === String(h.houseId));
        if (!house) throw new Error('Không tìm thấy nhà yến.');
        sheet.appendRow([
          validId_(h.id), house.id, safeText_(house.name, 100), String(h.date || '').slice(0, 10),
          positiveWeight_(h.weight), type.id, safeText_(type.label, 100), safeText_(h.shift, 80),
          safeText_(h.note, 500), safeText_(user.name, 100), h.createdAt || new Date().toISOString(),
          tagsText_(h.tagIds),
        ]);
        return jsonResponse_({ success: true });
      }
      if (action === 'deleteHarvest') {
        requireAdmin_(user);
        deleteRowById_(ss.getSheetByName(SCHEMA.HARVESTS.name), payload.id);
        return jsonResponse_({ success: true });
      }
      if (action === 'addSale') {
        const s = payload.data || {};
        if (s.houseId && !mayUseHouse_(user, s.houseId)) {
          throw new Error('Không được bán hàng tại nhà yến này.');
        }
        const sheet = ss.getSheetByName(SCHEMA.SALES.name);
        if (findRow_(sheet, s.id)) throw new Error('Đơn này đã được lưu.');
        const config = configuration_(ss);
        const product = config.products.find(item => String(item.id) === String(s.productId)) ||
          config.products.find(item => String(item.stockTypeId) === String(s.typeId) && item.isActive);
        if (!product || !product.isActive) throw new Error('Mặt hàng không còn sử dụng.');
        const type = config.nestTypes.find(item => String(item.id) === String(product.stockTypeId));
        if (!type) throw new Error('Loại tổ trong kho không tồn tại.');
        const house = s.houseId
          ? getRows_(ss, 'HOUSES').find(item => String(item.id) === String(s.houseId))
          : { id: '', name: 'Kho tại nhà' };
        if (!house) throw new Error('Không tìm thấy nhà yến.');
        const customerName = safeText_(s.customerName, 150);
        if (!customerName) throw new Error('Vui lòng nhập tên khách hàng.');
        const weight = positiveWeight_(s.weight);
        const stock = getRows_(ss, 'HARVESTS').filter(item => String(item.typeId) === String(type.id))
          .reduce((total, item) => total + Number(item.weight || 0), 0) -
          getRows_(ss, 'SALES').filter(item => String(item.typeId) === String(type.id))
            .reduce((total, item) => total + Number(item.weight || 0), 0);
        if (weight > stock) throw new Error('Số lượng bán vượt quá số tổ còn trong kho.');
        const price = String(user.role) === 'admin' && s.pricePer100g !== undefined
          ? nonnegativePrice_(s.pricePer100g) : product.pricePer100g;
        const amount = Math.round(weight / 100 * price);
        const phone = String(s.customerPhone || '').trim().replace(/^'/, '').slice(0, 30);
        sheet.appendRow([
          validId_(s.id), house.id, safeText_(house.name, 100), String(s.date || '').slice(0, 10),
          customerName, phone ? "'" + phone : '', weight,
          type.id, safeText_(type.label, 100), price, amount,
          s.status === 'debt' ? 'Ghi nợ' : 'Đã thanh toán', safeText_(s.note, 500),
          safeText_(user.name, 100), s.createdAt || new Date().toISOString(),
          product.id, safeText_(product.name, 100), tagsText_(s.tagIds),
        ]);
        return jsonResponse_({ success: true, data: { pricePer100g: price, totalAmount: amount } });
      }
      if (action === 'deleteSale') {
        requireAdmin_(user);
        deleteRowById_(ss.getSheetByName(SCHEMA.SALES.name), payload.id);
        return jsonResponse_({ success: true });
      }
      if (action === 'updateSaleStatus') {
        requireAdmin_(user);
        const sheet = ss.getSheetByName(SCHEMA.SALES.name);
        const row = findRow_(sheet, payload.id);
        if (!row) throw new Error('Không tìm thấy đơn bán.');
        if (['paid', 'debt'].indexOf(payload.status) === -1) throw new Error('Trạng thái không hợp lệ.');
        sheet.getRange(row, 12).setValue(payload.status === 'debt' ? 'Ghi nợ' : 'Đã thanh toán');
        return jsonResponse_({ success: true });
      }
      if (action === 'setUserActive') {
        requireAdmin_(user);
        const sheet = ss.getSheetByName(SCHEMA.USERS.name);
        const target = getRows_(ss, 'USERS').find(item => String(item.id) === String(payload.id));
        if (!target) throw new Error('Không tìm thấy tài khoản.');
        if (String(target.id) === String(user.id) || String(target.role) === 'admin') {
          throw new Error('Không thể thay đổi trạng thái tài khoản chủ nhà.');
        }
        if (typeof payload.isActive !== 'boolean') throw new Error('Trạng thái tài khoản không hợp lệ.');
        sheet.getRange(findRow_(sheet, target.id), 11).setValue(payload.isActive);
        const updated = { ...target, isActive: payload.isActive };
        delete updated.passwordHash;
        return jsonResponse_({ success: true, user: updated });
      }
      if (action === 'addUser') {
        requireAdmin_(user);
        const u = payload.data || {};
        const sheet = ss.getSheetByName(SCHEMA.USERS.name);
        if (getRows_(ss, 'USERS').some(item =>
          String(item.username).toLowerCase() === String(u.username).toLowerCase()
        )) throw new Error('Tên đăng nhập đã tồn tại.');
        if (String(u.password || '').length < 8) throw new Error('Mật khẩu cần ít nhất 8 ký tự.');
        const role = u.role === 'admin' ? 'admin' : 'staff';
        sheet.appendRow([
          validId_(u.id), safeText_(u.username, 80), hash_(u.password), safeText_(u.name, 100),
          role === 'admin' ? 'Chủ nhà' : 'Nhân viên', tagsText_(u.allowedHouses), role === 'admin', role === 'admin',
          role === 'admin', role === 'admin', true, new Date().toISOString(),
        ]);
        return jsonResponse_({ success: true });
      }
      if (action === 'changePassword') {
        if (String(payload.userId) !== String(user.id)) throw new Error('Chỉ được đổi mật khẩu của chính bạn.');
        if (hash_(payload.oldPassword || '') !== String(user.passwordHash)) {
          throw new Error('Mật khẩu cũ không đúng.');
        }
        if (String(payload.newPassword || '').length < 8) throw new Error('Mật khẩu mới cần ít nhất 8 ký tự.');
        const sheet = ss.getSheetByName(SCHEMA.USERS.name);
        sheet.getRange(findRow_(sheet, user.id), 3).setValue(hash_(payload.newPassword));
        const updated = getRows_(ss, 'USERS').find(item => String(item.id) === String(user.id));
        return jsonResponse_({ success: true, session: publicSession_(updated) });
      }
      throw new Error('Hành động không hợp lệ.');
    } finally {
      lock.releaseLock();
    }
  } catch (error) {
    return jsonResponse_({ success: false, error: String(error.message || error) });
  }
}

function deleteRowById_(sheet, id) {
  const row = findRow_(sheet, id);
  if (!row) throw new Error('Không tìm thấy phiếu cần xóa.');
  sheet.deleteRow(row);
}
