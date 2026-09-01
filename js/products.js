/**
 * Tata Umkm — Katalog Marketplace (products.html)
 *
 * Grid produk lengkap + filter kategori + sort + search.
 * Detail produk reuse overlay (device preview + mockup).
 *
 * ponytail: mockup/device helper disalin dari viewer.js agar
 * halaman ini mandiri & terisolasi. Opsi upgrade: extract ke
 * js/app-common.js jika duplikasi mulai banyak diubah bersamaan.
 */

/* ═══════════ UTIL & ICON ═══════════ */
const $ = s => document.querySelector(s);
const ICONS = {
  up:'<path d="M7 17 17 7M8 7h9v9"/>', check:'<path d="m5 13 4 4L19 7"/>',
  laptop:'<rect x="4" y="4.5" width="16" height="11" rx="1.4"/><path d="M2.5 19.5h19"/>',
  tablet:'<rect x="5" y="3" width="14" height="18" rx="2.2"/><path d="M11 17.8h2"/>',
  phone:'<rect x="8" y="2.5" width="8" height="19" rx="2.2"/><path d="M11.2 18.6h1.6"/>',
  chat:'<path d="M21 11.5a8.5 8.5 0 0 1-12.3 7.6L3.5 20.5l1.4-5.2A8.5 8.5 0 1 1 21 11.5Z"/>',
  ext:'<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5"/>',
  left:'<path d="m14.5 6-6 6 6 6"/>',
  shield:'<path d="M12 3.5 18.5 6v5c0 4.8-3.2 7.8-6.5 9.5C8.7 18.8 5.5 15.8 5.5 11V6Z"/>',
  zap:'<path d="M13 2.5 4.5 13.5H11l-1 8L18.5 10.5H13Z"/>',
  ast:'<path d="M12 3v18M4.2 7.5l15.6 9M19.8 7.5l-15.6 9"/>',
  card:'<rect x="3" y="5.5" width="18" height="13" rx="2"/><path d="M3 10h18M7 14.5h4"/>'
};
const I = (n, s=18) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="flex:none">${ICONS[n]}</svg>`;
function rp(n){ return 'Rp ' + (n||0).toLocaleString('id-ID'); }
function fk(n){ return (n||0).toLocaleString('id-ID'); }
function esc(s){ return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]); }

let DATA;
const state = { cat: 'all', q: '', sort: 'populer' };

/* ═══════════ LOAD ═══════════ */
async function loadData(){
  const apiData = await fetchData();
  if (apiData && apiData.products) { DATA = apiData; renderAll(); return; }
  try {
    const cached = JSON.parse(localStorage.getItem('tataumkm_viewer_data'));
    if (cached && cached.products) { DATA = cached; renderAll(); return; }
  } catch(e){}
  DATA = { site:{}, categories: [], products: [] };
  renderAll();
}

const catLabel = id => (DATA.categories.find(c=>c.id===id)||{}).label||id;
const waLink = msg => `https://wa.me/${String(DATA.site.whatsapp||'').replace(/\D/g,'')}?text=${encodeURIComponent(msg)}`;

/* ═══════════ RENDER ═══════════ */
function renderMeta(){
  const s = DATA.site;
  $('#brandName').textContent = s.brand || 'Tata Umkm';
  document.title = `${s.brand||'Tata Umkm'} — Katalog Produk`;
}

function renderCats(){
  // Sidebar desktop
  $('#sideCats').innerHTML =
    `<button class="mk-side-cat ${state.cat==='all'?'on':''}" data-cat="all">Semua<em>${countFor('all')}</em></button>` +
    DATA.categories.map(c => `<button class="mk-side-cat ${state.cat===c.id?'on':''}" data-cat="${c.id}">${esc(c.label)}<em>${countFor(c.id)}</em></button>`).join('');
  $('#sideCats').querySelectorAll('.mk-side-cat').forEach(b => b.onclick = () => setCat(b.dataset.cat));

  // Chips mobile
  const count = id => id==='all' ? DATA.products.length : DATA.products.filter(p=>p.category===id).length;
  $('#filters').innerHTML =
    `<button class="fbtn ${state.cat==='all'?'on':''}" data-cat="all">Semua<small>${count('all')}</small></button>` +
    DATA.categories.map(c => `<button class="fbtn ${state.cat===c.id?'on':''}" data-cat="${c.id}">${esc(c.label)}<small>${count(c.id)}</small></button>`).join('');
  $('#filters').querySelectorAll('.fbtn').forEach(b => b.onclick = () => setCat(b.dataset.cat));
}

