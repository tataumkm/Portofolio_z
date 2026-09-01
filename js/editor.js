/**
 * Tata Umkm — Editor Logic
 *
 * Handle: login, daftar produk, form produk (modal), CRUD,
 * pengaturan situs (modal), responsive behavior.
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
  ast:'<path d="M12 3v18M4.2 7.5l15.6 9M19.8 7.5l-15.6 9"/>'
};
const I = (n, s=18) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="flex:none">${ICONS[n]}</svg>`;

function rp(n) { return 'Rp ' + (n||0).toLocaleString('id-ID'); }
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
let saving = false;

/* ═══════════════════════════════════════════════════════════
   LOGIN
   ═══════════════════════════════════════════════════════════ */
function checkLogin() {
  const key = localStorage.getItem(LS_KEY);
  if (key) tryLoadData(key);
}

async function tryLoadData(key) {
  const valid = await verifyApiKey(key);
  if (!valid) { clearSession(); showLogin(); return; }
  localStorage.setItem(LS_KEY, key);

  const result = await fetchData();
  if (result && result.products) {
    DATA = result;
    localStorage.setItem(LS_DATA, JSON.stringify(DATA));
    showEditor();
  } else {
    clearSession(); showLogin();
  }
}

function clearSession() {
  localStorage.removeItem(LS_KEY);
  localStorage.removeItem(LS_DATA);
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
  if (!key) { err.textContent = 'API key wajib diisi'; err.classList.add('show'); return; }

  err.classList.remove('show');
  const btn = $('#loginBtn');
  btn.disabled = true; btn.textContent = 'Memproses...';
  await tryLoadData(key);
  btn.disabled = false; btn.textContent = 'Masuk';
  if (!$('.editor-screen').classList.contains('active')) {
    err.textContent = 'API key tidak valid'; err.classList.add('show');
  }
}

function doLogout() { clearSession(); showLogin(); }

/* ═══════════════════════════════════════════════════════════
   RENDER UTAMA — pilih tab
   ═══════════════════════════════════════════════════════════ */
const catLabel = id => (DATA.categories.find(c => c.id === id) || {}).label || id;

function renderAll() { switchTab(dwTab); }

function switchTab(tab) {
  dwTab = tab;
  const nav = document.querySelector('#tabNav');
  if (nav) nav.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.tab === tab));
  if (tab === 'produk') renderProducts();
  else if (tab === 'situs') renderSettings();
  else if (tab === 'testimoni') renderTestimonialsConfig();
}

/* ═══════════════════════════════════════════════════════════
   TAB PRODUK
   ═══════════════════════════════════════════════════════════ */
function renderProducts() {
  const main = $('#edMain');
  main.innerHTML = `
    <div class="ed-list-head">
      <div class="left">
        <h2>Produk</h2>
        <p>${DATA.products.length} produk</p>
      </div>
      <button class="ed-new-btn" id="newBtn">${I('plus',15)} Tambah</button>
    </div>
    <div class="ed-list">${DATA.products.length ? DATA.products.map(p => `
      <div class="ed-item" data-id="${esc(p.id)}">
        <div class="inf"><b>${esc(p.name)}${p.featured?` <span style="font-size:.62rem;color:var(--green);font-weight:700;letter-spacing:.08em;text-transform:uppercase;vertical-align:middle">★ Unggulan</span>`:''}</b><span>${esc(catLabel(p.category))} · ${rp(p.price)}</span></div>
        <div class="acts">
          <button class="mini-btn" data-act="edit" title="Ubah">${I('pen',14)}</button>
          <button class="mini-btn danger" data-act="del" title="Hapus">${I('trash',14)}</button>
        </div>
      </div>`).join('') : `<div class="ed-empty"><p class="serif">Belum ada produk</p><p>Klik "Tambah" untuk membuat produk pertama.</p></div>`}
    </div>`;

  $('#newBtn').onclick = () => openProductModal('new');
  main.querySelectorAll('.ed-item').forEach(item => {
    const id = item.dataset.id;
    item.addEventListener('click', e => {
      const act = e.target.closest('[data-act]');
      if (act) {
        if (act.dataset.act === 'del') { e.stopPropagation(); confirmDelete(id); }
        else openProductModal(id);
      } else {
        openProductModal(id);
      }
    });
  });

  // Bind tab (produk/situs) — taruh di header tetap
  bindTabs();
}

/* ═══════════════════════════════════════════════════════════
   TAB SITUS
   ═══════════════════════════════════════════════════════════ */
