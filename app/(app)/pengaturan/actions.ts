'use server';

import { randomBytes } from 'crypto';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { getContext, str } from '@/lib/server-helpers';

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
const genPassword = (len = 12) =>
  Array.from(randomBytes(len)).map((b) => CHARS[b % CHARS.length]).join('');
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type PasswordResult = { error: string } | { password: string; id?: string; email?: string };

/** Tambah user baru (superadmin). Password dibuat otomatis dan hanya ditampilkan sekali. */
export async function createUser(formData: FormData): Promise<PasswordResult> {
  const { user, isSuper } = await getContext();
  if (!user) return { error: 'Sesi habis, silakan login ulang.' };
  if (!isSuper) return { error: 'Hanya superadmin yang boleh menambah user.' };

  const nama = str(formData.get('nama'));
  const email = str(formData.get('email')).toLowerCase();
  const role = str(formData.get('role'));
  if (!nama) return { error: 'Nama wajib diisi.' };
  if (!EMAIL_RE.test(email)) return { error: 'Format email tidak valid.' };
  if (role !== 'admin' && role !== 'superadmin') return { error: 'Role tidak valid.' };

  const admin = createAdminClient();
  const password = genPassword();
  const { data: created, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  if (error || !created.user) {
    return { error: /already|registered|exists/i.test(error?.message || '') ? 'Email sudah terdaftar.' : `Gagal membuat user: ${error?.message}` };
  }
  const { error: pErr } = await (admin as unknown as { from: (t: string) => { insert: (v: object) => PromiseLike<{ error: { message: string } | null }> } })
    .from('profiles').insert({ id: created.user.id, nama, role, active: true });
  if (pErr) {
    await admin.auth.admin.deleteUser(created.user.id);
    return { error: `Gagal membuat profil: ${pErr.message}` };
  }
  revalidatePath('/pengaturan/users');
  return { password, id: created.user.id, email };
}

/** Reset password user lain (superadmin). */
export async function resetUserPassword(id: string): Promise<PasswordResult> {
  const { user, isSuper } = await getContext();
  if (!user) return { error: 'Sesi habis, silakan login ulang.' };
  if (!isSuper) return { error: 'Hanya superadmin yang boleh mereset password user lain.' };
  const password = genPassword();
  const { error } = await createAdminClient().auth.admin.updateUserById(id, { password });
  if (error) return { error: `Gagal membuat password baru: ${error.message}` };
  return { password };
}

/** Buat password baru untuk akun sendiri. */
export async function resetMyPassword(): Promise<PasswordResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Sesi habis, silakan login ulang.' };
  const password = genPassword();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: `Gagal membuat password baru: ${error.message}` };
  return { password };
}

/** Aktifkan / nonaktifkan akun (superadmin; tidak bisa untuk akun sendiri). */
export async function toggleUserActive(id: string): Promise<{ error: string } | undefined> {
  const { sb, user, isSuper } = await getContext();
  if (!user) return { error: 'Sesi habis, silakan login ulang.' };
  if (!isSuper) return { error: 'Hanya superadmin yang boleh mengubah status akun.' };
  if (id === user.id) return { error: 'Tidak bisa menonaktifkan akun sendiri.' };

  const { data: p } = await sb.from('profiles').select('active').eq('id', id).maybeSingle();
  if (!p) return { error: 'User tidak ditemukan.' };
  const next = !p.active;
  const { error } = await sb.from('profiles').update({ active: next }).eq('id', id);
  if (error) return { error: `Gagal mengubah status: ${error.message}` };
  // Blokir juga di level Auth supaya sesi/login baru ditolak
  await createAdminClient().auth.admin.updateUserById(id, { ban_duration: next ? 'none' : '876000h' });
  revalidatePath('/pengaturan/users');
  revalidatePath(`/pengaturan/users/${id}`);
  return undefined;
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}