function countFor(id){ return id==='all' ? DATA.products.length : DATA.products.filter(p=>p.category===id).length; }

function setCat(id){ state.cat = id; renderCats(); renderRows(); }

function filteredList(){
  const q = state.q.trim().toLowerCase();
  let list = DATA.products.filter(p =>
    (state.cat==='all' || p.category===state.cat) &&
    (!q || (p.name+' '+p.tagline+' '+catLabel(p.category)).toLowerCase().includes(q)));
  switch(state.sort){
    case 'termurah': list.sort((a,b)=>a.price-b.price); break;
    case 'termahal': list.sort((a,b)=>b.price-a.price); break;
    case 'az': list.sort((a,b)=>a.name.localeCompare(b.name)); break;
    default: break; // populer = urutan data (featured dulu)
  }
  return list;
}

/* Thumbnail — URL gambar, fallback mockup DOM */
function productThumb(p){
  if (p.image) return `<img src="${esc(p.image)}" alt="${esc(p.name)}" loading="lazy" class="pthumb-img" onerror="this.closest('.pthumb').classList.add('mock');this.remove()">`;
  return `<span class="thumb-mock">${mockupHTML(p)}</span>`;
}

function renderRows(){
  const list = filteredList();
  const rows = $('#rows');
  $('#countNote').textContent = list.length + ' produk';
  if(!list.length){
    rows.innerHTML = `<div class="empty"><p class="serif">Tidak ada produk yang cocok.</p><p>Coba kata kunci atau kategori lain.</p></div>`;
    return;
  }
  rows.innerHTML = list.map((p,i) => `
    <article class="prow pcard" data-id="${esc(p.id)}" style="animation-delay:${Math.min(i*45,300)}ms">
      <div class="pthumb ${p.image?'':'mock'}">${productThumb(p)}</div>
      <div class="pcard-body">
        <div class="pcard-top">
          <span class="chip">${esc(catLabel(p.category))}</span>
          ${p.badge?`<span class="badge">${esc(p.badge)}</span>`:''}
        </div>
        <h3 class="pcard-name">${esc(p.name)}</h3>
        <p class="pcard-tag">${esc(p.tagline)}</p>
        <span class="pcard-price">${rp(p.price)}${p.compareAt?`<span class="price-old">${rp(p.compareAt)}</span>`:''}</span>
      </div>
    </article>`).join('');
}

function renderAll(){ renderMeta(); renderCats(); renderRows(); }

/* ═══════════ MOCKUP APP (untuk thumbnail & detail) ═══════════ */
const POS_MENU = [['Kopi Susu',18000],['Americano',16000],['Matcha Latte',24000],['Es Teh Manis',10000],['Croissant',25000],['Roti Bakar',20000],['Air Mineral',6000],['Susu Pisang',14000],['Kopi Tubruk',12000],['Es Jeruk',13000],['Banana Bread',22000],['Cimory',12000]];

