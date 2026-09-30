/**
 * api/harvests.js
 * Vercel Serverless Function: GET /api/harvests, POST /api/harvests, DELETE /api/harvests?id=xxx
 *
 * Google Sheet tab "Harvests" — cấu trúc cột:
 * A:id | B:houseId | C:houseName | D:date | E:weight | F:typeId | G:typeName | H:shift | I:note | J:staffName | K:createdAt
 */

import { readSheet, appendRow, deleteRowById, setCors, SHEETS } from './_sheets.js';

const COL = {
  id: 0, houseId: 1, houseName: 2, date: 3, weight: 4,
  typeId: 5, typeName: 6, shift: 7, note: 8, staffName: 9, createdAt: 10,
};

function rowToHarvest(row) {
  return {
    id:        row[COL.id]        || '',
    houseId:   row[COL.houseId]   || '',
    houseName: row[COL.houseName] || '',
    date:      row[COL.date]      || '',
    weight:    Number(row[COL.weight] || 0),
    typeId:    row[COL.typeId]    || 'tho_a',
    typeName:  row[COL.typeName]  || '',
    shift:     row[COL.shift]     || '',
    note:      row[COL.note]      || '',
    staffName: row[COL.staffName] || '',
    createdAt: row[COL.createdAt] || '',
  };
}

function harvestToRow(h) {
  return [
    h.id, h.houseId, h.houseName, h.date, h.weight,
    h.typeId, h.typeName, h.shift, h.note || '',
    h.staffName || '', h.createdAt || new Date().toISOString(),
  ];
}

export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    // ── GET: Lấy tất cả phiếu thu hoạch ──────────────────────────────────
    if (req.method === 'GET') {
      const rows = await readSheet(SHEETS.HARVESTS);
      if (rows.length <= 1) return res.json([]); // Chỉ có header hoặc trống
      const harvests = rows.slice(1)
        .filter((r) => r[0]) // Bỏ hàng trống
        .map(rowToHarvest)
        .sort((a, b) => new Date(b.date) - new Date(a.date));
      return res.json(harvests);
    }

    // ── POST: Thêm phiếu thu mới ─────────────────────────────────────────
    if (req.method === 'POST') {
      const harvest = req.body;
      if (!harvest.id || !harvest.houseId || !harvest.weight) {
        return res.status(400).json({ error: 'Thiếu thông tin bắt buộc' });
      }
      await appendRow(SHEETS.HARVESTS, harvestToRow(harvest));
      return res.status(201).json({ success: true, data: harvest });
    }

    // ── DELETE: Xóa phiếu theo ID ────────────────────────────────────────
    if (req.method === 'DELETE') {
      const { id } = req.query;
      if (!id) return res.status(400).json({ error: 'Thiếu id' });
      const ok = await deleteRowById(SHEETS.HARVESTS, id);
      if (!ok) return res.status(404).json({ error: 'Không tìm thấy phiếu' });
      return res.json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('[API/harvests]', err);
    return res.status(500).json({ error: 'Lỗi server', detail: err.message });
  }
}
