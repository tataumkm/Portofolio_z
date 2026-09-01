/**
 * Tata Umkm — Viewer Logic
 *
 * Handle: render katalog, detail produk, mockup interaktif,
 * hover card, intersection observer, header scroll.
 */

/* ═══════════════════════════════════════════════════════════
   INISIALISASI
   ═══════════════════════════════════════════════════════════ */
const $ = s => document.querySelector(s);
const LS_KEY = 'tataumkm_viewer_data';

const ICONS = {
  up:'<path d="M7 17 17 7M8 7h9v9"/>', check:'<path d="m5 13 4 4L19 7"/>',
  x:'<path d="M18 6 6 18M6 6l12 12"/>', laptop:'<rect x="4" y="4.5" width="16" height="11" rx="1.4"/><path d="M2.5 19.5h19"/>',
  tablet:'<rect x="5" y="3" width="14" height="18" rx="2.2"/><path d="M11 17.8h2"/>',
  phone:'<rect x="8" y="2.5" width="8" height="19" rx="2.2"/><path d="M11.2 18.6h1.6"/>',
  plus:'<path d="M12 5v14M5 12h14"/>', pen:'<path d="M13 20h8M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z"/>',
  trash:'<path d="M4 7h16M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13"/>',
  chat:'<path d="M21 11.5a8.5 8.5 0 0 1-12.3 7.6L3.5 20.5l1.4-5.2A8.5 8.5 0 1 1 21 11.5Z"/>',
  copy:'<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h9"/>',
  ext:'<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5"/>',
  left:'<path d="m14.5 6-6 6 6 6"/>',
  shield:'<path d="M12 3.5 18.5 6v5c0 4.8-3.2 7.8-6.5 9.5C8.7 18.8 5.5 15.8 5.5 11V6Z"/>',
  zap:'<path d="M13 2.5 4.5 13.5H11l-1 8L18.5 10.5H13Z"/>',
  box:'<path d="m12 3 8.5 4.7v8.6L12 21l-8.5-4.7V7.7Z"/><path d="m3.5 7.7 8.5 4.7 8.5-4.7M12 12.4V21"/>',
  ast:'<path d="M12 3v18M4.2 7.5l15.6 9M19.8 7.5l-15.6 9"/>',
  doc:'<path d="M6 3h8l5 5v13H6Z"/><path d="M14 3v5h5M9 13h7M9 17h7"/>',
  hand:'<path d="M8 12V6.5a1.5 1.5 0 0 1 3 0V11m0-.5V5a1.5 1.5 0 0 1 3 0v6m0-1a1.5 1.5 0 0 1 3 0v4c0 4-2.5 7-6.5 7S5 16.5 5 13v-1.5a1.5 1.5 0 0 1 3 0"/>',
  card:'<rect x="3" y="5.5" width="18" height="13" rx="2"/><path d="M3 10h18M7 14.5h4"/>'
};
const I = (n, s=18) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="flex:none">${ICONS[n]}</svg>`;

let DATA;
const state = { cat: 'all', q: '', view: 'list' };
const LAYOUT_KEY = 'tataumkm_view_layout';
try { state.view = localStorage.getItem(LAYOUT_KEY) || 'list'; } catch(e){}
const finePointer = matchMedia('(pointer:fine)').matches;

/* ═══════════════════════════════════════════════════════════
   LOAD DATA — dari API atau cache
   ═══════════════════════════════════════════════════════════ */
async function loadData() {
  // Tampilkan state memuat pada katalog
  const rows = $('#rows');
  if (rows) rows.innerHTML = `<div class="empty"><p class="serif">Memuat produk...</p><p>Mengambil data dari server.</p></div>`;

  // Tampilkan cache dulu (instant), lalu update dari API
  let hasCache = false;
  try {
    const cached = localStorage.getItem(LS_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed && parsed.products) {
        DATA = parsed;
        renderAll();
        hasCache = true;
      }
    }
  } catch (e) {}

  // Fetch dari API
  const apiData = await fetchData();
  if (apiData && apiData.products && apiData.products.length) {
    DATA = apiData;
    localStorage.setItem(LS_KEY, JSON.stringify(DATA));
    renderAll();
    return;
  }

  // API gagal / kosong — cek apakah masih ada cache yang sudah dirender
  if (hasCache) return;

  // Tidak ada cache dan API kosong/gagal
  if (rows && !rows.querySelector('.prow')) {
    rows.innerHTML = `<div class="empty"><p class="serif">Produk belum dimuat</p><p>Gagal terhubung ke server. Pastikan URL API sudah benar di <b>js/api.js</b>.</p><button id="retryBtn" style="margin-top:14px;text-decoration:underline;color:var(--green);font-weight:600">Coba lagi</button></div>`;
    const rb = $('#retryBtn');
    if (rb) rb.onclick = () => location.reload();
  }
}

/* ═══════════════════════════════════════════════════════════
   JAM PADA MOCKUP
   ═══════════════════════════════════════════════════════════ */
setInterval(() => {
  const t = new Date().toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit', second:'2-digit'});
  document.querySelectorAll('[data-mk-clock]').forEach(el => el.textContent = t);
}, 1000);

/* ═══════════════════════════════════════════════════════════
   MOCKUP APP (digambar dengan DOM)
   ═══════════════════════════════════════════════════════════ */
const POS_MENU = [['Kopi Susu',18000],['Americano',16000],['Matcha Latte',24000],['Es Teh Manis',10000],['Croissant',25000],['Roti Bakar',20000],['Air Mineral',6000],['Susu Pisang',14000],['Kopi Tubruk',12000],['Es Jeruk',13000],['Banana Bread',22000],['Cimory',12000]];

function mkPos(p){
  const items = POS_MENU.map(m => `<button class="mkpi" data-n="${m[0]}" data-p="${m[1]}"><span class="dot"></span><span>${m[0]}</span><b>${fk(m[1])}</b></button>`).join('');
  const cats  = ['Semua','Kopi','Non-Kopi','Makanan'].map((c,i)=>`<button class="mkpc ${i==0?'on':''}">${c}</button>`).join('');
  return `<div class="mk mk-pos" style="--a:${p.accent}">
    <div class="mktop"><span class="mktop-brand">◉ ${esc(p.name)}</span><span class="mktop-clock" data-mk-clock></span><span class="mktop-cas">Kasir 01</span></div>
    <div class="mkpos-body">
      <div class="mkpos-main">
        <div class="mkpos-cats">${cats}</div>
        <div class="mkpos-items">${items}</div>
      </div>
      <div class="mkpos-cart">
        <p class="mkpos-ct">Pesanan #1042 <span>Meja 04</span></p>
        <div class="mkcl-wrap">
          <div class="mkcl" data-n="Kopi Susu" data-q="1" data-p="18000"><span>1×</span><span class="n">Kopi Susu</span><b>18.000</b></div>
        </div>
        <div class="mksum"><span>Subtotal</span><b class="mksub">18.000</b></div>
        <div class="mksum"><span>Pajak (11%)</span><b class="mktax">1.980</b></div>
        <div class="mksum tot"><span>Total</span><b class="mktot">19.980</b></div>
        <button class="mkpay">Bayar Sekarang</button>
      </div>
    </div>
    <div class="mkpos-btm"><span>Total <span class="mktot2">19.980</span></span><span class="b">Lihat Pesanan</span></div>
  </div>`;
}

function mkCalc(p){
  return `<div class="mk mkform" style="--a:${p.accent}">
    <div class="mkpanel">
      <h5>Harga Pokok Produksi</h5>
      <div class="mkfield"><span>Produk</span><b>Kopi Susu 250ml</b></div>
      <div class="mkfield"><span>Target margin</span><b>55%</b></div>
      <div class="mkrow hd"><span>Bahan</span><span>Takaran</span><span>Biaya</span></div>
      <div class="mkrow"><span class="n">Kopi Arabika</span><span>18 g</span><b>2.700</b></div>
      <div class="mkrow"><span class="n">Susu UHT</span><span>180 ml</span><b>3.240</b></div>
      <div class="mkrow"><span class="n">Gula cair</span><span>15 ml</span><b>450</b></div>
      <div class="mkrow"><span class="n">Kemasan + sedotan</span><span>1 pcs</span><b>1.200</b></div>
      <div class="mkrow"><span class="n">Overhead &amp; upah</span><span>1 unit</span><b>2.100</b></div>
    </div>
    <div class="mkpanel mkres">
      <span class="lbl">HPP per unit</span>
      <span class="big">Rp 9.690</span>
      <div class="mkbar"><span style="width:64px">Bahan</span><span class="tr"><i style="width:66%"></i></span><span>66%</span></div>
      <div class="mkbar"><span style="width:64px">Kemasan</span><span class="tr"><i style="width:12%"></i></span><span>12%</span></div>
      <div class="mkbar"><span style="width:64px">Overhead</span><span class="tr"><i style="width:22%"></i></span><span>22%</span></div>
      <div class="row2"><span>Harga jual disarankan</span><b>Rp 21.500</b></div>
      <div class="row2"><span>Untung per unit</span><b>Rp 11.810</b></div>
    </div>
  </div>`;
}

function mkInvoice(p){
  return `<div class="mk mkinv" style="--a:${p.accent}">
    <div class="mkinv-list">
      <span class="lbl">Invoice</span>
      <div class="mkiv on"><span>#1042 · Kedai Senja</span><span class="st ok">Terbayar</span></div>
      <div class="mkiv"><span>#1041 · Warung Bu Rat</span><span class="st no">Menunggu</span></div>
      <div class="mkiv"><span>#1040 · PT Sinar Abadi</span><span class="st ok">Terbayar</span></div>
      <div class="mkiv"><span>#1039 · Toko Melati</span><span class="st ok">Terbayar</span></div>
      <div class="mkiv"><span>#1038 · Katering Ibu Yanti</span><span class="st ok">Terbayar</span></div>
    </div>
    <div class="mkdoc">
      <div class="mkdoc-h"><div><b>INVOICE #1042</b><small>Terbit 12 Mei 2025 · Jatuh tempo 19 Mei</small></div><div style="text-align:right;font-size:.62rem;color:#6A6152"><b style="font-size:.78rem">${esc(DATA.site.brand)}</b><br>Jl. Kenanga No. 8</div></div>
      <div class="to"><span>Kepada:<br><b style="color:#282319">Kedai Senja</b></span><span style="text-align:right">Pembayaran:<br><b style="color:#282319">Transfer BCA</b></span></div>
      <table><tr><th>Deskripsi</th><th>Qty</th><th>Nilai</th></tr>
      <tr><td>Paket Langganan Kopi Arabika</td><td>12</td><td>2.400.000</td></tr>
      <tr><td>Biaya kirim area kota</td><td>1</td><td>75.000</td></tr>
      <tr><td>Diskon pelanggan setia</td><td>—</td><td>−120.000</td></tr></table>
      <div class="tot"><span>Total tagihan <small style="font-weight:500;opacity:.7">(termasuk PPN 11%)</small></span><span>Rp 2.619.275</span></div>
    </div>
  </div>`;
}

function mkStock(p){
  const rows = [
    ['Kopi Arabika 1kg','SKU-011','Aman',78,'2.850.000',0],
    ['Susu UHT 1L','SKU-034','Menipis',22,'18.900',1],
    ['Gula Pasir 25kg','SKU-020','Aman',64,'312.000',0],
    ['Cup 12oz','SKU-051','Menipis',15,'950',1],
    ['Sedotan paper','SKU-052','Aman',82,'115',0],
    ['Sirup vanilla','SKU-077','Habis',0,'86.000',2]
  ];
  return `<div class="mk mktab" style="--a:${p.accent}">
    <div class="mktab-bar"><div class="srch">Cari barang…</div><div class="ad">+ Barang Masuk</div></div>
    <div class="mkrow-t hd"><span>Produk</span><span>SKU</span><span>Level Stok</span><span>Nilai</span></div>
    ${rows.map(r=>`<div class="mkrow-t"><div><div class="n">${r[0]}</div><span class="sku">Min. 30 pcs</span></div><span class="sku c2">${r[1]}</span><div><div class="lvl ${r[3]==0?'none':r[4]?'low':''}"><i style="width:${r[3]}%"></i></div><span class="st2 ${r[3]==0?'none':r[4]?'low':''}" style="margin-top:4px;background:${r[3]==0?'#EDE4D0;color:#8A8272':r[4]?'#F4E3D6;color:#A04A20':'color-mix(in srgb,var(--a) 14%,#fff);color:var(--a)'}">${r[2]}</span></div><b style="color:var(--a)">${r[4]}</b></div>`).join('')}
  </div>`;
}

const finChart = a => `<svg viewBox="0 0 300 112" preserveAspectRatio="none" class="mksvg">
  <g stroke="#EAE1CB" stroke-width="1"><path d="M0 30h300M0 62h300M0 94h300"/></g>
  <polygon points="0,95 25,78 55,84 85,58 115,66 145,42 175,50 205,30 235,38 265,20 300,28 300,112 0,112" fill="${a}" opacity=".12"/>
  <polyline points="0,95 25,78 55,84 85,58 115,66 145,42 175,50 205,30 235,38 265,20 300,28" fill="none" stroke="${a}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
  <circle cx="300" cy="28" r="3.5" fill="${a}"/></svg>`;

function mkFinance(p){
  return `<div class="mk mkfin" style="--a:${p.accent}">
    <div class="mkcard2 hl"><span class="lbl" style="color:rgba(255,249,236,.72)">Saldo saat ini</span><span class="big">Rp 24.780.000</span><span style="font-size:.7rem;opacity:.8">Diperbarui hari ini, 09.12 WIB</span></div>
    <div class="mkcard2"><span class="lbl">Arus 7 hari terakhir</span>${finChart(p.accent)}<div style="display:flex;justify-content:space-between;font-size:.58rem;color:#8A8272"><span>Sen</span><span>Rab</span><span>Jum</span><span>Mgg ini</span></div></div>
    <div class="mkcard2"><div style="display:flex;justify-content:space-between"><span class="lbl">Transaksi terbaru</span><span class="lbl" style="color:var(--a)">Semua</span></div>
      <div class="mkfin-list">
        <div class="mktr"><span class="d" style="background:var(--a)"></span><span>Penjualan toko<small>Hari ini · 10.20</small></span><span class="in">+1.850.000</span></div>
        <div class="mktr"><span class="d" style="background:#C0652F"></span><span>Belanja bahan<small>Hari ini · 08.05</small></span><span class="out">−640.000</span></div>
        <div class="mktr"><span class="d" style="background:var(--a)"></span><span>Transfer langganan<small>Kemarin · 16.44</small></span><span class="in">+350.000</span></div>
        <div class="mktr"><span class="d" style="background:#C0652F"></span><span>Listrik &amp; air<small>Kemarin · 11.00</small></span><span class="out">−312.500</span></div>
        <div class="mktr"><span class="d" style="background:var(--a)"></span><span>Penjualan toko<small>Kemarin · 10.15</small></span><span class="in">+1.240.000</span></div>
      </div>
    </div>
  </div>`;
}

function mkFocus(p){
  return `<div class="mk mkfo" style="--a:${p.accent}">
    <div class="mkfo-top">
      <svg viewBox="0 0 120 120" class="mkring"><circle cx="60" cy="60" r="50" stroke="#EAE1CB" stroke-width="10" fill="none"/><circle cx="60" cy="60" r="50" stroke="${p.accent}" stroke-width="10" fill="none" stroke-linecap="round" stroke-dasharray="226 314" transform="rotate(-90 60 60)"/><text x="60" y="58" text-anchor="middle" class="mkring-t">72%</text><text x="60" y="74" text-anchor="middle" class="mkring-s">TARGET HARI INI</text></svg>
      <div><span class="lbl">Rabu, 14 Mei</span>
        <div style="font-family:'Fraunces',serif;font-size:1.15rem;font-weight:560;margin:3px 0">Rentetan 18 hari</div>
        <span style="font-size:.66rem;color:#8A8272">3 dari 5 kebiasaan selesai</span>
      </div>
    </div>
    <div class="mkdays">
      ${[['Sen',1],['Sel',1],['Rab',0],['Kam',1],['Jum',1],['Sab',0],['Akh',1]].map(d=>`<div class="mkday ${d[1]?'done':''}"><span class="c">${d[1]?I('check',11):''}</span>${d[0]}</div>`).join('')}
    </div>
    <div class="mkfh done"><span class="cb">${I('check',12)}</span><span>Cek kas &amp; stok pagi</span><small>07.00</small></div>
    <div class="mkfh done"><span class="cb">${I('check',12)}</span><span>Balas pesanan pelanggan</span><small>09.00</small></div>
    <div class="mkfh done"><span class="cb">${I('check',12)}</span><span>Update konten media sosial</span><small>13.00</small></div>
    <div class="mkfh"><span class="cb"></span><span>Catat penjualan harian</span><small>20.00</small></div>
    <div class="mkfh"><span class="cb"></span><span>Rencanakan menu besok</span><small>21.00</small></div>
  </div>`;
}

function mkTools(p){
  return `<div class="mk mkwt" style="--a:${p.accent}">
    <div class="mkw big"><span class="lbl" style="color:rgba(255,249,236,.72)">Kas hari ini</span><span class="v">Rp 4.215.000</span><span class="up">▲ 12% dari kemarin</span></div>
    <div class="mkw"><span class="lbl">Piutang jatuh tempo</span><span class="v" style="color:#A04A20">Rp 1.7jt</span><span style="font-size:.64rem;color:#8A8272">3 pelanggan menunggu</span></div>
    <div class="mkw"><span class="lbl">Stok menipis</span><span class="v">5 item</span><span style="font-size:.64rem;color:#8A8272">perlu restock minggu ini</span></div>
    <div class="mkw"><span class="lbl">Invoice terkirim</span><span class="v">12</span><span style="font-size:.64rem;color:#8A8272">bulan ini</span></div>
    <div class="mkw"><span class="w-ic">${I('doc',14)}</span><span class="lbl">Catatan cepat</span><span style="font-size:.68rem;color:#6A6152">Beli kopi arabika 2kg minggu depan…</span></div>
    <div class="mkw"><span class="w-ic">${I('box',14)}</span><span class="lbl">Barang masuk</span><span style="font-size:.7rem;font-weight:600;color:var(--a)">Catat sekarang</span></div>
  </div>`;
}

function mkLedger(p){
  return `<div class="mk mkld" style="--a:${p.accent}">
    <div class="mkld-bar"><span class="lbl">Buku Piutang — Mei 2025</span><span class="tb">+ Catat Baru</span></div>
    ${[['Warung Bu Ratna','Rp 1.250.000','jt. 18 Mei',72],['Toko Melati','Rp 840.000','jt. 21 Mei',40],['Katering Ibu Yanti','Rp 2.100.000','jt. 30 Mei',15],['Pak Darto (katering)','Rp 450.000','lunas 12 Mei',100],['Kedai Senja','Rp 1.700.000','jt. 25 Mei',55]].map(r=>`
    <div class="mkld-row"><div><div class="n">${r[0]}</div><span class="dt">${r[2]}</span></div><span class="amt">${r[1]}</span><div class="tr"><i style="width:${r[3]}%"></i></div><span class="st2" style="background:color-mix(in srgb,var(--a) 14%,#fff);color:var(--a)">${r[3]==100?'Lunas':r[3]+'%'}</span></div>`).join('')}
    <div style="display:flex;gap:8px;margin-top:2px"><span class="mkpc on" style="border-color:var(--a)">Semua</span><span class="mkpc">Piutang</span><span class="mkpc">Hutang</span><span class="mkpc">Lunas</span></div>
  </div>`;
}

const mkPlain = p => `<div class="mk mk-plain" style="--a:${p.accent}"><span class="ast">${I('ast',40)}</span><h4>${esc(p.name)}</h4><p>Preview interaktif akan tampil di sini.<br>Isi kolom "URL demo" pada editor untuk menampilkan aplikasi asli.</p></div>`;

const MOCKS = { pos:mkPos, calc:mkCalc, invoice:mkInvoice, stock:mkStock, finance:mkFinance, focus:mkFocus, tools:mkTools, ledger:mkLedger };
const mockupHTML = p => (MOCKS[p.mockup] || mkPlain)(p);

/* ═══════════════════════════════════════════════════════════
   FRAME PERANGKAT
   ═══════════════════════════════════════════════════════════ */
const DDIM = { laptop:[920,584], tablet:[560,700], phone:[360,720] };
function deviceHTML(p, device='laptop'){
  const inner = p.demoUrl
    ? `<iframe class="mk-iframe" src="${esc(p.demoUrl)}" title="Demo ${esc(p.name)}"></iframe><a class="iframe-open" href="${esc(p.demoUrl)}" target="_blank" rel="noopener">${I('ext',13)} Buka di tab baru</a>`
    : mockupHTML(p);
  return `<div class="device" data-device="${device}"><div class="d-shell"><span class="d-cam"></span><div class="d-screen">${inner}</div></div><div class="d-base"><span></span></div></div>`;
}
function fitDevice(){
  const stage = $('#deviceStage'); if(!stage) return;
  const dev = stage.querySelector('.device'); if(!dev) return;
  const [w,h] = DDIM[dev.dataset.device] || DDIM.laptop;
  const s = Math.min(1, (stage.clientWidth-16)/w, (stage.clientHeight-16)/h);
  dev.style.transform = `scale(${s})`;
}
window.addEventListener('resize', fitDevice);

/* ═══════════════════════════════════════════════════════════
   RENDER UTAMA
   ═══════════════════════════════════════════════════════════ */
const catLabel = id => (DATA.categories.find(c => c.id === id) || {}).label || id;
const waLink  = msg => `https://wa.me/${String(DATA.site.whatsapp||'').replace(/\D/g,'')}?text=${encodeURIComponent(msg)}`;

