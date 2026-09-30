/**
 * services/api.js
 * Client API Service kết nối Google Apps Script Web App.
 * Sau khi đổi Code.gs, cần triển khai phiên bản Web App mới trước khi dùng API này.
 */

import { DEFAULT_GOOGLE_SCRIPT_URL } from '../data/constants';

// Ưu tiên: Biến môi trường VITE_GOOGLE_SCRIPT_URL > URL mặc định cố định trong code
export const SCRIPT_URL = import.meta.env.VITE_GOOGLE_SCRIPT_URL || DEFAULT_GOOGLE_SCRIPT_URL;

// ─── LOCAL STORAGE CACHE (Dùng cho SWR Caching & Offline) ─────────────────────
const CACHE_KEYS = {
  HOUSES: 'nhayen_cached_houses',
  HARVESTS: 'nhayen_cached_harvests',
  SALES: 'nhayen_cached_sales',
  USERS: 'nhayen_cached_users',
  NEST_TYPES: 'nhayen_cached_nest_types',
  PRODUCTS: 'nhayen_cached_products',
  TAGS: 'nhayen_cached_tags',
  SETTINGS: 'nhayen_cached_settings',
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
function sessionToken() {
  try {
    const raw = localStorage.getItem('nhayen_auth_session') ||
      sessionStorage.getItem('nhayen_auth_session');
    return raw ? JSON.parse(raw)?.token : null;
  } catch {
    return null;
  }
}

async function scriptPost(action, data = {}) {
  const token = action === 'login' ? null : sessionToken();
  if (action !== 'login' && !token) {
    throw new Error('Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.');
  }
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const res = await fetch(SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action, ...data, ...(token ? { token } : {}) }),
      signal: controller.signal,
      cache: 'no-store',
    });
    clearTimeout(timeoutId);
    if (!res.ok) throw new Error(`Google Sheet trả về lỗi HTTP ${res.status}.`);
    const json = await res.json();
    if (json?.success !== true) throw new Error(json?.error || 'Google Sheet trả về dữ liệu không hợp lệ.');
    return json;
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      const timeoutError = new Error('Kết nối Google Sheet quá hạn (Timeout). Vui lòng thử lại.');
      timeoutError.code = 'SHEET_TIMEOUT';
      throw timeoutError;
    }
    throw err;
  }
}

async function scriptGet(resource = 'all', retryOnTimeout = false) {
  try {
    return await scriptPost('getData', { resource });
  } catch (error) {
    if (!retryOnTimeout || error.code !== 'SHEET_TIMEOUT') throw error;
    return scriptPost('getData', { resource });
  }
}

// ─── RE-EXPORTS TỪ AUTH ─────────────────────────────────────────────────────
export { hashPassword, getSession, logout, canAccessHouse, checkPermission } from './auth';

// ════════════════════════════════════════════════════════════════════════════
// TẢI TẤT CẢ DỮ LIỆU ĐỒNG THỜI (SWR BATCH LOAD)
// ════════════════════════════════════════════════════════════════════════════

