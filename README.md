# Absensi Komunitas MD

Next.js (App Router) + Supabase + Vercel. Dibangun dari spesifikasi
`02-build-supabase-vercel.pdf` + mockup `absensi-app.html` (versi
terakhir: tabel dengan sort per kolom, agenda kalender per bulan,
label filter "Semua Kegiatan"/"Semua Pelayanan").

## Halaman yang sudah jalan (bukan stub lagi)

- **Ringkasan** (`app/(app)/page.tsx`) — kartu statistik, grafik
  kehadiran Cell Group & Worship Night (Recharts, `components/charts/AttendanceBarChart.tsx`),
  kegiatan mendatang, PIC Worship Night belum lengkap, ulang tahun
  bulan ini, menu Kelola User (khusus superadmin).
- **Kegiatan** (`app/(app)/kegiatan/page.tsx`) — tabel dengan kolom
  bisa diklik untuk sort (Tanggal/Jenis/Keterangan/Status via
  `?sort=&dir=`), filter jenis ("Semua Kegiatan" + 5 jenis) & rentang
  tanggal, badge PIC untuk Worship Night.
- **Anggota** (`app/(app)/anggota/page.tsx`) — tabel sortable
  (Nama/Cell Group/%CG/%WN), filter pelayanan ("Semua Pelayanan"),
  status, rentang tanggal. %CG dan %WN dihitung dari
  `attendance` + `events` (join), bukan data statis.
- **Cell Group** (`app/(app)/cell-group/page.tsx`) — tabel sortable
  (Nama/Anggota/Koordinator/%CG/%WN) + baris "Belum Masuk CG".
- **Kalender** (`app/(app)/kalender/page.tsx`) — grid bulanan, klik
  tanggal untuk detail hari itu, navigasi ‹ › lewat `?month=`, dan
  **agenda ikut bulan yang sedang dibuka** (bukan 30 hari bergulir).

Semua sort & navigasi di atas pakai `<Link>` yang mengubah query
params — halaman tetap Server Component penuh (data difetch & di-
sort di server), tidak perlu JS di client untuk sort/filter/kalender.
Satu-satunya Client Component di balik ini adalah `FilterBar.tsx`
(search box + dropdown, supaya ngetik tidak langsung navigasi per
huruf).

**Catatan performa**: %CG/%WN dihitung dengan fetch semua baris
`attendance` lalu digabung di JS (bukan query agregat di DB). Ini
cukup untuk ukuran komunitas (puluhan–ratusan anggota, puluhan–ratusan
baris kehadiran); kalau datanya sudah jauh lebih besar, pindahkan
agregasi ini ke view/RPC Postgres.

## Yang masih dari fondasi sebelumnya

- **Skema DB**: `supabase/migrations/0001_init.sql`
- **RLS** (ditegakkan di DB, bukan cuma UI): `supabase/migrations/0002_rls.sql`
- **Seed data real** (cell_groups, members — 88 anggota Komunitas MD dari
  "Absensi Ceria Missio Dei", termasuk NIK/No. HP/Email): `supabase/seed.sql`
  - Menghapus data dummy lama (blok `delete` di awal file) — jalankan hanya
    sekali di awal. Berisi 1 kegiatan contoh (Worship Night 9 Okt 2026);
    absensi belum ada.
  - Tanggal lahir/anniversary yang belum ada = kosong. Koordinator CG
    belum diisi.
- **Seed superadmin pertama**: `scripts/seed-users.ts` — jalankan manual sekali dari lokal
  (email/password lewat env var). Akun lain dikelola dari menu Kelola User.
- **Layout shell**: sidebar kiri di ≥1024px, bottom nav 5 tab di
  <1024px (`app/(app)/layout.tsx`, `components/nav/`).
- **Auth guard**: `middleware.ts` (redirect ke `/login`) + guard kedua
  di `app/(app)/layout.tsx` yang juga cek `profiles.active`.
- **Helper logic**: `lib/attendance.ts` (`computePct`, `resolveRange`,
  `attendanceKind`, `pctColor`), `lib/constants.ts`
  (`PELAYANAN_LIST`, `WN_ROLE_DEFS`, `JENIS_KEGIATAN_TYPES`),
  `lib/permissions.ts`.
- **Komponen bersama baru**: `components/ui/SortTh.tsx` (header
  kolom tabel yang bisa diklik untuk sort), `components/ui/PageHeader.tsx`,
  `components/filter/FilterBar.tsx`.

Proyek ini sudah lolos `npx tsc --noEmit` dan `npx next build` tanpa
error (dengan URL/key Supabase dummy — build tidak butuh koneksi DB
asli, hanya runtime-nya yang butuh).

## Deploy

Ikuti **[PANDUAN-DEPLOY.md](PANDUAN-DEPLOY.md)** (langkah lengkap Supabase → GitHub → Vercel + checklist tes).

## Setup (lokal)

```bash
npm install
cp .env.local.example .env.local   # isi dari Supabase Dashboard

# jalankan migration 0001, 0002 (lewat Supabase CLI atau paste manual ke SQL editor)
npx supabase db push
# atau: paste isi 0001_init.sql lalu 0002_rls.sql ke SQL Editor Supabase

# seed data biasa
# paste isi supabase/seed.sql ke SQL Editor Supabase (setelah migration jalan)

# buat 1 akun superadmin (sekali, manual, dari lokal — bukan di Vercel)
NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
SEED_SUPERADMIN_EMAIL=... SEED_SUPERADMIN_PASSWORD=... SEED_SUPERADMIN_NAMA=... npm run seed:users

# generate types asli dari DB (ganti placeholder di types/database.types.ts —
# placeholder saat ini belum punya metadata relasi FK, jadi nested select
# seperti `.select('*, cell_groups(nama)')` di-cast manual lewat `unknown`
# sampai types asli ini di-generate)
npx supabase gen types typescript --project-id <ref> > types/database.types.ts

npm run dev
```

## Sudah lengkap (semua halaman di mockup)

Kegiatan (tambah/edit/detail + absensi + PIC Worship Night), Anggota
(detail, tambah/edit, hapus), Cell Group (detail, tambah/edit/hapus),
Laporan (preview + unduh Excel/PDF), Akun Saya, dan Kelola User
(tambah user, buat password baru, aktif/nonaktif).

Catatan perilaku:
- Membuat kegiatan otomatis menyiapkan baris absensi (hadir = false) untuk anggota
  **Aktif** (Cell Group: hanya yang punya CG), supaya %CG/%WN punya penyebut yang benar.
- Anggota yang masih tercatat hadir di suatu kegiatan tidak bisa dihapus.
- Kelola User memakai `SUPABASE_SERVICE_ROLE_KEY` (server only) — isi juga di
  Environment Variables Vercel. Password tidak bisa dilihat ulang; hanya tampil
  sekali setelah dibuat.

## Belum dikerjakan

1. Testing RLS manual (lihat catatan di akhir `0002_rls.sql`) — coba
   panggil REST API langsung sebagai admin, pastikan delete & akses
   `profiles` orang lain ditolak.
2. Deploy ke Vercel, hubungkan environment variables Supabase.
