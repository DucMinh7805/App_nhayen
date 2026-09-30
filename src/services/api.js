/**
 * services/api.js
 * Client-side API service — Gọi tới các Vercel Serverless Functions
 * Tự động fallback localStorage khi chạy dev localhost (chưa có biến môi trường)
 */

// Trong môi trường Vercel, BASE_URL = '' (same origin)
// Trong dev localhost (chưa có API), sẽ dùng localStorage fallback
const BASE = import.meta.env.VITE_API_BASE_URL || '';

// Kiểm tra có đang chạy với API thực không
const HAS_API = Boolean(import.meta.env.VITE_HAS_GOOGLE_SHEETS_API === 'true');

// ─── Fetch helper với error handling ────────────────────────────────────────

async function apiFetch(path, options = {}) {
  const url = `${BASE}${path}`;
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || `HTTP ${res.status}`);
  }

  return res.json();
}

// ─── localStorage Keys (fallback khi dev) ────────────────────────────────────
import { DEFAULT_HOUSES, INITIAL_HARVESTS, INITIAL_SALES } from '../data/constants';

const LS = { HOUSES: 'nhayen_houses', HARVESTS: 'nhayen_harvests', SALES: 'nhayen_sales' };

function lsGet(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) || fallback; } catch { return fallback; }
}
function lsSet(key, val) { localStorage.setItem(key, JSON.stringify(val)); }

// ════════════════════════════════════════════════════════════════════════════
// AUTH
// ════════════════════════════════════════════════════════════════════════════

export { hashPassword, getSession, logout, canAccessHouse, checkPermission } from './auth';

/**
 * Đăng nhập — thử API trước, fallback localStorage
 */
export async function loginUser(username, password) {
  if (HAS_API) {
    const data = await apiFetch('/api/auth?action=login', {
      method: 'POST',
      body: { username, password },
    });
    // Lưu session vào sessionStorage
    sessionStorage.setItem('nhayen_auth_session', JSON.stringify(data.session));
    return data.session;
  }

  // Fallback: dùng auth.js cục bộ (localStorage-based)
  const { login } = await import('./auth');
  return login(username, password);
}

export async function getAppUsersRemote() {
  if (HAS_API) {
    return apiFetch('/api/auth?action=users');
  }
  const { getAppUsers } = await import('./auth');
  return getAppUsers();
}

export async function addAppUserRemote(userData) {
  if (HAS_API) {
    return apiFetch('/api/auth?action=add-user', { method: 'POST', body: userData });
  }
  const { addAppUser } = await import('./auth');
  return addAppUser(userData);
}

// ════════════════════════════════════════════════════════════════════════════
// HOUSES
// ════════════════════════════════════════════════════════════════════════════

export async function getHouses() {
  if (HAS_API) return apiFetch('/api/houses');
  return lsGet(LS.HOUSES, DEFAULT_HOUSES);
}

export async function saveHouses(houses) {
  if (HAS_API) {
    // Upsert mới — chỉ POST nhà chưa có
    const existing = await getHouses();
    const existingIds = new Set(existing.map((h) => h.id));
    const newHouses = houses.filter((h) => !existingIds.has(h.id));
    for (const h of newHouses) {
      await apiFetch('/api/houses', { method: 'POST', body: h });
    }
    return;
  }
  lsSet(LS.HOUSES, houses);
}

// ════════════════════════════════════════════════════════════════════════════
// HARVESTS
// ════════════════════════════════════════════════════════════════════════════

export async function getHarvests() {
  if (HAS_API) return apiFetch('/api/harvests');
  return lsGet(LS.HARVESTS, INITIAL_HARVESTS);
}

export async function addHarvest(harvest) {
  if (HAS_API) {
    await apiFetch('/api/harvests', { method: 'POST', body: harvest });
    return harvest;
  }
  const current = lsGet(LS.HARVESTS, []);
  const updated = [harvest, ...current];
  lsSet(LS.HARVESTS, updated);
  return harvest;
}

export async function deleteHarvest(id) {
  if (HAS_API) {
    await apiFetch(`/api/harvests?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
    return id;
  }
  const current = lsGet(LS.HARVESTS, []);
  lsSet(LS.HARVESTS, current.filter((i) => i.id !== id));
  return id;
}

// ════════════════════════════════════════════════════════════════════════════
// SALES
// ════════════════════════════════════════════════════════════════════════════

export async function getSales() {
  if (HAS_API) return apiFetch('/api/sales');
  return lsGet(LS.SALES, INITIAL_SALES);
}

export async function addSale(sale) {
  if (HAS_API) {
    await apiFetch('/api/sales', { method: 'POST', body: sale });
    return sale;
  }
  const current = lsGet(LS.SALES, []);
  const updated = [sale, ...current];
  lsSet(LS.SALES, updated);
  return sale;
}

export async function deleteSale(id) {
  if (HAS_API) {
    await apiFetch(`/api/sales?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
    return id;
  }
  const current = lsGet(LS.SALES, []);
  lsSet(LS.SALES, current.filter((i) => i.id !== id));
  return id;
}

export async function updateSaleStatus(id, newStatus) {
  if (HAS_API) {
    await apiFetch(`/api/sales?id=${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: { status: newStatus },
    });
    return { id, status: newStatus };
  }
  const current = lsGet(LS.SALES, []);
  const updated = current.map((i) => (i.id === id ? { ...i, status: newStatus } : i));
  lsSet(LS.SALES, updated);
  return updated.find((i) => i.id === id);
}
