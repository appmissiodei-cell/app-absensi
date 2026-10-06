# Panduan Deploy — Absensi Komunitas MD

Panduan ini berisi semua langkah dari nol sampai aplikasi online dan aman dipakai.
Kerjakan **berurutan**. Estimasi waktu: 45–60 menit.

> Dokumen ini tidak berisi password atau kunci apa pun. Semua rahasia kamu isi sendiri
> (lihat bagian "Rahasia yang dipakai").

---

## 0. Ringkasan urutan

1. Siapkan akun & alat (Supabase, GitHub, Vercel, Node.js)
2. Supabase: buat project → jalankan SQL → atur Authentication
3. Buat akun superadmin pertama (dari komputer lokal)
4. Taruh kode di GitHub (**Private**)
5. Vercel: import repo → isi Environment Variables → Deploy
6. Tes semua fitur (checklist)
7. Tes hak akses akun admin biasa (RLS)
8. Rapikan setelah live (ganti password, backup, hapus data sensitif)

---

## 1. Persiapan

| Kebutuhan | Keterangan |
|---|---|
| Akun Supabase | supabase.com (gratis cukup untuk komunitas ini) |
| Akun GitHub | untuk menyimpan kode; repository harus **Private** |
| Akun Vercel | vercel.com, login pakai GitHub |
| Node.js 18 atau lebih baru | nodejs.org (hanya perlu untuk membuat akun superadmin pertama) |

Ekstrak `absensi-md.zip`, lalu buka terminal di dalam folder `absensi-md`:

```bash
npm install
```

---

## 2. Supabase

### 2.1 Buat project
1. Supabase Dashboard → **New project**. Pilih region terdekat (mis. Singapore).
2. Simpan **Database password** di tempat aman (password manager).
3. Tunggu project selesai dibuat.

### 2.2 Ambil kunci API
Dashboard → **Project Settings → API**. Catat tiga nilai ini:

- **Project URL** (`https://xxxx.supabase.co`)
- **anon public key**
- **service_role key** ← **sangat rahasia**, bisa melewati semua pengaman data

### 2.3 Jalankan SQL (urutan penting)
Dashboard → **SQL Editor → New query**. Tempel isi file, lalu **Run**, satu per satu, berurutan:

1. `supabase/migrations/0001_init.sql` — membuat tabel
2. `supabase/migrations/0002_rls.sql` — mengaktifkan pengaman akses per role
3. `supabase/seed.sql` — mengisi data anggota asli + 1 kegiatan contoh

⚠️ `seed.sql` diawali perintah `delete` yang **mengosongkan** tabel anggota, cell group, kegiatan, dan
absensi. Jalankan **hanya sekali di awal**. Jangan pernah dijalankan ulang setelah aplikasi dipakai —
semua absensi akan hilang.

Cek hasilnya di **Table Editor**: tabel `members` harus berisi 88 baris, `cell_groups` 6 baris, `events` 1 baris.

### 2.4 Atur Authentication
Dashboard → **Authentication**:

1. **Sign In / Providers → Email**: pastikan Email aktif. Matikan **"Allow new users to sign up"**
   (supaya orang luar tidak bisa mendaftar sendiri; akun hanya dibuat oleh superadmin).
2. Konfirmasi email tidak perlu diatur — akun dibuat oleh sistem dengan email sudah terverifikasi.
3. **URL Configuration → Site URL**: isi dengan alamat Vercel kamu setelah langkah 5 selesai
   (mis. `https://nama-project.vercel.app`).

---

## 3. Buat akun superadmin pertama