export async function fetchAllData({ retryOnTimeout = false } = {}) {
    const data = await scriptGet('all', retryOnTimeout);
    if (!Array.isArray(data.houses) || !Array.isArray(data.harvests) || !Array.isArray(data.sales)) {
      throw new Error('Dữ liệu từ Google Sheet chưa đầy đủ. Vui lòng đồng bộ lại.');
    }
    const houses = data.houses;
    const harvests = data.harvests.map((h) => ({
      ...h,
      weight: Number(h.weight || 0),
      date: String(h.date || '').slice(0, 10),
      tagIds: String(h.tagIds || ''),
    }));
    const sales = data.sales.map((s) => ({
      ...s,
      weight: Number(s.weight || 0),
      pricePer100g: Number(s.pricePer100g || 0),
      totalAmount: Number(s.totalAmount || 0),
      date: String(s.date || '').slice(0, 10),
      customerPhone: s.customerPhone ? String(s.customerPhone).replace(/^'/, '') : '',
      tagIds: String(s.tagIds || ''),
    }));
    const nestTypes = (data.nestTypes || []).map((item) => ({
      ...item,
      defaultPricePer100g: Number(item.defaultPricePer100g || 0),
      sortOrder: Number(item.sortOrder || 0),
      isActive: item.isActive !== false && String(item.isActive).toUpperCase() !== 'FALSE',
    }));
    const products = (data.products || []).map((item) => ({
      ...item,
      pricePer100g: Number(item.pricePer100g || 0),
      sortOrder: Number(item.sortOrder || 0),
      isActive: item.isActive !== false && String(item.isActive).toUpperCase() !== 'FALSE',
    }));
    const tags = (data.tags || []).map((item) => ({
      ...item,
      sortOrder: Number(item.sortOrder || 0),
      isActive: item.isActive !== false && String(item.isActive).toUpperCase() !== 'FALSE',
    }));
    const settings = data.settings && typeof data.settings === 'object' ? data.settings : {};

    // Cập nhật Cache
    setCache(CACHE_KEYS.HOUSES, houses);
    setCache(CACHE_KEYS.HARVESTS, harvests);
    setCache(CACHE_KEYS.SALES, sales);
    setCache(CACHE_KEYS.NEST_TYPES, nestTypes);
    setCache(CACHE_KEYS.PRODUCTS, products);
    setCache(CACHE_KEYS.TAGS, tags);
    setCache(CACHE_KEYS.SETTINGS, settings);
    if (settings.appName) localStorage.setItem('nhayen_public_app_name', String(settings.appName));
    localStorage.setItem(CACHE_KEYS.LAST_SYNC, new Date().toISOString());

    return { houses, harvests, sales, nestTypes, products, tags, settings, fromCache: false };
}

// ════════════════════════════════════════════════════════════════════════════
// AUTH: ĐĂNG NHẬP / NGƯỜI DÙNG
// ════════════════════════════════════════════════════════════════════════════

export async function loginUser(username, password, remember = true) {
    const res = await scriptPost('login', { username, password });
    const sessionStr = JSON.stringify(res.session);
    localStorage.removeItem('nhayen_auth_session');
    sessionStorage.removeItem('nhayen_auth_session');
    // Tránh hiển thị dữ liệu tài chính đã lưu của tài khoản trước trên cùng máy.
    Object.values(CACHE_KEYS).forEach((key) => localStorage.removeItem(key));
    if (remember) {
      localStorage.setItem('nhayen_auth_session', sessionStr);
    } else {
      sessionStorage.setItem('nhayen_auth_session', sessionStr);
    }
    return res.session;
}

export async function getAppUsersRemote() {
    const data = await scriptGet('users');
    if (data.users) {
      setCache(CACHE_KEYS.USERS, data.users);
      return data.users;
    }
    throw new Error('Không tải được danh sách tài khoản.');
}

export async function addAppUserRemote(userData) {
  await scriptPost('addUser', { data: userData });
  return userData;
}

export async function setUserActiveRemote(userId, isActive) {
  if (typeof isActive !== 'boolean') throw new Error('Trạng thái tài khoản không hợp lệ.');
  const res = await scriptPost('setUserActive', { id: userId, isActive });
  const current = getCache(CACHE_KEYS.USERS, []);
  setCache(CACHE_KEYS.USERS, current.map((user) =>
    String(user.id) === String(userId) ? { ...user, ...res.user } : user
  ));
  return res.user;
}

export async function changePasswordRemote(userId, oldPassword, newPassword) {
  const res = await scriptPost('changePassword', { userId, oldPassword, newPassword });
  if (res.session) {
    const key = 'nhayen_auth_session';
    const storage = localStorage.getItem(key) ? localStorage : sessionStorage;
    storage.setItem(key, JSON.stringify(res.session));
  }
  return true;
}

// Danh mục và tên gọi được chủ nhà quản lý trong Google Sheet.
// Gửi các phần cần sửa; bản ghi không có trong payload sẽ được giữ lại.
// Muốn ngừng dùng một mục, đặt isActive=false thay vì xóa mã cũ.
export async function saveConfiguration(configuration) {
  const res = await scriptPost('saveConfiguration', { data: configuration });
  const result = {
    nestTypes: res.nestTypes || [],
    products: res.products || [],
    tags: res.tags || [],
    settings: res.settings || {},
  };
  setCache(CACHE_KEYS.NEST_TYPES, result.nestTypes);
  setCache(CACHE_KEYS.PRODUCTS, result.products);
  setCache(CACHE_KEYS.TAGS, result.tags);
  setCache(CACHE_KEYS.SETTINGS, result.settings);
  if (result.settings.appName) localStorage.setItem('nhayen_public_app_name', String(result.settings.appName));
  return result;
}

// ════════════════════════════════════════════════════════════════════════════
// HOUSES
// ════════════════════════════════════════════════════════════════════════════

export async function getHouses() {
  return getCache(CACHE_KEYS.HOUSES, []);
}

export async function saveHouses(houses) {
  const res = await scriptPost('saveHouses', { houses });
  setCache(CACHE_KEYS.HOUSES, res.houses || houses);
  return res.houses || houses;
}

// ════════════════════════════════════════════════════════════════════════════
// HARVESTS
// ════════════════════════════════════════════════════════════════════════════

export async function getHarvests() {
  return getCache(CACHE_KEYS.HARVESTS, []);
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
  return getCache(CACHE_KEYS.SALES, []);
}

export async function addSale(sale) {
  const res = await scriptPost('addSale', { data: sale });
  const saved = { ...sale, ...(res.data || {}) };
  const current = getCache(CACHE_KEYS.SALES, []);
  setCache(CACHE_KEYS.SALES, [saved, ...current]);
  return saved;
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