function renderSettings() {
  const main = $('#edMain');
  const s = DATA.site;
  const rows = [
    ['brand', 'Nama brand'],
    ['tagline', 'Judul hero'],
    ['whatsapp', 'Nomor WhatsApp'],
    ['location', 'Lokasi'],
    ['hours', 'Jam operasional'],
    ['note', 'Catatan footer']
  ];
  main.innerHTML = `
    <div class="ed-list-head">
      <div class="left">
        <h2>Pengaturan Situs</h2>
        <p>Klik baris untuk mengubah</p>
      </div>
    </div>
    <div class="ed-settings">
      ${rows.map(([k,label]) => `
        <div class="ed-settings-row" data-key="${k}">
          <span class="lbl">${label}</span>
          <span class="val">${esc(String(s[k]||'')||'—')}</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 6 6 6-6 6"/></svg>
        </div>`).join('')}
    </div>`;

  main.querySelectorAll('.ed-settings-row').forEach(row => {
    row.addEventListener('click', () => openSettingModal(row.dataset.key));
  });
  bindTabs();
}

/* Tabs shared — render di atas konten */
function bindTabs() {
  let nav = document.querySelector('#tabNav');
  if (!nav) {
    nav = document.createElement('nav');
    nav.id = 'tabNav';
    nav.className = 'ed-tabs';
    const main = $('#edMain');
    main.insertBefore(nav, main.firstChild);
  }
  nav.innerHTML = `
    <button class="${dwTab==='produk'?'on':''}" data-tab="produk">Produk</button>
    <button class="${dwTab==='situs'?'on':''}" data-tab="situs">Pengaturan Situs</button>
    <button class="${dwTab==='testimoni'?'on':''}" data-tab="testimoni">Testimoni</button>`;
  nav.querySelectorAll('button').forEach(b => b.addEventListener('click', () => switchTab(b.dataset.tab)));
}

/* ═══════════════════════════════════════════════════════════
   FORM PRODUK — modal
   ═══════════════════════════════════════════════════════════ */
const F = (label, inner, hint='') => `<div class="fld"><label>${label}${hint?`<span class="hint"> — ${hint}</span>`:''}</label>${inner}</div>`;

function openProductModal(id) {
  editingId = id;
  const isNew = id === 'new';
  const p = isNew
    ? {name:'',category:DATA.categories[0]?.id||'',price:'',compareAt:'',badge:'',tagline:'',desc:'',features:[],mockup:'plain',accent:'#1D5B43',demoUrl:'',compatibility:['laptop','tablet','phone'],image:'',featured:false}
    : DATA.products.find(x=>x.id===id);
  if (!p) { editingId = null; return; }

  $('#editModalTitle').textContent = isNew ? 'Tambah Produk' : 'Ubah Produk';
  $('#editFormBody').innerHTML = `
    ${F('Nama produk', `<input id="f-name" value="${esc(p.name)}" placeholder="mis. POS Kopi & Cafe" autofocus>`)}
    <div class="fld-grid">
      ${F('Kategori', `<select id="f-cat">${DATA.categories.map(c=>`<option value="${c.id}" ${p.category===c.id?'selected':''}>${esc(c.label)}</option>`).join('')}</select>`)}
      ${F('Harga (Rp)', `<input id="f-price" type="number" min="0" value="${p.price||''}" placeholder="149000">`)}
    </div>
    <div class="fld-grid">
      ${F('Harga coret (ops.)', `<input id="f-cmp" type="number" min="0" value="${p.compareAt||''}" placeholder="0">`)}
      ${F('Lencana', `<select id="f-badge"><option value="">— tanpa —</option>${['Terlaris','Baru','Promo'].map(b=>`<option ${p.badge===b?'selected':''}>${b}</option>`).join('')}</select>`)}
    </div>
    ${F('Tagline singkat', `<input id="f-tag" value="${esc(p.tagline)}" placeholder="satu kalimat kecil">`)}
    ${F('Deskripsi', `<textarea id="f-desc">${esc(p.desc)}</textarea>`)}
    ${F('Fitur (satu per baris)', `<textarea id="f-feat">${esc((p.features||[]).join('\\n'))}</textarea>`)}
    <div class="fld-grid">
      ${F('Jenis preview', `<select id="f-mk">${MOCK_OPTS.map(m=>`<option value="${m[0]}" ${p.mockup===m[0]?'selected':''}>${m[1]}</option>`).join('')}</select>`)}
      ${F('URL demo (ops.)', `<input id="f-url" value="${esc(p.demoUrl||'')}" placeholder="https://...">`)}
    </div>
    ${F('URL gambar produk (ops.)', `<input id="f-image" value="${esc(p.image||'')}" placeholder="https://.../screenshot.png">`, 'screenshot asli produk. Kosongkan untuk pakai preview tiruan otomatis')}
    ${F('Warna aksen', `<div class="swatches">${ACCENTS.map(a=>`<label class="sw"><input type="radio" name="f-accent" value="${a}" ${p.accent===a?'checked':''}><span style="background:${a}"></span></label>`).join('')}</div>`)}
    ${F('Kompatibilitas perangkat', `
      <div class="compat-opts">
        ${['laptop','tablet','phone'].map(d => {
          const list = (p.compatibility && p.compatibility.length) ? p.compatibility : ['laptop','tablet','phone'];
          return `<label><input type="checkbox" name="f-compat" value="${d}" ${list.includes(d)?'checked':''}> ${d==='laptop'?'Laptop':d==='tablet'?'Tablet':'HP'}</label>`;
        }).join('')}
      </div>
    `, 'centang yang didukung (boleh semua / satu)')}
    ${F('Unggulan', `
      <label style="display:inline-flex;align-items:center;gap:9px;font-size:.9rem;font-weight:500;cursor:pointer">
        <input type="checkbox" id="f-featured" ${p.featured?'checked':''}>
        Tampilkan di halaman utama sebagai rekomendasi / best seller
      </label>
    `)}
    <div class="ed-form-foot">
      <button class="btn sm line" id="cancelBtn">Batal</button>
      <button class="btn sm solid" id="saveBtn">${I('check',15)} Simpan</button>
    </div>`;

  $('#saveBtn').onclick = doSave;
  $('#cancelBtn').onclick = closeEditModal;
  $('#editModal').classList.add('on');
  setTimeout(() => { const fname = $('#f-name'); if (fname) fname.focus(); }, 50);
}

