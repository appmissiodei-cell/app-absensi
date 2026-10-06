'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { JENIS_KEGIATAN_TYPES, WN_ROLE_DEFS } from '@/lib/constants';
import { getContext, str, orNull, toastUrl, type ActionResult } from '@/lib/server-helpers';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^\d{2}:\d{2}$/;

/** Tambah (tanpa id) atau ubah (dengan id) kegiatan. */
export async function saveEvent(formData: FormData): Promise<ActionResult> {
  const { sb, user, isStaff } = await getContext();
  if (!user) return { error: 'Sesi habis, silakan login ulang.' };
  if (!isStaff) return { error: 'Akun Anda tidak punya izin menyimpan data.' };

  const id = str(formData.get('id'));
  const jenis = str(formData.get('jenis'));
  const tanggal = str(formData.get('tanggal'));
  const jam = str(formData.get('jam')) || '18:30';
  const keterangan = orNull(str(formData.get('keterangan')));
  if (!(JENIS_KEGIATAN_TYPES as readonly string[]).includes(jenis)) return { error: 'Jenis kegiatan tidak valid.' };
  if (!DATE_RE.test(tanggal)) return { error: 'Tanggal wajib diisi.' };
  if (!TIME_RE.test(jam)) return { error: 'Format jam tidak valid.' };

  let pic: Record<string, string> | null = null;
  let kolekte: number | null = null;
  if (jenis === 'Worship Night') {
    pic = {};
    for (const r of WN_ROLE_DEFS) pic[r.key] = str(formData.get(`pic_${r.key}`));
    const digits = str(formData.get('kolekte')).replace(/\D/g, '');
    kolekte = digits ? Number(digits) : null;
  }

  const payload = { jenis, tanggal, jam, keterangan, kolekte, pic };

  if (id) {
    const { error } = await sb.from('events').update(payload).eq('id', id);
    if (error) return { error: `Gagal menyimpan: ${error.message}` };
    revalidatePath('/kegiatan');
    revalidatePath(`/kegiatan/${id}`);
    redirect(toastUrl(`/kegiatan/${id}`, 'Perubahan tersimpan'));
  }

  const { data: created, error } = await sb.from('events').insert(payload).select('id').single();
  if (error || !created) return { error: `Gagal menyimpan: ${error?.message ?? 'tidak diketahui'}` };

  // Siapkan baris absensi (hadir = false) untuk anggota aktif yang relevan,
  // supaya perhitungan %CG / %WN punya penyebut yang benar.
  let q = sb.from('members').select('id').eq('status', 'Aktif');
  if (jenis === 'Cell Group') q = q.not('cell_group_id', 'is', null);
  const { data: members } = await q;
  if (members && members.length) {
    await sb.from('attendance').insert(members.map((m: { id: string }) => ({ event_id: created.id, member_id: m.id, hadir: false })));
  }

  revalidatePath('/kegiatan');
  redirect(toastUrl('/kegiatan', 'Kegiatan tersimpan'));
}

/** Hapus kegiatan — khusus superadmin. Absensinya ikut terhapus (cascade). */
export async function deleteEvent(id: string): Promise<ActionResult> {
  const { sb, user, isSuper } = await getContext();
  if (!user) return { error: 'Sesi habis, silakan login ulang.' };
  if (!isSuper) return { error: 'Hanya superadmin yang boleh menghapus kegiatan.' };
  const { error } = await sb.from('events').delete().eq('id', id);
  if (error) return { error: `Gagal menghapus: ${error.message}` };
  revalidatePath('/kegiatan');
  redirect(toastUrl('/kegiatan', 'Kegiatan dihapus'));
}

/** Simpan absensi satu kegiatan (upsert semua baris yang dikirim). */
export async function saveAttendance(
  eventId: string,
  rows: { member_id: string; hadir: boolean }[],
  done: boolean
): Promise<ActionResult> {
  const { sb, user, isStaff } = await getContext();
  if (!user) return { error: 'Sesi habis, silakan login ulang.' };
  if (!isStaff) return { error: 'Akun Anda tidak punya izin menyimpan data.' };

  if (rows.length) {
    const { error } = await sb
      .from('attendance')
      .upsert(rows.map((r) => ({ event_id: eventId, member_id: r.member_id, hadir: r.hadir })), { onConflict: 'event_id,member_id' });
    if (error) return { error: `Gagal menyimpan absensi: ${error.message}` };
  }
  revalidatePath('/kegiatan');
  revalidatePath(`/kegiatan/${eventId}`);
  revalidatePath('/anggota');
  revalidatePath('/cell-group');
  redirect(done ? toastUrl(`/kegiatan/${eventId}`, 'Perubahan kehadiran tersimpan') : toastUrl('/kegiatan', 'Absensi tersimpan'));
}
