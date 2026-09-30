/**
 * api/auth.js
 * Vercel Serverless Function: POST /api/auth/login, GET /api/auth/users, POST /api/auth/users
 *
 * Google Sheet tab "Users":
 * A:id | B:username | C:passwordHash | D:name | E:role | F:allowedHouses | G:canViewFinance
 * H:canExport | I:canDeleteRecords | J:canManageUsers | K:isActive | L:createdAt
 */

import { readSheet, appendRow, setCors, SHEETS } from './_sheets.js';
import { createHash } from 'crypto';

function hashPw(password) {
  return createHash('sha256').update(password).digest('hex');
}

function rowToUser(row) {
  return {
    id:               row[0]  || '',
    username:         row[1]  || '',
    passwordHash:     row[2]  || '',
    name:             row[3]  || '',
    role:             row[4]  || 'staff',
    allowedHouses:    row[5]  ? row[5].split(',').map((s) => s.trim()).filter(Boolean) : null,
    canViewFinance:   row[6]  === 'TRUE',
    canExport:        row[7]  === 'TRUE',
    canDeleteRecords: row[8]  === 'TRUE',
    canManageUsers:   row[9]  === 'TRUE',
    isActive:         row[10] !== 'FALSE',
  };
}

function userToRow(u) {
  return [
    u.id, u.username, u.passwordHash, u.name, u.role,
    Array.isArray(u.allowedHouses) ? u.allowedHouses.join(',') : '',
    u.canViewFinance   ? 'TRUE' : 'FALSE',
    u.canExport        ? 'TRUE' : 'FALSE',
    u.canDeleteRecords ? 'TRUE' : 'FALSE',
    u.canManageUsers   ? 'TRUE' : 'FALSE',
    'TRUE',
    new Date().toISOString(),
  ];
}

export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { action } = req.query;

  try {
    // ── POST /api/auth?action=login ────────────────────────────────────────
    if (req.method === 'POST' && action === 'login') {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ error: 'Thiếu thông tin đăng nhập' });
      }

      const rows = await readSheet(SHEETS.USERS);
      const users = rows.slice(1).filter((r) => r[0]).map(rowToUser);
      const user = users.find(
        (u) => u.username === username.toLowerCase().trim() && u.isActive
      );

      if (!user) {
        return res.status(401).json({ error: 'Tài khoản không tồn tại hoặc đã bị vô hiệu hoá.' });
      }

      const hash = hashPw(password);
      if (hash !== user.passwordHash) {
        return res.status(401).json({ error: 'Mật khẩu không đúng. Vui lòng thử lại.' });
      }

      // Trả về session (không trả passwordHash)
      const session = {
        userId:           user.id,
        username:         user.username,
        name:             user.name,
        role:             user.role,
        allowedHouses:    user.allowedHouses,
        canViewFinance:   user.canViewFinance,
        canExport:        user.canExport,
        canDeleteRecords: user.canDeleteRecords,
        canManageUsers:   user.canManageUsers,
        loginAt:          new Date().toISOString(),
      };

      return res.json({ success: true, session });
    }

    // ── GET /api/auth?action=users — Danh sách users (không trả hash) ────
    if (req.method === 'GET' && action === 'users') {
      const rows = await readSheet(SHEETS.USERS);
      const users = rows.slice(1).filter((r) => r[0]).map((row) => {
        const u = rowToUser(row);
        delete u.passwordHash;
        return u;
      });
      return res.json(users);
    }

    // ── POST /api/auth?action=add-user ────────────────────────────────────
    if (req.method === 'POST' && action === 'add-user') {
      const { username, password, name, role, allowedHouses } = req.body;
      if (!username || !password || !name) {
        return res.status(400).json({ error: 'Thiếu thông tin bắt buộc' });
      }

      // Kiểm tra trùng username
      const rows = await readSheet(SHEETS.USERS);
      const exists = rows.slice(1).some((r) => r[1] === username.toLowerCase().trim());
      if (exists) return res.status(409).json({ error: 'Tên đăng nhập đã tồn tại!' });

      const isAdmin    = role === 'admin';
      const isManager  = role === 'manager';
      const newUser = {
        id:               'u_' + Date.now(),
        username:         username.toLowerCase().trim(),
        passwordHash:     hashPw(password),
        name:             name.trim(),
        role:             role || 'staff',
        allowedHouses:    allowedHouses || null,
        canViewFinance:   isAdmin || isManager,
        canExport:        isAdmin || isManager,
        canDeleteRecords: isAdmin,
        canManageUsers:   isAdmin,
      };

      await appendRow(SHEETS.USERS, userToRow(newUser));
      delete newUser.passwordHash;
      return res.status(201).json({ success: true, data: newUser });
    }

    return res.status(405).json({ error: 'Method not allowed or unknown action' });
  } catch (err) {
    console.error('[API/auth]', err);
    return res.status(500).json({ error: 'Lỗi server', detail: err.message });
  }
}
