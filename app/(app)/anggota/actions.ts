'use server';

import { randomBytes } from 'crypto';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { getContext } from '@/lib/server-helpers';
import { createClient } from '@/lib/supabase/server';
import { PELAYANAN_LIST, MAX_PELAYANAN_PER_MEMBER } from '@/lib/constants';
import { isSuperadmin, type Profile } from '@/lib/permissions';

export type SaveMemberResult = { error: string } | undefined;

const str = (v: FormDataEntryValue | null) => (typeof v === 'string' ? v.trim() : '');
const orNull = (v: string) => (v === '' ? null : v);
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Tambah (tanpa `id`) atau ubah (dengan `id`) data anggota. */
export async function saveMember(formData: FormData): Promise<SaveMemberResult> {
  const id = str(formData.get('id'));
  const namaLengkap = str(formData.get('nama_lengkap'));
  const namaBaptis = str(formData.get('nama_baptis'));
  const nik = orNull(str(formData.get('nik')));
  const noHp = orNull(str(formData.get('no_hp')).replace(/[\s-]/g, ''));
  const email = orNull(str(formData.get('email')));
  const cellGroupId = orNull(str(formData.get('cell_group_id')));
  const tanggalLahir = orNull(str(formData.get('tanggal_lahir')));
  const anniversary = orNull(str(formData.get('wedding_anniversary')));
  const status = str(formData.get('status'));
  const pelayanan = Array.from(
    new Set(
      formData
        .getAll('pelayanan')
        .filter((p): p is string => typeof p === 'string' && (PELAYANAN_LIST as readonly string[]).includes(p))
    )
  );

  if (!namaLengkap) return { error: 'Nama lengkap wajib diisi.' };
  if (status !== 'Aktif' && status !== 'Tidak Aktif') return { error: 'Status tidak valid.' };
  if (pelayanan.length > MAX_PELAYANAN_PER_MEMBER) {
    return { error: `Pelayanan maksimal ${MAX_PELAYANAN_PER_MEMBER}.` };
  }
  if (email && !EMAIL_RE.test(email)) return { error: 'Format email tidak valid.' };
  if (noHp && !/^\+?\d{6,16}$/.test(noHp)) return { error: 'No. HP hanya boleh angka (boleh diawali +), 6–16 digit.' };
  if ((tanggalLahir && !DATE_RE.test(tanggalLahir)) || (anniversary && !DATE_RE.test(anniversary))) {
    return { error: 'Format tanggal tidak valid.' };
  }

  const { user, isStaff } = await getContext();
  if (!user) return { error: 'Sesi habis, silakan login ulang.' };
  if (!isStaff) return { error: 'Akun Anda tidak punya izin menyimpan data.' };
  const supabase = await createClient();

  const payload = {
    nama_baptis: namaBaptis,
    nama_lengkap: namaLengkap,
    nik,
    no_hp: noHp,
    email,
    cell_group_id: cellGroupId,
    pelayanan,
    tanggal_lahir: tanggalLahir,
    wedding_anniversary: anniversary,
    status: status as 'Aktif' | 'Tidak Aktif',
  };

  // Cast: tipe database masih placeholder (lihat types/database.types.ts)
  const table = supabase.from('members') as unknown as {
    insert: (v: typeof payload) => PromiseLike<{ error: { code?: string; message: string } | null }>;
    update: (v: typeof payload) => { eq: (c: string, v: string) => PromiseLike<{ error: { code?: string; message: string } | null }> };
  };
  const { error } = id ? await table.update(payload).eq('id', id) : await table.insert(payload);

  if (error) {
    if (error.code === '23505') return { error: 'NIK sudah dipakai anggota lain.' };
    return { error: `Gagal menyimpan: ${error.message}` };
  }

  revalidatePath('/anggota');
  if (id) revalidatePath(`/anggota/${id}`);
  redirect(id ? `/anggota/${id}` : '/anggota');
}

/**
 * Hapus anggota — khusus superadmin. Anggota yang pernah tercatat HADIR di kegiatan
 * apa pun TIDAK boleh dihapus; harus diubah jadi Tidak Hadir dulu. Baris absensi
 * hadir=false ikut terhapus (cascade). Dijaga di sini (pesan jelas) dan di DB (trigger).
 */
export async function deleteMember(id: string): Promise<SaveMemberResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Sesi habis, silakan login ulang.' };

  const { data: profile } = await supabase.from('profiles').select('id, nama, role, active').eq('id', user.id).single();
  if (!isSuperadmin(profile as unknown as Profile | null)) return { error: 'Hanya superadmin yang boleh menghapus anggota.' };

  const { count, error: countErr } = await supabase
    .from('attendance')
    .select('id', { count: 'exact', head: true })
    .eq('member_id', id)
    .eq('hadir', true);
  if (countErr) return { error: `Gagal memeriksa absensi: ${countErr.message}` };
  if (count && count > 0) {
    return {
      error: `Anggota ini masih tercatat hadir di ${count} kegiatan, jadi belum bisa dihapus. Ubah dulu jadi Tidak Hadir di absensi tersebut, atau ubah statusnya jadi Tidak Aktif.`,
    };
  }

  const { error } = await supabase.from('members').delete().eq('id', id);
  if (error) {
    if (error.code === '23503') return { error: 'Anggota ini masih tercatat hadir di absensi, jadi belum bisa dihapus.' };
    return { error: `Gagal menghapus: ${error.message}` };
  }

  revalidatePath('/anggota');
  redirect('/anggota');
}

/** Ganti token QR anggota (link/QR lama langsung tidak berlaku). Boleh dilakukan admin & superadmin. */
export async function regenerateQrToken(memberId: string): Promise<SaveMemberResult> {
  const { sb: supabase, user, isStaff } = await getContext();
  if (!user) return { error: 'Sesi habis, silakan login ulang.' };
  if (!isStaff) return { error: 'Akun tidak aktif.' };
  const token = randomBytes(32).toString('hex');
  const { error } = await supabase.from('members').update({ qr_token: token }).eq('id', memberId);
  if (error) return { error: `Gagal mengganti token: ${error.message}` };
  revalidatePath('/anggota/kartu');
  revalidatePath(`/anggota/${memberId}`);
  return undefined;
}
