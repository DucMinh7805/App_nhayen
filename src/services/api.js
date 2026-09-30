/**
 * services/api.js
 * Client-side API service kết nối:
 * 1. Google Apps Script Web App (nếu có VITE_GOOGLE_SCRIPT_URL) - Rất đơn giản, không cần cấu hình Google Cloud phức tạp!
 * 2. Vercel Serverless API (nếu có VITE_HAS_GOOGLE_SHEETS_API = 'true')
 * 3. LocalStorage Fallback (khi chạy offline / dev chưa cấu hình)
 */

import { DEFAULT_HOUSES, INITIAL_HARVESTS, INITIAL_SALES } from '../data/constants';

const SCRIPT_URL = import.meta.env.VITE_GOOGLE_SCRIPT_URL || '';
const HAS_VERCEL_API = Boolean(import.meta.env.VITE_HAS_GOOGLE_SHEETS_API === 'true');
const BASE = import.meta.env.VITE_API_BASE_URL || '';

export const CURRENT_MODE = SCRIPT_URL
  ? 'google-script'
  : HAS_VERCEL_API
  ? 'vercel-api'
  : 'local-storage';

// ─── HELPER CHO GOOGLE APPS SCRIPT ──────────────────────────────────────────
async function scriptPost(action, data = {}) {
  const res = await fetch(SCRIPT_URL, {
    method: 'POST',
    // Dùng text/plain để tránh preflight CORS phức tạp với Apps Script
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action, ...data }),
  });
  const json = await res.json();
  if (!json.success && json.error) throw new Error(json.error);
  return json;
}

async function scriptGet(resource = 'all') {
  const url = `${SCRIPT_URL}${SCRIPT_URL.includes('?') ? '&' : '?'}resource=${resource}`;
  const res = await fetch(url);
  return res.json();
}

// ─── HELPER CHO VERCEL SERVERLESS API ───────────────────────────────────────
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

// ─── LOCAL STORAGE FALLBACK ────────────────────────────────────────────────
const LS = { HOUSES: 'nhayen_houses', HARVESTS: 'nhayen_harvests', SALES: 'nhayen_sales' };
function lsGet(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) || fallback; } catch { return fallback; }
}
function lsSet(key, val) { localStorage.setItem(key, JSON.stringify(val)); }

// ─── RE-EXPORTS TỪ AUTH ─────────────────────────────────────────────────────
export { hashPassword, getSession, logout, canAccessHouse, checkPermission } from './auth';

// ════════════════════════════════════════════════════════════════════════════
// AUTH: ĐĂNG NHẬP / NGƯỜI DÙNG
// ════════════════════════════════════════════════════════════════════════════

export async function loginUser(username, password) {
  if (SCRIPT_URL) {
    const res = await scriptPost('login', { username, password });
    sessionStorage.setItem('nhayen_auth_session', JSON.stringify(res.session));
    return res.session;
  }

  if (HAS_VERCEL_API) {
    const data = await apiFetch('/api/auth?action=login', {
      method: 'POST',
      body: { username, password },
    });
    sessionStorage.setItem('nhayen_auth_session', JSON.stringify(data.session));
    return data.session;
  }

  // Fallback: local auth
  const { login } = await import('./auth');
  return login(username, password);
}

export async function getAppUsersRemote() {
  if (SCRIPT_URL) {
    const data = await scriptGet('users');
    return data.users || [];
  }
  if (HAS_VERCEL_API) {
    return apiFetch('/api/auth?action=users');
  }
  const { getAppUsers } = await import('./auth');
  return getAppUsers();
}

export async function addAppUserRemote(userData) {
  if (SCRIPT_URL) {
    await scriptPost('addUser', { data: userData });
    return userData;
  }
  if (HAS_VERCEL_API) {
    return apiFetch('/api/auth?action=add-user', { method: 'POST', body: userData });
  }
  const { addAppUser } = await import('./auth');
  return addAppUser(userData);
}

// ════════════════════════════════════════════════════════════════════════════
// HOUSES
// ════════════════════════════════════════════════════════════════════════════

export async function getHouses() {
  if (SCRIPT_URL) {
    const data = await scriptGet('houses');
    return data.houses && data.houses.length > 0 ? data.houses : DEFAULT_HOUSES;
  }
  if (HAS_VERCEL_API) return apiFetch('/api/houses');
  return lsGet(LS.HOUSES, DEFAULT_HOUSES);
}

export async function saveHouses(houses) {
  if (SCRIPT_URL) {
    // Lưu cục bộ và đồng bộ
    lsSet(LS.HOUSES, houses);
    return;
  }
  if (HAS_VERCEL_API) {
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
  if (SCRIPT_URL) {
    const data = await scriptGet('harvests');
    return (data.harvests || []).map((h) => ({
      ...h,
      weight: Number(h.weight || 0),
    }));
  }
  if (HAS_VERCEL_API) return apiFetch('/api/harvests');
  return lsGet(LS.HARVESTS, INITIAL_HARVESTS);
}

export async function addHarvest(harvest) {
  if (SCRIPT_URL) {
    await scriptPost('addHarvest', { data: harvest });
    return harvest;
  }
  if (HAS_VERCEL_API) {
    await apiFetch('/api/harvests', { method: 'POST', body: harvest });
    return harvest;
  }
  const current = lsGet(LS.HARVESTS, []);
  const updated = [harvest, ...current];
  lsSet(LS.HARVESTS, updated);
  return harvest;
}

export async function deleteHarvest(id) {
  if (SCRIPT_URL) {
    await scriptPost('deleteHarvest', { id });
    return id;
  }
  if (HAS_VERCEL_API) {
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
  if (SCRIPT_URL) {
    const data = await scriptGet('sales');
    return (data.sales || []).map((s) => ({
      ...s,
      weight: Number(s.weight || 0),
      pricePer100g: Number(s.pricePer100g || 0),
      totalAmount: Number(s.totalAmount || 0),
    }));
  }
  if (HAS_VERCEL_API) return apiFetch('/api/sales');
  return lsGet(LS.SALES, INITIAL_SALES);
}

export async function addSale(sale) {
  if (SCRIPT_URL) {
    await scriptPost('addSale', { data: sale });
    return sale;
  }
  if (HAS_VERCEL_API) {
    await apiFetch('/api/sales', { method: 'POST', body: sale });
    return sale;
  }
  const current = lsGet(LS.SALES, []);
  const updated = [sale, ...current];
  lsSet(LS.SALES, updated);
  return sale;
}

export async function deleteSale(id) {
  if (SCRIPT_URL) {
    await scriptPost('deleteSale', { id });
    return id;
  }
  if (HAS_VERCEL_API) {
    await apiFetch(`/api/sales?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
    return id;
  }
  const current = lsGet(LS.SALES, []);
  lsSet(LS.SALES, current.filter((i) => i.id !== id));
  return id;
}

export async function updateSaleStatus(id, newStatus) {
  if (SCRIPT_URL) {
    await scriptPost('updateSaleStatus', { id, status: newStatus });
    return { id, status: newStatus };
  }
  if (HAS_VERCEL_API) {
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