function renderMeta(){
  const s = DATA.site;
  $('#brandName').textContent = s.brand;
  $('#footBrand').textContent = s.brand;
  document.querySelectorAll('.fbrand').forEach(e=>e.textContent = s.brand);
  document.title = `${s.brand} — Aplikasi web siap pakai untuk UMKM`;
  $('#heroTag').innerHTML = esc(s.tagline).replace(/_(.+?)_/g,'<em>$1<svg viewBox="0 0 200 14" preserveAspectRatio="none" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round"><path d="M3 10 C 40 4, 70 12, 105 7 S 170 5, 197 9"/></svg></em>');
  $('#heroSub').textContent = s.sub;
  $('#statP').textContent = DATA.products.length;
  $('#statC').textContent = DATA.categories.length;
  $('#footWaNum').textContent = '+' + String(s.whatsapp||'').replace(/\D/g,'');
  $('#footHours').textContent = s.hours;
  $('#footLoc').textContent = s.location;
  $('#footNote').textContent = s.note;
  $('#yr').textContent = new Date().getFullYear();
  $('#footWa').href = waLink(`Halo ${s.brand}!`);
  $('#bandWa').href = waLink(`Halo ${s.brand}! Saya ingin diskusi soal aplikasi custom untuk usaha saya.`);
  $('#footCustom').href = $('#bandWa').href;
}

