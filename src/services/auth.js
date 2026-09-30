/** Phiên đăng nhập do Google Apps Script cấp; trình duyệt chỉ giữ token để gửi lại. */
const AUTH_KEY = 'nhayen_auth_session';
const LEGACY_USERS_KEY = 'nhayen_users_v2';
const PRIVATE_CACHE_KEYS = [
  'nhayen_cached_houses',
  'nhayen_cached_harvests',
  'nhayen_cached_sales',
  'nhayen_cached_users',
  'nhayen_cached_nest_types',
  'nhayen_cached_products',
  'nhayen_cached_tags',
  'nhayen_cached_settings',
  'nhayen_last_sync_time',
  'nhayen_houses',
  'nhayen_harvests',
  'nhayen_sales',
  'minhtrieu_harvest_draft',
  'minhtrieu_sale_draft',
  LEGACY_USERS_KEY,
];

function removeFrom(storage, key) {
  try {
    storage.removeItem(key);
  } catch {
    // Trình duyệt có thể chặn lưu trữ; đăng xuất trong ứng dụng vẫn tiếp tục.
  }
}

function validSession(session) {
  return session !== null && typeof session === 'object' &&
    typeof session.token === 'string' && session.token.trim().length > 0 &&
    (session.role === 'admin' || session.role === 'staff') &&
    session.userId != null;
}

export function logout() {
  try {
    removeFrom(localStorage, AUTH_KEY);
    PRIVATE_CACHE_KEYS.forEach((key) => removeFrom(localStorage, key));
  } catch {
    // localStorage không sẵn có.
  }
  try {
    removeFrom(sessionStorage, AUTH_KEY);
    PRIVATE_CACHE_KEYS.forEach((key) => removeFrom(sessionStorage, key));
  } catch {
    // sessionStorage không sẵn có.
  }
}

export function getSession() {
  let hadInvalidSession = false;
  for (const storageName of ['localStorage', 'sessionStorage']) {
    try {
      const storage = globalThis[storageName];
      const raw = storage?.getItem(AUTH_KEY);
      if (!raw) continue;
      const session = JSON.parse(raw);
      if (validSession(session)) return session;
      hadInvalidSession = true;
      removeFrom(storage, AUTH_KEY);
    } catch {
      hadInvalidSession = true;
      try { removeFrom(globalThis[storageName], AUTH_KEY); } catch { /* Lưu trữ bị chặn. */ }
    }
  }
  if (hadInvalidSession) logout();
  return null;
}

export function isAuthenticated() {
  return getSession() !== null;
}

export function canAccessHouse(session, houseId) {
  if (!validSession(session)) return false;
  if (session.role === 'admin' || !houseId) return true;
  const allowed = Array.isArray(session.allowedHouses)
    ? session.allowedHouses.map(String)
    : String(session.allowedHouses || '').split(',').map((item) => item.trim()).filter(Boolean);
  return allowed.includes(String(houseId));
}

export function checkPermission(session, permission) {
  if (!validSession(session) || session.role !== 'admin') return false;
  return ['viewFinance', 'export', 'deleteRecords', 'manageUsers'].includes(permission);
}

// Giữ tương thích với các module cũ; xác thực và đổi mật khẩu được thực hiện trên máy chủ.
export async function hashPassword(password) {
  const data = new TextEncoder().encode(password);
  const hashBuffer = await globalThis.crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer), (byte) => byte.toString(16).padStart(2, '0')).join('');
}
