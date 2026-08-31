# PRD — Tata Umkm Portfolio (Re-Architecture)

## Overview

Memecah web portfolio "Tata Umkm" dari single-file monolith menjadi 2 web app terpisah dengan backend Google Apps Script + Google Sheets sebagai database.

## Problem

- Single file `index.html` (~1358 baris) berisi CSS, HTML, JS, data, editor, mockup
- Edit data harus edit kode langsung atau export-import manual
- Tidak ada database — data hardcoded di `SITE_DATA` + localStorage
- Editor bawaan hanya bisa dari browser yang sama (localStorage)

## Goals

1. **Viewer** — situs publik yang fetch data dari API, read-only
2. **Editor** — admin panel untuk CRUD produk + pengaturan situs, password-protected
3. **Database** — Google Sheets sebagai "database" visual yang bisa diakses langsung juga
4. **Backend** — Google Apps Script sebagai REST API layer

## Non-Goals

- Multi-user admin (cukup single admin)
- Payment integration (tetap WhatsApp-based)
- Analytics / tracking
- SSR / SSG — tetap static site + client-side fetch

## Architecture

```
Google Sheet (database)
├── Sheet "site"        → key-value: brand, tagline, whatsapp, dll
├── Sheet "categories"  → id, label
├── Sheet "products"    → id, name, category, price, ...
└── Sheet "settings"    → key-value: admin API key hash

Google Apps Script (API)
├── GET  ?action=getData        → public, return semua data
├── POST action=saveProduct     → admin (perlu API key)
├── POST action=deleteProduct   → admin (perlu API key)
└── POST action=saveSite        → admin (perlu API key)

GitHub Pages (hosting)
├── /index.html     → viewer (publik, read-only)
└── /editor.html    → editor (admin, password-protected)
```

## Data Model

### Sheet: `site`

| Column | Type | Description |
|--------|------|-------------|
| key | string | Nama field (brand, tagline, sub, whatsapp, location, hours, note) |
| value | string | Nilai field |

### Sheet: `categories`

| Column | Type | Description |
|--------|------|-------------|
| id | string | Identifier unik (bisnis, produktivitas, personal, keuangan) |
| label | string | Label tampilan |

### Sheet: `products`

| Column | Type | Description |
|--------|------|-------------|
| id | string | Identifier unik (pos-kopi, hpp, dll) |
| name | string | Nama produk |
| category | string | ID kategori |
| price | number | Harga (Rp) |
| compareAt | number | Harga coret (0 = tidak ada) |
| badge | string | Lencana (Terlaris/Baru/Promo/kosong) |
| tagline | string | Tagline singkat |
| desc | string | Deskripsi produk |
| features | string | JSON array: ["fitur 1","fitur 2"] |
| mockup | string | Jenis mockup (pos/calc/invoice/stock/finance/focus/tools/ledger/plain) |
| accent | string | Warna aksen hex (#1D5B43) |
| demoUrl | string | URL demo (kosong = pakai mockup) |

### Sheet: `settings`

| Column | Type | Description |
|--------|------|-------------|
| key | string | admin_api_key |
| value | string | API key plaintext (hanya dibaca admin) |

## API Specification

### GET `?action=getData`

Response:
```json
{
  "site": { "brand": "...", "tagline": "...", ... },
  "categories": [{ "id": "...", "label": "..." }],
  "products": [{ "id": "...", "name": "...", ... }]
}
```

### POST `action=saveProduct`

Request body:
```json
{
  "key": "api-key-disini",
  "action": "saveProduct",
  "data": {
    "id": "new atau id-existing",
    "name": "POS Kopi",
    "category": "bisnis",
    "price": 499000,
    ...
  }
}
```

Response:
```json
{ "success": true, "product": { ... } }
```

### POST `action=deleteProduct`

Request body:
```json
{
  "key": "api-key-disini",
  "action": "deleteProduct",
  "data": { "id": "pos-kopi" }
}
```

### POST `action=saveSite`

Request body:
```json
{
  "key": "api-key-disini",
  "action": "saveSite",
  "data": { "brand": "Tata Umkm", "tagline": "...", ... }
}
```

## UI Requirements

### Viewer (index.html)

- Header dengan brand + navigasi (sticky, blur on scroll)
- Hero section (tagline + sub + CTA + stats)
- Marquee produk berjalan
- Katalog dengan filter kategori + search
- Hover card preview (desktop)
- Detail produk: full page overlay dengan device preview (laptop/tablet/HP)
- Mockup interaktif (POS bisa klik-klik)
- Cara beli (3 langkah)
- Termasuk (benefit list)
- CTA band (diskusi custom)
- Footer (kontak, navigasi, link editor)

### Editor (editor.html)

- Login screen: input password → POST ke API
- Dashboard: sidebar list produk + main form
- Tab: Produk | Pengaturan Situs
- Form produk: semua field dari data model
- CRUD: tambah, edit, hapus (dengan konfirmasi)
- Responsive: 2 kolom di laptop, 1 kolom di HP
- Tombol "Lihat situs publik"

### Design System

- Font: Fraunces (serif heading) + Instrument Sans (body)
- Color: --paper:#F4EFE4, --ink:#181511, --green:#1D5B43, --clay:#B4562E
- Border radius: 999px (buttons), 13px (cards), 18px (modals)
- Animation: cubic-bezier(.65,.05,.2,1)
- Responsive breakpoints: 560px, 720px, 900px, 1000px

## File Structure

```
Portofolio_z/
├── index.html           ← viewer (publik)
├── editor.html          ← editor (admin)
├── css/
│   ├── common.css       ← shared: variabel, reset, tombol, typography
│   ├── viewer.css       ← katalog, hero, detail, marquee, mockup
│   └── editor.css       ← editor form, login, responsive
├── js/
│   ├── api.js           ← API client (fetch ke Apps Script)
│   ├── viewer.js        ← render katalog + detail + interaksi
│   └── editor.js        ← editor logic + auth + CRUD
└── gas/
    └── Code.gs          ← Google Apps Script backend
```

## Security

- API key disimpan di Apps Script (constant), bukan di Sheet
- API key dikirim di POST body, bukan di URL
- Viewer tidak punya API key — tidak bisa tulis data
- CORS: Apps Script web app mendukung CORS by default
- Rate limit: tidak diimplementasi (cukup untuk single admin)

## Deployment

1. Google Sheet → Apps Script → Deploy as Web App
2. Copy deployment URL → paste di `js/api.js` sebagai `API_URL`
3. Push ke GitHub → GitHub Pages auto deploy

## Migration

- Data awal diambil dari `SITE_DATA` yang ada di `index.html` lama
- Manual input ke Google Sheets (atau script migrasi)
- Setelah verified, `index.html` lama bisa dihapus