function renderMarquee(){
  const half = DATA.products.map(p =>
    `<span class="mqi"><em>${esc(p.name)}</em><span>${rp(p.price)}</span></span><span class="mq-sep">${I('ast',14)}</span>`).join('');
  $('#mqTrack').innerHTML = half + half;
}

function renderFilters(){
  const count = id => id==='all' ? DATA.products.length : DATA.products.filter(p=>p.category===id).length;
  let html = `<button class="fbtn ${state.cat==='all'?'on':''}" data-cat="all">Semua<small>${count('all')}</small></button>`;
  html += DATA.categories.map(c => `<button class="fbtn ${state.cat===c.id?'on':''}" data-cat="${c.id}">${esc(c.label)}<small>${count(c.id)}</small></button>`).join('');
  $('#filters').innerHTML = html;
}

/* Ikon perangkat yang didukung produk (untuk baris katalog) */
const DEV_MINI = { laptop:'laptop', tablet:'tablet', phone:'phone' };
function devIcons(p){
  const comp = (p.compatibility && p.compatibility.length) ? p.compatibility : ['laptop','tablet','phone'];
  return `<span class="prow-dev" title="Kompatibel: ${comp.map(d=>DEV_MINI[d]||d).join(', ')}">${comp.map(d=>I(d,13)).join('')}</span>`;
}

