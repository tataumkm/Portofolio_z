# PROGRESS.md

Log perubahan file oleh Agent AI. Format: tanggal, file, deskripsi perubahan.

---

## Log

| # | Tanggal | File | Deskripsi |
|---|---------|------|-----------|
| 1 | 2026-08-31 | PRD.md | Dibuat — Product Requirements Document |
| 2 | 2026-08-31 | AGENTS.md | Dibuat — Agent instructions & conventions |
| 3 | 2026-08-31 | PROGRESS.md | Dibuat — Progress log ini |
| 4 | 2026-08-31 | gas/Code.gs | Dibuat — Google Apps Script backend (GET/POST, CRUD, setupSheets) |
| 5 | 2026-08-31 | css/common.css | Dibuat — Shared styles (variabel, reset, tombol, typography) |
| 6 | 2026-08-31 | css/viewer.css | Dibuat — Viewer styles (hero, katalog, detail, mockup, footer) |
| 7 | 2026-08-31 | css/editor.css | Dibuat — Editor styles (login, layout, form, responsive) |
| 8 | 2026-08-31 | js/api.js | Dibuat — API client (fetchData, saveProduct, deleteProduct, saveSite) |
| 9 | 2026-08-31 | js/viewer.js | Dibuat — Viewer logic (render, mockup, hover card, detail, interaksi) |
| 10 | 2026-08-31 | js/editor.js | Dibuat — Editor logic (login, CRUD, tabs, form, modal, toast) |
| 11 | 2026-08-31 | index.html | Dibuat — Viewer page (publik, read-only, fetch dari API) |
| 12 | 2026-08-31 | editor.html | Dibuat — Editor page (admin, password-protected, CRUD) |
| 13 | 2026-09-01 | gas/Code.gs | Bug fix — Tambah endpoint `verifyKey` via GET untuk login editor |
| 14 | 2026-09-01 | js/api.js | Bug fix — Tambah fungsi `verifyApiKey()` untuk validasi API key saat login |
| 15 | 2026-09-01 | js/editor.js | Bug fix — Login kini validasi API key dulu (verifyKey) sebelum masuk; key salah tidak bisa masuk |
| 16 | 2026-09-01 | js/viewer.js | Bug fix — Render cache instant lebih dulu + loading state + pesan error jelas saat API gagal; produk tak hilang diam-diam |
| 17 | 2026-09-01 | gas/Code.gs | Fitur — Kolom `compatibility` (JSON array) di products; normalisasi default semua perangkat |
| 18 | 2026-09-01 | js/editor.js | Fitur — Checkbox kompatibilitas perangkat (laptop/tablet/HP) pada form produk |
| 19 | 2026-09-01 | js/viewer.js | Fitur — Preview detail & hover card hanya tampilkan perangkat kompatibel; default ke device pertama |
| 20 | 2026-09-01 | editor.html | Redesign — Layout daftar penuh + modal form (#editModal) + confirm modal; hapus sidebar/main split |
| 21 | 2026-09-01 | css/editor.css | Redesign — Minimalis: daftar list, form modal, tab, icon-btn; hilangkan form besar di halaman |
| 22 | 2026-09-01 | js/editor.js | Redesign — Form produk & setting jadi modal; guard busy cegah double-submit; setelah save modal tutup & kosong; tab produk/situs |
| 23 | 2026-09-01 | gas/Code.gs | Fitur — Kolom `image` di products + sheet `testimonials` + endpoint save/delete testimoni |
| 24 | 2026-09-01 | js/api.js | Fitur — Tambah fungsi `saveTestimonial`, `deleteTestimonial` |
| 25 | 2026-09-01 | js/viewer.js | Fitur — Thumbnail produk (URL, fallback mockup DOM), grid/list toggle, render testimoni, ikon kompatibilitas di baris |
| 26 | 2026-09-01 | js/viewer.js | Fix — Hapus handler `#ownBtn` (block pemilik toko dihapus), tambah handler `#viewToggle` |
| 27 | 2026-09-01 | css/viewer.css | Fitur — Thumbnail (.pthumb/.thumb-mock), grid layout, testimonial grid, FAQ accordion, view-toggle; hapus .own-btn |
| 28 | 2026-09-01 | index.html | Fitur — Section testimoni + FAQ, toggle grid/list, hapus block "Untuk pemilik toko" & title phantom logo |
| 29 | 2026-09-01 | js/editor.js | Fitur — Field `image` produk + tab kelola testimoni (CRUD modal) |
| 30 | 2026-09-01 | css/viewer.css | Fix — Grid thumbnail aspect-ratio 16/10 + absolute overlay mockup (perbaiki kolaps/aneh); reset hover color grid agar teks terbaca |
| 31 | 2026-09-01 | gas/Code.gs | Fitur — Kolom `featured` (boolean) di products + normalisasi parse |
| 32 | 2026-09-01 | js/editor.js | Fitur — Checkbox "Unggulan/Best seller" di form produk + badge ★ di daftar |
| 33 | 2026-09-01 | index.html | Refactor — Katalog kembali list teks-only; hanya tampil produk `featured`; CTA "Lihat semua produk" → products.html |
| 34 | 2026-09-01 | js/viewer.js | Refactor — renderRows hanya produk featured (list teks-only); hapus grid list/filter search/devIcons/productThumb/viewToggle |
| 35 | 2026-09-01 | css/viewer.css | Refactor — Revert `.prow` ke teks-only (70px num + 1fr + auto); hapus thumb/grid/view-toggle |
| 36 | 2026-09-01 | products.html | Baru — Halaman katalog marketplace (header+sidebar kategori+grid+toolbar search/sort+detail overlay) |
| 37 | 2026-09-01 | css/products.css | Baru — Style marketplace (.mk-layout, .mk-side, .pcard grid, toolbar sort, responsive) |
| 38 | 2026-09-01 | js/products.js | Baru — Logic marketplace mandiri: grid kartu, filter kategori, sort, search, detail overlay (reuse mockup/device, duplikasi dipisah) |
| 39 | 2026-09-01 | products.html | Polish — Tambah toggle view grid/list di toolbar katalog |
| 40 | 2026-09-01 | css/products.css | Polish — Style view toggle + list mode card (thumbnail kiri + teks) |
| 41 | 2026-09-01 | js/products.js | Polish — Toggle grid/list + lazy-render thumbnail mockup via IntersectionObserver (mengurangi jeda scroll/kosong) |
