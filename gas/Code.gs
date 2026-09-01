/**
 * Tata Umkm — Google Apps Script Backend
 *
 * Cara pakai:
 * 1. Buat Google Sheet baru
 * 2. Buka Extensions → Apps Script
 * 3. Paste kode ini, ganti API_KEY
 * 4. Deploy → New Deployment → Web App
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 5. Copy URL deployment → paste di js/api.js
 */

// ═══════════════════════════════════════════════════════════
// GANTI API KEY INI DENGAN PASSWORD MU SENDIRI
// ═══════════════════════════════════════════════════════════
const API_KEY = 'tataumkm-secret-2026';

// ═══════════════════════════════════════════════════════════
// DO GET — Public data endpoint
// ═══════════════════════════════════════════════════════════
function doGet(e) {
  const action = e.parameter.action;

  if (action === 'getData') {
    return jsonResponse(getAllData());
  }

  // Verifikasi API key via GET (untuk login editor)
  if (action === 'verifyKey') {
    const key = e.parameter.key;
    if (key === API_KEY) {
      return jsonResponse({ valid: true });
    }
    return jsonResponse({ valid: false });
  }

  return jsonResponse({ error: 'Unknown action' }, 400);
}

// ═══════════════════════════════════════════════════════════
// DO POST — Admin CRUD endpoints
// ═══════════════════════════════════════════════════════════
function doPost(e) {
  // Handle CORS preflight
  if (e.method === 'OPTIONS') {
    return ContentService.createTextOutput('')
      .setMimeType(ContentService.MimeType.TEXT);
  }

  try {
    const req = JSON.parse(e.postData.contents);

    // Verifikasi API key
    if (req.key !== API_KEY) {
      return jsonResponse({ error: 'API key tidak valid' }, 403);
    }

    switch (req.action) {
      case 'saveProduct':
        return jsonResponse(saveProduct(req.data));
      case 'deleteProduct':
        return jsonResponse(deleteProduct(req.data.id));
      case 'saveSite':
        return jsonResponse(saveSite(req.data));
      default:
        return jsonResponse({ error: 'Unknown action' }, 400);
    }
  } catch (err) {
    return jsonResponse({ error: err.message }, 500);
  }
}

// ═══════════════════════════════════════════════════════════
// HELPER — JSON response
// ═══════════════════════════════════════════════════════════
function jsonResponse(data, statusCode) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// ═══════════════════════════════════════════════════════════
// GET ALL DATA — Read dari semua sheet
// ═══════════════════════════════════════════════════════════
function getAllData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // Baca site
  const siteSheet = ss.getSheetByName('site');
  const site = {};
  if (siteSheet) {
    const siteData = siteSheet.getDataRange().getValues();
    for (let i = 1; i < siteData.length; i++) {
      if (siteData[i][0]) site[siteData[i][0]] = siteData[i][1] || '';
    }
  }

  // Baca categories
  const catSheet = ss.getSheetByName('categories');
  const categories = [];
  if (catSheet) {
    const catData = catSheet.getDataRange().getValues();
    for (let i = 1; i < catData.length; i++) {
      if (catData[i][0]) {
        categories.push({ id: catData[i][0], label: catData[i][1] || '' });
      }
    }
  }

  // Baca products
  const prodSheet = ss.getSheetByName('products');
  const products = [];
  if (prodSheet) {
    const prodData = prodSheet.getDataRange().getValues();
    const headers = prodData[0];
    for (let i = 1; i < prodData.length; i++) {
      if (!prodData[i][0]) continue;
      const product = {};
      for (let j = 0; j < headers.length; j++) {
        product[headers[j]] = prodData[i][j];
      }
      // Parse features dari JSON string
      if (typeof product.features === 'string') {
        try { product.features = JSON.parse(product.features); }
        catch (e) { product.features = []; }
      } else {
        product.features = [];
      }
      // Parse number fields
      product.price = Number(product.price) || 0;
      product.compareAt = Number(product.compareAt) || 0;
      products.push(product);
    }
  }

  return { site, categories, products };
}

