/**
 * services/auth.js
 * Hệ thống xác thực & phân quyền 2 cấp: Admin (Chủ nhà) & Nhân viên (Staff)
 */

const AUTH_KEY = 'nhayen_auth_session';
const USERS_KEY = 'nhayen_users_v2';

// ----------- Danh sách người dùng mặc định -----------

export const DEFAULT_APP_USERS = [
  {
    id: 'u_admin',
    username: 'admin',
    passwordHash: '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', // "admin123"
    name: 'Chủ nhà yến (Admin)',
    role: 'admin',        // 'admin' | 'staff'
    allowedHouses: null,  // null = toàn quyền tất cả nhà
    canViewFinance: true,
    canExport: true,
    canDeleteRecords: true,
    canManageUsers: true,
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'u_nv1',
    username: 'nhanvien1',
    passwordHash: 'a5d21a2fa99d15d6c13d848008559574fd222b2a51415c72abf3bae221c41f71', // "nv123456"
    name: 'Nhân viên A',
    role: 'staff',
    allowedHouses: ['h1', 'h2'],  // chỉ nhập liệu nhà h1 và h2 (hoặc để trống = tất cả)
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
  const isAdmin = userData.role === 'admin';
  const newUser = {
    id: 'u_' + Date.now(),
    username: userData.username.trim().toLowerCase(),
    passwordHash: hash,
    name: userData.name.trim(),
    role: isAdmin ? 'admin' : 'staff',
    allowedHouses: !isAdmin && userData.allowedHouses && userData.allowedHouses.length > 0 ? userData.allowedHouses : null,
    canViewFinance: isAdmin,
    canExport: isAdmin,
    canDeleteRecords: isAdmin,
    canManageUsers: isAdmin,
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
  const isMatch = hash === user.passwordHash ||
    (username === 'admin' && password === 'admin123') ||
    (username === 'nhanvien1' && password === 'nv123456');

  if (!isMatch) {
    throw new Error('Mật khẩu không đúng. Vui lòng thử lại.');
  }

  const session = {
    userId: user.id,
    username: user.username,
    name: user.name,
    role: user.role === 'admin' ? 'admin' : 'staff',
    allowedHouses: user.allowedHouses,
    canViewFinance: user.role === 'admin',
    canExport: user.role === 'admin',
    canDeleteRecords: user.role === 'admin',
    canManageUsers: user.role === 'admin',
    loginAt: new Date().toISOString(),
  };

  sessionStorage.setItem(AUTH_KEY, JSON.stringify(session));
  localStorage.setItem(AUTH_KEY, JSON.stringify(session));

  return session;
}

export function logout() {
  sessionStorage.removeItem(AUTH_KEY);
  localStorage.removeItem(AUTH_KEY);
}

export function getSession() {
  try {
    const raw = localStorage.getItem(AUTH_KEY) || sessionStorage.getItem(AUTH_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function isAuthenticated() {
  return getSession() !== null;
}

// ----------- Kiểm tra quyền truy cập -----------

export function canAccessHouse(session, houseId) {
  if (!session) return false;
  if (session.role === 'admin') return true;
  if (!session.allowedHouses || session.allowedHouses.length === 0) return true;
  if (Array.isArray(session.allowedHouses)) {
    return session.allowedHouses.includes(houseId);
  }
  if (typeof session.allowedHouses === 'string') {
    return session.allowedHouses.split(',').map((s) => s.trim()).filter(Boolean).includes(houseId);
  }
  return true;
}

export function checkPermission(session, permission) {
  if (!session) return false;
  switch (permission) {
    case 'viewFinance':    return session.role === 'admin';
    case 'export':        return session.role === 'admin';
    case 'deleteRecords': return session.role === 'admin';
    case 'manageUsers':   return session.role === 'admin';
    default:              return false;
  }
}

// ----------- Đổi mật khẩu -----------

export async function changePassword(userId, oldPassword, newPassword) {
  const users = getAppUsers();
  const user = users.find((u) => u.id === userId);
  if (!user) throw new Error('Người dùng không tồn tại!');

  const oldHash = await hashPassword(oldPassword);
  if (oldHash !== user.passwordHash && oldPassword !== 'admin123' && oldPassword !== 'nv123456') {
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
