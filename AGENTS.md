# AGENTS.md

## Project

**Tata Umkm** — Portfolio web app untuk produk aplikasi UMKM. Terdiri dari 3 web app:
- `index.html` — viewer/Beranda (publik). Menampilkan produk unggulan (`featured`) saja.
- `products.html` — Katalog lengkap model marketplace (grid, filter kategori, sort, search).
- `editor.html` — editor (admin, password-protected, CRUD produk, testimoni, pengaturan).

Backend: Google Apps Script + Google Sheets.
Hosting: GitHub Pages.

## Tech Stack

- HTML5, CSS3 (vanilla), JavaScript (vanilla, ES modules tidak dipakai)
- Google Apps Script (backend API)
- Google Sheets (database)
- GitHub Pages (hosting)

## Code Conventions

- **Tidak pakai framework** — vanilla JS, CSS, HTML
- **Tidak pakai bundler** — file langsung di-load di HTML
- **Naming**: camelCase JS, kebab-case CSS classes
- **CSS variables**: gunakan variabel dari `common.css` (--paper, --ink, --green, dll)
- **Icon**: SVG inline via helper function `I(name, size)`
- **ID produk**: kebab-case, unik (pos-kopi, hpp, dll)
- **Format harga**: `Rp X` format Indonesia (titik ribuan, koma desimal)
- **WhatsApp link**: format `https://wa.me/628xxx?text=...`
- **Responsive breakpoints**: 560px, 720px, 900px

## File Responsibilities

### `css/common.css`
Variabel CSS, reset, typography, tombol (.btn), icon button (.icobtn), selection, focus-visible. Wajib di-load di semua halaman.

### `css/viewer.css`
Semua style khusus viewer: header (.hdr), hero, marquee (.mq), katalog (.prow, .filters), detail produk (.detail), device preview (.device), mockup apps (.mk*), cara beli (.step), benefit (.incl-*), CTA band (.band), footer, hover card, toast, modal, reveal animation.

### `css/editor.css`
Style khusus editor: login screen, drawer/form layout, form fields (.fld), list items (.dw-list-item), tab navigation, responsive editor layout.

### `css/products.css`
Style tambahan katalog marketplace (products.html): layout sidebar kategori + grid produk (.pcard, .pthumb), toolbar search/sort, responsive grid.

### `js/api.js`
API client. Expose fungsi:
- `fetchData()` — GET `?action=getData`, return `{ site, categories, products, testimonials }`
- `saveProduct(data)` — POST `action=saveProduct`
- `deleteProduct(id)` — POST `action=deleteProduct`
- `saveSite(data)` — POST `action=saveSite`
- `saveTestimonial(data)`, `deleteTestimonial(id)` — POST
- `verifyApiKey(key)` — GET validasi key untuk login editor
- `API_URL` — konstanta URL Apps Script deployment (user ganti sendiri)

### `js/viewer.js`
Logic viewer (index.html, halaman utama). Handle:
- Render meta site (brand, title, whatsapp links)
- Render katalog rekomendasi — HANYA produk `featured` (list teks-only, tanpa thumbnail)
- Detail produk (open/close, device preview, mockup)
- Mockup interaktif (POS click, habit toggle)
- Hover card, Testimoni grid, reveal animation, header scroll

### `js/products.js`
Logic katalog marketplace (products.html). Mandiri (duplikasi mockup/device helper dari viewer.js). Handle:
- Grid kartu produk (thumbnail URL / fallback mockup)
- Filter kategori (sidebar desktop + chips mobile), sort, search
- Detail produk overlay (reuse device preview)

### `js/editor.js`
Logic editor. Handle:
- Login flow (password → API key → cache di localStorage)
- Form produk modal (termasuk field image, compatibility, featured/unggulan)
- Kelola testimoni (tab, modal CRUD)
- Pengaturan situs (list baris → modal)
- Save/delete dengan toast feedback, guard double-submit
- Responsive behavior

### `gas/Code.gs`
Google Apps Script backend. Handle:
- `doGet(e)` — public data endpoint (getData, verifyKey)
- `doPost(e)` — admin CRUD endpoints
- Sheet operations (read, write, delete rows)
- API key verification
- Data model kolom products: `id,name,category,price,compareAt,badge,tagline,desc,features,mockup,accent,demoUrl,compatibility,image,featured`

## Development Rules

1. Jangan hapus mockup functions (mkPos, mkCalc, dst) — mereka adalah bagian dari viewer
2. CSS variables di `common.css` adalah source of truth — jangan hardcode warna
3. Semua teks user-facing dalam Bahasa Indonesia
4. Format harga selalu `Rp X` dengan pemisah ribuan titik
5. WhatsApp number format: `628xxx` tanpa `+` tanpa spasi
6. Produk features disimpan sebagai JSON array string di Sheets
7. Editor harus responsive — bisa dipakai dari HP
8. API key tidak pernah di-expose ke viewer

## Known Gotchas

- Google Apps Script deployment URL berubah setiap update deployment (kalau bukan "new" deployment)
- Apps Script `doGet`/`doPost` memiliki timeout 6 detik (free tier)
- Google Sheets API rate limit: 300 requests per menit per project
- CORS pada Apps Script: `doGet` otomatis CORS-friendly, `doPost` perlu `doOptions` handler
- localStorage cleanup: viewer dan editor share origin, gunakan key berbeda (`tataumkm_viewer_data` vs `tataumkm_editor_key`)
