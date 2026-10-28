# Production Portal – Machine Plan & Manufacturing Management

Aplikasi web berbasis React + TypeScript + Vite untuk perencanaan mesin dan manajemen produksi.

## Fitur yang tersedia
- Dashboard ringkasan portal
- Database mesin: tambah, edit, hapus, pencarian dan filter
- QR code aset mesin, pemindaian QR, serta cetak label aset
- Import dan export database mesin melalui CSV
- Machine Plan: periode, line, style, kebutuhan mesin per jenis
- Summary kebutuhan mesin berdasarkan periode dan ketersediaan mesin
- Setup master: jenis mesin, line, brand, dan lokasi
- Master Order
- Operation Bulletin
- BOM
- Production Plan
- Production Report
- MRP
- Penyimpanan data lokal melalui `localStorage` browser

## Menjalankan di komputer

Prasyarat: Node.js 20 atau lebih baru dan npm.

1. Ekstrak ZIP.
2. Buka terminal pada folder project.
3. Jalankan:
   ```bash
   npm install
   npm run dev
   ```
4. Buka alamat lokal yang ditampilkan Vite (umumnya `http://localhost:3000`).

## Build untuk hosting

```bash
npm install
npm run build
```

Hasil build berada di folder `dist/`. Folder ini dapat dipublikasikan ke hosting static yang mendukung aplikasi single-page (misalnya Netlify, Vercel, atau web server internal).

## Catatan data dan penggunaan bersama

Versi sumber ini menyimpan data pada browser masing-masing melalui `localStorage`. Karena itu, data tidak otomatis tersinkron antara komputer atau pengguna yang berbeda. Untuk penggunaan multi-user dengan database bersama, perlu menghubungkan aplikasi ke backend/database seperti Supabase dan mengatur hak akses serta backup.

Import database mesin saat ini menggunakan CSV. Gunakan menu template CSV dari modul Machine Plan agar nama kolom sesuai.