// ═══════════════════════════════════════════════════════════
// SAVE PRODUCT — Insert atau update
// ═══════════════════════════════════════════════════════════
function saveProduct(data) {
  if (!data || !data.name) {
    return { error: 'Nama produk wajib diisi' };
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('products');

  // Buat sheet kalau belum ada
  if (!sheet) {
    sheet = ss.insertSheet('products');
    sheet.appendRow(['id', 'name', 'category', 'price', 'compareAt', 'badge', 'tagline', 'desc', 'features', 'mockup', 'accent', 'demoUrl']);
  }

  // Features → JSON string
  const features = Array.isArray(data.features) ? JSON.stringify(data.features) : (data.features || '[]');

  // Generate ID baru kalau perlu
  const id = data.id && data.id !== 'new' ? data.id : 'p-' + Date.now();

  const row = [
    id,
    data.name || '',
    data.category || '',
    Number(data.price) || 0,
    Number(data.compareAt) || 0,
    data.badge || '',
    data.tagline || '',
    data.desc || '',
    features,
    data.mockup || 'plain',
    data.accent || '#1D5B43',
    data.demoUrl || ''
  ];

  // Cari apakah produk sudah ada
  const existingRowIndex = findRowIndex(sheet, id);

  if (existingRowIndex > 0) {
    // Update baris yang sudah ada
    sheet.getRange(existingRowIndex, 1, 1, row.length).setValues([row]);
  } else {
    // Tambah baris baru
    sheet.appendRow(row);
  }

  return { success: true, product: { id, ...data, features: Array.isArray(data.features) ? data.features : [] } };
}

// ═══════════════════════════════════════════════════════════
// DELETE PRODUCT
// ═══════════════════════════════════════════════════════════
function deleteProduct(id) {
  if (!id) return { error: 'ID produk wajib diisi' };

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('products');
  if (!sheet) return { error: 'Sheet products tidak ditemukan' };

  const rowIndex = findRowIndex(sheet, id);
  if (rowIndex <= 0) return { error: 'Produk tidak ditemukan' };

  sheet.deleteRow(rowIndex);
  return { success: true, deleted: id };
}

// ═══════════════════════════════════════════════════════════
// SAVE SITE — Update pengaturan situs
// ═══════════════════════════════════════════════════════════
function saveSite(data) {
  if (!data) return { error: 'Data tidak boleh kosong' };

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('site');

  if (!sheet) {
    sheet = ss.insertSheet('site');
    sheet.appendRow(['key', 'value']);
  }

  // Update setiap key
  const rows = sheet.getDataRange().getValues();
  const keysToUpdate = Object.keys(data);

  for (const key of keysToUpdate) {
    let found = false;
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][0] === key) {
        sheet.getRange(i + 1, 2).setValue(data[key]);
        found = true;
        break;
      }
    }
    if (!found) {
      sheet.appendRow([key, data[key]]);
    }
  }

  return { success: true, site: data };
}

// ═══════════════════════════════════════════════════════════
// UTILITY — Cari baris berdasarkan kolom pertama (ID)
// ═══════════════════════════════════════════════════════════
function findRowIndex(sheet, id) {
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(id)) return i + 1; // 1-indexed
  }
  return -1;
}

// ═══════════════════════════════════════════════════════════
// SETUP — Jalankan sekali untuk membuat sheet + data awal
// ═══════════════════════════════════════════════════════════
function setupSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // Buat sheet "site" jika belum ada
  let siteSheet = ss.getSheetByName('site');
  if (!siteSheet) {
    siteSheet = ss.insertSheet('site');
    siteSheet.appendRow(['key', 'value']);
  }

  // Data awal site
  const siteData = [
    ['brand', 'Tata Umkm'],
    ['tagline', 'Usaha kecil, alatnya _tertata_.'],
    ['sub', 'Aplikasi web siap pakai untuk UMKM Indonesia — dari kasir kedai kopi, kalkulator HPP, sampai pencatatan keuangan pribadi. Tanpa langganan: sekali beli, langsung dipakai.'],
    ['whatsapp', '6281234567890'],
    ['location', 'Yogyakarta, Indonesia'],
    ['hours', 'Senin–Sabtu, 09.00–17.00 WIB'],
    ['note', 'Pembayaran aman via QRIS & transfer bank.']
  ];
  siteData.forEach(row => siteSheet.appendRow(row));

  // Buat sheet "categories" jika belum ada
  let catSheet = ss.getSheetByName('categories');
  if (!catSheet) {
    catSheet = ss.insertSheet('categories');
    catSheet.appendRow(['id', 'label']);
  }
  const catData = [
    ['bisnis', 'Bisnis'],
    ['produktivitas', 'Produktivitas'],
    ['personal', 'Personal'],
    ['keuangan', 'Keuangan']
  ];
  catData.forEach(row => catSheet.appendRow(row));

  // Buat sheet "products" jika belum ada
  let prodSheet = ss.getSheetByName('products');
  if (!prodSheet) {
    prodSheet = ss.insertSheet('products');
    prodSheet.appendRow(['id', 'name', 'category', 'price', 'compareAt', 'badge', 'tagline', 'desc', 'features', 'mockup', 'accent', 'demoUrl']);
  }

  Logger.log('Setup selesai! Semua sheet sudah dibuat dengan data awal.');
}
