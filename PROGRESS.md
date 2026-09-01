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
