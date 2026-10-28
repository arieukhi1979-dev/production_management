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

## Supabase: shared cloud storage across computers

This build can store the portal's business data in a shared Supabase database. When Supabase is configured, the app loads the shared record on startup and saves changes automatically. Without configuration, it continues using browser `localStorage`.

### 1. Create a Supabase project
1. Create a project at https://supabase.com/.
2. Open **SQL Editor** and run the contents of `supabase/schema.sql`.
3. Open **Project Settings → API** and copy the Project URL and the publishable/anon key.

### 2. Configure the app
1. Copy `.env.example` to `.env` in the project root.
2. Fill in `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` with your project values.
3. Run:
   ```bash
   npm install
   npm run dev
   ```
4. Open the Vite URL. Use the same deployed app and Supabase project on all computers to share the data.
5. For deployment, set the same two `VITE_` variables in the hosting provider's environment settings and rebuild the app.

### Important security note
The provided SQL is configured for no-login shared access to support easy internal testing. Anyone who can access the app and its public key can read, change, or delete shared business data through the database API. Do not use this policy for confidential or production-critical information on a public internet site. For production, use Supabase Auth, per-user/role access policies, backups, and restrict writes to authorized staff. Never put a Supabase `service_role` key in a browser app.

### Data model
The starter integration stores the portal's business data in one JSONB row (`id = 'shared'`) in `production_portal_state`. This keeps existing modules compatible. If multiple users edit the same records simultaneously, the latest full-state save may overwrite another user's recent changes; for high-concurrency use, move to separate tables per module with row-level updates.