/* Thumbnail produk — URL gambar, fallback mockup DOM (non-interaktif) */
function productThumb(p, view){
  if (p.image) {
    return `<span class="pthumb" data-view="${view}"><img src="${esc(p.image)}" alt="${esc(p.name)}" loading="lazy" class="pthumb-img" onerror="this.closest('.pthumb').classList.add('mock');this.remove()"></span>`;
  }
  return `<span class="pthumb mock" data-view="${view}"><span class="thumb-mock">${mockupHTML(p)}</span></span>`;
}

function renderRows(){
  const q = state.q.trim().toLowerCase();
  const list = DATA.products.filter(p =>
    (state.cat==='all' || p.category===state.cat) &&
    (!q || (p.name+' '+p.tagline+' '+catLabel(p.category)).toLowerCase().includes(q)));
  const rows = $('#rows');
  if(!list.length){
    rows.innerHTML = `<div class="empty"><p class="serif">Tidak ada produk yang cocok.</p><p>Coba kata kunci lain, atau <button id="resetF">atur ulang filter</button>.</p></div>`;
    const rb = $('#resetF'); if(rb) rb.onclick = () => { state.cat='all'; state.q=''; $('#q').value=''; renderFilters(); renderRows(); };
    return;
  }

  rows.dataset.view = state.view;

  if (state.view === 'grid') {
    rows.innerHTML = list.map((p,i) => `
      <article class="prow prow-card" data-id="${esc(p.id)}" style="animation-delay:${Math.min(i*45,400)}ms">
        ${productThumb(p,'grid')}
        <div class="prow-body">
          <div class="prow-top">
            <span class="chip">${esc(catLabel(p.category))}</span>
            ${devIcons(p)}
          </div>
          <h3 class="prow-name">${esc(p.name)}${p.badge?`<span class="badge">${esc(p.badge)}</span>`:''}</h3>
          <p class="prow-tag">${esc(p.tagline)}</p>
          <span class="prow-price">${rp(p.price)}${p.compareAt?`<span class="price-old">${rp(p.compareAt)}</span>`:''}</span>
        </div>
        <span class="prow-arr">${I('up',18)}</span>
      </article>`).join('');
  } else {
    rows.innerHTML = list.map((p,i) => `
      <article class="prow" data-id="${esc(p.id)}" style="animation-delay:${Math.min(i*45,400)}ms">
        ${productThumb(p,'list')}
        <div class="prow-main">
          <h3 class="prow-name">${esc(p.name)}${p.badge?`<span class="badge">${esc(p.badge)}</span>`:''}</h3>
          <p class="prow-tag">${esc(p.tagline)}</p>
        </div>
        <div class="prow-meta">
          <span class="chip">${esc(catLabel(p.category))}</span>
          ${devIcons(p)}
          <span class="prow-price">${rp(p.price)}${p.compareAt?`<span class="price-old">${rp(p.compareAt)}</span>`:''}</span>
          <span class="prow-arr">${I('up',18)}</span>
        </div>
      </article>`).join('');
  }
}