function closeEditModal() {
  $('#editModal').classList.remove('on');
  editingId = null;
  $('#editFormBody').innerHTML = '';
}

async function doSave() {
  if (saving) return; // guard double-submit
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
    demoUrl: $('#f-url').value.trim(),
    compatibility: Array.from(document.querySelectorAll('input[name=f-compat]:checked')).map(x=>x.value),
    image: $('#f-image').value.trim(),
    featured: !!document.querySelector('#f-featured')?.checked
  };

  saving = true;
  const btn = $('#saveBtn');
  btn.disabled = true; btn.textContent = 'Menyimpan...';

  const result = await saveProduct(obj);

  saving = false;
  if (!btn) return;
  btn.disabled = false; btn.innerHTML = `${I('check',15)} Simpan`;

  if (result.error) { toast('Gagal: ' + result.error, 'x'); return; }

  // Update lokal
  const saved = result.product || obj;
  const i = DATA.products.findIndex(x => x.id === saved.id);
  if (i >= 0) DATA.products[i] = saved;
  else DATA.products.push(saved);
  localStorage.setItem(LS_DATA, JSON.stringify(DATA));

  // Tutup modal & kosongkan — baik new maupun edit
  closeEditModal();
  renderProducts();
  toast('Produk disimpan');
}

/* ═══════════════════════════════════════════════════════════
   HAPUS PRODUK
   ═══════════════════════════════════════════════════════════ */
function confirmDelete(id) {
  const p = DATA.products.find(x => x.id === id);
  if (!p) return;
  openConfirm(`
    <h3>Hapus produk ini?</h3>
    <p class="cd">"${esc(p.name)}" akan dihapus dari katalog.</p>
    <div class="ed-form-foot">
      <button class="btn sm line" id="cdCancel">Batal</button>
      <button class="btn sm solid" id="cdYes" style="background:var(--clay);border-color:var(--clay)">Ya, hapus</button>
    </div>`);
  $('#cdCancel').onclick = closeConfirm;
  $('#cdYes').onclick = async () => {
    closeConfirm();
    if (saving) return;
    saving = true;
    const result = await deleteProduct(id);
    saving = false;
    if (result.error) { toast('Gagal menghapus', 'x'); return; }
    DATA.products = DATA.products.filter(x => x.id !== id);
    localStorage.setItem(LS_DATA, JSON.stringify(DATA));
    renderProducts();
    toast(`"${p.name}" dihapus`, 'trash');
  };
}

/* ═══════════════════════════════════════════════════════════
   FORM SITUS — modal
   ═══════════════════════════════════════════════════════════ */
