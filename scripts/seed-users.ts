/**
 * scripts/seed-users.ts
 *
 * Membuat 1 akun SUPERADMIN pertama (Supabase Auth + baris `profiles`).
 * Setelah bisa login, semua akun lain dikelola lewat menu "Kelola User" di aplikasi.
 *
 * Email & password diberikan lewat environment variable (tidak ditulis di file ini,
 * supaya tidak ikut tersimpan di git). Jalankan MANUAL, sekali, dari komputer lokal:
 *
 *   NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co \
 *   SUPABASE_SERVICE_ROLE_KEY=... \
 *   SEED_SUPERADMIN_EMAIL=email@contoh.com \
 *   SEED_SUPERADMIN_PASSWORD='password-anda' \
 *   SEED_SUPERADMIN_NAMA='Nama Anda' \
 *   npm run seed:users
 *
 * Aman dijalankan ulang: kalau emailnya sudah ada, password di-set ulang dan
 * profilnya dipastikan berstatus superadmin aktif.
 * Jangan taruh SUPABASE_SERVICE_ROLE_KEY di .env.local yang dibaca client.
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const EMAIL = (process.env.SEED_SUPERADMIN_EMAIL || '').trim().toLowerCase();
const PASSWORD = process.env.SEED_SUPERADMIN_PASSWORD || '';
const NAMA = (process.env.SEED_SUPERADMIN_NAMA || 'Superadmin').trim();

if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !EMAIL || !PASSWORD) {
  console.error('Set NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SEED_SUPERADMIN_EMAIL, dan SEED_SUPERADMIN_PASSWORD dulu.');
  process.exit(1);
}
if (PASSWORD.length < 6) {
  console.error('Password minimal 6 karakter (aturan Supabase).');
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function findUserIdByEmail(email: string): Promise<string | null> {
  for (let page = 1; page <= 10; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const hit = data.users.find((u) => (u.email || '').toLowerCase() === email);
    if (hit) return hit.id;
    if (data.users.length < 200) break;
  }
  return null;
}

async function main() {
  let userId: string;

  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email: EMAIL,
    password: PASSWORD,
    email_confirm: true,
  });

  if (created?.user) {
    userId = created.user.id;
    console.log(`Akun auth dibuat: ${EMAIL}`);
  } else if (/already|registered|exists/i.test(createErr?.message || '')) {
    const existing = await findUserIdByEmail(EMAIL);
    if (!existing) throw new Error('Email sudah terdaftar tapi user tidak ditemukan.');
    userId = existing;
    const { error } = await admin.auth.admin.updateUserById(userId, { password: PASSWORD, email_confirm: true, ban_duration: 'none' });
    if (error) throw error;
    console.log(`Akun sudah ada, password di-set ulang: ${EMAIL}`);
  } else {
    throw createErr ?? new Error('Gagal membuat user.');
  }

  const { error: profileErr } = await admin
    .from('profiles')
    .upsert({ id: userId, nama: NAMA, role: 'superadmin', active: true }, { onConflict: 'id' });
  if (profileErr) throw profileErr;

  console.log(`\nSelesai. Login di aplikasi dengan email ${EMAIL} (role: superadmin).`);
  console.log('Saran: ganti password lewat menu Akun Saya setelah login pertama.\n');
}

main().catch((e) => {
  console.error('Gagal:', e?.message || e);
  process.exit(1);
});
