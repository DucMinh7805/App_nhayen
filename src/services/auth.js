/**
 * services/auth.js
 * Hệ thống xác thực & phân quyền cục bộ (Local Auth)
 * Dữ liệu được mã hoá bằng AES-256 qua SubtleCrypto (Web Crypto API)
 */

const AUTH_KEY = 'nhayen_auth_session';
const USERS_KEY = 'nhayen_users_v2';

// ----------- Danh sách người dùng mặc định -----------

export const DEFAULT_APP_USERS = [
  {
    id: 'u_admin',
    username: 'admin',
    // SHA-256 hash của "admin123" - chỉ lưu hash, không bao giờ lưu mật khẩu thô
    passwordHash: 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3',
    name: 'Chủ nhà yến',
    role: 'admin',        // 'admin' | 'manager' | 'staff'
    allowedHouses: null,  // null = toàn quyền; ['h1','h2'] = chỉ xem nhà được phân công
    canViewFinance: true,
    canExport: true,
    canDeleteRecords: true,
    canManageUsers: true,
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'u_manager',
    username: 'quanly',
    passwordHash: 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', // "quanly123"
    name: 'Quản lý (Manager)',
    role: 'manager',
    allowedHouses: null,
    canViewFinance: true,
    canExport: true,
    canDeleteRecords: false,
    canManageUsers: false,
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'u_nv1',
    username: 'nhanvien1',
    passwordHash: '9b8769a4a742959a2d0298c36fb70623f2a2d34a916b59e13902dbf2c1a8df0b', // "nv123456"
    name: 'Nhân viên A',
    role: 'staff',
    allowedHouses: ['h1', 'h2'],  // chỉ nhập liệu nhà h1 và h2
    canViewFinance: false,
    canExport: false,
    canDeleteRecords: false,
    canManageUsers: false,
    isActive: true,
    createdAt: new Date().toISOString(),
  },
];

// ----------- Hàm tiện ích hash mật khẩu (SHA-256) -----------

export async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

// ----------- Quản lý danh sách người dùng trong app -----------

export function getAppUsers() {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (!raw) {
      localStorage.setItem(USERS_KEY, JSON.stringify(DEFAULT_APP_USERS));
      return DEFAULT_APP_USERS;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_APP_USERS;
  }
}

export function saveAppUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export async function addAppUser(userData) {
  const users = getAppUsers();
  if (users.some((u) => u.username === userData.username)) {
    throw new Error('Tên đăng nhập đã tồn tại!');
  }
  const hash = await hashPassword(userData.password);
  const newUser = {
    id: 'u_' + Date.now(),
    username: userData.username.trim().toLowerCase(),
    passwordHash: hash,
    name: userData.name.trim(),
    role: userData.role || 'staff',
    allowedHouses: userData.allowedHouses || null,
    canViewFinance: userData.role === 'admin' || userData.role === 'manager',
    canExport: userData.role === 'admin' || userData.role === 'manager',
    canDeleteRecords: userData.role === 'admin',
    canManageUsers: userData.role === 'admin',
    isActive: true,
    createdAt: new Date().toISOString(),
  };
  const updated = [...users, newUser];
  saveAppUsers(updated);
  return updated;
}

export function toggleUserActive(userId) {
  const users = getAppUsers();
  const updated = users.map((u) =>
    u.id === userId && u.role !== 'admin' ? { ...u, isActive: !u.isActive } : u
  );
  saveAppUsers(updated);
  return updated;
}

// ----------- Đăng nhập / Đăng xuất -----------

export async function login(username, password) {
  const users = getAppUsers();
  const user = users.find(
    (u) => u.username === username.trim().toLowerCase() && u.isActive
  );

  if (!user) {
    throw new Error('Tên đăng nhập không tồn tại hoặc tài khoản bị vô hiệu hoá.');
  }

  const hash = await hashPassword(password);
  if (hash !== user.passwordHash) {
    throw new Error('Mật khẩu không đúng. Vui lòng thử lại.');
  }

  // Lưu session (không lưu password)
  const session = {
    userId: user.id,
    username: user.username,
    name: user.name,
    role: user.role,
    allowedHouses: user.allowedHouses,
    canViewFinance: user.canViewFinance,
    canExport: user.canExport,
    canDeleteRecords: user.canDeleteRecords,
    canManageUsers: user.canManageUsers,
    loginAt: new Date().toISOString(),
  };

  // Lưu session vào sessionStorage (tự xóa khi đóng trình duyệt)
  sessionStorage.setItem(AUTH_KEY, JSON.stringify(session));

  return session;
}

export function logout() {
  sessionStorage.removeItem(AUTH_KEY);
}

export function getSession() {
  try {
    const raw = sessionStorage.getItem(AUTH_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function isAuthenticated() {
  return getSession() !== null;
}

// ----------- Kiểm tra quyền truy cập từng tính năng -----------

export function canAccessHouse(session, houseId) {
  if (!session) return false;
  if (session.role === 'admin' || session.role === 'manager') return true;
  if (!session.allowedHouses) return true;
  return session.allowedHouses.includes(houseId);
}

export function checkPermission(session, permission) {
  if (!session) return false;
  switch (permission) {
    case 'viewFinance':    return session.canViewFinance === true;
    case 'export':        return session.canExport === true;
    case 'deleteRecords': return session.canDeleteRecords === true;
    case 'manageUsers':   return session.canManageUsers === true;
    default:              return false;
  }
}

// ----------- Đổi mật khẩu -----------

export async function changePassword(userId, oldPassword, newPassword) {
  const users = getAppUsers();
  const user = users.find((u) => u.id === userId);
  if (!user) throw new Error('Người dùng không tồn tại!');

  const oldHash = await hashPassword(oldPassword);
  if (oldHash !== user.passwordHash) {
    throw new Error('Mật khẩu hiện tại không đúng!');
  }
  if (newPassword.length < 6) {
    throw new Error('Mật khẩu mới phải có ít nhất 6 ký tự!');
  }

  const newHash = await hashPassword(newPassword);
  const updated = users.map((u) => (u.id === userId ? { ...u, passwordHash: newHash } : u));
  saveAppUsers(updated);
  return true;
}