const SETTING_FIELDS = {
  brand:    ['Nama brand', 'input'],
  tagline:  ['Judul hero', 'text', 'bungkus kata _garis bawah_ untuk aksen hijau'],
  sub:      ['Deskripsi hero', 'textarea'],
  whatsapp: ['Nomor WhatsApp', 'input', 'format 62xxx tanpa +'],
  location: ['Lokasi', 'input'],
  hours:    ['Jam operasional', 'input'],
  note:     ['Catatan footer', 'input']
};

function openSettingModal(key) {
  const [label, type, hint] = SETTING_FIELDS[key] || [key, 'input'];
  const val = DATA.site[key] || '';
  $('#editModalTitle').textContent = 'Ubah: ' + label;
  $('#editFormBody').innerHTML = `
    ${type === 'textarea'
      ? `<div class="fld"><label>${label}${hint?`<span class="hint"> — ${hint}</span>`:''}</label><textarea id="s-val">${esc(val)}</textarea></div>`
      : F(label, `<input id="s-val" value="${esc(val)}" ${hint?`placeholder="${esc(hint)}"`:''} autofocus>`, hint)}
    <div class="ed-form-foot">
      <button class="btn sm line" id="cancelBtn">Batal</button>
      <button class="btn sm solid" id="saveSiteBtn">${I('check',15)} Simpan</button>
    </div>`;

  $('#saveSiteBtn').onclick = () => doSaveSetting(key);
  $('#cancelBtn').onclick = closeSettingModal;
  $('#editModal').classList.add('on');
  setTimeout(() => { const v = $('#s-val'); if (v) v.focus(); }, 50);
}

async function doSaveSetting(key) {
  if (saving) return; // guard double-submit
  const btn = $('#saveSiteBtn');
  const val = $('#s-val').value.trim();

  saving = true;
  btn.disabled = true; btn.textContent = 'Menyimpan...';

  const payload = { ...DATA.site, [key]: val };
  const result = await saveSite(payload);

  saving = false;
  if (!btn) return;
  btn.disabled = false; btn.innerHTML = `${I('check',15)} Simpan`;

  if (result.error) { toast('Gagal: ' + result.error, 'x'); return; }

  DATA.site = { ...DATA.site, [key]: val };
  localStorage.setItem(LS_DATA, JSON.stringify(DATA));

  closeSettingModal();
  renderSettings();
  toast('Pengaturan disimpan');
}

function closeSettingModal() {
  $('#editModal').classList.remove('on');
  $('#editFormBody').innerHTML = '';
}

/* ═══════════════════════════════════════════════════════════
   TAB TESTIMONI
   ═══════════════════════════════════════════════════════════ */
function renderTestimonialsConfig() {
  const main = $('#edMain');
  const list = (DATA.testimonials && DATA.testimonials.length) ? DATA.testimonials : [];
  main.innerHTML = `
    <div class="ed-list-head">
      <div class="left">
        <h2>Testimoni</h2>
        <p>${list.length} testimoni · tampil di halaman depan</p>
      </div>
      <button class="ed-new-btn" id="newTstBtn">${I('plus',15)} Tambah</button>
    </div>
    <div class="ed-list">${list.length ? list.map(t => `
      <div class="ed-item" data-id="${esc(t.id)}">
        <div class="inf"><b>${esc(t.name)}</b><span>${esc(t.usaha||'')}${t.quote?' · '+esc(t.quote.slice(0,60))+(t.quote.length>60?'…':''):''}</span></div>
        <div class="acts">
          <button class="mini-btn" data-act="edit" title="Ubah">${I('pen',14)}</button>
          <button class="mini-btn danger" data-act="del" title="Hapus">${I('trash',14)}</button>
        </div>
      </div>`).join('') : `<div class="ed-empty"><p class="serif">Belum ada testimoni</p><p>Klik "Tambah" untuk menambah.</p></div>`}
    </div>`;
  bindTabs();

  $('#newTstBtn').onclick = () => openTstModal('new');
  main.querySelectorAll('.ed-item').forEach(item => {
    const id = item.dataset.id;
    item.addEventListener('click', e => {
      const act = e.target.closest('[data-act]');
      if (act && act.dataset.act === 'del') { e.stopPropagation(); confirmDeleteTst(id); }
      else openTstModal(id);
    });
  });
}

