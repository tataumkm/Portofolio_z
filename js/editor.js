/**
 * Tata Umkm — Editor Logic
 *
 * Handle: login, render produk list + form, CRUD,
 * pengaturan situs, responsive behavior.
 */

/* ═══════════════════════════════════════════════════════════
   INISIALISASI
   ═══════════════════════════════════════════════════════════ */
const $ = s => document.querySelector(s);
const LS_KEY = 'tataumkm_editor_key';
const LS_DATA = 'tataumkm_editor_data';

const ICONS = {
  check:'<path d="m5 13 4 4L19 7"/>',
  x:'<path d="M18 6 6 18M6 6l12 12"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',
  pen:'<path d="M13 20h8M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z"/>',
  trash:'<path d="M4 7h16M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13"/>',
  left:'<path d="m14.5 6-6 6 6 6"/>',
  ast:'<path d="M12 3v18M4.2 7.5l15.6 9M19.8 7.5l-15.6 9"/>'
};
const I = (n, s=18) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="flex:none">${ICONS[n]}</svg>`;

function rp(n) { return 'Rp ' + (n||0).toLocaleString('id-ID'); }
function fk(n) { return (n||0).toLocaleString('id-ID'); }
function esc(s) {
  return String(s??'').replace(/[&<>"']/g, c =>
    ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]
  );
}

const MOCK_OPTS = [['pos','POS / Kasir'],['calc','Kalkulator / Form'],['invoice','Invoice / Dokumen'],['stock','Tabel Data'],['finance','Dashboard Keuangan'],['focus','Tracker / Progress'],['tools','Grid Widget'],['ledger','Daftar Piutang'],['plain','Polos (tanpa mockup)']];
const ACCENTS = ['#1D5B43','#B4562E','#1F5F66','#6B3A56','#8C6D14','#37424E','#181511'];

let DATA = { site:{}, categories:[], products:[] };
let editingId = null;
let dwTab = 'produk';

/* ═══════════════════════════════════════════════════════════
   LOGIN
   ═══════════════════════════════════════════════════════════ */
function checkLogin() {
  const key = localStorage.getItem(LS_KEY);
  if (key) {
    // Coba load data dengan key yang ada
    tryLoadData(key);
  }
}

async function tryLoadData(key) {
  // Simpan key sementara
  localStorage.setItem(LS_KEY, key);

  const result = await fetchData();
  if (result && result.products) {
    DATA = result;
    localStorage.setItem(LS_DATA, JSON.stringify(DATA));
    showEditor();
  } else {
    // Key tidak valid, tampilkan login
    localStorage.removeItem(LS_KEY);
    localStorage.removeItem(LS_DATA);
    showLogin();
  }
}

function showLogin() {
  $('.login-screen').style.display = 'flex';
  $('.editor-screen').classList.remove('active');
}

function showEditor() {
  $('.login-screen').style.display = 'none';
  $('.editor-screen').classList.add('active');
  renderAll();
}

async function doLogin() {
  const input = $('#loginKey');
  const err = $('.login-card .err');
  const key = input.value.trim();

  if (!key) {
    err.textContent = 'API key wajib diisi';
    err.classList.add('show');
    return;
  }

  err.classList.remove('show');
  const btn = $('#loginBtn');
  btn.textContent = 'Memproses...';
  btn.disabled = true;

  await tryLoadData(key);

  btn.textContent = 'Masuk';
  btn.disabled = false;

  if (!$('.editor-screen').classList.contains('active')) {
    err.textContent = 'API key tidak valid';
    err.classList.add('show');
  }
}

function doLogout() {
  localStorage.removeItem(LS_KEY);
  localStorage.removeItem(LS_DATA);
  showLogin();
}

/* ═══════════════════════════════════════════════════════════
   RENDER UTAMA
   ═══════════════════════════════════════════════════════════ */
const catLabel = id => (DATA.categories.find(c => c.id === id) || {}).label || id;

function renderAll() {
  renderList();
  renderEmpty();
}

function renderEmpty() {
  if (editingId === null && DATA.products.length === 0) {
    $('#edMain').innerHTML = `
      <div class="ed-empty">
        <p class="serif">Belum ada produk</p>
        <p>Klik tombol "Tambah baru" di sidebar untuk menambah produk pertama.</p>
      </div>`;
  }
}

/* ═══════════════════════════════════════════════════════════
   SIDEBAR — List Produk
   ═══════════════════════════════════════════════════════════ */
function renderList() {
  const list = $('#edList');
  if (!list) return;

  list.innerHTML = `
    <button class="ed-add-btn" id="addBtn">${I('plus',17)} Tambah baru</button>
    ${DATA.products.map(p => `
      <div class="ed-item">
        <div class="inf"><b>${esc(p.name)}</b><span>${esc(catLabel(p.category))} · ${rp(p.price)}</span></div>
        <div class="acts">
          <button class="mini-btn" data-act="edit" data-id="${esc(p.id)}" title="Ubah">${I('pen',14)}</button>
          <button class="mini-btn danger" data-act="del" data-id="${esc(p.id)}" title="Hapus">${I('trash',14)}</button>
        </div>
      </div>`).join('')}`;

  // Bind events
  $('#addBtn').onclick = () => startEdit('new');
  list.querySelectorAll('[data-act="edit"]').forEach(btn => {
    btn.onclick = () => startEdit(btn.dataset.id);
  });
  list.querySelectorAll('[data-act="del"]').forEach(btn => {
    btn.onclick = () => confirmDelete(btn.dataset.id);
  });
}

/* ═══════════════════════════════════════════════════════════
   FORM PRODUK
   ═══════════════════════════════════════════════════════════ */
const F = (label, inner, hint='') => `<div class="fld"><label>${label}${hint?`<span class="hint"> — ${hint}</span>`:''}</label>${inner}</div>`;

function startEdit(id) {
  editingId = id;
  renderForm();
}

function renderForm() {
  const p = editingId === 'new'
    ? {name:'',category:DATA.categories[0]?.id||'',price:'',compareAt:'',badge:'',tagline:'',desc:'',features:[],mockup:'plain',accent:'#1D5B43',demoUrl:''}
    : DATA.products.find(x=>x.id===editingId);

  if (!p && editingId !== 'new') { editingId = null; renderList(); return; }

  const main = $('#edMain');
  main.innerHTML = `
    <button class="back-link" id="formBack">${I('left',14)} Kembali ke daftar</button>
    <h2 style="font-size:1.6rem;margin-bottom:20px">${editingId==='new'?'Tambah Produk Baru':'Ubah Produk'}</h2>
    ${F('Nama produk', `<input id="f-name" value="${esc(p.name)}" placeholder="mis. POS Kopi & Cafe">`)}
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
      ${F('Kategori', `<select id="f-cat">${DATA.categories.map(c=>`<option value="${c.id}" ${p.category===c.id?'selected':''}>${esc(c.label)}</option>`).join('')}</select>`)}
      ${F('Harga (Rp)', `<input id="f-price" type="number" min="0" value="${p.price||''}" placeholder="149000">`)}
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
      ${F('Harga coret (ops.)', `<input id="f-cmp" type="number" min="0" value="${p.compareAt||''}" placeholder="kosongkan bila tidak ada">`)}
      ${F('Lencana', `<select id="f-badge"><option value="">— tanpa lencana —</option>${['Terlaris','Baru','Promo'].map(b=>`<option ${p.badge===b?'selected':''}>${b}</option>`).join('')}</select>`)}
    </div>
    ${F('Tagline singkat', `<input id="f-tag" value="${esc(p.tagline)}" placeholder="satu kalimat kecil di bawah nama">`)}
    ${F('Deskripsi', `<textarea id="f-desc">${esc(p.desc)}</textarea>`)}
    ${F('Fitur (satu per baris)', `<textarea id="f-feat">${esc((p.features||[]).join('\\n'))}</textarea>`)}
    ${F('Jenis preview', `<select id="f-mk">${MOCK_OPTS.map(m=>`<option value="${m[0]}" ${p.mockup===m[0]?'selected':''}>${m[1]}</option>`).join('')}</select>`, 'tampilan tiruan di halaman detail')}
    ${F('Warna aksen', `<div class="swatches">${ACCENTS.map(a=>`<label class="sw"><input type="radio" name="f-accent" value="${a}" ${p.accent===a?'checked':''}><span style="background:${a}"></span></label>`).join('')}</div>`)}
    ${F('URL demo (ops.)', `<input id="f-url" value="${esc(p.demoUrl||'')}" placeholder="https://...">`, 'bila diisi, aplikasi asli ditampilkan dalam bingkai perangkat')}
    <div class="form-actions">
      <button class="btn sm solid" id="saveBtn">${I('check',15)} Simpan produk</button>
      <button class="btn sm line" id="cancelBtn">Batal</button>
    </div>`;

  $('#formBack').onclick = cancelEdit;
  $('#cancelBtn').onclick = cancelEdit;
  $('#saveBtn').onclick = doSave;
}

function cancelEdit() {
  editingId = null;
  renderList();
  renderEmpty();
}

async function doSave() {
  const name = $('#f-name').value.trim();
  const price = parseInt($('#f-price').value,10) || 0;
  if (!name) { toast('Nama produk wajib diisi','x'); return; }
  if (price <= 0) { toast('Harga harus lebih dari 0','x'); return; }

  const obj = {
    id: editingId === 'new' ? 'new' : editingId,
    name, category: $('#f-cat').value, price,
    compareAt: parseInt($('#f-cmp').value,10) || 0,
    badge: $('#f-badge').value,
    tagline: $('#f-tag').value.trim(),
    desc: $('#f-desc').value.trim(),
    features: $('#f-feat').value.split('\n').map(x=>x.trim()).filter(Boolean),
    mockup: $('#f-mk').value,
    accent: (document.querySelector('input[name=f-accent]:checked')||{}).value || '#1D5B43',
    demoUrl: $('#f-url').value.trim()
  };

  const btn = $('#saveBtn');
  btn.innerHTML = 'Menyimpan...';
  btn.disabled = true;

  const result = await saveProduct(obj);

  btn.innerHTML = `${I('check',15)} Simpan produk`;
  btn.disabled = false;

  if (result.error) {
    toast('Gagal menyimpan: ' + result.error, 'x');
    return;
  }

  // Update lokal
  if (editingId === 'new') {
    DATA.products.push(result.product || obj);
  } else {
    const i = DATA.products.findIndex(x=>x.id===editingId);
    if (i >= 0) DATA.products[i] = result.product || obj;
  }

  localStorage.setItem(LS_DATA, JSON.stringify(DATA));
  editingId = null;
  renderList();
  renderEmpty();
  toast('Produk disimpan');
}

/* ═══════════════════════════════════════════════════════════
   HAPUS PRODUK
   ═══════════════════════════════════════════════════════════ */
function confirmDelete(id) {
  const p = DATA.products.find(x=>x.id===id);
  if (!p) return;

  openModal(`
    <h3>Hapus produk ini?</h3>
    <p>"${esc(p.name)}" akan dihapus dari katalog.</p>
    <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:10px">
      <button class="btn sm line" id="modalCancel">Batal</button>
      <button class="btn sm" style="background:var(--clay);border-color:var(--clay);color:#fff" id="modalYes">Ya, hapus</button>
    </div>`);

  $('#modalCancel').onclick = closeModal;
  $('#modalYes').onclick = async () => {
    closeModal();
    const result = await deleteProduct(id);
    if (result.error) {
      toast('Gagal menghapus: ' + result.error, 'x');
      return;
    }
    DATA.products = DATA.products.filter(x=>x.id!==id);
    localStorage.setItem(LS_DATA, JSON.stringify(DATA));
    if (editingId === id) { editingId = null; renderEmpty(); }
    renderList();
    toast(`Produk "${p.name}" dihapus`, 'trash');
  };
}

/* ═══════════════════════════════════════════════════════════
   PENGATURAN SITUS
   ═══════════════════════════════════════════════════════════ */
function renderSiteSettings() {
  const s = DATA.site;
  const main = $('#edMain');
  main.innerHTML = `
    <h2 style="font-size:1.6rem;margin-bottom:20px">Pengaturan Situs</h2>
    ${F('Nama brand', `<input id="s-brand" value="${esc(s.brand||'')}">`)}
    ${F('Judul hero', `<input id="s-tag" value="${esc(s.tagline||'')}">`, 'bungkus kata dengan _garis bawah_ untuk aksen italic hijau')}
    ${F('Deskripsi hero', `<textarea id="s-sub">${esc(s.sub||'')}</textarea>`)}
    ${F('Nomor WhatsApp', `<input id="s-wa" value="${esc(s.whatsapp||'')}">`, 'format 62xxx tanpa +')}
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
      ${F('Lokasi', `<input id="s-loc" value="${esc(s.location||'')}">`)}
      ${F('Jam operasional', `<input id="s-hours" value="${esc(s.hours||'')}">`)}
    </div>
    ${F('Catatan footer', `<input id="s-note" value="${esc(s.note||'')}">`)}
    <div class="form-actions"><button class="btn sm solid" id="saveSiteBtn">${I('check',15)} Simpan pengaturan</button></div>`;

  $('#saveSiteBtn').onclick = doSaveSite;
}

async function doSaveSite() {
  const data = {
    brand: $('#s-brand').value.trim() || DATA.site.brand,
    tagline: $('#s-tag').value.trim(),
    sub: $('#s-sub').value.trim(),
    whatsapp: $('#s-wa').value.trim(),
    location: $('#s-loc').value.trim(),
    hours: $('#s-hours').value.trim(),
    note: $('#s-note').value.trim()
  };

  const btn = $('#saveSiteBtn');
  btn.innerHTML = 'Menyimpan...';
  btn.disabled = true;

  const result = await saveSite(data);

  btn.innerHTML = `${I('check',15)} Simpan pengaturan`;
  btn.disabled = false;

  if (result.error) {
    toast('Gagal menyimpan: ' + result.error, 'x');
    return;
  }

  DATA.site = { ...DATA.site, ...data };
  localStorage.setItem(LS_DATA, JSON.stringify(DATA));
  toast('Pengaturan situs disimpan');
}

/* ═══════════════════════════════════════════════════════════
   TAB SWITCH
   ═══════════════════════════════════════════════════════════ */
function switchTab(tab) {
  dwTab = tab;
  editingId = null;
  document.querySelectorAll('#edTabs button').forEach(b =>
    b.classList.toggle('on', b.dataset.tab === tab));

  if (tab === 'produk') {
    renderList();
    renderEmpty();
  } else {
    renderSiteSettings();
  }
}

/* ═══════════════════════════════════════════════════════════
   TOAST & MODAL
   ═══════════════════════════════════════════════════════════ */
let toastT;
function toast(msg, ic='check') {
  const t = $('#edToast');
  t.innerHTML = I(ic,17) + ' ' + esc(msg);
  t.classList.add('on');
  clearTimeout(toastT);
  toastT = setTimeout(() => t.classList.remove('on'), 2800);
}

function openModal(html) {
  $('#edModal').innerHTML = `<div class="ed-modal-card">${html}</div>`;
  $('#edModal').classList.add('on');
}
function closeModal() {
  $('#edModal').classList.remove('on');
}

/* ═══════════════════════════════════════════════════════════
   EVENT BINDING
   ═══════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  // Login
  $('#loginBtn').onclick = doLogin;
  $('#loginKey').addEventListener('keydown', e => {
    if (e.key === 'Enter') doLogin();
  });

  // Logout
  $('#logoutBtn').onclick = doLogout;

  // Tabs
  $('#edTabs').addEventListener('click', e => {
    const b = e.target.closest('button[data-tab]');
    if (b) switchTab(b.dataset.tab);
  });

  // View site
  $('#viewSiteBtn').onclick = () => window.open('index.html', '_blank');

  // Modal close on background click
  $('#edModal').addEventListener('click', e => {
    if (e.target.id === 'edModal') closeModal();
  });

  // Cek login status
  checkLogin();
});