function mkPos(p){
  const items = POS_MENU.map(m => `<button class="mkpi"><span class="dot"></span><span>${m[0]}</span><b>${fk(m[1])}</b></button>`).join('');
  const cats = ['Semua','Kopi','Non-Kopi','Makanan'].map((c,i)=>`<button class="mkpc ${i==0?'on':''}">${c}</button>`).join('');
  return `<div class="mk mk-pos" style="--a:${p.accent}">
    <div class="mktop"><span class="mktop-brand">◉ ${esc(p.name)}</span><span class="mktop-clock" data-mk-clock></span><span class="mktop-cas">Kasir 01</span></div>
    <div class="mkpos-body">
      <div><div class="mkpos-cats">${cats}</div><div class="mkpos-items">${items}</div></div>
      <div class="mkpos-cart"><p class="mkpos-ct">Pesanan #1042 <span>Meja 04</span></p>
        <div class="mkcl-wrap"><div class="mkcl"><span>1×</span><span class="n">Kopi Susu</span><b>18.000</b></div></div>
        <div class="mksum"><span>Subtotal</span><b>18.000</b></div><div class="mksum"><span>Pajak (11%)</span><b>1.980</b></div>
        <div class="mksum tot"><span>Total</span><b>19.980</b></div><button class="mkpay">Bayar Sekarang</button>
      </div>
    </div>
    <div class="mkpos-btm"><span>Total 19.980</span><span class="b">Lihat Pesanan</span></div>
  </div>`;
}
function mkCalc(p){
  return `<div class="mk mkform" style="--a:${p.accent}">
    <div class="mkpanel"><h5>Harga Pokok Produksi</h5>
      <div class="mkfield"><span>Produk</span><b>Kopi Susu 250ml</b></div>
      <div class="mkfield"><span>Target margin</span><b>55%</b></div>
      <div class="mkrow hd"><span>Bahan</span><span>Takaran</span><span>Biaya</span></div>
      <div class="mkrow"><span class="n">Kopi Arabika</span><span>18 g</span><b>2.700</b></div>
      <div class="mkrow"><span class="n">Susu UHT</span><span>180 ml</span><b>3.240</b></div>
      <div class="mkrow"><span class="n">Gula cair</span><span>15 ml</span><b>450</b></div>
      <div class="mkrow"><span class="n">Kemasan</span><span>1 pcs</span><b>1.200</b></div>
      <div class="mkrow"><span class="n">Overhead</span><span>1 unit</span><b>2.100</b></div>
    </div>
    <div class="mkpanel mkres"><span class="lbl">HPP per unit</span><span class="big">Rp 9.690</span>
      <div class="mkbar"><span style="width:64px">Bahan</span><span class="tr"><i style="width:66%"></i></span><span>66%</span></div>
      <div class="mkbar"><span style="width:64px">Kemasan</span><span class="tr"><i style="width:12%"></i></span><span>12%</span></div>
      <div class="mkbar"><span style="width:64px">Overhead</span><span class="tr"><i style="width:22%"></i></span><span>22%</span></div>
      <div class="row2"><span>Harga jual</span><b>Rp 21.500</b></div>
      <div class="row2"><span>Untung</span><b>Rp 11.810</b></div>
    </div>
  </div>`;
}
function mkInvoice(p){
  return `<div class="mk mkinv" style="--a:${p.accent}">
    <div class="mkinv-list"><span class="lbl">Invoice</span>
      <div class="mkiv on"><span>#1042 · Kedai Senja</span><span class="st ok">Terbayar</span></div>
      <div class="mkiv"><span>#1041 · Warung Bu Rat</span><span class="st no">Menunggu</span></div>
      <div class="mkiv"><span>#1040 · PT Sinar Abadi</span><span class="st ok">Terbayar</span></div>
    </div>
    <div class="mkdoc"><div class="mkdoc-h"><div><b>INVOICE #1042</b><small>12 Mei 2025 · jatuh 19 Mei</small></div>
      <div style="text-align:right;font-size:.62rem;color:#6A6152"><b style="font-size:.78rem">${esc(DATA.site.brand)}</b><br>Jl. Kenanga No. 8</div></div>
      <div class="to"><span>Kepada:<br><b style="color:#282319">Kedai Senja</b></span><span style="text-align:right">Pembayaran:<br><b style="color:#282319">Transfer BCA</b></span></div>
      <table><tr><th>Deskripsi</th><th>Qty</th><th>Nilai</th></tr>
      <tr><td>Paket Kopi Arabika</td><td>12</td><td>2.400.000</td></tr>
      <tr><td>Biaya kirim</td><td>1</td><td>75.000</td></tr>
      <tr><td>Diskon setia</td><td>—</td><td>−120.000</td></tr></table>
      <div class="tot"><span>Total <small>(termasuk PPN)</small></span><span>Rp 2.619.275</span></div>
    </div>
  </div>`;
}
function mkStock(p){
  const rows=[['Kopi Arabika','SKU-011','Aman',78,'2.850.000',0],['Susu UHT','SKU-034','Menipis',22,'18.900',1],['Cup 12oz','SKU-051','Menipis',15,'950',1],['Gula Pasir','SKU-020','Aman',64,'312.000',0]];
  return `<div class="mk mktab" style="--a:${p.accent}">
    <div class="mktab-bar"><div class="srch">Cari barang…</div><div class="ad">+ Barang Masuk</div></div>
    <div class="mkrow-t hd"><span>Produk</span><span>SKU</span><span>Level</span><span>Nilai</span></div>
    ${rows.map(r=>`<div class="mkrow-t"><div><div class="n">${r[0]}</div><span class="sku">Min. 30 pcs</span></div><span class="sku c2">${r[1]}</span><div><div class="lvl"><i style="width:${r[3]}%"></i></div><span class="st2" style="margin-top:4px;font-size:.6rem">${r[2]}</span></div><b style="color:var(--a)">${r[4]}</b></div>`).join('')}
  </div>`;
}
function mkFinance(p){
  return `<div class="mk mkfin" style="--a:${p.accent}">
    <div class="mkcard2 hl"><span class="lbl" style="color:rgba(255,249,236,.72)">Saldo saat ini</span><span class="big">Rp 24.780.000</span></div>
    <div class="mkcard2"><span class="lbl">Transaksi terbaru</span><div class="mkfin-list">
      <div class="mktr"><span class="d" style="background:var(--a)"></span><span>Penjualan toko<small>Hari ini</small></span><span class="in">+1.850.000</span></div>
      <div class="mktr"><span class="d" style="background:#C0652F"></span><span>Belanja bahan<small>Hari ini</small></span><span class="out">−640.000</span></div>
      <div class="mktr"><span class="d" style="background:var(--a)"></span><span>Transfer<small>Kemarin</small></span><span class="in">+350.000</span></div>
    </div></div>
  </div>`;
}
function mkFocus(p){
  return `<div class="mk mkfo" style="--a:${p.accent}">
    <div class="mkfo-top"><svg viewBox="0 0 120 120" class="mkring"><circle cx="60" cy="60" r="50" stroke="#EAE1CB" stroke-width="10" fill="none"/><circle cx="60" cy="60" r="50" stroke="${p.accent}" stroke-width="10" fill="none" stroke-linecap="round" stroke-dasharray="226 314" transform="rotate(-90 60 60)"/><text x="60" y="58" text-anchor="middle" class="mkring-t">72%</text></svg>
      <div><span class="lbl">Rabu, 14 Mei</span><div style="font-family:'Fraunces',serif;font-size:1.15rem;font-weight:560;margin:3px 0">Rentetan 18 hari</div></div>
    </div>
    <div class="mkfh done"><span class="cb">${I('check',12)}</span><span>Cek kas &amp; stok</span><small>07.00</small></div>
    <div class="mkfh done"><span class="cb">${I('check',12)}</span><span>Balas pesanan</span><small>09.00</small></div>
    <div class="mkfh"><span class="cb"></span><span>Catat penjualan</span><small>20.00</small></div>
  </div>`;
}
function mkTools(p){
  return `<div class="mk mkwt" style="--a:${p.accent}">
    <div class="mkw big"><span class="lbl" style="color:rgba(255,249,236,.72)">Kas hari ini</span><span class="v">Rp 4.215.000</span></div>
    <div class="mkw"><span class="lbl">Piutang</span><span class="v" style="color:#A04A20">Rp 1.7jt</span></div>
    <div class="mkw"><span class="lbl">Stok menipis</span><span class="v">5</span></div>
    <div class="mkw"><span class="lbl">Invoice</span><span class="v">12</span></div>
  </div>`;
}
function mkLedger(p){
  return `<div class="mk mkld" style="--a:${p.accent}">
    <div class="mkld-bar"><span class="lbl">Buku Piutang — Mei</span><span class="tb">+ Catat</span></div>
    ${[['Warung Bu Ratna','Rp 1.250.000','jt. 18 Mei',72],['Toko Melati','Rp 840.000','jt. 21 Mei',40],['Kedai Senja','Rp 1.700.000','jt. 25 Mei',55]].map(r=>`
    <div class="mkld-row"><div><div class="n">${r[0]}</div><span class="dt">${r[2]}</span></div><span class="amt">${r[1]}</span><div class="tr"><i style="width:${r[3]}%"></i></div><span class="st2" style="font-size:.6rem;background:color-mix(in srgb,var(--a) 14%,#fff);color:var(--a)">${r[3]}%</span></div>`).join('')}
  </div>`;
}
const mkPlain = p => `<div class="mk mk-plain" style="--a:${p.accent}"><span class="ast">${I('ast',40)}</span><h4>${esc(p.name)}</h4><p>Preview interaktif tampil di sini.</p></div>`;
const MOCKS = { pos:mkPos, calc:mkCalc, invoice:mkInvoice, stock:mkStock, finance:mkFinance, focus:mkFocus, tools:mkTools, ledger:mkLedger };
const mockupHTML = p => (MOCKS[p.mockup] || mkPlain)(p);