function setView(v){
  state.view = (v === 'grid') ? 'grid' : 'list';
  try { localStorage.setItem(LAYOUT_KEY, state.view); } catch(e){}
  document.querySelectorAll('#viewToggle button').forEach(b => b.classList.toggle('on', b.dataset.view === state.view));
  renderRows();
  observeRv();
}

function syncViewToggle(){
  const tok = document.querySelector('#viewToggle');
  if (tok) tok.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.view === state.view));
}

function renderAll(){ renderMeta(); renderMarquee(); renderFilters(); renderRows(); renderTestimonials(); syncViewToggle(); }

/* ═══════════════════════════════════════════════════════════
   TESTIMONI
   ═══════════════════════════════════════════════════════════ */
function renderTestimonials(){
  const sec = $('#tst');
  const grid = $('#tstGrid');
  if (!sec) return;
  const list = (DATA.testimonials && DATA.testimonials.length) ? DATA.testimonials : [];
  if (!list.length) { sec.style.display = 'none'; return; }
  sec.style.display = '';
  if (grid) grid.innerHTML = list.slice(0, 3).map(t => `
    <figure class="tst-card rv">
      <span class="tst-q">${I('ast',18)}</span>
      <blockquote>“${esc(t.quote)}”</blockquote>
      <figcaption><b>${esc(t.name)}</b>${t.usaha?`<span>${esc(t.usaha)}</span>`:''}</figcaption>
    </figure>`).join('');
  observeRv();
}

