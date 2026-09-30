/**
 * services/api.js
 * Client API Service kết nối Google Apps Script Web App (với Fallback tự động & SWR Caching)
 */

import { DEFAULT_HOUSES, INITIAL_HARVESTS, INITIAL_SALES, DEFAULT_GOOGLE_SCRIPT_URL } from '../data/constants';

// Ưu tiên: Biến môi trường VITE_GOOGLE_SCRIPT_URL > URL mặc định cố định trong code
export const SCRIPT_URL = import.meta.env.VITE_GOOGLE_SCRIPT_URL || DEFAULT_GOOGLE_SCRIPT_URL;

// ─── LOCAL STORAGE CACHE (Dùng cho SWR Caching & Offline) ─────────────────────
const CACHE_KEYS = {
  HOUSES: 'nhayen_cached_houses',
  HARVESTS: 'nhayen_cached_harvests',
  SALES: 'nhayen_cached_sales',
  USERS: 'nhayen_cached_users',
  LAST_SYNC: 'nhayen_last_sync_time',
};

function getCache(key, fallback) {
  try {
    const d = localStorage.getItem(key);
    return d ? JSON.parse(d) : fallback;
  } catch {
    return fallback;
  }
}

function setCache(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn('Lỗi ghi cache:', e);
  }
}

export function getLastSyncTime() {
  return localStorage.getItem(CACHE_KEYS.LAST_SYNC);
}

// ─── HELPER CHO GOOGLE APPS SCRIPT ──────────────────────────────────────────
async function scriptPost(action, data = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000); // 12s timeout

  try {
    const res = await fetch(SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action, ...data }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    const json = await res.json();
    if (!json.success && json.error) throw new Error(json.error);
    return json;
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error('Kết nối Google Sheet quá hạn (Timeout). Vui lòng thử lại.');
    }
    throw err;
  }
}

async function scriptGet(resource = 'all') {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);

  try {
    const url = `${SCRIPT_URL}${SCRIPT_URL.includes('?') ? '&' : '?'}resource=${resource}&t=${Date.now()}`;
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    return await res.json();
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

// ─── RE-EXPORTS TỪ AUTH ─────────────────────────────────────────────────────
export { hashPassword, getSession, logout, canAccessHouse, checkPermission } from './auth';

// ════════════════════════════════════════════════════════════════════════════
// TẢI TẤT CẢ DỮ LIỆU ĐỒNG THỜI (SWR BATCH LOAD)
// ════════════════════════════════════════════════════════════════════════════

export async function fetchAllData() {
  try {
    const data = await scriptGet('all');
    const houses = data.houses && data.houses.length > 0 ? data.houses : DEFAULT_HOUSES;
    const harvests = (data.harvests || []).map((h) => ({
      ...h,
      weight: Number(h.weight || 0),
      date: String(h.date || '').slice(0, 10),
    }));
    const sales = (data.sales || []).map((s) => ({
      ...s,
      weight: Number(s.weight || 0),
      pricePer100g: Number(s.pricePer100g || 0),
      totalAmount: Number(s.totalAmount || 0),
      date: String(s.date || '').slice(0, 10),
      customerPhone: s.customerPhone ? String(s.customerPhone).replace(/^'/, '') : '',
    }));

    // Cập nhật Cache
    setCache(CACHE_KEYS.HOUSES, houses);
    setCache(CACHE_KEYS.HARVESTS, harvests);
    setCache(CACHE_KEYS.SALES, sales);
    localStorage.setItem(CACHE_KEYS.LAST_SYNC, new Date().toISOString());

    return { houses, harvests, sales, fromCache: false };
  } catch (err) {
    console.warn('Lỗi gọi API Google Sheet, lấy từ Cache cục bộ:', err);
    return {
      houses: getCache(CACHE_KEYS.HOUSES, DEFAULT_HOUSES),
      harvests: getCache(CACHE_KEYS.HARVESTS, INITIAL_HARVESTS),
      sales: getCache(CACHE_KEYS.SALES, INITIAL_SALES),
      fromCache: true,
      error: err.message,
    };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// AUTH: ĐĂNG NHẬP / NGƯỜI DÙNG
// ════════════════════════════════════════════════════════════════════════════

export async function loginUser(username, password, remember = true) {
  try {
    const res = await scriptPost('login', { username, password });
    const sessionStr = JSON.stringify(res.session);
    if (remember) {
      localStorage.setItem('nhayen_auth_session', sessionStr);
    } else {
      sessionStorage.setItem('nhayen_auth_session', sessionStr);
    }
    return res.session;
  } catch (err) {
    // Nếu mất mạng hoặc lỗi, fallback thử local auth
    const { login } = await import('./auth');
    try {
      const session = await login(username, password);
      return session;
    } catch {
      throw err;
    }
  }
}

export async function getAppUsersRemote() {
  try {
    const data = await scriptGet('users');
    if (data.users) {
      setCache(CACHE_KEYS.USERS, data.users);
      return data.users;
    }
  } catch (err) {
    console.warn('Lỗi lấy Users từ Google Sheet:', err);
  }
  return getCache(CACHE_KEYS.USERS, []);
}

export async function addAppUserRemote(userData) {
  await scriptPost('addUser', { data: userData });
  return userData;
}

export async function changePasswordRemote(userId, oldPassword, newPassword) {
  await scriptPost('changePassword', { userId, oldPassword, newPassword });
  return true;
}

// ════════════════════════════════════════════════════════════════════════════
// HOUSES
// ════════════════════════════════════════════════════════════════════════════

export async function getHouses() {
  return getCache(CACHE_KEYS.HOUSES, DEFAULT_HOUSES);
}

export async function saveHouses(houses) {
  setCache(CACHE_KEYS.HOUSES, houses);
}

// ════════════════════════════════════════════════════════════════════════════
// HARVESTS
// ════════════════════════════════════════════════════════════════════════════

export async function getHarvests() {
  return getCache(CACHE_KEYS.HARVESTS, INITIAL_HARVESTS);
}

export async function addHarvest(harvest) {
  // Ghi nhận ngầm lên Google Sheet
  await scriptPost('addHarvest', { data: harvest });
  const current = getCache(CACHE_KEYS.HARVESTS, []);
  setCache(CACHE_KEYS.HARVESTS, [harvest, ...current]);
  return harvest;
}

export async function deleteHarvest(id) {
  await scriptPost('deleteHarvest', { id });
  const current = getCache(CACHE_KEYS.HARVESTS, []);
  setCache(CACHE_KEYS.HARVESTS, current.filter((i) => i.id !== id));
  return id;
}

// ════════════════════════════════════════════════════════════════════════════
// SALES
// ════════════════════════════════════════════════════════════════════════════

export async function getSales() {
  return getCache(CACHE_KEYS.SALES, INITIAL_SALES);
}

export async function addSale(sale) {
  await scriptPost('addSale', { data: sale });
  const current = getCache(CACHE_KEYS.SALES, []);
  setCache(CACHE_KEYS.SALES, [sale, ...current]);
  return sale;
}

export async function deleteSale(id) {
  await scriptPost('deleteSale', { id });
  const current = getCache(CACHE_KEYS.SALES, []);
  setCache(CACHE_KEYS.SALES, current.filter((i) => i.id !== id));
  return id;
}

export async function updateSaleStatus(id, newStatus) {
  await scriptPost('updateSaleStatus', { id, status: newStatus });
  const current = getCache(CACHE_KEYS.SALES, []);
  const updated = current.map((i) => (i.id === id ? { ...i, status: newStatus } : i));
  setCache(CACHE_KEYS.SALES, updated);
  return { id, status: newStatus };
}