/* ═══════════ DETAIL (overlay + device preview) ═══════════ */
const DDIM = { laptop:[920,584], tablet:[560,700], phone:[360,720] };
function deviceHTML(p, device='laptop'){
  const inner = p.demoUrl
    ? `<iframe class="mk-iframe" src="${esc(p.demoUrl)}" title="Demo ${esc(p.name)}"></iframe><a class="iframe-open" href="${esc(p.demoUrl)}" target="_blank" rel="noopener">${I('ext',13)} Buka tab</a>`
    : mockupHTML(p);
  return `<div class="device" data-device="${device}"><div class="d-shell"><span class="d-cam"></span><div class="d-screen">${inner}</div></div><div class="d-base"><span></span></div></div>`;
}
function fitDevice(){
  const stage = $('#deviceStage'); if(!stage) return;
  const dev = stage.querySelector('.device'); if(!dev) return;
  const [w,h] = DDIM[dev.dataset.device] || DDIM.laptop;
  dev.style.transform = `scale(${Math.min(1,(stage.clientWidth-16)/w,(stage.clientHeight-16)/h)})`;
}
window.addEventListener('resize', fitDevice);

function openDetail(id){
  const p = DATA.products.find(x=>x.id===id); if(!p) return;
  const compat = (p.compatibility&&p.compatibility.length)?p.compatibility:['laptop','tablet','phone'];
  const devs = ['laptop','tablet','phone'].filter(x=>compat.includes(x));
  const firstDev = devs[0]||'laptop';
  const LABEL={laptop:'Laptop',tablet:'Tablet',phone:'HP'},IC={laptop:'laptop',tablet:'tablet',phone:'phone'};
  const d = $('#detail');
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
          <span style="font-size:.85rem;color:var(--ink-soft)">Tanpa langganan · akses dikirim seketika</span>
          <div class="row">
            <a class="btn wa" target="_blank" rel="noopener" href="${waLink(`Halo ${DATA.site.brand}! Saya ingin memesan produk *${p.name}* (${rp(p.price)}).`)}">${I('chat',16)} Pesan lewat WhatsApp</a>
            <a class="btn line" target="_blank" rel="noopener" href="${waLink(`Halo ${DATA.site.brand}! Saya ingin bertanya dulu tentang *${p.name}*.`)}">Tanya dulu</a>
          </div>
          <p class="d-inc">${I('card',15)} ${esc(DATA.site.note)}</p>
        </div>
      </div>
      <div class="d-preview">
        <div class="dev-head">
          <div class="dev-switch" id="devSwitch">
            ${devs.map((dv,i)=>`<button data-dev="${dv}" class="${i===0?'on':''}">${I(IC[dv],15)} ${LABEL[dv]}</button>`).join('')}
          </div>
          <p class="dev-note">${p.mockup==='pos'?I('hand',15)+' Preview interaktif — coba klik item menu':I('laptop',15)+' Pratinjau tampilan'}</p>
        </div>
        <div class="device-stage" id="deviceStage">${deviceHTML(p,firstDev)}</div>
      </div>
    </div>`;
  d.classList.add('open');
  document.documentElement.classList.add('lock');
  $('#dBack').onclick = closeDetail;
  $('#devSwitch').addEventListener('click', e=>{
    const b=e.target.closest('button[data-dev]'); if(!b) return;
    const dev=$('#deviceStage .device'); if(!dev) return;
    dev.dataset.device=b.dataset.dev;
    document.querySelectorAll('#devSwitch button').forEach(x=>x.classList.toggle('on',x.dataset.dev===b.dataset.dev));
    fitDevice();
  });
  requestAnimationFrame(fitDevice);
}
function closeDetail(){
  $('#detail').classList.remove('open');
  document.documentElement.classList.remove('lock');
}

/* Interaksi mockup POS (add item) */
function posUpdate(pos){
  let sub=0;
  pos.querySelectorAll('.mkcl').forEach(l=>{const q=+l.dataset.q,pr=+l.dataset.p;sub+=q*pr;l.querySelector('span').textContent=q+'x';l.querySelector('b').textContent=fk(q*pr);});
  const tax=Math.round(sub*0.11),tot=sub+tax;
  pos.querySelectorAll('.mksub').forEach(e=>e.textContent=fk(sub));
  pos.querySelectorAll('.mktax').forEach(e=>e.textContent=fk(tax));
  pos.querySelectorAll('.mktot,.mktot2').forEach(e=>e.textContent=fk(tot));
}
document.addEventListener('click', e=>{
  const pi=e.target.closest('.mkpi');
  if(pi){ const pos=pi.closest('.mk-pos'); let line=pos.querySelector(`.mkcl[data-n="${CSS.escape(pi.dataset.n)}"]`);
    if(line)line.dataset.q=+line.dataset.q+1; else pos.querySelector('.mkcl-wrap').insertAdjacentHTML('beforeend',`<div class="mkcl" data-n="${esc(pi.dataset.n)}" data-q="1" data-p="${pi.dataset.p}"><span>1x</span><span class="n">${esc(pi.dataset.n)}</span><b>${fk(+pi.dataset.p)}</b></div>`);
    posUpdate(pos); return; }
  if(e.target.closest('.mkpay')){ const pos=e.target.closest('.mk-pos');
    pos.insertAdjacentHTML('beforeend',`<div class="mkpaid"><span class="ok">${I('check',22)}</span>Pembayaran diterima</div>`);
    setTimeout(()=>{const ov=pos.querySelector('.mkpaid');if(ov)ov.remove();},1600); return; }
});

/* Jam mockup */
setInterval(()=>{
  const t=new Date().toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit',second:'2-digit'});
  document.querySelectorAll('[data-mk-clock]').forEach(el=>el.textContent=t);
},1000);

/* ═══════════ EVENT ═══════════ */
$('#rows').addEventListener('click', e=>{
  const row=e.target.closest('.pcard'); if(row) openDetail(row.dataset.id);
});
$('#filters').addEventListener('click', e=>{ /* handled via onclicks */ });
let qT; $('#q').addEventListener('input', e=>{ clearTimeout(qT); qT=setTimeout(()=>{ state.q=e.target.value; renderRows(); },140); });
$('#sort').addEventListener('change', e=>{ state.sort=e.target.value; renderRows(); });

document.addEventListener('keydown', e=>{
  if(e.key==='Escape' && $('#detail').classList.contains('open')) closeDetail();
});
window.addEventListener('scroll', ()=>$('#hdr').classList.toggle('sc',scrollY>30), {passive:true});

loadData();