/* ═══════════════════════════════════════════════════════════
   DETAIL PRODUK
   ═══════════════════════════════════════════════════════════ */
let currentP = null;
function openDetail(id){
  const p = DATA.products.find(x=>x.id===id); if(!p) return;
  currentP = p;
  const d = $('#detail');
  // Perangkat yang kompatibel dengan produk ini (default semua)
  const compat = (p.compatibility && p.compatibility.length) ? p.compatibility : ['laptop','tablet','phone'];
  const devs = ['laptop','tablet','phone'].filter(x => compat.includes(x));
  const firstDev = devs[0] || 'laptop';
  const DEV_LABEL = { laptop:'Laptop', tablet:'Tablet', phone:'HP' };
  const DEV_ICON = { laptop:'laptop', tablet:'tablet', phone:'phone' };
  d.innerHTML = `
    <div class="d-top">
      <button class="d-back" id="dBack">${I('left',16)} Kembali ke katalog</button>
      <a class="btn sm wa" target="_blank" rel="noopener" href="${waLink(`Halo ${DATA.site.brand}! Saya tertarik dengan produk *${p.name}*.`)}">${I('chat',15)} Chat</a>
    </div>
    <div class="detail-grid">
      <div class="d-info">
        <div class="d-eyebrow"><span class="chip">${esc(catLabel(p.category))}</span>${p.badge?`<span class="badge">${esc(p.badge)}</span>`:''}</div>
        <h2>${esc(p.name)}</h2>
        <p class="d-tagline">${esc(p.tagline)}</p>
        <p class="d-desc">${esc(p.desc)}</p>
        <ul class="d-feats">${(p.features||[]).map(f=>`<li><span class="ict">${I('check',13)}</span>${esc(f)}</li>`).join('')}</ul>
        <div class="d-buy">
          <span class="lbl">Harga sekali bayar</span>
          <p class="d-price">${rp(p.price)}${p.compareAt?`<span class="price-old">${rp(p.compareAt)}</span>`:''}</p>
          <span style="font-size:.85rem;color:var(--ink-soft)">Tanpa langganan · akses dikirim seketika setelah pembayaran</span>
          <div class="row">
            <a class="btn wa" target="_blank" rel="noopener" href="${waLink(`Halo ${DATA.site.brand}! Saya ingin memesan produk *${p.name}* (${rp(p.price)}). Boleh minta info pembayarannya?`)}">${I('chat',16)} Pesan lewat WhatsApp</a>
            <a class="btn line" target="_blank" rel="noopener" href="${waLink(`Halo ${DATA.site.brand}! Saya ingin bertanya dulu tentang *${p.name}*.`)}">Tanya dulu</a>
          </div>
          <p class="d-inc">${I('card',15)} ${esc(DATA.site.note)}</p>
        </div>
        <div class="d-trust">
          <div>${I('shield',16)} Garansi 30 hari</div>
          <div>${I('zap',16)} Kirim instan</div>
          <div>${I('chat',16)} Support WhatsApp</div>
        </div>
      </div>
      <div class="d-preview">
        <div class="dev-head">
          <div class="dev-switch" id="devSwitch">
            ${devs.map((dv,i) => `<button data-dev="${dv}" class="${i===0?'on':''}">${I(DEV_ICON[dv],15)} ${DEV_LABEL[dv]}</button>`).join('')}
          </div>
          <p class="dev-note">${p.mockup==='pos' ? I('hand',15)+' Preview interaktif — coba klik item menu' : I('laptop',15)+' Pratinjau tampilan aplikasi'}</p>
        </div>
        <div class="device-stage" id="deviceStage">${deviceHTML(p,firstDev)}</div>
      </div>
    </div>`;
  d.classList.add('open');
  document.documentElement.classList.add('lock');
  $('#dBack').onclick = closeDetail;
  $('#devSwitch').addEventListener('click', e => {
    const b = e.target.closest('button[data-dev]'); if(!b) return;
    setDevice(b.dataset.dev);
  });
  requestAnimationFrame(fitDevice);
}
function setDevice(m){
  const dev = $('#deviceStage .device'); if(!dev) return;
  dev.dataset.device = m;
  document.querySelectorAll('#devSwitch button').forEach(b => b.classList.toggle('on', b.dataset.dev===m));
  fitDevice();
}
function closeDetail(){
  $('#detail').classList.remove('open');
  document.documentElement.classList.remove('lock');
  currentP = null;
}