Dilakukan **sekali** dari komputer lokal (bukan dari Vercel). Ganti nilai di bawah dengan milikmu:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co \
SUPABASE_SERVICE_ROLE_KEY=isi-service-role-key \
SEED_SUPERADMIN_EMAIL=email-kamu@contoh.com \
SEED_SUPERADMIN_PASSWORD='password-kuat-kamu' \
SEED_SUPERADMIN_NAMA='Nama Kamu' \
npm run seed:users
```

Di Windows PowerShell, setel variabel satu per satu dulu, mis. `$env:SEED_SUPERADMIN_EMAIL="..."`, lalu `npm run seed:users`.

Hasil yang benar: tercetak `Akun auth dibuat: ...` lalu `Selesai. Login di aplikasi dengan email ...`.
Aman dijalankan ulang (akan mengatur ulang password akun yang sama).

**Gunakan password yang kuat** (minimal 12 karakter, campuran huruf, angka, simbol). Password pendek seperti
`@Admin123` mudah ditebak; kalau sudah terlanjur dipakai, ganti lewat menu **Akun Saya** setelah login.

---

## 4. GitHub

1. Buat repository baru → **Private**.
2. Di folder `absensi-md`:
   ```bash
   git init
   git add .
   git commit -m "Absensi Komunitas MD"
   git branch -M main
   git remote add origin https://github.com/USERNAME/NAMA-REPO.git
   git push -u origin main
   ```
3. Cek di GitHub bahwa **tidak ada** file `.env.local` dan `supabase/seed.sql` di repository.
   File `.gitignore` sudah mengecualikan keduanya. `seed.sql` berisi data pribadi anggota (nama,
   no. HP, email, tanggal lahir) — jangan sampai masuk repository, apalagi yang public.

Kalau `seed.sql` terlanjur ter-commit: hapus dari repo **dan** dari riwayat git (atau buat repo baru),
karena file yang pernah ter-commit tetap bisa dibuka lewat riwayat.

---

## 5. Vercel

1. Vercel → **Add New → Project** → pilih repository tadi → **Import**.
2. Framework otomatis terdeteksi sebagai **Next.js**. Jangan ubah build command.
3. Buka **Environment Variables**, tambahkan tiga variabel (centang Production, Preview, Development):

   | Nama | Isi |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | Project URL dari 2.2 |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon public key dari 2.2 |
   | `SUPABASE_SERVICE_ROLE_KEY` | service_role key dari 2.2 (**tanpa** awalan `NEXT_PUBLIC_`) |

   `SUPABASE_SERVICE_ROLE_KEY` dipakai menu **Kelola User** (tambah user, buat password baru).
   Tanpa ini, menu tersebut error.
4. Klik **Deploy**. Tunggu sampai berstatus **Ready**, lalu buka alamatnya.
5. Kembali ke Supabase 2.4 langkah 3 dan isi **Site URL** dengan alamat Vercel.

Setiap kali kamu `git push`, Vercel otomatis deploy ulang.

---

## 6. Checklist tes setelah deploy

Login dengan akun superadmin lalu cek satu per satu. Kalau ada yang gagal, catat pesan errornya.

**Login & akun**
- [ ] Login berhasil, halaman Ringkasan terbuka
- [ ] Akun Saya: nama, email, dan role tampil; tombol Keluar berfungsi
- [ ] Akun Saya → Buat Password Baru: password baru tampil, bisa disalin, login ulang dengan password itu berhasil

**Anggota**
- [ ] Daftar menampilkan 88 anggota; pencarian & filter pelayanan/status berfungsi
- [ ] Buka detail anggota: NIK, No. HP, email, tanggal lahir tampil
- [ ] Tambah anggota baru (dengan NIK) → muncul di daftar. NIK yang sama dua kali ditolak
- [ ] Edit anggota → simpan → data berubah
- [ ] Hapus anggota uji (yang baru dibuat tadi) → berhasil

**Kegiatan & absensi**
- [ ] Kegiatan "Iman yang Anti Mood Swing" (9 Okt 2026) muncul di daftar dan kalender
- [ ] Tambah kegiatan Cell Group → buka → centang beberapa anggota → Simpan Absensi
- [ ] Setelah tanggalnya lewat / pada kegiatan yang sudah selesai: tampil Hadir / Tidak Hadir; menu ⋮ → Edit Detail Kehadiran berfungsi
- [ ] Isi PIC di kegiatan Worship Night → kartu PIC menampilkan jumlah terisi
- [ ] Persen CG/WN di halaman Anggota dan Cell Group ikut berubah
- [ ] Anggota yang tercatat hadir tidak bisa dihapus; setelah diubah jadi Tidak Hadir baru bisa

**Cell Group**
- [ ] Detail cell group menampilkan anggota dan riwayat pertemuan
- [ ] Isi koordinator lewat Edit Cell Group
- [ ] Tambah / hapus cell group uji

**Laporan**
- [ ] Dari halaman Kegiatan dan Anggota, ikon unduh → Preview Laporan → Unduh Excel dan Unduh PDF terbuka dengan benar

**Kelola User**
- [ ] Tambah user baru (role Admin) → password tampil sekali
- [ ] Buat password baru untuk user itu; Nonaktifkan lalu Aktifkan akunnya

---

## 7. Tes hak akses akun admin biasa (RLS)

Tujuannya memastikan pengaman ada di database, bukan hanya tombol yang disembunyikan.

1. Dari Kelola User, buat satu akun **Admin** uji, lalu login dengan akun itu (pakai jendela incognito).
2. Lewat tampilan: tombol **Hapus** (anggota, kegiatan, cell group) dan menu **Kelola User** tidak muncul.
3. Tes langsung ke database (menunjukkan pengaman bekerja walau UI dilewati). Di browser
   incognito yang sedang login sebagai admin, buka DevTools → Console, lalu jalankan
   (ganti `UUID-ANGGOTA` dengan id anggota uji, dan isi URL/key milikmu):

   ```js
   // Ambil token sesi: Application → Local Storage / Cookies → nilai access_token
   const URL = 'https://xxxx.supabase.co', KEY = 'ANON_KEY', TOKEN = 'ACCESS_TOKEN_ADMIN';
   const h = { apikey: KEY, Authorization: 'Bearer ' + TOKEN };
   // a) hapus anggota → harus ditolak / tidak ada baris terhapus
   await fetch(`${URL}/rest/v1/members?id=eq.UUID-ANGGOTA`, { method: 'DELETE', headers: { ...h, Prefer: 'return=representation' } }).then(r => r.json());
   // b) lihat semua profil → hanya 1 baris (miliknya sendiri)
   await fetch(`${URL}/rest/v1/profiles?select=*`, { headers: h }).then(r => r.json());
   ```
   Hasil yang benar: (a) `[]` atau error izin, anggota tetap ada di Table Editor; (b) hanya 1 baris.
4. Nonaktifkan akun admin uji → login ulang harus ditolak.

Kalau salah satu hasilnya tidak sesuai, **jangan dipakai dulu** dan kabari untuk diperbaiki.

---

## 8. Rapikan setelah live

**Keamanan**
- [ ] Ganti password superadmin yang lemah lewat **Akun Saya**.
- [ ] Hapus chat yang berisi data anggota & kredensial (sesuai rencanamu). Jika `service_role key`
      pernah tertempel di chat, atau di tempat yang bukan Vercel/komputer pribadimu, buat yang baru:
      Supabase → Project Settings → API → *Reset* lalu perbarui di Vercel dan redeploy.
- [ ] Pastikan repository GitHub tetap **Private**; aktifkan 2FA di GitHub, Vercel, dan Supabase.
- [ ] Hapus file `seed.sql` dari komputer/Drive yang dibagikan ke orang lain setelah data masuk.

**Data**
- [ ] Isi koordinator tiap cell group (Cell Group → Edit).
- [ ] Lengkapi tanggal lahir 22 anggota aktif yang masih kosong, serta NIK, No. HP, dan email yang belum ada.
- [ ] Nama yang mungkin orang yang sama (Ivana Ayudya Suranggara / Hana Ivana, Stevanus Ricky Adrian / Steve / Ricky,
      Alabbi) dibiarkan terpisah karena tidak ada data pendukung; gabung/hapus manual bila terbukti sama
      (hapus hanya bisa untuk anggota yang tidak tercatat hadir).

**Operasional**
- [ ] **Backup**: paket gratis Supabase tidak menyediakan backup harian otomatis. Ekspor berkala dari
      Table Editor (tombol Export CSV) atau upgrade paket bila data sudah penting.
- [ ] **Project gratis Supabase di-pause jika 7 hari tanpa aktivitas.** Selama dipakai rutin tiap minggu aman;
      kalau ter-pause, buka dashboard lalu klik **Restore**.
- [ ] Domain sendiri (opsional): Vercel → Settings → Domains.
- [ ] Zona waktu: seluruh tanggal "hari ini", "bulan ini", dan status kegiatan selesai/belum memakai jam Jakarta (WIB).

---

## Rahasia yang dipakai (jangan dibagikan)

| Rahasia | Disimpan di | Boleh di GitHub? |
|---|---|---|
| Database password | password manager | Tidak |
| `service_role key` | Vercel env var + terminal lokal saat membuat superadmin | **Tidak** |
| `anon public key` + Project URL | Vercel env var | Tidak perlu (tapi bukan rahasia berat) |
| Password akun login | pemilik akun | Tidak |
| `seed.sql` (data anggota) | komputer lokal | **Tidak** |

---

## Masalah umum

| Gejala | Penyebab & solusi |
|---|---|
| Login berhasil lalu kembali ke halaman login | Akun belum punya baris `profiles` atau nonaktif. Jalankan ulang `npm run seed:users` untuk superadmin. |
| Halaman terbuka tapi daftar kosong | Pengaman akses menolak karena profil belum ada/nonaktif, atau `seed.sql` belum dijalankan. |
| Kelola User → error saat tambah user / buat password | `SUPABASE_SERVICE_ROLE_KEY` belum diisi di Vercel, atau salah. Isi lalu **Redeploy**. |
| Build gagal di Vercel | Buka Deployments → klik deploy yang gagal → baca log; pastikan 3 environment variable terisi. |
| "NIK sudah dipakai" | Memang disengaja: NIK harus unik. |
| Tidak bisa hapus anggota | Anggota masih tercatat hadir di suatu kegiatan. Ubah dulu jadi Tidak Hadir di absensi kegiatan itu, atau ubah statusnya jadi Tidak Aktif. |
| Perubahan kode tidak muncul | Pastikan sudah `git push` ke branch `main` dan deploy di Vercel berstatus Ready. |
