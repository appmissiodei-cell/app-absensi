'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { JENIS_KEGIATAN_TYPES, WN_ROLE_DEFS } from '@/lib/constants';
import { parseCardCode } from '@/lib/qr';
import { todayISO } from '@/lib/dates';
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
    // upsert + ignoreDuplicates: aman walau trigger database (migration 0004) sudah membuat barisnya.
    await sb
      .from('attendance')
      .upsert(members.map((m: { id: string }) => ({ event_id: created.id, member_id: m.id, hadir: false })), { onConflict: 'event_id,member_id', ignoreDuplicates: true });
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
    // Dua kelompok terpisah: yang diubah jadi TIDAK hadir juga menghapus jam scan lamanya
    // (checked_in_at), supaya tidak ada data "hadir pukul ..." untuk orang yang tidak hadir.
    const hadirRows = rows.filter((r) => r.hadir).map((r) => ({ event_id: eventId, member_id: r.member_id, hadir: true }));
    const tidakRows = rows.filter((r) => !r.hadir).map((r) => ({ event_id: eventId, member_id: r.member_id, hadir: false, checked_in_at: null }));
    for (const batch of [hadirRows, tidakRows]) {
      if (!batch.length) continue;
      const { error } = await sb.from('attendance').upsert(batch, { onConflict: 'event_id,member_id' });
      if (error) return { error: `Gagal menyimpan absensi: ${error.message}` };
    }
  }
  revalidatePath('/kegiatan');
  revalidatePath(`/kegiatan/${eventId}`);
  revalidatePath('/anggota');
  revalidatePath('/cell-group');
  redirect(done ? toastUrl(`/kegiatan/${eventId}`, 'Perubahan kehadiran tersimpan') : toastUrl('/kegiatan', 'Absensi tersimpan'));
}

export type ScanResult =
  | { status: 'ok' | 'dup'; id: string; nama: string; cg: string | null; at: string | null }
  | { status: 'warn'; id: string; nama: string; cg: string | null; reason: string }
  | { status: 'invalid' | 'closed' | 'error'; message: string };

/** "19:30" di zona Asia/Jakarta, atau null kalau tidak ada waktunya (dicatat manual). */
function clockJakarta(iso: string | null | undefined): string | null {
  if (!iso) return null;
  return new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(iso));
}

/** Catat hadir lewat scan kartu QR. `force` = petugas sudah konfirmasi peringatan (anggota Tidak Aktif / tanpa CG). */
export async function scanCheckIn(eventId: string, payload: string, force = false): Promise<ScanResult> {
  const { sb, user, isStaff } = await getContext();
  if (!user) return { status: 'error', message: 'Sesi habis, silakan login ulang.' };
  if (!isStaff) return { status: 'error', message: 'Akun Anda tidak punya izin mencatat absensi.' };

  const token = parseCardCode(payload);
  if (!token) return { status: 'invalid', message: 'QR ini bukan kartu anggota Missio Dei.' };

  const { data: ev } = await sb.from('events').select('id, jenis, tanggal').eq('id', eventId).maybeSingle();
  if (!ev) return { status: 'error', message: 'Kegiatan tidak ditemukan.' };
  if (ev.tanggal < todayISO()) return { status: 'closed', message: 'Kegiatan sudah lewat. Ubah kehadiran lewat Edit Detail Kehadiran.' };

  const { data: m } = await sb
    .from('members')
    .select('id, nama_baptis, nama_lengkap, status, cell_group_id, cell_groups!members_cell_group_id_fkey(nama)')
    .eq('qr_token', token)
    .maybeSingle();
  if (!m) return { status: 'invalid', message: 'Kartu tidak dikenali (mungkin tokennya sudah diganti).' };

  const nama = `${m.nama_baptis} ${m.nama_lengkap}`.trim();
  const cgRel = m.cell_groups as { nama: string } | { nama: string }[] | null;
  const cg = (Array.isArray(cgRel) ? cgRel[0]?.nama : cgRel?.nama) ?? null;

  const { data: existing } = await sb.from('attendance').select('hadir, checked_in_at').eq('event_id', eventId).eq('member_id', m.id).maybeSingle();
  if (existing?.hadir) return { status: 'dup', id: m.id, nama, cg, at: clockJakarta(existing.checked_in_at) };

  if (!force) {
    if (m.status !== 'Aktif') return { status: 'warn', id: m.id, nama, cg, reason: 'Anggota ini berstatus Tidak Aktif.' };
    if (ev.jenis === 'Cell Group' && !m.cell_group_id) return { status: 'warn', id: m.id, nama, cg, reason: 'Anggota ini belum masuk Cell Group.' };
  }

  const nowIso = new Date().toISOString();
  const { error } = await sb
    .from('attendance')
    .upsert({ event_id: eventId, member_id: m.id, hadir: true, checked_in_at: nowIso }, { onConflict: 'event_id,member_id' });
  if (error) return { status: 'error', message: `Gagal mencatat: ${error.message}` };

  revalidatePath(`/kegiatan/${eventId}`);
  revalidatePath('/kegiatan');
  return { status: 'ok', id: m.id, nama, cg, at: clockJakarta(nowIso) };
}
