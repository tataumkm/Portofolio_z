/**
 * Tata Umkm — API Client
 *
 * File ini menyediakan fungsi-fungsi untuk berkomunikasi
 * dengan Google Apps Script backend.
 *
 * PENTING: Ganti API_URL dengan URL deployment Apps Script mu!
 */

// ═══════════════════════════════════════════════════════════
// GANTI URL INI dengan URL deployment Google Apps Script mu
// ═══════════════════════════════════════════════════════════
const API_URL = 'https://script.google.com/macros/s/AKfycbz6MgIInPqvzJdrhskednlCvlvrWG_D3MLpePTxkfp7Gz9MKMED2z_Up8XlBkk0m0d7/exec';

// ═══════════════════════════════════════════════════════════
// FETCH DATA — Publik, tidak perlu auth
// ═══════════════════════════════════════════════════════════
async function fetchData() {
  try {
    const response = await fetch(`${API_URL}?action=getData`, {
      method: 'GET',
      redirect: 'follow'
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Gagal mengambil data:', error);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════
// POST ACTION — Admin, perlu API key
// ═══════════════════════════════════════════════════════════
async function postAction(action, data) {
  const apiKey = localStorage.getItem('tataumkm_editor_key');
  if (!apiKey) {
    return { error: 'API key tidak ditemukan. Silakan login ulang.' };
  }

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      redirect: 'follow',
      body: JSON.stringify({
        key: apiKey,
        action: action,
        data: data
      })
    });
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Gagal melakukan aksi:', error);
    return { error: error.message };
  }
}

// ═══════════════════════════════════════════════════════════
// SAVE PRODUCT
// ═══════════════════════════════════════════════════════════
async function saveProduct(productData) {
  return postAction('saveProduct', productData);
}

// ═══════════════════════════════════════════════════════════
// DELETE PRODUCT
// ═══════════════════════════════════════════════════════════
async function deleteProduct(productId) {
  return postAction('deleteProduct', { id: productId });
}

// ═══════════════════════════════════════════════════════════
// SAVE SITE SETTINGS
// ═══════════════════════════════════════════════════════════
async function saveSite(siteData) {
  return postAction('saveSite', siteData);
}

// ═══════════════════════════════════════════════════════════
// UTILITY — Format harga Indonesia
// ═══════════════════════════════════════════════════════════
function rp(n) {
  return 'Rp ' + (n || 0).toLocaleString('id-ID');
}

function fk(n) {
  return (n || 0).toLocaleString('id-ID');
}

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c =>
    ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]
  );
}