/* ═══════════════════════════════════════════════════════════
   INTERAKSI MOCKUP
   ═══════════════════════════════════════════════════════════ */
function posUpdate(pos){
  let sub = 0;
  pos.querySelectorAll('.mkcl').forEach(l => {
    const q = +l.dataset.q, pr = +l.dataset.p;
    sub += q*pr;
    l.querySelector('span').textContent = q+'×';
    l.querySelector('b').textContent = fk(q*pr);
  });
  const tax = Math.round(sub*0.11), tot = sub+tax;
  const set = (c,v) => { const e = pos.querySelector(c); if(e) e.textContent = fk(v); };
  set('.mksub',sub); set('.mktax',tax); set('.mktot',tot); set('.mktot2',tot);
}
document.addEventListener('click', e => {
  const pi = e.target.closest('.mkpi');
  if(pi){
    const pos = pi.closest('.mk-pos');
    let line = pos.querySelector(`.mkcl[data-n="${CSS.escape(pi.dataset.n)}"]`);
    if(line) line.dataset.q = +line.dataset.q + 1;
    else pos.querySelector('.mkcl-wrap').insertAdjacentHTML('beforeend',
      `<div class="mkcl" data-n="${esc(pi.dataset.n)}" data-q="1" data-p="${pi.dataset.p}"><span>1×</span><span class="n">${esc(pi.dataset.n)}</span><b>${fk(+pi.dataset.p)}</b></div>`);
    posUpdate(pos);
    return;
  }
  if(e.target.closest('.mkpay')){
    const pos = e.target.closest('.mk-pos');
    pos.insertAdjacentHTML('beforeend', `<div class="mkpaid"><span class="ok">${I('check',22)}</span>Pembayaran diterima</div>`);
    setTimeout(() => { const ov = pos.querySelector('.mkpaid'); if(ov) ov.remove();
      pos.querySelector('.mkcl-wrap').innerHTML = ''; posUpdate(pos); }, 1600);
    return;
  }
  const btm = e.target.closest('.mkpos-btm');
  if(btm){ btm.closest('.mk-pos').classList.toggle('sheet'); return; }
  const pc = e.target.closest('.mkpc');
  if(pc){ const box = pc.parentElement; box.querySelectorAll('.mkpc').forEach(x=>x.classList.remove('on')); pc.classList.add('on'); return; }
  const fh = e.target.closest('.mkfh');
  if(fh){ fh.classList.toggle('done'); return; }
});

