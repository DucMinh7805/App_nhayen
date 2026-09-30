/**
 * api/houses.js
 * Vercel Serverless Function: GET/POST /api/houses
 *
 * Google Sheet tab "Houses":
 * A:id | B:name | C:address | D:color | E:createdAt
 */

import { readSheet, appendRow, setCors, SHEETS } from './_sheets.js';

function rowToHouse(row) {
  return { id: row[0], name: row[1], address: row[2] || '', color: row[3] || 'emerald' };
}

export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    if (req.method === 'GET') {
      const rows = await readSheet(SHEETS.HOUSES);
      if (rows.length <= 1) return res.json([]);
      return res.json(rows.slice(1).filter((r) => r[0]).map(rowToHouse));
    }

    if (req.method === 'POST') {
      const h = req.body;
      await appendRow(SHEETS.HOUSES, [h.id, h.name, h.address || '', h.color || 'emerald', new Date().toISOString()]);
      return res.status(201).json({ success: true, data: h });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('[API/houses]', err);
    return res.status(500).json({ error: 'Lỗi server', detail: err.message });
  }
}