function openTstModal(id) {
  const isNew = id === 'new';
  const t = isNew ? {name:'',usaha:'',quote:''} : DATA.testimonials.find(x => x.id === id);
  if (!t) return;

  $('#editModalTitle').textContent = isNew ? 'Tambah Testimoni' : 'Ubah Testimoni';
  $('#editFormBody').innerHTML = `
    ${F('Nama', `<input id="t-name" value="${esc(t.name)}" placeholder="mis. Bu Ratna" autofocus>`)}
    ${F('Usaha', `<input id="t-usaha" value="${esc(t.usaha||'')}" placeholder="mis. Warung Bu Ratna">`)}
    ${F('Kutipan', `<textarea id="t-quote" placeholder="Apa yang pelanggan katakan...">${esc(t.quote||'')}</textarea>`)}
    <div class="ed-form-foot">
      <button class="btn sm line" id="cancelBtn">Batal</button>
      <button class="btn sm solid" id="saveTstBtn">${I('check',15)} Simpan</button>
    </div>`;

  $('#saveTstBtn').onclick = () => doSaveTst(id);
  $('#cancelBtn').onclick = closeSettingModal;
  $('#editModal').classList.add('on');
  setTimeout(() => { const n = $('#t-name'); if (n) n.focus(); }, 50);
}

async function doSaveTst(id) {
  if (saving) return;
  const name = $('#t-name').value.trim();
  const quote = $('#t-quote').value.trim();
  if (!name || !quote) { toast('Nama dan kutipan wajib diisi','x'); return; }

  const btn = $('#saveTstBtn');
  saving = true; btn.disabled = true; btn.textContent = 'Menyimpan...';

  const payload = { id: id === 'new' ? 'new' : id, name, usaha: $('#t-usaha').value.trim(), quote };
  const result = await saveTestimonial(payload);

  saving = false;
  if (!btn) return;
  btn.disabled = false; btn.innerHTML = `${I('check',15)} Simpan`;
  if (result.error) { toast('Gagal: ' + result.error, 'x'); return; }

  const saved = result.testimonial || payload;
  const i = DATA.testimonials.findIndex(x => x.id === saved.id);
  if (i >= 0) DATA.testimonials[i] = saved;
  else DATA.testimonials.push(saved);
  localStorage.setItem(LS_DATA, JSON.stringify(DATA));

  closeSettingModal();
  renderTestimonialsConfig();
  toast('Testimoni disimpan');
}

function confirmDeleteTst(id) {
  const t = DATA.testimonials.find(x => x.id === id);
  if (!t) return;
  openConfirm(`
    <h3>Hapus testimoni?</h3>
    <p class="cd">"${esc(t.name)}" akan dihapus.</p>
    <div class="ed-form-foot">
      <button class="btn sm line" id="cdCancel">Batal</button>
      <button class="btn sm solid" id="cdYes" style="background:var(--clay);border-color:var(--clay)">Ya, hapus</button>
    </div>`);
  $('#cdCancel').onclick = closeConfirm;
  $('#cdYes').onclick = async () => {
    closeConfirm();
    if (saving) return;
    saving = true;
    const result = await deleteTestimonial(id);
    saving = false;
    if (result.error) { toast('Gagal menghapus', 'x'); return; }
    DATA.testimonials = DATA.testimonials.filter(x => x.id !== id);
    localStorage.setItem(LS_DATA, JSON.stringify(DATA));
    renderTestimonialsConfig();
    toast('Testimoni dihapus', 'trash');
  };
}

/* ═══════════════════════════════════════════════════════════
   TOAST & CONFIRM MODAL
   ═══════════════════════════════════════════════════════════ */
let toastT;
function toast(msg, ic='check') {
  const t = $('#edToast');
  t.innerHTML = I(ic,17) + ' ' + esc(msg);
  t.classList.add('on');
  clearTimeout(toastT);
  toastT = setTimeout(() => t.classList.remove('on'), 2800);
}

function openConfirm(html) {
  $('#edModal').innerHTML = `<div class="ed-modal-card small ed-modal-headless">${html}</div>`;
  $('#edModal').classList.add('on');
}
function closeConfirm() { $('#edModal').classList.remove('on'); }

/* ═══════════════════════════════════════════════════════════
   EVENT BINDING
   ═══════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  $('#loginBtn').onclick = doLogin;
  $('#loginKey').addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });
  $('#logoutBtn').onclick = doLogout;
  $('#viewSiteBtn').onclick = () => window.open('index.html', '_blank');
  $('#editModalClose').onclick = () => { $('#editModal').classList.remove('on'); editingId = null; };
  $('#editModal').addEventListener('click', e => { if (e.target.id === 'editModal') { $('#editModal').classList.remove('on'); editingId = null; } });
  $('#edModal').addEventListener('click', e => { if (e.target.id === 'edModal') closeConfirm(); });

  // Escape menutup modal
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      if ($('#editModal').classList.contains('on')) { $('#editModal').classList.remove('on'); editingId = null; }
      else if ($('#edModal').classList.contains('on')) closeConfirm();
    }
  });

  checkLogin();
});
