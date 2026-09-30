/**
 * api/sales.js
 * Vercel Serverless Function: GET/POST/DELETE/PUT /api/sales
 *
 * Google Sheet tab "Sales" — cấu trúc cột:
 * A:id | B:houseId | C:houseName | D:date | E:customerName | F:customerPhone
 * G:weight | H:typeId | I:typeName | J:pricePer100g | K:totalAmount | L:status | M:note | N:staffName | O:createdAt
 */

import { readSheet, appendRow, deleteRowById, updateCellById, setCors, SHEETS } from './_sheets.js';

const COL = {
  id: 0, houseId: 1, houseName: 2, date: 3, customerName: 4, customerPhone: 5,
  weight: 6, typeId: 7, typeName: 8, pricePer100g: 9, totalAmount: 10,
  status: 11, note: 12, staffName: 13, createdAt: 14,
};

function rowToSale(row) {
  return {
    id:            row[COL.id]            || '',
    houseId:       row[COL.houseId]       || '',
    houseName:     row[COL.houseName]     || '',
    date:          row[COL.date]          || '',
    customerName:  row[COL.customerName]  || '',
    customerPhone: row[COL.customerPhone] || '',
    weight:        Number(row[COL.weight]       || 0),
    typeId:        row[COL.typeId]        || 'tho_a',
    typeName:      row[COL.typeName]      || '',
    pricePer100g:  Number(row[COL.pricePer100g] || 0),
    totalAmount:   Number(row[COL.totalAmount]  || 0),
    status:        row[COL.status]        || 'paid',
    note:          row[COL.note]          || '',
    staffName:     row[COL.staffName]     || '',
    createdAt:     row[COL.createdAt]     || '',
  };
}

function saleToRow(s) {
  return [
    s.id, s.houseId, s.houseName, s.date,
    s.customerName, s.customerPhone || '',
    s.weight, s.typeId, s.typeName,
    s.pricePer100g || 0, s.totalAmount || 0,
    s.status || 'paid', s.note || '',
    s.staffName || '', s.createdAt || new Date().toISOString(),
  ];
}

export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    if (req.method === 'GET') {
      const rows = await readSheet(SHEETS.SALES);
      if (rows.length <= 1) return res.json([]);
      const sales = rows.slice(1)
        .filter((r) => r[0])
        .map(rowToSale)
        .sort((a, b) => new Date(b.date) - new Date(a.date));
      return res.json(sales);
    }

    if (req.method === 'POST') {
      const sale = req.body;
      if (!sale.id || !sale.houseId || !sale.weight) {
        return res.status(400).json({ error: 'Thiếu thông tin bắt buộc' });
      }
      await appendRow(SHEETS.SALES, saleToRow(sale));
      return res.status(201).json({ success: true, data: sale });
    }

    if (req.method === 'DELETE') {
      const { id } = req.query;
      if (!id) return res.status(400).json({ error: 'Thiếu id' });
      const ok = await deleteRowById(SHEETS.SALES, id);
      if (!ok) return res.status(404).json({ error: 'Không tìm thấy đơn' });
      return res.json({ success: true });
    }

    // PUT: Cập nhật trạng thái thanh toán (paid/debt)
    if (req.method === 'PUT') {
      const { id } = req.query;
      const { status } = req.body;
      if (!id || !status) return res.status(400).json({ error: 'Thiếu id hoặc status' });
      await updateCellById(SHEETS.SALES, id, COL.status, status);
      return res.json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('[API/sales]', err);
    return res.status(500).json({ error: 'Lỗi server', detail: err.message });
  }
}