/* ═══════════════════════════════════════════════════════════
   HOVER CARD KATALOG
   ═══════════════════════════════════════════════════════════ */
const hc = $('#hoverCard'), hcIn = $('#hcIn');
let hx=0, hy=0, tx=0, ty=0, hcActive=false;
function hcLoop(){
  hx += (tx-hx)*0.13; hy += (ty-hy)*0.13;
  hc.style.transform = `translate3d(${hx}px,${hy}px,0)`;
  requestAnimationFrame(hcLoop);
}
if(finePointer){
  hcLoop();
  $('#rows').addEventListener('pointermove', e => {
    tx = Math.min(e.clientX + 28, innerWidth - 240);
    ty = Math.min(e.clientY - 210, innerHeight - 460);
    if(ty < 8) ty = 8;
  });
  $('#rows').addEventListener('pointerover', e => {
    const row = e.target.closest('.prow'); if(!row) return;
    const p = DATA.products.find(x=>x.id===row.dataset.id); if(!p) return;
    const compat = (p.compatibility && p.compatibility.length) ? p.compatibility : ['laptop','tablet','phone'];
    const hcDev = compat.includes('phone') ? 'phone' : compat[0] || 'laptop';
    hcIn.innerHTML = deviceHTML(p,hcDev);
    hcIn.classList.add('on'); hcActive = true;
  });
  $('#rows').addEventListener('pointerleave', () => { hcIn.classList.remove('on'); hcActive = false; });
}

/* ═══════════════════════════════════════════════════════════
   TOAST & MODAL
   ═══════════════════════════════════════════════════════════ */
let toastT;
function toast(msg, ic='check'){
  const t = $('#toast');
  t.innerHTML = I(ic,17) + ' ' + esc(msg);
  t.classList.add('on');
  clearTimeout(toastT);
  toastT = setTimeout(()=>t.classList.remove('on'), 2800);
}
let modalYes = null;
function openModal(html){ $('#modal').innerHTML = `<div class="modal-card">${html}</div>`; $('#modal').classList.add('on'); }
function closeModal(){ $('#modal').classList.remove('on'); modalYes = null; }
$('#modal').addEventListener('click', e => {
  if(e.target.id === 'modal') return closeModal();
  const a = e.target.closest('[data-act]'); if(!a) return;
  if(a.dataset.act === 'close') closeModal();
  if(a.dataset.act === 'yes' && modalYes){ const f = modalYes; closeModal(); f(); }
});

/* ═══════════════════════════════════════════════════════════
   EVENT GLOBAL
   ═══════════════════════════════════════════════════════════ */
$('#rows').addEventListener('click', e => {
  const row = e.target.closest('.prow'); if(row) openDetail(row.dataset.id);
});
$('#filters').addEventListener('click', e => {
  const b = e.target.closest('.fbtn'); if(!b) return;
  state.cat = b.dataset.cat; renderFilters(); renderRows();
});
let qT; $('#q').addEventListener('input', e => {
  clearTimeout(qT); qT = setTimeout(()=>{ state.q = e.target.value; renderRows(); }, 140);
});
$('#viewToggle').addEventListener('click', e => {
  const b = e.target.closest('button[data-view]'); if(!b) return;
  setView(b.dataset.view);
});

document.addEventListener('keydown', e => {
  if(e.key === 'Escape'){
    if($('#modal').classList.contains('on')) return closeModal();
    if($('#detail').classList.contains('open')) return closeDetail();
  }
});

/* Header & reveal */
window.addEventListener('scroll', () => $('#hdr').classList.toggle('sc', scrollY > 30), {passive:true});
const ro = new IntersectionObserver(es => es.forEach(en => {
  if(en.isIntersecting){ en.target.classList.add('in'); ro.unobserve(en.target); }
}), {threshold:.12});
const observeRv = () => document.querySelectorAll('.rv:not(.in)').forEach(el => ro.observe(el));

/* Tombol magnetik kecil pada hero */
if(finePointer){
  const m = $('#ctaMagnet');
  m.addEventListener('mousemove', e => {
    const r = m.getBoundingClientRect();
    m.style.transform = `translate(${(e.clientX-r.left-r.width/2)*.12}px,${(e.clientY-r.top-r.height/2)*.22}px)`;
  });
  m.addEventListener('mouseleave', () => m.style.transform = '');
}

/* ═══════════════════════════════════════════════════════════
   MULAI
   ═══════════════════════════════════════════════════════════ */
loadData().then(() => observeRv());
