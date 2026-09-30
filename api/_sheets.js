/**
 * api/_sheets.js
 * Shared Google Sheets helper — dùng chung cho tất cả API routes
 * Chạy trên Vercel Serverless Functions (Node.js runtime)
 */

import { google } from 'googleapis';

const SHEET_ID = process.env.GOOGLE_SHEET_ID;

// Tên các sheet tab trong Google Spreadsheet
export const SHEETS = {
  HOUSES:   'Houses',
  HARVESTS: 'Harvests',
  SALES:    'Sales',
  USERS:    'Users',
};

/**
 * Khởi tạo kết nối Google Sheets API qua Service Account
 */
export async function getSheets() {
  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON || '{}');

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const sheets = google.sheets({ version: 'v4', auth });
  return { sheets, spreadsheetId: SHEET_ID };
}

/**
 * Đọc toàn bộ dữ liệu một sheet tab
 * @param {string} sheetName - tên tab (VD: 'Harvests')
 * @param {string} range - range (VD: 'A:Z')
 * @returns {string[][]} mảng 2 chiều rows (hàng đầu = header)
 */
export async function readSheet(sheetName, range = 'A:Z') {
  const { sheets, spreadsheetId } = await getSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${sheetName}!${range}`,
  });
  return res.data.values || [];
}

/**
 * Thêm 1 hàng mới vào cuối sheet
 */
export async function appendRow(sheetName, row) {
  const { sheets, spreadsheetId } = await getSheets();
  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${sheetName}!A:Z`,
    valueInputOption: 'RAW',
    requestBody: { values: [row] },
  });
}

/**
 * Xóa 1 hàng theo ID (cột đầu tiên)
 * Tìm hàng có col[0] === id, rồi xóa bằng cách clear toàn hàng
 */
export async function deleteRowById(sheetName, id) {
  const { sheets, spreadsheetId } = await getSheets();
  const rows = await readSheet(sheetName);
  const rowIndex = rows.findIndex((r) => r[0] === id);
  if (rowIndex < 1) return false; // -1 = không tìm thấy, 0 = header

  // Xóa bằng batchUpdate deleteRows
  const sheetMeta = await sheets.spreadsheets.get({ spreadsheetId });
  const sheetObj = sheetMeta.data.sheets.find(
    (s) => s.properties.title === sheetName
  );
  const sheetId = sheetObj?.properties?.sheetId;
  if (sheetId === undefined) return false;

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [{
        deleteDimension: {
          range: {
            sheetId,
            dimension: 'ROWS',
            startIndex: rowIndex,
            endIndex: rowIndex + 1,
          },
        },
      }],
    },
  });
  return true;
}

/**
 * Cập nhật 1 ô trong sheet theo ID hàng
 */
export async function updateCellById(sheetName, id, colIndex, newValue) {
  const { sheets, spreadsheetId } = await getSheets();
  const rows = await readSheet(sheetName);
  const rowIndex = rows.findIndex((r) => r[0] === id);
  if (rowIndex < 1) return false;

  const colLetter = String.fromCharCode(65 + colIndex); // A=0, B=1...
  const rangeStr = `${sheetName}!${colLetter}${rowIndex + 1}`;

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: rangeStr,
    valueInputOption: 'RAW',
    requestBody: { values: [[newValue]] },
  });
  return true;
}

/**
 * CORS headers chuẩn cho Vercel
 */
export function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}
